/**
 * Partners — curated business partners (distinct from the /providers directory).
 *   GET   list all partners (fulfillment first)
 *   POST  { action:'convert', provider_id }  → promote a provider to a partner
 *         { action:'create', name_en, ... }  → create a partner directly
 *         Conversion is ONE-WAY (provider → partner), and idempotent per provider.
 *   PATCH { id, ...fields }                   → edit a partner's KYC/settings
 * Auth: under /api/admin → proxy-gated (admin only).
 */
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const slugify = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const EDITABLE = [
  'name_en', 'name_ar', 'slug', 'trade_license_no', 'trade_license_type', 'trade_license_expiry',
  'trade_license_url', 'trn', 'phone', 'email', 'website', 'emirate', 'address', 'services',
  'materials', 'description', 'logo_url', 'commission_pct', 'status', 'public_published',
  'account_email', 'notes', 'is_fulfillment',
]

export async function GET() {
  const db = adminClient()
  try {
    const { data } = await db.from('partners').select('*')
      .order('is_fulfillment', { ascending: false }).order('created_at', { ascending: false })
    return NextResponse.json({ partners: data ?? [] })
  } catch {
    return NextResponse.json({ partners: [] })
  }
}

export async function POST(req: NextRequest) {
  const db = adminClient()
  const body = await req.json().catch(() => ({} as any))

  if (body.action === 'convert') {
    const providerId = String(body.provider_id || '')
    if (!providerId) return NextResponse.json({ error: 'provider_id required' }, { status: 400 })

    // One-way + idempotent: a provider already promoted just returns its partner.
    const { data: existing } = await db.from('partners').select('id').eq('provider_id', providerId).maybeSingle()
    if (existing) return NextResponse.json({ ok: true, id: existing.id, deduped: true })

    const { data: p } = await db.from('providers').select('*').eq('id', providerId).maybeSingle()
    if (!p) return NextResponse.json({ error: 'provider_not_found' }, { status: 404 })

    let slug = p.slug || slugify(p.name_en || 'partner')
    const { data: slugHit } = await db.from('partners').select('id').eq('slug', slug).maybeSingle()
    if (slugHit) slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`

    const { data: created, error } = await db.from('partners').insert({
      provider_id: providerId,
      name_en: p.name_en, name_ar: p.name_ar ?? null, slug,
      trade_license_no: p.license_no ?? null, trade_license_type: p.license_type ?? null,
      phone: p.phone ?? null, email: p.email ?? null, website: p.website ?? null,
      emirate: p.emirate ?? null, services: p.category ?? null,
      account_email: p.email ?? null, status: 'active', is_fulfillment: false, public_published: false,
    }).select('id').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, id: created.id })
  }

  if (body.action === 'create') {
    if (!body.name_en) return NextResponse.json({ error: 'name_en required' }, { status: 400 })
    const { data: created, error } = await db.from('partners').insert({
      name_en: body.name_en, name_ar: body.name_ar ?? null,
      slug: body.slug ? slugify(body.slug) : slugify(body.name_en),
      status: 'active', is_fulfillment: false,
    }).select('id').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, id: created.id })
  }

  return NextResponse.json({ error: 'unknown_action' }, { status: 400 })
}

export async function PATCH(req: NextRequest) {
  const db = adminClient()
  const body = await req.json().catch(() => ({} as any))
  const id = String(body.id || '')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const patch: Record<string, unknown> = {}
  for (const k of EDITABLE) if (k in body) patch[k] = body[k] === '' ? null : body[k]
  if (typeof patch.slug === 'string') patch.slug = slugify(patch.slug) || null
  if ('slug' in patch && patch.slug) {
    const { data: clash } = await db.from('partners').select('id').eq('slug', patch.slug).neq('id', id).maybeSingle()
    if (clash) return NextResponse.json({ error: 'slug_taken' }, { status: 409 })
  }
  const { error } = await db.from('partners').update(patch).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
