/**
 * POST /api/trends/discover
 * Scans UAE FMCG keywords for trending terms that have NO matching product in our catalog.
 * Stores discoveries in trend_discoveries table for manual review.
 * Uses SerpAPI to verify UAE availability gaps.
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { PRODUCTS_CATALOG } from '@/lib/data/products-catalog'
import { computeUAETrend, guessFMCGCategory, rotatingSeedWindow, expansionSeedsFromCategories } from '@/lib/trends/engine'
import { arabicGlossFor } from '@/lib/trends/fmcg-keyword-bank'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

// Generic tokens that must not, on their own, class a keyword as "already in catalog".
// With a ~190-term pool the old first-word substring test filtered out almost
// everything (e.g. any "... drink UAE" collided with a branded drink product).
const GENERIC_TOKENS = new Set([
  'drink', 'water', 'milk', 'juice', 'oil', 'sauce', 'coffee', 'tea', 'rice',
  'pasta', 'snack', 'snacks', 'bar', 'cheese', 'yogurt', 'butter', 'food',
  'organic', 'powder', 'seeds', 'sugar', 'flour', 'free', 'protein',
])

/** Meaningful lowercase tokens (len ≥ 4, not generic) from a phrase. */
function meaningfulTokens(s: string): string[] {
  return s.toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 4 && !GENERIC_TOKENS.has(t))
}

/**
 * Check whether a seed keyword is ALREADY covered by a catalog product.
 * Match only on a shared DISTINCTIVE token (specific product word or brand),
 * never on a generic category word — otherwise a large seed pool gets over-
 * filtered to nothing and discovery starves.
 */
function matchesExistingProduct(keyword: string): boolean {
  const kTokens = new Set(meaningfulTokens(keyword.replace(/\buae\b/gi, ' ')))
  if (kTokens.size === 0) return false
  return PRODUCTS_CATALOG.some(p => {
    const nameTokens = meaningfulTokens(p.name_en)
    const brandTokens = meaningfulTokens(p.brand)
    return [...nameTokens, ...brandTokens].some(t => kTokens.has(t))
  })
}

export async function POST(req: NextRequest) {
  // Auth: only enforce if called from external cron (x-source: cron header)
  // Dashboard UI calls are always allowed
  const cronSecret = process.env.CRON_SECRET
  const providedSecret = req.headers.get('x-cron-secret')
  const source = req.headers.get('x-source')
  const isExternalCron = source === 'cron'
  const isRealSecret = cronSecret && cronSecret !== 'your_cron_secret' && cronSecret !== ''
  if (isExternalCron && isRealSecret && providedSecret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const limit: number = Math.min(body.limit || 20, 30)

  // Learning-loop expansion: grow the discovery surface from the categories of
  // opportunities that actually won or are converting (proven demand → adjacent
  // same-category terms scanned first).
  let expansionSeeds: string[] = []
  try {
    const { data: winners } = await supabase
      .from('opportunities')
      .select('category_guess')
      .in('stage', ['won', 'converting'])
      .not('category_guess', 'is', null)
      .limit(50)
    expansionSeeds = expansionSeedsFromCategories((winners ?? []).map(w => w.category_guess))
  } catch { /* non-fatal: fall back to pure rotation */ }

  // 1. Deterministic day-rotating window over the full seed pool, so each beat
  //    scans a DIFFERENT slice instead of re-scanning the same head every day.
  const keywords = rotatingSeedWindow(limit, new Date(), expansionSeeds)
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
          keyword_ar: arabicGlossFor(keyword),
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
    scanned: keywords.length,
    candidates_after_catalog_filter: newKeywords.length,
    expansion_seeds: expansionSeeds.length,
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
