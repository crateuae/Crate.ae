/**
 * GET  /api/packaging/specs  → { primary_packs, master_cartons, options }
 * POST /api/packaging/specs  → upsert one row  { kind, data }
 * DELETE /api/packaging/specs?kind=...&id=...  → delete one row
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const TABLE: Record<string, string> = {
  primary_pack:   'packaging_primary_packs',
  master_carton:  'packaging_master_cartons',
  option:         'packaging_options',
}

export async function GET() {
  const supabase = await createAdminClient()
  const [packs, cartons, options] = await Promise.all([
    supabase.from('packaging_primary_packs').select('*').order('sort_order').order('created_at'),
    supabase.from('packaging_master_cartons').select('*').order('sort_order').order('created_at'),
    supabase.from('packaging_options').select('*').order('sort_order').order('created_at'),
  ])
  return NextResponse.json({
    primary_packs:   packs.data   ?? [],
    master_cartons:  cartons.data ?? [],
    options:         options.data ?? [],
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { kind?: string; data?: Record<string, unknown> }
  const { kind, data } = body
  const table = kind ? TABLE[kind] : null
  if (!table || !data) {
    return NextResponse.json({ error: 'kind and data required' }, { status: 400 })
  }
  const supabase = await createAdminClient()

  // Strip undefined/empty id — use insert for new rows, upsert for existing
  const { id, ...rest } = data
  const isNew = !id || id === '' || id === 'undefined'

  const query = isNew
    ? supabase.from(table).insert(rest).select().single()
    : supabase.from(table).upsert({ id, ...rest }, { onConflict: 'id' }).select().single()

  const { error, data: row } = await query
  if (error) {
    console.error('[packaging/specs POST]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, row })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const kind = searchParams.get('kind')
  const id   = searchParams.get('id')
  const table = kind ? TABLE[kind] : null
  if (!table || !id) {
    return NextResponse.json({ error: 'kind and id required' }, { status: 400 })
  }
  const supabase = await createAdminClient()
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
