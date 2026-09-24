/**
 * GET /api/admin/integrations-check — READ-ONLY diagnostics for Google Search Console + GA4.
 * Behind the central /api/admin gate in proxy.ts (admin session only). Never returns secrets:
 * only env PRESENCE, the service-account e-mail (an identifier the owner must add to the
 * GSC/GA properties), the configured site URL, and aggregate numbers.
 * Answers, per stage: are the env vars set → does the credential parse → which GSC properties
 * can this service account see → does GSC_SITE_URL match one → sitemap status → 28-day totals
 * → GA4 totals → first-party visitors for the same window (bot cross-check).
 */
import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { adminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly', 'https://www.googleapis.com/auth/analytics.readonly']
const ymd = (d: Date) => d.toISOString().slice(0, 10)
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return ymd(d) }

function explain(msg: string, email?: string): string {
  const m = msg.toLowerCase()
  if (m.includes('sufficient permission') || m.includes('forbidden') || m.includes('403'))
    return `The service account has no access to this property. Add ${email ?? 'the service-account e-mail'} as a user (Search Console: Settings → Users and permissions; GA4: Admin → Property access management → Viewer).`
  if (m.includes('has not been used') || m.includes('is disabled') || m.includes('accessnotconfigured'))
    return 'The API is not enabled in the Google Cloud project of the service account (enable "Google Search Console API" and "Google Analytics Data API").'
  if (m.includes('invalid_grant') || m.includes('private key') || m.includes('pem') || m.includes('decoder'))
    return 'The credential JSON is malformed (check the private_key newlines were preserved when pasting into Vercel).'
  if (m.includes('unexpected token') || m.includes('json'))
    return 'GSC_CREDENTIALS_JSON is not valid JSON — paste the whole service-account file content.'
  if (m.includes('not found') || m.includes('404'))
    return 'Property not found for this account — check the site URL format (domain property = sc-domain:crate.ae, URL-prefix = https://www.crate.ae/).'
  return 'See the raw message.'
}

export async function GET() {
  const out: Record<string, unknown> = { checkedAt: new Date().toISOString() }
  const siteUrl = (process.env.GSC_SITE_URL ?? '').trim()
  const ga4 = (process.env.GA4_PROPERTY_ID ?? '').trim()
  const raw = process.env.GSC_CREDENTIALS_JSON

  out.env = { GSC_CREDENTIALS_JSON: !!raw, GSC_SITE_URL: siteUrl || null, GA4_PROPERTY_ID: ga4 ? 'set' : null }

  // ── credential ────────────────────────────────────────────────────────────
  let email: string | undefined
  let auth: InstanceType<typeof google.auth.GoogleAuth> | null = null
  if (!raw) { out.credential = { ok: false, problem: 'GSC_CREDENTIALS_JSON is not set on this deployment (set it, then REDEPLOY — env changes only apply to new deployments).' } }
  else {
    try {
      const creds = JSON.parse(raw)
      email = creds.client_email
      out.credential = { ok: true, serviceAccount: email ?? null, hasPrivateKey: typeof creds.private_key === 'string' && creds.private_key.includes('BEGIN'), project: creds.project_id ?? null }
      auth = new google.auth.GoogleAuth({ credentials: creds, scopes: SCOPES })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      out.credential = { ok: false, message: msg, problem: explain(msg) }
    }
  }

  // ── Search Console ────────────────────────────────────────────────────────
  if (auth) {
    const gsc: Record<string, unknown> = {}
    try {
      const client = await auth.getClient()
      const sc = google.searchconsole({ version: 'v1', auth: client as never })
      const sites = ((await sc.sites.list()).data.siteEntry ?? []).map(s => ({ siteUrl: s.siteUrl, permission: s.permissionLevel }))
      gsc.visibleProperties = sites
      gsc.configuredMatches = !!siteUrl && sites.some(s => s.siteUrl === siteUrl)
      if (!sites.length) gsc.problem = `This service account sees NO Search Console properties. ${explain('sufficient permission', email)}`
      else if (siteUrl && !gsc.configuredMatches) gsc.problem = `GSC_SITE_URL "${siteUrl}" is not one of the visible properties. Use one of them exactly as listed.`
      else if (!siteUrl) gsc.problem = 'GSC_SITE_URL is not set.'

      if (siteUrl && gsc.configuredMatches) {
        try {
          const sm = await sc.sitemaps.list({ siteUrl })
          gsc.sitemaps = (sm.data.sitemap ?? []).map(s => ({ path: s.path, lastSubmitted: s.lastSubmitted, lastDownloaded: s.lastDownloaded, pending: s.isPending, errors: s.errors, warnings: s.warnings }))
        } catch (e) { gsc.sitemapsError = e instanceof Error ? e.message : String(e) }
        try {
          const q = await sc.searchanalytics.query({ siteUrl, requestBody: { startDate: daysAgo(31), endDate: daysAgo(3), dataState: 'all' } })
          const r = q.data.rows?.[0]
          gsc.last28d = { clicks: r?.clicks ?? 0, impressions: r?.impressions ?? 0, note: r ? undefined : 'No rows yet — normal for a newly added property (data starts from verification and lags ~2–3 days).' }
        } catch (e) { const msg = e instanceof Error ? e.message : String(e); gsc.queryError = msg; gsc.problem = explain(msg, email) }
      }
    } catch (e) { const msg = e instanceof Error ? e.message : String(e); gsc.error = msg; gsc.problem = explain(msg, email) }
    out.searchConsole = gsc
  }

  // ── GA4 ───────────────────────────────────────────────────────────────────
  if (auth && ga4) {
    const g: Record<string, unknown> = {}
    try {
      const client = await auth.getClient()
      const ga = google.analyticsdata({ version: 'v1beta', auth: client as never })
      const rep = await ga.properties.runReport({ property: `properties/${ga4}`, requestBody: { dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }], metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }] } })
      const v = rep.data.rows?.[0]?.metricValues ?? []
      g.last30d = { users: Number(v[0]?.value ?? 0), sessions: Number(v[1]?.value ?? 0), pageviews: Number(v[2]?.value ?? 0) }
    } catch (e) { const msg = e instanceof Error ? e.message : String(e); g.error = msg; g.problem = explain(msg, email) }
    out.ga4 = g
  } else if (!ga4) out.ga4 = { problem: 'GA4_PROPERTY_ID is not set on this deployment.' }

  // ── first-party vs GA4 (bot cross-check) ──────────────────────────────────
  try {
    const since = new Date(Date.now() - 30 * 864e5).toISOString()
    const { data } = await adminClient().from('page_views').select('visitor_id').gte('created_at', since).limit(20000)
    const ids = new Set((data ?? []).map(r => r.visitor_id))
    out.firstParty30d = { views: data?.length ?? 0, uniqueVisitors: ids.size, note: 'Counts every JS-executing browser (bots included). Compare with ga4.last30d.users — GA4 filters known bots.' }
  } catch (e) { out.firstParty30d = { error: e instanceof Error ? e.message : String(e) } }

  return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } })
}
