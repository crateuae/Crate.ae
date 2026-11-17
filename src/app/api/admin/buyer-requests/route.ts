/**
 * /api/admin/buyer-requests — the list behind /dashboard/buyer-requests (admin-gated by src/proxy.ts).
 * GET → requests, newest first, each with its matching supplier offers.
 * PATCH { id, status?, admin_notes? } → review state.
 */
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { OFFER_TOOL } from '@/lib/supplier-offers/model'
import { REQUEST_TOOL, BR_STATUS_KEYS, matchOffers, type OfferRow } from '@/lib/sourcing/model'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const db = adminClient()
  const [{ data: reqs, error }, { data: offers }] = await Promise.all([
    db.from('tool_leads').select('id, email, name, company, phone, locale, answers, source_page, created_at').eq('tool', REQUEST_TOOL).order('created_at', { ascending: false }).limit(300),
    db.from('tool_leads').select('id, company, phone, email, consent, answers').eq('tool', OFFER_TOOL).limit(1000),
  ])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const all = (offers ?? []) as OfferRow[]
  const requests = (reqs ?? []).map(r => ({ ...r, matches: matchOffers(r.answers, all).slice(0, 15) }))
  return NextResponse.json({ requests })
}

export async function PATCH(req: NextRequest) {
  const b = await req.json().catch(() => ({})) as Record<string, unknown>
  const id = typeof b.id === 'string' ? b.id : ''
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const db = adminClient()
  const { data: row } = await db.from('tool_leads').select('answers').eq('id', id).eq('tool', REQUEST_TOOL).maybeSingle()
  if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const answers = { ...(row.answers as Record<string, unknown>) }
  if (typeof b.status === 'string') {
    if (!BR_STATUS_KEYS.has(b.status)) return NextResponse.json({ error: 'bad status' }, { status: 400 })
    answers._status = b.status
  }
  if (typeof b.admin_notes === 'string') answers._admin_notes = b.admin_notes.slice(0, 2000)
  answers._updated_at = new Date().toISOString()
  const { error } = await db.from('tool_leads').update({ answers }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, answers })
}
