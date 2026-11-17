/**
 * POST /api/packaging/basket-rfq
 * Saves a food-basket quote request from the public calculator.
 * Stores in packaging_plans (mode='basket_mix') and emails + WhatsApps the admin.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { rateLimit, rejectCrossOrigin, readJsonObject, badBody, clipText, validEmail, esc } from '@/lib/security/guard'

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'crateuae@gmail.com'
const FROM_EMAIL  = process.env.RESEND_FROM_EMAIL ?? 'uae@crate.ae'

export async function POST(req: NextRequest) {
  const xo = rejectCrossOrigin(req)
  if (xo) return xo
  // Each accepted request sends an email and a WhatsApp message to the admin: keep the burst small.
  const limited = rateLimit(req, 'basket-min', 3, 60_000) || rateLimit(req, 'basket-hour', 10, 3_600_000)
  if (limited) return limited
  const body = await readJsonObject(req, 80_000)
  if (!body) return badBody()
  if (typeof body.website === 'string' && body.website.trim()) return NextResponse.json({ success: true }) // honeypot

  const num = (v: unknown, max = 1e9) => { const n = Number(v); return Number.isFinite(n) && n >= 0 && n <= max ? n : 0 }
  const contact_name = clipText(body.contact_name, 120)
  const contact_company = clipText(body.contact_company, 160)
  const contact_email = validEmail(body.contact_email) ?? ''
  const contact_phone = clipText(body.contact_phone, 40)
  if (body.contact_email && !contact_email) return NextResponse.json({ error: 'invalid_email' }, { status: 422 })
  if (!contact_name || (!contact_email && !contact_phone)) {
    return NextResponse.json({ error: 'contact_name and one of email/phone are required' }, { status: 400 })
  }
  const basket_count = num(body.basket_count, 1e7)
  const total_weight_kg = num(body.total_weight_kg, 1e6)
  const price_known = body.price_known === true
  const carton_name = clipText(body.carton_name, 160)
  const carton_dims = clipText(body.carton_dims, 80)
  const carton_cost_aed = num(body.carton_cost_aed, 1e6)
  const items = (Array.isArray(body.items) ? body.items.slice(0, 80) : []).map((i: unknown) => {
    const r = (i && typeof i === 'object' ? i : {}) as Record<string, unknown>
    return { name: clipText(r.name, 120), brand: clipText(r.brand, 120), weightKg: num(r.weightKg, 1e5), qty: num(r.qty, 1e6) }
  })
  const calc = body.calc && typeof body.calc === 'object' && !Array.isArray(body.calc) && JSON.stringify(body.calc).length <= 30_000 ? body.calc : null

  // ── 1. Save to DB ──────────────────────────────────────────────────────────
  const supabase = adminDb()
  const { data: row, error } = await supabase
    .from('packaging_plans')
    .insert({
      mode: 'basket_mix',
      input_data: {
        contact_name, contact_company, contact_email, contact_phone,
        basket_count, total_weight_kg, price_known,
        carton_name, carton_dims, carton_cost_aed,
        items,
      },
      output_data: calc ?? null,
      brand_name: (contact_company as string) || null,
      label_generated: false,
    })
    .select('id')
    .single()

  if (error) {
    console.error('basket-rfq insert error:', JSON.stringify(error))
    return NextResponse.json({ error: 'Could not save request' }, { status: 500 })
  }

  // ── 2. Email admin ─────────────────────────────────────────────────────────
  const itemsArr = items
  const itemRows = itemsArr.map(i =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9">${esc(i.name) || '—'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#64748b">${esc(i.brand) || '—'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:center">${i.weightKg} kg</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:center">${i.qty}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:center;font-weight:700">${(i.weightKg * i.qty).toFixed(2)} kg</td>
    </tr>`
  ).join('')

  const calcObj = (calc as Record<string, unknown>) ?? {}
  const subjectCompany = contact_company.replace(/[\r\n]+/g, ' ')

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `🧺 طلب عرض سعر سلة غذائية — ${basket_count} سلة${subjectCompany ? ' | ' + subjectCompany : ''}`,
    html: `
<!DOCTYPE html><html dir="rtl" lang="ar">
<head><meta charset="UTF-8"></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;background:#f8fafc;padding:0;margin:0">
<div style="max-width:640px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.06)">

  <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:28px 32px;color:#fff">
    <div style="font-size:11px;opacity:.8;font-weight:600;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px">Crate.ae — طلب جديد</div>
    <div style="font-size:22px;font-weight:900">🧺 سلة غذائية مختلطة</div>
    <div style="font-size:13px;opacity:.85;margin-top:4px">Ref: ${row?.id?.toString().slice(0,8).toUpperCase()}</div>
  </div>

  <div style="padding:28px 32px">

    <table style="width:100%;background:#f0f9ff;border-radius:12px;padding:16px;margin-bottom:24px;font-size:13px;border:1px solid #bae6fd">
      <tr><td style="padding:5px 8px;color:#64748b;width:140px">الاسم</td><td style="padding:5px 8px;font-weight:700">${esc(contact_name) || '—'}</td></tr>
      <tr><td style="padding:5px 8px;color:#64748b">الشركة</td><td style="padding:5px 8px">${esc(contact_company) || '—'}</td></tr>
      <tr><td style="padding:5px 8px;color:#64748b">البريد</td><td style="padding:5px 8px">${esc(contact_email) || '—'}</td></tr>
      <tr><td style="padding:5px 8px;color:#64748b">الهاتف</td><td style="padding:5px 8px">${esc(contact_phone) || '—'}</td></tr>
    </table>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px">
      <div style="background:#f8fafc;border-radius:10px;padding:14px;text-align:center;border:1px solid #e2e8f0">
        <div style="font-size:24px;font-weight:900;color:#f97316">${Number(basket_count).toLocaleString('en-US')}</div>
        <div style="font-size:11px;color:#94a3b8;margin-top:3px">عدد السلال</div>
      </div>
      <div style="background:#f8fafc;border-radius:10px;padding:14px;text-align:center;border:1px solid #e2e8f0">
        <div style="font-size:24px;font-weight:900;color:#6366f1">${Number(total_weight_kg).toFixed(2)}</div>
        <div style="font-size:11px;color:#94a3b8;margin-top:3px">kg وزن السلة</div>
      </div>
      <div style="background:#f8fafc;border-radius:10px;padding:14px;text-align:center;border:1px solid #e2e8f0">
        <div style="font-size:24px;font-weight:900;color:#10b981">${esc(calcObj.pals ?? '—')}</div>
        <div style="font-size:11px;color:#94a3b8;margin-top:3px">باليت</div>
      </div>
    </div>

    <div style="font-size:13px;font-weight:800;color:#f97316;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #f1f5f9">محتويات السلة</div>
    <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:24px">
      <thead><tr style="background:#f8fafc">
        <th style="padding:8px 12px;text-align:right;color:#475569;border-bottom:2px solid #e2e8f0">المنتج</th>
        <th style="padding:8px 12px;text-align:right;color:#475569;border-bottom:2px solid #e2e8f0">البراند</th>
        <th style="padding:8px 12px;text-align:center;color:#475569;border-bottom:2px solid #e2e8f0">وزن/وحدة</th>
        <th style="padding:8px 12px;text-align:center;color:#475569;border-bottom:2px solid #e2e8f0">العدد</th>
        <th style="padding:8px 12px;text-align:center;color:#475569;border-bottom:2px solid #e2e8f0">الوزن الإجمالي</th>
      </tr></thead>
      <tbody>${itemRows}</tbody>
      <tfoot><tr style="background:#fff7ed">
        <td colspan="4" style="padding:10px 12px;font-weight:800">إجمالي وزن السلة</td>
        <td style="padding:10px 12px;text-align:center;font-weight:900;color:#f97316">${Number(total_weight_kg).toFixed(2)} kg</td>
      </tr></tfoot>
    </table>

    <div style="font-size:13px;font-weight:800;color:#f97316;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #f1f5f9">مواصفات الكرتون</div>
    <table style="width:100%;font-size:13px;margin-bottom:24px">
      <tr><td style="padding:6px 0;color:#64748b;width:160px">الاسم</td><td style="font-weight:700">${esc(carton_name) || '—'}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">الأبعاد</td><td>${esc(carton_dims) || '—'}</td></tr>
      ${price_known ? `<tr><td style="padding:6px 0;color:#64748b">سعر الكرتون</td><td style="font-weight:700;color:#10b981">${Number(carton_cost_aed).toFixed(2)} AED</td></tr>` : `<tr><td style="padding:6px 0;color:#64748b">السعر</td><td style="color:#94a3b8">غير محدد — مطلوب عرض سعر</td></tr>`}
    </table>

    <div style="background:#f97316;border-radius:12px;padding:20px;text-align:center;margin-bottom:16px">
      <div style="font-size:12px;color:rgba(255,255,255,.8);margin-bottom:4px">التكلفة التقريبية للكراتين</div>
      ${price_known
        ? `<div style="font-size:28px;font-weight:900;color:#fff">${(Number(basket_count)*Number(carton_cost_aed)).toLocaleString('en-US')} AED</div>`
        : `<div style="font-size:20px;font-weight:800;color:#fff;opacity:.8">مطلوب عرض سعر من المورد</div>`}
    </div>

    <p style="font-size:11px;color:#94a3b8;text-align:center">* بيانات العميل محفوظة بشكل آمن · Crate.ae · ${new Date().getFullYear()}</p>
  </div>
</div>
</body></html>`,
  }).catch(e => console.error('admin email error:', e))

  // ── 3. WhatsApp notification via CallMeBot ──────────────────────────────────
  const waPhone  = (process.env.ADMIN_WHATSAPP ?? '971543000415').replace(/\D/g, '')
  const waApiKey = process.env.CALLMEBOT_API_KEY
  if (waPhone && waApiKey) {
    const msg = encodeURIComponent(
      `🧺 طلب سلة غذائية جديد — Crate.ae\n` +
      `👤 ${contact_name || 'زائر'}${contact_company ? ' | ' + contact_company : ''}\n` +
      `📦 ${basket_count} سلة\n` +
      `📞 ${contact_phone || '—'}\n` +
      `📧 ${contact_email || '—'}`
    )
    fetch(`https://api.callmebot.com/whatsapp.php?phone=${waPhone}&text=${msg}&apikey=${waApiKey}`)
      .catch(e => console.error('callmebot error:', e))
  }

  return NextResponse.json({ success: true, rfq_id: row?.id })
}
