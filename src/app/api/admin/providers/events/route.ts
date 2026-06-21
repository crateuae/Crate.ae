/**
 * GET /api/admin/providers/events?provider_id=...
 * Full activity log for one provider (the controllable record).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

export async function GET(req: NextRequest) {
  const providerId = req.nextUrl.searchParams.get('provider_id')
  if (!providerId) return NextResponse.json({ error: 'provider_id required' }, { status: 422 })

  const db = adminDb()
  const [{ data: events }, { data: rfqs }] = await Promise.all([
    db.from('provider_events')
      .select('id, event_type, actor, rfq_id, visitor_id, payload, created_at')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false })
      .limit(200),
    db.from('rfq_requests')
      .select('id, product_name, status, contact_name, notes, created_at')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  return NextResponse.json({ events: events ?? [], rfqs: rfqs ?? [] })
}
