/**
 * POST /api/providers/view — record a provider profile page view.
 * Fire-and-forget beacon from the detail page.
 */
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { rateLimit, rejectCrossOrigin, readJsonObject, clipText } from '@/lib/security/guard'

export async function POST(req: NextRequest) {
  const xo = rejectCrossOrigin(req)
  if (xo) return xo
  const limited = rateLimit(req, 'pview', 60, 60_000)
  if (limited) return limited
  const body = await readJsonObject(req, 2_000)
  if (!body) return NextResponse.json({ error: 'bad json' }, { status: 400 })
  const provider_id = clipText(body.provider_id, 64)
  if (!/^[0-9a-f-]{36}$/i.test(provider_id)) return NextResponse.json({ error: 'provider_id required' }, { status: 422 })
  const visitor_id = clipText(body.visitor_id, 80) || null

  const { error } = await adminClient().rpc('log_provider_event', {
    p_provider_id: provider_id,
    p_event_type: 'page_view',
    p_actor: 'visitor',
    p_visitor_id: visitor_id,
  })
  if (error) { console.error('[providers/view]', error.message); return NextResponse.json({ error: 'db_error' }, { status: 500 }) }
  return NextResponse.json({ ok: true })
}
