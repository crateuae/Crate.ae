/**
 * POST /api/partner/order
 * An importer orders compliant labels. Crate injects the order into Art for Printing
 * (dropship) and records it in partner_orders — the commission ledger. Commission model:
 * AFP is merchant of record (collects payment from the buyer); Crate earns
 * CRATE_COMMISSION_PCT of the order total, tracked here for monthly settlement.
 *
 * The response carries AFP's `pay_url`, so the buyer pays on the spot instead of waiting
 * for a phone call. Idempotent via crate_request_id (a client-generated id, echoed to AFP
 * which dedups on it). Never trusts a client price — AFP prices server-side.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAfpOrder, afpConfigured } from '@/lib/partner/afp'
import { readStickerAsk } from '@/lib/partner/sticker-ask'
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
  const sticker = readStickerAsk(body?.sticker)
  if (body?.sticker && !sticker) return NextResponse.json({ ok: false, error: 'invalid_size' }, { status: 422 })
  const design = body?.design === true
  const locale: 'ar' | 'en' = body?.locale === 'en' ? 'en' : 'ar'
  const quantity = Math.max(1, Math.floor(Number(body?.quantity) || 1))
  const selectedOptions = (body?.selectedOptions && typeof body.selectedOptions === 'object') ? body.selectedOptions : {}
  const product_slug = body?.product_slug ? String(body.product_slug) : undefined
  const configNote = body?.configNote ? String(body.configNote).slice(0, 400) : undefined
  const crateRequestId = body?.crate_request_id ? String(body.crate_request_id).slice(0, 80) : undefined
  const artwork = (body?.artwork?.dataUrl && body?.artwork?.name)
    ? { name: String(body.artwork.name).slice(0, 80), dataUrl: String(body.artwork.dataUrl) }
    : undefined

  // ── Inject the order into Art for Printing (dropship) ──
  const afp = await createAfpOrder({
    crate_request_id: crateRequestId,
    ...(sticker ? { sticker, design, locale } : { product_slug, quantity, selectedOptions, locale }),
    configNote, artwork,
    buyer: { name, phone, email, address: buyer.address ? String(buyer.address).slice(0, 400) : undefined, company: buyer.company ? String(buyer.company).slice(0, 160) : undefined },
  })
  if (!afp.ok || !afp.afp_ref) {
    console.error('[partner/order] AFP injection failed:', afp.error)
    const status = (afp.error === 'piece_too_large' || afp.error === 'not_priced') ? 422 : 502
    return NextResponse.json({ ok: false, error: afp.error === 'piece_too_large' ? 'piece_too_large' : 'fulfillment_failed', detail: afp.detail ?? afp.error }, { status })
  }

  // ── Record in the commission ledger ──
  const commissionPct = Number(process.env.CRATE_COMMISSION_PCT) || 15
  const afpTotal = Number(afp.total_aed) || 0
  const commissionAed = round2(afpTotal * commissionPct / 100)
  const sb = adminClient()
  const what = sticker
    ? `${sticker.pieces} × ${sticker.w_mm / 10}×${sticker.h_mm / 10} cm · ${sticker.material}${afp.sticker ? ` · ${afp.sticker.sheets} × ${afp.sticker.sheet}` : ''}${design ? ' · + design' : ''}`
    : `${quantity} sheets`

  // A retried request (same crate_request_id) gets AFP's first order back — do not book the
  // commission twice.
  let ledgerId: string | null = null
  if (!afp.deduped) {
    const { data: row, error } = await sb.from('partner_orders').insert({
      partner: 'art_for_printing',
      crate_request_id: crateRequestId ?? null,
      afp_ref: afp.afp_ref,
      afp_order_id: afp.order_id ?? null,
      product_slug: sticker ? (sticker.material === 'pvc' ? 'custom-pvc-sticker' : 'custom-sticker-sheets') : (product_slug ?? 'custom-paper-product-labels'),
      quantity: sticker ? sticker.pieces : quantity,
      spec: {
        ...(sticker ? { ...sticker, ...(afp.sticker ?? {}), design, design_fee_aed: afp.design_fee_aed ?? 0 } : selectedOptions),
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
       <p>الإجمالي (AFP): AED ${afpTotal} · عمولة Crate: AED ${commissionAed} (${commissionPct}%)</p>
       <p>مرجع AFP: <b>${afp.afp_ref}</b> — الحالة: ${afp.status || 'pending'}</p>
       ${afp.pay_url ? `<p>رابط الدفع (يمكن إرساله للعميل واتساب): <a href="${afp.pay_url}">${afp.pay_url}</a></p>` : ''}
       <p style="color:#888">ظهر للعميل زر الدفع مباشرة بعد الطلب. إن لم يدفع، أرسل له الرابط.</p>`,
    ).catch(() => {})
  }

  return NextResponse.json({
    ok: true,
    afp_ref: afp.afp_ref,
    quantity: afp.quantity ?? null,
    unit_price_aed: afp.unit_price_aed ?? null,
    design_fee_aed: afp.design_fee_aed ?? 0,
    subtotal_aed: afp.subtotal_aed ?? null,
    vat_aed: afp.vat_aed ?? null,
    total_aed: afpTotal,
    currency: 'AED',
    status: afp.status || 'pending',
    pay_url: afp.pay_url ?? null,
    sticker: afp.sticker ?? null,
    ledger_id: ledgerId,
  })
}
