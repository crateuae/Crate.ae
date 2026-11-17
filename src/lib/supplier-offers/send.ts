/**
 * Sends the documents-request email for one supplier offer and moves it to
 * "docs_requested". Used right after a form submission and by the dashboard's
 * "Email documents request" action. Server-only.
 */
import { Resend } from 'resend'
import { DOCUMENTS, offerRef, type OfferAnswers } from './model'
import { docsRequestEmail } from './emails'

const FROM = process.env.RESEND_FROM_EMAIL ?? 'uae@crate.ae'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendDocsRequest(db: any, row: { id: string; email: string | null; company: string | null; locale: string | null; answers: OfferAnswers }): Promise<{ ok: boolean; error?: string; answers?: OfferAnswers }> {
  const to = String(row.email || '').trim().toLowerCase()
  if (!to.includes('@')) return { ok: false, error: 'no_email' }
  if (!process.env.RESEND_API_KEY) return { ok: false, error: 'email_not_configured' }
  const ref = offerRef(row.id)
  const mail = docsRequestEmail({
    ref, product: row.answers.product, company: row.company || 'there',
    locale: row.locale === 'ar' ? 'ar' : 'en', held: row.answers.documents ?? [], docs: DOCUMENTS,
  })
  const r = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: `Crate <${FROM}>`, to: [to], replyTo: FROM, subject: mail.subject, html: mail.html, text: mail.text,
  })
  if (r.error) return { ok: false, error: r.error.message }
  const answers: OfferAnswers = {
    ...row.answers,
    _status: row.answers._status === 'new' || !row.answers._status ? 'docs_requested' : row.answers._status,
    _docs_requested_at: new Date().toISOString(),
    _updated_at: new Date().toISOString(),
  }
  await db.from('tool_leads').update({ answers }).eq('id', row.id)
  return { ok: true, answers }
}
