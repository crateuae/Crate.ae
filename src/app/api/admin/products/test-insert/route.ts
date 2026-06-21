/**
 * DEBUG: Test product insert directly
 * GET /api/admin/products/test-insert
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const slug = `test-${Date.now()}`

    const { data, error } = await supabase
      .from('products')
      .insert({
        slug,
        name_en: 'Debug Test Product',
        name_ar: 'منتج اختبار تصحيح',
        source: 'organism_discovery',
        is_published: true,
        published_at: new Date().toISOString(),
        organism_opportunity_id: null,
        type_en: 'Test',
        type_ar: 'اختبار',
        country_origin: 'Unknown',
        page_views: 0,
        rfq_count: 0,
      })
      .select('id, slug, name_en')
      .single()

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Insert successful!',
      data,
    })
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
