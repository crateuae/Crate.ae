/**
 * GET  /api/admin/campaigns/[id]/sends  → list all sends for a campaign
 * POST /api/admin/campaigns/[id]/sends  { add_emails: string[] } → add new recipients
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await db()
    .from('campaign_sends')
    .select('*')
    .eq('campaign_id', id)
    .order('created_at', { ascending: false })
    .limit(2000)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sends: data ?? [] })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { add_emails } = await req.json() as { add_emails: string[] }

  if (!add_emails?.length) return NextResponse.json({ error: 'add_emails required' }, { status: 400 })

  const supabase = db()

  // Fetch current campaign
  const { data: campaign, error: cErr } = await supabase
    .from('email_campaigns')
    .select('audience, total_recipients')
    .eq('id', id)
    .single()
  if (cErr || !campaign) return NextResponse.json({ error: 'campaign not found' }, { status: 404 })

  // Merge new emails into audience.manual_emails (deduplicate)
  const existing: string[] = campaign.audience?.manual_emails ?? []
  const merged = Array.from(new Set([...existing, ...add_emails.map((e: string) => e.toLowerCase().trim())]))
  const newTotal = (campaign.total_recipients ?? 0) + (merged.length - existing.length)

  const { error: upErr } = await supabase
    .from('email_campaigns')
    .update({
      audience: { ...(campaign.audience ?? {}), manual_emails: merged },
      total_recipients: newTotal,
    })
    .eq('id', id)

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
  return NextResponse.json({ ok: true, total_recipients: newTotal, added: merged.length - existing.length })
}
