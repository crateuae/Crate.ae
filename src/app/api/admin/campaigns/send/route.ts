/**
 * POST /api/admin/campaigns/send
 *   { campaign_id, test_email? }           → regular send / test
 *   { campaign_id, only_new: true }        → send ONLY to recipients not in campaign_sends
 *   { campaign_id, only_new: false }       → resend to ALL recipients (even already-sent)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { resolveAudience, type AudienceSpec } from '@/lib/campaigns/audience'
import { complianceFooter, unsubUrl } from '@/lib/campaigns/unsubscribe'

export const maxDuration = 60

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } })
}
const FROM = process.env.RESEND_FROM_EMAIL ?? 'uae@crate.ae'
const MAX_PER_RUN = 500

function fill(html: string, r: { name: string | null; company: string | null }) {
  return html.replace(/\{\{name\}\}/g, r.name ?? '').replace(/\{\{company\}\}/g, r.company ?? '')
}

export async function POST(req: NextRequest) {
  const { campaign_id, test_email, only_new } = await req.json()
  if (!campaign_id) return NextResponse.json({ error: 'campaign_id required' }, { status: 400 })
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: 'email not configured' }, { status: 503 })

  const supabase = db()
  const resend = new Resend(process.env.RESEND_API_KEY)

  const { data: c } = await supabase.from('email_campaigns').select('*').eq('id', campaign_id).single()
  if (!c) return NextResponse.json({ error: 'campaign not found' }, { status: 404 })

  // Test send: one email, no DB writes
  if (test_email) {
    const { error } = await resend.emails.send({
      from: `Crate <${FROM}>`, to: [test_email], subject: `[TEST] ${c.subject}`,
      html: fill(c.body_html, { name: 'تجربة', company: 'Crate' }),
    })
    return error
      ? NextResponse.json({ error: error.message }, { status: 500 })
      : NextResponse.json({ ok: true, test: true })
  }

  // Block accidental double-send on first-time sends (not already sent + only_new not specified)
  if (only_new === undefined && (c.status === 'sent' || c.status === 'sending')) {
    return NextResponse.json({ error: `campaign already ${c.status}` }, { status: 409 })
  }

  // Resolve full audience
  const fullAudience = await resolveAudience(supabase, c.audience as AudienceSpec)

  let recipients = fullAudience.slice(0, MAX_PER_RUN)

  // only_new = true → exclude emails already successfully sent
  if (only_new === true) {
    const { data: alreadySent } = await supabase
      .from('campaign_sends')
      .select('email')
      .eq('campaign_id', campaign_id)
      .eq('status', 'sent')
    const sentSet = new Set((alreadySent ?? []).map((s: { email: string }) => s.email.toLowerCase()))
    recipients = recipients.filter(r => !sentSet.has(r.email.toLowerCase()))
  }

  // COMPLIANCE: never email a suppressed address (unsubscribed / bounced / complained).
  {
    const emails = recipients.map(r => r.email.toLowerCase())
    const { data: supp } = await supabase.from('email_suppressions').select('email').in('email', emails)
    const suppressed = new Set((supp ?? []).map((s: { email: string }) => s.email.toLowerCase()))
    if (suppressed.size) recipients = recipients.filter(r => !suppressed.has(r.email.toLowerCase()))
  }

  if (recipients.length === 0) return NextResponse.json({ error: 'no new recipients to send to' }, { status: 422 })

  // Update total_recipients to reflect the full audience size
  await supabase.from('email_campaigns').update({
    status: 'sending',
    total_recipients: fullAudience.length,
  }).eq('id', campaign_id)

  let sent = 0
  const sendRows: { campaign_id: string; email: string; name: string | null; status: string; error: string | null }[] = []

  for (let i = 0; i < recipients.length; i += 100) {
    const batch = recipients.slice(i, i + 100)
    try {
      await resend.batch.send(batch.map(r => ({
        from: `Crate <${FROM}>`, to: [r.email], subject: c.subject,
        html: fill(c.body_html, r) + complianceFooter(r.email),
        headers: {
          'List-Unsubscribe': `<${unsubUrl(r.email)}>, <mailto:uae@crate.ae?subject=unsubscribe>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      })))
      for (const r of batch) { sent++; sendRows.push({ campaign_id, email: r.email, name: r.name, status: 'sent', error: null }) }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'batch failed'
      for (const r of batch) sendRows.push({ campaign_id, email: r.email, name: r.name, status: 'failed', error: msg })
    }
  }

  if (sendRows.length) await supabase.from('campaign_sends').insert(sendRows)

  const newSentCount = (c.sent_count ?? 0) + sent
  await supabase.from('email_campaigns').update({
    status: newSentCount > 0 ? 'sent' : 'failed',
    sent_count: newSentCount,
    sent_at: new Date().toISOString(),
  }).eq('id', campaign_id)

  return NextResponse.json({ ok: true, sent, total: recipients.length })
}
