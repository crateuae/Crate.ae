import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

// Second line of the bot filter (the first is engagement in VisitorTracker): user agents that
// name themselves as crawlers, previewers, monitors, scripts or automated browsers.
const BOT_RE = /bot\b|bot\/|crawl|spider|slurp|headless|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|preview|facebookexternalhit|whatsapp\/|telegrambot|discord|skype|embedly|bitly|python|curl\/|wget|axios|node-fetch|undici|go-http|java\/|okhttp|scrapy|puppeteer|playwright|selenium|phantom|gptbot|chatgpt|claude|anthropic|perplexity|bytespider|petal|yandex|baidu|semrush|ahrefs|mj12|dotbot|dataforseo|seznam|applebot|amazonbot|meta-externalagent|ccbot|cohere|google-inspectiontool|googleother|bingpreview|adsbot|mediapartners/i

export async function POST(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key || url === 'your_supabase_url') return NextResponse.json({ ok: true })

    const ua = req.headers.get('user-agent') || ''
    if (!ua || BOT_RE.test(ua)) return NextResponse.json({ ok: true })

    const body = await req.json()
    const { path, visitor_id, lang, referrer } = body
    if (!path || !visitor_id) return NextResponse.json({ ok: true })
    if (path.includes('/dashboard') || path.includes('/admin') || path.startsWith('/api')) {
      return NextResponse.json({ ok: true })
    }

    const supabase = createClient(url, key)
    const row = { path, visitor_id, lang: lang || 'ar', referrer: referrer || null }
    // ua + country are kept when the columns exist (docs/sql/page_views_ua_country.sql);
    // until then the row is written without them.
    const country = req.headers.get('x-vercel-ip-country') || null
    const { error } = await supabase.from('page_views').insert({ ...row, ua: ua.slice(0, 300), country })
    if (error) await supabase.from('page_views').insert(row)
  } catch {}
  return NextResponse.json({ ok: true })
}
