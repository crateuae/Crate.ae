import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Package, ShieldCheck, MapPin, CheckCircle2, BadgeCheck,
  ArrowRight, ArrowLeft, Repeat2, Store, Plus, ExternalLink,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'شبكة الموردين — Crate',
  description: 'شركات إعادة التعبئة والتغليف وشركات الاستيراد والتجارة العامة في الإمارات',
}

// ─── Static provider data (will migrate to DB) ───────────────────────────────

type ProviderType = 'repackager' | 'trader'

interface Provider {
  id: string
  type: ProviderType
  name_ar: string
  name_en: string
  emirate_ar: string
  emirate_en: string
  zone?: string                        // free zone / industrial area
  specialties_ar: string[]             // product categories they handle
  specialties_en: string[]
  certs: string[]                      // Halal, ISO 22000, ESMA, etc.
  services_ar: string[]
  services_en: string[]
  verified: boolean
  website?: string
}

const PROVIDERS: Provider[] = [
  // ── Repackagers ───────────────────────────────────────────────────
  {
    id: 'r001',
    type: 'repackager',
    name_ar: 'حلول التعبئة الخليجية',
    name_en: 'Gulf Pack Solutions',
    emirate_ar: 'دبي',
    emirate_en: 'Dubai',
    zone: 'Al Quoz Industrial',
    specialties_ar: ['مشروبات', 'أغذية جافة', 'حبوب ودقيق'],
    specialties_en: ['Beverages', 'Dry Foods', 'Grains & Flour'],
    certs: ['Halal', 'ISO 22000', 'HACCP'],
    services_ar: ['إعادة التعبئة للسوق الإماراتي', 'طباعة الليبل الثنائي AR/EN', 'تغليف حسب معيار UAE.S 9:2019'],
    services_en: ['Repackaging for UAE market', 'Bilingual AR/EN label printing', 'Packaging per UAE.S 9:2019'],
    verified: true,
  },
  {
    id: 'r002',
    type: 'repackager',
    name_ar: 'الإمارات لإعادة التعبئة',
    name_en: 'Emirates Repack Co.',
    emirate_ar: 'الشارقة',
    emirate_en: 'Sharjah',
    zone: 'SAIF Zone',
    specialties_ar: ['بهارات وتوابل', 'صلصات وكاتشب', 'زيوت وسمن'],
    specialties_en: ['Spices & Condiments', 'Sauces & Ketchup', 'Oils & Ghee'],
    certs: ['Halal', 'ISO 9001', 'ESMA Approved'],
    services_ar: ['تعبئة من السائب للعبوات الصغيرة', 'تصنيف وفرز حسب الجودة', 'تسمية حسب ESMA'],
    services_en: ['Bulk-to-retail repackaging', 'Quality grading & sorting', 'ESMA-compliant labeling'],
    verified: true,
  },
  {
    id: 'r003',
    type: 'repackager',
    name_ar: 'النور للتغليف',
    name_en: 'Al Noor Packaging',
    emirate_ar: 'أبوظبي',
    emirate_en: 'Abu Dhabi',
    zone: 'Musaffah Industrial',
    specialties_ar: ['منتجات الألبان', 'عصائر ومشروبات', 'أغذية مجمدة'],
    specialties_en: ['Dairy Products', 'Juices & Drinks', 'Frozen Foods'],
    certs: ['Halal', 'HACCP', 'ADAFSA Certified'],
    services_ar: ['تغليف معقم ومبرد', 'طباعة تاريخ الإنتاج والانتهاء', 'تعبئة تحت الحرارة'],
    services_en: ['Sterile & cold chain packaging', 'Production & expiry date printing', 'Heat-seal packaging'],
    verified: true,
  },
  {
    id: 'r004',
    type: 'repackager',
    name_ar: 'مركز جبل علي للتعبئة',
    name_en: 'Jebel Ali Pack Hub',
    emirate_ar: 'دبي',
    emirate_en: 'Dubai',
    zone: 'Jebel Ali Free Zone (JAFZA)',
    specialties_ar: ['حلويات وشوكولاتة', 'وجبات خفيفة', 'مواد استيراد بضائع جديدة'],
    specialties_en: ['Confectionery & Chocolate', 'Snacks', 'Newly imported goods'],
    certs: ['ISO 22000', 'BRC', 'Halal'],
    services_ar: ['تعبئة لصادرات الخليج', 'ترميز الباركود EAN-13', 'خدمة التخزين قبل التوزيع'],
    services_en: ['GCC export packaging', 'EAN-13 barcode encoding', 'Pre-distribution storage'],
    verified: false,
  },
  {
    id: 'r005',
    type: 'repackager',
    name_ar: 'صناعات رأس الخيمة للتغليف',
    name_en: 'RAK Packaging Industries',
    emirate_ar: 'رأس الخيمة',
    emirate_en: 'Ras Al Khaimah',
    zone: "RAK Free Trade Zone",
    specialties_ar: ['حبوب ومكسرات', 'توابل وأعشاب', 'مواد صحية وعضوية'],
    specialties_en: ['Nuts & Grains', 'Spices & Herbs', 'Organic & Health Foods'],
    certs: ['Halal', 'Organic Certified', 'ISO 22000'],
    services_ar: ['تعبئة وزنية دقيقة', 'ليبل بمتطلبات ESMA كاملة', 'تغليف فاخر للتجزئة'],
    services_en: ['Precision weight filling', 'Full ESMA-compliant label', 'Premium retail packaging'],
    verified: false,
  },

  // ── Traders / Importers ───────────────────────────────────────────
  {
    id: 't001',
    type: 'trader',
    name_ar: 'المكتوم للتجارة العامة',
    name_en: 'Al Maktoum General Trading',
    emirate_ar: 'دبي',
    emirate_en: 'Dubai',
    zone: 'Deira',
    specialties_ar: ['مشروبات غازية', 'عصائر', 'مياه معبأة'],
    specialties_en: ['Carbonated Drinks', 'Juices', 'Bottled Water'],
    certs: ['Halal', 'ESMA Registered'],
    services_ar: ['استيراد واسع النطاق من أوروبا وآسيا', 'توزيع لمحلات التجزئة في الإمارات', 'تخليص جمركي سريع'],
    services_en: ['Large-scale import from Europe & Asia', 'UAE retail outlet distribution', 'Fast customs clearance'],
    verified: true,
  },
  {
    id: 't002',
    type: 'trader',
    name_ar: 'الاتحاد للتجارة العامة',
    name_en: 'Union General Trading',
    emirate_ar: 'أبوظبي',
    emirate_en: 'Abu Dhabi',
    zone: 'Mina Zayed',
    specialties_ar: ['أغذية معلبة', 'بقوليات وحبوب', 'منتجات الألبان'],
    specialties_en: ['Canned Foods', 'Legumes & Grains', 'Dairy Products'],
    certs: ['Halal', 'ISO 9001', 'ADAFSA Approved'],
    services_ar: ['استيراد مباشر من المصنع', 'توزيع HORECA وفنادق أبوظبي', 'تخزين مبرد ومجفف'],
    services_en: ['Direct factory import', 'HORECA & Abu Dhabi hotel distribution', 'Cold & dry storage'],
    verified: true,
  },
  {
    id: 't003',
    type: 'trader',
    name_ar: 'الخليج لاستيراد الأغذية',
    name_en: 'Gulf Food Imports',
    emirate_ar: 'دبي',
    emirate_en: 'Dubai',
    zone: 'Al Aweer Food Market',
    specialties_ar: ['خضروات وفواكه مجففة', 'توابل وبهارات', 'زيوت ودهون'],
    specialties_en: ['Dried Fruits & Vegetables', 'Spices & Herbs', 'Oils & Fats'],
    certs: ['Halal', 'Organic Certified'],
    services_ar: ['استيراد من تركيا والهند وسريلانكا', 'توزيع للجملة في سوق العوير', 'فحص جودة قبل الشحن'],
    services_en: ['Import from Turkey, India & Sri Lanka', 'Wholesale distribution at Al Aweer', 'Pre-shipment quality inspection'],
    verified: true,
  },
  {
    id: 't004',
    type: 'trader',
    name_ar: 'الشارقة للتجارة الغذائية',
    name_en: 'Sharjah Food Trading Co.',
    emirate_ar: 'الشارقة',
    emirate_en: 'Sharjah',
    zone: 'Industrial Area No. 1',
    specialties_ar: ['رز وحبوب', 'دقيق وسكر', 'منتجات البيض'],
    specialties_en: ['Rice & Grains', 'Flour & Sugar', 'Egg Products'],
    certs: ['Halal', 'ESMA Registered'],
    services_ar: ['استيراد بالجملة من باكستان والهند', 'بيع للمطاعم والمطابخ المركزية', 'توصيل مباشر للمستودع'],
    services_en: ['Bulk import from Pakistan & India', 'Restaurant & central kitchen supply', 'Direct warehouse delivery'],
    verified: false,
  },
  {
    id: 't005',
    type: 'trader',
    name_ar: 'الإمارات لتوزيع الأغذية',
    name_en: 'Emirates Food Distribution',
    emirate_ar: 'عجمان',
    emirate_en: 'Ajman',
    zone: 'Ajman Free Zone',
    specialties_ar: ['مشروبات صحية', 'بروتين ومكملات', 'أغذية عضوية'],
    specialties_en: ['Health Drinks', 'Protein & Supplements', 'Organic Foods'],
    certs: ['Halal', 'ISO 22000', 'Organic EU'],
    services_ar: ['استيراد من أوروبا وأمريكا', 'توزيع لمتاجر المواد الصحية', 'استشارات تسجيل ESMA'],
    services_en: ['Import from Europe & USA', 'Health store distribution', 'ESMA registration consulting'],
    verified: false,
  },
]

const EMIRATES_AR = ['الكل', 'دبي', 'أبوظبي', 'الشارقة', 'رأس الخيمة', 'عجمان']
const EMIRATES_EN = ['All', 'Dubai', 'Abu Dhabi', 'Sharjah', 'Ras Al Khaimah', 'Ajman']

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function ProvidersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ type?: string; emirate?: string }>
}) {
  const { locale } = await params
  const sp = await searchParams
  const isAr = locale === 'ar'
  const Arrow = isAr ? ArrowLeft : ArrowRight

  const typeFilter = sp.type as ProviderType | 'all' | undefined ?? 'all'
  const emirateFilter = sp.emirate ?? 'all'

  const filtered = PROVIDERS.filter(p => {
    const typeOk = typeFilter === 'all' || p.type === typeFilter
    const emOk = emirateFilter === 'all' ||
      (isAr ? p.emirate_ar === emirateFilter : p.emirate_en === emirateFilter)
    return typeOk && emOk
  })

  const repackagers = PROVIDERS.filter(p => p.type === 'repackager')
  const traders     = PROVIDERS.filter(p => p.type === 'trader')

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-white border-b border-gray-100 px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-full px-4 py-1.5 text-indigo-600 text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
            {isAr ? 'شبكة موردين موثّقة — الإمارات' : 'Verified supplier network — UAE'}
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
            {isAr ? 'شبكة الموردين\nوالمستوردين' : 'Suppliers &\nImporters Network'}
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto mb-4 leading-relaxed">
            {isAr
              ? 'موردو Crate نوعان: شركات إعادة التعبئة والتغليف التي تُعِدّ منتجاتك للسوق الإماراتي، وشركات التجارة العامة التي تستورد وتوزع المنتجات. كلاهما يعمل وفق اشتراطات ESMA وUAE.S.'
              : 'Crate has two supplier types: Repackaging companies that prepare your products for the UAE market, and General Trading companies that import and distribute. Both operate under ESMA and UAE.S requirements.'}
          </p>

          {/* Type overview cards */}
          <div className="grid md:grid-cols-2 gap-4 mt-10 text-start">
            <Link href={`/${locale}/providers?type=repackager`}
              className="group bg-white border-2 border-gray-200 hover:border-orange-400 rounded-2xl p-5 transition-all hover:shadow-md hover:-translate-y-0.5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Repeat2 className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <div className="font-black text-gray-900 text-base">{isAr ? 'شركات إعادة التعبئة والتغليف' : 'Repackaging Companies'}</div>
                  <div className="text-xs text-gray-400">{repackagers.length} {isAr ? 'شركة' : 'companies'}</div>
                </div>
                <Arrow className="w-4 h-4 text-gray-300 group-hover:text-orange-500 ms-auto mt-1 transition-colors" />
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                {isAr
                  ? 'تعيد تعبئة المنتجات المستوردة بحسب متطلبات السوق الإماراتي: تغيير العبوة، طباعة الليبل العربي، إضافة رقم ESMA، ضبط الوزن.'
                  : 'Repackages imported goods to UAE market specs: changing packaging, printing Arabic labels, adding ESMA numbers, adjusting weights.'}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {['Halal', 'ISO 22000', 'HACCP', 'ESMA'].map(c => (
                  <span key={c} className="text-[10px] bg-orange-50 text-orange-600 border border-orange-100 rounded-md px-2 py-0.5">{c}</span>
                ))}
              </div>
            </Link>

            <Link href={`/${locale}/providers?type=trader`}
              className="group bg-white border-2 border-gray-200 hover:border-indigo-400 rounded-2xl p-5 transition-all hover:shadow-md hover:-translate-y-0.5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Store className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <div className="font-black text-gray-900 text-base">{isAr ? 'شركات التجارة العامة (مستورد/تاجر)' : 'General Trading Companies (Importer/Trader)'}</div>
                  <div className="text-xs text-gray-400">{traders.length} {isAr ? 'شركة' : 'companies'}</div>
                </div>
                <Arrow className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 ms-auto mt-1 transition-colors" />
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                {isAr
                  ? 'تستورد المنتجات من المصدر وتوزعها للمحلات والمطاعم والجملة في الإمارات. تمتلك تراخيص استيراد وحسابات مع الجمارك.'
                  : 'Import products from source and distribute to UAE retail, restaurants, and wholesale. They hold import licenses and have customs accounts.'}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {['Import License', 'Customs Account', 'Halal', 'ESMA Registered'].map(c => (
                  <span key={c} className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md px-2 py-0.5">{c}</span>
                ))}
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Filters ── */}
      <div className="bg-white border-b border-gray-100 sticky top-[58px] z-30">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-3 flex-wrap">
          {/* Type filter */}
          <div className="flex items-center gap-1.5 bg-gray-100 rounded-xl p-1">
            {([
              { val: 'all',        ar: 'الكل',            en: 'All' },
              { val: 'repackager', ar: 'إعادة التعبئة',   en: 'Repackaging' },
              { val: 'trader',     ar: 'تجارة عامة',      en: 'General Trading' },
            ] as const).map(opt => (
              <Link key={opt.val}
                href={`/${locale}/providers?type=${opt.val}${emirateFilter !== 'all' ? `&emirate=${emirateFilter}` : ''}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  typeFilter === opt.val
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}>
                {isAr ? opt.ar : opt.en}
              </Link>
            ))}
          </div>

          {/* Emirate filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(isAr ? EMIRATES_AR : EMIRATES_EN).map((em, i) => {
              const val = i === 0 ? 'all' : (isAr ? EMIRATES_AR[i] : EMIRATES_EN[i])
              const active = emirateFilter === val
              return (
                <Link key={em}
                  href={`/${locale}/providers?${typeFilter !== 'all' ? `type=${typeFilter}&` : ''}${i === 0 ? '' : `emirate=${val}`}`}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-all whitespace-nowrap ${
                    active
                      ? 'bg-indigo-100 text-indigo-700 font-bold'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}>
                  <MapPin className="w-2.5 h-2.5 inline me-0.5" />{em}
                </Link>
              )
            })}
          </div>

          <span className="ms-auto text-xs text-gray-400">
            {filtered.length} {isAr ? 'شركة' : 'companies'}
          </span>
        </div>
      </div>

      {/* ── Provider Cards ── */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(p => {
            const isRepack = p.type === 'repackager'
            const typeColor = isRepack ? 'text-orange-600 bg-orange-50 border-orange-200' : 'text-indigo-600 bg-indigo-50 border-indigo-200'
            const TypeIcon = isRepack ? Repeat2 : Store

            return (
              <div key={p.id} className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isRepack ? 'bg-orange-50' : 'bg-indigo-50'}`}>
                      <TypeIcon className={`w-5 h-5 ${isRepack ? 'text-orange-500' : 'text-indigo-500'}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-black text-gray-900 text-sm leading-tight">
                        {isAr ? p.name_ar : p.name_en}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {isAr ? p.name_en : p.name_ar}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0 ms-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${typeColor}`}>
                      {isRepack ? (isAr ? 'إعادة تعبئة' : 'Repackager') : (isAr ? 'تجارة عامة' : 'Trader')}
                    </span>
                    {p.verified && (
                      <span className="flex items-center gap-0.5 text-[9px] text-emerald-600 font-bold">
                        <BadgeCheck className="w-3 h-3" />
                        {isAr ? 'موثّق' : 'Verified'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="font-medium">{isAr ? p.emirate_ar : p.emirate_en}</span>
                  {p.zone && <span className="text-gray-300">·</span>}
                  {p.zone && <span className="text-gray-400 truncate">{p.zone}</span>}
                </div>

                {/* Specialties */}
                <div className="mb-3">
                  <div className="text-[10px] text-gray-400 mb-1.5">{isAr ? 'التخصص:' : 'Specialties:'}</div>
                  <div className="flex flex-wrap gap-1">
                    {(isAr ? p.specialties_ar : p.specialties_en).map(s => (
                      <span key={s} className="text-[10px] bg-gray-50 border border-gray-200 text-gray-600 rounded-md px-2 py-0.5">{s}</span>
                    ))}
                  </div>
                </div>

                {/* Services */}
                <div className="mb-3 flex-1">
                  <div className="text-[10px] text-gray-400 mb-1.5">{isAr ? 'الخدمات:' : 'Services:'}</div>
                  <ul className="space-y-1">
                    {(isAr ? p.services_ar : p.services_en).slice(0, 3).map(s => (
                      <li key={s} className="flex items-start gap-1.5 text-xs text-gray-600">
                        <CheckCircle2 className={`w-3 h-3 flex-shrink-0 mt-0.5 ${isRepack ? 'text-orange-400' : 'text-indigo-400'}`} />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Certs */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {p.certs.map(c => (
                    <span key={c} className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 rounded px-1.5 py-0.5 font-medium">{c}</span>
                  ))}
                </div>

                {/* Footer actions */}
                <div className="border-t border-gray-100 pt-3 flex items-center gap-2 flex-wrap">
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
                  {p.website && (
                    <a href={p.website} target="_blank" rel="noopener noreferrer"
                      className="ms-auto flex items-center gap-0.5 text-[10px] text-gray-400 hover:text-gray-700">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <Store className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="font-semibold">{isAr ? 'لا توجد شركات بهذه المعايير' : 'No companies match these filters'}</p>
          </div>
        )}

        {/* ── CTA: Register as provider ── */}
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
          <div className="flex flex-wrap justify-center gap-3">
            <Link href={`/${locale}/login`}
              className="bg-white text-orange-600 font-black px-6 py-2.5 rounded-xl text-sm hover:bg-orange-50 transition-colors">
              {isAr ? 'تسجيل الدخول للانضمام' : 'Sign In to Join'}
            </Link>
            <Link href={`/${locale}/compliance`}
              className="border border-white/30 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-white/10 transition-colors flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              {isAr ? 'اشتراطات التسجيل' : 'Import Requirements'}
            </Link>
          </div>
        </div>

        {/* ── How it connects ── */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          {[
            {
              icon: Store,
              color: 'text-indigo-500',
              bg: 'bg-indigo-50',
              title_ar: 'التاجر يكتشف الفرصة',
              title_en: 'Trader Discovers Opportunity',
              desc_ar: 'عبر صفحة فرص السوق — يرى منتجاً طلبه مرتفع وعرضه ضعيف في الإمارات',
              desc_en: 'Via Market Opportunities — sees a product with high demand and low supply in UAE',
              href: '/market',
            },
            {
              icon: ShieldCheck,
              color: 'text-blue-500',
              bg: 'bg-blue-50',
              title_ar: 'يفحص الاشتراطات',
              title_en: 'Checks Requirements',
              desc_ar: 'يفحص ESMA وUAE.S ومتطلبات الليبل والتسجيل قبل الاستيراد',
              desc_en: 'Checks ESMA, UAE.S, labeling and registration requirements before importing',
              href: '/compliance',
            },
            {
              icon: Repeat2,
              color: 'text-orange-500',
              bg: 'bg-orange-50',
              title_ar: 'شركة التعبئة تُهيّئ المنتج',
              title_en: 'Repackager Prepares Product',
              desc_ar: 'شركة إعادة التعبئة تطبّق الليبل العربي وتعدّل العبوة لمتطلبات السوق',
              desc_en: 'Repackager applies Arabic label and adjusts packaging to market requirements',
              href: '/packaging',
            },
          ].map((step, i) => (
            <Link key={i} href={`/${locale}${step.href}`}
              className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-all hover:-translate-y-0.5 group">
              <div className={`w-9 h-9 ${step.bg} rounded-xl flex items-center justify-center mb-3`}>
                <step.icon className={`w-4.5 h-4.5 ${step.color}`} />
              </div>
              <div className="text-sm font-black text-gray-900 mb-1">{isAr ? step.title_ar : step.title_en}</div>
              <p className="text-xs text-gray-400 leading-relaxed">{isAr ? step.desc_ar : step.desc_en}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
