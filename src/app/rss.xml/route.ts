/**
 * GET /rss.xml — RSS 2.0 feed of the latest published insights (SEO/AEO content
 * discovery + a signal for indexers). Reads defensively (select * → tolerate
 * whatever columns exist) and never throws: on any error it returns a valid empty
 * feed instead of a 500. Revalidated hourly.
 */
import { createClient } from '@supabase/supabase-js'

export const revalidate = 3600

const BASE = 'https://www.crate.ae'

const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;')

function feed(items: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>Crate — UAE Import &amp; Registration Insights</title>
<link>${BASE}/en/insights</link>
<atom:link href="${BASE}/rss.xml" rel="self" type="application/rss+xml"/>
<description>Product import, registration (UAE.S / ESMA) and sourcing guides for the UAE market.</description>
<language>en</language>
${items}
</channel>
</rss>`
}

export async function GET() {
  let items = ''
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data } = await supabase
      .from('articles')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(30)

    items = (data ?? []).map((a: Record<string, unknown>) => {
      const slug = a.slug as string
      if (!slug) return ''
      const title = (a.title_en ?? a.title ?? a.title_ar ?? slug) as string
      const desc = (a.excerpt_en ?? a.excerpt ?? a.summary_en ?? a.summary ?? '') as string
      const url = `${BASE}/en/insights/${slug}`
      const date = a.published_at ? new Date(a.published_at as string).toUTCString() : new Date('2026-07-03').toUTCString()
      return `<item>
<title>${esc(title)}</title>
<link>${url}</link>
<guid isPermaLink="true">${url}</guid>
<pubDate>${date}</pubDate>
<description>${esc(desc)}</description>
</item>`
    }).join('\n')
  } catch (e) {
    console.error('[rss] ', e)
  }

  return new Response(feed(items), {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
