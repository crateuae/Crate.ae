/**
 * POST /api/leads/gate — anonymous download/print/scan capture (see LeadGateProvider).
 * Lands in rfq_requests so it shows in the unified inbox (/dashboard/rfq → "downloads"),
 * classified via a machine-readable notes prefix: "[DL:<kind>:<category>]". No schema change.
 * Mailing-list consent is written to provider_contacts only when ticked.
 */
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { cleanEmail } from '@/lib/email/normalize'
import { notifyAdmin } from '@/lib/email/notify-admin'
import { rateLimit, rejectCrossOrigin, readJsonObject, badBody, esc, validEmail } from '@/lib/security/guard'

export const runtime = 'nodejs'

const KINDS = new Set(['pdf', 'download', 'print', 'scan'])
const KIND_AR: Record<string, string> = { pdf: 'حفظ PDF', download: 'تحميل', print: 'طباعة', scan: 'فحص بالماسح' }
const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().replace(/[\[\]]/g, '').slice(0, n) : '')

export async function POST(req: NextRequest) {
  const xo = rejectCrossOrigin(req)
  if (xo) return xo
  const limited = rateLimit(req, 'gate-min', 6, 60_000) || rateLimit(req, 'gate-hour', 30, 3_600_000)
  if (limited) return limited
  const b = await readJsonObject(req, 10_000)
  if (!b) return badBody()
  if (typeof b.website === 'string' && b.website.trim()) return NextResponse.json({ ok: true }) // honeypot

  const email = validEmail(b.email) && cleanEmail(b.email)
  if (!email) return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 422 })
  const kind = KINDS.has(String(b.kind)) ? String(b.kind) : 'download'
  const title = clip(b.title, 160) || KIND_AR[kind]
  const category = clip(b.category, 120) || 'عام'
  const name = clip(b.name, 120)
  const subscribe = b.subscribe === true
  const locale = b.locale === 'en' ? 'en' : 'ar'
  const sourcePage = clip(b.source_page, 300) || null

  const db = adminClient()
  const { data: row, error } = await db.from('rfq_requests').insert({
    product_name: title,
    contact_name: name || email.split('@')[0],
    contact_email: email,
    notes: `[DL:${kind}:${category}]`,
    source_page: sourcePage,
    locale,
    status: 'new',
  }).select('id').single()
  if (error) {
    console.error('[leads/gate] insert:', error.message)
    return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 })
  }

  // Contact graph: one human = one record; consent only as ticked.
  let isNewContact = false
  try {
    const { data: existing } = await db.from('provider_contacts').select('id, consent').eq('email', email).limit(1)
    if (!existing?.length) {
      isNewContact = true
      await db.from('provider_contacts').insert({ provider_id: null, email, contact_name: name || null, source: 'download_gate', consent: subscribe, status: 'pending', confidence: 90 })
    } else if (subscribe && !existing[0].consent) {
      await db.from('provider_contacts').update({ consent: true }).eq('id', existing[0].id)
    }
  } catch (e) { console.error('[leads/gate] contact:', e) }

  // Heads-up only on first contact — repeat downloads by a known email would be noise.
  if (isNewContact) {
    notifyAdmin(`عميل محتمل جديد — ${KIND_AR[kind]}: ${category}`, [
      `<b>إيميل:</b> ${esc(email)}`,
      name ? `<b>الاسم:</b> ${esc(name)}` : '',
      `<b>العنصر:</b> ${esc(title)}`,
      `<b>التصنيف:</b> ${esc(category)}`,
      `<b>اشتراك بالقائمة:</b> ${subscribe ? 'نعم' : 'لا'}`,
      sourcePage ? `<b>صفحة:</b> https://www.crate.ae${esc(sourcePage)}` : '',
      `<b>الصندوق:</b> https://www.crate.ae/ar/dashboard/rfq`,
    ].filter(Boolean).join('<br>'))
  }

  return NextResponse.json({ ok: true, id: row.id })
}
