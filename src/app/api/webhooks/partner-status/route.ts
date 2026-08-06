/**
 * POST /api/webhooks/partner-status
 * Art for Printing pushes a dropship order's status change here (HMAC-signed with
 * PARTNER_SHARED_SECRET). We update partner_orders.status and send the buyer a
 * transactional update email (tied to their own order — TDRA-safe, not marketing).
 * Not under /api/admin so AFP can reach it. Fails closed on a bad signature.
 */
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { adminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

export const runtime = 'nodejs'

function verify(raw: string, sig: string | null): boolean {
  const secret = process.env.PARTNER_SHARED_SECRET || ''
  if (secret.length < 16 || !sig) return false
  const expected = crypto.createHmac('sha256', secret).update(raw, 'utf8').digest('hex')
  const a = Buffer.from(expected, 'utf8'); const b = Buffer.from(String(sig), 'utf8')
  if (a.length !== b.length) return false
  try { return crypto.timingSafeEqual(a, b) } catch { return false }
}

const MSG: Record<string, { ar: string; en: string }> = {
  confirmed:     { ar: 'تم تأكيد طلبك وسيبدأ التنفيذ.', en: 'Your order is confirmed and will start production.' },
  in_production: { ar: 'طلبك قيد الإنتاج الآن.', en: 'Your order is now in production.' },
  ready:         { ar: 'طلبك جاهز.', en: 'Your order is ready.' },
  delivered:     { ar: 'تم تسليم طلبك. شكراً لتعاملك معنا!', en: 'Your order has been delivered. Thank you!' },
  cancelled:     { ar: 'تم إلغاء طلبك. لأي استفسار تواصل معنا.', en: 'Your order was cancelled. Contact us with any questions.' },
}

export async function POST(req: NextRequest) {
  const raw = await req.text()
  if (!verify(raw, req.headers.get('x-partner-signature'))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  let body: any
  try { body = JSON.parse(raw) } catch { return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 }) }

  const afpRef = String(body.afp_ref || '')
  const status = String(body.status || '')
  if (!afpRef || !status) return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 })

  const db = adminClient()
  const { data: order } = await db.from('partner_orders')
    .select('id, status, buyer_email, buyer_name').eq('afp_ref', afpRef).maybeSingle()
  if (!order) return NextResponse.json({ ok: true, note: 'no_matching_order' })

  if (order.status !== status) {
    await db.from('partner_orders').update({ status }).eq('id', order.id)
  }

  // Transactional buyer notification (best-effort).
  const msg = MSG[status]
  if (msg && order.buyer_email && process.env.RESEND_API_KEY) {
    try {
      await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: `Crate <${process.env.RESEND_FROM_EMAIL ?? 'uae@crate.ae'}>`,
        to: [order.buyer_email],
        subject: `تحديث طلب الملصقات ${afpRef} — Label order update`,
        html: `<div dir="rtl" style="font-family:sans-serif;line-height:1.7;color:#1f2430">
          <p>${order.buyer_name ? `مرحباً ${order.buyer_name}،` : 'مرحباً،'}</p>
          <p>${msg.ar}</p>
          <p style="color:#888" dir="ltr">${msg.en}</p>
          <p>رقم الطلب / Ref: <b>${afpRef}</b></p>
          <hr><p style="color:#999;font-size:12px">Crate · uae@crate.ae</p>
        </div>`,
      })
    } catch (e) { console.error('[partner-status] buyer notify:', e) }
  }

  return NextResponse.json({ ok: true, status })
}
