/**
 * POST /api/admin/products/save
 * PATCH /api/admin/products/save
 *
 * Save a product (create or update).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  return handleSave(req)
}

export async function PATCH(req: NextRequest) {
  return handleSave(req)
}

async function handleSave(req: NextRequest) {
  try {
    const product = await req.json()

    if (!product.name_en?.trim() || !product.name_ar?.trim()) {
      return NextResponse.json(
        { error: 'Name EN and Name AR are required' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    if (product.id) {
      // UPDATE
      const { data, error } = await supabase
        .from('products')
        .update({
          ...product,
          updated_at: now,
        })
        .eq('id', product.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(data)
    } else {
      // INSERT
      const { data, error } = await supabase
        .from('products')
        .insert({
          id: crypto.randomUUID(),
          ...product,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(data)
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
