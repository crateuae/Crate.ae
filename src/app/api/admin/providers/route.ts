import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

// GET — list all providers (admin sees all including inactive)
export async function GET() {
  const db = adminDb()
  const { data, error, count } = await db
    .from('providers')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rows: data ?? [], total: count ?? 0 })
}

// POST — create
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { id: _id, created_at: _ca, ...fields } = body
  const db = adminDb()
  const { data, error } = await db.from('providers').insert(fields).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH — update
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, created_at: _ca, ...fields } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const db = adminDb()
  const { data, error } = await db.from('providers').update(fields).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE
export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const db = adminDb()
  const { error } = await db.from('providers').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
