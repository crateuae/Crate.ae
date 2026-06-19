/**
 * GET /api/admin/gsc?range=28&type=page|query
 * Fetches Google Search Console data via Service Account.
 *
 * Required env vars:
 *   GSC_SERVICE_ACCOUNT_EMAIL  – service account email
 *   GSC_PRIVATE_KEY            – private key (-----BEGIN RSA PRIVATE KEY-----)
 *   GSC_SITE_URL               – e.g. https://www.crate.ae
 */
import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

function getAuth() {
  const email = process.env.GSC_SERVICE_ACCOUNT_EMAIL
  const key   = (process.env.GSC_PRIVATE_KEY ?? '').replace(/\\n/g, '\n')
  if (!email || !key) throw new Error('GSC_SERVICE_ACCOUNT_EMAIL or GSC_PRIVATE_KEY not set')
  const jwt = new google.auth.JWT()
  jwt.email  = email
  jwt.key    = key
  jwt.scopes = ['https://www.googleapis.com/auth/webmasters.readonly']
  return jwt
}

function dateStr(daysAgo: number) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const range    = parseInt(searchParams.get('range') ?? '28')
    const dim      = (searchParams.get('type') ?? 'query') as 'query' | 'page'
    const siteUrl  = process.env.GSC_SITE_URL ?? ''

    if (!siteUrl) return NextResponse.json({ error: 'GSC_SITE_URL not set' }, { status: 500 })

    const auth = getAuth()
    const sc   = google.searchconsole({ version: 'v1', auth })

    const endDate   = dateStr(3)    // GSC has ~3-day lag
    const startDate = dateStr(range + 3)

    const { data } = await sc.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: [dim],
        rowLimit: 500,
        dataState: 'final',
      },
    })

    const rows = (data.rows ?? []).map(r => ({
      key:         r.keys?.[0] ?? '',
      clicks:      r.clicks    ?? 0,
      impressions: r.impressions ?? 0,
      ctr:         Math.round((r.ctr ?? 0) * 1000) / 10,   // % with 1 decimal
      position:    Math.round((r.position ?? 0) * 10) / 10,
    }))

    // Quick-win score: high impressions, position 4-20, low CTR → big opportunity
    const quickWins = rows
      .filter(r => r.position >= 4 && r.position <= 20 && r.impressions > 50)
      .map(r => ({ ...r, opportunity: Math.round(r.impressions * (1 - r.ctr / 100)) }))
      .sort((a, b) => b.opportunity - a.opportunity)
      .slice(0, 50)

    return NextResponse.json({
      rows:       rows.slice(0, 200),
      quickWins,
      startDate,
      endDate,
      total: {
        clicks:      rows.reduce((s, r) => s + r.clicks, 0),
        impressions: rows.reduce((s, r) => s + r.impressions, 0),
        avgCtr:      rows.length ? Math.round(rows.reduce((s, r) => s + r.ctr, 0) / rows.length * 10) / 10 : 0,
        avgPos:      rows.length ? Math.round(rows.reduce((s, r) => s + r.position, 0) / rows.length * 10) / 10 : 0,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'GSC error'
    console.error('GSC API error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
