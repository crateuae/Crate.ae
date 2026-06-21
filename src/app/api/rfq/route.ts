/**
 * POST /api/rfq
 * Submit a quote request from an insights page.
 * Inserts into rfq_requests, bumps opportunity.rfq_count, and emails the admin.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
          company_name, source_page, locale } = body

  if (!contact_name?.trim() || !product_name?.trim()) {
    return NextResponse.json({ error: 'contact_name and product_name are required' }, { status: 422 })
  }

  const supabase = db()

  const { data: rfq, error } = await supabase
    .from('rfq_requests')
    .insert({
      opportunity_id: opportunity_id || null,
      product_name: product_name.trim(),
      product_name_ar: product_name_ar?.trim() || null,
      quantity: quantity?.trim() || null,
      destination: destination?.trim() || null,
      budget_aed: budget_aed ? Number(budget_aed) : null,
      notes: notes?.trim() || null,
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

  return NextResponse.json({ ok: true, id: rfq.id })
}
