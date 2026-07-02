/**
 * Admin contact enrichment.
 * GET               → list pending self-claims awaiting verification
 * POST { rows:[…] } → bulk-import verified contacts (mapped to registry providers)
 * PATCH { id,status}→ verify/reject a pending self-claim
 *
 * Each row: { email, provider_slug?, company?, contact_name?, phone? }
 * Rows are matched to a provider by slug (exact) or company name (ilike);
 * unmatched rows are reported back (use a campaign's manual list for those).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function GET() {
  const { data, error } = await db()
    .from('provider_contacts')
    .select('id, email, contact_name, phone, source, status, created_at, providers(name_en, slug)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ pending: data ?? [] })
}

export async function POST(req: NextRequest) {
  let body: { rows?: Array<Record<string, string>> }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }
  const rows = body.rows ?? []
  if (!rows.length) return NextResponse.json({ error: 'rows required' }, { status: 422 })

  const supabase = db()
  let imported = 0
  const unmatched: string[] = []

  for (const row of rows) {
    const email = row.email?.trim().toLowerCase()
    if (!email || !email.includes('@')) continue

    // Resolve provider by slug, else by company name.
    let providerId: string | null = null
    if (row.provider_slug?.trim()) {
      const { data } = await supabase.from('providers').select('id').eq('slug', row.provider_slug.trim()).maybeSingle()
      providerId = data?.id ?? null
    }
    if (!providerId && row.company?.trim()) {
      const { data } = await supabase.from('providers').select('id').ilike('name_en', `%${row.company.trim()}%`).limit(1).maybeSingle()
      providerId = data?.id ?? null
    }
    if (!providerId) { unmatched.push(email); continue }

    const { error } = await supabase.from('provider_contacts').upsert({
      provider_id: providerId, email,
      contact_name: row.contact_name?.trim() || null,
      phone: row.phone?.trim() || null,
      source: 'admin_import', consent: true, confidence: 100,
      status: 'verified', verified_at: new Date().toISOString(),
    }, { onConflict: 'provider_id,email' })
    if (!error) imported++
  }

  return NextResponse.json({ ok: true, imported, unmatched, unmatched_count: unmatched.length })
}

export async function PATCH(req: NextRequest) {
  const { id, status } = await req.json()
  if (!id || !['verified', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'id and status (verified|rejected) required' }, { status: 422 })
  }
  const patch: Record<string, unknown> = { status }
  if (status === 'verified') patch.verified_at = new Date().toISOString()
  const { error } = await db().from('provider_contacts').update(patch).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
