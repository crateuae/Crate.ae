/**
 * POST /api/supplier-offers — an exporter submits an offer from /sell-to-uae.
 *
 * Stored in tool_leads (tool = 'supplier_offer', see src/lib/supplier-offers/model.ts),
 * reviewed in /dashboard/supplier-offers, never published automatically. The admin gets an
 * email for every new offer. A repeat of the same product from the same number within
 * 15 minutes returns the first record instead of a duplicate (double taps, resubmits).
 */
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { notifyAdmin } from '@/lib/email/notify-admin'
import { parseOffer, OFFER_TOOL, CATEGORIES, PAYMENT_TERMS, labelOf, priceLine, offerRef } from '@/lib/supplier-offers/model'

export const runtime = 'nodejs'

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 }) }
  if (typeof body.website_hp === 'string' && body.website_hp.trim()) return NextResponse.json({ ok: true, ref: 'SO-000000' }) // honeypot
  if (body.consent !== true) return NextResponse.json({ ok: false, error: 'consent_required', field: 'consent' }, { status: 422 })

  const parsed = parseOffer(body, 'form')
  if (!parsed.ok) return NextResponse.json({ ok: false, error: 'missing_field', field: parsed.field }, { status: 422 })
  const { offer } = parsed
  const locale = body.locale === 'en' ? 'en' : 'ar'
  const db = adminClient()

  // Same number + same product in the last 15 minutes → the first record.
  const since = new Date(Date.now() - 15 * 60_000).toISOString()
  const { data: dup } = await db.from('tool_leads').select('id')
    .eq('tool', OFFER_TOOL).eq('phone', offer.phone).gte('created_at', since)
    .filter('answers->>product', 'eq', offer.answers.product).limit(1)
  if (dup?.length) return NextResponse.json({ ok: true, ref: offerRef(dup[0].id), duplicate: true })

  const { data: row, error } = await db.from('tool_leads').insert({
    tool: OFFER_TOOL,
    email: offer.email ?? '',
    name: offer.name,
    company: offer.company,
    phone: offer.phone,
    locale,
    answers: offer.answers,
    result_key: offer.answers.category,
    consent: true,
    source_page: typeof body.source_page === 'string' ? body.source_page.slice(0, 300) : null,
  }).select('id').single()
  if (error || !row) {
    console.error('[supplier-offers] insert:', error?.message)
    return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 })
  }

  const a = offer.answers
  const ref = offerRef(row.id)
  const risky = PAYMENT_TERMS.find(p => p.key === a.payment_terms)?.risky
  await notifyAdmin(`عرض مورّد جديد ${ref} — ${a.product} (${a.origin})`, [
    `<b>المنتج:</b> ${esc(a.product)} · ${esc(labelOf(CATEGORIES, a.category, true))}`,
    `<b>المنشأ:</b> ${esc(a.origin)}`,
    a.price ? `<b>السعر:</b> ${esc(priceLine(a))}` : '',
    a.moq ? `<b>الحد الأدنى:</b> ${a.moq} ${esc(a.moq_unit)}` : '',
    a.payment_terms ? `<b>الدفع:</b> ${esc(labelOf(PAYMENT_TERMS, a.payment_terms, true))}${risky ? ' ⚠' : ''}` : '',
    `<b>المستندات المتوفرة:</b> ${a.documents?.length ?? 0}`,
    `<b>الشركة:</b> ${esc(offer.company)}${offer.name ? ` — ${esc(offer.name)}` : ''}`,
    `<b>واتساب:</b> ${esc(offer.phone)}${offer.email ? ` · ${esc(offer.email)}` : ''}`,
    `<b>المراجعة:</b> https://www.crate.ae/ar/dashboard/supplier-offers`,
  ].filter(Boolean).join('<br>'))

  return NextResponse.json({ ok: true, ref })
}
