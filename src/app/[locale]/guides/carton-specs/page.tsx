import type { Metadata } from 'next'
import CartonSpecsClient from './CartonSpecsClient'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'
  return {
    title: isAr ? 'دليل مواصفات الكراتين — Crate' : 'Carton Box Specifications Guide — Crate',
    description: isAr
      ? 'دليل شامل لفهم مواصفات الكراتين التصديرية: الأنواع، الطبقات، الفلوت، الورق، القياسات، والمعايير المتداولة في الإمارات'
      : 'Complete guide to export carton box specifications: types, plies, flute, paper grades, dimensions, and UAE market standards',
    alternates: { canonical: `https://www.crate.ae/${locale}/guides/carton-specs` },
  }
}

export default async function CartonSpecsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <CartonSpecsClient locale={locale} />
}
