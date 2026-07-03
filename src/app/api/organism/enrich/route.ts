/**
 * CONTACT ENRICHMENT — GET/POST /api/organism/enrich
 *
 * Fills email/phone/website for packaging suppliers (the hidden broker pool) that
 * the government registry left blank. Pipeline per company:
 *   1. Google Places Text Search  → place_id
 *   2. Google Places Details       → website + phone
 *   3. Fetch the website           → extract a contact email (regex)
 *   4. Store in provider_contacts (status='pending' → human bulk-verifies)
 *
 * SAFE BY DESIGN:
 *   - No-ops unless GOOGLE_PLACES_API_KEY is set (so it stays inactive until you
 *     activate the key — nothing is charged meanwhile).
 *   - status='pending': scraped emails are NOT auto-used; you bulk-verify batches
 *     in /dashboard/contacts before any campaign can send to them.
 *   - Small batch/run to stay under the 60s function limit + be rate-friendly.
 *   - Protected by CRON_SECRET.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } })
}

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  return req.headers.get('authorization') === `Bearer ${secret}` || req.nextUrl.searchParams.get('secret') === secret
}

const PLACES = 'https://maps.googleapis.com/maps/api/place'

async function placesLookup(name: string, key: string): Promise<{ website: string | null; phone: string | null } | null> {
  try {
    const search = await fetch(`${PLACES}/textsearch/json?query=${encodeURIComponent(name + ' Dubai UAE')}&region=ae&key=${key}`).then(r => r.json())
    const placeId = search?.results?.[0]?.place_id
    if (!placeId) return null
    const det = await fetch(`${PLACES}/details/json?place_id=${placeId}&fields=website,formatted_phone_number,international_phone_number&key=${key}`).then(r => r.json())
    const d = det?.result ?? {}
    return { website: d.website ?? null, phone: d.international_phone_number ?? d.formatted_phone_number ?? null }
  } catch { return null }
}

// Pull a contact email from a company website (homepage + /contact). Best-effort.
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi
const EMAIL_NOISE = /\.(png|jpe?g|gif|webp|svg)$|sentry|wixpress|example\.com|@sentry|godaddy|domain\.com/i

async function emailFromSite(website: string): Promise<string | null> {
  const origin = website.replace(/\/+$/, '')
  const pages = [origin, `${origin}/contact`, `${origin}/contact-us`, `${origin}/en/contact`]
  for (const url of pages) {
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 6000)
      const html = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 CrateBot' } }).then(r => r.ok ? r.text() : '')
      clearTimeout(t)
      const matches = [...(html.match(EMAIL_RE) ?? [])].map(e => e.toLowerCase()).filter(e => !EMAIL_NOISE.test(e))
      if (matches.length) {
        // prefer a role address on the site's own domain
        const host = new URL(origin).hostname.replace(/^www\./, '')
        const onDomain = matches.find(e => e.endsWith('@' + host)) ?? matches.find(e => /^(info|sales|contact|enquir|hello)/.test(e)) ?? matches[0]
        return onDomain
      }
    } catch { /* try next page */ }
  }
  return null
}

async function run(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) return NextResponse.json({ skipped: 'GOOGLE_PLACES_API_KEY not set — enrichment inactive (no charges)' })

  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? 15), 25)
  const supabase = db()

  // Candidate packaging suppliers (the hidden broker pool) with no contact yet.
  const { data: candidates } = await supabase
    .from('providers')
    .select('id, name_en')
    .or('category.eq.Food Packaging,type.eq.repackager')
    .eq('is_active', true)
    .limit(limit * 4)
  if (!candidates?.length) return NextResponse.json({ processed: 0, note: 'no candidates' })

  // Skip ones already enriched.
  const ids = candidates.map(c => c.id)
  const { data: existing } = await supabase.from('provider_contacts').select('provider_id').in('provider_id', ids)
  const done = new Set((existing ?? []).map((e: { provider_id: string }) => e.provider_id))
  const todo = candidates.filter(c => !done.has(c.id)).slice(0, limit)

  let emails = 0, phones = 0, processed = 0
  for (const c of todo) {
    processed++
    const place = await placesLookup(c.name_en, key)
    if (!place) continue
    const email = place.website ? await emailFromSite(place.website) : null
    if (place.website) await supabase.from('providers').update({ website: place.website }).eq('id', c.id)
    if (!email && !place.phone) continue
    if (email) emails++
    if (place.phone) phones++
    await supabase.from('provider_contacts').upsert({
      provider_id: c.id, email, phone: place.phone,
      source: 'places_api', consent: false, confidence: email ? 70 : 40,
      status: 'pending',   // human bulk-verifies before any send
    }, { onConflict: 'provider_id,email' })
  }

  return NextResponse.json({ ok: true, processed, emails_found: emails, phones_found: phones, remaining_hint: 'run again for the next batch' })
}

export async function GET(req: NextRequest) { return run(req) }
export async function POST(req: NextRequest) { return run(req) }
