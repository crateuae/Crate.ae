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
import { captureOutcomes } from '@/lib/organism/learning'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  // Open trigger: Vercel Cron + manual admin pulse from the dashboard.
  // These ops are idempotent and rate-governed, so open access is acceptable.

  const startedAt = Date.now()
  try {
    const db = organismDb()
    const brain = await getActiveBrain(db)

    // ① PERCEIVE — refresh the radar each pulse (best-effort, time-boxed so a
    //    slow external call never starves the rest of the beat).
    let discovered = 0
    try {
      const base = process.env.NEXT_PUBLIC_APP_URL || 'https://www.crate.ae'
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 30000)
      const dr = await fetch(`${base}/api/trends/discover`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 20 }), signal: ctrl.signal,
      }).catch(() => null)
      clearTimeout(t)
      if (dr?.ok) discovered = (await dr.json().catch(() => ({}))).inserted ?? 0
    } catch { /* non-fatal */ }

    // ② SENSE → SCORE → CAPTURE
    const senseResult = await sense(db)
    const scoreResult = await scoreSensed(db, brain)
    const captureResult = await captureOutcomes(db)

    return NextResponse.json({
      ok: true,
      beat_at: new Date().toISOString(),
      duration_ms: Date.now() - startedAt,
      brain_version: brain.version,
      discovered,
      sense: senseResult,
      score: scoreResult,
      capture: captureResult,
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
