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

  if (partner.is_fulfillment) {
    try {
      // AFP is the only fulfiller today, so its page shows all dropship orders.
      const { data } = await db.from('partner_orders').select('*')
        .order('created_at', { ascending: false }).limit(200)
      orders = data ?? []
      const sum = (k: string) => orders.reduce((s, o) => s + (Number(o[k]) || 0), 0)
      const byStatus: Record<string, number> = {}
      for (const o of orders) byStatus[o.status || 'pending'] = (byStatus[o.status || 'pending'] || 0) + 1
      summary = { count: orders.length, total_aed: round2(sum('afp_total_aed')), commission_aed: round2(sum('commission_aed')), byStatus }
    } catch { orders = []; summary = { count: 0, total_aed: 0, commission_aed: 0, byStatus: {} } }
  }

  return NextResponse.json({ partner, orders, summary })
}
