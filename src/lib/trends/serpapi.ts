/**
 * SerpAPI integration — UAE market availability check
 * Free plan: 100 searches/month
 * Used for: checking if a product is available/sold in UAE
 */

export interface UAEAvailabilityResult {
  keyword: string
  is_available_uae: boolean
  retailer_mentions: string[]   // e.g. ["Amazon.ae", "Noon", "Carrefour"]
  price_mentions: number[]      // AED prices found in search results
  avg_price_aed: number | null
  result_count: number
  organic_count: number
}

export interface SerpKeywordData {
  keyword: string
  monthly_searches: number | null
  competition: 'LOW' | 'MEDIUM' | 'HIGH' | null
  cpc_usd: number | null
}

const SERPAPI_KEY = process.env.SERPAPI_KEY || ''

const UAE_RETAILERS = [
  'amazon.ae', 'noon.com', 'carrefouruae.com', 'luluhypermarket.com',
  'grandiose.ae', 'spinneys.com', 'waitrose.ae', 'grocerjy.com',
  'adnoc oasis', 'mamzar', 'viva supermarket', 'union coop',
]

/** Check if a product/keyword is available in UAE retail */
export async function checkUAEAvailability(keyword: string): Promise<UAEAvailabilityResult> {
  if (!SERPAPI_KEY) {
    return {
      keyword,
      is_available_uae: false,
      retailer_mentions: [],
      price_mentions: [],
      avg_price_aed: null,
      result_count: 0,
      organic_count: 0,
    }
  }

  const searchQuery = `${keyword} buy UAE price AED`
  const url = new URL('https://serpapi.com/search')
  url.searchParams.set('engine', 'google')
  url.searchParams.set('q', searchQuery)
  url.searchParams.set('gl', 'ae')          // UAE
  url.searchParams.set('hl', 'en')
  url.searchParams.set('num', '10')
  url.searchParams.set('api_key', SERPAPI_KEY)

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 86400 } }) // cache 24h
    if (!res.ok) throw new Error(`SerpAPI ${res.status}`)
    const data = await res.json()

    const organicResults = data.organic_results || []
    const retailers: string[] = []
    const prices: number[] = []

    for (const result of organicResults) {
      const link = (result.link || '').toLowerCase()
      const snippet = (result.snippet || '').toLowerCase()

      // Check which retailers mention this product
      for (const retailer of UAE_RETAILERS) {
        if (link.includes(retailer) || snippet.includes(retailer)) {
          if (!retailers.includes(retailer)) retailers.push(retailer)
        }
      }

      // Extract price mentions (AED)
      const priceMatches = (result.snippet || '').match(/(\d+(?:\.\d+)?)\s*(?:AED|aed|درهم)/g) || []
      for (const match of priceMatches) {
        const num = parseFloat(match.replace(/[^0-9.]/g, ''))
        if (num > 0.5 && num < 5000) prices.push(num)
      }
    }

    const avg_price_aed = prices.length > 0
      ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length * 10) / 10
      : null

    return {
      keyword,
      is_available_uae: retailers.length > 0 || (data.search_information?.total_results || 0) > 500,
      retailer_mentions: retailers,
      price_mentions: prices,
      avg_price_aed,
      result_count: data.search_information?.total_results || 0,
      organic_count: organicResults.length,
    }
  } catch (err) {
    console.error('[serpapi] checkUAEAvailability failed:', err)
    return {
      keyword,
      is_available_uae: false,
      retailer_mentions: [],
      price_mentions: [],
      avg_price_aed: null,
      result_count: 0,
      organic_count: 0,
    }
  }
}

/** Get keyword volume estimates from SerpAPI related searches */
export async function getRelatedSearches(keyword: string): Promise<string[]> {
  if (!SERPAPI_KEY) return []

  const url = new URL('https://serpapi.com/search')
  url.searchParams.set('engine', 'google')
  url.searchParams.set('q', `${keyword} UAE`)
  url.searchParams.set('gl', 'ae')
  url.searchParams.set('hl', 'en')
  url.searchParams.set('api_key', SERPAPI_KEY)

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 86400 } })
    if (!res.ok) return []
    const data = await res.json()

    const relatedSearches: string[] = (data.related_searches || [])
      .slice(0, 8)
      .map((s: { query: string }) => s.query)

    return relatedSearches
  } catch {
    return []
  }
}

/** Monthly SerpAPI usage tracker — stored in env, not DB */
export function getRemainingCalls(): number {
  // SerpAPI provides usage via their account page
  // We track roughly: 30 product syncs + 10 discovery = 40/month
  return 100 - 40 // estimated remaining
}
