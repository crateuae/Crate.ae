/**
 * GET /api/admin/ga?range=28
 * Google Analytics 4 (Data API) — reuses the GSC service account.
 *
 * Required env vars:
 *   GSC_CREDENTIALS_JSON  – the same service-account JSON used for GSC
 *   GA4_PROPERTY_ID       – numeric GA4 property id (e.g. 412345678)
 *
 * Setup: in GA4 → Admin → Property Access Management, grant the service-account
 * email "Viewer", and add the analytics scope (done below).
 */
import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

function getAuth() {
  const raw = process.env.GSC_CREDENTIALS_JSON
  if (!raw) throw new Error('GSC_CREDENTIALS_JSON not set')
  return new google.auth.GoogleAuth({
    credentials: JSON.parse(raw),
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  })
}

export async function GET(req: NextRequest) {
  try {
    const propertyId = process.env.GA4_PROPERTY_ID
    if (!propertyId) return NextResponse.json({ error: 'GA4_PROPERTY_ID not set', configured: false }, { status: 200 })

    const range = parseInt(new URL(req.url).searchParams.get('range') ?? '28')
    const auth = getAuth()
    const client = await auth.getClient()
    const ga = google.analyticsdata({ version: 'v1beta', auth: client as never })
    const property = `properties/${propertyId}`
    const dateRanges = [{ startDate: `${range}daysAgo`, endDate: 'today' }]
    const metrics = [{ name: 'activeUsers' }, { name: 'screenPageViews' }, { name: 'sessions' }]

    const [summary, topPages] = await Promise.all([
      ga.properties.runReport({ property, requestBody: { dateRanges, metrics } }),
      ga.properties.runReport({
        property,
        requestBody: {
          dateRanges, metrics,
          dimensions: [{ name: 'pagePath' }],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: '15',
        },
      }),
    ])

    const sumRow = summary.data.rows?.[0]?.metricValues ?? []
    const totals = {
      users: Number(sumRow[0]?.value ?? 0),
      pageviews: Number(sumRow[1]?.value ?? 0),
      sessions: Number(sumRow[2]?.value ?? 0),
    }
    const pages = (topPages.data.rows ?? []).map(r => ({
      path: r.dimensionValues?.[0]?.value ?? '',
      users: Number(r.metricValues?.[0]?.value ?? 0),
      pageviews: Number(r.metricValues?.[1]?.value ?? 0),
      sessions: Number(r.metricValues?.[2]?.value ?? 0),
    }))

    return NextResponse.json({ configured: true, range, totals, pages })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'GA error', configured: true }, { status: 500 })
  }
}
