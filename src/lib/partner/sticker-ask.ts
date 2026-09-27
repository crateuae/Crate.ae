/**
 * Reads a label ask out of an untrusted request body. Shared by the quote and the order
 * proxy so both send AFP the same thing.
 *
 * Only shape and bounds are checked here. Whether the piece FITS, and what it costs, is
 * AFP's answer: its engines and its product config are the single source.
 */
import type { StickerAsk, SqmAsk } from './afp'

const dims = (r: Record<string, unknown>) => {
  const w = Number(r.w_mm), h = Number(r.h_mm), pieces = Math.floor(Number(r.pieces))
  if (!(w >= 5 && w <= 5000) || !(h >= 5 && h <= 5000) || !(pieces >= 1 && pieces <= 1_000_000)) return null
  return { w_mm: Math.round(w * 10) / 10, h_mm: Math.round(h * 10) / 10, pieces }
}

/** A label off the roll, by the square metre — what /labels sells. */
export function readSqmAsk(raw: unknown): SqmAsk | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const d = dims(r)
  if (!d) return null
  return { ...d, finish: r.finish === 'glossy' ? 'glossy' : 'matte', plotter: r.plotter === true }
}

/** A label on cut sheets — the older route, kept for callers that still send it. */
export function readStickerAsk(raw: unknown): StickerAsk | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const d = dims(r)
  if (!d) return null
  return {
    ...d,
    material: r.material === 'pvc' ? 'pvc' : 'paper',
    finish: r.finish === 'glossy' ? 'glossy' : 'matt',
    lamination: r.lamination === true,
    plotter: r.plotter === true,
  }
}

/**
 * Crate's margin on top of the factory price, in percent. Owner's decision 2026-09-28: 30.
 * Set CRATE_MARKUP_PCT on Vercel to change it without a deploy of code. It is decided HERE,
 * on the server — a browser can never send its own.
 */
export function crateMarkupPct(): number {
  const n = Number(process.env.CRATE_MARKUP_PCT)
  return Number.isFinite(n) && n >= 0 && n <= 200 ? n : 30
}
