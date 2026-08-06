/**
 * GET /api/admin/crm — unified CRM overview across the whole contact graph.
 * Reads provider_contacts (all sources), provider activity counters, and the
 * suppression list into one payload so the dashboard can show how campaigns +
 * contacts + providers + public signals feed each other. Auth: under /api/admin
 * (proxy-gated). Every section is defensive — a missing column returns 0/[] rather
 * than failing the whole overview.
 */
import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { assessInboundRisk, htmlToText } from '@/lib/security/inbound-risk'

const SOURCES = ['self_claimed', 'admin_import', 'places_api', 'rfq_requester', 'provider_profile']
const STATUSES = ['pending', 'verified', 'rejected']

export async function GET() {
  const db = adminClient()

  const countPC = async (filter: Record<string, unknown>) => {
    try {
      let q = db.from('provider_contacts').select('*', { count: 'exact', head: true })
      for (const [k, v] of Object.entries(filter)) q = q.eq(k, v)
      const { count } = await q
      return count ?? 0
    } catch { return 0 }
  }

  const [total, consented, marketable, suppressions] = await Promise.all([
    countPC({}),
    countPC({ consent: true }),
    (async () => {
      try {
        const { count } = await db.from('provider_contacts')
          .select('*', { count: 'exact', head: true }).eq('status', 'verified').eq('consent', true)
        return count ?? 0
      } catch { return 0 }
    })(),
    (async () => {
      try {
        const { count } = await db.from('email_suppressions').select('*', { count: 'exact', head: true })
        return count ?? 0
      } catch { return 0 }
    })(),
  ])

  const bySource = Object.fromEntries(await Promise.all(SOURCES.map(async s => [s, await countPC({ source: s })])))
  const byStatus = Object.fromEntries(await Promise.all(STATUSES.map(async s => [s, await countPC({ status: s })])))

  const recent = await (async () => {
    try {
      const { data } = await db.from('provider_contacts')
        .select('email, source, status, consent, created_at, providers(name_en, slug)')
        .order('created_at', { ascending: false }).limit(20)
      return data ?? []
    } catch { return [] }
  })()

  const topProviders = await (async () => {
    try {
      const { data } = await db.from('providers')
        .select('name_en, slug, views_count, rfq_received_count, emails_count')
        .order('rfq_received_count', { ascending: false, nullsFirst: false }).limit(10)
      return data ?? []
    } catch { return [] }
  })()

  // Inbound supplier replies (empty [] if the table isn't set up yet). We surface a
  // PLAIN-TEXT preview + a phishing-risk assessment per message so the owner can
  // read the details safely (no HTML is ever sent to the browser).
  const inbound = await (async () => {
    try {
      const { data } = await db.from('inbound_emails')
        .select('id, from_email, to_email, subject, body_text, body_html, created_at, providers(name_en, slug)')
        .order('created_at', { ascending: false }).limit(15)
      return (data ?? []).map((m: any) => {
        const text = (m.body_text && String(m.body_text).trim())
          ? String(m.body_text)
          : (m.body_html ? htmlToText(String(m.body_html)) : '')
        return {
          id: m.id ?? null,
          from_email: m.from_email ?? null,
          to_email: m.to_email ?? null,
          subject: m.subject ?? null,
          created_at: m.created_at,
          providers: m.providers ?? null,
          body_preview: text.slice(0, 2000),
          risk: assessInboundRisk({ from_email: m.from_email, subject: m.subject, body: text }),
        }
      })
    } catch { return [] }
  })()

  return NextResponse.json({
    contacts: { total, consented, marketable, bySource, byStatus },
    suppressions,
    recent,
    topProviders,
    inbound,
  })
}
