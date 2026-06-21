/**
 * POST /api/providers/view — record a provider profile page view.
 * Fire-and-forget beacon from the detail page.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function POST(req: NextRequest) {
  let body: { provider_id?: string; visitor_id?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad json' }, { status: 400 }) }
  if (!body.provider_id) return NextResponse.json({ error: 'provider_id required' }, { status: 422 })

  const { error } = await db().rpc('log_provider_event', {
    p_provider_id: body.provider_id,
    p_event_type: 'page_view',
    p_actor: 'visitor',
    p_visitor_id: body.visitor_id ?? null,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
