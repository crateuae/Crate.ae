/**
 * POST /api/providers/claim  { provider_id, email, contact_name?, phone? }
 * A company self-claims its registry listing and opts in to receive relevant
 * import opportunities. Stored as a CONSENTED contact, status='pending' until an
 * admin verifies (guards against impersonation). Only 'verified' rows are ever emailed.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function POST(req: NextRequest) {
  let body: Record<string, string>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }

  const provider_id = body.provider_id?.trim()
  const email = body.email?.trim().toLowerCase()
  if (!provider_id || !email || !email.includes('@')) {
    return NextResponse.json({ error: 'provider_id and a valid email are required' }, { status: 422 })
  }

  const supabase = db()

  // provider must exist
  const { data: prov } = await supabase.from('providers').select('id').eq('id', provider_id).maybeSingle()
  if (!prov) return NextResponse.json({ error: 'provider not found' }, { status: 404 })

  const { error } = await supabase.from('provider_contacts').upsert({
    provider_id, email,
    contact_name: body.contact_name?.trim() || null,
    phone: body.phone?.trim() || null,
    source: 'self_claimed', consent: true, confidence: 100, status: 'pending',
  }, { onConflict: 'provider_id,email' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
