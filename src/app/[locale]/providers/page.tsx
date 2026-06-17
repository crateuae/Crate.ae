import type { Metadata } from 'next'
import Link from 'next/link'
import {
  MapPin, BadgeCheck, CheckCircle2,
  ArrowRight, ArrowLeft, Repeat2, Store, Search, Plus,
  ShieldCheck, Package, ExternalLink,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'شبكة الموردين — Crate',
  description: 'شركات إعادة التعبئة والتغليف وشركات الاستيراد والتجارة العامة في الإمارات',
}

const PAGE_SIZE = 24

const EMIRATES_EN = ['All', 'Dubai', 'Abu Dhabi', 'Sharjah', 'Ras Al Khaimah', 'Ajman']
const EMIRATES_LABELS_AR: Record<string, string> = {
  'Dubai': 'دبي', 'Abu Dhabi': 'أبوظبي', 'Sharjah': 'الشارقة',
  'Ras Al Khaimah': 'رأس الخيمة', 'Ajman': 'عجمان',
}

// Static rich providers (existing verified ones — will move to DB later)
const STATIC_PROVIDERS = [
  {
    slug: 'gulf-pack-solutions',
    type: 'repackager' as const,
    name_ar: 'حلول التعبئة الخليجية',
    name_en: 'Gulf Pack Solutions',
    emirate: 'Dubai',
    zone: 'Al Quoz Industrial',
    specialties_ar: ['مشروبات', 'أغذية جافة', 'حبوب ودقيق'],
    specialties_en: ['Beverages', 'Dry Foods', 'Grains & Flour'],
    certs: ['Halal', 'ISO 22000', 'HACCP'],
    services_ar: ['إعادة التعبئة للسوق الإماراتي', 'طباعة الليبل الثنائي AR/EN', 'تغليف حسب معيار UAE.S 9:2019'],
    services_en: ['Repackaging for UAE market', 'Bilingual AR/EN label printing', 'Packaging per UAE.S 9:2019'],
    is_verified: true, license_no: null, issue_date: null,
  },
  {
    slug: 'emirates-repack-co',
    type: 'repackager' as const,
    name_ar: 'الإمارات لإعادة التعبئة',
    name_en: 'Emirates Repack Co.',
    emirate: 'Sharjah',
    zone: 'SAIF Zone',
    specialties_ar: ['بهارات وتوابل', 'صلصات وكاتشب', 'زيوت وسمن'],
    specialties_en: ['Spices & Condiments', 'Sauces & Ketchup', 'Oils & Ghee'],
    certs: ['Halal', 'ISO 9001', 'ESMA Approved'],
    services_ar: ['تعبئة من السائب للعبوات الصغيرة', 'تصنيف وفرز حسب الجودة', 'تسمية حسب ESMA'],
    services_en: ['Bulk-to-retail repackaging', 'Quality grading & sorting', 'ESMA-compliant labeling'],
    is_verified: true, license_no: null, issue_date: null,
  },
  {
    slug: 'al-noor-packaging',
    type: 'repackager' as const,
    name_ar: 'النور للتغليف',
    name_en: 'Al Noor Packaging',
    emirate: 'Abu Dhabi',
    zone: 'Musaffah Industrial',
    specialties_ar: ['منتجات الألبان', 'عصائر ومشروبات', 'أغذية مجمدة'],
    specialties_en: ['Dairy Products', 'Juices & Drinks', 'Frozen Foods'],
    certs: ['Halal', 'HACCP', 'ADAFSA Certified'],
    services_ar: ['تغليف معقم ومبرد', 'طباعة تاريخ الإنتاج والانتهاء', 'تعبئة تحت الحرارة'],
    services_en: ['Sterile & cold chain packaging', 'Production & expiry date printing', 'Heat-seal packaging'],
    is_verified: true, license_no: null, issue_date: null,
  },
  {
    slug: 'jebel-ali-pack-hub',
    type: 'repackager' as const,
    name_ar: 'مركز جبل علي للتعبئة',
    name_en: 'Jebel Ali Pack Hub',
    emirate: 'Dubai',
    zone: 'Jebel Ali Free Zone (JAFZA)',
    specialties_ar: ['حلويات وشوكولاتة', 'وجبات خفيفة', 'مواد استيراد بضائع جديدة'],
    specialties_en: ['Confectionery & Chocolate', 'Snacks', 'Newly imported goods'],
    certs: ['ISO 22000', 'BRC', 'Halal'],
    services_ar: ['تعبئة لصادرات الخليج', 'ترميز الباركود EAN-13', 'خدمة التخزين قبل التوزيع'],
    services_en: ['GCC export packaging', 'EAN-13 barcode encoding', 'Pre-distribution storage'],
    is_verified: false, license_no: null, issue_date: null,
  },
  {
    slug: 'al-maktoum-general-trading',
    type: 'trader' as const,
    name_ar: 'المكتوم للتجارة العامة',
    name_en: 'Al Maktoum General Trading',
    emirate: 'Dubai',
    zone: 'Deira',
    specialties_ar: ['مشروبات غازية', 'عصائر', 'مياه معبأة'],
    specialties_en: ['Carbonated Drinks', 'Juices', 'Bottled Water'],
    certs: ['Halal', 'ESMA Registered'],
    services_ar: ['استيراد واسع النطاق من أوروبا وآسيا', 'توزيع لمحلات التجزئة في الإمارات', 'تخليص جمركي سريع'],
    services_en: ['Large-scale import from Europe & Asia', 'UAE retail outlet distribution', 'Fast customs clearance'],
    is_verified: true, license_no: null, issue_date: null,
  },
  {
    slug: 'union-general-trading',
    type: 'trader' as const,
    name_ar: 'الاتحاد للتجارة العامة',
    name_en: 'Union General Trading',
    emirate: 'Abu Dhabi',
    zone: 'Mina Zayed',
    specialties_ar: ['أغذية معلبة', 'بقوليات وحبوب', 'منتجات الألبان'],
    specialties_en: ['Canned Foods', 'Legumes & Grains', 'Dairy Products'],
    certs: ['Halal', 'ISO 9001', 'ADAFSA Approved'],
    services_ar: ['استيراد مباشر من المصنع', 'توزيع HORECA وفنادق أبوظبي', 'تخزين مبرد ومجفف'],
    services_en: ['Direct factory import', 'HORECA & Abu Dhabi hotel distribution', 'Cold & dry storage'],
    is_verified: true, license_no: null, issue_date: null,
  },
  {
    slug: 'gulf-food-imports',
    type: 'trader' as const,
    name_ar: 'الخليج لاستيراد الأغذية',
    name_en: 'Gulf Food Imports',
    emirate: 'Dubai',
    zone: 'Al Aweer Food Market',
    specialties_ar: ['خضروات وفواكه مجففة', 'توابل وبهارات', 'زيوت ودهون'],
    specialties_en: ['Dried Fruits & Vegetables', 'Spices & Herbs', 'Oils & Fats'],
    certs: ['Halal', 'Organic Certified'],
    services_ar: ['استيراد من تركيا والهند وسريلانكا', 'توزيع للجملة في سوق العوير', 'فحص جودة قبل الشحن'],
    services_en: ['Import from Turkey, India & Sri Lanka', 'Wholesale distribution at Al Aweer', 'Pre-shipment quality inspection'],
    is_verified: true, license_no: null, issue_date: null,
  },
  {
    slug: 'sharjah-food-trading',
    type: 'trader' as const,
    name_ar: 'الشارقة للتجارة الغذائية',
    name_en: 'Sharjah Food Trading Co.',
    emirate: 'Sharjah',
    zone: 'Industrial Area No. 1',
    specialties_ar: ['رز وحبوب', 'دقيق وسكر', 'منتجات البيض'],
    specialties_en: ['Rice & Grains', 'Flour & Sugar', 'Egg Products'],
    certs: ['Halal', 'ESMA Registered'],
    services_ar: ['استيراد بالجملة من باكستان والهند', 'بيع للمطاعم والمطابخ المركزية', 'توصيل مباشر للمستودع'],
    services_en: ['Bulk import from Pakistan & India', 'Restaurant & central kitchen supply', 'Direct warehouse delivery'],
    is_verified: false, license_no: null, issue_date: null,
  },
]

type DbProvider = {
  id: string; slug: string; name_ar: string | null; name_en: string | null
  type: string | null; category: string | null; emirate: string | null
  license_no: string | null; issue_date: string | null; is_verified: boolean
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default async function ProvidersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ type?: string; emirate?: string; q?: string; page?: string }>
}) {
  const { locale }    = await params
  const sp            = await searchParams
  const isAr          = locale === 'ar'
  const Arrow         = isAr ? ArrowLeft : ArrowRight

  const typeFilter    = (sp.type    ?? 'all') as 'all' | 'trader' | 'repackager'
  const emirateFilter = sp.emirate ?? 'all'
  const query         = (sp.q       ?? '').trim()
  const page          = Math.max(1, parseInt(sp.page ?? '1', 10))
  const from          = (page - 1) * PAGE_SIZE
  const to            = from + PAGE_SIZE - 1

  const supabase = await createClient()

  let dbQuery = supabase
    .from('providers')
    .select('id, slug, name_ar, name_en, type, category, emirate, license_no, issue_date, is_verified', { count: 'exact' })
    .eq('is_active', true)
    .order('is_verified', { ascending: false })
    .order('name_en',     { ascending: true })
    .range(from, to)

  if (typeFilter !== 'all')    dbQuery = dbQuery.eq('type', typeFilter)
  if (emirateFilter !== 'all') dbQuery = dbQuery.eq('emirate', emirateFilter)
  if (query)                   dbQuery = dbQuery.textSearch('fts', query, { type: 'websearch' })

  const { data: dbProviders = [], count = 0 } = await dbQuery
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  const [{ count: totalTraders }, { count: totalRepackagers }] = await Promise.all([
    supabase.from('providers').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('type', 'trader'),
    supabase.from('providers').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('type', 'repackager'),
  ])

  // Show static providers only on page 1 with no filters
  const showStatic = page === 1 && typeFilter === 'all' && emirateFilter === 'all' && !query
  const staticFiltered = STATIC_PROVIDERS.filter(p => {
    const typeOk = typeFilter === 'all' || p.type === typeFilter
    const emOk   = emirateFilter === 'all' || p.emirate === emirateFilter
    const qOk    = !query || p.name_en.toLowerCase().includes(query.toLowerCase()) || p.name_ar.includes(query)
    return typeOk && emOk && qOk
  })

  function buildUrl(overrides: Record<string, string | undefined>) {
    const base   = { type: typeFilter, emirate: emirateFilter, q: query || undefined, page: undefined }
    const merged = { ...base, ...overrides }
    const p      = new URLSearchParams()
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== 'all' && v !== '') p.set(k, v)
    }
    return `/${locale}/providers${p.size ? '?' + p.toString() : ''}`
  }

  function fmtDate(d: string | null) {
    if (!d) return null
    try { return new Date(d).toLocaleDateString(isAr ? 'ar-AE' : 'en-AE', { year: 'numeric', month: 'short' }) }
    catch { return d }
  }

  // ── Provider card (shared for static + DB) ──────────────────────────────
  function ProviderCard({ p, isStatic }: {
    p: DbProvider | typeof STATIC_PROVIDERS[0]
    isStatic: boolean
  }) {
    const isRepack  = p.type === 'repackager'
    const TypeIcon  = isRepack ? Repeat2 : Store
    const accent    = isRepack ? 'orange' : 'indigo'
    const emLabel   = isAr ? (EMIRATES_LABELS_AR[p.emirate ?? ''] ?? p.emirate) : p.emirate

    const sp = isStatic ? (p as typeof STATIC_PROVIDERS[0]) : null
    const specialties = sp ? (isAr ? sp.specialties_ar : sp.specialties_en) : []
    const services    = sp ? (isAr ? sp.services_ar    : sp.services_en)    : []
    const certs       = sp ? sp.certs : []
    const zone        = sp ? sp.zone : null

    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col hover:shadow-md transition-shadow">
        {/* Header */}
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

        {/* Location */}
        {(emLabel || zone) && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            {emLabel && <span className="font-medium">{emLabel}</span>}
            {zone && <><span className="text-gray-300">·</span><span className="text-gray-400 truncate">{zone}</span></>}
          </div>
        )}

        {/* License + Issue Date (from DB records) */}
        {(p.license_no || p.issue_date) && (
          <div className="flex items-center gap-3 text-[10px] text-gray-400 mb-3">
            {p.license_no && <span>{isAr ? 'رخصة:' : 'Lic:'} <span className="text-gray-600 font-medium">{p.license_no}</span></span>}
            {p.issue_date && <span>{isAr ? 'الإصدار:' : 'Since:'} <span className="text-gray-600 font-medium">{fmtDate(p.issue_date)}</span></span>}
          </div>
        )}

        {/* Specialties (static only) */}
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

        {/* Services (static only) */}
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

        {/* Certs (static only) */}
        {certs.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {certs.map(c => (
              <span key={c} className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 rounded px-1.5 py-0.5 font-medium">{c}</span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className={`border-t border-gray-100 pt-3 flex items-center gap-2 flex-wrap ${specialties.length === 0 && services.length === 0 ? 'mt-auto' : ''}`}>
          {isRepack ? (
            <Link href={`/${locale}/packaging`}
              className="flex items-center gap-1 text-[10px] font-bold text-orange-500 hover:text-orange-600">
              <Package className="w-3 h-3" />
              {isAr ? 'خطة التعبئة' : 'Packaging Plan'}
            </Link>
          ) : (
            <Link href={`/${locale}/compliance`}
              className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 hover:text-indigo-600">
              <ShieldCheck className="w-3 h-3" />
              {isAr ? 'اشتراطات الاستيراد' : 'Import Requirements'}
            </Link>
          )}
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
              ? `${((count ?? 0) + STATIC_PROVIDERS.length).toLocaleString('ar-EG')} شركة — شركات تجارة غذائية وإعادة تعبئة مرخّصة من السجل التجاري لدبي`
              : `${((count ?? 0) + STATIC_PROVIDERS.length).toLocaleString()} companies — licensed food trading & packaging companies from Dubai's official registry`}
          </p>

          {/* Search */}
          <form method="get" action={`/${locale}/providers`} className="max-w-xl mx-auto flex gap-2">
            {typeFilter !== 'all'    && <input type="hidden" name="type"    value={typeFilter} />}
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
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {([
              { val: 'all',        ar: 'الكل',          en: 'All',         count: (totalTraders ?? 0) + (totalRepackagers ?? 0) },
              { val: 'trader',     ar: 'تجارة غذائية',  en: 'Food Trading', count: totalTraders ?? 0 },
              { val: 'repackager', ar: 'إعادة تعبئة',   en: 'Repackaging',  count: totalRepackagers ?? 0 },
            ] as const).map(opt => (
              <Link key={opt.val} href={buildUrl({ type: opt.val, page: undefined })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  typeFilter === opt.val ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {isAr ? opt.ar : opt.en}
                <span className="text-[9px] bg-gray-100 rounded px-1 tabular-nums">{opt.count.toLocaleString()}</span>
              </Link>
            ))}
          </div>

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
      </div>

      {/* ── Cards ── */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">

          {/* Static verified providers first (page 1, no filters) */}
          {showStatic && staticFiltered.map(p => (
            <ProviderCard key={p.slug} p={p as any} isStatic={true} />
          ))}

          {/* DB providers */}
          {(dbProviders as DbProvider[]).map(p => (
            <ProviderCard key={p.id} p={p} isStatic={false} />
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
              ? 'سواء كنت شركة إعادة تعبئة أو مستورداً — سجّل بياناتك ليجدك تجار الاستيراد والموردون في الإمارات'
              : 'Whether you\'re a repackager or an importer — list your company for UAE traders and suppliers to find you'}
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
