/**
 * GET /api/admin/products/unified
 *
 * List all products (manual + skeleton from organism).
 * Supports filtering by source, publish status, search.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const source = searchParams.get('source') // 'manual' | 'organism_discovery'
    const published = searchParams.get('published') // 'true' | 'false'
    const search = searchParams.get('q')
    const page = parseInt(searchParams.get('page') ?? '0')
    const pageSize = 50

    let query = supabase
      .from('products')
      .select(
        'id, name_ar, name_en, source, is_published, published_at, organism_opportunity_id, page_views, rfq_count, type_en, created_at',
        { count: 'exact' }
      )

    if (source && ['manual', 'organism_discovery'].includes(source)) {
      query = query.eq('source', source)
    }

    if (published === 'true') {
      query = query.eq('is_published', true)
    } else if (published === 'false') {
      query = query.eq('is_published', false)
    }

    if (search) {
      query = query.or(
        `name_en.ilike.%${search}%,name_ar.ilike.%${search}%,brand.ilike.%${search}%`
      )
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      products: data || [],
      total: count ?? 0,
      page,
      pageSize,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
