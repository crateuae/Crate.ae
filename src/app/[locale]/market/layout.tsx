import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'
  const title = isAr ? 'فرص السوق الإماراتي — فجوات العرض والطلب' : 'UAE Market Opportunities — Supply & Demand Gaps'
  const description = isAr
    ? 'اكتشف فرص استيراد وتوريد المواد الغذائية والسلع الاستهلاكية في الإمارات — فجوات العرض والطلب ودرجات الفرص محدّثة يومياً.'
    : 'Discover food & FMCG import and supply opportunities in the UAE — supply/demand gaps and opportunity scores, updated daily.'
  return {
    title, description,
    alternates: { canonical: `https://www.crate.ae/${locale}/market`, languages: { ar: '/ar/market', en: '/en/market', 'x-default': '/ar/market' } },
    openGraph: { title, description, url: `https://www.crate.ae/${locale}/market` },
  }
}

export default function MarketLayout({ children }: { children: React.ReactNode }) {
  return children
}
