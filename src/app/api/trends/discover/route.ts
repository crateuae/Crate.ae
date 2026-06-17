/**
 * POST /api/trends/discover
 * Scans UAE FMCG keywords for trending terms that have NO matching product in our catalog.
 * Stores discoveries in trend_discoveries table for manual review.
 * Uses SerpAPI to verify UAE availability gaps.
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { PRODUCTS_CATALOG, getProductSlug } from '@/lib/data/products-catalog'
import { discoverUAETrends } from '@/lib/trends/google-trends'
import { checkUAEAvailability } from '@/lib/trends/serpapi'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

/** Check if keyword overlaps with any existing product */
function matchesExistingProduct(keyword: string): boolean {
  const kl = keyword.toLowerCase().replace(' uae', '').trim()
  return PRODUCTS_CATALOG.some(p => {
    const nameEn = p.name_en.toLowerCase()
    const brand = p.brand.toLowerCase()
    return (
      nameEn.includes(kl) || kl.includes(nameEn.split(' ')[0]) ||
      brand.includes(kl) || kl.includes(brand) ||
      getProductSlug(p).replace(/-/g, ' ').includes(kl)
    )
  })
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const limit: number = Math.min(body.limit || 20, 30)

  // 1. Scan UAE FMCG keywords via Google Trends
  const discoveries = await discoverUAETrends(limit)

  // 2. Filter out keywords that already have a matching product
  const newDiscoveries = discoveries.filter(d => !matchesExistingProduct(d.keyword))

  // 3. For high-gap keywords, verify UAE availability via SerpAPI
  const enriched = []
  for (const disc of newDiscoveries) {
    let availability_checked = false
    let is_available_uae = false

    if (disc.gap_score >= 60 && process.env.SERPAPI_KEY) {
      const avail = await checkUAEAvailability(disc.keyword)
      availability_checked = true
      is_available_uae = avail.is_available_uae
      await sleep(800)
    }

    enriched.push({
      keyword: disc.keyword,
      keyword_ar: null,     // TODO: translate via AI
      search_volume_monthly: null,
      trend_score: disc.trend_score,
      uae_interest_pct: disc.uae_interest_pct,
      trend_direction: disc.trend_direction,
      category_guess: disc.category_guess,
      gap_score: disc.gap_score,
      is_available_uae: availability_checked ? is_available_uae : null,
      status: 'pending',
      discovered_at: new Date().toISOString(),
    })
  }

  // 4. Upsert into trend_discoveries
  let inserted = 0
  for (const disc of enriched) {
    const { error } = await supabase
      .from('trend_discoveries')
      .upsert(disc, { onConflict: 'keyword', ignoreDuplicates: false })

    if (!error) inserted++
  }

  return NextResponse.json({
    success: true,
    scanned: limit,
    new_discoveries: newDiscoveries.length,
    inserted,
    top_opportunities: enriched
      .filter(d => d.gap_score >= 50)
      .sort((a, b) => b.gap_score - a.gap_score)
      .slice(0, 10),
    timestamp: new Date().toISOString(),
  })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'pending'
  const limit = parseInt(searchParams.get('limit') || '50')

  const { data, error } = await supabase
    .from('trend_discoveries')
    .select('*')
    .eq('status', status)
    .order('gap_score', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ discoveries: data || [], count: data?.length || 0 })
}
