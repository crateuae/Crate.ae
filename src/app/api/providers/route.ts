/**
 * GET /api/providers — public batch loader for the "load more" UI.
 * Returns the next window of TRADER companies for the directory.
 * Repackagers are never exposed here (hidden brokered service).
 */
import { NextRequest, NextResponse } from 'next/server'
import { getProviders } from '@/lib/supabase/cached'

export const revalidate = 3600

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const from = Math.max(0, parseInt(sp.get('from') ?? '0', 10))
  const size = Math.min(30, Math.max(1, parseInt(sp.get('size') ?? '15', 10)))
  const to = from + size - 1

  const { rows, total, category_counts } = await getProviders({
    type: 'trader',
    category: sp.get('cat') || undefined,
    query: sp.get('q') || undefined,
    from,
    to,
  })

  return NextResponse.json({ rows, total, category_counts, from, size })
}
