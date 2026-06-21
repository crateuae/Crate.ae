/**
 * POST /api/admin/products/[id]/publish
 *
 * Publish a product (set is_published = true).
 * Validates minimum required fields first.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch product
    const { data: product, error: fetchErr } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchErr || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Minimal validation: names required only
    if (!product.name_en?.trim() || !product.name_ar?.trim()) {
      return NextResponse.json(
        { error: 'Name (EN and AR) are required' },
        { status: 400 }
      )
    }

    // Publish
    const { data: updated, error: updateErr } = await supabase
      .from('products')
      .update({
        is_published: true,
        published_at: new Date().toISOString(),
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
