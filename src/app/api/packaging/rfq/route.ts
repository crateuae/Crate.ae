/**
 * POST /api/packaging/rfq
 * Captures a packaging quote request (RFQ) from the public calculator.
 *
 * For now this stores the lead in the existing `packaging_plans` table with
 * mode='rfq' so no lead is lost. The full inquiry pipeline (line-item split,
 * supplier distribution, deal tracking) is a later phase and will migrate
 * these rows into a dedicated `inquiries` table.
 */

import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { rateLimit, rejectCrossOrigin, readJsonObject, badBody, clipText, validEmail } from '@/lib/security/guard'

export async function POST(req: NextRequest) {
  const xo = rejectCrossOrigin(req)
  if (xo) return xo
  const limited = rateLimit(req, 'pkg-rfq-min', 5, 60_000) || rateLimit(req, 'pkg-rfq-hour', 20, 3_600_000)
  if (limited) return limited
  const body = await readJsonObject(req, 60_000)
  if (!body) return badBody()
  if (typeof body.website === 'string' && body.website.trim()) return NextResponse.json({ success: true }) // honeypot

  const contact_name = clipText(body.contact_name, 120)
  const company_name = clipText(body.company_name, 160)
  const email = validEmail(body.email) ?? ''
  const phone = clipText(body.phone, 40)
  const fulfilment = body.fulfilment === 'pickup' ? 'pickup' : 'delivery'
  const product_label = clipText(body.product_label, 300)
  const notes = clipText(body.notes, 2000)
  // The calculator snapshot is stored as JSON: accept a plain object of bounded size only.
  const calc = body.calc && typeof body.calc === 'object' && !Array.isArray(body.calc) && JSON.stringify(body.calc).length <= 30_000 ? body.calc : null

  if (body.email && !email) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 422 })
  }
  if (!contact_name || (!email && !phone)) {
    return NextResponse.json(
      { error: 'contact_name and at least one of email/phone are required' },
      { status: 400 },
    )
  }

  // Distinguish packaging-quote (cartons) from private-label repackaging so the
  // unified requests dashboard can route each to its own section.
  const kind = (calc as { kind?: string } | null)?.kind
  const mode = kind === 'repack' ? 'repack' : 'cartons'

  const supabase = adminClient()
  const { data, error } = await supabase
    .from('packaging_plans')
    .insert({
      mode,
      input_data: { contact_name, company_name, email, phone, fulfilment, product_label, notes },
      output_data: calc ?? null,
      brand_name: company_name || null,
      label_generated: false,
    })
    .select('id')
    .single()

  if (error) {
    console.error('packaging RFQ insert error:', error)
    return NextResponse.json({ error: 'Could not save your request' }, { status: 500 })
  }

  return NextResponse.json({ success: true, rfq_id: data?.id })
}
