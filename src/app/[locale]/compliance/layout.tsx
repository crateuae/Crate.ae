import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'
  const title = isAr ? 'اشتراطات استيراد الأغذية في الإمارات — ESMA / UAE.S / ADAFSA' : 'UAE Food Import Requirements — ESMA / UAE.S / ADAFSA'
  const description = isAr
    ? 'افحص منتجك أمام معايير ESMA وUAE.S قبل التسجيل واحصل على قائمة النواقص كاملة دفعة واحدة — للمستوردين والتجار في الإمارات.'
    : 'Check your product against ESMA and UAE.S standards before registration and get the full gap list at once — for UAE importers and traders.'
  return {
    title, description,
    alternates: { canonical: `https://www.crate.ae/${locale}/compliance`, languages: { ar: '/ar/compliance', en: '/en/compliance', 'x-default': '/ar/compliance' } },
    openGraph: { title, description, url: `https://www.crate.ae/${locale}/compliance` },
  }
}

export default function ComplianceLayout({ children }: { children: React.ReactNode }) {
  return children
}
