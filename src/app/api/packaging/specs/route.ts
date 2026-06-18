/**
 * GET  /api/packaging/specs  → { primary_packs, master_cartons, options }
 * POST /api/packaging/specs  → upsert one row  { kind, data }
 * DELETE /api/packaging/specs?kind=...&id=...  → delete one row
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const TABLE: Record<string, string> = {
  primary_pack:   'packaging_primary_packs',
  master_carton:  'packaging_master_cartons',
  option:         'packaging_options',
}

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function GET() {
  try {
    const supabase = adminClient()
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
  } catch (e) {
    console.error('[packaging/specs GET]', e)
    return NextResponse.json({ primary_packs: [], master_cartons: [], options: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { kind?: string; data?: Record<string, unknown> }
    const { kind, data } = body
    const table = kind ? TABLE[kind] : null
    if (!table || !data) {
      return NextResponse.json({ error: 'kind and data required' }, { status: 400 })
    }

    const supabase = adminClient()

    // Strip id for new rows → insert; keep id for existing → upsert
    const { id, ...rest } = data
    const isNew = !id || String(id).trim() === ''

    const { error, data: row } = isNew
      ? await supabase.from(table).insert(rest).select().single()
      : await supabase.from(table).upsert({ id, ...rest }, { onConflict: 'id' }).select().single()

    if (error) {
      console.error('[packaging/specs POST]', error)
      return NextResponse.json({ error: error.message, details: error.details, hint: error.hint }, { status: 500 })
    }
    return NextResponse.json({ success: true, row })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[packaging/specs POST] exception', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const kind = searchParams.get('kind')
    const id   = searchParams.get('id')
    const table = kind ? TABLE[kind] : null
    if (!table || !id) {
      return NextResponse.json({ error: 'kind and id required' }, { status: 400 })
    }
    const supabase = adminClient()
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) {
      console.error('[packaging/specs DELETE]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
