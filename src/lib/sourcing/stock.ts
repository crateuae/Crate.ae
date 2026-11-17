/**
 * What the public pages may say about the supplier offers on file: how many there are for a
 * product and from which countries. Never names, prices or contacts — those stay in the
 * dashboard until a supplier has agreed to share them with a buyer.
 */
import { unstable_cache } from 'next/cache'
import { adminClient } from '@/lib/supabase/admin'
import { OFFER_TOOL } from '@/lib/supplier-offers/model'
import { SOURCE_PRODUCTS } from './model'

export interface OfferStock { count: number; origins: string[] }

const ORIGIN_EN: Record<string, string> = { 'ایران': 'Iran', 'إيران': 'Iran', 'iran': 'Iran', 'تركيا': 'Turkey', 'turkey': 'Turkey', 'türkiye': 'Turkey', 'الهند': 'India', 'india': 'India' }
const normOrigin = (o: string) => ORIGIN_EN[o.trim().toLowerCase()] ?? ORIGIN_EN[o.trim()] ?? o.trim()

export const getOfferStock = unstable_cache(async (): Promise<Record<string, OfferStock>> => {
  const out: Record<string, OfferStock> = {}
  try {
    const { data } = await adminClient().from('tool_leads').select('answers').eq('tool', OFFER_TOOL).limit(1000)
    const rows = (data ?? []) as Array<{ answers: { product?: string; notes?: string; origin?: string; _status?: string } }>
    for (const p of SOURCE_PRODUCTS) {
      const hit = rows.filter(r => r.answers?._status !== 'rejected' && p.match.test(`${r.answers?.product ?? ''}`))
      out[p.slug] = { count: hit.length, origins: [...new Set(hit.map(r => normOrigin(String(r.answers?.origin ?? ''))).filter(Boolean))].slice(0, 4) }
    }
  } catch { /* the page renders without the figure */ }
  return out
}, ['crate-offer-stock'], { revalidate: 3600 })
