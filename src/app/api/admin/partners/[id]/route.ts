/**
 * GET /api/admin/partners/{id} — one partner's full record, plus (for fulfillment
 * partners) its dropship orders + a commission summary. Auth: proxy-gated.
 */
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = adminClient()

  const { data: partner } = await db.from('partners').select('*').eq('id', id).maybeSingle()
  if (!partner) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  let orders: any[] = []
  let summary: { count: number; total_aed: number; commission_aed: number; byStatus: Record<string, number> } | null = null
  let monthly: { month: string; count: number; total_aed: number; commission_aed: number }[] = []

  if (partner.is_fulfillment) {
    try {
      // AFP is the only fulfiller today, so its page shows all dropship orders.
      const { data } = await db.from('partner_orders').select('*')
        .order('created_at', { ascending: false }).limit(500)
      orders = data ?? []
      const sum = (k: string) => orders.reduce((s, o) => s + (Number(o[k]) || 0), 0)
      const byStatus: Record<string, number> = {}
      for (const o of orders) byStatus[o.status || 'pending'] = (byStatus[o.status || 'pending'] || 0) + 1
      summary = { count: orders.length, total_aed: round2(sum('afp_total_aed')), commission_aed: round2(sum('commission_aed')), byStatus }

      // Monthly settlement rollup (commission owed to Crate per calendar month).
      const byMonth = new Map<string, { count: number; total: number; commission: number }>()
      for (const o of orders) {
        const month = String(o.created_at || '').slice(0, 7) || 'unknown' // YYYY-MM
        const cur = byMonth.get(month) || { count: 0, total: 0, commission: 0 }
        cur.count++; cur.total += Number(o.afp_total_aed) || 0; cur.commission += Number(o.commission_aed) || 0
        byMonth.set(month, cur)
      }
      monthly = [...byMonth.entries()]
        .map(([month, v]) => ({ month, count: v.count, total_aed: round2(v.total), commission_aed: round2(v.commission) }))
        .sort((a, b) => b.month.localeCompare(a.month))
    } catch { orders = []; summary = { count: 0, total_aed: 0, commission_aed: 0, byStatus: {} }; monthly = [] }
  }

  return NextResponse.json({ partner, orders, summary, monthly })
}
