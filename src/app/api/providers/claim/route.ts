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

export async function POST(req: NextRequest) {
  let body: Record<string, string>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }

  const provider_id = body.provider_id?.trim()
  const email = cleanEmail(body.email)
  if (!provider_id || !email) {
    return NextResponse.json({ error: 'provider_id and a valid email are required' }, { status: 422 })
  }

  const supabase = adminClient()

  // provider must exist
  const { data: prov } = await supabase.from('providers').select('id, name_en, slug').eq('id', provider_id).maybeSingle()
  if (!prov) return NextResponse.json({ error: 'provider not found' }, { status: 404 })

  const contact_name = body.contact_name?.trim() || null
  const phone = body.phone?.trim() || null
  const { error } = await supabase.from('provider_contacts').upsert({
    provider_id, email, contact_name, phone,
    source: 'self_claimed', consent: true, confidence: 100, status: 'pending',
  }, { onConflict: 'provider_id,email' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Alert the admin so the claim doesn't sit silently in the pending queue.
  await notifyAdmin(`مطالبة جديدة: ${prov.name_en ?? provider_id} — New page claim`, [
    `<b>مطالبة صفحة مورد / Page claim</b>`,
    `<b>الشركة:</b> ${prov.name_en ?? '—'}`,
    `<b>الإيميل:</b> ${email}`,
    contact_name ? `<b>الاسم:</b> ${contact_name}` : '',
    phone ? `<b>الهاتف:</b> ${phone}` : '',
    `<b>راجعها:</b> https://www.crate.ae/ar/dashboard/contacts`,
  ].filter(Boolean).join('<br>'))

  return NextResponse.json({ ok: true })
}
