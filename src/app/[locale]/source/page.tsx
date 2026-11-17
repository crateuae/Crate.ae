import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, PackageSearch } from 'lucide-react'
import { pageAlternates } from '@/lib/seo/alternates'
import { SOURCE_PRODUCTS, type Bi } from '@/lib/sourcing/model'
import { getOfferStock } from '@/lib/sourcing/stock'
import BuyerRequestForm from '@/components/sourcing/BuyerRequestForm'

export const revalidate = 3600
const BASE = 'https://www.crate.ae'
const COPY = {
  title: { en: 'Request Supplier Offers for the UAE — Free Sourcing Request', ar: 'اطلب عروض الموردين للإمارات — طلب توريد مجاني' },
  description: {
    en: 'UAE importers and wholesalers: tell Crate what you need to buy and receive matching offers from exporters, with help on registration and the Arabic label.',
    ar: 'للمستوردين وتجار الجملة في الإمارات: أخبر Crate بما تريد شراءه واستلم عروضاً مطابقة من المصدّرين، مع المساعدة في التسجيل والملصق العربي.',
  },
  h1: { en: 'Request supplier offers for your UAE import', ar: 'اطلب عروض الموردين لاستيرادك إلى الإمارات' },
  lead: {
    en: 'Tell us the product, specification and quantity. We match your request against the offers exporters have sent us and send you the ones that fit. Free to request; Crate is not the seller.',
    ar: 'أخبرنا بالمنتج والمواصفات والكمية. نطابق طلبك مع العروض التي أرسلها لنا المصدّرون ونرسل لك المناسب منها. الطلب مجاني، وCrate ليست البائع.',
  },
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = (b: Bi) => (locale === 'ar' ? b.ar : b.en)
  return {
    title: t(COPY.title), description: t(COPY.description),
    alternates: pageAlternates(locale, '/source'),
    openGraph: { title: t(COPY.title), description: t(COPY.description), url: `${BASE}/${locale}/source` },
  }
}

export default async function SourceHub({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ product?: string }> }) {
  const { locale: loc } = await params
  const sp = await searchParams
  const locale: 'ar' | 'en' = loc === 'en' ? 'en' : 'ar'
  const isAr = locale === 'ar'
  const t = (b: Bi) => (isAr ? b.ar : b.en)
  const L = (path: string) => `/${locale}${path}`
  const Arrow = isAr ? ArrowLeft : ArrowRight
  const stock = await getOfferStock()
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', name: t(COPY.title), description: t(COPY.description), url: `${BASE}/${locale}/source`, inLanguage: locale },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Crate', item: `${BASE}/${locale}` },
        { '@type': 'ListItem', position: 2, name: isAr ? 'التجارة' : 'Trade', item: `${BASE}/${locale}/trade` },
        { '@type': 'ListItem', position: 3, name: isAr ? 'اطلب عروض الموردين' : 'Request supplier offers', item: `${BASE}/${locale}/source` },
      ] },
    ],
  }
  return (
    <div className="min-h-screen bg-gray-50" dir={isAr ? 'rtl' : 'ltr'}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="bg-gradient-to-b from-orange-50/70 via-white to-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-5 py-10 md:py-14">
          <nav aria-label="breadcrumb" className="text-xs text-gray-400 mb-4">
            <Link href={L('')} className="hover:text-orange-600">Crate</Link> / <Link href={L('/trade')} className="hover:text-orange-600">{isAr ? 'التجارة' : 'Trade'}</Link> / <span className="text-gray-600">{isAr ? 'اطلب عروض الموردين' : 'Request supplier offers'}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-3" style={{ textWrap: 'balance' }}>{t(COPY.h1)}</h1>
          <p className="text-gray-600 leading-relaxed max-w-3xl">{t(COPY.lead)}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
            {SOURCE_PRODUCTS.map(p => (
              <Link key={p.slug} href={L(`/source/${p.slug}`)} className="group bg-white border border-gray-200 hover:border-orange-300 rounded-2xl p-4 flex items-center gap-3 transition-all">
                <span className="w-9 h-9 shrink-0 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center"><PackageSearch className="w-[18px] h-[18px]" /></span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-gray-900">{isAr ? `اطلب عروض ${p.name.ar}` : `Request ${p.name.en} offers`}</span>
                  {(stock[p.slug]?.count ?? 0) > 0 && <span className="block text-[12px] text-gray-500">{isAr ? `عروض الموردين لدينا: ${stock[p.slug].count}` : `${stock[p.slug].count} supplier offers on file`}</span>}
                </span>
                <Arrow className="w-4 h-4 text-orange-500 group-hover:translate-x-0.5 transition-transform rtl:group-hover:-translate-x-0.5" />
              </Link>
            ))}
          </div>
        </div>
      </section>
      <main className="max-w-4xl mx-auto px-5 py-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{isAr ? 'منتج آخر؟ اطلب هنا' : 'Another product? Request here'}</h2>
        <BuyerRequestForm locale={locale} initial={{ product: String(sp.product ?? '').slice(0, 120), category: '' }} />
      </main>
    </div>
  )
}
