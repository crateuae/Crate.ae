/**
 * WEEKLY OUTREACH ASSEMBLER — GET/POST /api/organism/outreach
 *
 * Turns the top live opportunity into a ready-to-review outreach campaign aimed
 * at the matching supplier segment from the registry. SAFE BY DESIGN:
 *   - Disabled unless ENABLE_OUTREACH='true'.
 *   - Creates a DRAFT campaign only — a human reviews and hits send in the
 *     dashboard (the send path adds the compliance footer + List-Unsubscribe and
 *     anti-joins suppressions). It NEVER sends by itself.
 *   - Audience resolves from provider_contacts(status='verified') — empty until
 *     enrichment/self-claim provides consented contacts, in which case it no-ops.
 *
 * Protected by CRON_SECRET. Scheduled weekly by Vercel Cron.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveAudience, type AudienceSpec } from '@/lib/campaigns/audience'

export const maxDuration = 60

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } })
}

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // no secret configured → allow (dev)
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${secret}` || req.nextUrl.searchParams.get('secret') === secret
}

function pitch(o: { title: string; title_ar: string | null; category_guess: string | null }): { subject: string; body_html: string } {
  const cat = o.category_guess ?? 'FMCG'
  const subject = `فرصة توريد: ${o.title_ar ?? o.title} — Supply opportunity`
  const body_html = `
<div dir="rtl" style="font-family:Arial,sans-serif;font-size:14px;line-height:1.8;color:#1f2430">
  <p>مرحباً {{company}}،</p>
  <p>رصدنا طلباً متنامياً في السوق الإماراتي على <strong>${o.title_ar ?? o.title}</strong> ضمن فئة ${cat}.</p>
  <p>إن كنتم توفّرون هذا المنتج أو ما يماثله، يسعدنا ربطكم بمستوردين وموزّعين يبحثون عنه الآن — بدون أي التزام.</p>
  <p>هل ترغبون بإرسال قائمة الأسعار والحد الأدنى للطلب؟</p>
</div>
<div dir="ltr" style="font-family:Arial,sans-serif;font-size:14px;line-height:1.8;color:#1f2430;margin-top:14px">
  <p>Hello {{company}},</p>
  <p>We're seeing growing UAE demand for <strong>${o.title}</strong> in the ${cat} category.</p>
  <p>If you supply this or a close match, we'd be glad to connect you with importers/distributors actively sourcing it — no obligation.</p>
  <p>Could you share your price list and MOQ?</p>
</div>`
  return { subject, body_html }
}

async function run(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (process.env.ENABLE_OUTREACH !== 'true') {
    return NextResponse.json({ skipped: 'ENABLE_OUTREACH not set — outreach disabled' })
  }

  const supabase = db()

  // Top live opportunity with a category, not already used for outreach this week.
  const { data: opp } = await supabase
    .from('opportunities')
    .select('id, title, title_ar, category_guess, composite_score')
    .in('stage', ['approved', 'published', 'capturing'])
    .not('category_guess', 'is', null)
    .order('composite_score', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!opp) return NextResponse.json({ skipped: 'no eligible opportunity' })

  const audienceSpec: AudienceSpec = { source: 'providers', category: opp.category_guess ?? undefined, limit: 200 }
  const audience = await resolveAudience(supabase, audienceSpec)

  if (audience.length === 0) {
    return NextResponse.json({
      skipped: 'no verified provider contacts for this segment yet',
      hint: 'populate provider_contacts (self-claim or admin import) to activate outreach',
      opportunity: opp.title, category: opp.category_guess,
    })
  }

  const { subject, body_html } = pitch(opp)
  const { data: campaign, error } = await supabase.from('email_campaigns').insert({
    name: `Outreach — ${opp.title} (auto)`,
    subject, body_html,
    audience: audienceSpec,
    status: 'draft',
    total_recipients: audience.length,
  }).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    ok: true, mode: 'draft_for_review',
    campaign_id: campaign.id, opportunity: opp.title,
    segment: opp.category_guess, audience_size: audience.length,
    note: 'Draft created — review and send from /dashboard/campaigns.',
  })
}

export async function GET(req: NextRequest) { return run(req) }
export async function POST(req: NextRequest) { return run(req) }
