/**
 * POST /api/admin/products/publish
 * Body: { id: string, publish?: boolean }
 *
 * Toggle a product's published state. Validates names only.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { id, publish = true } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'Product id is required' }, { status: 400 })
    }

    // Fetch product
    const { data: product, error: fetchErr } = await supabase
      .from('products')
      .select('id, name_en, name_ar')
      .eq('id', id)
      .single()

    if (fetchErr || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Minimal validation: names required only
    if (!product.name_en?.trim() || !product.name_ar?.trim()) {
      return NextResponse.json(
        { error: 'Name (EN and AR) are required before publishing' },
        { status: 400 }
      )
    }

    const { data: updated, error: updateErr } = await supabase
      .from('products')
      .update({
        is_published: publish,
        published_at: publish ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .select()
      .single()

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
