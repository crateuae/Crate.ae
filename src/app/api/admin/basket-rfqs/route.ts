/**
 * GET  /api/admin/basket-rfqs         → list all basket RFQ requests
 * PATCH /api/admin/basket-rfqs        → update status/notes for one request
 * POST /api/admin/basket-rfqs/reply   → send reply email to client
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

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
const FROM    = process.env.RESEND_FROM_EMAIL ?? 'uae@crate.ae'

// ── GET ─────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') ?? '50')

  const db = adminDb()
  const { data, error } = await db
    .from('packaging_plans')
    .select('id, created_at, input_data, output_data')
    .eq('mode', 'basket_mix')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ requests: data ?? [] })
}

// ── PATCH (update status / notes) ────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const { id, status, admin_notes, contacted_at } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const db = adminDb()
  // Fetch current input_data then merge status fields into it
  const { data: current } = await db.from('packaging_plans').select('input_data').eq('id', id).single()
  const merged = { ...(current?.input_data ?? {}), _status: status, _admin_notes: admin_notes, _contacted_at: contacted_at }

  const { error } = await db.from('packaging_plans').update({ input_data: merged }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// ── POST (send reply email to client) ────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { id, to_email, to_name, subject, body, update_status } = await req.json()
  if (!to_email || !body) return NextResponse.json({ error: 'to_email and body required' }, { status: 400 })

  const { error: emailErr } = await getResend().emails.send({
    from: FROM,
    to: to_email,
    subject: subject || 'متابعة طلبك — Crate.ae',
    html: `
<!DOCTYPE html><html dir="rtl" lang="ar">
<head><meta charset="UTF-8"></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;background:#f8fafc;margin:0;padding:0">
<div style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;margin-top:24px">
  <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:24px 28px;color:#fff">
    <div style="font-size:18px;font-weight:900">Crate.ae</div>
    <div style="font-size:11px;opacity:.8;margin-top:2px">منصة الاستيراد والتوريد</div>
  </div>
  <div style="padding:28px">
    ${to_name ? `<p style="color:#64748b;font-size:13px;margin-bottom:16px">عزيزي ${to_name}،</p>` : ''}
    <div style="font-size:14px;line-height:1.8;color:#1e293b;white-space:pre-wrap">${body.replace(/\n/g,'<br>')}</div>
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #f1f5f9;font-size:11px;color:#94a3b8">
      فريق Crate.ae · <a href="mailto:${FROM}" style="color:#f97316">${FROM}</a>
    </div>
  </div>
</div>
</body></html>`,
  })

  if (emailErr) return NextResponse.json({ error: String(emailErr) }, { status: 500 })

  // Optionally update status after reply
  if (id && update_status) {
    const db = adminDb()
    const { data: current } = await db.from('packaging_plans').select('input_data').eq('id', id).single()
    const merged = { ...(current?.input_data ?? {}), _status: update_status, _last_reply: new Date().toISOString() }
    await db.from('packaging_plans').update({ input_data: merged }).eq('id', id)
  }

  return NextResponse.json({ success: true })
}
