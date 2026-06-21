/**
 * THE HANDS — POST /api/organism/publish
 *
 * Publishes APPROVED opportunities into live SEO pages (articles), gated by the
 * content quality gate and the daily rate governor. Scheduled by Vercel Cron,
 * protected by CRON_SECRET. Also callable (GET) from the dashboard to publish on
 * demand.
 */

import { NextRequest, NextResponse } from 'next/server'
import { organismDb, getActiveBrain } from '@/lib/organism/pipeline'
import { publishApproved } from '@/lib/organism/publish'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  // Open trigger: Vercel Cron + manual admin publish from the dashboard.
  // Rate-governed by daily_publish_cap, so open access is acceptable.

  const startedAt = Date.now()
  try {
    const db = organismDb()
    const brain = await getActiveBrain(db)
    const result = await publishApproved(db, brain)
    return NextResponse.json({
      ok: true,
      published_at: new Date().toISOString(),
      duration_ms: Date.now() - startedAt,
      ...result,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[organism/publish] error:', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return POST(req)
}
