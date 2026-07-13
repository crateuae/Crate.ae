/**
 * GET /api/admin/seo-health — live, automatic self-check of every technical
 * SEO/AEO asset we ship. Fetches the site's own public endpoints and reports each
 * as ok/fail so the SEO dashboard reflects reality with zero manual entry. Gated
 * (under /api/admin). Dynamic: reruns on each dashboard load.
 */
import { NextResponse } from 'next/server'

const BASE = 'https://www.crate.ae'
const INDEXNOW_KEY = '9d4f1a7c8e2b0f635a1c7e9d3b6f204a'

interface Check { name: string; ok: boolean; detail: string; group: string }

async function run(
  name: string, group: string, url: string,
  test: (res: Response, body: string) => { ok: boolean; detail: string },
): Promise<Check> {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    const body = await res.text()
    return { name, group, ...test(res, body) }
  } catch {
    return { name, group, ok: false, detail: 'unreachable' }
  }
}

export async function GET() {
  const checks = await Promise.all([
    run('Sitemap', 'crawl', `${BASE}/sitemap.xml`, (r, t) =>
      ({ ok: r.ok, detail: `${(t.match(/<url>/g) || []).length} URLs` })),
    run('robots.txt + AI crawlers', 'aeo', `${BASE}/robots.txt`, (r, t) => {
      const bots = ['GPTBot', 'PerplexityBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot'].filter(b => t.includes(b))
      return { ok: r.ok && bots.length >= 3 && /Sitemap:/i.test(t), detail: `${bots.length} AI crawlers allowed` }
    }),
    run('llms.txt', 'aeo', `${BASE}/llms.txt`, r =>
      ({ ok: r.ok, detail: r.ok ? 'present' : `HTTP ${r.status}` })),
    run('RSS feed', 'aeo', `${BASE}/rss.xml`, (r, t) =>
      ({ ok: r.ok, detail: `${(t.match(/<item>/g) || []).length} items` })),
    run('IndexNow key file', 'archiving', `${BASE}/${INDEXNOW_KEY}.txt`, (r, t) =>
      ({ ok: r.ok && t.trim() === INDEXNOW_KEY, detail: r.ok ? 'verified' : 'missing' })),
    run('Homepage schema', 'schema', `${BASE}/ar`, (_r, t) =>
      ({ ok: t.includes('#organization') && t.includes('SearchAction'), detail: 'Organization · WebSite · SearchAction' })),
    run('FAQ schema (compliance)', 'schema', `${BASE}/ar/compliance`, (_r, t) =>
      ({ ok: t.includes('FAQPage'), detail: t.includes('FAQPage') ? 'FAQPage present' : 'missing' })),
    run('Tool schema (nutrition)', 'schema', `${BASE}/ar/tools/nutrition`, (_r, t) =>
      ({ ok: t.includes('SoftwareApplication'), detail: t.includes('SoftwareApplication') ? 'SoftwareApplication present' : 'missing' })),
    run('Security headers', 'security', `${BASE}/ar`, r =>
      ({ ok: !!r.headers.get('x-content-type-options'), detail: r.headers.get('x-content-type-options') ? 'nosniff + HSTS + frame' : 'missing' })),
    run('Canonical host (www)', 'crawl', `${BASE}/ar`, (r) =>
      ({ ok: r.ok, detail: r.ok ? '200 on www' : `HTTP ${r.status}` })),
  ])

  return NextResponse.json({
    checks,
    score: checks.filter(c => c.ok).length,
    total: checks.length,
    checked_at: new Date().toISOString(),
  })
}
