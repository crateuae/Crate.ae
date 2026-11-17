/**
 * POST /api/compliance/scan  { image: "data:image/jpeg;base64,..." }
 *
 * Smart scanner backend:
 *   1. Claude Vision reads the label → structured extraction (OCR only, no judging)
 *   2. The DETERMINISTIC rule engine judges compliance from the extracted data
 *      (same input → same verdict, unlike letting the AI decide pass/fail)
 * Returns { extracted, compliance } for the UI to prefill + display.
 */
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { rateLimit, rejectCrossOrigin, clientIp } from '@/lib/security/guard'
import { extractLabelFromImage, type LabelExtraction } from '@/lib/ai/vision'
import { extractLabelViaFreeOCR } from '@/lib/ai/ocr-free'
import { checkComplianceDeterministic } from '@/lib/compliance/engine'

export const maxDuration = 60

const MAX_B64 = 7_500_000 // ~5.6 MB image — reject larger to bound cost/latency

// This is a PUBLIC endpoint that calls the PAID Claude Vision API. Three layers cap the cost of abuse:
//   1. per-IP burst + hourly limit (per warm instance),
//   2. a GLOBAL hourly ceiling counted in the database (holds across instances),
//   3. strict input checks (same-site origin, size, real image bytes) before anything is sent to the AI.
const GLOBAL_HOURLY_SCANS = 300

/** The file's own first bytes must say jpeg / png / webp — the declared MIME type is not trusted. */
function imageMatches(base64: string, mediaType: string): boolean {
  let head: Buffer
  try { head = Buffer.from(base64.slice(0, 32), 'base64') } catch { return false }
  if (mediaType === 'image/jpeg') return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff
  if (mediaType === 'image/png') return head.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))
  if (mediaType === 'image/webp') return head.subarray(0, 4).toString('latin1') === 'RIFF' && head.subarray(8, 12).toString('latin1') === 'WEBP'
  return false
}

export async function POST(req: NextRequest) {
  // The scanner can run on Claude Vision (best), a FREE OCR fallback (OCR.space,
  // zero Anthropic credit), or both. Configured if either provider has a key.
  const hasClaude = !!process.env.ANTHROPIC_API_KEY && process.env.SCAN_FREE_ONLY !== '1'
  const hasFree = !!process.env.OCRSPACE_API_KEY
  if (!hasClaude && !hasFree) {
    return NextResponse.json({ error: 'scanner not configured' }, { status: 503 })
  }

  const xo = rejectCrossOrigin(req)
  if (xo) return xo
  const limited = rateLimit(req, 'scan-min', 6, 60_000) || rateLimit(req, 'scan-hour', 40, 3_600_000)
  if (limited) {
    return NextResponse.json({ error: 'too many scans — please wait a moment and try again' }, { status: 429, headers: limited.headers })
  }
  if (Number(req.headers.get('content-length') || 0) > MAX_B64 + 1000) {
    return NextResponse.json({ error: 'image too large — capture a smaller/compressed frame' }, { status: 413 })
  }

  let body: { image?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }

  const dataUrl = typeof body?.image === 'string' ? body.image : ''
  const m = dataUrl.match(/^data:(image\/(jpeg|png|webp));base64,(.+)$/)
  if (!m) return NextResponse.json({ error: 'image must be a base64 data URL (jpeg/png/webp)' }, { status: 422 })
  const mediaType = m[1]
  const base64 = m[3]
  if (base64.length > MAX_B64) return NextResponse.json({ error: 'image too large — capture a smaller/compressed frame' }, { status: 413 })
  if (!imageMatches(base64, mediaType)) return NextResponse.json({ error: 'file is not a valid jpeg/png/webp image' }, { status: 422 })

  // Global ceiling (database-backed, so it holds across serverless instances).
  try {
    const { count } = await adminClient().from('compliance_checks').select('id', { count: 'exact', head: true })
      .filter('input_data->>source', 'eq', 'smart_scan')
      .gte('created_at', new Date(Date.now() - 3_600_000).toISOString())
    if ((count ?? 0) >= GLOBAL_HOURLY_SCANS) {
      console.warn('[security] scan global hourly ceiling reached', clientIp(req))
      return NextResponse.json({ error: 'label reader is busy — please try again later', service_down: true }, { status: 503, headers: { 'Retry-After': '600' } })
    }
  } catch { /* never block scanning on the counter */ }

  // 1. OCR + extraction — Claude Vision first (best structured read), falling back
  //    to FREE OCR (OCR.space) on ANY Claude failure so a zero-credit Anthropic
  //    account still scans. SCAN_FREE_ONLY=1 skips Claude entirely (never touches
  //    credit). stage/cause distinguishes an AI/service outage from a bad image.
  let extracted: LabelExtraction | undefined
  let provider = ''
  let visErr: any = null

  if (hasClaude) {
    try { extracted = await extractLabelFromImage(base64, mediaType); provider = 'claude' }
    catch (e) { visErr = e; console.error('[scan] vision error:', e) }
  }
  if (!extracted && hasFree) {
    try { extracted = await extractLabelViaFreeOCR(base64, mediaType); provider = 'ocrspace' }
    catch (e) { console.error('[scan] free OCR error:', e); if (!visErr) visErr = e }
  }

  if (!extracted) {
    const e: any = visErr || {}
    const status = e?.status ?? e?.response?.status
    const msg = String(e?.error?.error?.message || e?.error?.message || e?.message || '')
    const isCredit = /credit|balance|billing|quota|insufficient|too low/i.test(msg)
    const cause = status === 401 ? 'ai_auth'
      : status === 403 ? 'ai_forbidden'
      : status === 429 ? 'ai_rate_limited'
      : (status === 400 && isCredit) ? 'ai_credit'
      : status === 400 ? 'ai_request'
      : (status >= 500) ? 'ai_upstream'
      : isCredit ? 'ai_credit'
      : 'ai_failed'
    // Service-down (credit/auth/upstream) vs a genuinely unreadable image — don't
    // tell a user to retake a photo when the real problem is our API key/credit.
    const serviceDown = cause !== 'ai_request'
    return NextResponse.json(
      {
        error: serviceDown
          ? 'label reader is temporarily unavailable — please try again later'
          : 'could not read the label — try a clearer, well-lit photo',
        stage: 'vision', cause, service_down: serviceDown,
      },
      { status: serviceDown ? 503 : 502 },
    )
  }

  // 2. Deterministic compliance verdict from the extracted data
  try {
    const supabase = adminClient()
    const compliance = await checkComplianceDeterministic(supabase, {
      product_class: extracted.product_class,
      product_name: extracted.product_name,
      ingredients: extracted.ingredients.join(', '),
      label_text: extracted.label_text,
      caffeine_mg_per_100ml: extracted.caffeine_mg_per_100ml ?? undefined,
      has_sulfites: extracted.has_sulfites,
    })

    // Record the scan (best-effort, non-blocking)
    supabase.from('compliance_checks').insert({
      product_name: extracted.product_name,
      product_class: extracted.product_class,
      input_data: { source: 'smart_scan', ...extracted },
      result: compliance,
      verdict: compliance.verdict,
      missing_count: compliance.missing_count,
    }).then(({ error }) => { if (error) console.error('[scan] history:', error.message) })

    return NextResponse.json({ ok: true, extracted, compliance, provider })
  } catch (e) {
    console.error('[scan] engine error:', e)
    return NextResponse.json({ error: 'scan engine error', stage: 'engine' }, { status: 500 })
  }
}
