/**
 * Partner self-service portal API.
 *   GET   — the partner record linked to the LOGGED-IN user's email
 *   PATCH — update only the partner's own self-editable fields
 *
 * Security: the partner row is derived from the authenticated session's email
 * (matched against partners.account_email), NEVER from a client-supplied id — so
 * a partner can only ever read/edit their OWN record. Owner-controlled fields
 * (commission, status, is_fulfillment, slug, KYC, account_email, provider_id)
 * are NOT in the editable whitelist. Not under /api/admin (that gate is owner-only).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server' // session (anon + cookies)
import { adminClient } from '@/lib/supabase/admin'    // service role (RLS bypass) for the row

export const runtime = 'nodejs'

// Fields a partner may edit about themselves. Everything else is owner-only.
const SELF_EDITABLE = [
  'name_en', 'name_ar', 'phone', 'email', 'website', 'address',
  'services', 'materials', 'description', 'logo_url', 'public_published',
]

async function sessionEmail(): Promise<string | null> {
  try {
    const sb = await createClient()
    const { data: { user } } = await sb.auth.getUser()
    return user?.email ? user.email.trim().toLowerCase() : null
  } catch { return null }
}

export async function GET() {
  const email = await sessionEmail()
  if (!email) return NextResponse.json({ ok: false, error: 'not_authenticated' }, { status: 401 })
  const db = adminClient()
  const { data: partner } = await db.from('partners').select('*').ilike('account_email', email).maybeSingle()
  if (!partner) return NextResponse.json({ ok: false, error: 'no_partner_linked', email }, { status: 404 })
  return NextResponse.json({ ok: true, partner, email })
}

export async function PATCH(req: NextRequest) {
  const email = await sessionEmail()
  if (!email) return NextResponse.json({ ok: false, error: 'not_authenticated' }, { status: 401 })
  const db = adminClient()

  // Resolve the partner from the SESSION email only — the client cannot target another row.
  const { data: partner } = await db.from('partners').select('id').ilike('account_email', email).maybeSingle()
  if (!partner) return NextResponse.json({ ok: false, error: 'no_partner_linked' }, { status: 404 })

  const body = await req.json().catch(() => ({} as any))
  const patch: Record<string, unknown> = {}
  for (const k of SELF_EDITABLE) if (k in body) patch[k] = body[k] === '' ? null : body[k]
  if (!Object.keys(patch).length) return NextResponse.json({ ok: true })

  const { error } = await db.from('partners').update(patch).eq('id', partner.id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
