/**
 * The body of an email received at @crate.ae.
 *
 * Resend's inbound webhook carries only the envelope (from, to, subject, email_id) — never
 * the text. The body has to be fetched by id from Resend's receiving API, and that endpoint
 * refuses a "sending access" key. So:
 *
 *   RESEND_FULL_API_KEY   a Full access key, used here only (falls back to RESEND_API_KEY)
 *
 * Without it every inbound email is stored and forwarded with an empty body, which is how
 * the CRM showed 52 subjects and no text for a month.
 */
import { Resend } from 'resend'
import { htmlToText } from '@/lib/security/inbound-risk'

export type InboundBody =
  | { ok: true; text: string | null; html: string | null; attachments: Array<{ filename: string; content_type: string; size: number }> }
  | { ok: false; error: 'no_key' | 'restricted_key' | 'not_found' | 'failed'; detail?: string }

const key = () => process.env.RESEND_FULL_API_KEY || process.env.RESEND_API_KEY || ''

export async function fetchInboundBody(emailId: string): Promise<InboundBody> {
  if (!key()) return { ok: false, error: 'no_key' }
  if (!emailId) return { ok: false, error: 'not_found' }
  try {
    const r = await new Resend(key()).emails.receiving.get(emailId)
    if (r.error) {
      const name = String((r.error as { name?: string }).name || '')
      return { ok: false, error: name === 'restricted_api_key' ? 'restricted_key' : name === 'not_found' ? 'not_found' : 'failed', detail: r.error.message }
    }
    const d = r.data
    return {
      ok: true,
      text: d?.text ?? null,
      html: d?.html ?? null,
      attachments: (d?.attachments ?? []).map(a => ({ filename: String(a.filename ?? ''), content_type: String(a.content_type ?? ''), size: Number(a.size ?? 0) })),
    }
  } catch (e) {
    return { ok: false, error: 'failed', detail: String((e as Error)?.message || e).slice(0, 200) }
  }
}

/** The email_id inside a stored webhook payload (`inbound_emails.raw`). */
export function emailIdOf(raw: unknown): string | null {
  try {
    const o = typeof raw === 'string' ? JSON.parse(raw) : raw
    const id = (o as Record<string, unknown>)?.email_id ?? (o as Record<string, unknown>)?.id
    return typeof id === 'string' && id ? id : null
  } catch { return null }
}

/**
 * Fills the body of stored emails that have none (newest first). Stops at the first
 * "restricted key" answer — the rest would fail the same way. Returns what happened, so the
 * dashboard can say why bodies are missing instead of showing "(no text)".
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fillMissingBodies(db: any, limit = 15, budgetMs = 8000): Promise<{ filled: number; access: 'ok' | 'restricted_key' | 'no_key' | 'none_missing' }> {
  const started = Date.now()
  const { data } = await db.from('inbound_emails').select('id, raw')
    .is('body_text', null).is('body_html', null)
    .order('created_at', { ascending: false }).limit(limit)
  const rows = (data ?? []) as Array<{ id: string; raw: unknown }>
  if (!rows.length) return { filled: 0, access: 'none_missing' }
  let filled = 0
  for (const row of rows) {
    if (Date.now() - started > budgetMs) break
    const id = emailIdOf(row.raw)
    if (!id) continue
    const b = await fetchInboundBody(id)
    if (!b.ok) {
      if (b.error === 'restricted_key' || b.error === 'no_key') return { filled, access: b.error }
      // Gone at Resend (retention) — mark it, or it would block the queue on every load.
      if (b.error === 'not_found') await db.from('inbound_emails').update({ body_text: '(message no longer available at the mail provider)' }).eq('id', row.id)
      continue
    }
    const text = b.text?.trim() ? b.text : (b.html ? htmlToText(b.html) : '')
    await db.from('inbound_emails').update({ body_text: text || '', body_html: b.html }).eq('id', row.id)
    filled++
  }
  return { filled, access: 'ok' }
}
