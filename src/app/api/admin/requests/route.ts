/**
 * UNIFIED REQUESTS API — /api/admin/requests
 *
 * One inbox over every request type in the platform:
 *   - trader   → rfq_requests              (trader-contact RFQs)
 *   - packaging→ packaging_plans mode=cartons
 *   - repack   → packaging_plans mode=repack
 *   - basket   → packaging_plans mode=basket_mix
 *
 * GET   ?section=all|trader|packaging|repack|basket  → normalized list + counts
 * PATCH { id, source, status?, admin_notes? }        → update the right table
 * POST  { id, source, to, subject, message }         → reply by email (Resend)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

const FROM = process.env.RESEND_FROM_EMAIL ?? 'uae@crate.ae'

export type ReqSource = 'trader' | 'packaging' | 'repack' | 'basket'

export interface UnifiedRequest {
  id: string
  source: ReqSource
  title: string
  contact_name: string | null
  email: string | null
  phone: string | null
  company: string | null
  notes: string | null
  status: string
  admin_notes: string | null
  created_at: string
  detail: Record<string, unknown>
}

const MODE_TO_SOURCE: Record<string, ReqSource> = {
  cartons: 'packaging', rfq: 'packaging', repack: 'repack', basket_mix: 'basket',
}

function pick(obj: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) { const v = obj?.[k]; if (v != null && v !== '') return String(v) }
  return null
}

function normalizePlan(row: Record<string, unknown>): UnifiedRequest {
  const inp = (row.input_data as Record<string, unknown>) ?? {}
  const source = MODE_TO_SOURCE[String(row.mode)] ?? 'packaging'
  const title =
    source === 'basket' ? `سلة غذائية (${pick(inp, 'basket_count') ?? '?'})`
    : source === 'repack' ? (pick(inp, 'product_label') ?? 'إعادة تعبئة')
    : (pick(inp, 'product_label') ?? 'طلب تغليف')
  return {
    id: String(row.id),
    source,
    title,
    contact_name: pick(inp, 'contact_name'),
    email: pick(inp, 'email', 'contact_email'),
    phone: pick(inp, 'phone', 'contact_phone'),
    company: pick(inp, 'company_name', 'contact_company') ?? (row.brand_name as string | null) ?? null,
    notes: pick(inp, 'notes'),
    status: (row.status as string) ?? 'new',
    admin_notes: (row.admin_notes as string | null) ?? null,
    created_at: String(row.created_at),
    detail: { input_data: inp, output_data: row.output_data ?? null },
  }
}

function normalizeRfq(row: Record<string, unknown>): UnifiedRequest {
  return {
    id: String(row.id),
    source: 'trader',
    title: (row.product_name as string) ?? 'طلب تواصل',
    contact_name: (row.contact_name as string) ?? null,
    email: (row.contact_email as string) ?? null,
    phone: (row.contact_phone as string) ?? null,
    company: (row.company_name as string) ?? null,
    notes: (row.notes as string) ?? null,
    status: (row.status as string) ?? 'new',
    admin_notes: (row.admin_notes as string | null) ?? null,
    created_at: String(row.created_at),
    detail: {
      quantity: row.quantity, destination: row.destination,
      budget_aed: row.budget_aed, provider_id: row.provider_id, source_page: row.source_page,
    },
  }
}

// ── GET ──────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const section = (req.nextUrl.searchParams.get('section') ?? 'all') as ReqSource | 'all'
  const supabase = db()

  const [{ data: rfqs }, { data: plans }] = await Promise.all([
    section === 'all' || section === 'trader'
      ? supabase.from('rfq_requests').select('*').order('created_at', { ascending: false }).limit(500)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    section === 'all' || section !== 'trader'
      ? supabase.from('packaging_plans').select('*').order('created_at', { ascending: false }).limit(500)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ])

  let items: UnifiedRequest[] = [
    ...(rfqs ?? []).map(normalizeRfq),
    ...(plans ?? []).map(normalizePlan),
  ]

  // Section filter (packaging/repack/basket all come from packaging_plans)
  if (section !== 'all') items = items.filter(i => i.source === section)
  items.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))

  // Counts per section (always over the full set for the tab badges)
  const counts = { all: 0, trader: 0, packaging: 0, repack: 0, basket: 0 } as Record<string, number>
  const everyone: UnifiedRequest[] = [...(rfqs ?? []).map(normalizeRfq), ...(plans ?? []).map(normalizePlan)]
  for (const i of everyone) { counts[i.source]++; counts.all++ }

  return NextResponse.json({ items, counts })
}

// ── PATCH (status / admin notes) ─────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const { id, source, status, admin_notes } = await req.json()
  if (!id || !source) return NextResponse.json({ error: 'id and source required' }, { status: 400 })
  const table = source === 'trader' ? 'rfq_requests' : 'packaging_plans'
  const patch: Record<string, unknown> = {}
  if (status !== undefined) patch.status = status
  if (admin_notes !== undefined) patch.admin_notes = admin_notes
  const { error } = await db().from(table).update(patch).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// ── PUT (manually create a request in any section) ───────────────────────────
const SOURCE_TO_MODE: Record<string, string> = {
  packaging: 'cartons', repack: 'repack', basket: 'basket_mix',
}
export async function PUT(req: NextRequest) {
  const { source, title, contact_name, email, phone, company, notes } = await req.json()
  if (!source || !contact_name) return NextResponse.json({ error: 'source and contact_name required' }, { status: 400 })
  const supabase = db()

  if (source === 'trader') {
    const { data, error } = await supabase.from('rfq_requests').insert({
      product_name: title || 'طلب يدوي', contact_name,
      contact_email: email || null, contact_phone: phone || null,
      company_name: company || null, notes: notes || null, status: 'new', locale: 'ar',
    }).select('id').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, id: data.id })
  }

  const mode = SOURCE_TO_MODE[source]
  if (!mode) return NextResponse.json({ error: 'invalid source' }, { status: 400 })
  const { data, error } = await supabase.from('packaging_plans').insert({
    mode,
    input_data: { contact_name, email, phone, company_name: company, product_label: title, notes },
    output_data: null, brand_name: company || null, label_generated: false, status: 'new',
  }).select('id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: data.id })
}

// ── POST (reply by email) ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { id, source, to, subject, message } = await req.json()
  if (!to || !message) return NextResponse.json({ error: 'to and message required' }, { status: 400 })
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: 'email not configured' }, { status: 503 })

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: `Crate <${FROM}>`,
    to: [to],
    subject: subject || 'بخصوص طلبك عبر Crate',
    html: `<div dir="rtl" style="font-family:sans-serif;line-height:1.8;color:#1e293b">${String(message).replace(/\n/g, '<br>')}</div>`,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Best-effort: mark as contacted + log the reply in admin_notes
  if (id && source) {
    const table = source === 'trader' ? 'rfq_requests' : 'packaging_plans'
    await db().from(table).update({ status: 'contacted' }).eq('id', id)
  }
  return NextResponse.json({ ok: true })
}
