import type { Metadata } from 'next'
import LandedCostClient from './LandedCostClient'
import { pageAlternates } from '@/lib/seo/alternates'

const FAQ = {
  en: [
    ['How is UAE customs duty calculated?', 'The GCC unified tariff applies 5% on the CIF value (goods + freight + insurance) for most goods. Food-security staples such as live animals, meat, seafood, vegetables, fruit, coffee, grains and seeds are 0%; alcohol is 50% and tobacco 100%. Confirm the exact 8-digit line on the Dubai Customs tariff.'],
    ['How does the 2026 excise tax on drinks work?', 'From 1 January 2026 (Cabinet Decision 197/2025) sweetened drinks are taxed by sugar content per litre: under 5 g/100 ml = AED 0; 5 to under 8 g = AED 0.79 per litre; 8 g and above = AED 1.09 per litre. Energy drinks stay at 100% of the excise price, and carbonated drinks are no longer a separate 50% category.'],
    ['Is VAT charged on top of customs duty and excise?', 'Yes. 5% VAT is calculated on the value including customs duty and excise tax. A VAT-registered importer normally recovers this input VAT, which is why the calculator shows the ex-VAT and VAT-inclusive landed cost separately.'],
    ['What should a landed cost include besides duty?', 'Freight, insurance, customs clearance and port charges, inland transport and warehousing, plus one-off compliance costs such as product registration, Arabic label translation and printing, and laboratory tests.'],
  ],
  ar: [
    ['كيف تُحسب الرسوم الجمركية في الإمارات؟', 'تطبّق التعرفة الخليجية الموحدة 5% على قيمة CIF (البضاعة + الشحن + التأمين) لمعظم السلع. السلع الغذائية الأساسية مثل الحيوانات الحية واللحوم والمأكولات البحرية والخضروات والفواكه والقهوة والحبوب والبذور 0%؛ والكحول 50% والتبغ 100%. أكّد البند ثماني الخانات على تعرفة جمارك دبي.'],
    ['كيف تعمل الضريبة الانتقائية على المشروبات في 2026؟', 'منذ 1 يناير 2026 (قرار مجلس الوزراء 197/2025) تُفرض الضريبة على المشروبات المحلّاة بحسب السكر لكل لتر: أقل من 5 غ/100 مل = 0 درهم؛ من 5 إلى أقل من 8 غ = 0.79 درهم/لتر؛ 8 غ فأكثر = 1.09 درهم/لتر. مشروبات الطاقة تبقى 100% من سعر الضريبة، والمشروبات الغازية لم تعد فئة مستقلة بنسبة 50%.'],
    ['هل تُفرض ضريبة القيمة المضافة فوق الجمارك والانتقائية؟', 'نعم. تُحسب 5% على القيمة شاملة الرسوم الجمركية والضريبة الانتقائية. المستورد المسجّل ضريبياً يسترد عادةً ضريبة المدخلات، ولذلك تعرض الحاسبة التكلفة الواصلة قبل الضريبة وبعدها منفصلتين.'],
    ['ماذا تشمل التكلفة الواصلة غير الجمارك؟', 'الشحن والتأمين والتخليص الجمركي ورسوم الميناء والنقل الداخلي والتخزين، إضافةً إلى تكاليف الامتثال لمرة واحدة مثل تسجيل المنتج وترجمة الملصق العربي وطباعته والفحوص المخبرية.'],
  ],
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'
  return {
    title: isAr ? 'رمز HS وحاسبة التكلفة الواصلة للاستيراد إلى الإمارات (جمارك + انتقائية + VAT) — Crate' : 'HS code & landed-cost calculator for UAE imports (duty + excise + VAT) — Crate',
    description: isAr
      ? 'ابحث عن رمز HS لمنتجات FMCG واحسب التكلفة الواصلة: CIF، الرسوم الجمركية 5%/0%، الضريبة الانتقائية 2026 بالشرائح الحجمية، ضريبة القيمة المضافة، التكاليف المحلية، وسعر البيع المقترح.'
      : 'Find the HS code for FMCG products and compute the landed cost: CIF, 5%/0% customs duty, 2026 volumetric excise, VAT, local costs and a suggested selling price.',
    alternates: pageAlternates(locale, '/tools/landed-cost-uae'),
  }
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const faq = locale === 'ar' ? FAQ.ar : FAQ.en
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebApplication', name: locale === 'ar' ? 'حاسبة التكلفة الواصلة ورمز HS للإمارات' : 'UAE Landed-Cost & HS Code Calculator', applicationCategory: 'BusinessApplication', operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'AED' }, url: `https://www.crate.ae/${locale}/tools/landed-cost-uae`, dateModified: '2026-09-24' },
      { '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    ],
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LandedCostClient locale={locale === 'en' ? 'en' : 'ar'} faq={faq} />
    </>
  )
}
