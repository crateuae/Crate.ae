import type { Metadata } from 'next'
import { pageAlternates } from '@/lib/seo/alternates'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'
  return {
    title: isAr ? 'بحث ذكي عن الموردين والمنتجات في الإمارات' : 'Smart search: UAE suppliers and products',
    description: isAr
      ? 'اكتب ما تبحث عنه بلغتك — نوع المنتج، الإمارة، الكمية — ونعرض لك شركات مرخّصة مطابقة من سجل دبي التجاري.'
      : 'Type what you need in plain language — product type, emirate, quantity — and get matching licensed companies from the Dubai commercial registry.',
    alternates: pageAlternates(locale, '/search'),
  }
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children
}
