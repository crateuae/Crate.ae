import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PackageSearch, FileCheck2, ShieldCheck, ArrowLeft, ArrowRight } from 'lucide-react'
import { pageAlternates } from '@/lib/seo/alternates'
import { SOURCE_PRODUCTS, type Bi } from '@/lib/sourcing/model'
import { getOfferStock, originsFor } from '@/lib/sourcing/stock'
import { GUIDE_PRODUCTS } from '@/lib/import-guides/products'
import { buildGuide } from '@/lib/import-guides/build'
import BuyerRequestForm from '@/components/sourcing/BuyerRequestForm'

export const revalidate = 3600
const BASE = 'https://www.crate.ae'

export function generateStaticParams() {
  return SOURCE_PRODUCTS.flatMap(p => ['ar', 'en'].map(locale => ({ locale, slug: p.slug })))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params
  const p = SOURCE_PRODUCTS.find(x => x.slug === slug)
  if (!p) return {}
  const isAr = locale === 'ar'
  const t = (b: Bi) => (isAr ? b.ar : b.en)
  return {
    title: t(p.title), description: t(p.description),
    alternates: pageAlternates(locale, `/source/${slug}`),
    openGraph: { title: t(p.title), description: t(p.description), url: `${BASE}/${locale}/source/${slug}` },
  }
}

export default async function SourceProductPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: loc, slug } = await params
  const p = SOURCE_PRODUCTS.find(x => x.slug === slug)
  if (!p) notFound()
  const locale: 'ar' | 'en' = loc === 'en' ? 'en' : 'ar'
  const isAr = locale === 'ar'
  const t = (b: Bi) => (isAr ? b.ar : b.en)
  const L = (path: string) => `/${locale}${path}`
  const Arrow = isAr ? ArrowLeft : ArrowRight
  const url = `${BASE}/${locale}/source/${slug}`

  const stock = (await getOfferStock())[slug] ?? { count: 0, origins: [] }
  const gp = GUIDE_PRODUCTS.find(g => g.slug === p.guide)
  const guide = gp ? buildGuide(gp) : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', name: t(p.title), description: t(p.description), url, inLanguage: locale, isPartOf: { '@id': `${BASE}/#website` } },
      { '@type': 'FAQPage', mainEntity: p.faq.map(f => ({ '@type': 'Question', name: t(f.q), acceptedAnswer: { '@type': 'Answer', text: t(f.a) } })) },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Crate', item: `${BASE}/${locale}` },
        { '@type': 'ListItem', position: 2, name: isAr ? 'اطلب عروض الموردين' : 'Request supplier offers', item: `${BASE}/${locale}/source` },
        { '@type': 'ListItem', position: 3, name: t(p.name), item: url },
      ] },
    ],
  }

  const card = 'bg-white border border-gray-200 rounded-2xl p-5'
  return (
    <div className="min-h-screen bg-gray-50" dir={isAr ? 'rtl' : 'ltr'}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="bg-gradient-to-b from-orange-50/70 via-white to-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-5 py-10 md:py-14">
          <nav aria-label="breadcrumb" className="text-xs text-gray-400 mb-4">
            <Link href={L('')} className="hover:text-orange-600">Crate</Link> / <Link href={L('/source')} className="hover:text-orange-600">{isAr ? 'اطلب عروض الموردين' : 'Request supplier offers'}</Link> / <span className="text-gray-600">{t(p.name)}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-3 max-w-3xl" style={{ textWrap: 'balance' }}>{t(p.h1)}</h1>
          <p className="text-gray-600 leading-relaxed max-w-3xl">{t(p.lead)}</p>
          {stock.count > 0 && (
            <p className="mt-4 inline-flex items-center gap-2 text-sm bg-white border border-orange-200 rounded-xl px-4 py-2 text-gray-700">
              <PackageSearch className="w-4 h-4 text-orange-500" />
              {isAr
                ? `عروض الموردين لدينا: ${stock.count}${stock.origins.length ? ` · المنشأ: ${originsFor(stock.origins, true).join('، ')}` : ''} · قيد التوثيق`
                : `${stock.count} supplier offers for ${t(p.name)} on file${stock.origins.length ? ` (origin: ${stock.origins.join(', ')})` : ''} — being verified.`}
            </p>
          )}
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-5 py-8 grid grid-cols-1 lg:grid-cols-[1fr_18rem] gap-6 items-start">
        <div className="min-w-0 flex flex-col gap-6">
          <BuyerRequestForm locale={locale} initial={{ product: isAr ? p.name.ar : p.name.en, category: p.category, slug: p.slug, specHint: t(p.specHint) }} />
          <section className={card}>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{isAr ? 'أسئلة شائعة' : 'Frequently asked'}</h2>
            <div className="divide-y divide-gray-100">
              {p.faq.map((f, i) => (
                <div key={i} className="py-3 first:pt-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{t(f.q)}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{t(f.a)}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-4 min-w-0">
          {guide && (
            <div className={card}>
              <h2 className="text-sm font-semibold text-gray-900 mb-2 inline-flex items-center gap-2"><FileCheck2 className="w-4 h-4 text-orange-500" />{isAr ? 'قبل الاستيراد' : 'Before you import'}</h2>
              <dl className="text-[13px] text-gray-600 flex flex-col gap-1.5">
                <div><dt className="inline text-gray-400">{isAr ? 'البند الجمركي: ' : 'HS heading: '}</dt><dd className="inline" dir="ltr">{guide.hs.code}</dd></div>
                <div><dt className="inline text-gray-400">{isAr ? 'الرسوم: ' : 'Duty: '}</dt><dd className="inline">{t(guide.duty)}</dd></div>
                <div><dt className="inline text-gray-400">{isAr ? 'التسجيل: ' : 'Registration: '}</dt><dd className="inline">{guide.route.steps.map(s => t(s.portal)).join(isAr ? ' ← ' : ' → ')}</dd></div>
              </dl>
              <Link href={L(`/import/${p.guide}`)} className="mt-3 inline-flex items-center gap-1.5 text-sm text-orange-600 hover:gap-2.5 transition-all">{isAr ? 'دليل الاستيراد الكامل' : 'Full import guide'}<Arrow className="w-4 h-4" /></Link>
            </div>
          )}
          <div className={card}>
            <h2 className="text-sm font-semibold text-gray-900 mb-2 inline-flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-600" />{isAr ? 'لحماية صفقتك' : 'Protect the deal'}</h2>
            <ul className="text-[13px] text-gray-600 list-disc ps-4 space-y-1">
              <li>{isAr ? 'اطلب عينة وتحليلاً مخبرياً قبل الشحن.' : 'Ask for a sample and a lab test before shipment.'}</li>
              <li>{isAr ? 'فضّل الاعتماد المستندي أو الدفع مقابل المستندات على التحويل المسبق.' : 'Prefer a letter of credit or cash against documents to an advance transfer.'}</li>
              <li>{isAr ? 'تحقق من الملصق العربي قبل وصول الشحنة.' : 'Check the Arabic label before the shipment lands.'}</li>
            </ul>
            <Link href={L('/compliance')} className="mt-3 inline-flex items-center gap-1.5 text-sm text-orange-600 hover:gap-2.5 transition-all">{isAr ? 'فحص الملصق مجاناً' : 'Free label pre-check'}<Arrow className="w-4 h-4" /></Link>
          </div>
        </aside>
      </main>
    </div>
  )
}
