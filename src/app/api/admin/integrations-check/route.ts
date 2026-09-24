/**
 * GET /api/admin/integrations-check — READ-ONLY diagnostics for Google Search Console + GA4.
 * Behind the central /api/admin gate in proxy.ts (admin session only). Never returns secrets:
 * only env PRESENCE, the service-account e-mail (an identifier the owner must add to the
 * GSC/GA properties), the configured site URL, and aggregate numbers.
 * Answers, per stage: are the env vars set → does the credential parse → which GSC properties
 * can this service account see → does GSC_SITE_URL match one → sitemap status → 28-day totals
 * → GA4 totals → first-party visitors for the same window (bot cross-check).
 */
import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { adminClient } from '@/lib/supabase/admin'
import { GUIDE_PRODUCTS } from '@/lib/import-guides/products'

export const runtime = 'nodejs'
export const maxDuration = 60   // ?inspect=1 makes ~30 URL Inspection calls

// Snapshot taken 2026-09-24 (before the import guides / tools were indexed). ?detail=1 prints the deltas.
const BASELINE = { date: '2026-09-24', gscImpressions28d: 384, gscClicks28d: 8, organicSessions30d: 20, aiSessions30d: 7, uaeUsers30d: 14, usUsers30d: 80, ga4Users30d: 113, newPagesIndexed: 0 }

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

export async function GET(req: NextRequest) {
  // ?detail=1 adds compact breakdowns (top queries/pages/countries/devices/daily trend + GA4 channels/landing pages).
  const detail = new URL(req.url).searchParams.get('detail') === '1'
  // ?inspect=1 asks Google (URL Inspection API) whether the new tools/guides are indexed.
  const inspect = new URL(req.url).searchParams.get('inspect') === '1'
  const snap: { impressions?: number; clicks?: number; organic?: number; ai?: number; uae?: number; us?: number; ga4Users?: number; indexed?: number; inspected?: number } = {}
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
          snap.clicks = r?.clicks ?? 0; snap.impressions = r?.impressions ?? 0
          gsc.last28d = { clicks: r?.clicks ?? 0, impressions: r?.impressions ?? 0, note: r ? undefined : 'No rows yet — normal for a newly added property (data starts from verification and lags ~2–3 days).' }
        } catch (e) { const msg = e instanceof Error ? e.message : String(e); gsc.queryError = msg; gsc.problem = explain(msg, email) }

        if (detail) {
          const startDate = daysAgo(31), endDate = daysAgo(3)
          const by = async (d: 'query' | 'page' | 'country' | 'device' | 'date', keep: number) => {
            const r = await sc.searchanalytics.query({ siteUrl, requestBody: { startDate, endDate, dimensions: [d], rowLimit: 250, dataState: 'all' } })
            const rows = (r.data.rows ?? []).map(x => ({ k: x.keys?.[0] ?? '', clicks: x.clicks ?? 0, impr: x.impressions ?? 0, ctr: Math.round((x.ctr ?? 0) * 1000) / 10, pos: Math.round((x.position ?? 0) * 10) / 10 }))
            return d === 'date' ? rows.sort((a, b) => a.k.localeCompare(b.k)).map(x => `${x.k}:${x.impr}i/${x.clicks}c`) : rows.sort((a, b) => b.impr - a.impr).slice(0, keep)
          }
          for (const [name, d, n] of [['topQueries', 'query', 40], ['topPages', 'page', 30], ['countries', 'country', 8], ['devices', 'device', 4], ['daily', 'date', 40]] as const) {
            try { gsc[name] = await by(d, n) } catch (e) { gsc[name + 'Error'] = e instanceof Error ? e.message : String(e) }
          }
        }

        if (inspect) {
          const B = 'https://www.crate.ae'
          const tools = ['product-registration-uae', 'certificates-uae', 'landed-cost-uae']
          const urls = [
            ...['', '/compliance', '/import'].flatMap(p => ['en', 'ar'].map(l => `${B}/${l}${p}`)),
            ...tools.flatMap(t => ['en', 'ar'].map(l => `${B}/${l}/tools/${t}`)),
            ...GUIDE_PRODUCTS.map(g => `${B}/en/import/${g.slug}`),
          ]
          type Row = { url: string; verdict?: string | null; state?: string | null; lastCrawl?: string | null; canonical?: string | null; error?: string }
          const rows: Row[] = []
          const queue = [...urls]
          const worker = async () => {
            for (let u = queue.shift(); u; u = queue.shift()) {
              try {
                const r = await sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: u, siteUrl, languageCode: 'en-US' } })
                const ix = r.data.inspectionResult?.indexStatusResult
                rows.push({ url: u.replace(B, ''), verdict: ix?.verdict, state: ix?.coverageState, lastCrawl: ix?.lastCrawlTime, canonical: ix?.googleCanonical && ix.googleCanonical !== u ? ix.googleCanonical : undefined })
              } catch (e) { rows.push({ url: u.replace(B, ''), error: e instanceof Error ? e.message.slice(0, 120) : String(e) }) }
            }
          }
          await Promise.all(Array.from({ length: 6 }, worker))
          const byState: Record<string, number> = {}
          for (const r of rows) byState[r.state ?? (r.error ? 'ERROR' : '?')] = (byState[r.state ?? (r.error ? 'ERROR' : '?')] ?? 0) + 1
          snap.inspected = rows.length
          snap.indexed = rows.filter(r => r.verdict === 'PASS').length
          gsc.inspection = { inspected: rows.length, indexed: snap.indexed, byState, notIndexed: rows.filter(r => r.verdict !== 'PASS').sort((a, b) => a.url.localeCompare(b.url)) }
        }
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
      snap.ga4Users = Number(v[0]?.value ?? 0)
      g.last30d = { users: Number(v[0]?.value ?? 0), sessions: Number(v[1]?.value ?? 0), pageviews: Number(v[2]?.value ?? 0) }
      if (detail) {
        const run = async (dim: string, n: number) => {
          const r = await ga.properties.runReport({ property: `properties/${ga4}`, requestBody: { dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }], dimensions: [{ name: dim }], metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'engagedSessions' }], orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: String(n) } })
          return (r.data.rows ?? []).map(x => ({ k: x.dimensionValues?.[0]?.value ?? '', sessions: Number(x.metricValues?.[0]?.value ?? 0), users: Number(x.metricValues?.[1]?.value ?? 0), engaged: Number(x.metricValues?.[2]?.value ?? 0) }))
        }
        type GRow = { k: string; sessions: number; users: number; engaged: number }
        for (const [name, dim, n] of [['channels', 'sessionDefaultChannelGroup', 8], ['sources', 'sessionSource', 10], ['landingPages', 'landingPage', 15], ['countries', 'country', 6], ['devices', 'deviceCategory', 4]] as const) {
          try { g[name] = await run(dim, n) } catch (e) { g[name + 'Error'] = e instanceof Error ? e.message : String(e) }
        }
        const ch = (g.channels as GRow[] | undefined) ?? [], co = (g.countries as GRow[] | undefined) ?? []
        snap.organic = ch.find(c => c.k === 'Organic Search')?.sessions ?? 0
        snap.ai = ch.find(c => c.k === 'AI Assistant')?.sessions ?? 0
        snap.uae = co.find(c => c.k === 'United Arab Emirates')?.users ?? 0
        snap.us = co.find(c => c.k === 'United States')?.users ?? 0
      }
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

  if (detail || inspect) {
    const row = (metric: string, baseline: number, now: number | undefined) => ({ metric, baseline, now: now ?? null, delta: now == null ? null : now - baseline })
    out.vsBaseline = {
      baselineDate: BASELINE.date,
      rows: [
        row('GSC impressions (28d)', BASELINE.gscImpressions28d, snap.impressions),
        row('GSC clicks (28d)', BASELINE.gscClicks28d, snap.clicks),
        row('GA4 organic-search sessions (30d)', BASELINE.organicSessions30d, snap.organic),
        row('GA4 AI-assistant sessions (30d)', BASELINE.aiSessions30d, snap.ai),
        row('GA4 UAE users (30d)', BASELINE.uaeUsers30d, snap.uae),
        row('GA4 US users (30d) — the suspected bot cluster', BASELINE.usUsers30d, snap.us),
        row('GA4 total users (30d)', BASELINE.ga4Users30d, snap.ga4Users),
        row('New pages indexed (needs &inspect=1)', BASELINE.newPagesIndexed, snap.indexed),
      ],
      hint: snap.indexed == null ? 'Add &inspect=1 to ask Google which of the ~30 new tool/guide URLs are indexed.' : undefined,
    }
  }

  return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } })
}
