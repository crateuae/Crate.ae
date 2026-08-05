/**
 * POST /api/partner/order
 * An importer orders compliant labels from the compliance flow. Crate injects the
 * order into Art for Printing (dropship) and records it in partner_orders — the
 * commission ledger. Commission model: AFP is merchant of record (collects payment
 * from the buyer); Crate earns CRATE_COMMISSION_PCT of the order total, tracked
 * here for monthly settlement.
 *
 * Idempotent via crate_request_id (a client-generated id, echoed to AFP which
 * dedups on it). Never trusts a client price — AFP reprices server-side.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAfpOrder, afpConfigured } from '@/lib/partner/afp'
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

  const buyer = body?.buyer || {}
  const name = String(buyer.name || '').trim()
  const phone = String(buyer.phone || '').trim()
  if (!name || !phone) {
    return NextResponse.json({ ok: false, error: 'missing_buyer', detail: 'name + phone required' }, { status: 400 })
  }
  const email = cleanEmail(buyer.email) || undefined
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
    product_slug, quantity, selectedOptions, configNote, artwork,
    buyer: { name, phone, email, address: buyer.address ? String(buyer.address).slice(0, 400) : undefined, company: buyer.company ? String(buyer.company).slice(0, 160) : undefined },
  })
  if (!afp.ok || !afp.afp_ref) {
    console.error('[partner/order] AFP injection failed:', afp.error)
    return NextResponse.json({ ok: false, error: 'fulfillment_failed', detail: afp.error }, { status: 502 })
  }

  // ── Record in the commission ledger ──
  const commissionPct = Number(process.env.CRATE_COMMISSION_PCT) || 15
  const afpTotal = Number(afp.total_aed) || 0
  const commissionAed = round2(afpTotal * commissionPct / 100)
  const sb = adminClient()

  const { data: row, error } = await sb.from('partner_orders').insert({
    partner: 'art_for_printing',
    crate_request_id: crateRequestId ?? null,
    afp_ref: afp.afp_ref,
    afp_order_id: afp.order_id ?? null,
    product_slug: product_slug ?? 'custom-paper-product-labels',
    quantity,
    spec: { ...selectedOptions, ...(configNote ? { note: configNote } : {}) },
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

  await notifyAdmin(
    `طلب ملصقات جديد عبر الدروبشيب — ${afp.afp_ref}`,
    `<p><b>${name}</b> — ${phone}${email ? ` — ${email}` : ''}</p>
     <p>الكمية: ${quantity} · الإجمالي (AFP): AED ${afpTotal} · عمولة Crate: AED ${commissionAed} (${commissionPct}%)</p>
     <p>مرجع AFP: <b>${afp.afp_ref}</b> — الحالة: ${afp.status || 'pending'}</p>
     <p style="color:#888">تُحصّل Art for Printing الدفع من المشتري قبل الإنتاج.</p>`,
  ).catch(() => {})

  return NextResponse.json({
    ok: true,
    afp_ref: afp.afp_ref,
    total_aed: afpTotal,
    unit_price_aed: afp.unit_price_aed ?? null,
    currency: 'AED',
    status: afp.status || 'pending',
    ledger_id: row?.id ?? null,
  })
}
