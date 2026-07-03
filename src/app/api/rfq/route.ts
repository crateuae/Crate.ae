/**
 * POST /api/rfq
 * Submit a quote request from an insights page.
 * Inserts into rfq_requests, bumps opportunity.rfq_count, and emails the admin.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveAudience, type AudienceSpec } from '@/lib/campaigns/audience'

/**
 * CAPTURE → OUTREACH loop closure. An incoming RFQ (demand signal) drafts an
 * outreach campaign to matching suppliers. SAFE: gated by ENABLE_OUTREACH,
 * DRAFT-only (a human reviews & sends), and no-ops until verified contacts exist.
 */
async function draftSupplierOutreach(
  supabase: ReturnType<typeof db>,
  opts: { opportunityId: string | null; productEn: string; productAr: string | null }
) {
  if (process.env.ENABLE_OUTREACH !== 'true') return
  try {
    let category: string | null = null
    if (opts.opportunityId) {
      const { data: opp } = await supabase.from('opportunities').select('category_guess').eq('id', opts.opportunityId).maybeSingle()
      category = (opp?.category_guess as string) ?? null
    }
    const spec: AudienceSpec = { source: 'providers', category: category ?? undefined, limit: 150 }
    const audience = await resolveAudience(supabase, spec)
    if (audience.length === 0) return
    const name = opts.productAr || opts.productEn
    await supabase.from('email_campaigns').insert({
      name: `RFQ outreach — ${opts.productEn} (auto)`,
      subject: `طلب توريد: ${name} — Sourcing request`,
      body_html:
        `<div dir="rtl" style="font-family:Arial,sans-serif;font-size:14px;line-height:1.8">`
        + `<p>مرحباً {{company}},</p><p>لدينا طلب استيراد فعّال على <strong>${name}</strong>. `
        + `إن كنتم توفّرونه أو ما يماثله، شاركونا قائمة الأسعار والحد الأدنى للطلب — بدون التزام.</p></div>`
        + `<div dir="ltr" style="font-family:Arial,sans-serif;font-size:14px;line-height:1.8;margin-top:12px">`
        + `<p>Hello {{company}},</p><p>We have an active import request for <strong>${opts.productEn}</strong>. `
        + `If you supply this or a close match, share your price list and MOQ — no obligation.</p></div>`,
      audience: spec, status: 'draft', total_recipients: audience.length,
    })
  } catch (e) {
    console.error('[rfq] auto-outreach:', e)
  }
}

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function notifyAdmin(payload: {
  product: string; contact: string; company: string | null
  phone: string | null; email: string | null; quantity: string | null; page: string | null
}) {
  if (!process.env.RESEND_API_KEY) return
  const lines = [
    `<b>منتج:</b> ${payload.product}`,
    `<b>مقدّم الطلب:</b> ${payload.contact}`,
    payload.company ? `<b>شركة:</b> ${payload.company}` : '',
    payload.phone   ? `<b>هاتف:</b> ${payload.phone}` : '',
    payload.email   ? `<b>إيميل:</b> ${payload.email}` : '',
    payload.quantity ? `<b>كمية:</b> ${payload.quantity}` : '',
    payload.page    ? `<b>صفحة:</b> https://www.crate.ae${payload.page}` : '',
  ].filter(Boolean).join('<br>')

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Crate RFQ <noreply@crate.ae>',
      to: ['altubjimalik@gmail.com'],
      subject: `طلب عرض سعر جديد — ${payload.product}`,
      html: `<div dir="rtl" style="font-family:sans-serif;line-height:1.7">${lines}</div>`,
    }),
  })
}

export async function POST(req: NextRequest) {
  let body: Record<string, string>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }

  const { opportunity_id, product_name, product_name_ar, quantity, destination,
          budget_aed, notes, contact_name, contact_email, contact_phone,
          company_name, source_page, locale, provider_id, intent } = body

  if (!contact_name?.trim() || !product_name?.trim()) {
    return NextResponse.json({ error: 'contact_name and product_name are required' }, { status: 422 })
  }

  // Fold the request intent into the notes so it survives without a schema change.
  const INTENT_AR: Record<string, string> = {
    quote: 'طلب عرض سعر', product: 'سؤال عن منتج', requirement: 'متطلب توريد',
  }
  const intentLabel = intent ? (INTENT_AR[intent] ?? intent) : null
  const composedNotes = [
    intentLabel ? `[${intentLabel}]` : null,
    notes?.trim() || null,
  ].filter(Boolean).join(' ') || null

  const supabase = db()

  const { data: rfq, error } = await supabase
    .from('rfq_requests')
    .insert({
      opportunity_id: opportunity_id || null,
      provider_id: provider_id || null,
      product_name: product_name.trim(),
      product_name_ar: product_name_ar?.trim() || null,
      quantity: quantity?.trim() || null,
      destination: destination?.trim() || null,
      budget_aed: budget_aed ? Number(budget_aed) : null,
      notes: composedNotes,
      contact_name: contact_name.trim(),
      contact_email: contact_email?.trim() || null,
      contact_phone: contact_phone?.trim() || null,
      company_name: company_name?.trim() || null,
      source_page: source_page || null,
      locale: locale || 'ar',
    })
    .select('id')
    .single()

  if (error) {
    console.error('[rfq] insert error:', error)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  // Bump rfq_count on the opportunity (best-effort, non-blocking)
  if (opportunity_id) {
    supabase.rpc('increment_rfq_count', { opp_id: opportunity_id }).maybeSingle()
  }

  // Record the demand against the provider (the broker spine).
  if (provider_id) {
    supabase.rpc('log_provider_event', {
      p_provider_id: provider_id,
      p_event_type: 'rfq_received',
      p_actor: 'merchant',
      p_rfq_id: rfq.id,
      p_payload: { intent: intent ?? null, product: product_name.trim() },
    }).then(({ error: e }) => { if (e) console.error('[rfq] log_provider_event:', e.message) })
  }

  // Notify admin (non-blocking)
  notifyAdmin({
    product: product_name.trim(),
    contact: contact_name.trim(),
    company: company_name?.trim() || null,
    phone: contact_phone?.trim() || null,
    email: contact_email?.trim() || null,
    quantity: quantity?.trim() || null,
    page: source_page || null,
  })

  // CAPTURE → OUTREACH: draft a supplier outreach for this demand (gated, draft-only).
  await draftSupplierOutreach(supabase, {
    opportunityId: opportunity_id || null,
    productEn: product_name.trim(),
    productAr: product_name_ar?.trim() || null,
  })

  return NextResponse.json({ ok: true, id: rfq.id })
}
