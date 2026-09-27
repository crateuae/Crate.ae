import type { Metadata } from 'next'
import Link from 'next/link'
import { ScanLine, BookOpen, Compass, ArrowLeft, ArrowRight } from 'lucide-react'
import { pageAlternates } from '@/lib/seo/alternates'
import LabelOrderClient from './LabelOrderClient'

const BASE = 'https://www.crate.ae'
const PATH = '/labels'
const UPDATED = '2026-09-28'
type Bi = { en: string; ar: string }

const COPY = {
  title: { en: 'Product Label Printing UAE — Instant Price, Pay Online', ar: 'طباعة ملصقات المنتجات في الإمارات — سعر فوري ودفع إلكتروني' },
  description: {
    en: 'Order Arabic and bilingual product labels in the UAE: choose the size and quantity, see the price at once, pay online. Laminated PVC, cut to size, optional compliant design.',
    ar: 'اطلب ملصقات منتجات عربية وثنائية اللغة في الإمارات: اختر المقاس والكمية، شاهد السعر فوراً، وادفع إلكترونياً. فينيل PVC ملمّن، قص على المقاس، وتصميم مطابق اختياري.',
  },
  h1: { en: 'Product label printing: choose the size, see the price, pay online', ar: 'طباعة ملصقات المنتجات: اختر المقاس، شاهد السعر، وادفع إلكترونياً' },
  lead: {
    en: 'Arabic and bilingual labels for food, cosmetics and supplements, printed on laminated PVC vinyl and cut to the size of your pack. The price below is live: change the size or the quantity and it updates at once.',
    ar: 'ملصقات عربية وثنائية اللغة للأغذية ومستحضرات التجميل والمكملات، مطبوعة على فينيل PVC ملمّن ومقصوصة على مقاس عبوتك. السعر أدناه حيّ: غيّر المقاس أو الكمية فيتحدّث فوراً.',
  },
  crumb: { en: 'Label printing', ar: 'طباعة الملصقات' },
  helpH2: { en: 'Before you print', ar: 'قبل أن تطبع' },
  help: [
    { href: '/compliance', icon: 'scan', title: { en: 'Check the label first — free', ar: 'افحص الملصق أولاً — مجاناً' }, body: { en: 'Photograph your label and get every UAE.S 9 gap at once, before you pay for printing.', ar: 'صوّر ملصقك واحصل على كل نواقص UAE.S 9 دفعة واحدة، قبل أن تدفع للطباعة.' } },
    { href: '/arabic-food-label-gso-9', icon: 'book', title: { en: 'What GSO 9 requires', ar: 'ما الذي تشترطه GSO 9' }, body: { en: 'The mandatory items, the checklist table and the translation traps for Arabic food labels.', ar: 'البنود الإلزامية وجدول التحقق وأفخاخ الترجمة للملصق الغذائي العربي.' } },
    { href: '/tools/product-registration-uae', icon: 'compass', title: { en: 'Where do I register the product?', ar: 'أين أسجّل المنتج؟' }, body: { en: 'Montaji, FIRS/ZAD or ADAFSA — the authority, portal and documents for your product.', ar: 'منتاجي أو FIRS/زاد أو ADAFSA — الجهة والبوابة والمستندات لمنتجك.' } },
  ],
  faqH2: { en: 'Questions about ordering', ar: 'أسئلة عن الطلب' },
  faq: [
    { q: { en: 'How is the price calculated?', ar: 'كيف يُحسب السعر؟' }, a: { en: 'By printed area: label width × height × quantity, in square metres. The rate per square metre falls as the run grows, and a small order is charged a minimum — the price panel tells you how many labels that minimum covers. Cutting to a custom shape is an extra shown in the total.', ar: 'بحسب المساحة المطبوعة: عرض الملصق × ارتفاعه × الكمية، بالمتر المربع. ينخفض سعر المتر كلما كبرت الكمية، وللطلب الصغير حد أدنى — وتخبرك لوحة السعر بعدد الملصقات التي يغطيها. والقص حسب الشكل إضافة تظهر في الإجمالي.' } },
    { q: { en: 'Who prints the labels and takes the payment?', ar: 'من يطبع الملصقات ويستلم الدفع؟' }, a: { en: 'Art for Printing, our print partner in the UAE, prints and delivers, and takes the payment on a secure card page. Crate prepares the order and the label with you.', ar: 'تطبع Art for Printing، شريك الطباعة في الإمارات، الملصقات وتسلّمها، وتستلم الدفع عبر صفحة بطاقات آمنة. وتجهّز Crate الطلب والملصق معك.' } },
    { q: { en: 'When does production start?', ar: 'متى يبدأ الإنتاج؟' }, a: { en: 'After the payment is received and you approve the proof. Nothing is printed before you have seen it.', ar: 'بعد استلام الدفع وموافقتك على البروفة. لا يُطبع شيء قبل أن تراه.' } },
    { q: { en: 'Can I print the production and expiry dates on the sticker?', ar: 'هل يمكن طباعة تاريخي الإنتاج والانتهاء على الملصق؟' }, a: { en: 'For food, the dates stay as the manufacturer printed them on the pack; the Arabic over-sticker carries the other mandatory information. See the GSO 9 guide for the full list.', ar: 'في الأغذية تبقى التواريخ كما طبعها المصنّع على العبوة؛ ويحمل الملصق العربي الإضافي بقية البيانات الإلزامية. راجع دليل GSO 9 للقائمة الكاملة.' } },
  ],
} satisfies Record<string, unknown>

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

const num = (v: string | undefined, fallback: number, min: number, max: number) => {
  const n = Number(v)
  return Number.isFinite(n) && n >= min && n <= max ? n : fallback
}

export default async function LabelsPage({ params, searchParams }: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ product?: string; w?: string; h?: string; qty?: string }>
}) {
  const { locale: loc } = await params
  const sp = await searchParams
  const locale: 'ar' | 'en' = loc === 'en' ? 'en' : 'ar'
  const isAr = locale === 'ar'
  const t = (b: Bi) => (isAr ? b.ar : b.en)
  const L = (p: string) => `/${locale}${p}`
  const Arrow = isAr ? ArrowLeft : ArrowRight
  const url = `${BASE}/${locale}${PATH}`
  const initial = {
    product: String(sp.product ?? '').slice(0, 120),
    w: num(sp.w, 5, 0.5, 200), h: num(sp.h, 5, 0.5, 200), qty: Math.floor(num(sp.qty, 250, 1, 1_000_000)),
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service', '@id': `${url}#service`,
        name: isAr ? 'طباعة ملصقات المنتجات' : 'Product label printing',
        serviceType: isAr ? 'طباعة ملصقات' : 'Label printing',
        description: t(COPY.description), url, dateModified: UPDATED,
        provider: { '@type': 'Organization', name: 'Crate', url: BASE, email: 'uae@crate.ae', telephone: '+971543000415' },
        areaServed: { '@type': 'Country', name: 'United Arab Emirates' },
        availableLanguage: ['ar', 'en'],
      },
      { '@type': 'FAQPage', mainEntity: COPY.faq.map(f => ({ '@type': 'Question', name: t(f.q), acceptedAnswer: { '@type': 'Answer', text: t(f.a) } })) },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Crate', item: `${BASE}/${locale}` },
        { '@type': 'ListItem', position: 2, name: isAr ? 'التعبئة والتغليف' : 'Packaging', item: `${BASE}/${locale}/packaging` },
        { '@type': 'ListItem', position: 3, name: t(COPY.crumb), item: url },
      ] },
    ],
  }
  const ICON = { scan: ScanLine, book: BookOpen, compass: Compass } as const

  return (
    <div className="min-h-screen bg-gray-50" dir={isAr ? 'rtl' : 'ltr'}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="bg-gradient-to-b from-orange-50/70 via-white to-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 py-10 md:py-14">
          <nav aria-label="breadcrumb" className="text-xs text-gray-400 mb-4">
            <Link href={L('')} className="hover:text-orange-600">Crate</Link> / <Link href={L('/packaging')} className="hover:text-orange-600">{isAr ? 'التعبئة والتغليف' : 'Packaging'}</Link> / <span className="text-gray-600">{t(COPY.crumb)}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-3 max-w-3xl" style={{ textWrap: 'balance' }}>{t(COPY.h1)}</h1>
          <p className="text-gray-600 leading-relaxed max-w-3xl">{t(COPY.lead)}</p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-5 py-8 flex flex-col gap-10">
        <LabelOrderClient locale={locale} initial={initial} />

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">{t(COPY.helpH2)}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COPY.help.map(c => {
              const Icon = ICON[c.icon as keyof typeof ICON]
              return (
                <Link key={c.href} href={L(c.href)} className="group bg-white border border-gray-200 hover:border-orange-300 hover:shadow-sm rounded-2xl p-5 flex flex-col transition-all">
                  <span className="w-9 h-9 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center mb-3"><Icon className="w-[18px] h-[18px]" /></span>
                  <span className="text-sm font-semibold text-gray-900 mb-1">{t(c.title)}</span>
                  <span className="text-sm text-gray-600 leading-relaxed flex-1">{t(c.body)}</span>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm text-orange-600 group-hover:gap-2.5 transition-all">{isAr ? 'افتح' : 'Open'}<Arrow className="w-4 h-4" /></span>
                </Link>
              )
            })}
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-2xl p-5 md:p-7">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{t(COPY.faqH2)}</h2>
          <div className="flex flex-col divide-y divide-gray-100">
            {COPY.faq.map((f, i) => (
              <div key={i} className="py-4 first:pt-2 last:pb-0">
                <h3 className="text-base font-semibold text-gray-900 mb-1">{t(f.q)}</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{t(f.a)}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
