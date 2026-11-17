/**
 * Request guards shared by the public API routes: client IP, best-effort rate limiting,
 * same-origin checks, bounded JSON bodies and HTML escaping.
 *
 * Rate limiting is per warm serverless instance (module memory). That blunts bursts and
 * scripted abuse of endpoints that cost money (Vision, email, factory orders) without a new
 * service; it is not a hard global quota. Where a hard cap matters (the scanner) the route
 * adds a database-backed cap on top.
 */
import { NextResponse } from 'next/server'

/** The visitor's IP as set by the platform (Vercel overwrites these, they are not client-controlled). */
export function clientIp(req: Request): string {
  const h = req.headers
  return (
    h.get('x-real-ip') ||
    h.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  )
}

type Bucket = number[]
const buckets = new Map<string, Bucket>()

/**
 * Sliding-window limiter. Returns a 429 response when `key` exceeded `max` hits in `windowMs`,
 * otherwise null. `name` namespaces the limit per endpoint.
 */
export function rateLimit(req: Request, name: string, max: number, windowMs: number): NextResponse | null {
  const now = Date.now()
  const key = `${name}:${clientIp(req)}`
  const arr = (buckets.get(key) ?? []).filter(t => now - t < windowMs)
  if (arr.length >= max) {
    buckets.set(key, arr)
    const retry = Math.max(1, Math.ceil((windowMs - (now - arr[0])) / 1000))
    return NextResponse.json(
      { ok: false, error: 'rate_limited', retry_after_s: retry },
      { status: 429, headers: { 'Retry-After': String(retry), 'Cache-Control': 'no-store' } },
    )
  }
  arr.push(now)
  buckets.set(key, arr)
  if (buckets.size > 10_000) { // bound memory: drop the oldest half
    let i = 0
    for (const k of buckets.keys()) { buckets.delete(k); if (++i > 5_000) break }
  }
  return null
}

/** True when the request comes from this site (or is not a browser request at all). */
export function sameOriginOrNone(req: Request): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return true
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || ''
  try { return new URL(origin).host === host } catch { return false }
}

/** Origin check for browser-initiated JSON posts: a foreign site's page cannot call these. */
export function rejectCrossOrigin(req: Request): NextResponse | null {
  return sameOriginOrNone(req)
    ? null
    : NextResponse.json({ ok: false, error: 'forbidden_origin' }, { status: 403 })
}

/**
 * Parse a JSON object body with a size ceiling (checked on the real text, not only the
 * Content-Length header). Returns null when the body is missing, oversized, malformed or
 * not a plain object.
 */
export async function readJsonObject(req: Request, maxBytes = 32_000): Promise<Record<string, unknown> | null> {
  const declared = Number(req.headers.get('content-length') || 0)
  if (declared > maxBytes) return null
  let text: string
  try { text = await req.text() } catch { return null }
  if (text.length > maxBytes) return null
  try {
    const v = JSON.parse(text)
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
  } catch { return null }
}

export const badBody = () => NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 })

/** Escape a value for inclusion in an HTML email / page. */
export function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

/** Trim + collapse + cap a free-text field; non-strings become ''. */
export function clipText(v: unknown, max: number): string {
  return typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max) : ''
}

/** Strict-ish email check with a length cap (cleanEmail in lib/email is deliberately lax). */
export function validEmail(v: unknown): string | null {
  const e = clipText(v, 254).toLowerCase()
  return /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]{2,}$/.test(e) ? e : null
}

/** Only same-site relative paths survive; anything else (absolute URLs, //host, /\host) becomes the fallback. */
export function safeNextPath(next: string | null | undefined, fallback: string): string {
  if (!next || typeof next !== 'string') return fallback
  const backslash = String.fromCharCode(92)
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/' + backslash) || /[\u0000-\u001f]/.test(next)) return fallback
  return next
}

/** Only http(s) URLs (for user-editable website / logo fields rendered as links or images). */
export function safeHttpUrl(v: unknown, max = 300): string | null {
  const s = clipText(v, max)
  if (!s) return null
  try {
    const u = new URL(s)
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null
  } catch { return null }
}
