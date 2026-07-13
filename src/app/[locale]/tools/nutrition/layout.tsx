import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'
  const title = isAr ? 'حاسبة الحقائق الغذائية للوصفات — الإمارات' : 'Recipe Nutrition Facts Calculator — UAE'
  const description = isAr
    ? 'حوّل مكوّنات وصفتك إلى جدول حقائق غذائية جاهز للتقديم في الإمارات: لكل 100غم، لكل حصة، و% القيمة اليومية — أداة مجانية.'
    : 'Turn recipe ingredients into a UAE submission-ready nutrition-facts table: per 100 g, per serving and % Daily Value — a free tool.'
  return {
    title, description,
    alternates: {
      canonical: `https://www.crate.ae/${locale}/tools/nutrition`,
      languages: { ar: '/ar/tools/nutrition', en: '/en/tools/nutrition', 'x-default': '/ar/tools/nutrition' },
    },
    openGraph: { title, description, url: `https://www.crate.ae/${locale}/tools/nutrition` },
  }
}

export default async function NutritionToolLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const isAr = locale === 'ar'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: isAr ? 'حاسبة الحقائق الغذائية' : 'Nutrition Facts Calculator',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: `https://www.crate.ae/${locale}/tools/nutrition`,
    inLanguage: isAr ? 'ar' : 'en',
    isPartOf: { '@id': 'https://www.crate.ae/#website' },
    publisher: { '@id': 'https://www.crate.ae/#organization' },
    description: isAr
      ? 'أداة تحوّل مكوّنات الوصفة إلى جدول حقائق غذائية (لكل 100غم/حصة و%DV) للسوق الإماراتي.'
      : 'A tool that turns recipe ingredients into a nutrition-facts table (per 100 g / serving and %DV) for the UAE market.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'AED' },
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {children}
    </>
  )
}
