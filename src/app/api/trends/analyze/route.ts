/**
 * POST /api/trends/analyze
 * Full multi-source product analysis for UAE import decision.
 *
 * Sources (run in parallel):
 *  1. Google Trends AE     — SerpAPI — interest 0-100, direction, change %
 *  2. Google Shopping UAE  — SerpAPI — listing count, price range AED
 *  3. Google Search UAE    — SerpAPI — result count, retailer mentions, Amazon/Noon check
 *  4. Reddit UAE/Dubai     — Free JSON — mention count, upvotes, sentiment
 *
 * Returns raw numbers (not percentages) + combined trading decision.
 */

import { NextRequest, NextResponse } from 'next/server'

const SERPAPI_KEY  = process.env.SERPAPI_KEY  || ''
const SERPAPI_BASE = 'https://serpapi.com/search'

function serpUrl(params: Record<string, string>) {
  const u = new URL(SERPAPI_BASE)
  Object.entries({ ...params, api_key: SERPAPI_KEY }).forEach(([k, v]) => u.searchParams.set(k, v))
  return u.toString()
}

// ─── Source types ────────────────────────────────────────────────────────────

export interface GoogleTrendsResult {
  interest_score:  number        // 0-100 Google's native scale
  peak_score:      number        // highest weekly value in 3 months
  direction:       'rising' | 'stable' | 'falling'
  change_pct:      number        // % change recent 4 weeks vs older 8 weeks
  weekly_values:   number[]      // raw timeline
  related_queries: string[]
}

export interface GoogleShoppingResult {
  listing_count:   number
  price_min_aed:   number | null
  price_max_aed:   number | null
  price_avg_aed:   number | null
  sellers:         string[]      // who's selling (amazon.ae, noon.com, ...)
  top_product:     string | null
  amazon_listings: number        // how many shopping results are from amazon.ae
  noon_listings:   number
}

export interface GoogleSearchResult {
  total_results:     number
  retailer_mentions: string[]
  price_mentions:    number[]    // raw AED prices found in snippets
  avg_price_aed:     number | null
  amazon_available:  boolean
  noon_available:    boolean
  top_snippet:       string | null
}

export interface RedditResult {
  mention_count:  number
  total_upvotes:  number
  sentiment:      'positive' | 'neutral' | 'negative'
  top_posts:      { title: string; score: number; subreddit: string; url: string }[]
}

export interface AnalysisSources {
  google_trends:   GoogleTrendsResult   | null
  google_shopping: GoogleShoppingResult | null
  google_search:   GoogleSearchResult   | null
  reddit:          RedditResult         | null
}

export interface DecisionFactor {
  factor_ar: string
  factor_en: string
  impact:    'positive' | 'neutral' | 'negative'
  data:      string
}

export interface TradeAnalysis {
  opportunity_score:         number   // 0-100
  market_gap:                boolean  // true = product not available in UAE
  estimated_retail_price_aed: number | null
  estimated_import_price_aed: number | null
  estimated_margin_pct:       number | null
  estimated_monthly_units:    string | null  // e.g. "200–500"
  estimated_capex_aed:        string | null  // e.g. "15,000–30,000"
  demand_level:    'high' | 'medium' | 'low'
  competition_level: 'high' | 'medium' | 'low'
  decision:        'strong_import' | 'investigate' | 'monitor' | 'skip'
  decision_factors: DecisionFactor[]
  recommendation_ar: string
  recommendation_en: string
}

export interface AnalyzeResponse {
  keyword:      string
  analyzed_at:  string
  sources_used: string[]
  sources:      AnalysisSources
  analysis:     TradeAnalysis
}

// ─── Source 1: Google Trends ─────────────────────────────────────────────────

async function fetchGoogleTrends(keyword: string): Promise<GoogleTrendsResult | null> {
  if (!SERPAPI_KEY) return null
  try {
    const res = await fetch(
      serpUrl({ engine: 'google_trends', q: keyword, geo: 'AE', date: 'today 3-m', data_type: 'TIMESERIES', hl: 'en' }),
      { next: { revalidate: 21600 } }
    )
    if (!res.ok) return null
    const data = await res.json()

    const timeline: { values?: { extracted_value?: number }[] }[] = data.interest_over_time?.timeline_data ?? []
    if (timeline.length === 0) return null

    const weekly_values = timeline.map(t => t.values?.[0]?.extracted_value ?? 0)
    const interest_score = Math.round(weekly_values.reduce((a, b) => a + b, 0) / weekly_values.length)
    const peak_score = Math.max(...weekly_values)

    const recent4 = weekly_values.slice(-4).reduce((a, b) => a + b, 0) / 4
    const older   = weekly_values.slice(0, -4)
    const older_avg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : 0
    const change_pct = older_avg > 0 ? Math.round(((recent4 - older_avg) / older_avg) * 100) : 0

    let direction: 'rising' | 'stable' | 'falling' = 'stable'
    if (older_avg > 5) {
      if (recent4 > older_avg * 1.18) direction = 'rising'
      else if (recent4 < older_avg * 0.82) direction = 'falling'
    } else if (recent4 > 20) direction = 'rising'

    const related_queries = [
      ...((data.related_queries?.rising ?? []) as { query: string }[]).slice(0, 4).map(q => q.query),
      ...((data.related_queries?.top    ?? []) as { query: string }[]).slice(0, 3).map(q => q.query),
    ].slice(0, 6)

    return { interest_score, peak_score, direction, change_pct, weekly_values, related_queries }
  } catch { return null }
}

// ─── Source 2: Google Shopping UAE ───────────────────────────────────────────

async function fetchGoogleShopping(keyword: string): Promise<GoogleShoppingResult | null> {
  if (!SERPAPI_KEY) return null
  try {
    const res = await fetch(
      serpUrl({ engine: 'google_shopping', q: keyword, gl: 'ae', hl: 'en', num: '20' }),
      { next: { revalidate: 21600 } }
    )
    if (!res.ok) return null
    const data = await res.json()

    const results: { price?: string; link?: string; source?: string; title?: string }[] = data.shopping_results ?? []
    const prices = results
      .map(r => parseFloat((r.price || '').replace(/[^0-9.]/g, '')))
      .filter(p => p > 0.5 && p < 50000)

    let amazon_listings = 0
    let noon_listings = 0
    const sellersSet = new Set<string>()

    for (const r of results) {
      const link = (r.link || '').toLowerCase()
      const src  = (r.source || '').toLowerCase()
      if (link.includes('amazon') || src.includes('amazon')) { amazon_listings++; sellersSet.add('amazon.ae') }
      if (link.includes('noon')   || src.includes('noon'))   { noon_listings++;   sellersSet.add('noon.com') }
      if (link.includes('carrefour')) sellersSet.add('carrefour.ae')
      if (link.includes('lulu'))      sellersSet.add('luluhypermarket.com')
      if (link.includes('spinneys'))  sellersSet.add('spinneys.com')
      if (link.includes('waitrose'))  sellersSet.add('waitrose.ae')
      if (link.includes('grandiose')) sellersSet.add('grandiose.ae')
    }

    return {
      listing_count: results.length,
      price_min_aed: prices.length > 0 ? Math.min(...prices) : null,
      price_max_aed: prices.length > 0 ? Math.max(...prices) : null,
      price_avg_aed: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null,
      sellers:        Array.from(sellersSet),
      top_product:    results[0]?.title ?? null,
      amazon_listings,
      noon_listings,
    }
  } catch { return null }
}

// ─── Source 3: Google Search UAE ─────────────────────────────────────────────

const UAE_RETAILERS = [
  'amazon.ae', 'noon.com', 'carrefouruae.com', 'luluhypermarket.com',
  'grandiose.ae', 'spinneys.com', 'waitrose.ae', 'talabat.com',
  'instashop', 'grocerjy.com', 'adnoc', 'union coop', 'viva supermarket',
]

async function fetchGoogleSearch(keyword: string): Promise<GoogleSearchResult | null> {
  if (!SERPAPI_KEY) return null
  try {
    const res = await fetch(
      serpUrl({ engine: 'google', q: `${keyword} UAE price AED buy`, gl: 'ae', hl: 'en', num: '10' }),
      { next: { revalidate: 21600 } }
    )
    if (!res.ok) return null
    const data = await res.json()

    const organic: { link?: string; snippet?: string; title?: string }[] = data.organic_results ?? []
    const total_results: number = parseInt(String(data.search_information?.total_results || '0').replace(/,/g, '')) || 0

    const retailer_mentions: string[] = []
    const price_mentions: number[] = []

    for (const r of organic) {
      const link    = (r.link || '').toLowerCase()
      const snippet = (r.snippet || '').toLowerCase()
      for (const ret of UAE_RETAILERS) {
        const key = ret.replace('.', '').replace(' ', '')
        if ((link.includes(key) || snippet.includes(ret)) && !retailer_mentions.includes(ret)) {
          retailer_mentions.push(ret)
        }
      }
      const priceMatches = (r.snippet || '').match(/[\d,]+(?:\.\d+)?\s*(?:AED|aed|درهم)/g) || []
      for (const m of priceMatches) {
        const n = parseFloat(m.replace(/[^0-9.]/g, ''))
        if (n > 0.5 && n < 5000) price_mentions.push(n)
      }
    }

    const amazon_available = retailer_mentions.some(r => r.includes('amazon'))
    const noon_available   = retailer_mentions.some(r => r.includes('noon'))
    const avg_price_aed    = price_mentions.length > 0
      ? Math.round(price_mentions.reduce((a, b) => a + b, 0) / price_mentions.length * 10) / 10
      : null

    return {
      total_results,
      retailer_mentions,
      price_mentions,
      avg_price_aed,
      amazon_available,
      noon_available,
      top_snippet: organic[0]?.snippet?.slice(0, 150) ?? null,
    }
  } catch { return null }
}

// ─── Source 4: Reddit UAE (free — no API key) ────────────────────────────────

async function fetchReddit(keyword: string): Promise<RedditResult | null> {
  try {
    const q = encodeURIComponent(`${keyword} UAE OR Dubai OR "الإمارات"`)
    const res = await fetch(
      `https://www.reddit.com/search.json?q=${q}&sort=relevance&limit=15&t=year`,
      { headers: { 'User-Agent': 'crate-market-research/1.0' }, next: { revalidate: 43200 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const posts = (data.data?.children ?? []).map((c: { data: unknown }) => c.data as {
      title: string; selftext: string; score: number; subreddit: string; permalink: string
    })

    const mention_count = posts.length
    const total_upvotes = posts.reduce((a, p) => a + (p.score || 0), 0)

    const posWords = ['love', 'amazing', 'great', 'where to buy', 'available', 'recommend', 'looking for', 'want', 'trying to find']
    const negWords = ['scam', 'fake', 'terrible', 'avoid', 'bad', 'expired', 'counterfeit']
    let pos = 0; let neg = 0
    for (const p of posts) {
      const txt = `${p.title} ${p.selftext}`.toLowerCase()
      if (posWords.some(w => txt.includes(w))) pos++
      if (negWords.some(w => txt.includes(w))) neg++
    }
    const sentiment = pos > neg ? 'positive' : neg > pos ? 'negative' : 'neutral'

    const top_posts = posts.slice(0, 3).map(p => ({
      title: p.title,
      score: p.score,
      subreddit: p.subreddit,
      url: `https://reddit.com${p.permalink}`,
    }))

    return { mention_count, total_upvotes, sentiment, top_posts }
  } catch { return null }
}

// ─── Combined trading analysis ────────────────────────────────────────────────

function buildAnalysis(keyword: string, s: AnalysisSources): TradeAnalysis {
  // ── Price estimation (weighted average of all available sources)
  const rawPrices = [
    s.google_shopping?.price_avg_aed,
    s.google_search?.avg_price_aed,
  ].filter((p): p is number => p != null && p > 0)

  const estimated_retail_price_aed = rawPrices.length > 0
    ? Math.round(rawPrices.reduce((a, b) => a + b, 0) / rawPrices.length)
    : null

  // Import cost: typically 50–65% of UAE retail for FMCG
  const estimated_import_price_aed = estimated_retail_price_aed
    ? Math.round(estimated_retail_price_aed * 0.57)
    : null

  const estimated_margin_pct = estimated_retail_price_aed && estimated_import_price_aed
    ? Math.round(((estimated_retail_price_aed - estimated_import_price_aed) / estimated_retail_price_aed) * 100)
    : null

  // ── Market gap detection
  const amazon_gap   = (s.google_shopping?.amazon_listings ?? 0) === 0 && !(s.google_search?.amazon_available)
  const noon_gap     = (s.google_shopping?.noon_listings   ?? 0) === 0 && !(s.google_search?.noon_available)
  const listing_count = s.google_shopping?.listing_count ?? 0
  const market_gap   = amazon_gap && noon_gap && listing_count < 5

  // ── Demand & competition levels
  const trend_score = s.google_trends?.interest_score ?? 0
  const demand_level: 'high' | 'medium' | 'low' =
    trend_score >= 60 ? 'high' : trend_score >= 30 ? 'medium' : 'low'
  const competition_level: 'high' | 'medium' | 'low' =
    listing_count > 25 ? 'high' : listing_count > 8 ? 'medium' : 'low'

  // ── Opportunity score (0–100)
  let opp = 0

  // Google Trends component (max 30)
  opp += Math.min(trend_score * 0.30, 30)

  // Market gap component (max 25)
  if (market_gap) opp += 25
  else opp += Math.max(0, 25 - listing_count * 1.5)

  // Amazon gap bonus (max 15)
  if (amazon_gap) opp += 15
  else opp += Math.max(0, 15 - (s.google_shopping?.amazon_listings ?? 0) * 3)

  // Reddit social proof (max 12)
  const reddit_mentions = s.reddit?.mention_count ?? 0
  opp += Math.min(reddit_mentions * 2, 12)
  if (s.reddit?.sentiment === 'positive') opp += 3

  // Rising trend bonus (max 10)
  if (s.google_trends?.direction === 'rising') {
    const changePct = s.google_trends.change_pct
    opp += changePct > 50 ? 10 : changePct > 20 ? 7 : 4
  }

  // Search volume bonus (max 8)
  const totalResults = s.google_search?.total_results ?? 0
  if (totalResults > 5_000_000) opp += 8
  else if (totalResults > 1_000_000) opp += 5
  else if (totalResults > 100_000) opp += 2

  const opportunity_score = Math.min(Math.round(opp), 100)

  // ── Decision
  const decision =
    opportunity_score >= 75 ? 'strong_import' :
    opportunity_score >= 58 ? 'investigate'   :
    opportunity_score >= 40 ? 'monitor'        : 'skip'

  // ── Estimated volume & capex (rough FMCG heuristics)
  const estimated_monthly_units =
    demand_level === 'high'   ? '500 – 1,500 وحدة/متجر/شهر' :
    demand_level === 'medium' ? '100 – 500 وحدة/متجر/شهر'   :
                                '20 – 100 وحدة/متجر/شهر'

  const estimated_capex_aed =
    demand_level === 'high'   ? '30,000 – 60,000 AED' :
    demand_level === 'medium' ? '15,000 – 30,000 AED' :
                                '5,000 – 15,000 AED'

  // ── Decision factors
  const factors: DecisionFactor[] = []

  if (trend_score >= 60)
    factors.push({ factor_ar: 'طلب عالٍ في Google Trends', factor_en: 'High Google Trends demand', impact: 'positive', data: `${trend_score}/100` })
  else if (trend_score >= 30)
    factors.push({ factor_ar: 'طلب متوسط في Google Trends', factor_en: 'Medium demand', impact: 'neutral', data: `${trend_score}/100` })
  else
    factors.push({ factor_ar: 'طلب منخفض في Google Trends', factor_en: 'Low demand', impact: 'negative', data: `${trend_score}/100` })

  if (s.google_trends?.direction === 'rising')
    factors.push({ factor_ar: 'اتجاه صاعد', factor_en: 'Rising trend', impact: 'positive', data: `+${s.google_trends.change_pct}% آخر 3 أشهر` })
  else if (s.google_trends?.direction === 'falling')
    factors.push({ factor_ar: 'اتجاه هابط', factor_en: 'Falling trend', impact: 'negative', data: `${s.google_trends?.change_pct}% آخر 3 أشهر` })

  if (amazon_gap)
    factors.push({ factor_ar: 'غير متوفر في Amazon.ae', factor_en: 'Not on Amazon.ae', impact: 'positive', data: 'فجوة سوقية واضحة ⚡' })
  else
    factors.push({ factor_ar: 'متوفر في Amazon.ae', factor_en: 'Available on Amazon.ae', impact: 'negative', data: `${s.google_shopping?.amazon_listings ?? '?'} منتج` })

  if (noon_gap)
    factors.push({ factor_ar: 'غير متوفر في Noon.com', factor_en: 'Not on Noon.com', impact: 'positive', data: 'فجوة إضافية' })

  if (listing_count > 20)
    factors.push({ factor_ar: 'منافسة عالية في السوق', factor_en: 'High market competition', impact: 'negative', data: `${listing_count} عرض في Google Shopping` })
  else if (listing_count > 5)
    factors.push({ factor_ar: 'منافسة متوسطة', factor_en: 'Medium competition', impact: 'neutral', data: `${listing_count} عرض في Google Shopping` })
  else
    factors.push({ factor_ar: 'منافسة منخفضة', factor_en: 'Low competition', impact: 'positive', data: `${listing_count} عرض فقط في Google Shopping` })

  if (reddit_mentions >= 8)
    factors.push({ factor_ar: 'طلب عضوي قوي على Reddit', factor_en: 'Strong organic Reddit demand', impact: 'positive', data: `${reddit_mentions} ذكر، ${s.reddit?.total_upvotes} تفاعل` })
  else if (reddit_mentions >= 3)
    factors.push({ factor_ar: 'ذكر على Reddit', factor_en: 'Reddit mentions', impact: 'neutral', data: `${reddit_mentions} ذكر` })

  if (estimated_margin_pct && estimated_margin_pct >= 40)
    factors.push({ factor_ar: 'هامش ربح مرتفع', factor_en: 'High profit margin', impact: 'positive', data: `~${estimated_margin_pct}% متوقع` })
  else if (estimated_margin_pct && estimated_margin_pct >= 25)
    factors.push({ factor_ar: 'هامش ربح معقول', factor_en: 'Reasonable margin', impact: 'neutral', data: `~${estimated_margin_pct}% متوقع` })
  else if (estimated_margin_pct)
    factors.push({ factor_ar: 'هامش ربح ضعيف', factor_en: 'Low margin', impact: 'negative', data: `~${estimated_margin_pct}% متوقع` })

  const recommendation_map = {
    strong_import: { ar: '⭐ استوردها الآن — فرصة قوية وفجوة واضحة في السوق الإماراتي', en: '⭐ Import now — strong opportunity with a clear UAE market gap' },
    investigate:   { ar: '🔍 تستحق الدراسة المعمّقة — راجع التوزيع والتسجيل قبل القرار', en: '🔍 Worth a deep dive — review distribution & registration before committing' },
    monitor:       { ar: '👀 راقب 3 أشهر — الطلب غير مؤكد، انتظر مزيداً من البيانات',  en: '👀 Monitor for 3 months — demand uncertain, wait for more data' },
    skip:          { ar: '⏭️ لا يستحق حالياً — الطلب منخفض أو المنافسة عالية جداً',      en: '⏭️ Skip for now — low demand or too much competition' },
  }

  return {
    opportunity_score,
    market_gap,
    estimated_retail_price_aed,
    estimated_import_price_aed,
    estimated_margin_pct,
    estimated_monthly_units,
    estimated_capex_aed,
    demand_level,
    competition_level,
    decision,
    decision_factors: factors,
    recommendation_ar: recommendation_map[decision].ar,
    recommendation_en: recommendation_map[decision].en,
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const keyword = (body.keyword || '').trim()
  if (!keyword) return NextResponse.json({ error: 'keyword required' }, { status: 400 })

  // All sources run in parallel — failures are isolated
  const [trends, shopping, search, reddit] = await Promise.allSettled([
    fetchGoogleTrends(keyword),
    fetchGoogleShopping(keyword),
    fetchGoogleSearch(keyword),
    fetchReddit(keyword),
  ])

  const sources: AnalysisSources = {
    google_trends:   trends.status   === 'fulfilled' ? trends.value   : null,
    google_shopping: shopping.status === 'fulfilled' ? shopping.value : null,
    google_search:   search.status   === 'fulfilled' ? search.value   : null,
    reddit:          reddit.status   === 'fulfilled' ? reddit.value   : null,
  }

  const sources_used = Object.entries(sources)
    .filter(([, v]) => v !== null)
    .map(([k]) => k)

  const analysis = buildAnalysis(keyword, sources)

  return NextResponse.json({
    keyword,
    analyzed_at: new Date().toISOString(),
    sources_used,
    sources,
    analysis,
  } satisfies AnalyzeResponse)
}
