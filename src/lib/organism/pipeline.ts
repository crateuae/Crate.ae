/**
 * THE SPINE — pipeline state machine for the autonomous growth organism.
 *
 * SENSE  : pull candidates from the radar (trend_discoveries + gap_alerts) and
 *          materialise them as `opportunities` (idempotent via dedup_hash).
 * SCORE  : evaluate 'sensed' opportunities with the active brain weights, then
 *          apply the immune gate → promote to 'approved' or rest at 'scored'.
 *
 * Every transition is logged to `opportunity_events` (the memory) so the live
 * dashboard and the future learning loop can read what the organism did.
 *
 * Publishing (the hands) and the learning loop are wired in later phases — this
 * module deliberately stops at 'approved' so nothing reaches Google without the
 * content quality gate that the publish phase will add.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { BrainConfig, OpportunityStage, ScoreWeights, SensedCandidate } from './types'
import { scoreOpportunity, gateDecision } from './scoring'

export function organismDb(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

const norm = (s: string) =>
  s.toLowerCase().replace(/\s+uae\b/g, '').replace(/[^a-z0-9؀-ۿ]+/g, '-').replace(/^-|-$/g, '').trim()

// ─── Brain config ────────────────────────────────────────────────────────────

export async function getActiveBrain(db: SupabaseClient): Promise<BrainConfig> {
  const { data } = await db
    .from('scoring_weights')
    .select('*')
    .eq('is_active', true)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Fallback genesis weights if the table is empty (defensive).
  if (!data) {
    return {
      id: 'genesis', version: 0,
      weights: { trend: 0.4, registrability: 0.2, arbitrage: 0.25, gap: 0.15 },
      approve_threshold: 60, quality_threshold: 50, daily_publish_cap: 10, is_active: true,
    }
  }
  return data as BrainConfig
}

// ─── Event logging (the memory) ──────────────────────────────────────────────

async function logEvent(
  db: SupabaseClient,
  opportunityId: string,
  eventType: string,
  fromStage: OpportunityStage | null,
  toStage: OpportunityStage | null,
  payload: Record<string, unknown> = {},
) {
  await db.from('opportunity_events').insert({
    opportunity_id: opportunityId,
    event_type: eventType,
    from_stage: fromStage,
    to_stage: toStage,
    payload,
  })
}

// ─── SENSE: ingest radar candidates into the spine ───────────────────────────

/** Read pending radar discoveries (unregistered product opportunities). */
async function senseDiscoveries(db: SupabaseClient): Promise<SensedCandidate[]> {
  const { data } = await db
    .from('trend_discoveries')
    .select('id, keyword, keyword_ar, trend_score, gap_score, trend_direction, category_guess, is_available_uae, status')
    .in('status', ['pending', 'reviewed'])
    .order('gap_score', { ascending: false })
    .limit(50)

  return (data ?? []).map(d => ({
    title: d.keyword,
    title_ar: d.keyword_ar ?? null,
    dedup_hash: `disc:${norm(d.keyword)}`,
    source: 'radar_discovery' as const,
    source_ref_id: d.id,
    product_id: null,
    category_guess: d.category_guess ?? null,
    is_registered: false,
    trend_score: d.trend_score ?? 0,
    gap_score: d.gap_score ?? 0,
    is_available_uae: d.is_available_uae ?? null,
    avg_price_aed: null,
    trend_direction: d.trend_direction ?? null,
  }))
}

/** Read active gap alerts (registered, in-market product opportunities). */
async function senseGapAlerts(db: SupabaseClient): Promise<SensedCandidate[]> {
  const { data } = await db
    .from('gap_alerts')
    .select('id, product_id, alert_type, gap_score, products(name_en, name_ar, category_id)')
    .eq('is_active', true)
    .order('gap_score', { ascending: false })
    .limit(50)

  return (data ?? []).map(g => {
    const prod = (g.products ?? {}) as { name_en?: string; name_ar?: string }
    return {
      title: prod.name_en ?? 'Unknown product',
      title_ar: prod.name_ar ?? null,
      dedup_hash: `gap:${g.product_id}`,           // one live opp per product gap
      source: 'gap_alert' as const,
      source_ref_id: g.id,
      product_id: g.product_id,
      category_guess: null,
      is_registered: true,
      trend_score: Number(g.gap_score ?? 0),
      gap_score: Number(g.gap_score ?? 0),
      is_available_uae: true,
      avg_price_aed: null,
      trend_direction: g.alert_type === 'trend_rising' ? 'rising'
                     : g.alert_type === 'trend_falling' ? 'falling' : 'stable',
    }
  })
}

export interface SenseResult { candidates: number; created: number; refreshed: number }

export async function sense(db: SupabaseClient): Promise<SenseResult> {
  const candidates = [...await senseDiscoveries(db), ...await senseGapAlerts(db)]
  if (candidates.length === 0) return { candidates: 0, created: 0, refreshed: 0 }

  const hashes = candidates.map(c => c.dedup_hash)
  const { data: existing } = await db
    .from('opportunities')
    .select('id, dedup_hash')
    .in('dedup_hash', hashes)
  const existingMap = new Map((existing ?? []).map(e => [e.dedup_hash, e.id]))

  let created = 0, refreshed = 0
  for (const c of candidates) {
    const existingId = existingMap.get(c.dedup_hash)
    if (existingId) {
      // Refresh market context only — never regress the stage.
      await db.from('opportunities').update({
        trend_score: c.trend_score,
        gap_score: c.gap_score,
        is_available_uae: c.is_available_uae,
        avg_price_aed: c.avg_price_aed,
        trend_direction: c.trend_direction,
      }).eq('id', existingId)
      refreshed++
    } else {
      const { data: ins } = await db.from('opportunities').insert({
        title: c.title,
        title_ar: c.title_ar,
        dedup_hash: c.dedup_hash,
        source: c.source,
        source_ref_id: c.source_ref_id,
        product_id: c.product_id,
        category_guess: c.category_guess,
        is_registered: c.is_registered,
        stage: 'sensed',
        trend_score: c.trend_score,
        gap_score: c.gap_score,
        is_available_uae: c.is_available_uae,
        avg_price_aed: c.avg_price_aed,
        trend_direction: c.trend_direction,
      }).select('id').single()
      if (ins) {
        created++
        await logEvent(db, ins.id, 'sensed', null, 'sensed', { source: c.source })
      }
    }
  }
  return { candidates: candidates.length, created, refreshed }
}

// ─── SCORE: evaluate sensed opportunities + immune gate ──────────────────────

export interface ScoreRunResult { scored: number; approved: number; held: number; cap_reached: boolean }

export async function scoreSensed(db: SupabaseClient, brain: BrainConfig): Promise<ScoreRunResult> {
  const { data: sensed } = await db
    .from('opportunities')
    .select('*')
    .eq('stage', 'sensed')
    .order('trend_score', { ascending: false })
    .limit(100)

  if (!sensed?.length) return { scored: 0, approved: 0, held: 0, cap_reached: false }

  // Rate governor (immune): how many approvals already today?
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0)
  const { count: approvedToday } = await db
    .from('opportunities')
    .select('*', { count: 'exact', head: true })
    .in('stage', ['approved', 'published'])
    .gte('stage_changed_at', startOfDay.toISOString())
  let budget = Math.max(0, brain.daily_publish_cap - (approvedToday ?? 0))

  let scored = 0, approved = 0, held = 0, capReached = false
  for (const o of sensed) {
    const candidate: SensedCandidate = {
      title: o.title, title_ar: o.title_ar, dedup_hash: o.dedup_hash,
      source: o.source, source_ref_id: o.source_ref_id, product_id: o.product_id,
      category_guess: o.category_guess, is_registered: o.is_registered,
      trend_score: o.trend_score, gap_score: o.gap_score,
      is_available_uae: o.is_available_uae, avg_price_aed: o.avg_price_aed,
      trend_direction: o.trend_direction,
    }
    const result = scoreOpportunity(candidate, brain.weights as ScoreWeights)
    const gate = gateDecision(result, brain.approve_threshold, brain.quality_threshold)

    // Rate governor can defer an otherwise-approved opportunity to tomorrow.
    const canApprove = gate.approved && budget > 0
    if (gate.approved && budget <= 0) capReached = true
    const nextStage: OpportunityStage = canApprove ? 'approved' : 'scored'

    await db.from('opportunities').update({
      trend_score: result.trend_score,
      registrability_score: result.registrability_score,
      arbitrage_score: result.arbitrage_score,
      gap_score: result.gap_score,
      composite_score: result.composite_score,
      quality_score: result.quality_score,
      score_weights: result.weights,
      blocked_reason: canApprove ? null : (gate.blockedReason ?? (capReached ? 'daily_cap_reached' : null)),
      stage: nextStage,
      stage_changed_at: new Date().toISOString(),
    }).eq('id', o.id)

    await logEvent(db, o.id, 'scored', 'sensed', nextStage, {
      composite: result.composite_score, quality: result.quality_score,
      brain_version: brain.version, blocked: canApprove ? null : gate.blockedReason,
    })

    scored++
    if (canApprove) { approved++; budget-- } else { held++ }
  }
  return { scored, approved, held, cap_reached: capReached }
}
