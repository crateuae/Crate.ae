import { createHmac } from 'crypto'

/**
 * Signed unsubscribe tokens — so an unsubscribe link cannot be forged and no
 * database lookup is needed to validate it. token = HMAC(email, secret).
 */
const SECRET = process.env.UNSUBSCRIBE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'crate-fallback-secret'
const SITE = 'https://www.crate.ae'

export function unsubToken(email: string): string {
  return createHmac('sha256', SECRET).update(email.trim().toLowerCase()).digest('hex').slice(0, 32)
}

export function verifyUnsub(email: string, token: string): boolean {
  const expected = unsubToken(email)
  // constant-ish comparison
  return token.length === expected.length && token === expected
}

/** One-click unsubscribe URL for an address. */
export function unsubUrl(email: string): string {
  const e = encodeURIComponent(email.trim().toLowerCase())
  return `${SITE}/api/unsubscribe?e=${e}&t=${unsubToken(email)}`
}

/**
 * Bilingual footer appended to every outreach email: unsubscribe link +
 * UAE business identity (both are legally required for commercial email).
 */
export function complianceFooter(email: string): string {
  const url = unsubUrl(email)
  return `
<table role="presentation" width="100%" style="margin-top:28px;border-top:1px solid #e5e7eb;padding-top:14px;font-family:Arial,sans-serif;font-size:11px;line-height:1.6;color:#9ca3af;">
  <tr><td dir="rtl" style="text-align:right;">
    Crate — منصة الاستيراد والتوريد · الإمارات العربية المتحدة · <a href="mailto:uae@crate.ae" style="color:#9ca3af;">uae@crate.ae</a><br/>
    وصلك هذا البريد لأن شركتك مسجّلة في نشاط تجاري ذي صلة. لإلغاء الاشتراك ووقف الرسائل نهائياً:
    <a href="${url}" style="color:#f97316;">إلغاء الاشتراك</a>
  </td></tr>
  <tr><td dir="ltr" style="text-align:left;padding-top:6px;">
    Crate — Import &amp; Supply Platform · United Arab Emirates · <a href="mailto:uae@crate.ae" style="color:#9ca3af;">uae@crate.ae</a><br/>
    You received this because your company is listed under a relevant trade activity.
    <a href="${url}" style="color:#f97316;">Unsubscribe</a> to stop all messages.
  </td></tr>
</table>`
}
