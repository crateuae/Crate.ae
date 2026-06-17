/**
 * GET /api/trends/[slug]
 * Returns cached trends data for a specific product.
 * Falls back to live fetch if no cached data.
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { PRODUCTS_CATALOG, getProductSlug, getProductFMCG } from '@/lib/data/products-catalog'
import { computeUAETrend } from '@/lib/trends/engine'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // Find product
  const product = PRODUCTS_CATALOG.find(p => getProductSlug(p) === slug || p.id === slug)
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const productUUID = `prod-${product.id}-0000-0000-${String(parseInt(product.id.replace('p', ''))).padStart(12, '0')}`

  // Try cached data first (< 7 days old)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: cached } = await supabase
    .from('product_trends')
    .select('*')
    .eq('product_id', productUUID)
    .gte('fetched_at', sevenDaysAgo)
    .order('fetched_at', { ascending: false })
    .limit(1)
    .single()

  if (cached) {
    return NextResponse.json({
      source: 'cache',
      product_slug: slug,
      ...cached,
    })
  }

  // Live fetch via multi-source engine
  const fmcgData = getProductFMCG(product)
  const keyword = `${product.name_en.replace(/\d+ml|\d+g|\d+kg|\d+l\b/gi, '').trim()} UAE`
  const trend = await computeUAETrend({
    keyword,
    productSlug: slug,
    fmcg_score: fmcgData?.fmcg_score ?? 50,
  })

  // Save to cache
  await supabase.from('product_trends').upsert({
    product_id: productUUID,
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
  }, { onConflict: 'product_id,keyword' })

  return NextResponse.json({
    source: 'live',
    product_slug: slug,
    source_label: trend.source_label,
    trend_score: trend.trend_score,
    trend_direction: trend.trend_direction,
    uae_interest_pct: trend.uae_interest_pct,
    gap_signal: trend.gap_signal,
    related_queries: trend.sources.related_queries,
    retailer_mentions: trend.sources.retailer_mentions,
    avg_price_aed: trend.sources.avg_price_aed,
    fetched_at: trend.fetched_at,
  })
}
