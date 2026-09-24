/**
 * GET /api/packaging/suppliers — public batch loader for the packaging directory ("load more").
 * Separate from /api/providers, which stays TRADERS-ONLY. Never returns licence number / issue
 * date (gated for repackagers) — see src/lib/packaging/directory.ts.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getPackagingSuppliers, kindByKey } from '@/lib/packaging/directory'

export const revalidate = 3600

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const from = Math.max(0, Math.min(5000, parseInt(sp.get('from') ?? '0', 10) || 0))
  const size = Math.min(30, Math.max(1, parseInt(sp.get('size') ?? '15', 10) || 15))
  const kind = kindByKey(sp.get('kind'))?.key   // whitelist: unknown kinds are ignored
  const { rows, total } = await getPackagingSuppliers({ kind, q: sp.get('q') ?? undefined, from, to: from + size - 1 })
  return NextResponse.json({ rows, total, from, size })
}
