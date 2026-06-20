/**
 * THE BRAIN + IMMUNE SYSTEM
 *
 * Composite scoring of an opportunity from its four sub-scores, weighted by the
 * currently-active brain config. The learning loop (later phase) re-weights from
 * real outcomes — this module always reads whatever weights are active, so it
 * automatically "thinks better" as the organism learns.
 *
 * Immune system: a quality gate + the approve threshold decide whether an
 * opportunity is allowed to advance toward publishing. This is what protects the
 * domain from Google's scaled-content-abuse penalties — only valuable, data-rich
 * opportunities pass.
 */

import type { ScoreWeights, SensedCandidate } from './types'

export interface ScoredResult {
  trend_score: number
  registrability_score: number
  arbitrage_score: number
  gap_score: number
  composite_score: number
  quality_score: number
  weights: ScoreWeights
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

/**
 * Registrability (0-100): can this realistically be sold/registered in the UAE?
 * Phase-1 heuristic — the Label Checker engine (next phase) will replace this
 * with a real compliance verdict. Registered products (gap_alerts) start higher.
 */
function estimateRegistrability(c: SensedCandidate): number {
  if (c.is_registered) return 80              // already in-market → registrable
  // unregistered: penalise categories that are compliance-heavy, reward simple ones
  const cat = (c.category_guess || '').toLowerCase()
  if (/health|organic|supplement/.test(cat)) return 45  // stricter ESMA scrutiny
  if (/beverage|drink/.test(cat)) return 55             // caffeine/additive checks
  return 65                                             // snacks, general FMCG
}

/**
 * Arbitrage (0-100): profit-gap signal. High when there's a known UAE retail
 * price AND the item is a market gap (not already saturated).
 */
function estimateArbitrage(c: SensedCandidate): number {
  let s = 0
  if (c.avg_price_aed && c.avg_price_aed > 0) s += 50  // we have a real price anchor
  if (c.is_available_uae === false) s += 35            // gap = room to be the source
  if (c.trend_direction === 'rising') s += 15
  return clamp(s)
}

/**
 * Quality (0-100) — IMMUNE GATE. Measures data richness / confidence. A thin,
 * data-poor opportunity must NOT be auto-published (would be low-value spam).
 */
function estimateQuality(c: SensedCandidate): number {
  let q = 0
  if (c.trend_score >= 25) q += 30
  if (c.category_guess) q += 15
  if (c.avg_price_aed && c.avg_price_aed > 0) q += 20
  if (c.is_available_uae !== null) q += 15
  if (c.trend_direction && c.trend_direction !== 'stable') q += 10
  if (c.title_ar) q += 10                              // bilingual-ready (platform rule)
  return clamp(q)
}

export function scoreOpportunity(c: SensedCandidate, weights: ScoreWeights): ScoredResult {
  const trend_score = clamp(c.trend_score)
  const registrability_score = estimateRegistrability(c)
  const arbitrage_score = estimateArbitrage(c)
  const gap_score = clamp(c.gap_score)

  const composite = clamp(
    trend_score * weights.trend +
    registrability_score * weights.registrability +
    arbitrage_score * weights.arbitrage +
    gap_score * weights.gap
  )

  return {
    trend_score,
    registrability_score,
    arbitrage_score,
    gap_score,
    composite_score: composite,
    quality_score: estimateQuality(c),
    weights,
  }
}

/**
 * The gate decision. An opportunity is APPROVED (queued for the hands) only when
 * it clears BOTH the composite threshold (worth it) AND the quality threshold
 * (rich enough to publish safely). Otherwise it rests at 'scored'.
 */
export function gateDecision(
  scored: ScoredResult,
  approveThreshold: number,
  qualityThreshold: number,
): { approved: boolean; blockedReason: string | null } {
  if (scored.composite_score < approveThreshold)
    return { approved: false, blockedReason: `below_composite_threshold(${scored.composite_score}<${approveThreshold})` }
  if (scored.quality_score < qualityThreshold)
    return { approved: false, blockedReason: `below_quality_threshold(${scored.quality_score}<${qualityThreshold})` }
  return { approved: true, blockedReason: null }
}
