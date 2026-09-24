/**
 * POST /api/tools/portal-router
 * Lead capture for the Portal Router: stores the lead, emails the visitor the
 * deterministic checklist they just saw, notifies the admin, and folds the buyer
 * into the shared contact graph (consent exactly as ticked — TDRA).
 */
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { adminClient } from '@/lib/supabase/admin'
import { cleanEmail } from '@/lib/email/normalize'
import { notifyAdmin } from '@/lib/email/notify-admin'
import { parseAnswers, routeProduct, CATEGORIES, EMIRATES } from '@/lib/portal-router/rules'
import { portalRouterEmail } from '@/lib/portal-router/email'

export const runtime = 'nodejs'

const FROM = process.env.RESEND_FROM_EMAIL ?? 'uae@crate.ae'
const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '') || null

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 }) }

  // Honeypot: real users never fill this field.
  if (typeof body.website === 'string' && body.website.trim()) return NextResponse.json({ ok: true })

  const email = cleanEmail(body.email)
  if (!email) return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 422 })
  const answers = parseAnswers(body.answers as Record<string, unknown>)
  if (!answers) return NextResponse.json({ ok: false, error: 'invalid_answers' }, { status: 422 })
  const locale = body.locale === 'en' ? 'en' : 'ar'
  const consent = body.consent === true
  const result = routeProduct(answers)

  const db = adminClient()
  const { data: lead, error } = await db.from('tool_leads').insert({
    tool: 'portal_router',
    email,
    name: clip(body.name, 120),
    company: clip(body.company, 160),
    phone: clip(body.phone, 40),
    locale,
    answers,
    result_key: result.key,
    consent,
    source_page: clip(body.source_page, 300),
  }).select('id').single()
  if (error) {
    console.error('[portal-router] insert:', error.message)
    return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 })
  }

  // The document the visitor asked for.
  let emailSent = false
  if (process.env.RESEND_API_KEY) {
    try {
      const { subject, html } = portalRouterEmail(result, answers, locale)
      const r = await new Resend(process.env.RESEND_API_KEY).emails.send({ from: `Crate <${FROM}>`, to: [email], subject, html })
      emailSent = !r.error
      if (r.error) console.error('[portal-router] resend:', r.error)
    } catch (e) { console.error('[portal-router] send:', e) }
    if (emailSent) db.from('tool_leads').update({ email_sent: true }).eq('id', lead.id).then(() => {})
  }

  // Admin heads-up (non-blocking) — this is a lead, not just a subscriber.
  const cat = CATEGORIES.find(c => c.key === answers.category)?.label.ar
  const em = EMIRATES.find(e => e.key === answers.emirate)?.label.ar
  notifyAdmin(`عميل محتمل — موجّه البوابات: ${cat} / ${em}`, [
    `<b>إيميل:</b> ${email}`,
    body.name ? `<b>الاسم:</b> ${clip(body.name, 120)}` : '',
    body.company ? `<b>شركة:</b> ${clip(body.company, 160)}` : '',
    body.phone ? `<b>هاتف:</b> ${clip(body.phone, 40)}` : '',
    `<b>المسار:</b> ${result.key}`,
    `<b>موافقة تسويقية:</b> ${consent ? 'نعم' : 'لا'}`,
    `<b>البريد أُرسل:</b> ${emailSent ? 'نعم' : 'لا'}`,
    `<b>لوحة التحكم:</b> https://www.crate.ae/ar/dashboard/crm`,
  ].filter(Boolean).join('<br>'))

  // Unify into the contact graph (one human = one record; consent only as ticked).
  try {
    const { data: existing } = await db.from('provider_contacts').select('id, consent').eq('email', email).limit(1)
    if (!existing?.length) {
      await db.from('provider_contacts').insert({ provider_id: null, email, contact_name: clip(body.name, 120), phone: clip(body.phone, 40), source: 'tool_lead', consent, status: 'pending', confidence: 90 })
    } else if (consent && !existing[0].consent) {
      await db.from('provider_contacts').update({ consent: true }).eq('id', existing[0].id)
    }
  } catch (e) { console.error('[portal-router] contact:', e) }

  return NextResponse.json({ ok: true, id: lead.id, email_sent: emailSent })
}
