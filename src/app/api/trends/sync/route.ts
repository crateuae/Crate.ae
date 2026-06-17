/**
 * POST /api/trends/sync
 * Multi-source trend sync for all products.
 * Sources: SerpAPI Google Trends + SerpAPI Search + First-party pageviews + FMCG score
 *
 * Quota strategy (100 SerpAPI calls/month):
 *  - Each product = 2 calls (trends + search)
 *  - 30 products = 60 calls/month, leaving 40 for discovery
 *  - skipSerp=true syncs only FMCG + pageviews (0 quota cost)
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { PRODUCTS_CATALOG, getProductFMCG, getProductSlug } from '@/lib/data/products-catalog'
import { computeUAETrend } from '@/lib/trends/engine'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function productUUID(id: string) {
  const num = String(parseInt(id.replace('p', ''))).padStart(12, '0')
  return `prod-${id}-0000-0000-${num}`
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const slugFilter: string | null = body.slug || null
  const skipSerp: boolean = body.skip_serp === true   // true = use only FMCG + pageviews
  const maxProducts: number = body.max || 30

  const products = PRODUCTS_CATALOG
    .filter(p => p.is_active)
    .filter(p => !slugFilter || getProductSlug(p) === slugFilter)
    .slice(0, maxProducts)

  const results = {
    synced: 0,
    errors: 0,
    products: [] as { slug: string; score: number; direction: string; sources: string }[],
  }

  for (const product of products) {
    const slug = getProductSlug(product)
    const fmcgData = getProductFMCG(product)
    const fmcg_score = fmcgData?.fmcg_score ?? 50
    // Clean keyword: strip size/weight, add UAE
    const keyword = `${product.name_en.replace(/\d+ml|\d+g|\d+kg|\d+l\b/gi, '').trim()} UAE`

    try {
      const trend = await computeUAETrend({ keyword, productSlug: slug, fmcg_score, skipSerp })

      const { error } = await supabase
        .from('product_trends')
        .upsert({
          product_id: productUUID(product.id),
          keyword,
          keyword_ar: product.name_ar,
          trend_score: trend.trend_score,
          trend_direction: trend.trend_direction,
          uae_interest_pct: trend.uae_interest_pct,
          related_queries: trend.sources.related_queries,
          gap_signal: trend.gap_signal,
          is_available_uae: trend.sources.is_available_uae,
          retailer_mentions: trend.sources.retailer_mentions,
          avg_price_aed: trend.sources.avg_price_aed,
          fetched_at: trend.fetched_at,
        }, { onConflict: 'product_id,keyword', ignoreDuplicates: false })

      if (error) {
        console.error(`[trends/sync] DB error for ${slug}:`, error.message)
        results.errors++
      } else {
        results.synced++
        results.products.push({
          slug,
          score: trend.trend_score,
          direction: trend.trend_direction,
          sources: trend.source_label,
        })
      }
    } catch (err) {
      console.error(`[trends/sync] Error for ${slug}:`, err)
      results.errors++
    }

    // Small delay between products only when calling SerpAPI
    if (!skipSerp) await new Promise(r => setTimeout(r, 500))
  }

  return NextResponse.json({
    success: true,
    ...results,
    timestamp: new Date().toISOString(),
  })
}

export async function GET() {
  // Public read — returns cached trends (no secrets required)
  const { data } = await supabase
    .from('product_trends')
    .select('product_id, keyword, trend_score, trend_direction, uae_interest_pct, gap_signal, retailer_mentions, avg_price_aed, related_queries, fetched_at')
    .order('fetched_at', { ascending: false })
    .limit(60)

  return NextResponse.json({ trends: data || [], count: data?.length || 0 })
}
