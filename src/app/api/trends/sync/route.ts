/**
 * POST /api/trends/sync
 * Syncs Google Trends data for all products in the catalog.
 * Called by cron (daily) or manually from dashboard.
 * Updates product_trends table in Supabase.
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { PRODUCTS_CATALOG, getProductSlug } from '@/lib/data/products-catalog'
import { fetchUAETrend } from '@/lib/trends/google-trends'
import { checkUAEAvailability } from '@/lib/trends/serpapi'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Rate limit: 1 product per ~3 seconds to be polite to Google
const DELAY_MS = 2500

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const slugFilter: string | null = body.slug || null   // sync single product
  const maxProducts: number = body.max || 30

  const products = PRODUCTS_CATALOG
    .filter(p => p.is_active)
    .filter(p => !slugFilter || getProductSlug(p) === slugFilter)
    .slice(0, maxProducts)

  const results = {
    synced: 0,
    errors: 0,
    skipped: 0,
    products: [] as string[],
  }

  for (const product of products) {
    const slug = getProductSlug(product)
    const keyword = product.name_en.replace(/\d+ml|\d+g|\d+kg|\d+L/gi, '').trim()
    const keywordUAE = `${keyword} UAE`

    try {
      // 1. Google Trends (always free)
      const trend = await fetchUAETrend(keywordUAE)
      if (!trend) { results.skipped++; continue }

      await sleep(DELAY_MS)

      // 2. SerpAPI availability check (uses quota — only for unregistered or discoveries)
      let availability = null
      if (product.registration_status === 'unregistered' && process.env.SERPAPI_KEY) {
        availability = await checkUAEAvailability(keywordUAE)
        await sleep(1000)
      }

      // 3. Upsert into product_trends
      const { error } = await supabase
        .from('product_trends')
        .upsert({
          product_id: `prod-${product.id}-0000-0000-${String(parseInt(product.id.replace('p', ''))).padStart(12, '0')}`,
          keyword: keywordUAE,
          keyword_ar: product.name_ar,
          search_volume_monthly: null,   // requires paid Keyword Planner
          trend_score: trend.trend_score,
          trend_direction: trend.trend_direction,
          uae_interest_pct: trend.uae_interest_pct,
          related_queries: trend.related_queries,
          gap_signal: trend.gap_signal,
          is_available_uae: availability?.is_available_uae ?? (product.registration_status === 'registered_uae'),
          retailer_mentions: availability?.retailer_mentions ?? [],
          avg_price_aed: availability?.avg_price_aed ?? null,
          fetched_at: trend.fetched_at,
        }, {
          onConflict: 'product_id,keyword',
          ignoreDuplicates: false,
        })

      if (error) {
        console.error(`[trends/sync] DB error for ${slug}:`, error.message)
        results.errors++
      } else {
        // Also update the cached trend_score on the product row itself
        await supabase
          .from('products')
          .update({
            trend_score_cached: trend.trend_score,
            trend_direction: trend.trend_direction,
            last_trend_sync: trend.fetched_at,
          })
          .eq('slug', slug)

        results.synced++
        results.products.push(slug)
      }
    } catch (err) {
      console.error(`[trends/sync] Error for ${slug}:`, err)
      results.errors++
    }

    await sleep(DELAY_MS)
  }

  return NextResponse.json({
    success: true,
    ...results,
    timestamp: new Date().toISOString(),
  })
}

export async function GET(req: NextRequest) {
  // Health check / last sync status
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data } = await supabase
    .from('product_trends')
    .select('product_id, keyword, trend_score, trend_direction, fetched_at')
    .order('fetched_at', { ascending: false })
    .limit(30)

  return NextResponse.json({ trends: data || [], count: data?.length || 0 })
}
