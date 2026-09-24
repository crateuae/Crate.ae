import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'
  const title = isAr ? 'حاسبة التعبئة وإعادة التعبئة — تخطيط التوريد في الإمارات' : 'Packaging & Repackaging Calculator — UAE Supply Planning'
  const description = isAr
    ? 'من الطلب المؤسسي إلى خطة تعبئة كاملة: الأوزان والكميات، توزيع الكراتين والباليتات، التكلفة، السعر المقترح، وليبل مطابق لمعايير الإمارات.'
    : 'From an institutional order to a full packing plan: weights & quantities, carton and pallet distribution, cost, suggested price, and a UAE-compliant label.'
  return {
    title, description,
    alternates: { canonical: `https://www.crate.ae/${locale}/packaging/planner`, languages: { ar: '/ar/packaging/planner', en: '/en/packaging/planner', 'x-default': '/ar/packaging/planner' } },
    openGraph: { title, description, url: `https://www.crate.ae/${locale}/packaging/planner` },
  }
}

export default async function PackagingLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const isAr = locale === 'ar'
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: isAr ? 'حاسبة التعبئة وإعادة التعبئة' : 'Packaging & Repackaging Calculator',
    url: `https://www.crate.ae/${locale}/packaging/planner`,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Any',
    inLanguage: isAr ? 'ar' : 'en',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'AED' },
    description: isAr
      ? 'تحويل طلب مؤسسي إلى خطة تعبئة: الأوزان والكميات وتوزيع الكراتين والباليتات والتكلفة.'
      : 'Turns an institutional order into a packing plan: weights, quantities, carton and pallet distribution and cost.',
    publisher: { '@type': 'Organization', name: 'Crate', url: 'https://www.crate.ae' },
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      {children}
    </>
  )
}
