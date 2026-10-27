import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldCheck, FileCheck2, Users } from 'lucide-react'
import { pageAlternates } from '@/lib/seo/alternates'
import { CATEGORIES } from '@/lib/supplier-offers/model'
import OfferForm from './OfferForm'

const BASE = 'https://www.crate.ae'
const PATH = '/sell-to-uae'
type Bi = { en: string; ar: string }

const COPY = {
  title: { en: 'Sell to UAE Importers — Submit Your Supplier Offer', ar: 'بِع للمستوردين في الإمارات — أرسل عرضك كمورّد' },
  description: {
    en: 'Exporters and producers: submit your product offer to Crate. Verified offers are shared with UAE importers who request that product. Free listing.',
    ar: 'للمصدّرين والمنتجين: أرسل عرض منتجك إلى Crate. نشارك العروض الموثّقة مع المستوردين في الإمارات الذين يطلبون هذا المنتج. الإدراج مجاني.',
  },
  h1: { en: 'Sell to UAE importers: submit your offer', ar: 'بِع للمستوردين في الإمارات: أرسل عرضك' },
  lead: {
    en: 'Crate is a UAE import and trade platform, not a buyer. Send us a priced offer with your documents; we verify it and share it with UAE importers who ask for your product.',
    ar: 'Crate منصة للاستيراد والتجارة في الإمارات، وليست مشترياً. أرسل لنا عرضاً مسعّراً مع مستنداتك؛ نوثّقه ونشاركه مع المستوردين في الإمارات الذين يطلبون منتجك.',
  },
  steps: [
    { icon: 'form', t: { en: 'Submit the offer', ar: 'أرسل العرض' }, d: { en: 'Product, price, minimum order and payment terms.', ar: 'المنتج والسعر والحد الأدنى وشروط الدفع.' } },
    { icon: 'docs', t: { en: 'Send documents', ar: 'أرسل المستندات' }, d: { en: 'Export licence, origin and health certificates, lab tests.', ar: 'رخصة التصدير وشهادات المنشأ والصحة والتحاليل.' } },
    { icon: 'buyers', t: { en: 'Reach importers', ar: 'صِل إلى المستوردين' }, d: { en: 'Verified offers go to UAE importers who request the product.', ar: 'تصل العروض الموثّقة إلى المستوردين الذين يطلبون المنتج.' } },
  ],
  note: {
    en: 'Listing is free. Crate never asks suppliers for deposits or payments to be listed.',
    ar: 'الإدراج مجاني. لا تطلب Crate من الموردين أي عربون أو دفعات مقابل الإدراج.',
  },
  crumb: { en: 'Sell to UAE importers', ar: 'بِع للمستوردين في الإمارات' },
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'
  const t = (b: Bi) => (isAr ? b.ar : b.en)
  return {
    title: t(COPY.title), description: t(COPY.description),
    alternates: pageAlternates(locale, PATH),
    openGraph: { title: t(COPY.title), description: t(COPY.description), url: `${BASE}/${locale}${PATH}` },
  }
}

export default async function SellToUaePage({ params, searchParams }: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ product?: string; category?: string }>
}) {
  const { locale: loc } = await params
  const sp = await searchParams
  const locale: 'ar' | 'en' = loc === 'en' ? 'en' : 'ar'
  const isAr = locale === 'ar'
  const t = (b: Bi) => (isAr ? b.ar : b.en)
  const L = (p: string) => `/${locale}${p}`
  const url = `${BASE}/${locale}${PATH}`

  const product = String(sp.product ?? '').slice(0, 120)
  // A product name in the link pre-selects the obvious category.
  const guess = /pistach|almond|cashew|walnut|nut|فستق|لوز|كاجو|جوز|مكسر/i.test(product) ? 'nuts'
    : /date|raisin|fig|apricot|dried|تمر|زبيب|تين|مشمش|مجفف/i.test(product) ? 'dates'
    : /saffron|spice|pepper|cumin|زعفران|بهار|فلفل|كمون/i.test(product) ? 'spices' : ''
  const category = CATEGORIES.some(c => c.key === sp.category) ? String(sp.category) : guess

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', name: t(COPY.title), description: t(COPY.description), url, inLanguage: locale, isPartOf: { '@id': `${BASE}/#website` } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Crate', item: `${BASE}/${locale}` },
        { '@type': 'ListItem', position: 2, name: isAr ? 'التجارة' : 'Trade', item: `${BASE}/${locale}/trade` },
        { '@type': 'ListItem', position: 3, name: t(COPY.crumb), item: url },
      ] },
    ],
  }
  const ICONS = { form: FileCheck2, docs: ShieldCheck, buyers: Users } as const

  return (
    <div className="min-h-screen bg-gray-50" dir={isAr ? 'rtl' : 'ltr'}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="bg-gradient-to-b from-orange-50/70 via-white to-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-5 py-10 md:py-14">
          <nav aria-label="breadcrumb" className="text-xs text-gray-400 mb-4">
            <Link href={L('')} className="hover:text-orange-600">Crate</Link> / <Link href={L('/trade')} className="hover:text-orange-600">{isAr ? 'التجارة' : 'Trade'}</Link> / <span className="text-gray-600">{t(COPY.crumb)}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-3" style={{ textWrap: 'balance' }}>{t(COPY.h1)}</h1>
          <p className="text-gray-600 leading-relaxed max-w-3xl">{t(COPY.lead)}</p>
          <ol className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
            {COPY.steps.map((s, i) => {
              const Icon = ICONS[s.icon as keyof typeof ICONS]
              return (
                <li key={i} className="bg-white border border-gray-200 rounded-2xl p-4 flex gap-3">
                  <span className="w-9 h-9 shrink-0 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center"><Icon className="w-[18px] h-[18px]" /></span>
                  <span><span className="block text-sm font-semibold text-gray-900">{i + 1}. {t(s.t)}</span><span className="block text-[13px] text-gray-500 leading-snug mt-0.5">{t(s.d)}</span></span>
                </li>
              )
            })}
          </ol>
          <p className="mt-4 text-[13px] text-gray-600 bg-white border border-gray-200 rounded-xl px-4 py-2.5 inline-flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />{t(COPY.note)}</p>
        </div>
      </section>
      <main className="max-w-4xl mx-auto px-5 py-8">
        <OfferForm locale={locale} initial={{ product, category }} />
      </main>
    </div>
  )
}
