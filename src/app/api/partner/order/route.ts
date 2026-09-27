/**
 * POST /api/partner/order
 * A buyer orders labels. Crate injects the order into the factory (Art for Printing) and
 * records it in partner_orders — Crate's margin ledger.
 *
 * Money: the buyer pays the factory price PLUS Crate's margin (crateMarkupPct, 30%). The
 * factory is merchant of record and collects the whole amount through its pay link; Crate's
 * share is the margin inside the goods price, booked here for monthly settlement. For the
 * old flat product, which has no margin, the ledger falls back to CRATE_COMMISSION_PCT.
 *
 * Idempotent via crate_request_id. Never trusts a client price — the factory prices
 * server-side and the margin is decided on this server.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAfpOrder, afpConfigured } from '@/lib/partner/afp'
import { readStickerAsk, readSqmAsk, crateMarkupPct } from '@/lib/partner/sticker-ask'
import { adminClient } from '@/lib/supabase/admin'
import { cleanEmail } from '@/lib/email/normalize'
import { notifyAdmin } from '@/lib/email/notify-admin'

export const runtime = 'nodejs'

const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100

export async function POST(req: NextRequest) {
  if (!afpConfigured()) {
    return NextResponse.json({ ok: false, error: 'service_unavailable' }, { status: 503 })
  }
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 }) }
  if (typeof body?.website === 'string' && body.website.trim()) return NextResponse.json({ ok: true }) // honeypot

  const buyer = body?.buyer || {}
  const name = String(buyer.name || '').trim()
  const phone = String(buyer.phone || '').trim()
  if (!name || !phone) {
    return NextResponse.json({ ok: false, error: 'missing_buyer', detail: 'name + phone required' }, { status: 400 })
  }
  const email = cleanEmail(buyer.email) || undefined
  const sqm = readSqmAsk(body?.sqm)
  const sticker = sqm ? null : readStickerAsk(body?.sticker)
  if ((body?.sqm && !sqm) || (!sqm && body?.sticker && !sticker)) return NextResponse.json({ ok: false, error: 'invalid_size' }, { status: 422 })
  const ask = sqm ?? sticker
  const design = body?.design === true
  const markup_pct = crateMarkupPct()
  const locale: 'ar' | 'en' = body?.locale === 'en' ? 'en' : 'ar'
  const quantity = Math.max(1, Math.floor(Number(body?.quantity) || 1))
  const selectedOptions = (body?.selectedOptions && typeof body.selectedOptions === 'object') ? body.selectedOptions : {}
  const product_slug = body?.product_slug ? String(body.product_slug) : undefined
  const configNote = body?.configNote ? String(body.configNote).slice(0, 400) : undefined
  const crateRequestId = body?.crate_request_id ? String(body.crate_request_id).slice(0, 80) : undefined
  const artwork = (body?.artwork?.dataUrl && body?.artwork?.name)
    ? { name: String(body.artwork.name).slice(0, 80), dataUrl: String(body.artwork.dataUrl) }
    : undefined

  // ── Inject the order into the factory ──
  const afp = await createAfpOrder({
    crate_request_id: crateRequestId,
    ...(sqm ? { sqm, design, markup_pct, locale }
      : sticker ? { sticker, design, markup_pct, locale }
      : { product_slug, quantity, selectedOptions, locale }),
    configNote, artwork,
    buyer: { name, phone, email, address: buyer.address ? String(buyer.address).slice(0, 400) : undefined, company: buyer.company ? String(buyer.company).slice(0, 160) : undefined },
  })
  if (!afp.ok || !afp.afp_ref) {
    console.error('[partner/order] AFP injection failed:', afp.error)
    const tooLarge = afp.error === 'piece_too_large' || afp.error === 'not_priced'
    return NextResponse.json({ ok: false, error: tooLarge ? 'piece_too_large' : 'fulfillment_failed' }, { status: tooLarge ? 422 : 502 })
  }

  // ── Crate's share ──
  const afpTotal = Number(afp.total_aed) || 0
  const hasMargin = typeof afp.partner_share_aed === 'number' && typeof afp.base_line_total_aed === 'number'
  const commissionPct = hasMargin ? Number(afp.markup_pct ?? markup_pct) : (Number(process.env.CRATE_COMMISSION_PCT) || 15)
  const commissionAed = hasMargin ? round2(afp.partner_share_aed as number) : round2(afpTotal * commissionPct / 100)
  const sb = adminClient()
  const what = ask
    ? `${ask.pieces} × ${ask.w_mm / 10}×${ask.h_mm / 10} cm`
      + (afp.sqm ? ` · ${afp.sqm.charged_m2} m² · ${afp.sqm.rows} rows · ${afp.sqm.cut}` : '')
      + (afp.sticker ? ` · ${afp.sticker.sheets} × ${afp.sticker.sheet}` : '')
      + (design ? ' · + design' : '')
    : `${quantity} sheets`

  // A retried request (same crate_request_id) gets the factory's first order back — the
  // margin must not be booked twice.
  let ledgerId: string | null = null
  if (!afp.deduped) {
    const { data: row, error } = await sb.from('partner_orders').insert({
      partner: 'art_for_printing',
      crate_request_id: crateRequestId ?? null,
      afp_ref: afp.afp_ref,
      afp_order_id: afp.order_id ?? null,
      product_slug: sqm ? 'custom-pvc-sticker-sqm'
        : sticker ? (sticker.material === 'pvc' ? 'custom-pvc-sticker' : 'custom-sticker-sheets')
        : (product_slug ?? 'custom-paper-product-labels'),
      quantity: ask ? ask.pieces : quantity,
      spec: {
        ...(ask ? { ...ask, ...(afp.sqm ?? afp.sticker ?? {}), design, design_fee_aed: afp.design_fee_aed ?? 0 } : selectedOptions),
        ...(hasMargin ? { factory_goods_aed: afp.base_line_total_aed, buyer_goods_aed: afp.line_total_aed, markup_pct: commissionPct } : {}),
        ...(configNote ? { note: configNote } : {}),
        ...(afp.pay_url ? { pay_url: afp.pay_url } : {}),
      },
      buyer_name: name,
      buyer_email: email ?? null,
      buyer_phone: phone,
      buyer_address: buyer.address ? String(buyer.address).slice(0, 400) : null,
      buyer_company: buyer.company ? String(buyer.company).slice(0, 160) : null,
      currency: 'AED',
      afp_total_aed: afpTotal,
      commission_pct: commissionPct,
      commission_aed: commissionAed,
      status: afp.status || 'pending',
      source_page: body?.source_page ? String(body.source_page).slice(0, 120) : 'compliance',
      compliance_product: body?.compliance_product ? String(body.compliance_product).slice(0, 200) : null,
      artwork_stored: !!afp.artwork_stored,
    }).select('id').single()
    if (error) console.error('[partner/order] ledger insert failed:', error)
    ledgerId = row?.id ?? null

    await notifyAdmin(
      `طلب ملصقات جديد — ${afp.afp_ref} — AED ${afpTotal}`,
      `<p><b>${name}</b> — ${phone}${email ? ` — ${email}` : ''}</p>
       <p>${what}</p>
       <p>يدفع العميل: AED ${afpTotal} (شامل الضريبة)${hasMargin ? ` · سعر المصنع للبضاعة: AED ${afp.base_line_total_aed} صافي · هامش Crate (${commissionPct}%): AED ${commissionAed} صافي` : ` · عمولة Crate: AED ${commissionAed} (${commissionPct}%)`}</p>
       <p>مرجع المصنع: <b>${afp.afp_ref}</b> — الحالة: ${afp.status || 'pending'}</p>
       ${afp.pay_url ? `<p>رابط الدفع (يمكن إرساله للعميل واتساب): <a href="${afp.pay_url}">${afp.pay_url}</a></p>` : ''}
       <p style="color:#888">ظهر للعميل زر الدفع مباشرة بعد الطلب. إن لم يدفع، أرسل له الرابط.</p>`,
    ).catch(() => {})
  }

  // Whitelisted: the factory's own price and Crate's margin never reach the browser.
  return NextResponse.json({
    ok: true,
    afp_ref: afp.afp_ref,
    design_fee_aed: afp.design_fee_aed ?? 0,
    subtotal_aed: afp.subtotal_aed ?? null,
    vat_aed: afp.vat_aed ?? null,
    total_aed: afpTotal,
    currency: 'AED',
    status: afp.status || 'pending',
    pay_url: afp.pay_url ?? null,
    ledger_id: ledgerId,
  })
}
