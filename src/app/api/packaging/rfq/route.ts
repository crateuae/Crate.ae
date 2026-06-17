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
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const {
    contact_name, company_name, email, phone,
    fulfilment,          // 'delivery' | 'pickup'
    product_label,       // free text / brand / raw material
    calc,                // the calculator input + result snapshot
    notes,
  } = body as Record<string, unknown>

  if (!contact_name || (!email && !phone)) {
    return NextResponse.json(
      { error: 'contact_name and at least one of email/phone are required' },
      { status: 400 },
    )
  }

  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('packaging_plans')
    .insert({
      mode: 'rfq',
      input_data: { contact_name, company_name, email, phone, fulfilment, product_label, notes },
      output_data: calc ?? null,
      brand_name: (company_name as string) || null,
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
