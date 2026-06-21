import type { Metadata } from 'next'
import Link from 'next/link'
import { Search, Store, Plus } from 'lucide-react'
import { getProviders } from '@/lib/supabase/cached'
import ProviderCard, { type PublicProvider } from './ProviderCard'
import LoadMore from './LoadMore'
import { TRADING_CATEGORIES, catLabel } from './labels'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'شبكة الموردين — Crate',
  description: 'شركات التجارة العامة والمواد الغذائية المرخّصة في الإمارات — تواصل واطلب عبر Crate',
}

const PAGE_SIZE = 15

export default async function ProvidersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string; cat?: string }>
}) {
  const { locale } = await params
  const sp = await searchParams
  const isAr = locale === 'ar'

  const categoryFilter = sp.cat ?? ''
  const query = (sp.q ?? '').trim()

  // Public directory = GENERAL TRADING companies only.
  const { rows, total, category_counts } = await getProviders({
    type: 'trader',
    category: categoryFilter || undefined,
    query: query || undefined,
    from: 0,
    to: PAGE_SIZE - 1,
  })

  const firstRows = rows as PublicProvider[]

  // Category chips — data-driven, curated order then extras by count. NO "All" chip.
  const known = TRADING_CATEGORIES.filter(c => (category_counts[c] ?? 0) > 0)
  const extras = Object.keys(category_counts)
    .filter(c => !TRADING_CATEGORIES.includes(c) && (category_counts[c] ?? 0) > 0)
    .sort((a, b) => (category_counts[b] ?? 0) - (category_counts[a] ?? 0))
  const chipList = [...known, ...extras]

  function buildUrl(overrides: { cat?: string; q?: string }) {
    const merged = { cat: categoryFilter, q: query || undefined, ...overrides }
    const p = new URLSearchParams()
    if (merged.cat) p.set('cat', merged.cat)
    if (merged.q) p.set('q', merged.q)
    return `/${locale}/providers${p.size ? '?' + p.toString() : ''}`
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-white border-b border-gray-100 px-6 py-14">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-full px-4 py-1.5 text-indigo-600 text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
            {isAr ? 'السجل التجاري الرسمي — دبي DED' : 'Official Commerce Registry — Dubai DED'}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-3 tracking-tight">
            {isAr ? 'شبكة الموردين والمستوردين' : 'Suppliers & Importers Network'}
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed text-sm">
            {isAr
              ? `${(total ?? 0).toLocaleString('ar-EG')} شركة غذائية مرخّصة — تواصل واطلب عرض سعر عبر Crate كوسيط موثوق`
              : `${(total ?? 0).toLocaleString()} licensed food companies — contact & request quotes via Crate`}
          </p>

          {/* Search */}
          <form method="get" action={`/${locale}/providers`} className="max-w-xl mx-auto flex gap-2">
            {categoryFilter && <input type="hidden" name="cat" value={categoryFilter} />}
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input name="q" defaultValue={query}
                placeholder={isAr ? 'ابحث باسم الشركة…' : 'Search by company name…'}
                className="w-full ps-9 pe-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                dir={isAr ? 'rtl' : 'ltr'} />
            </div>
            <button type="submit"
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors whitespace-nowrap">
              {isAr ? 'بحث' : 'Search'}
            </button>
          </form>
        </div>
      </section>

      {/* ── Category filter (no "All", no emirates) ── */}
      <div className="bg-white border-b border-gray-100 sticky top-[58px] z-30">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {chipList.map(cat => {
              const active = categoryFilter === cat
              // Clicking the active chip clears the filter (the reset path).
              const href = active ? buildUrl({ cat: '' }) : buildUrl({ cat })
              return (
                <Link key={cat} href={href}
                  className={`px-3 py-1 rounded-full text-[11px] border transition-all whitespace-nowrap flex items-center gap-1 ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                      : 'text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                  }`}>
                  {catLabel(cat, isAr)}
                  <span className={`text-[10px] tabular-nums ${active ? 'text-indigo-200' : 'text-gray-400'}`}>
                    {(category_counts[cat] ?? 0).toLocaleString()}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Cards ── */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {firstRows.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Store className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="font-semibold">{isAr ? 'لا توجد شركات بهذه المعايير' : 'No companies match these filters'}</p>
            <Link href={`/${locale}/providers`} className="text-indigo-500 text-sm mt-2 inline-block hover:underline">
              {isAr ? 'إعادة ضبط' : 'Reset'}
            </Link>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
              {firstRows.map(p => <ProviderCard key={p.id} p={p} locale={locale} isAr={isAr} />)}
            </div>

            {/* Smooth "load more" — appends 15 at a time without a full reload */}
            <LoadMore
              locale={locale} isAr={isAr}
              cat={categoryFilter} q={query}
              initialFrom={PAGE_SIZE} total={total ?? 0}
            />
          </>
        )}

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-8 text-white text-center">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Plus className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-black mb-2">
            {isAr ? 'سجّل شركتك في الشبكة' : 'Register Your Company'}
          </h2>
          <p className="text-orange-100 text-sm mb-6 max-w-md mx-auto">
            {isAr
              ? 'سجّل شركتك ليصلك طلبات المستوردين والتجار عبر Crate'
              : 'List your company to receive importer and trader requests via Crate'}
          </p>
          <Link href={`/${locale}/login`}
            className="bg-white text-orange-600 font-black px-6 py-2.5 rounded-xl text-sm hover:bg-orange-50 transition-colors inline-block">
            {isAr ? 'تسجيل الدخول للانضمام' : 'Sign In to Join'}
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          {isAr
            ? 'البيانات من السجل التجاري الرسمي — دائرة الاقتصاد والسياحة دبي (DET) · آخر تحديث أبريل 2026'
            : 'Data from the official Commerce Registry — Dubai DET · Last updated April 2026'}
        </p>
      </div>
    </div>
  )
}
