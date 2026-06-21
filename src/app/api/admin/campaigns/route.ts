/**
 * /api/admin/campaigns
 * GET  → list campaigns (newest first)
 * POST → create a draft campaign { name, subject, body_html, audience }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function GET() {
  const { data, error } = await db()
    .from('email_campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ campaigns: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { name, subject, body_html, audience } = await req.json()
  if (!name || !subject || !body_html) {
    return NextResponse.json({ error: 'name, subject, body_html required' }, { status: 400 })
  }
  const { data, error } = await db()
    .from('email_campaigns')
    .insert({ name, subject, body_html, audience: audience ?? {}, status: 'draft' })
    .select('id')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: data.id })
}
