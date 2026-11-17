import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { checkComplianceDeterministic } from '@/lib/compliance/engine'
import { rateLimit, rejectCrossOrigin, readJsonObject, badBody, clipText } from '@/lib/security/guard'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const xo = rejectCrossOrigin(req)
  if (xo) return xo
  const limited = rateLimit(req, 'compliance-check', 30, 60_000)
  if (limited) return limited

  const body = await readJsonObject(req, 60_000)
  if (!body) return badBody()

  // Unknown classes fall back to food_general inside the engine, so no allow-list is needed here.
  const product_name = clipText(body.product_name, 200)
  const product_class = clipText(body.product_class, 60)
  const ingredients = clipText(body.ingredients, 5000)
  const label_text = clipText(body.label_text, 10000)
  const caffeineNum = Number(body.caffeine_mg_per_100ml)
  const caffeine_mg_per_100ml = Number.isFinite(caffeineNum) && caffeineNum >= 0 && caffeineNum <= 10000 ? caffeineNum : undefined
  const has_sulfites = body.has_sulfites === true
  const product_id = typeof body.product_id === 'string' && /^[0-9a-f-]{36}$/i.test(body.product_id) ? body.product_id : null

  if (!product_name || !product_class) {
    return NextResponse.json({ error: 'product_name and product_class are required' }, { status: 400 })
  }

  const supabase = adminClient()

  // Deterministic rule-engine check — same input ALWAYS yields the same complete
  // result (no AI randomness). Replaces the old temperature-1.0 AI improvisation.
  const result = await checkComplianceDeterministic(supabase, {
    product_class, product_name, ingredients, label_text, caffeine_mg_per_100ml, has_sulfites,
  })

  // Save check history
  await supabase.from('compliance_checks').insert({
    product_id,
    product_name,
    product_class,
    input_data: { ingredients, label_text, caffeine_mg_per_100ml, has_sulfites },
    result,
    verdict: result.verdict,
    missing_count: result.missing_count,
  })

  return NextResponse.json(result)
}
