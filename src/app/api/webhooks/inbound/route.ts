/**
 * POST /api/webhooks/inbound
 * Resend INBOUND webhook — a supplier replies to uae@crate.ae. We do BOTH:
 *   (a) store the reply in `inbound_emails` so it shows in the CRM dashboard, and
 *   (b) forward it to the owner's inbox (FORWARD_TO) via Resend.
 *
 * Security: Svix signature verified with RESEND_INBOUND_SECRET (the signing
 * secret of the INBOUND webhook — separate from the delivery webhook). Fails
 * closed. Not under /api/admin, so Resend can reach it.
 *
 * Setup: enable receiving for crate.ae in Resend, add the MX records it gives you
 * in Cloudflare, point the inbound webhook at this URL, and set RESEND_INBOUND_SECRET
 * + FORWARD_TO (+ optional RESEND_FROM_EMAIL) in Vercel.
 */
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { Resend } from 'resend'
import { adminClient } from '@/lib/supabase/admin'
import { cleanEmail } from '@/lib/email/normalize'

const FROM = process.env.RESEND_FROM_EMAIL ?? 'uae@crate.ae'

function verifySignature(payload: string, headers: Headers): boolean {
  const secret = process.env.RESEND_INBOUND_SECRET
  if (!secret) return false
  const id = headers.get('svix-id')
  const ts = headers.get('svix-timestamp')
  const sigHeader = headers.get('svix-signature')
  if (!id || !ts || !sigHeader) return false
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
  const expected = crypto.createHmac('sha256', key).update(`${id}.${ts}.${payload}`).digest('base64')
  return sigHeader.split(' ').some(part => {
    const sig = part.split(',')[1]
    if (!sig || sig.length !== expected.length) return false
    try { return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)) } catch { return false }
  })
}

// Resend inbound payloads vary by field name — read the common ones defensively.
function pick(o: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) { const v = o?.[k]; if (typeof v === 'string' && v.trim()) return v.trim() }
  return ''
}

export async function POST(req: NextRequest) {
  const payload = await req.text()
  if (!verifySignature(payload, req.headers)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  let evt: { type?: string; data?: Record<string, unknown> }
  try { evt = JSON.parse(payload) } catch { return NextResponse.json({ error: 'bad json' }, { status: 400 }) }
  const d = evt.data ?? {}

  const fromRaw = pick(d, ['from', 'sender', 'from_email'])
  const from = cleanEmail(fromRaw.match(/<(.+?)>/)?.[1] ?? fromRaw) ?? fromRaw
  const toArr = Array.isArray(d.to) ? d.to : []
  const to = pick({ to0: (toArr[0] as string) ?? '' }, ['to0']) || pick(d, ['to'])
  const subject = pick(d, ['subject'])
  const text = pick(d, ['text', 'text_body', 'plain'])
  const html = pick(d, ['html', 'html_body'])

  const supabase = adminClient()

  // (a) store — link to a known contact if the sender matches one.
  try {
    let providerId: string | null = null
    if (from) {
      const { data: c } = await supabase.from('provider_contacts').select('provider_id').eq('email', from).limit(1).maybeSingle()
      providerId = (c?.provider_id as string) ?? null
    }
    await supabase.from('inbound_emails').insert({
      from_email: from || null, to_email: to || null, subject: subject || null,
      body_text: text || null, body_html: html || null, provider_id: providerId, raw: d,
    })
  } catch (e) {
    console.error('[inbound] store:', e) // table may not exist yet — don't fail the forward
  }

  // (b) forward to the owner's inbox.
  const forwardTo = cleanEmail(process.env.FORWARD_TO)
  if (forwardTo && process.env.RESEND_API_KEY) {
    try {
      await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: `Crate Inbound <${FROM}>`,
        to: [forwardTo],
        replyTo: from || undefined,
        subject: `↩️ ${subject || '(no subject)'} — from ${from || 'unknown'}`,
        html: (html || `<pre>${(text || '').replace(/</g, '&lt;')}</pre>`)
          + `<hr><p style="color:#888;font-size:12px">Reply received at ${to || FROM} · from ${from}</p>`,
      })
    } catch (e) { console.error('[inbound] forward:', e) }
  }

  return NextResponse.json({ ok: true, from, subject })
}
