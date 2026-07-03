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
    alternates: { canonical: `https://www.crate.ae/${locale}/packaging`, languages: { ar: '/ar/packaging', en: '/en/packaging', 'x-default': '/ar/packaging' } },
    openGraph: { title, description, url: `https://www.crate.ae/${locale}/packaging` },
  }
}

export default function PackagingLayout({ children }: { children: React.ReactNode }) {
  return children
}
