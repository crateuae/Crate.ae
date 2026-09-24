import type { Metadata } from 'next'
import Link from 'next/link'
import { Package, ShoppingBasket, RefreshCw, Factory, Boxes, Wrench, Tag, BookOpen, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react'
import { KINDS, getPackagingKindCounts } from '@/lib/packaging/directory'
import { sectionOf } from '@/lib/sections'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'
  const { total } = await getPackagingKindCounts()
  const n = total.toLocaleString('en-US')
  const title = isAr
    ? 'التعبئة وإعادة التعبئة والتغليف في الإمارات — حاسبة، وموردو ومصانع وشركات التغليف'
    : 'Packing, repacking & packaging in the UAE — calculator, suppliers, factories & companies'
  const description = isAr
    ? `قسم التعبئة والتغليف في Crate: حاسبة الكراتين وإعادة التعبئة والسلال الغذائية، ودليل ${n} شركة تغليف مرخّصة في دبي (مواد، مصانع، خدمات التعبئة وإعادة التعبئة)، ودليل مواصفات الكراتين.`
    : `Crate's packaging section: a cartons, repacking and food-basket calculator, a directory of ${n} licensed packaging companies in Dubai (materials, factories, packing and repacking services), and a carton specifications guide.`
  return {
    title, description,
    alternates: { canonical: `https://www.crate.ae/${locale}/packaging`, languages: { ar: '/ar/packaging', en: '/en/packaging', 'x-default': '/ar/packaging' } },
    openGraph: { title, description, url: `https://www.crate.ae/${locale}/packaging` },
  }
}

const KIND_ICON = { materials: Boxes, manufacturers: Factory, services: Package, repack: RefreshCw, labels: Tag } as const

export default async function PackagingHub({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: loc } = await params
  const locale: 'ar' | 'en' = loc === 'en' ? 'en' : 'ar'
  const isAr = locale === 'ar'
  const t = (b: { en: string; ar: string }) => (isAr ? b.ar : b.en)
  const Arrow = isAr ? ArrowLeft : ArrowRight
  const { total, byKind } = await getPackagingKindCounts()
  const sec = sectionOf('packaging')

  const TOOLS = [
    { mode: 'cartons', icon: Package, t: { en: 'Product packaging', ar: 'تغليف المنتجات' }, d: { en: 'Count units, pick the primary pack and master carton, and get an accurate cost per unit.', ar: 'احسب عدد الوحدات، واختر التغليف الأساسي والكرتون المناسب، واحصل على تكلفة دقيقة لكل وحدة.' } },
    { mode: 'basket', icon: ShoppingBasket, t: { en: 'Mixed food basket', ar: 'سلة غذائية مختلطة' }, d: { en: 'Design a basket, set products and weights, and calculate cartons, pallets and packing cost.', ar: 'صمّم سلتك، وحدد المنتجات والأوزان، واحسب الكراتين والباليتات وتكلفة التعبئة.' } },
    { mode: 'repack', icon: RefreshCw, t: { en: 'Repackaging (private label)', ar: 'إعادة التعبئة (علامتك الخاصة)' }, d: { en: 'Import bulk raw material and repack it under your own UAE brand at the best cost.', ar: 'استورد مواد خام بالجملة وأعد تعبئتها تحت علامتك التجارية في الإمارات بأفضل تكلفة.' } },
  ] as const

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', name: isAr ? 'التعبئة والتغليف — Crate' : 'Packaging — Crate', inLanguage: locale, url: `https://www.crate.ae/${locale}/packaging`, isPartOf: { '@id': 'https://www.crate.ae/#website' } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Crate', item: `https://www.crate.ae/${locale}` },
        { '@type': 'ListItem', position: 2, name: t(sec.label), item: `https://www.crate.ae/${locale}/packaging` },
      ] },
    ],
  }
  const card = 'group bg-white border border-gray-200 hover:border-orange-300 hover:shadow-md rounded-2xl p-5 transition-all flex flex-col'

  return (
    <div className="min-h-screen bg-gray-50" dir={isAr ? 'rtl' : 'ltr'}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="bg-gradient-to-b from-orange-50/70 via-white to-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-5 py-12 md:py-16">
          <nav className="text-xs text-gray-400 mb-4"><Link href={`/${locale}`} className="hover:text-orange-600">Crate</Link> / <span className="text-gray-600">{t(sec.label)}</span></nav>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-3">
            {isAr ? 'التعبئة وإعادة التعبئة والتغليف في الإمارات' : 'Packing, repacking & packaging in the UAE'}
          </h1>
          <p className="text-gray-500 max-w-2xl leading-relaxed">{t(sec.tagline)} {isAr ? 'قسم مستقل عن الاستيراد والتجارة.' : 'A section of its own — separate from import and trade.'}</p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-5 py-10 flex flex-col gap-12">
        {/* 1 — Plan */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">{isAr ? 'خطّط للتعبئة' : 'Plan your packing'}</h2>
          <p className="text-sm text-gray-500 mb-4">{isAr ? 'حاسبة مجانية بلا تسجيل — النتيجة خلال ثوانٍ.' : 'A free calculator, no sign-up — results in seconds.'}</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {TOOLS.map(x => (
              <Link key={x.mode} href={`/${locale}/packaging/planner?mode=${x.mode}`} className={card}>
                <span className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center mb-3"><x.icon className="w-5 h-5" /></span>
                <span className="text-base font-semibold text-gray-900 mb-1">{t(x.t)}</span>
                <span className="text-sm text-gray-500 leading-relaxed flex-1">{t(x.d)}</span>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm text-orange-600 group-hover:gap-2.5 transition-all">{isAr ? 'افتح الحاسبة' : 'Open the calculator'}<Arrow className="w-4 h-4" /></span>
              </Link>
            ))}
          </div>
        </section>

        {/* 2 — Suppliers */}
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">{isAr ? 'موردو ومصانع وشركات التغليف' : 'Packaging suppliers, factories & companies'}</h2>
              <p className="text-sm text-gray-500 max-w-2xl">
                {isAr
                  ? `${total.toLocaleString('en-US')} شركة مرخّصة في السجل التجاري بدبي، مصنّفة بحسب نشاطها. نتولّى التواصل معها نيابةً عنك عبر طلب واحد.`
                  : `${total.toLocaleString('en-US')} companies licensed in the Dubai commercial registry, grouped by activity. We contact them on your behalf through a single request.`}
              </p>
            </div>
            <Link href={`/${locale}/packaging/suppliers`} className="inline-flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700">{isAr ? 'عرض الكل' : 'View all'}<Arrow className="w-4 h-4" /></Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {KINDS.map(k => {
              const Icon = KIND_ICON[k.key]
              return (
                <Link key={k.key} href={`/${locale}/packaging/suppliers?kind=${k.key}`} className={card}>
                  <span className="flex items-center justify-between mb-3">
                    <span className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center"><Icon className="w-5 h-5" /></span>
                    <span className="text-sm tabular-nums text-gray-500">{(byKind[k.key] ?? 0).toLocaleString('en-US')}</span>
                  </span>
                  <span className="text-base font-semibold text-gray-900 mb-1">{t(k.label)}</span>
                  <span className="text-sm text-gray-500 leading-relaxed flex-1">{t(k.desc)}</span>
                </Link>
              )
            })}
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-white border border-gray-200 px-4 py-3 text-xs text-gray-500">
            <ShieldCheck className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
            {isAr
              ? 'نموذج الوساطة: أسماء الشركات وأنشطتها معلومات سجل عام وهي ظاهرة، أما تفاصيل الرخصة وبيانات التواصل فتبقى مقيّدة، ويمرّ كل طلب عبر Crate.'
              : 'Brokered model: company names and activities are public registry facts and are shown; licence details and contact data stay restricted, and every request goes through Crate.'}
          </div>
        </section>

        {/* 3 — Learn */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{isAr ? 'أدلة' : 'Guides'}</h2>
          <Link href={`/${locale}/guides/carton-specs`} className={`${card} sm:flex-row sm:items-center sm:gap-4`}>
            <span className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center mb-3 sm:mb-0 flex-shrink-0"><BookOpen className="w-5 h-5" /></span>
            <span className="flex-1">
              <span className="block text-base font-semibold text-gray-900">{isAr ? 'دليل مواصفات الكراتين' : 'Carton specifications guide'}</span>
              <span className="block text-sm text-gray-500 mt-0.5">{isAr ? 'الفلوت والطبقات ودرجات الورق والقياسات المتداولة في السوق الإماراتي.' : 'Flute, plies, paper grades and the standard sizes traded in the UAE market.'}</span>
            </span>
            <Arrow className="w-4 h-4 text-orange-500 flex-shrink-0 hidden sm:block" />
          </Link>
        </section>

        {/* CTA */}
        <section className="rounded-2xl bg-white border border-orange-100 p-6 text-center">
          <Wrench className="w-6 h-6 text-orange-500 mx-auto mb-2" />
          <h2 className="text-base font-semibold text-gray-900 mb-1">{isAr ? 'تحتاج عرض سعر تغليف؟' : 'Need a packaging quote?'}</h2>
          <p className="text-sm text-gray-500 mb-4">{isAr ? 'أخبرنا بالمنتج والكمية ونعود إليك بأفضل عرض من شركات التغليف.' : 'Tell us the product and quantity and we come back with the best offer from packaging companies.'}</p>
          <Link href={`/${locale}/rfq?product=${encodeURIComponent(isAr ? 'تغليف' : 'Packaging')}`} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm px-5 py-2.5">
            {isAr ? 'اطلب عرض سعر' : 'Request a quote'}
          </Link>
        </section>
      </div>
    </div>
  )
}
