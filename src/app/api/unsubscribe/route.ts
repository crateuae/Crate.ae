/**
 * GET /api/unsubscribe?e=<email>&t=<token>
 * One-click unsubscribe (List-Unsubscribe target). Adds the address to
 * email_suppressions so it is never emailed again. Returns a bilingual page.
 * Also accepts POST (RFC 8058 One-Click) with the same query params.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyUnsub } from '@/lib/campaigns/unsubscribe'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } })
}

function page(ok: boolean, email: string): string {
  const title_ar = ok ? 'تم إلغاء الاشتراك' : 'رابط غير صالح'
  const title_en = ok ? 'You have been unsubscribed' : 'Invalid link'
  const body_ar = ok
    ? `لن نرسل أي رسائل أخرى إلى ${email}. نعتذر عن أي إزعاج.`
    : 'رابط إلغاء الاشتراك غير صالح أو منتهي. تواصل معنا على uae@crate.ae.'
  const body_en = ok
    ? `We will no longer email ${email}. Sorry for any inconvenience.`
    : 'This unsubscribe link is invalid or expired. Contact us at uae@crate.ae.'
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title_en}</title>
  <style>body{font-family:Arial,'Segoe UI',sans-serif;background:#fff;color:#1f2430;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}
  .card{max-width:440px;padding:40px;text-align:center}.mark{width:56px;height:56px;border-radius:16px;background:${ok ? '#ecfdf5' : '#fff7ed'};color:${ok ? '#10b981' : '#f97316'};display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:28px}
  h1{font-size:20px;margin:0 0 6px}p{color:#6b7280;font-size:14px;line-height:1.7;margin:4px 0}a{color:#f97316;text-decoration:none}</style></head>
  <body><div class="card"><div class="mark">${ok ? '✓' : '!'}</div>
  <h1 dir="rtl">${title_ar}</h1><p dir="rtl">${body_ar}</p>
  <hr style="border:none;border-top:1px solid #f0eae4;margin:18px 0">
  <h1 dir="ltr">${title_en}</h1><p dir="ltr">${body_en}</p>
  <p style="margin-top:22px"><a href="https://www.crate.ae">www.crate.ae</a></p></div></body></html>`
}

async function suppress(email: string, token: string): Promise<boolean> {
  const clean = (email || '').trim().toLowerCase()
  if (!clean.includes('@') || !verifyUnsub(clean, token || '')) return false
  await db().from('email_suppressions')
    .upsert({ email: clean, reason: 'unsubscribe', source: 'one_click' }, { onConflict: 'email' })
  return true
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('e') ?? ''
  const token = req.nextUrl.searchParams.get('t') ?? ''
  const ok = await suppress(email, token)
  return new NextResponse(page(ok, email.trim().toLowerCase()), {
    status: ok ? 200 : 400, headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

// RFC 8058 one-click (mail clients POST to the List-Unsubscribe URL)
export async function POST(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('e') ?? ''
  const token = req.nextUrl.searchParams.get('t') ?? ''
  const ok = await suppress(email, token)
  return NextResponse.json({ ok })
}
