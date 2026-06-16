import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { checkProductCompliance } from '@/lib/ai/claude'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { product_name, product_class, ingredients, label_text, caffeine_mg_per_100ml, has_sulfites, product_id } = body

  if (!product_name || !product_class) {
    return NextResponse.json({ error: 'product_name and product_class are required' }, { status: 400 })
  }

  const result = await checkProductCompliance({
    product_class,
    product_name,
    ingredients,
    label_text,
    caffeine_mg_per_100ml,
    has_sulfites,
  }) as {
    standard: string
    verdict: string
    passed: unknown[]
    failed: unknown[]
    missing_count: number
    summary_ar: string
    summary_en: string
  }

  // Save check history
  const supabase = await createAdminClient()
  await supabase.from('compliance_checks').insert({
    product_id: product_id || null,
    product_name,
    product_class,
    input_data: { ingredients, label_text, caffeine_mg_per_100ml, has_sulfites },
    result,
    verdict: result.verdict,
    missing_count: result.missing_count,
  })

  return NextResponse.json(result)
}
