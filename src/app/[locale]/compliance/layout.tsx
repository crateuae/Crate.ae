import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'
  const title = isAr ? 'فحص الملصق قبل التقديم لبلدية دبي — UAE.S / GSO 9 — مجاناً' : 'Dubai Municipality label pre-check — UAE.S / GSO 9 — free'
  const description = isAr
    ? 'افحص ملصق منتجك الغذائي مجاناً قبل رفعه في FIRS أو منتاجي: كل نواقص المواصفة UAE.S 9 / GSO 9 دفعة واحدة (العربية، التواريخ، المكوّنات، الحقائق الغذائية، المنشأ) — بالكاميرا أو يدوياً.'
    : 'Pre-check your food label for free before filing with Dubai Municipality (FIRS / Montaji): every UAE.S 9 / GSO 9 gap at once (Arabic, dates, ingredients, nutrition, origin) — by camera or manually.'
  return {
    title, description,
    alternates: { canonical: `https://www.crate.ae/${locale}/compliance`, languages: { ar: '/ar/compliance', en: '/en/compliance', 'x-default': '/ar/compliance' } },
    openGraph: { title, description, url: `https://www.crate.ae/${locale}/compliance` },
  }
}

// Accurate, grounded Q&A about UAE food-label registration (UAE.S 9:2019 / ESMA).
// Quotable by answer engines (AEO). No fabricated claims; ESMA is the authority.
const FAQ = (isAr: boolean) => isAr ? [
  { q: 'ما الذي يجب أن يظهر باللغة العربية على ملصق منتج غذائي في الإمارات؟',
    a: 'وفق UAE.S 9:2019 يجب أن تظهر بالعربية: اسم المنتج، المكوّنات، تاريخا الإنتاج والانتهاء، ظروف التخزين، والحقائق الغذائية — إضافةً إلى المحتوى الصافي بوحدات مترية وبلد المنشأ.' },
  { q: 'ما المعيار الذي يُفحص المنتج الغذائي ضدّه قبل التسجيل في الإمارات؟',
    a: 'المواصفة الإماراتية/الخليجية UAE.S 9 (GSO 9) لبطاقات الأغذية المعبّأة، التي تصدرها وزارة الصناعة والتكنولوجيا المتقدمة (هيئة المواصفات ESMA سابقاً). أما تقييم الملصق وتسجيل الصنف في دبي فتجريهما بلدية دبي عبر نظام FIRS، وفي أبوظبي هيئة ADAFSA.' },
  { q: 'أين أرفع الملصق بعد الفحص؟',
    a: 'الأغذية: نظام FIRS في بلدية دبي بعد التسجيل الاتحادي في زاد. مستحضرات التجميل والمكمّلات والمنظفات: منتاجي. استخدم «موجّه البوابات» في Crate لتحديد الجهة بحسب المنتج والإمارة.' },
  { q: 'هل يجب إعلان السلفايت على ملصق المنتج؟',
    a: 'نعم؛ إذا احتوى المنتج على سلفايت (E220–E228) وجب إعلانه على البطاقة برقم الـE الخاص به.' },
  { q: 'ما الذي يجعل المنتج غير قابل للتسجيل؟',
    a: 'أبرز الأسباب: غياب الأقسام العربية الإلزامية (التواريخ/التخزين/الحقائق الغذائية/المكوّنات)، عدم ذكر المحتوى الصافي بوحدات مترية، غياب بلد المنشأ، أو عدم إعلان مضافات مثل السلفايت.' },
] : [
  { q: 'What must appear in Arabic on a UAE food label?',
    a: 'Under UAE.S 9:2019 the product name, ingredients, production & expiry dates, storage conditions and nutrition facts must appear in Arabic — plus net content in metric units and country of origin.' },
  { q: 'Which standard is a food product checked against before UAE registration?',
    a: 'UAE.S 9 (GSO 9) for the labelling of prepackaged foodstuffs, issued by MoIAT (formerly ESMA). Label assessment and item registration in Dubai are done by Dubai Municipality through FIRS; in Abu Dhabi by ADAFSA.' },
  { q: 'Where do I file the label after the pre-check?',
    a: 'Food: Dubai Municipality\'s FIRS after federal ZAD registration. Cosmetics, supplements and detergents: Montaji. Use Crate\'s Portal Router to get the exact authority by product and emirate.' },
  { q: 'Must sulphites be declared on the product label?',
    a: 'Yes. If the product contains sulphites (E220–E228) they must be declared on the label by their E-number.' },
  { q: 'What makes a product not registerable?',
    a: 'Common causes: missing mandatory Arabic sections (dates/storage/nutrition/ingredients), no net content in metric units, no country of origin, or undeclared additives such as sulphites.' },
]

export default async function ComplianceLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const isAr = locale === 'ar'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Crate', item: `https://www.crate.ae/${locale}` },
          { '@type': 'ListItem', position: 2, name: isAr ? 'اشتراطات الاستيراد' : 'Import Requirements', item: `https://www.crate.ae/${locale}/compliance` },
        ],
      },
      {
        '@type': 'FAQPage',
        isPartOf: { '@id': 'https://www.crate.ae/#website' },
        inLanguage: isAr ? 'ar' : 'en',
        mainEntity: FAQ(isAr).map(f => ({
          '@type': 'Question', name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {children}
    </>
  )
}
