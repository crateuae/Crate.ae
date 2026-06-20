/**
 * THE VITALS — GET /api/organism/pipeline
 *
 * Live read of the organism's state for the dashboard: stage counts, today's
 * activity, the active brain, and the top opportunities at each stage.
 */

import { NextResponse } from 'next/server'
import { organismDb, getActiveBrain } from '@/lib/organism/pipeline'

const STAGES = ['sensed','scored','approved','published','capturing','converting','won','lost','dismissed'] as const

export async function GET() {
  const db = organismDb()

  const [{ data: opps }, brain] = await Promise.all([
    db.from('opportunities')
      .select('id, title, title_ar, source, stage, composite_score, quality_score, trend_score, is_registered, is_available_uae, published_url, views, rfq_count, deals_count, created_at, stage_changed_at')
      .order('composite_score', { ascending: false })
      .limit(500),
    getActiveBrain(db),
  ])

  const all = opps ?? []

  // Stage counts
  const stage_counts: Record<string, number> = {}
  for (const s of STAGES) stage_counts[s] = 0
  for (const o of all) stage_counts[o.stage] = (stage_counts[o.stage] ?? 0) + 1

  // Today's pulse
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0)
  const iso = startOfDay.toISOString()
  const sensed_today = all.filter(o => o.created_at >= iso).length
  const moved_today  = all.filter(o => o.stage_changed_at >= iso).length

  // Top of each actionable stage (what needs the human's eye)
  const top = (stage: string, n = 10) =>
    all.filter(o => o.stage === stage).slice(0, n)

  return NextResponse.json({
    vitals: {
      total: all.length,
      sensed_today,
      moved_today,
      live_pages: stage_counts['published'] + stage_counts['capturing'] + stage_counts['converting'],
      deals_won: stage_counts['won'],
    },
    stage_counts,
    brain: {
      version: brain.version,
      weights: brain.weights,
      approve_threshold: brain.approve_threshold,
      quality_threshold: brain.quality_threshold,
      daily_publish_cap: brain.daily_publish_cap,
    },
    approved_queue: top('approved'),   // waiting for the hands (publish)
    scored_held: top('scored'),        // below gate — the radar's "maybe" pile
    fresh: top('sensed'),
  })
}
