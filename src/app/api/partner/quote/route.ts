/**
 * POST /api/partner/quote
 * Browser-facing proxy: an importer configuring a compliant label gets a REAL
 * live price from Art for Printing's engine. The signing secret stays server-side
 * (the browser only talks to Crate; Crate signs and calls AFP).
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAfpQuote } from '@/lib/partner/afp'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 }) }

  const quantity = Math.max(1, Math.floor(Number(body?.quantity) || 1))
  const selectedOptions = (body?.selectedOptions && typeof body.selectedOptions === 'object') ? body.selectedOptions : {}
  const product_slug = body?.product_slug ? String(body.product_slug) : undefined

  const quote = await getAfpQuote({ product_slug, quantity, selectedOptions })
  if (!quote.ok) {
    const status = quote.error === 'partner_not_configured' ? 503 : 502
    return NextResponse.json(quote, { status })
  }
  return NextResponse.json(quote)
}
