/**
 * Crate → Art for Printing partner client (dropship, commission model).
 *
 * AFP is a SEPARATE company/platform. We talk to it over a small signed HTTP
 * contract, never a shared DB. Every call is HMAC-SHA256-signed over the raw body
 * with PARTNER_SHARED_SECRET (identical on both sides). No-ops (returns a soft
 * error, never throws) when AFP_PARTNER_URL / PARTNER_SHARED_SECRET are unset —
 * same defensive pattern as notifyAdmin / pingIndexNow.
 *
 * Server-only: the secret must never reach the browser. Routes that import this
 * must run on the Node runtime.
 */
import crypto from 'node:crypto'

// Crate talks to exactly ONE partner (Art for Printing) at one stable origin, so
// the URL has a safe hardcoded default. AFP_PARTNER_URL can still override it, but
// a missing/truncated env value (e.g. someone saved just "https") falls back to the
// default instead of breaking the integration. The SECRET is never defaulted —
// auth must come from env.
const DEFAULT_AFP_URL = 'https://www.artforprinting.ae'
const AFP_URL = () => {
  const raw = (process.env.AFP_PARTNER_URL || '').trim().replace(/\/+$/, '')
  return /^https?:\/\/[^/]+/i.test(raw) ? raw : DEFAULT_AFP_URL
}
const SECRET = () => process.env.PARTNER_SHARED_SECRET || ''

export function afpConfigured(): boolean {
  return !!AFP_URL() && SECRET().length >= 16
}

function sign(raw: string): string {
  return crypto.createHmac('sha256', SECRET()).update(raw, 'utf8').digest('hex')
}

async function postSigned(path: string, bodyObj: unknown): Promise<any> {
  const raw = JSON.stringify(bodyObj)
  try {
    const res = await fetch(`${AFP_URL()}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-partner-signature': sign(raw) },
      body: raw,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, error: data?.error || `http_${res.status}` }
    return data
  } catch (e: any) {
    return { ok: false, error: String(e?.message || e).slice(0, 200) }
  }
}

export type AfpQuote = {
  ok: boolean
  unit_price_aed?: number
  line_total_aed?: number
  currency?: string
  product?: { slug: string; name_en: string; name_ar: string; uom: string }
  error?: string
}

export async function getAfpQuote(input: {
  product_slug?: string
  quantity: number
  selectedOptions?: Record<string, string>
}): Promise<AfpQuote> {
  if (!afpConfigured()) return { ok: false, error: 'partner_not_configured' }
  return postSigned('/api/partner/quote', input)
}

export type AfpOrderResult = {
  ok: boolean
  afp_ref?: string
  order_id?: string
  total_aed?: number
  unit_price_aed?: number
  status?: string
  deduped?: boolean
  artwork_stored?: boolean
  error?: string
}

export async function createAfpOrder(input: {
  crate_request_id?: string
  product_slug?: string
  quantity: number
  selectedOptions?: Record<string, string>
  configNote?: string
  artwork?: { name: string; dataUrl: string }
  buyer: { name: string; phone: string; email?: string; address?: string; company?: string }
}): Promise<AfpOrderResult> {
  if (!afpConfigured()) return { ok: false, error: 'partner_not_configured' }
  return postSigned('/api/partner/orders', input)
}

export async function getAfpStatus(ref: string): Promise<any> {
  if (!afpConfigured()) return { ok: false, error: 'partner_not_configured' }
  try {
    const res = await fetch(`${AFP_URL()}/api/partner/orders/${encodeURIComponent(ref)}/status`, {
      headers: { 'x-partner-signature': sign(String(ref)) },
    })
    return res.json().catch(() => ({ ok: false, error: `http_${res.status}` }))
  } catch (e: any) {
    return { ok: false, error: String(e?.message || e).slice(0, 200) }
  }
}
