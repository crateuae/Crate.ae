/**
 * THE LEARNING LOOP — POST /api/organism/learn
 *
 * Captures real outcomes (page traffic) into opportunities, then re-weights the
 * brain from what actually earned traction. Scheduled weekly by Vercel Cron,
 * protected by CRON_SECRET. Also callable (GET) from the dashboard on demand.
 */

import { NextRequest, NextResponse } from 'next/server'
import { organismDb } from '@/lib/organism/pipeline'
import { captureOutcomes, relearnWeights } from '@/lib/organism/learning'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  // Open trigger: Vercel Cron + manual admin learn from the dashboard.

  const startedAt = Date.now()
  try {
    const db = organismDb()
    const capture = await captureOutcomes(db)
    const learn = await relearnWeights(db)
    return NextResponse.json({
      ok: true,
      learned_at: new Date().toISOString(),
      duration_ms: Date.now() - startedAt,
      capture,
      learn,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[organism/learn] error:', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return POST(req)
}
