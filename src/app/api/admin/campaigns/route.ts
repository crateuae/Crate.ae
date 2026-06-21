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

// PATCH → edit a DRAFT campaign (name/subject/body/audience)
export async function PATCH(req: NextRequest) {
  const { id, name, subject, body_html, audience } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const patch: Record<string, unknown> = {}
  if (name !== undefined) patch.name = name
  if (subject !== undefined) patch.subject = subject
  if (body_html !== undefined) patch.body_html = body_html
  if (audience !== undefined) patch.audience = audience
  const { error } = await db()
    .from('email_campaigns')
    .update(patch)
    .eq('id', id)
    .eq('status', 'draft')   // only drafts are editable
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE → remove a draft campaign
export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await db().from('email_campaigns').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
