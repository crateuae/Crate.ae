/**
 * THE LEARNING LOOP — the organism improves its own thinking.
 *
 * CAPTURE : read REAL outcomes (distinct visitors on each published /insights page)
 *           into opportunities, and advance their stage (published → capturing).
 * RELEARN : compare which sub-scores actually correlated with traction, then nudge
 *           the brain's weights toward the predictive dimensions and persist a new
 *           scoring_weights version. Over time the snowball gets smarter.
 *
 * Honest scope: success is measured on real page traffic today. When the deal/
 * commission layer lands, rfq_count + deals_count become stronger success signals
 * and slot into the exact same loop.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { ScoreWeights } from './types'

const CAPTURE_MIN_VIEWS = 3      // distinct visitors to count as "capturing"
const SUCCESS_VIEWS     = 5      // distinct visitors = a traction success
const GRADE_AGE_DAYS    = 3      // give a page time to earn traffic before grading
const MIN_SAMPLE        = 8      // need this many graded pages before re-weighting
const LEARN_RATE        = 0.30   // how hard we nudge weights per cycle
const W_MIN = 0.05, W_MAX = 0.60 // clamp so no dimension collapses or dominates

const slugFromUrl = (url: string | null) => (url ?? '').split('/insights/')[1]?.split(/[/?#]/)[0] ?? ''

// ─── CAPTURE ─────────────────────────────────────────────────────────────────

export interface CaptureResult { scanned: number; updated: number; advanced: number }

export async function captureOutcomes(db: SupabaseClient): Promise<CaptureResult> {
  const { data: live } = await db
    .from('opportunities')
    .select('id, stage, published_url, views')
    .in('stage', ['published', 'capturing', 'converting'])
    .not('published_url', 'is', null)
    .limit(500)

  if (!live?.length) return { scanned: 0, updated: 0, advanced: 0 }

  const since = new Date(Date.now() - 60 * 86400000).toISOString()
  let updated = 0, advanced = 0

  for (const o of live) {
    const slug = slugFromUrl(o.published_url)
    if (!slug) continue

    // Distinct visitors who hit either locale of this insight page
    const { data: rows } = await db
      .from('page_views')
      .select('visitor_id')
      .like('path', `%/insights/${slug}%`)
      .gte('created_at', since)
      .limit(5000)

    const views = new Set((rows ?? []).map(r => r.visitor_id)).size
    if (views === o.views) continue

    const patch: Record<string, unknown> = { views, last_outcome_at: new Date().toISOString() }
    if (o.stage === 'published' && views >= CAPTURE_MIN_VIEWS) {
      patch.stage = 'capturing'
      patch.stage_changed_at = new Date().toISOString()
      advanced++
    }
    await db.from('opportunities').update(patch).eq('id', o.id)
    await db.from('opportunity_events').insert({
      opportunity_id: o.id, event_type: 'capture',
      from_stage: o.stage, to_stage: patch.stage ?? o.stage, payload: { views },
    })
    updated++
  }
  return { scanned: live.length, updated, advanced }
}

// ─── RELEARN ─────────────────────────────────────────────────────────────────

const clampW = (n: number) => Math.max(W_MIN, Math.min(W_MAX, n))

export interface LearnResult {
  status: 'relearned' | 'insufficient_data'
  sample: number
  successes?: number
  new_version?: number
  prediction_accuracy?: number
  old_weights?: ScoreWeights
  new_weights?: ScoreWeights
}

export async function relearnWeights(db: SupabaseClient): Promise<LearnResult> {
  const gradeBefore = new Date(Date.now() - GRADE_AGE_DAYS * 86400000).toISOString()
  const { data: graded } = await db
    .from('opportunities')
    .select('trend_score, registrability_score, arbitrage_score, gap_score, composite_score, views, rfq_count, deals_count')
    .in('stage', ['published', 'capturing', 'converting', 'won', 'lost'])
    .lte('published_at', gradeBefore)
    .limit(1000)

  if (!graded || graded.length < MIN_SAMPLE) {
    return { status: 'insufficient_data', sample: graded?.length ?? 0 }
  }

  // Success = a real commercial outcome (an RFQ lead or a closed deal). Page views
  // are only a weak FALLBACK proxy, used until any lead signal exists — so once
  // real leads arrive the brain learns "what gets LEADS", not "what gets traffic".
  const hasLeadSignal = graded.some(g => (g.rfq_count ?? 0) > 0 || (g.deals_count ?? 0) > 0)
  const isSuccess = (g: (typeof graded)[number]) => hasLeadSignal
    ? ((g.rfq_count ?? 0) > 0 || (g.deals_count ?? 0) > 0)
    : ((g.views ?? 0) >= SUCCESS_VIEWS)
  const successes = graded.filter(isSuccess)
  const failures  = graded.filter(g => !isSuccess(g))
  // Need both classes to learn a contrast.
  if (successes.length === 0 || failures.length === 0) {
    return { status: 'insufficient_data', sample: graded.length, successes: successes.length }
  }

  const dims = ['trend', 'registrability', 'arbitrage', 'gap'] as const
  const col = { trend: 'trend_score', registrability: 'registrability_score', arbitrage: 'arbitrage_score', gap: 'gap_score' } as const
  const mean = (arr: typeof graded, c: string) =>
    arr.reduce((s, r) => s + ((r as Record<string, number>)[c] ?? 0), 0) / (arr.length || 1)

  // Read current active weights
  const { data: active } = await db
    .from('scoring_weights').select('*').eq('is_active', true)
    .order('version', { ascending: false }).limit(1).maybeSingle()
  const oldWeights = (active?.weights ?? { trend: 0.4, registrability: 0.2, arbitrage: 0.25, gap: 0.15 }) as ScoreWeights
  const oldVersion = active?.version ?? 1

  // Signal per dimension: how much higher it is among successes (normalised by 100)
  const raw: Record<string, number> = {}
  for (const d of dims) {
    const signal = (mean(successes, col[d]) - mean(failures, col[d])) / 100  // ~[-1,1]
    raw[d] = clampW(oldWeights[d] * (1 + LEARN_RATE * signal))
  }
  // Normalise to sum 1
  const total = dims.reduce((s, d) => s + raw[d], 0)
  const newWeights = {
    trend: +(raw.trend / total).toFixed(4),
    registrability: +(raw.registrability / total).toFixed(4),
    arbitrage: +(raw.arbitrage / total).toFixed(4),
    gap: +(raw.gap / total).toFixed(4),
  } as ScoreWeights

  // Prediction accuracy: balanced accuracy of "composite ≥ median ⇒ success"
  const composites = graded.map(g => g.composite_score ?? 0).sort((a, b) => a - b)
  const median = composites[Math.floor(composites.length / 2)]
  const tp = successes.filter(s => (s.composite_score ?? 0) >= median).length
  const tn = failures.filter(f => (f.composite_score ?? 0) < median).length
  const accuracy = +(((tp / successes.length) + (tn / failures.length)) / 2).toFixed(3)

  // Persist new brain version
  await db.from('scoring_weights').update({ is_active: false }).eq('is_active', true)
  await db.from('scoring_weights').insert({
    version: oldVersion + 1,
    weights: newWeights,
    approve_threshold: active?.approve_threshold ?? 60,
    quality_threshold: active?.quality_threshold ?? 50,
    daily_publish_cap: active?.daily_publish_cap ?? 10,
    is_active: true,
    prediction_accuracy: accuracy,
    notes: `Auto-relearned from ${graded.length} graded (${successes.length} ${hasLeadSignal ? 'lead' : 'traffic'}-successes). `
         + `Shift: ${dims.map(d => `${d} ${oldWeights[d]}→${newWeights[d]}`).join(', ')}`,
  })

  // Global learning event (opportunity_id null = system-level)
  await db.from('opportunity_events').insert({
    opportunity_id: null, event_type: 'learning', from_stage: null, to_stage: null,
    payload: { new_version: oldVersion + 1, accuracy, old_weights: oldWeights, new_weights: newWeights, sample: graded.length },
  })

  return {
    status: 'relearned',
    sample: graded.length,
    successes: successes.length,
    new_version: oldVersion + 1,
    prediction_accuracy: accuracy,
    old_weights: oldWeights,
    new_weights: newWeights,
  }
}
