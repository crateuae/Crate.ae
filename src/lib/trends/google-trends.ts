/**
 * Google Trends fetcher — UAE (geo: AE) market focus
 * Uses unofficial google-trends-api npm package (no API key needed)
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const googleTrends = require('google-trends-api')

export interface TrendResult {
  keyword: string
  trend_score: number           // 0–100 avg interest over last 12 months
  uae_interest_pct: number      // 0–100 UAE regional interest
  trend_direction: 'rising' | 'stable' | 'falling'
  related_queries: string[]
  gap_signal: boolean           // true = trending but likely undersupplied in UAE
  fetched_at: string
}

export interface DiscoveryKeyword {
  keyword: string
  trend_score: number
  uae_interest_pct: number
  trend_direction: 'rising' | 'stable' | 'falling'
  category_guess: string
  gap_score: number
}

// Keywords per FMCG category for discovery scanning
const UAE_FMCG_SEED_KEYWORDS = [
  // Beverages
  'energy drink UAE', 'grape drink UAE', 'oat milk UAE', 'sparkling water UAE',
  'cold brew coffee UAE', 'kombucha UAE', 'protein shake UAE', 'coconut water UAE',
  // Snacks
  'protein bar UAE', 'rice cake UAE', 'seaweed snack UAE', 'nut butter UAE',
  'dark chocolate UAE', 'trail mix UAE', 'popcorn UAE', 'jerky snack UAE',
  // Dairy Alternatives
  'almond milk UAE', 'soy milk UAE', 'vegan cheese UAE', 'plant based yogurt UAE',
  // Condiments
  'hot sauce UAE', 'tahini UAE', 'sriracha UAE', 'truffle oil UAE',
  // Health / Organic
  'chia seeds UAE', 'quinoa UAE', 'hemp seeds UAE', 'flaxseed UAE',
  // International Products
  'korean food UAE', 'japanese snacks UAE', 'mexican sauce UAE', 'italian pasta UAE',
]

function parseTimeline(data: string): number[] {
  try {
    const parsed = JSON.parse(data)
    return parsed.default.timelineData.map((d: { value: number[] }) => d.value[0] || 0)
  } catch {
    return []
  }
}

function calcDirection(values: number[]): 'rising' | 'stable' | 'falling' {
  if (values.length < 8) return 'stable'
  const recent = values.slice(-4).reduce((a, b) => a + b, 0) / 4
  const older  = values.slice(-12, -4).reduce((a, b) => a + b, 0) / 8
  if (older === 0) return recent > 10 ? 'rising' : 'stable'
  if (recent > older * 1.2)  return 'rising'
  if (recent < older * 0.8)  return 'falling'
  return 'stable'
}

function calcScore(values: number[]): number {
  if (values.length === 0) return 0
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** Fetch Google Trends data for a single keyword in UAE */
export async function fetchUAETrend(keyword: string): Promise<TrendResult | null> {
  try {
    const endTime = new Date()
    const startTime = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)

    // Interest over time — UAE specific
    const timelineRaw = await googleTrends.interestOverTime({
      keyword,
      geo: 'AE',
      startTime,
      endTime,
      hl: 'en-US',
    })
    const values = parseTimeline(timelineRaw)
    const trend_score = calcScore(values)
    const trend_direction = calcDirection(values)

    await sleep(500) // be polite to Google

    // Related queries — UAE
    let related_queries: string[] = []
    try {
      const relatedRaw = await googleTrends.relatedQueries({ keyword, geo: 'AE', hl: 'en-US' })
      const relParsed = JSON.parse(relatedRaw)
      related_queries = (
        relParsed.default?.rankedList?.[0]?.rankedKeyword?.slice(0, 6) || []
      ).map((k: { query: string }) => k.query)
    } catch {
      // related queries optional
    }

    await sleep(300)

    // Regional interest — compare AE vs global (proxy for UAE demand)
    let uae_interest_pct = trend_score
    try {
      const regionalRaw = await googleTrends.interestByRegion({
        keyword,
        geo: 'AE',
        startTime,
        endTime,
        hl: 'en-US',
      })
      const regParsed = JSON.parse(regionalRaw)
      const geoData = regParsed.default?.geoMapData || []
      if (geoData.length > 0) {
        uae_interest_pct = geoData[0]?.value?.[0] || trend_score
      }
    } catch {
      // fall back to trend_score
    }

    return {
      keyword,
      trend_score,
      uae_interest_pct,
      trend_direction,
      related_queries,
      gap_signal: trend_score > 65 && trend_direction !== 'falling',
      fetched_at: new Date().toISOString(),
    }
  } catch (err) {
    console.error(`[google-trends] Failed for "${keyword}":`, err)
    return null
  }
}

/** Scan UAE FMCG seed keywords for new product discoveries */
export async function discoverUAETrends(limit = 20): Promise<DiscoveryKeyword[]> {
  const results: DiscoveryKeyword[] = []
  const keywords = UAE_FMCG_SEED_KEYWORDS.slice(0, limit)

  for (const keyword of keywords) {
    try {
      const trend = await fetchUAETrend(keyword)
      if (!trend) continue

      // Gap score: high trend + UAE interest = big opportunity
      const gap_score = Math.round(
        trend.trend_score * 0.5 +
        trend.uae_interest_pct * 0.3 +
        (trend.trend_direction === 'rising' ? 20 : trend.trend_direction === 'stable' ? 10 : 0)
      )

      if (trend.trend_score >= 30) {
        results.push({
          keyword,
          trend_score: trend.trend_score,
          uae_interest_pct: trend.uae_interest_pct,
          trend_direction: trend.trend_direction,
          category_guess: guessFMCGCategory(keyword),
          gap_score: Math.min(gap_score, 100),
        })
      }

      await sleep(800) // throttle between discovery calls
    } catch {
      continue
    }
  }

  return results.sort((a, b) => b.gap_score - a.gap_score)
}

function guessFMCGCategory(keyword: string): string {
  const k = keyword.toLowerCase()
  if (k.includes('drink') || k.includes('water') || k.includes('coffee') || k.includes('tea') || k.includes('juice') || k.includes('brew') || k.includes('shake')) return 'Beverages'
  if (k.includes('snack') || k.includes('chip') || k.includes('bar') || k.includes('chocolate') || k.includes('popcorn') || k.includes('seaweed') || k.includes('jerky')) return 'Snacks & Confectionery'
  if (k.includes('milk') || k.includes('yogurt') || k.includes('cheese') || k.includes('butter') || k.includes('dairy')) return 'Dairy Products'
  if (k.includes('oil') || k.includes('fat') || k.includes('ghee')) return 'Oils & Fats'
  if (k.includes('sauce') || k.includes('ketchup') || k.includes('tahini') || k.includes('sriracha') || k.includes('hot sauce')) return 'Spices & Sauces'
  if (k.includes('pasta') || k.includes('rice') || k.includes('noodle') || k.includes('quinoa') || k.includes('oat')) return 'Cereals & Products'
  if (k.includes('protein') || k.includes('chia') || k.includes('hemp') || k.includes('flax') || k.includes('seed')) return 'Health & Organic'
  return 'General FMCG'
}
