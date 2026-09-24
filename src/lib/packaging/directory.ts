/**
 * PACKAGING DIRECTORY — the 836 packaging / repackaging companies (providers.type = 'repackager')
 * from the Dubai commercial registry, kept SEPARATE from the trading-company directory.
 *
 * Product rule preserved from the existing code ("hidden Crate-brokered service"): names and
 * activity kinds are public registry facts and are listed, but the licence number and issue date
 * are gated exactly as on the company page — this layer never returns them — and every contact
 * goes through a Crate request (the ProviderCard modal), never directly.
 */
import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

export type Bi = { en: string; ar: string }

/** The activity kinds present in providers.categories for repackagers (counts measured 2026-09-24). */
export const KINDS = [
  { key: 'materials', value: 'Packaging Materials Trading', label: { en: 'Packaging materials suppliers', ar: 'موردو مواد التغليف' }, short: { en: 'Materials suppliers', ar: 'موردو المواد' }, desc: { en: 'Companies licensed to trade in packaging materials — cartons, films, containers, bags.', ar: 'شركات مرخّصة للتجارة في مواد التغليف — كراتين، أغشية، عبوات، أكياس.' } },
  { key: 'manufacturers', value: 'Packaging Industries', label: { en: 'Packaging manufacturers (factories)', ar: 'مصانع التغليف' }, short: { en: 'Manufacturers', ar: 'المصانع' }, desc: { en: 'Companies licensed under the packaging-industries activity — manufacturers of packaging.', ar: 'شركات مرخّصة بنشاط صناعات التغليف — مصنّعو مواد وعبوات التغليف.' } },
  { key: 'services', value: 'Packaging Services', label: { en: 'Packing & packaging services', ar: 'خدمات التعبئة والتغليف' }, short: { en: 'Packing services', ar: 'خدمات التعبئة' }, desc: { en: 'Companies licensed to provide packing and packaging services for goods.', ar: 'شركات مرخّصة لتقديم خدمات التعبئة والتغليف للبضائع.' } },
  { key: 'repack', value: 'Repackaging Services', label: { en: 'Repackaging services', ar: 'خدمات إعادة التعبئة' }, short: { en: 'Repackaging', ar: 'إعادة التعبئة' }, desc: { en: 'Companies licensed to repack bulk goods into retail packs, including private-label repacking.', ar: 'شركات مرخّصة لإعادة تعبئة البضائع السائبة في عبوات تجزئة، ومنها إعادة التعبئة بعلامتك.' } },
  { key: 'labels', value: 'Labeling & Printing', label: { en: 'Labelling & printing', ar: 'الملصقات والطباعة' }, short: { en: 'Labels & printing', ar: 'الملصقات والطباعة' }, desc: { en: 'Companies licensed for labelling and printing on packaging.', ar: 'شركات مرخّصة للملصقات والطباعة على العبوات.' } },
] as const

export type KindKey = (typeof KINDS)[number]['key']
export const kindByKey = (k?: string | null) => KINDS.find(x => x.key === k)

export interface PackagingSupplier {
  id: string; slug: string; name_ar: string | null; name_en: string | null
  type: string | null; category: string | null; categories: string[] | null
  emirate: string | null; is_verified: boolean
  /** always null here — gated for repackagers, see file header */
  license_no: null; issue_date: null
}

const SELECT = 'id, slug, name_ar, name_en, type, category, categories, emirate, is_verified'

function client() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } })
}

export function getPackagingSuppliers(opts: { kind?: string; q?: string; from: number; to: number }) {
  const kind = kindByKey(opts.kind)
  const q = (opts.q ?? '').trim().slice(0, 80)
  return unstable_cache(
    async (): Promise<{ rows: PackagingSupplier[]; total: number }> => {
      try {
        let qb = client().from('providers').select(SELECT, { count: 'exact' }).eq('is_active', true).eq('type', 'repackager')
        if (kind) qb = qb.contains('categories', [kind.value])
        if (q) qb = qb.textSearch('fts', q, { type: 'websearch', config: 'simple' })
        const { data, count, error } = await qb.order('is_verified', { ascending: false }).order('name_en', { ascending: true }).range(opts.from, opts.to)
        if (error) { console.error('[packaging-directory] query:', error.message); return { rows: [], total: 0 } }
        const rows = (data ?? []).map(r => ({ ...r, license_no: null, issue_date: null })) as PackagingSupplier[]
        return { rows, total: count ?? 0 }
      } catch (e) { console.error('[packaging-directory] threw:', e); return { rows: [], total: 0 } }
    },
    ['packaging-suppliers-v1', kind?.key ?? 'all', q, String(opts.from), String(opts.to)],
    { revalidate: 3600, tags: ['providers', 'packaging'] },
  )()
}

/** Company count per kind + overall (cached 1 h). A company can sit under two kinds, so kinds do not sum to the total. */
export const getPackagingKindCounts = unstable_cache(
  async (): Promise<{ total: number; byKind: Record<string, number> }> => {
    const sb = client()
    const base = () => sb.from('providers').select('id', { count: 'exact', head: true }).eq('is_active', true).eq('type', 'repackager')
    try {
      const [all, ...each] = await Promise.all([base(), ...KINDS.map(k => base().contains('categories', [k.value]))])
      const byKind: Record<string, number> = {}
      KINDS.forEach((k, i) => { byKind[k.key] = each[i].count ?? 0 })
      return { total: all.count ?? 0, byKind }
    } catch (e) {
      console.error('[packaging-directory] counts:', e)
      return { total: 0, byKind: {} }
    }
  },
  ['packaging-kind-counts-v1'],
  { revalidate: 3600, tags: ['providers', 'packaging'] },
)
