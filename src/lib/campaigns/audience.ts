/**
 * Audience resolver for email campaigns.
 * Two sources:
 *   - 'requesters' : people who already submitted a request (rfq_requests +
 *                    packaging_plans) — they HAVE emails and intent.
 *   - 'providers'  : companies from the directory, filtered by type/category/
 *                    emirate (only those with an email on file).
 * Returns de-duplicated recipients.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export interface AudienceSpec {
  source: 'requesters' | 'providers' | 'manual'
  // requesters
  request_sources?: string[]   // ['trader','packaging','repack','basket']
  statuses?: string[]          // ['new','contacted',...]
  // providers
  provider_type?: 'trader' | 'repackager'
  category?: string
  emirate?: string
  // manual addresses — always merged in, on top of the chosen source
  manual_emails?: string[]
  limit?: number
}

export interface Recipient { email: string; name: string | null; company: string | null }

const MODE_BY_SOURCE: Record<string, string> = {
  packaging: 'cartons', repack: 'repack', basket: 'basket_mix',
}

export async function resolveAudience(db: SupabaseClient, spec: AudienceSpec): Promise<Recipient[]> {
  const limit = Math.min(spec.limit ?? 5000, 10000)
  const map = new Map<string, Recipient>()

  // Manually-entered emails are always merged in, regardless of the source.
  for (const raw of spec.manual_emails ?? []) {
    const email = String(raw).trim().toLowerCase()
    if (email.includes('@') && !map.has(email)) map.set(email, { email, name: null, company: null })
  }

  if (spec.source === 'manual') return [...map.values()]

  if (spec.source === 'requesters') {
    const wantTrader = !spec.request_sources?.length || spec.request_sources.includes('trader')
    const planModes = (spec.request_sources?.length
      ? spec.request_sources.filter(s => s !== 'trader').map(s => MODE_BY_SOURCE[s]).filter(Boolean)
      : ['cartons', 'repack', 'basket_mix', 'rfq'])

    if (wantTrader) {
      let q = db.from('rfq_requests').select('contact_email, contact_name, company_name, status').not('contact_email', 'is', null).limit(limit)
      if (spec.statuses?.length) q = q.in('status', spec.statuses)
      const { data } = await q
      for (const r of data ?? []) {
        const email = (r.contact_email as string)?.trim().toLowerCase()
        if (email && !map.has(email)) map.set(email, { email, name: r.contact_name ?? null, company: r.company_name ?? null })
      }
    }
    if (planModes.length) {
      let q = db.from('packaging_plans').select('input_data, status, brand_name').in('mode', planModes).limit(limit)
      if (spec.statuses?.length) q = q.in('status', spec.statuses)
      const { data } = await q
      for (const r of data ?? []) {
        const inp = (r.input_data as Record<string, unknown>) ?? {}
        const email = String(inp.email ?? inp.contact_email ?? '').trim().toLowerCase()
        if (email && !map.has(email)) {
          map.set(email, {
            email,
            name: (inp.contact_name as string) ?? null,
            company: (inp.company_name as string) ?? (inp.contact_company as string) ?? (r.brand_name as string) ?? null,
          })
        }
      }
    }
  } else {
    // Outreach uses provider_contacts that are BOTH verified AND consented.
    // consent=true is required for TDRA compliance: admin-import and self-claim set
    // consent=true, but scraped places_api rows are consent=false — so even if an
    // admin bulk-"verifies" them, they are never marketed to. (Previously only
    // status was checked, which let non-consented scraped contacts leak in.)
    // Rows may be registry-linked OR standalone; LEFT join includes standalone too.
    const hasFilter = Boolean(spec.provider_type || spec.category || spec.emirate)
    const { data } = await db
      .from('provider_contacts')
      .select('email, contact_name, providers(name_en, name_ar, type, category, emirate, is_active)')
      .eq('status', 'verified')
      .eq('consent', true)
      .not('email', 'is', null)
      .limit(limit)
    type Row = { email: string; contact_name: string | null; providers: { name_en: string | null; name_ar: string | null; type: string | null; category: string | null; emirate: string | null; is_active: boolean | null } | null }
    for (const r of (data ?? []) as unknown as Row[]) {
      const p = r.providers
      // Provider-specific filters apply only to registry-linked rows; when a filter
      // is set, standalone (no-provider) contacts are excluded from that segment.
      if (hasFilter) {
        if (!p || p.is_active === false) continue
        if (spec.provider_type && p.type !== spec.provider_type) continue
        if (spec.category && p.category !== spec.category) continue
        if (spec.emirate && p.emirate !== spec.emirate) continue
      } else if (p && p.is_active === false) {
        continue
      }
      const email = r.email?.trim().toLowerCase()
      const company = p?.name_en ?? p?.name_ar ?? null
      if (email && !map.has(email)) map.set(email, { email, name: r.contact_name ?? company, company })
    }
  }

  // COMPLIANCE: drop any suppressed address from EVERY audience source.
  const all = [...map.values()]
  if (all.length) {
    const { data: supp } = await db.from('email_suppressions').select('email').in('email', all.map(r => r.email))
    if (supp?.length) {
      const blocked = new Set(supp.map((s: { email: string }) => s.email.toLowerCase()))
      return all.filter(r => !blocked.has(r.email.toLowerCase()))
    }
  }
  return all
}
