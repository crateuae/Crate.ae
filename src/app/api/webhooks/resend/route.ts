/**
 * POST /api/webhooks/resend
 * Resend delivery webhook. Turns hard bounces & spam complaints into
 * email_suppressions rows so we stop emailing dead/hostile addresses — closing
 * the gap where reason='bounce'/'complaint' were defined but never written.
 *
 * Security: verifies the Svix signature Resend signs every webhook with
 * (RESEND_WEBHOOK_SECRET = the "whsec_..." signing secret from the Resend
 * dashboard). Fails closed (401) if the secret is unset or the signature is bad.
 * Not under /api/admin, so the proxy auth gate doesn't block Resend's calls.
 */
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { adminClient } from '@/lib/supabase/admin'
import { cleanEmail } from '@/lib/email/normalize'

// Svix signature verification (Resend uses Svix under the hood).
function verifySignature(payload: string, headers: Headers): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) return false
  const id = headers.get('svix-id')
  const ts = headers.get('svix-timestamp')
  const sigHeader = headers.get('svix-signature')
  if (!id || !ts || !sigHeader) return false
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
  const expected = crypto.createHmac('sha256', key).update(`${id}.${ts}.${payload}`).digest('base64')
  // svix-signature is space-separated "v1,<base64sig>" pairs (key rotation).
  return sigHeader.split(' ').some(part => {
    const sig = part.split(',')[1]
    if (!sig || sig.length !== expected.length) return false
    try { return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)) } catch { return false }
  })
}

export async function POST(req: NextRequest) {
  const payload = await req.text()
  if (!verifySignature(payload, req.headers)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  let evt: { type?: string; data?: { to?: string[]; email?: string } }
  try { evt = JSON.parse(payload) } catch { return NextResponse.json({ error: 'bad json' }, { status: 400 }) }

  const reason = evt.type === 'email.bounced' ? 'bounce'
    : evt.type === 'email.complained' ? 'complaint'
    : null
  if (!reason) return NextResponse.json({ ok: true, ignored: evt.type }) // delivered/opened/clicked → nothing to do

  const email = cleanEmail(evt.data?.to?.[0] ?? evt.data?.email)
  if (!email) return NextResponse.json({ ok: true, skipped: 'no recipient' })

  try {
    await adminClient().from('email_suppressions').upsert(
      { email, reason, source: 'resend_webhook' },
      { onConflict: 'email' },
    )
  } catch (e) {
    console.error('[resend-webhook] suppress:', e)
    return NextResponse.json({ error: 'db' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, suppressed: email, reason })
}
