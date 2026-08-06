/**
 * GET  /api/admin/partner-orders — the dropship / commission ledger for the
 *      Crate ⇄ Art for Printing partnership. Lists partner_orders + a summary
 *      (order count, total value, total commission, status breakdown).
 * POST /api/admin/partner-orders — refresh non-final orders' status from AFP
 *      (pulls GET /api/partner/orders/{ref}/status for each open order).
 *
 * Auth: under /api/admin → proxy-gated (admin only). Defensive: a missing
 * partner_orders table returns an empty ledger rather than failing.
 */
import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { getAfpStatus } from '@/lib/partner/afp'

export const runtime = 'nodejs'

const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100

export async function GET() {
  const db = adminClient()
  const list = await (async () => {
    try {
      const { data } = await db.from('partner_orders')
        .select('*').order('created_at', { ascending: false }).limit(200)
      return data ?? []
    } catch { return [] }
  })()

  const sum = (k: string) => list.reduce((s: number, o: any) => s + (Number(o[k]) || 0), 0)
  const byStatus: Record<string, number> = {}
  for (const o of list as any[]) byStatus[o.status || 'pending'] = (byStatus[o.status || 'pending'] || 0) + 1

  return NextResponse.json({
    orders: list,
    summary: {
      count: list.length,
      total_aed: round2(sum('afp_total_aed')),
      commission_aed: round2(sum('commission_aed')),
      byStatus,
    },
  })
}

export async function POST() {
  const db = adminClient()
  let orders: any[] = []
  try {
    const { data } = await db.from('partner_orders')
      .select('id, afp_ref, status')
      .not('status', 'in', '("delivered","cancelled")')
      .limit(50)
    orders = data ?? []
  } catch { orders = [] }

  let updated = 0
  for (const o of orders) {
    try {
      const s = await getAfpStatus(o.afp_ref)
      if (s?.ok && s.status && s.status !== o.status) {
        await db.from('partner_orders').update({ status: s.status }).eq('id', o.id)
        updated++
      }
    } catch { /* one order's refresh failing must not abort the sweep */ }
  }
  return NextResponse.json({ ok: true, checked: orders.length, updated })
}
