/**
 * Fire-and-forget admin notification (new RFQ, new self-claim, etc.). One place
 * instead of ad-hoc Resend calls scattered per route. No-op if Resend isn't
 * configured; never throws. Recipient = ADMIN_NOTIFY_EMAIL (fallback below).
 */
import { Resend } from 'resend'

const FROM = process.env.RESEND_FROM_EMAIL ?? 'uae@crate.ae'
const TO = process.env.ADMIN_NOTIFY_EMAIL ?? 'altubjimalik@gmail.com'

export async function notifyAdmin(subject: string, innerHtml: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  try {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: `Crate <${FROM}>`,
      to: [TO],
      subject,
      html: `<div dir="rtl" style="font-family:sans-serif;line-height:1.7;color:#1f2430">${innerHtml}</div>`,
    })
  } catch (e) {
    console.error('[notify-admin]', e)
  }
}
