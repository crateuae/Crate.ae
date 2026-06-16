import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key || url === 'your_supabase_url') return NextResponse.json({ ok: true })

    const body = await req.json()
    const { path, visitor_id, lang, referrer } = body
    if (!path || !visitor_id) return NextResponse.json({ ok: true })
    if (path.includes('/dashboard') || path.includes('/admin') || path.startsWith('/api')) {
      return NextResponse.json({ ok: true })
    }

    const supabase = createClient(url, key)
    await supabase.from('page_views').insert({ path, visitor_id, lang: lang || 'ar', referrer: referrer || null })
  } catch {}
  return NextResponse.json({ ok: true })
}
