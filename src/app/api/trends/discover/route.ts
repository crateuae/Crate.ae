/**
 * POST /api/trends/discover
 * Scans UAE FMCG keywords for trending terms that have NO matching product in our catalog.
 * Stores discoveries in trend_discoveries table for manual review.
 * Uses SerpAPI to verify UAE availability gaps.
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { PRODUCTS_CATALOG, getProductSlug } from '@/lib/data/products-catalog'
import { computeUAETrend, UAE_FMCG_SEED_KEYWORDS, guessFMCGCategory } from '@/lib/trends/engine'

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

  // 1. Scan UAE FMCG seed keywords using multi-source engine
  const keywords = UAE_FMCG_SEED_KEYWORDS.slice(0, limit)
  const newKeywords = keywords.filter(k => !matchesExistingProduct(k))

  const enriched = []
  for (const keyword of newKeywords) {
    try {
      const trend = await computeUAETrend({ keyword, productSlug: '', fmcg_score: 50 })
      const gap_score = Math.min(Math.round(
        trend.trend_score * 0.5 +
        trend.uae_interest_pct * 0.3 +
        (trend.trend_direction === 'rising' ? 20 : trend.trend_direction === 'stable' ? 10 : 0)
      ), 100)

      if (trend.trend_score >= 25) {
        enriched.push({
          keyword,
          keyword_ar: null,
          trend_score: trend.trend_score,
          uae_interest_pct: trend.uae_interest_pct,
          trend_direction: trend.trend_direction,
          category_guess: guessFMCGCategory(keyword),
          gap_score,
          is_available_uae: trend.sources.is_available_uae,
          status: 'pending',
          discovered_at: new Date().toISOString(),
        })
      }
    } catch {
      continue
    }
    await sleep(300)
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
    new_discoveries: enriched.length,
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
  const limit  = parseInt(searchParams.get('limit') || '100')

  let query = supabase
    .from('trend_discoveries')
    .select('*')
    .order('gap_score', { ascending: false })
    .limit(limit)

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ discoveries: data || [], count: data?.length || 0 })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { id, status } = body as { id?: string; status?: string }

  if (!id || !status) {
    return NextResponse.json({ error: 'id and status required' }, { status: 400 })
  }

  const validStatuses = ['pending', 'reviewed', 'added', 'dismissed']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'invalid status' }, { status: 400 })
  }

  const { error } = await supabase
    .from('trend_discoveries')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
