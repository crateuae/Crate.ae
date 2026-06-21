/**
 * POST /api/admin/campaigns/send  { campaign_id, test_email? }
 * Resolves the campaign audience and sends via Resend in batches of 100.
 * Records every send in campaign_sends and updates the campaign counters.
 * Supports {{name}} / {{company}} tokens in the body.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { resolveAudience, type AudienceSpec } from '@/lib/campaigns/audience'

export const maxDuration = 60

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } })
}
const FROM = process.env.RESEND_FROM_EMAIL ?? 'uae@crate.ae'
const MAX_PER_RUN = 500   // safety cap to stay within plan limits

function fill(html: string, r: { name: string | null; company: string | null }) {
  return html.replace(/\{\{name\}\}/g, r.name ?? '').replace(/\{\{company\}\}/g, r.company ?? '')
}

export async function POST(req: NextRequest) {
  const { campaign_id, test_email } = await req.json()
  if (!campaign_id) return NextResponse.json({ error: 'campaign_id required' }, { status: 400 })
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: 'email not configured' }, { status: 503 })

  const supabase = db()
  const resend = new Resend(process.env.RESEND_API_KEY)

  const { data: c } = await supabase.from('email_campaigns').select('*').eq('id', campaign_id).single()
  if (!c) return NextResponse.json({ error: 'campaign not found' }, { status: 404 })

  // Test send: one email to the admin, no DB writes.
  if (test_email) {
    const { error } = await resend.emails.send({
      from: `Crate <${FROM}>`, to: [test_email], subject: `[TEST] ${c.subject}`,
      html: fill(c.body_html, { name: 'تجربة', company: 'Crate' }),
    })
    return error
      ? NextResponse.json({ error: error.message }, { status: 500 })
      : NextResponse.json({ ok: true, test: true })
  }

  if (c.status === 'sent' || c.status === 'sending') {
    return NextResponse.json({ error: `campaign already ${c.status}` }, { status: 409 })
  }

  const audience = await resolveAudience(supabase, c.audience as AudienceSpec)
  const recipients = audience.slice(0, MAX_PER_RUN)
  if (recipients.length === 0) return NextResponse.json({ error: 'audience is empty' }, { status: 422 })

  await supabase.from('email_campaigns').update({ status: 'sending', total_recipients: recipients.length }).eq('id', campaign_id)

  let sent = 0
  const sendRows: { campaign_id: string; email: string; name: string | null; status: string; error: string | null }[] = []

  for (let i = 0; i < recipients.length; i += 100) {
    const batch = recipients.slice(i, i + 100)
    try {
      await resend.batch.send(batch.map(r => ({
        from: `Crate <${FROM}>`, to: [r.email], subject: c.subject, html: fill(c.body_html, r),
      })))
      for (const r of batch) { sent++; sendRows.push({ campaign_id, email: r.email, name: r.name, status: 'sent', error: null }) }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'batch failed'
      for (const r of batch) sendRows.push({ campaign_id, email: r.email, name: r.name, status: 'failed', error: msg })
    }
  }

  if (sendRows.length) await supabase.from('campaign_sends').insert(sendRows)
  await supabase.from('email_campaigns').update({
    status: sent > 0 ? 'sent' : 'failed', sent_count: sent, sent_at: new Date().toISOString(),
  }).eq('id', campaign_id)

  return NextResponse.json({ ok: true, sent, total: recipients.length })
}
