import type { Metadata } from 'next'
import Link from 'next/link'
import {
  MapPin, BadgeCheck, CheckCircle2,
  ArrowRight, ArrowLeft, Repeat2, Store, Search, Plus,
  ShieldCheck, ExternalLink,
} from 'lucide-react'
import { getProviders } from '@/lib/supabase/cached'

// ─── Provider Card ────────────────────────────────────────────────────────────

type StaticProvider = {
  slug: string; type: 'repackager' | 'trader'; name_ar: string; name_en: string
  emirate: string; zone: string; is_verified: boolean; license_no: null; issue_date: null
  category?: string | null
  specialties_ar: string[]; specialties_en: string[]
  services_ar: string[]; services_en: string[]
  certs: string[]
}

type DbProvider = {
  id: string; slug: string; name_ar: string | null; name_en: string | null
  type: string | null; category: string | null; categories: string[] | null
  emirate: string | null; license_no: string | null; issue_date: string | null; is_verified: boolean
}

const EMIRATES_LABELS_AR: Record<string, string> = {
  'Dubai': 'دبي', 'Abu Dhabi': 'أبوظبي', 'Sharjah': 'الشارقة',
  'Ras Al Khaimah': 'رأس الخيمة', 'Ajman': 'عجمان',
}

function fmtDate(d: string | null, isAr: boolean) {
  if (!d) return null
  try { return new Date(d).toLocaleDateString(isAr ? 'ar-AE' : 'en-AE', { year: 'numeric', month: 'short' }) }
  catch { return d }
}

function ProviderCard({ p, isStatic, locale, isAr }: {
  p: DbProvider | StaticProvider
  isStatic: boolean
  locale: string
  isAr: boolean
}) {
  const isRepack = p.type === 'repackager'
  const TypeIcon = isRepack ? Repeat2 : Store
  const emLabel  = isAr ? (EMIRATES_LABELS_AR[p.emirate ?? ''] ?? p.emirate) : p.emirate
  const sp       = isStatic ? (p as StaticProvider) : null
  const specialties = sp ? (isAr ? sp.specialties_ar : sp.specialties_en) : []
  const services    = sp ? (isAr ? sp.services_ar    : sp.services_en)    : []
  const certs       = sp ? sp.certs : []
  const zone        = sp ? sp.zone : null

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isRepack ? 'bg-orange-50' : 'bg-indigo-50'}`}>
            <TypeIcon className={`w-5 h-5 ${isRepack ? 'text-orange-500' : 'text-indigo-500'}`} />
          </div>
          <div className="min-w-0">
            <div className="font-black text-gray-900 text-sm leading-tight">
              {isAr ? (p.name_ar || p.name_en) : (p.name_en || p.name_ar)}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5 truncate">
              {isAr ? p.name_en : p.name_ar}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0 ms-2">
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
            isRepack ? 'text-orange-600 bg-orange-50 border-orange-200' : 'text-indigo-600 bg-indigo-50 border-indigo-200'
          }`}>
            {isRepack ? (isAr ? 'إعادة تعبئة' : 'Repackager') : (isAr ? 'تجارة عامة' : 'Trader')}
          </span>
          {p.is_verified && (
            <span className="flex items-center gap-0.5 text-[9px] text-emerald-600 font-bold">
              <BadgeCheck className="w-3 h-3" />
              {isAr ? 'موثّق' : 'Verified'}
            </span>
          )}
        </div>
      </div>

      {/* Category badges — show all categories this company has */}
      {(() => {
        const cats = (p as DbProvider).categories?.length
          ? (p as DbProvider).categories!
          : p.category ? [p.category] : []
        return cats.length > 0 ? (
          <div className="flex flex-wrap gap-1 mb-2">
            {cats.slice(0, 3).map(cat => (
              <span key={cat} className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                {isAr ? (CATEGORY_LABELS_AR[cat] ?? cat) : cat}
              </span>
            ))}
            {cats.length > 3 && (
              <span className="text-[10px] text-gray-400 px-1 py-0.5">+{cats.length - 3}</span>
            )}
          </div>
        ) : null
      })()}

      {(emLabel || zone) && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          {emLabel && <span className="font-medium">{emLabel}</span>}
          {zone && <><span className="text-gray-300">·</span><span className="text-gray-400 truncate">{zone}</span></>}
        </div>
      )}

      {(p.license_no || p.issue_date) && (
        <div className="flex items-center gap-3 text-[10px] text-gray-400 mb-3">
          {p.license_no && <span>{isAr ? 'رخصة:' : 'Lic:'} <span className="text-gray-600 font-medium">{p.license_no}</span></span>}
          {p.issue_date && <span>{isAr ? 'الإصدار:' : 'Since:'} <span className="text-gray-600 font-medium">{fmtDate(p.issue_date, isAr)}</span></span>}
        </div>
      )}

      {specialties.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] text-gray-400 mb-1.5">{isAr ? 'التخصص:' : 'Specialties:'}</div>
          <div className="flex flex-wrap gap-1">
            {specialties.map(s => (
              <span key={s} className="text-[10px] bg-gray-50 border border-gray-200 text-gray-600 rounded-md px-2 py-0.5">{s}</span>
            ))}
          </div>
        </div>
      )}

      {services.length > 0 && (
        <div className="mb-3 flex-1">
          <div className="text-[10px] text-gray-400 mb-1.5">{isAr ? 'الخدمات:' : 'Services:'}</div>
          <ul className="space-y-1">
            {services.slice(0, 3).map(s => (
              <li key={s} className="flex items-start gap-1.5 text-xs text-gray-600">
                <CheckCircle2 className={`w-3 h-3 flex-shrink-0 mt-0.5 ${isRepack ? 'text-orange-400' : 'text-indigo-400'}`} />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {certs.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {certs.map(c => (
            <span key={c} className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 rounded px-1.5 py-0.5 font-medium">{c}</span>
          ))}
        </div>
      )}

      <div className={`border-t border-gray-100 pt-3 flex items-center gap-2 flex-wrap ${specialties.length === 0 && services.length === 0 ? 'mt-auto' : ''}`}>
        <Link href={`/${locale}/compliance`}
          className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 hover:text-indigo-600">
          <ShieldCheck className="w-3 h-3" />
          {isAr ? 'اشتراطات الاستيراد' : 'Import Requirements'}
        </Link>
        <Link href={`/${locale}/market`}
          className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-700">
          {isAr ? 'فرص السوق' : 'Market Gaps'}
        </Link>
        {p.slug && (
          <Link href={`/${locale}/providers/${p.slug}`}
            className="ms-auto flex items-center gap-0.5 text-[10px] text-gray-400 hover:text-gray-700">
            <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'شبكة الموردين — Crate',
  description: 'شركات التجارة العامة والمواد الغذائية المرخّصة في الإمارات',
}

const PAGE_SIZE = 24

const EMIRATES_EN = ['All', 'Dubai', 'Abu Dhabi', 'Sharjah', 'Ras Al Khaimah', 'Ajman']

// All category labels — EN key → AR label
const CATEGORY_LABELS_AR: Record<string, string> = {
  // Trading
  'Restaurant':                   'مطعم',
  'Fast Food':                    'وجبات سريعة',
  'Café & Coffee':                'مقهى وقهوة',
  'Supermarket':                  'سوبرماركت',
  'Bakery & Pastry':              'مخبز وحلويات',
  'Catering':                     'تموين وضيافة',
  'Seafood':                      'مأكولات بحرية',
  'Meat & Poultry':               'لحوم ودواجن',
  'Dairy & Eggs':                 'ألبان وبيض',
  'Frozen Foods':                 'أغذية مجمدة',
  'Beverages & Juices':           'مشروبات وعصائر',
  'Chocolate & Sweets':           'شوكولاتة وحلوى',
  'Spices & Condiments':          'توابل وبهارات',
  'Grains & Flour':               'حبوب ودقيق',
  'Oils & Fats':                  'زيوت ودهون',
  'Organic & Natural':            'أغذية عضوية',
  'Health & Nutrition':           'صحة وتغذية',
  'Snacks & Chips':               'وجبات خفيفة',
  'Grocery & General Food':       'بقالة وغذاء عام',
  'Food Packaging':               'تعبئة وتغليف',
  'General Trading':              'تجارة عامة',
  'Foodstuff Trading':            'تجارة مواد غذائية',
  // Packaging
  'Packaging Services':           'خدمات التعبئة والتغليف',
  'Packaging Materials Trading':  'تجارة مواد التعبئة',
  'Repackaging Services':         'إعادة التعبئة والتغليف',
  'Packaging Industries':         'صناعات التعبئة والتغليف',
  'Labeling & Printing':          'ملصقات وطباعة',
  'Fruits & Vegetables Packaging':'تعبئة الفواكه والخضراوات',
  'Spices & Condiments Packaging':'تعبئة البهارات والتوابل',
  'Sugar & Sweets Packaging':     'تعبئة السكر والحلويات',
}

// Trading subcategory order (by count from classification)
const TRADING_CATEGORIES = [
  'Grocery & General Food',
  'Restaurant',
  'Foodstuff Trading',
  'Café & Coffee',
  'Beverages & Juices',
  'Catering',
  'Oils & Fats',
  'Bakery & Pastry',
  'General Trading',
  'Seafood',
  'Grains & Flour',
  'Supermarket',
  'Meat & Poultry',
  'Spices & Condiments',
  'Health & Nutrition',
  'Dairy & Eggs',
  'Organic & Natural',
  'Snacks & Chips',
  'Chocolate & Sweets',
  'Fast Food',
  'Frozen Foods',
]

// Static providers — cleared, all data now comes from DB
const STATIC_PROVIDERS: StaticProvider[] = []

// ─── Page ──────────────────────────────────────────────────────────────────

export default async function ProvidersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ type?: string; emirate?: string; q?: string; page?: string; cat?: string }>
}) {
  const { locale }    = await params
  const sp            = await searchParams
  const isAr          = locale === 'ar'
  const Arrow         = isAr ? ArrowLeft : ArrowRight

  // Public directory shows GENERAL TRADING companies only.
  // Repackaging/packaging companies are a hidden Crate-brokered service (admin-only).
  const typeFilter = 'trader' as const
  const emirateFilter  = sp.emirate ?? 'all'
  const categoryFilter = sp.cat ?? 'all'
  const query          = (sp.q ?? '').trim()
  const page           = Math.max(1, parseInt(sp.page ?? '1', 10))
  const from           = (page - 1) * PAGE_SIZE
  const to             = from + PAGE_SIZE - 1

  // Single cached RPC call
  const { rows: dbProviders, total: count, category_counts } =
    await getProviders({
      type:     typeFilter,
      emirate:  emirateFilter  !== 'all' ? emirateFilter  : undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      query:    query || undefined,
      from,
      to,
    })

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  // Show static providers only on page 1 with no filters
  const showStatic = page === 1 && emirateFilter === 'all' && !query
  const staticFiltered = STATIC_PROVIDERS.filter(p => {
    const emOk   = emirateFilter === 'all' || p.emirate === emirateFilter
    const qOk    = !query || p.name_en.toLowerCase().includes(query.toLowerCase()) || p.name_ar.includes(query)
    return emOk && qOk
  })

  function buildUrl(overrides: Record<string, string | undefined>) {
    const base   = { emirate: emirateFilter, cat: categoryFilter, q: query || undefined, page: undefined }
    const merged = { ...base, ...overrides }
    const p      = new URLSearchParams()
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== 'all' && v !== '') p.set(k, v)
    }
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
            {isAr ? 'شبكة الموردين\nوالمستوردين' : 'Suppliers &\nImporters Network'}
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed text-sm">
            {isAr
              ? `${((count ?? 0) + STATIC_PROVIDERS.length).toLocaleString('ar-EG')} شركة تجارة غذائية مرخّصة من السجل التجاري الرسمي لدبي`
              : `${((count ?? 0) + STATIC_PROVIDERS.length).toLocaleString()} licensed food trading companies from Dubai's official registry`}
          </p>

          {/* Search */}
          <form method="get" action={`/${locale}/providers`} className="max-w-xl mx-auto flex gap-2">
            {emirateFilter !== 'all' && <input type="hidden" name="emirate" value={emirateFilter} />}
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

      {/* ── Filters ── */}
      <div className="bg-white border-b border-gray-100 sticky top-[58px] z-30">
        <div className="max-w-6xl mx-auto px-6 py-3 space-y-2">

          {/* Row 1: Emirates + count */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1 flex-wrap">
              {EMIRATES_EN.map((em, i) => {
                const val    = i === 0 ? 'all' : em
                const active = emirateFilter === val
                const label  = isAr ? (EMIRATES_LABELS_AR[em] ?? em) : em
                return (
                  <Link key={em} href={buildUrl({ emirate: val, page: undefined })}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-all whitespace-nowrap flex items-center gap-1 ${
                      active ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-gray-500 hover:bg-gray-100'
                    }`}>
                    {i !== 0 && <MapPin className="w-2.5 h-2.5" />}{label}
                  </Link>
                )
              })}
            </div>

            <span className="ms-auto text-xs text-gray-400">
              {(count ?? 0).toLocaleString()} {isAr ? 'شركة' : 'companies'}
            </span>
          </div>

          {/* Row 2: Trading subcategory chips — data-driven from live counts */}
          {(() => {
            // Prefer the curated order, then append any other category that has rows.
            const known   = TRADING_CATEGORIES.filter(c => (category_counts[c] ?? 0) > 0)
            const extras  = Object.keys(category_counts)
              .filter(c => !TRADING_CATEGORIES.includes(c) && (category_counts[c] ?? 0) > 0)
              .sort((a, b) => (category_counts[b] ?? 0) - (category_counts[a] ?? 0))
            const chipList    = [...known, ...extras]
            const activeColor = 'bg-indigo-600 text-white border-indigo-600 font-bold'
            const hoverColor  = 'hover:border-indigo-300 hover:text-indigo-600'
            const activeCount = 'text-indigo-200'
            return (
              <div className="flex items-center gap-1.5 flex-wrap pb-1">
                <Link href={buildUrl({ cat: 'all', page: undefined })}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all whitespace-nowrap flex items-center gap-1 ${
                    categoryFilter === 'all'
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700'
                  }`}>
                  {isAr ? 'الكل' : 'All'}
                  <span className={`text-[10px] tabular-nums ${categoryFilter === 'all' ? 'text-gray-300' : 'text-gray-400'}`}>
                    {(count ?? 0).toLocaleString()}
                  </span>
                </Link>
                {chipList.filter(cat => (category_counts[cat] ?? 0) > 0).map(cat => {
                  const active = categoryFilter === cat
                  const label  = isAr ? (CATEGORY_LABELS_AR[cat] ?? cat) : cat
                  const cnt    = category_counts[cat] ?? 0
                  return (
                    <Link key={cat} href={buildUrl({ cat, page: undefined })}
                      className={`px-3 py-1 rounded-full text-[11px] border transition-all whitespace-nowrap flex items-center gap-1 ${
                        active ? activeColor : `text-gray-500 border-gray-200 ${hoverColor}`
                      }`}>
                      {label}
                      <span className={`text-[10px] tabular-nums ${active ? activeCount : 'text-gray-400'}`}>
                        {cnt.toLocaleString()}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )
          })()}
        </div>
      </div>

      {/* ── Cards ── */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">

          {/* Static verified providers first (page 1, no filters) */}
          {showStatic && staticFiltered.map(p => (
            <ProviderCard key={p.slug} p={p} isStatic={true} locale={locale} isAr={isAr} />
          ))}

          {/* DB providers */}
          {dbProviders.map((p: DbProvider) => (
            <ProviderCard key={p.id} p={p} isStatic={false} locale={locale} isAr={isAr} />
          ))}
        </div>

        {(!dbProviders || dbProviders.length === 0) && !showStatic && (
          <div className="text-center py-20 text-gray-400">
            <Store className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="font-semibold">{isAr ? 'لا توجد شركات بهذه المعايير' : 'No companies match these filters'}</p>
            <Link href={`/${locale}/providers`} className="text-indigo-500 text-sm mt-2 inline-block hover:underline">
              {isAr ? 'إعادة ضبط الفلاتر' : 'Reset filters'}
            </Link>
          </div>
        )}

        {/* Pagination */}
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
              ? 'سجّل شركة التجارة العامة أو المواد الغذائية ليجدك المستوردون والموردون في الإمارات'
              : 'List your general trading or foodstuff company so UAE importers and suppliers can find you'}
          </p>
          <Link href={`/${locale}/login`}
            className="bg-white text-orange-600 font-black px-6 py-2.5 rounded-xl text-sm hover:bg-orange-50 transition-colors inline-block">
            {isAr ? 'تسجيل الدخول للانضمام' : 'Sign In to Join'}
          </Link>
        </div>

        {/* Source note */}
        <p className="mt-6 text-center text-xs text-gray-400">
          {isAr
            ? 'البيانات من السجل التجاري الرسمي — دائرة الاقتصاد والسياحة دبي (DET) عبر data.dubai · آخر تحديث أبريل 2026'
            : 'Data from the official Commerce Registry — Dubai Department of Economy & Tourism (DET) via data.dubai · Last updated April 2026'}
        </p>
      </div>
    </div>
  )
}
