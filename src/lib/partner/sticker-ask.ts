/**
 * Reads a label ask (size + pieces + material…) out of an untrusted request body. Shared by
 * the quote and the order proxy so both send AFP the same thing. Returns null when the body
 * carries no usable ask — the caller then falls back to the flat per-sheet product.
 *
 * Only shape and bounds are checked here. Whether the piece FITS a sheet, and what it costs,
 * is AFP's answer: its imposition engine and its product config are the single source.
 */
import type { StickerAsk } from './afp'

export function readStickerAsk(raw: unknown): StickerAsk | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const w = Number(r.w_mm), h = Number(r.h_mm), pieces = Math.floor(Number(r.pieces))
  if (!(w >= 5 && w <= 2000) || !(h >= 5 && h <= 2000) || !(pieces >= 1 && pieces <= 1_000_000)) return null
  return {
    w_mm: Math.round(w * 10) / 10,
    h_mm: Math.round(h * 10) / 10,
    pieces,
    material: r.material === 'pvc' ? 'pvc' : 'paper',
    finish: r.finish === 'glossy' ? 'glossy' : 'matt',
    lamination: r.lamination === true,
    plotter: r.plotter === true,
  }
}
