/**
 * POST /api/partner/quote
 * Browser-facing proxy: a buyer configuring a label gets a REAL live price. The factory
 * (Art for Printing) prices the job with its own engine; Crate's margin is added on the
 * server. The signing secret and the factory's own figure stay server-side — the browser
 * receives only what the buyer pays.
 *
 * Shapes:
 *   { sqm: { w_mm, h_mm, pieces, finish, plotter }, design? }     a label off the roll (/labels)
 *   { sticker: { …, material, lamination }, design? }             a label on cut sheets (older)
 *   { quantity, product_slug?, selectedOptions? }                 the flat per-sheet product
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAfpQuote } from '@/lib/partner/afp'
import { readStickerAsk, readSqmAsk, crateMarkupPct } from '@/lib/partner/sticker-ask'
import { rateLimit, rejectCrossOrigin, readJsonObject, badBody } from '@/lib/security/guard'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const xo = rejectCrossOrigin(req)
  if (xo) return xo
  // Each quote is a signed call to the factory's pricing engine: a generous but bounded budget.
  const limited = rateLimit(req, 'quote-min', 30, 60_000) || rateLimit(req, 'quote-hour', 300, 3_600_000)
  if (limited) return limited
  const body: any = await readJsonObject(req, 20_000)
  if (!body) return badBody()

  const sqm = readSqmAsk(body?.sqm)
  const sticker = sqm ? null : readStickerAsk(body?.sticker)
  if ((body?.sqm && !sqm) || (!sqm && body?.sticker && !sticker)) return NextResponse.json({ ok: false, error: 'invalid_size' }, { status: 422 })
  const design = body?.design === true
  const markup_pct = crateMarkupPct()

  const quote = sqm ? await getAfpQuote({ sqm, design, markup_pct })
    : sticker ? await getAfpQuote({ sticker, design, markup_pct })
    : await getAfpQuote({
        product_slug: body?.product_slug ? String(body.product_slug) : undefined,
        quantity: Math.max(1, Math.floor(Number(body?.quantity) || 1)),
        selectedOptions: (body?.selectedOptions && typeof body.selectedOptions === 'object') ? body.selectedOptions : {},
      })

  if (!quote.ok) {
    const status = quote.error === 'partner_not_configured' ? 503
      : (quote.error === 'piece_too_large' || quote.error === 'not_priced') ? 422 : 502
    return NextResponse.json({ ok: false, error: quote.error }, { status })
  }
  // A whitelist, not a spread: base_line_total_aed and markup_pct are the factory's price and
  // Crate's margin, and neither belongs in a response anyone can read in the network tab.
  return NextResponse.json({
    ok: true,
    quantity: quote.quantity ?? null,
    unit_price_aed: quote.unit_price_aed ?? null,
    line_total_aed: quote.line_total_aed ?? null,
    design_fee_aed: quote.design_fee_aed ?? 0,
    subtotal_aed: quote.subtotal_aed ?? quote.line_total_aed ?? null,
    vat_aed: quote.vat_aed ?? null,
    total_aed: quote.total_aed ?? null,
    currency: 'AED',
    sqm: quote.sqm ?? null,
    sticker: quote.sticker ?? null,
  })
}
