import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Package, ShieldCheck, MapPin, BadgeCheck,
  ArrowRight, ArrowLeft, Repeat2, Store, Search,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'شبكة الموردين — Crate',
  description: 'شركات إعادة التعبئة والتغليف وشركات الاستيراد والتجارة العامة في الإمارات',
}

const PAGE_SIZE = 24

const EMIRATES_AR = ['الكل', 'Dubai', 'Abu Dhabi', 'Sharjah', 'Ras Al Khaimah', 'Ajman']
const EMIRATES_EN = ['All',  'Dubai', 'Abu Dhabi', 'Sharjah', 'Ras Al Khaimah', 'Ajman']
const EMIRATES_LABELS_AR: Record<string, string> = {
  'Dubai': 'دبي', 'Abu Dhabi': 'أبوظبي', 'Sharjah': 'الشارقة',
  'Ras Al Khaimah': 'رأس الخيمة', 'Ajman': 'عجمان',
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default async function ProvidersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ type?: string; emirate?: string; q?: string; page?: string }>
}) {
  const { locale }  = await params
  const sp          = await searchParams
  const isAr        = locale === 'ar'
  const Arrow       = isAr ? ArrowLeft : ArrowRight

  const typeFilter   = (sp.type    ?? 'all') as 'all' | 'trader' | 'repackager'
  const emirateFilter = sp.emirate ?? 'all'
  const query        = (sp.q       ?? '').trim()
  const page         = Math.max(1, parseInt(sp.page ?? '1', 10))
  const from         = (page - 1) * PAGE_SIZE
  const to           = from + PAGE_SIZE - 1

  // ── Fetch from Supabase ──────────────────────────────────────────────────
  const supabase = await createClient()

  let dbQuery = supabase
    .from('providers')
    .select('id, slug, name_ar, name_en, type, category, emirate, license_no, license_status, is_verified', { count: 'exact' })
    .eq('is_active', true)
    .order('is_verified', { ascending: false })
    .order('name_en', { ascending: true })
    .range(from, to)

  if (typeFilter !== 'all')    dbQuery = dbQuery.eq('type', typeFilter)
  if (emirateFilter !== 'all') dbQuery = dbQuery.eq('emirate', emirateFilter)
  if (query)                   dbQuery = dbQuery.textSearch('fts', query, { type: 'websearch' })

  const { data: providers = [], count = 0 } = await dbQuery

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  // ── Counts for tabs ──────────────────────────────────────────────────────
  const [{ count: totalTraders }, { count: totalRepackagers }] = await Promise.all([
    supabase.from('providers').select('*', { count: 'exact', head: true })
      .eq('is_active', true).eq('type', 'trader'),
    supabase.from('providers').select('*', { count: 'exact', head: true })
      .eq('is_active', true).eq('type', 'repackager'),
  ])

  // ── Build filter URL helper ──────────────────────────────────────────────
  function buildUrl(overrides: Record<string, string | undefined>) {
    const base = { type: typeFilter, emirate: emirateFilter, q: query || undefined, page: undefined }
    const merged = { ...base, ...overrides }
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== 'all' && v !== '') params.set(k, v)
    }
    return `/${locale}/providers${params.size ? '?' + params.toString() : ''}`
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-white border-b border-gray-100 px-6 py-14">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-full px-4 py-1.5 text-indigo-600 text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
            {isAr ? 'سجل تجاري دبي الرسمي — DED' : 'Official Dubai Commercial Registry — DED'}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-3 tracking-tight">
            {isAr ? 'دليل الموردين والمستوردين' : 'Suppliers & Importers Directory'}
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed text-sm">
            {isAr
              ? `${(count ?? 0).toLocaleString('ar-EG')} شركة من السجل التجاري الرسمي لدبي — يمكنك البحث والفلترة بحسب النوع والإمارة`
              : `${(count ?? 0).toLocaleString()} companies from Dubai's official commercial registry — search and filter by type and emirate`}
          </p>

          {/* ── Search bar ── */}
          <form method="get" action={`/${locale}/providers`} className="max-w-xl mx-auto flex gap-2">
            <input type="hidden" name="type"    value={typeFilter !== 'all' ? typeFilter : ''} />
            <input type="hidden" name="emirate" value={emirateFilter !== 'all' ? emirateFilter : ''} />
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                name="q"
                defaultValue={query}
                placeholder={isAr ? 'ابحث باسم الشركة…' : 'Search by company name…'}
                className="w-full ps-9 pe-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                dir={isAr ? 'rtl' : 'ltr'}
              />
            </div>
            <button type="submit"
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors whitespace-nowrap">
              {isAr ? 'بحث' : 'Search'}
            </button>
          </form>
        </div>
      </section>

      {/* ── Filters ── */}
      <div className="bg-white border-b border-gray-100 sticky top-[58px] z-30">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-3 flex-wrap">
          {/* Type */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {([
              { val: 'all',        ar: 'الكل',          en: 'All',          count: (totalTraders ?? 0) + (totalRepackagers ?? 0) },
              { val: 'trader',     ar: 'تجارة عامة',    en: 'Trading',      count: totalTraders ?? 0 },
              { val: 'repackager', ar: 'إعادة تعبئة',   en: 'Repackaging',  count: totalRepackagers ?? 0 },
            ] as const).map(opt => (
              <Link key={opt.val} href={buildUrl({ type: opt.val, page: undefined })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  typeFilter === opt.val ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {isAr ? opt.ar : opt.en}
                <span className="text-[9px] bg-gray-100 rounded px-1">{opt.count.toLocaleString()}</span>
              </Link>
            ))}
          </div>

          {/* Emirate */}
          <div className="flex items-center gap-1 flex-wrap">
            {EMIRATES_EN.map((em, i) => {
              const val = i === 0 ? 'all' : em
              const active = emirateFilter === val
              const label = isAr ? (EMIRATES_LABELS_AR[em] ?? em) : em
              return (
                <Link key={em} href={buildUrl({ emirate: val, page: undefined })}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-all whitespace-nowrap flex items-center gap-1 ${
                    active ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-gray-500 hover:bg-gray-100'
                  }`}>
                  {i !== 0 && <MapPin className="w-2.5 h-2.5" />}
                  {label}
                </Link>
              )
            })}
          </div>

          <span className="ms-auto text-xs text-gray-400">
            {(count ?? 0).toLocaleString()} {isAr ? 'شركة' : 'companies'}
          </span>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {providers && providers.length > 0 ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {providers.map(p => {
              const isRepack  = p.type === 'repackager'
              const typeColor = isRepack
                ? 'text-orange-600 bg-orange-50 border-orange-200'
                : 'text-indigo-600 bg-indigo-50 border-indigo-200'
              const TypeIcon  = isRepack ? Repeat2 : Store
              const emLabel   = isAr
                ? (EMIRATES_LABELS_AR[p.emirate ?? ''] ?? p.emirate)
                : p.emirate

              return (
                <Link key={p.id} href={`/${locale}/providers/${p.slug}`}
                  className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all group">

                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isRepack ? 'bg-orange-50' : 'bg-indigo-50'}`}>
                        <TypeIcon className={`w-4.5 h-4.5 ${isRepack ? 'text-orange-500' : 'text-indigo-500'}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 text-sm leading-snug truncate">
                          {isAr ? (p.name_ar || p.name_en) : (p.name_en || p.name_ar)}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate mt-0.5">
                          {isAr ? p.name_en : p.name_ar}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0 ms-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${typeColor}`}>
                        {isRepack ? (isAr ? 'تعبئة' : 'Repackager') : (isAr ? 'تجارة' : 'Trader')}
                      </span>
                      {p.is_verified && (
                        <span className="flex items-center gap-0.5 text-[9px] text-emerald-600 font-bold">
                          <BadgeCheck className="w-3 h-3" />
                          {isAr ? 'موثّق' : 'Verified'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-[10px] text-gray-400 mb-3">
                    {p.emirate && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{emLabel}
                      </span>
                    )}
                    {p.license_no && (
                      <span className="truncate">
                        {isAr ? 'رخصة:' : 'Lic:'} {p.license_no}
                      </span>
                    )}
                    {p.license_status && (
                      <span className={`ms-auto px-1.5 py-0.5 rounded text-[9px] font-medium ${
                        p.license_status === 'Active'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {isAr
                          ? (p.license_status === 'Active' ? 'نشط' : p.license_status === 'Cancelled' ? 'ملغى' : 'غير محدد')
                          : p.license_status}
                      </span>
                    )}
                  </div>

                  <div className="mt-auto pt-2 border-t border-gray-100 flex items-center">
                    <span className="text-[10px] text-indigo-500 font-semibold group-hover:text-indigo-700 flex items-center gap-0.5">
                      {isAr ? 'عرض الملف' : 'View Profile'}
                      <Arrow className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <Store className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="font-semibold">{isAr ? 'لا توجد شركات بهذه المعايير' : 'No companies match these filters'}</p>
            <Link href={`/${locale}/providers`} className="text-indigo-500 text-sm mt-2 inline-block hover:underline">
              {isAr ? 'إعادة ضبط الفلاتر' : 'Reset filters'}
            </Link>
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            {page > 1 && (
              <Link href={buildUrl({ page: String(page - 1) })}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold hover:border-indigo-300 transition-colors">
                {isAr ? 'السابق' : 'Previous'}
              </Link>
            )}
            <span className="text-sm text-gray-500 px-2">
              {isAr
                ? `صفحة ${page.toLocaleString('ar-EG')} من ${totalPages.toLocaleString('ar-EG')}`
                : `Page ${page} of ${totalPages}`}
            </span>
            {page < totalPages && (
              <Link href={buildUrl({ page: String(page + 1) })}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold hover:border-indigo-300 transition-colors">
                {isAr ? 'التالي' : 'Next'}
              </Link>
            )}
          </div>
        )}

        {/* ── Info note ── */}
        <div className="mt-10 bg-blue-50 border border-blue-100 rounded-2xl p-5 text-sm text-blue-800">
          <strong>{isAr ? 'مصدر البيانات:' : 'Data Source:'}</strong>{' '}
          {isAr
            ? 'السجل التجاري الرسمي — دائرة الاقتصاد والسياحة دبي (DET) عبر data.dubai. يحتوي على 1,004,828 سجل، آخر تحديث أبريل 2026.'
            : 'Official Commerce Registry — Dubai Department of Economy & Tourism (DET) via data.dubai. Contains 1,004,828 records, last updated April 2026.'}
          {' '}
          <Link href={`/${locale}/providers?type=repackager`} className="underline font-semibold">
            {isAr ? 'شركات التعبئة' : 'Packaging companies'}
          </Link>
          {' · '}
          <Link href={`/${locale}/providers?type=trader`} className="underline font-semibold">
            {isAr ? 'شركات التجارة العامة' : 'General trading companies'}
          </Link>
        </div>
      </div>
    </div>
  )
}
