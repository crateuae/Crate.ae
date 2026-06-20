/**
 * CRATE ORGANISM — shared types for the autonomous growth nervous system.
 * The spine = `opportunities`. The memory = `opportunity_events`.
 * The tunable mind = `scoring_weights`.
 */

export type OpportunityStage =
  | 'sensed'      // radar detected it
  | 'scored'      // brain evaluated it
  | 'approved'    // passed the gate → queued for the hands (publish)
  | 'published'   // live SEO page owns Google
  | 'capturing'   // page is collecting demand (views / RFQ)
  | 'converting'  // a deal is in motion
  | 'won'         // commission / fulfilment realised
  | 'lost'        // died without traction
  | 'dismissed'   // manually killed

export type OpportunitySource = 'radar_discovery' | 'gap_alert' | 'product_trend' | 'manual'

export interface ScoreWeights {
  trend: number
  registrability: number
  arbitrage: number
  gap: number
}

export interface BrainConfig {
  id: string
  version: number
  weights: ScoreWeights
  approve_threshold: number
  quality_threshold: number
  daily_publish_cap: number
  is_active: boolean
}

export interface Opportunity {
  id: string
  title: string
  title_ar: string | null
  dedup_hash: string
  source: OpportunitySource
  source_ref_id: string | null
  product_id: string | null
  category_guess: string | null
  is_registered: boolean
  stage: OpportunityStage
  stage_changed_at: string
  trend_score: number
  registrability_score: number
  arbitrage_score: number
  gap_score: number
  composite_score: number
  score_weights: ScoreWeights | null
  is_available_uae: boolean | null
  avg_price_aed: number | null
  trend_direction: string | null
  published_url: string | null
  published_at: string | null
  quality_score: number
  blocked_reason: string | null
  views: number
  rfq_count: number
  deals_count: number
  last_outcome_at: string | null
  created_at: string
  updated_at: string
}

/** A raw candidate produced by the SENSE stage before it becomes an Opportunity. */
export interface SensedCandidate {
  title: string
  title_ar: string | null
  dedup_hash: string
  source: OpportunitySource
  source_ref_id: string | null
  product_id: string | null
  category_guess: string | null
  is_registered: boolean
  trend_score: number
  gap_score: number
  is_available_uae: boolean | null
  avg_price_aed: number | null
  trend_direction: string | null
}
