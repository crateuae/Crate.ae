/**
 * Multi-source UAE Trend Engine
 *
 * Sources (in order of reliability):
 *  1. SerpAPI Google Trends   — official API, geo=AE, uses quota
 *  2. SerpAPI Google Search   — result count + UAE retailer mentions
 *  3. First-party page_views  — our own Supabase visitor data
 *  4. FMCG catalog score      — always available, zero API cost
 *
 * Score formula (0–100):
 *   If SerpAPI Trends available : serp_trends×0.45 + serp_search×0.20 + fmcg×0.25 + pageviews×0.10
 *   If only search + fmcg       : serp_search×0.35 + fmcg×0.50 + pageviews×0.15
 *   Fallback (fmcg only)        : fmcg×0.80 + pageviews×0.20
 */

import { createClient } from '@supabase/supabase-js'

const SERPAPI_KEY = process.env.SERPAPI_KEY || ''

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TrendSources {
  serp_trends_score:   number | null   // 0-100 from SerpAPI Google Trends
  serp_search_score:   number | null   // 0-100 derived from search result signals
  fmcg_score:          number          // 0-100 from catalog (always present)
  pageviews_score:     number          // 0-100 normalized from our DB
  retailer_mentions:   string[]
  avg_price_aed:       number | null
  related_queries:     string[]
  is_available_uae:    boolean
}

export interface ComputedTrend {
  trend_score:       number
  uae_interest_pct:  number
  trend_direction:   'rising' | 'stable' | 'falling'
  gap_signal:        boolean
  sources:           TrendSources
  source_label:      string   // which sources contributed
  fetched_at:        string
}

// ─── Source 1: SerpAPI Google Trends ────────────────────────────────────────

async function fetchSerpTrends(keyword: string): Promise<{
  score: number
  direction: 'rising' | 'stable' | 'falling'
  related: string[]
} | null> {
  if (!SERPAPI_KEY) return null
  try {
    const url = new URL('https://serpapi.com/search')
    url.searchParams.set('engine', 'google_trends')
    url.searchParams.set('q', keyword)
    url.searchParams.set('geo', 'AE')
    url.searchParams.set('date', 'today 12-m')
    url.searchParams.set('data_type', 'TIMESERIES')
    url.searchParams.set('hl', 'en')
    url.searchParams.set('api_key', SERPAPI_KEY)

    const res = await fetch(url.toString(), { next: { revalidate: 86400 * 7 } })
    if (!res.ok) return null
    const data = await res.json()

    const timeline = data.interest_over_time?.timeline_data ?? []
    if (timeline.length === 0) return null

    const values: number[] = timeline.map((t: { values?: { extracted_value?: number }[] }) =>
      t.values?.[0]?.extracted_value ?? 0
    )

    const score = Math.round(values.reduce((a, b) => a + b, 0) / values.length)

    const recent = values.slice(-4).reduce((a, b) => a + b, 0) / 4
    const older  = values.slice(-12, -4).reduce((a, b) => a + b, 0) / 8
    let direction: 'rising' | 'stable' | 'falling' = 'stable'
    if (older > 0) {
      if (recent > older * 1.2) direction = 'rising'
      else if (recent < older * 0.8) direction = 'falling'
    } else if (recent > 15) direction = 'rising'

    // Related queries from SerpAPI trends
    const related: string[] = (data.related_queries?.rising ?? [])
      .slice(0, 5)
      .map((q: { query: string }) => q.query)

    return { score, direction, related }
  } catch {
    return null
  }
}

// ─── Source 2: SerpAPI Google Search signals ─────────────────────────────────

const UAE_RETAILERS = [
  'amazon.ae', 'noon.com', 'carrefouruae.com', 'luluhypermarket.com',
  'grandiose.ae', 'spinneys.com', 'waitrose.ae', 'grocerjy.com',
  'adnoc', 'talabat.com', 'instashop', 'viva', 'union coop',
]

async function fetchSerpSearch(keyword: string): Promise<{
  score: number
  is_available_uae: boolean
  retailer_mentions: string[]
  avg_price_aed: number | null
  related_searches: string[]
} | null> {
  if (!SERPAPI_KEY) return null
  try {
    const url = new URL('https://serpapi.com/search')
    url.searchParams.set('engine', 'google')
    url.searchParams.set('q', `${keyword} buy UAE price AED`)
    url.searchParams.set('gl', 'ae')
    url.searchParams.set('hl', 'en')
    url.searchParams.set('num', '10')
    url.searchParams.set('api_key', SERPAPI_KEY)

    const res = await fetch(url.toString(), { next: { revalidate: 86400 } })
    if (!res.ok) return null
    const data = await res.json()

    const organicResults = data.organic_results ?? []
    const retailers: string[] = []
    const prices: number[] = []

    for (const r of organicResults) {
      const link = (r.link || '').toLowerCase()
      const snippet = (r.snippet || '').toLowerCase()
      for (const retailer of UAE_RETAILERS) {
        if ((link.includes(retailer) || snippet.includes(retailer)) && !retailers.includes(retailer)) {
          retailers.push(retailer)
        }
      }
      const priceMatches = (r.snippet || '').match(/(\d+(?:\.\d+)?)\s*(?:AED|aed|درهم)/g) || []
      for (const m of priceMatches) {
        const n = parseFloat(m.replace(/[^0-9.]/g, ''))
        if (n > 0.5 && n < 5000) prices.push(n)
      }
    }

    const totalResults: number = data.search_information?.total_results || 0
    // Normalize result count to 0-40 score (40M+ results = max)
    const resultScore = Math.min(Math.round((Math.log10(Math.max(totalResults, 1)) / Math.log10(40_000_000)) * 40), 40)
    // Retailer presence adds up to 60 points
    const retailerScore = Math.min(retailers.length * 15, 60)
    const score = Math.min(resultScore + retailerScore, 100)

    const avg_price_aed = prices.length > 0
      ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length * 10) / 10
      : null

    const related_searches: string[] = (data.related_searches ?? [])
      .slice(0, 5)
      .map((s: { query: string }) => s.query)

    return {
      score,
      is_available_uae: retailers.length > 0 || totalResults > 5000,
      retailer_mentions: retailers,
      avg_price_aed,
      related_searches,
    }
  } catch {
    return null
  }
}

// ─── Source 3: First-party page_views ───────────────────────────────────────

async function fetchPageviewScore(productSlug: string): Promise<number> {
  try {
    const db = supabaseAdmin()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // Count page views for this product's URL path
    const { count } = await db
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .like('path', `%/products/${productSlug}%`)
      .gte('created_at', thirtyDaysAgo)

    const views = count ?? 0
    // Normalize: 0 views=0, 10 views=30, 50 views=70, 200+ views=100
    if (views === 0) return 0
    return Math.min(Math.round((Math.log10(views + 1) / Math.log10(200)) * 100), 100)
  } catch {
    return 0
  }
}

// ─── Compute final trend score ───────────────────────────────────────────────

function computeScore(sources: TrendSources): number {
  const { serp_trends_score, serp_search_score, fmcg_score, pageviews_score } = sources

  if (serp_trends_score !== null && serp_search_score !== null) {
    return Math.round(
      serp_trends_score  * 0.45 +
      serp_search_score  * 0.20 +
      fmcg_score         * 0.25 +
      pageviews_score    * 0.10
    )
  }
  if (serp_trends_score !== null) {
    return Math.round(
      serp_trends_score * 0.55 +
      fmcg_score        * 0.30 +
      pageviews_score   * 0.15
    )
  }
  if (serp_search_score !== null) {
    return Math.round(
      serp_search_score * 0.35 +
      fmcg_score        * 0.50 +
      pageviews_score   * 0.15
    )
  }
  // Fallback: FMCG + pageviews only
  return Math.round(fmcg_score * 0.80 + pageviews_score * 0.20)
}

function sourceLabel(s: TrendSources): string {
  const parts: string[] = []
  if (s.serp_trends_score !== null) parts.push('Google Trends')
  if (s.serp_search_score !== null) parts.push('Search Signals')
  if (s.pageviews_score > 0)        parts.push('Page Views')
  parts.push('FMCG Score')
  return parts.join(' + ')
}

// ─── Main export ─────────────────────────────────────────────────────────────

export interface TrendEngineInput {
  keyword: string
  productSlug: string
  fmcg_score: number
  /** Pass true to skip SerpAPI calls and only use FMCG + page views (quota conservation) */
  skipSerp?: boolean
}

export async function computeUAETrend(input: TrendEngineInput): Promise<ComputedTrend> {
  const { keyword, productSlug, fmcg_score, skipSerp = false } = input

  // Fetch all sources in parallel where possible
  const [serpTrends, serpSearch, pageviewsScore] = await Promise.all([
    skipSerp ? Promise.resolve(null) : fetchSerpTrends(keyword),
    skipSerp ? Promise.resolve(null) : fetchSerpSearch(keyword),
    fetchPageviewScore(productSlug),
  ])

  const sources: TrendSources = {
    serp_trends_score:  serpTrends?.score ?? null,
    serp_search_score:  serpSearch?.score ?? null,
    fmcg_score,
    pageviews_score:    pageviewsScore,
    retailer_mentions:  serpSearch?.retailer_mentions ?? [],
    avg_price_aed:      serpSearch?.avg_price_aed ?? null,
    related_queries:    [
      ...(serpTrends?.related ?? []),
      ...(serpSearch?.related_searches ?? []),
    ].slice(0, 8),
    is_available_uae:   serpSearch?.is_available_uae ?? false,
  }

  const trend_score    = computeScore(sources)
  const uae_interest   = Math.round(
    (sources.serp_trends_score ?? sources.serp_search_score ?? fmcg_score)
  )
  const trend_direction = serpTrends?.direction ?? 'stable'
  const gap_signal      = trend_score > 65 && trend_direction !== 'falling' && !sources.is_available_uae

  return {
    trend_score,
    uae_interest_pct: uae_interest,
    trend_direction,
    gap_signal,
    sources,
    source_label: sourceLabel(sources),
    fetched_at: new Date().toISOString(),
  }
}

// ─── Discovery helper (reuses same engine) ───────────────────────────────────

export interface DiscoveryResult {
  keyword: string
  trend_score: number
  uae_interest_pct: number
  trend_direction: 'rising' | 'stable' | 'falling'
  category_guess: string
  gap_score: number
  is_available_uae: boolean
}

import { allSeedTerms, adjacentTermsForCategory } from './fmcg-keyword-bank'

/**
 * The full category-partitioned seed pool (~190 real UAE FMCG import terms),
 * flattened to English search strings. This replaces the old 32-term static list
 * that made discovery starve (same terms every beat → all filtered as catalog
 * matches → nothing new sensed).
 */
export const UAE_FMCG_SEED_KEYWORDS: string[] = allSeedTerms().map(t => t.en)

/**
 * Deterministic day-rotating window over the seed pool.
 *
 * Each daily beat scans a DIFFERENT slice, so the organism keeps sensing new
 * terms instead of re-scanning the same head of the list forever. The slice is
 * chosen by day-of-year (mod number-of-slices) — fully deterministic, no stored
 * cursor required, and it wraps cleanly across the year.
 *
 * @param windowSize  how many terms this beat should scan (e.g. the discover `limit`)
 * @param date        the beat's date. In the live app pass `new Date()`. Callers
 *                    running inside a restricted workflow (no Date.now) can pass an
 *                    explicit date. Defaults to `new Date()`.
 * @param extraSeeds  learning-loop expansion terms (won/converting adjacents),
 *                    always scanned first so proven categories are never rotated out.
 */
export function rotatingSeedWindow(
  windowSize: number,
  date: Date = new Date(),
  extraSeeds: string[] = [],
): string[] {
  const pool = UAE_FMCG_SEED_KEYWORDS
  const size = Math.max(1, Math.min(windowSize, pool.length + extraSeeds.length))

  // Prepend expansion terms (deduped, capped so they never eat the whole window).
  const seen = new Set<string>()
  const priority: string[] = []
  for (const s of extraSeeds) {
    const k = s.trim().toLowerCase()
    if (k && !seen.has(k)) { seen.add(k); priority.push(s.trim()) }
    if (priority.length >= Math.floor(size / 2)) break   // leave room for rotation
  }

  // Day-of-year → which slice of the pool to scan this beat.
  const start = new Date(date.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86400000)
  const slices = Math.max(1, Math.ceil(pool.length / size))
  const sliceIndex = ((dayOfYear % slices) + slices) % slices
  const offset = sliceIndex * size

  const out: string[] = [...priority]
  for (let i = 0; out.length < size && i < pool.length; i++) {
    const term = pool[(offset + i) % pool.length]
    const k = term.toLowerCase()
    if (!seen.has(k)) { seen.add(k); out.push(term) }
  }
  return out
}

/**
 * Build learning-loop expansion seeds from the categories of the given winning/
 * converting opportunities. Same-category adjacent terms that are NOT already in
 * the bank — this is how proven demand grows the discovery surface.
 */
export function expansionSeedsFromCategories(categories: (string | null)[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const cat of categories) {
    for (const term of adjacentTermsForCategory(cat)) {
      const k = term.toLowerCase()
      if (!seen.has(k)) { seen.add(k); out.push(term) }
    }
  }
  return out
}

export function guessFMCGCategory(keyword: string): string {
  const k = keyword.toLowerCase()
  if (/drink|water|coffee|tea|juice|brew|shake|kombucha|energy/.test(k)) return 'Beverages'
  if (/snack|chip|bar|chocolate|popcorn|seaweed|jerky|trail/.test(k)) return 'Snacks & Confectionery'
  if (/milk|yogurt|cheese|butter|dairy|oat milk|almond milk/.test(k)) return 'Dairy Products'
  if (/oil|fat|ghee|truffle/.test(k)) return 'Oils & Fats'
  if (/sauce|ketchup|tahini|sriracha|hot sauce|salsa/.test(k)) return 'Spices & Sauces'
  if (/pasta|rice|noodle|quinoa|oat|cereal/.test(k)) return 'Cereals & Products'
  if (/protein|chia|hemp|flax|seed|organic/.test(k)) return 'Health & Organic'
  return 'General FMCG'
}
