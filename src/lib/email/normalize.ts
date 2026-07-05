/**
 * Canonical email helpers. The "trim + lowercase + includes('@')" logic was
 * re-implemented in half a dozen files (audience, contacts, claim, unsubscribe,
 * rfq, webhook). Use these instead so normalization is consistent everywhere.
 */

/** Trim + lowercase. Returns '' for nullish input. */
export function normalizeEmail(raw: unknown): string {
  return String(raw ?? '').trim().toLowerCase()
}

/** A pragmatic "looks like an email" check (not RFC-perfect, deliberately lax). */
export function isEmail(raw: unknown): boolean {
  const e = normalizeEmail(raw)
  return e.includes('@') && e.indexOf('@') > 0 && e.indexOf('@') < e.length - 1
}

/** Normalize and return the email only if it looks valid, else null. */
export function cleanEmail(raw: unknown): string | null {
  const e = normalizeEmail(raw)
  return isEmail(e) ? e : null
}
