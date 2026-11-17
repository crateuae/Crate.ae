#!/usr/bin/env node
/**
 * Black-box security probe for Crate.
 *
 *   node scripts/security-check.mjs http://localhost:3000        full run (local `next start`)
 *   node scripts/security-check.mjs https://www.crate.ae --live  GET/HEAD/OPTIONS only (safe for production)
 *
 * Full mode also sends malformed / oversized / cross-origin POSTs (all rejected before any side effect,
 * no valid payload is ever sent) and a burst of 35 requests at a harmless endpoint to prove the rate limit.
 * Nothing here sends email, creates an order or writes a row.
 * Exit code 1 if any check fails.
 */
const args = process.argv.slice(2)
const BASE = (args.find(a => !a.startsWith('--')) || 'http://localhost:3000').replace(/\/+$/, '')
const LIVE = args.includes('--live')
const EVIL = 'https://evil.example'

let pass = 0, fail = 0
const rows = []
function check(name, ok, detail = '') {
  rows.push({ name, ok, detail })
  ok ? pass++ : fail++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`)
}
async function req(path, init = {}) {
  try {
    return await fetch(BASE + path, { redirect: 'manual', ...init })
  } catch (e) {
    return { status: 0, headers: new Headers(), text: async () => '', error: String(e) }
  }
}
const loc = r => r.headers.get('location') || ''

// ── 1. dashboard pages need a login (including a dotted segment that used to skip the proxy) ──
for (const p of ['/ar/dashboard', '/en/dashboard/crm', '/ar/dashboard/partners/some.dotted.id', '/dashboard']) {
  const r = await req(p)
  check(`page ${p} is not public`, [301, 302, 307, 308].includes(r.status) && /login|\/ar|\/en/.test(loc(r)) && r.status !== 200, `status ${r.status} → ${loc(r)}`)
}

// ── 2. admin APIs: 401 without a session ──
const adminApis = [
  'basket-rfqs', 'buyer-requests', 'campaigns', 'campaigns/audience', 'contacts', 'crm', 'ga', 'gsc',
  'integrations-check', 'partner-orders', 'partners', 'providers', 'providers/events', 'requests',
  'seo-health', 'supplier-offers', 'products/unified',
]
for (const a of adminApis) {
  const r = await req(`/api/admin/${a}`)
  check(`GET /api/admin/${a} → 401`, r.status === 401, `status ${r.status}`)
}
for (const p of ['/api/organism/heartbeat', '/api/organism/publish', '/api/organism/learn', '/api/organism/pipeline',
  '/api/organism/outreach', '/api/organism/enrich', '/api/trends/discover', '/api/trends/analyze', '/api/trends/sync', '/api/packaging/calculate']) {
  const r = await req(p)
  check(`GET ${p} → 401 (admin or cron only)`, r.status === 401, `status ${r.status}`)
}

// ── 3. security headers on a page and on an API response ──
{
  const r = await req('/ar')
  const h = r.headers
  check('page: X-Content-Type-Options nosniff', h.get('x-content-type-options') === 'nosniff')
  check('page: X-Frame-Options', /sameorigin|deny/i.test(h.get('x-frame-options') || ''))
  check('page: Strict-Transport-Security', /max-age=\d{7,}/.test(h.get('strict-transport-security') || ''))
  check('page: Referrer-Policy', !!h.get('referrer-policy'))
  check('page: Permissions-Policy', /camera=\(self\)/.test(h.get('permissions-policy') || ''))
  const csp = h.get('content-security-policy') || ''
  check('page: CSP present with frame-ancestors + object-src none', /frame-ancestors 'self'/.test(csp) && /object-src 'none'/.test(csp))
  check('page: no X-Powered-By', !h.get('x-powered-by'))
  const a = await req('/api/search?q=test')
  check('api: nosniff', a.headers.get('x-content-type-options') === 'nosniff')
}

// public reads that share a path with a gated write must still work
{
  const r = await req('/api/packaging/specs')
  check('GET /api/packaging/specs (public planner data) → 200', r.status === 200, `status ${r.status}`)
}

// ── 4. CORS: a foreign origin gets no permission ──
{
  const pre = await req('/api/rfq', { method: 'OPTIONS', headers: { Origin: EVIL, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' } })
  const acao = pre.headers.get('access-control-allow-origin')
  check('CORS preflight from evil origin refused', !acao || (acao !== '*' && acao !== EVIL), `acao=${acao}`)
  const g = await req('/api/search?q=test', { headers: { Origin: EVIL } })
  const acao2 = g.headers.get('access-control-allow-origin')
  check('CORS: no wildcard / reflected origin on API GET', !acao2 || (acao2 !== '*' && acao2 !== EVIL), `acao=${acao2}`)
}

// ── 5. nothing sensitive is served ──
for (const p of ['/.env', '/.env.local', '/.git/config', '/package.json', '/next.config.ts', '/supabase/schema.sql', '/docs/sql/tool_leads.sql', '/scripts/check_security.ts']) {
  const r = await req(p)
  const body = r.status === 200 ? (await r.text()).slice(0, 300) : ''
  check(`GET ${p} not served`, r.status !== 200 || /<html/i.test(body) === true && false, `status ${r.status}`)
}
{
  const html = await (await req('/ar')).text()
  const chunk = (html.match(/\/_next\/static\/chunks\/[^"']+\.js/) || [])[0]
  if (chunk) {
    const m = await req(chunk + '.map')
    check('no public source maps', m.status !== 200, `status ${m.status}`)
  } else check('no public source maps', true, 'no chunk found to test')
}
{
  const robots = await (await req('/robots.txt')).text()
  const sm = await (await req('/sitemap.xml')).text()
  check('robots.txt blocks dashboard/api', /Disallow: \/api\//.test(robots) && /dashboard/.test(robots))
  check('sitemap.xml lists no dashboard/login/api URLs', !/\/dashboard|\/login|\/api\//.test(sm))
}

// ── 6. reflected content is escaped ──
{
  const r = await req('/api/unsubscribe?e=%3Cscript%3Ealert(1)%3C%2Fscript%3E&t=bad')
  const body = await r.text()
  check('unsubscribe page does not reflect raw HTML', !/<script>alert/.test(body), `status ${r.status}`)
}

if (LIVE) {
  const http = BASE.replace(/^https:/, 'http:')
  try {
    const r = await fetch(http + '/ar', { redirect: 'manual' })
    check('HTTP redirects to HTTPS', [301, 302, 307, 308].includes(r.status) && /^https:/.test(r.headers.get('location') || ''), `status ${r.status}`)
  } catch (e) { check('HTTP redirects to HTTPS', false, String(e)) }
  console.log('\n(live mode: POST / burst checks skipped)')
} else {
  const post = (path, body, headers = {}) => req(path, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body })
  const publicPosts = ['/api/rfq', '/api/supplier-offers', '/api/buyer-requests', '/api/leads/gate', '/api/packaging/rfq',
    '/api/packaging/basket-rfq', '/api/partner/order', '/api/providers/claim', '/api/tools/portal-router']

  // ── 7. malformed / oversized / cross-origin bodies are refused before any side effect ──
  // (Each endpoint has its own small rate limit, so these run in a deliberate order: 1 request each per check.)
  for (const p of publicPosts) {
    const r = await post(p, '{not json')
    check(`POST ${p} malformed JSON → 4xx`, r.status >= 400 && r.status < 500, `status ${r.status}`)
  }
  for (const p of publicPosts) {
    const r = await post(p, JSON.stringify({ contact_name: 'x'.repeat(6_000_000) }))
    check(`POST ${p} oversized body → 4xx`, r.status >= 400 && r.status < 500, `status ${r.status}`)
  }
  for (const p of publicPosts) {
    const r = await post(p, '{}', { Origin: EVIL })
    check(`POST ${p} from foreign Origin → 403`, r.status === 403, `status ${r.status}`)
  }
  {
    const r = await post('/api/compliance/scan', JSON.stringify({ image: 'data:image/png;base64,AAAA' }))
    check('POST /api/compliance/scan non-image bytes refused (no AI call)', [422, 503].includes(r.status), `status ${r.status}`)
    const big = await post('/api/compliance/scan', JSON.stringify({ image: 'data:image/jpeg;base64,' + 'A'.repeat(8_000_000) }))
    check('POST /api/compliance/scan oversized image refused', [413, 400, 503, 429].includes(big.status), `status ${big.status}`)
  }
  {
    const r = await post('/api/compliance/check', JSON.stringify({ product_name: 5, product_class: {} }))
    check('POST /api/compliance/check wrong types → 4xx', r.status >= 400 && r.status < 500, `status ${r.status}`)
  }

  // ── 8. webhooks reject unsigned calls ──
  for (const p of ['/api/webhooks/inbound', '/api/webhooks/resend', '/api/webhooks/partner-status']) {
    const r = await post(p, JSON.stringify({ type: 'email.bounced', data: { to: ['a@b.co'] } }))
    check(`POST ${p} unsigned → 401`, r.status === 401, `status ${r.status}`)
  }
  // ── 9. privileged writes without a session ──
  {
    const d = await req('/api/packaging/specs?kind=option&id=00000000-0000-0000-0000-000000000000', { method: 'DELETE' })
    check('DELETE /api/packaging/specs without session → 401', d.status === 401, `status ${d.status}`)
    const w = await post('/api/packaging/specs', JSON.stringify({ kind: 'option', data: { label_en: 'x' } }))
    check('POST /api/packaging/specs without session → 401', w.status === 401, `status ${w.status}`)
    const c = await post('/api/organism/heartbeat', '{}')
    check('POST /api/organism/heartbeat without credential → 401', c.status === 401, `status ${c.status}`)
  }
  // ── 10. rate limit: 35 requests at a harmless endpoint (invalid token → no DB access) ──
  {
    let first429 = 0, n = 0
    for (; n < 35; n++) {
      const r = await req('/api/unsubscribe?e=probe%40example.invalid&t=bad')
      if (r.status === 429) { first429 = n + 1; break }
    }
    check('rate limit returns 429 within 35 requests', first429 > 0, first429 ? `429 at request ${first429}` : 'never limited')
  }
}

console.log(`\n${pass} passed, ${fail} failed (${LIVE ? 'live/GET-only' : 'full'} run against ${BASE})`)
process.exit(fail ? 1 : 0)
