/**
 * Public read: the latest market-gap alert for a product page. Server-only, NOT a server action
 * (it used to live in the 'use server' actions file, which made it a public endpoint using the
 * service-role key).
 */
import { adminClient } from '@/lib/supabase/admin'

export async function getProductSignals(slug: string) {
  if (typeof slug !== 'string' || !slug || slug.length > 200) return null
  const supabase = adminClient()
  const { data: productRow } = await supabase
    .from('products')
    .select('id')
    .eq('slug', slug)
    .single()
  if (!productRow) return null
  const { data } = await supabase
    .from('gap_alerts')
    .select('demand_score, supply_score, gap_score, details_ar, details_en, recommended_action_ar, recommended_action_en, detected_at, updated_at')
    .eq('product_id', productRow.id)
    .order('detected_at', { ascending: false })
    .limit(1)
    .single()
  return data
}
