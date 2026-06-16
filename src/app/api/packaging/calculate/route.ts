import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { calculateRepackaging } from '@/lib/ai/claude'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { mode, product_name, product_class, target_weight_kg, target_quantity, packaging_type, brand_name, country_origin } = body

  if (!product_name || !target_weight_kg || !target_quantity) {
    return NextResponse.json({ error: 'product_name, target_weight_kg, target_quantity are required' }, { status: 400 })
  }

  const output = await calculateRepackaging({
    product_name,
    product_class: product_class || 'food_general',
    target_weight_kg: parseFloat(target_weight_kg),
    target_quantity: parseInt(target_quantity),
    packaging_type: packaging_type || 'bag',
    brand_name,
    country_origin,
  })

  // Save plan
  const supabase = await createAdminClient()
  const { data } = await supabase.from('packaging_plans').insert({
    mode: mode || 'repack',
    input_data: body,
    output_data: output,
    brand_name: brand_name || null,
    label_generated: false,
  }).select('id').single()

  return NextResponse.json({ ...output as object, plan_id: data?.id })
}
