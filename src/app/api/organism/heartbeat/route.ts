/**
 * THE HEARTBEAT — POST /api/organism/heartbeat
 *
 * The autonomic pulse of the growth organism. Each beat runs the spine:
 *   SENSE  → pull radar candidates into opportunities
 *   SCORE  → evaluate with the active brain + immune gate → approve/hold
 *
 * Scheduled by Vercel Cron. Protected by CRON_SECRET. Idempotent: safe to run
 * repeatedly (dedup_hash prevents duplicate opportunities; stages never regress).
 *
 * Returns the organism's vitals so the live dashboard can render its pulse.
 */

import { NextRequest, NextResponse } from 'next/server'
import { organismDb, getActiveBrain, sense, scoreSensed } from '@/lib/organism/pipeline'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (process.env.NODE_ENV === 'production' && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startedAt = Date.now()
  try {
    const db = organismDb()
    const brain = await getActiveBrain(db)

    const senseResult = await sense(db)
    const scoreResult = await scoreSensed(db, brain)

    return NextResponse.json({
      ok: true,
      beat_at: new Date().toISOString(),
      duration_ms: Date.now() - startedAt,
      brain_version: brain.version,
      sense: senseResult,
      score: scoreResult,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[organism/heartbeat] error:', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

// Allow a manual pulse from the dashboard (GET) in non-production / admin use.
export async function GET(req: NextRequest) {
  return POST(req)
}
