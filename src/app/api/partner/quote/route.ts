/**
 * POST /api/partner/quote
 * Browser-facing proxy: an importer configuring a compliant label gets a REAL
 * live price from Art for Printing's engine. The signing secret stays server-side
 * (the browser only talks to Crate; Crate signs and calls AFP).
 *
 * Two shapes:
 *   { sticker: { w_mm, h_mm, pieces, material, finish, lamination, plotter }, design? }
 *       a label by the piece — AFP lays it out on sheets and prices it (the /labels page)
 *   { quantity, product_slug?, selectedOptions? }
 *       the flat per-sheet product, kept for older callers
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAfpQuote } from '@/lib/partner/afp'
import { readStickerAsk } from '@/lib/partner/sticker-ask'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 }) }

  const sticker = readStickerAsk(body?.sticker)
  if (body?.sticker && !sticker) return NextResponse.json({ ok: false, error: 'invalid_size' }, { status: 422 })

  const quote = sticker
    ? await getAfpQuote({ sticker, design: body?.design === true })
    : await getAfpQuote({
        product_slug: body?.product_slug ? String(body.product_slug) : undefined,
        quantity: Math.max(1, Math.floor(Number(body?.quantity) || 1)),
        selectedOptions: (body?.selectedOptions && typeof body.selectedOptions === 'object') ? body.selectedOptions : {},
      })

  if (!quote.ok) {
    const status = quote.error === 'partner_not_configured' ? 503
      : (quote.error === 'piece_too_large' || quote.error === 'not_priced') ? 422 : 502
    return NextResponse.json(quote, { status })
  }
  return NextResponse.json(quote)
}
