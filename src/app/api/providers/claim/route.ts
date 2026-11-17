/**
 * POST /api/providers/claim  { provider_id, email, contact_name?, phone? }
 * A company self-claims its registry listing and opts in to receive relevant
 * import opportunities. Stored as a CONSENTED contact, status='pending' until an
 * admin verifies (guards against impersonation). Only 'verified' rows are ever emailed.
 */
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { cleanEmail } from '@/lib/email/normalize'
import { notifyAdmin } from '@/lib/email/notify-admin'
import { rateLimit, rejectCrossOrigin, readJsonObject, badBody, clipText, validEmail, esc } from '@/lib/security/guard'

export async function POST(req: NextRequest) {
  const xo = rejectCrossOrigin(req)
  if (xo) return xo
  const limited = rateLimit(req, 'claim-min', 4, 60_000) || rateLimit(req, 'claim-hour', 15, 3_600_000)
  if (limited) return limited
  const body = await readJsonObject(req, 10_000)
  if (!body) return badBody()
  if (typeof body.website === 'string' && body.website.trim()) return NextResponse.json({ ok: true }) // honeypot

  const provider_id = clipText(body.provider_id, 64)
  const email = validEmail(body.email) && cleanEmail(body.email)
  if (!provider_id || !email) {
    return NextResponse.json({ error: 'provider_id and a valid email are required' }, { status: 422 })
  }

  const supabase = adminClient()

  // provider must exist
  const { data: prov } = await supabase.from('providers').select('id, name_en, slug').eq('id', provider_id).maybeSingle()
  if (!prov) return NextResponse.json({ error: 'provider not found' }, { status: 404 })

  const contact_name = clipText(body.contact_name, 120) || null
  const phone = clipText(body.phone, 40) || null
  const { error } = await supabase.from('provider_contacts').upsert({
    provider_id, email, contact_name, phone,
    source: 'self_claimed', consent: true, confidence: 100, status: 'pending',
  }, { onConflict: 'provider_id,email' })

  if (error) { console.error('[claim] upsert:', error.message); return NextResponse.json({ error: 'db_error' }, { status: 500 }) }

  // Alert the admin so the claim doesn't sit silently in the pending queue.
  await notifyAdmin(`مطالبة جديدة: ${String(prov.name_en ?? provider_id).replace(/[\r\n]+/g, ' ')} — New page claim`, [
    `<b>مطالبة صفحة مورد / Page claim</b>`,
    `<b>الشركة:</b> ${esc(prov.name_en ?? '—')}`,
    `<b>الإيميل:</b> ${esc(email)}`,
    contact_name ? `<b>الاسم:</b> ${esc(contact_name)}` : '',
    phone ? `<b>الهاتف:</b> ${esc(phone)}` : '',
    `<b>راجعها:</b> https://www.crate.ae/ar/dashboard/contacts`,
  ].filter(Boolean).join('<br>'))

  return NextResponse.json({ ok: true })
}
