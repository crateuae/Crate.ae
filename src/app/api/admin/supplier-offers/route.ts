/**
 * /api/admin/supplier-offers — the review list behind /dashboard/supplier-offers.
 * Admin-only: src/proxy.ts gates every /api/admin path to the admin account.
 *
 * GET                                  → all offers, newest first
 * PATCH { id, status?, admin_notes? }  → review state, merged into answers
 * POST  { ...offer fields, channel }   → add an offer that arrived on WhatsApp or by email
 */
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { parseOffer, OFFER_TOOL, STATUS_KEYS, type Channel } from '@/lib/supplier-offers/model'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await adminClient().from('tool_leads')
    .select('id, email, name, company, phone, locale, answers, consent, source_page, created_at')
    .eq('tool', OFFER_TOOL).order('created_at', { ascending: false }).limit(500)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ offers: data ?? [] })
}

export async function PATCH(req: NextRequest) {
  const b = await req.json().catch(() => ({})) as Record<string, unknown>
  const id = typeof b.id === 'string' ? b.id : ''
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const db = adminClient()
  const { data: row } = await db.from('tool_leads').select('answers').eq('id', id).eq('tool', OFFER_TOOL).maybeSingle()
  if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const answers = { ...(row.answers as Record<string, unknown>) }
  if (typeof b.status === 'string') {
    if (!STATUS_KEYS.has(b.status)) return NextResponse.json({ error: 'bad status' }, { status: 400 })
    answers._status = b.status
  }
  if (typeof b.admin_notes === 'string') answers._admin_notes = b.admin_notes.slice(0, 2000)
  answers._updated_at = new Date().toISOString()
  const { error } = await db.from('tool_leads').update({ answers }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, answers })
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({})) as Record<string, unknown>
  const channel: Channel = b.channel === 'email' ? 'email' : 'whatsapp'
  const parsed = parseOffer(b, channel)
  if (!parsed.ok) return NextResponse.json({ error: 'missing_field', field: parsed.field }, { status: 422 })
  const { offer } = parsed
  // Offers typed in by the admin did not tick the sharing box themselves — recorded as such.
  const { data, error } = await adminClient().from('tool_leads').insert({
    tool: OFFER_TOOL,
    email: offer.email ?? '',
    name: offer.name,
    company: offer.company,
    phone: offer.phone,
    locale: 'en',
    answers: { ...offer.answers, _admin_notes: typeof b.admin_notes === 'string' ? b.admin_notes.slice(0, 2000) : undefined },
    result_key: offer.answers.category,
    consent: false,
    source_page: `manual:${channel}`,
  }).select('id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: data.id })
}
