/**
 * POST /api/admin/campaigns/generate
 * AI-generate a campaign subject + HTML body from a short brief.
 */
import { NextRequest, NextResponse } from 'next/server'
import { generateJSON } from '@/lib/ai/claude'

export async function POST(req: NextRequest) {
  const { brief, audience_hint, lang } = await req.json()
  if (!brief) return NextResponse.json({ error: 'brief required' }, { status: 400 })

  const system = `You are a professional B2B email copywriter for Crate.ae, a UAE food & beverage
trade platform. Write concise, trustworthy, non-spammy marketing emails. Arabic first unless asked.
Return ONLY JSON.`

  const prompt = `Write one marketing email.
Brief: ${brief}
Audience: ${audience_hint ?? 'UAE food traders / importers'}
Language: ${lang === 'en' ? 'English' : 'Arabic (RTL)'}

Return JSON:
{
  "subject": "short compelling subject line",
  "body_html": "<div dir='rtl'>...clean HTML, short paragraphs, one clear CTA linking to https://www.crate.ae ...</div>"
}`

  try {
    const out = await generateJSON<{ subject: string; body_html: string }>(prompt, system)
    return NextResponse.json(out)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'generation failed' }, { status: 500 })
  }
}
