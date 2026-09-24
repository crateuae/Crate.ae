import type { Metadata } from 'next'
import Link from 'next/link'
import { GUIDE_PRODUCTS, GROUPS, REVIEWED } from '@/lib/import-guides/products'
import { HS_FMCG } from '@/lib/customs/hs-fmcg'
import { dutyPhrase } from '@/lib/import-guides/build'

export const revalidate = 86400

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'
  const title = isAr ? 'أدلة استيراد المنتجات إلى الإمارات (2026): HS والرسوم والتسجيل والشهادات' : 'Product import guides for the UAE (2026): HS codes, duty, registration & certificates'
  const description = isAr
    ? `${GUIDE_PRODUCTS.length} دليلاً لاستيراد الأرز والعسل والعطور والمشروبات والمكمّلات وغيرها إلى دبي — كل دليل بالرسوم الجمركية والخطوات والشهادات ومثال تكلفة واصلة.`
    : `${GUIDE_PRODUCTS.length} guides to importing rice, honey, perfume, drinks, supplements and more into Dubai — each with duty, steps, certificates and a landed-cost example.`
  return { title, description, alternates: { canonical: `https://www.crate.ae/${locale}/import`, languages: { ar: '/ar/import', en: '/en/import', 'x-default': '/ar/import' } } }
}

export default async function ImportHub({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: loc } = await params
  const locale: 'ar' | 'en' = loc === 'en' ? 'en' : 'ar'
  const isAr = locale === 'ar'
  const t = (b: { en: string; ar: string }) => (isAr ? b.ar : b.en)
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'ItemList', name: isAr ? 'أدلة استيراد المنتجات إلى الإمارات' : 'UAE product import guides', dateModified: REVIEWED,
    itemListElement: GUIDE_PRODUCTS.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `https://www.crate.ae/${locale}/import/${p.slug}`, name: isAr ? `استيراد ${p.name.ar}` : `Import ${p.name.en}` })),
  }
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10" dir={isAr ? 'rtl' : 'ltr'}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{isAr ? 'أدلة استيراد المنتجات إلى الإمارات' : 'Product import guides for the UAE'}</h1>
        <p className="text-gray-500 text-sm mb-6 max-w-2xl">{isAr ? 'اختر منتجك: رمز HS، الرسوم الجمركية، مسار التسجيل في دبي، الشهادات المطلوبة، ومثال تكلفة واصلة — كل دليل يُولَّد من نفس أدوات Crate المجانية فلا تتناقض معها.' : 'Pick your product: HS code, customs duty, the Dubai registration route, required certificates and a landed-cost example — every guide is generated from the same free Crate tools, so they never disagree.'}</p>
        {GROUPS.map(g => (
          <section key={g.key} className="mb-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-2">{t(g.label)}</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {GUIDE_PRODUCTS.filter(p => p.group === g.key).map(p => {
                const hs = HS_FMCG.find(e => e.code === p.hs)!
                return (
                  <Link key={p.slug} href={`/${locale}/import/${p.slug}`} className="bg-white border border-gray-200 hover:border-orange-300 rounded-xl px-4 py-3 transition-colors">
                    <div className="text-sm font-semibold text-gray-900">{isAr ? `استيراد ${p.name.ar}` : `Import ${p.name.en}`}</div>
                    <div className="text-xs text-gray-500 mt-0.5"><span className="font-mono text-orange-600">HS {hs.code}</span> · {t(dutyPhrase(hs)).split(/ — | unless | ما لم /)[0]}</div>
                  </Link>
                )
              })}
            </div>
          </section>
        ))}
        <div className="flex flex-wrap gap-2 mt-8">
          {[['/tools/product-registration-uae', isAr ? 'أين أسجّل منتجي؟' : 'Where do I register?'], ['/tools/certificates-uae', isAr ? 'فاحص الشهادات' : 'Certificate checker'], ['/tools/landed-cost-uae', isAr ? 'حاسبة التكلفة الواصلة' : 'Landed-cost calculator'], ['/compliance', isAr ? 'فحص الملصق' : 'Label pre-check']].map(([h, l]) => (
            <Link key={h} href={`/${locale}${h}`} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:border-orange-300">{l}</Link>
          ))}
        </div>
        <div className="text-[11px] text-gray-400 mt-6">{isAr ? `آخر مراجعة: ${REVIEWED}. دليل إرشادي؛ الجهة المختصة هي المرجع النهائي.` : `Last reviewed: ${REVIEWED}. Guidance only; the competent authority is the final reference.`}</div>
      </div>
    </div>
  )
}
