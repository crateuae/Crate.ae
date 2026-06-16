import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { analyzeMarketGap } from '@/lib/ai/claude'

// Called by cron daily — scrapes signals and generates gap alerts
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createAdminClient()
  const { data: products } = await supabase.from('products').select('id, name_ar, name_en, product_class').eq('is_active', true)
  if (!products?.length) return NextResponse.json({ processed: 0 })

  let processed = 0

  for (const product of products) {
    // Aggregate signals from last 30 days
    const { data: signals } = await supabase
      .from('market_signals')
      .select('signal_type, source, value')
      .eq('product_id', product.id)
      .gte('recorded_at', new Date(Date.now() - 30 * 86400000).toISOString())

    if (!signals?.length) continue

    const demand = signals.filter(s => s.signal_type === 'demand')
    const supply = signals.filter(s => s.signal_type === 'supply')
    const demand_score = demand.length ? demand.reduce((a, b) => a + b.value, 0) / demand.length : 0
    const supply_score = supply.length ? supply.reduce((a, b) => a + b.value, 0) / supply.length : 0
    const sources = [...new Set(signals.map(s => s.source))]

    if (demand_score < 10 && supply_score < 10) continue

    const analysis = await analyzeMarketGap({
      product_name: product.name_en,
      demand_score,
      supply_score,
      price_trend: 0,
      sources,
    }) as {
      alert_type: string
      gap_score: number
      details_ar: string
      details_en: string
      recommended_action_ar: string
      recommended_action_en: string
      urgency: string
    }

    // Deactivate old alert for this product
    await supabase.from('gap_alerts').update({ is_active: false }).eq('product_id', product.id)

    // Insert new alert
    await supabase.from('gap_alerts').insert({
      product_id: product.id,
      alert_type: analysis.alert_type,
      demand_score,
      supply_score,
      gap_score: analysis.gap_score,
      urgency: analysis.urgency,
      details_ar: analysis.details_ar,
      details_en: analysis.details_en,
      recommended_action_ar: analysis.recommended_action_ar,
      recommended_action_en: analysis.recommended_action_en,
      is_active: true,
    })

    processed++
  }

  return NextResponse.json({ processed })
}

// GET — returns active gap alerts for the market radar page
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const urgency = searchParams.get('urgency')
  const limit = parseInt(searchParams.get('limit') || '20')

  const supabase = await createAdminClient()
  let query = supabase
    .from('gap_alerts')
    .select(`
      *,
      products (id, name_ar, name_en, slug, images, category_id)
    `)
    .eq('is_active', true)
    .order('gap_score', { ascending: false })
    .limit(limit)

  if (type) query = query.eq('alert_type', type)
  if (urgency) query = query.eq('urgency', urgency)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
