/**
 * POST /api/buyer-requests — a UAE buyer asks for supplier offers (/source, /source/<product>).
 *
 * Stored in tool_leads (tool = 'buyer_request'), matched at once against the supplier offers
 * on file, the admin is emailed the request WITH the matching offers, and the buyer gets a
 * receipt by email when they gave one. Nothing is sent to suppliers automatically: sharing a
 * supplier's offer, or a buyer's details, stays the reviewer's decision.
 */
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { adminClient } from '@/lib/supabase/admin'
import { notifyAdmin } from '@/lib/email/notify-admin'
import { OFFER_TOOL, priceLine, offerRef, labelOf, CATEGORIES, PAYMENT_TERMS } from '@/lib/supplier-offers/model'
import { parseRequest, REQUEST_TOOL, requestRef, matchOffers, DELIVERY, SERVICES, type OfferRow } from '@/lib/sourcing/model'

export const runtime = 'nodejs'

const FROM = process.env.RESEND_FROM_EMAIL ?? 'uae@crate.ae'
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 }) }
  if (typeof body.website_hp === 'string' && body.website_hp.trim()) return NextResponse.json({ ok: true, ref: 'BR-000000' })
  if (body.consent !== true) return NextResponse.json({ ok: false, error: 'consent_required', field: 'consent' }, { status: 422 })
  const parsed = parseRequest(body)
  if (!parsed.ok) return NextResponse.json({ ok: false, error: 'missing_field', field: parsed.field }, { status: 422 })
  const r = parsed.req
  const locale = body.locale === 'en' ? 'en' : 'ar'
  const db = adminClient()

  const since = new Date(Date.now() - 15 * 60_000).toISOString()
  const { data: dup } = await db.from('tool_leads').select('id').eq('tool', REQUEST_TOOL).eq('phone', r.phone).gte('created_at', since)
    .filter('answers->>product', 'eq', r.answers.product).limit(1)
  if (dup?.length) return NextResponse.json({ ok: true, ref: requestRef(dup[0].id), duplicate: true })

  const { data: row, error } = await db.from('tool_leads').insert({
    tool: REQUEST_TOOL, email: r.email ?? '', name: r.name, company: r.company, phone: r.phone, locale,
    answers: r.answers, result_key: r.answers.category, consent: true,
    source_page: typeof body.source_page === 'string' ? body.source_page.slice(0, 300) : null,
  }).select('id').single()
  if (error || !row) {
    console.error('[buyer-requests] insert:', error?.message)
    return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 })
  }
  const ref = requestRef(row.id)
  const a = r.answers

  const { data: offerRows } = await db.from('tool_leads').select('id, company, phone, email, consent, answers').eq('tool', OFFER_TOOL).limit(500)
  const matches = matchOffers(a, (offerRows ?? []) as OfferRow[]).slice(0, 12)

  await notifyAdmin(`طلب مشترٍ ${ref} — ${a.product}${a.quantity ? ` · ${a.quantity} ${a.qty_unit}` : ''} — ${matches.length} عرض مطابق`, [
    `<b>المنتج:</b> ${esc(a.product)} · ${esc(labelOf(CATEGORIES, a.category, true))}`,
    a.spec ? `<b>المواصفات:</b> ${esc(a.spec)}` : '',
    a.quantity ? `<b>الكمية:</b> ${a.quantity} ${esc(a.qty_unit)}` : '',
    a.delivery ? `<b>التسليم:</b> ${esc(labelOf(DELIVERY, a.delivery, true))}` : '',
    a.target_price ? `<b>السعر المستهدف:</b> ${a.currency} ${a.target_price}` : '',
    a.services?.length ? `<b>خدمات مطلوبة:</b> ${a.services.map(s => esc(labelOf(SERVICES, s, true))).join('، ')}` : '',
    `<b>المشتري:</b> ${esc(r.company ?? '—')}${r.name ? ` — ${esc(r.name)}` : ''} · ${esc(r.phone)}${r.email ? ` · ${esc(r.email)}` : ''}`,
    '<hr>',
    matches.length
      ? `<b>عروض مطابقة:</b><br>${matches.map(o => `• ${offerRef(o.id)} — ${esc(o.answers.product)} (${esc(o.answers.origin)}) ${o.answers.price ? esc(priceLine(o.answers)) : 'بدون سعر'}${o.answers.moq ? ` · MOQ ${o.answers.moq} ${esc(o.answers.moq_unit)}` : ''} · ${esc(o.answers._status)}${PAYMENT_TERMS.find(p => p.key === o.answers.payment_terms)?.risky ? ' · ⚠ دفع مقدم 100%' : ''}${o.consent ? '' : ' · بلا موافقة مشاركة'}`).join('<br>')}`
      : '<b>لا توجد عروض مطابقة بعد.</b>',
    `<b>المتابعة:</b> https://www.crate.ae/ar/dashboard/buyer-requests`,
  ].filter(Boolean).join('<br>'))

  // Receipt to the buyer. No promise of a time or of a match — only what happens next.
  if (r.email && process.env.RESEND_API_KEY) {
    const ar = locale === 'ar'
    const lines = ar
      ? [`شكراً لطلبك على Crate. رقم الطلب: ${ref}.`, `المنتج: ${a.product}${a.quantity ? ` · ${a.quantity} ${a.qty_unit}` : ''}.`, `نطابق طلبك مع عروض الموردين المتوفرة لدينا ونتواصل معك على واتساب أو البريد بالعروض المناسبة.`, `نصيحة: في الصفقة الأولى مع مورد جديد فضّل الاعتماد المستندي أو الدفع مقابل المستندات على التحويل المسبق، واطلب عينة وتحليلاً مخبرياً.`, `Crate — www.crate.ae`]
      : [`Thank you for your request on Crate. Reference: ${ref}.`, `Product: ${a.product}${a.quantity ? ` · ${a.quantity} ${a.qty_unit}` : ''}.`, `We match your request against the supplier offers we hold and contact you on WhatsApp or email with the ones that fit.`, `Tip: on a first deal with a new supplier, prefer a letter of credit or cash against documents to an advance transfer, and ask for a sample and a lab test.`, `Crate — www.crate.ae`]
    try {
      await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: `Crate <${FROM}>`, to: [r.email], replyTo: FROM,
        subject: ar ? `استلمنا طلبك ${ref} — ${a.product}` : `Request ${ref} received — ${a.product}`,
        html: `<div dir="${ar ? 'rtl' : 'ltr'}" style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#1f2430">${lines.map(l => `<p style="margin:0 0 10px">${esc(l)}</p>`).join('')}</div>`,
        text: lines.join('\n\n'),
      })
    } catch (e) { console.error('[buyer-requests] receipt:', e) }
  }

  return NextResponse.json({ ok: true, ref, matches: matches.length })
}
