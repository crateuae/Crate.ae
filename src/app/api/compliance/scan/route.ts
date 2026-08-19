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
import { createAdminClient } from '@/lib/supabase/server'
import { extractLabelFromImage } from '@/lib/ai/vision'
import { checkComplianceDeterministic } from '@/lib/compliance/engine'

export const maxDuration = 60

const MAX_B64 = 7_500_000 // ~5.6 MB image — reject larger to bound cost/latency

// Best-effort per-IP throttle. This is a PUBLIC endpoint that calls the PAID
// Claude Vision API, so we cap bursts to blunt abuse/cost. Module scope persists
// within a warm serverless instance (resets on cold start — acceptable for a
// free-tier tool; a determined attacker across cold instances is out of scope here).
const RATE = { windowMs: 60_000, max: 6, hourMs: 3_600_000, hourMax: 40 }
const hits = new Map<string, number[]>()
function rateLimited(ip: string): boolean {
  const now = Date.now()
  const arr = (hits.get(ip) || []).filter(t => now - t < RATE.hourMs)
  arr.push(now)
  hits.set(ip, arr)
  if (hits.size > 5000) hits.clear() // bound memory
  const lastMin = arr.filter(t => now - t < RATE.windowMs).length
  return lastMin > RATE.max || arr.length > RATE.hourMax
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'vision not configured' }, { status: 503 })
  }

  const ip = (req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()) || req.headers.get('x-real-ip') || 'unknown'
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'too many scans — please wait a moment and try again' }, { status: 429 })
  }

  let body: { image?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }

  const dataUrl = body.image ?? ''
  const m = dataUrl.match(/^data:(image\/(jpeg|png|webp));base64,(.+)$/)
  if (!m) return NextResponse.json({ error: 'image must be a base64 data URL (jpeg/png/webp)' }, { status: 422 })
  const mediaType = m[1]
  const base64 = m[3]
  if (base64.length > MAX_B64) return NextResponse.json({ error: 'image too large — capture a smaller/compressed frame' }, { status: 413 })

  // 1. Vision OCR + extraction — isolated so an AI/credit failure is distinguishable
  //    from a downstream engine/DB failure (both used to collapse into one 500).
  let extracted
  try {
    extracted = await extractLabelFromImage(base64, mediaType)
  } catch (e: any) {
    console.error('[scan] vision error:', e)
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
    return NextResponse.json(
      { error: 'could not read the label — try a clearer, well-lit photo', stage: 'vision', cause, detail: msg.slice(0, 160) },
      { status: 502 },
    )
  }

  // 2. Deterministic compliance verdict from the extracted data
  try {
    const supabase = await createAdminClient()
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

    return NextResponse.json({ ok: true, extracted, compliance })
  } catch (e) {
    console.error('[scan] engine error:', e)
    return NextResponse.json({ error: 'scan engine error', stage: 'engine' }, { status: 500 })
  }
}
