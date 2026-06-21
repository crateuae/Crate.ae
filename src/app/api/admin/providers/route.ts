import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

// GET — paginated admin listing via RPC (server-side filter/search/paging).
// Falls back to a capped direct query if the RPC isn't deployed yet.
export async function GET(req: NextRequest) {
  const db = adminDb()
  const sp = req.nextUrl.searchParams
  const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10))
  const size = Math.min(100, Math.max(1, parseInt(sp.get('size') ?? '50', 10)))
  const from = (page - 1) * size
  const to = from + size - 1

  const { data, error } = await db.rpc('get_providers_admin', {
    p_type:     sp.get('type')     || null,
    p_status:   sp.get('status')   || null,
    p_query:    sp.get('q')        || null,
    p_category: sp.get('category') || null,
    p_from:     from,
    p_to:       to,
  })

  if (error) {
    // Fallback: RPC not deployed — return a bounded window so the UI still works.
    const { data: rows, count } = await db
      .from('providers')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)
    return NextResponse.json({
      rows: rows ?? [], total: count ?? 0, page, size,
      _fallback: true, _rpcError: error.message,
    })
  }

  return NextResponse.json({ ...data, page, size })
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
