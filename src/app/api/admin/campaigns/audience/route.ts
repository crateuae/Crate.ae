/**
 * POST /api/admin/campaigns/audience
 * Preview an audience spec → { count, sample } before sending.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveAudience, type AudienceSpec } from '@/lib/campaigns/audience'

export async function POST(req: NextRequest) {
  const spec = (await req.json()) as AudienceSpec
  if (!spec?.source) return NextResponse.json({ error: 'source required' }, { status: 400 })
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } })
  const list = await resolveAudience(db, spec)
  return NextResponse.json({ count: list.length, sample: list.slice(0, 8) })
}
