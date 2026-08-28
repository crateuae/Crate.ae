/**
 * GET /api/search?q=... — public natural-language supplier search (Layer 1).
 * Parses the query deterministically (product/category/emirate/qty/incoterm) and
 * matches it against the active provider directory. Zero AI/credit; server-side
 * service-role read filtered to is_active=true (only public providers, public
 * fields). Layer 3 (Claude refine + embeddings) can slot in later, degrading here.
 */
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { parseQuery } from '@/lib/search/parse'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || ''
  if (!q.trim()) return NextResponse.json({ ok: true, parsed: null, results: [], count: 0, provider: 'deterministic' })

  const parsed = parseQuery(q)
  const db = adminClient()

  try {
    let query = db.from('providers')
      .select('name_en, name_ar, slug, category, emirate, is_verified, rfq_received_count')
      .eq('is_active', true)

    if (parsed.emirate) query = query.eq('emirate', parsed.emirate)
    if (parsed.category) query = query.eq('category', parsed.category)

    // Keyword OR across name (both langs) + category. Keywords are pre-sanitized to
    // letters/digits in the parser, so they're safe inside the PostgREST or() string.
    if (parsed.keywords.length) {
      const ors: string[] = []
      for (const kw of parsed.keywords.slice(0, 4)) {
        ors.push(`name_en.ilike.%${kw}%`, `name_ar.ilike.%${kw}%`, `category.ilike.%${kw}%`)
      }
      query = query.or(ors.join(','))
    }

    query = query
      .order('is_verified', { ascending: false })
      .order('rfq_received_count', { ascending: false, nullsFirst: false })
      .limit(30)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ ok: true, parsed, results: data ?? [], count: (data ?? []).length, provider: 'deterministic' })
  } catch (e: any) {
    console.error('[search]', e)
    return NextResponse.json({ ok: false, parsed, results: [], count: 0, error: 'search_failed' }, { status: 500 })
  }
}
