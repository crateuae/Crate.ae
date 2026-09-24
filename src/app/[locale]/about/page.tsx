import type { Metadata } from 'next'
import { DOCS, legalMetadata, renderLegal } from '@/lib/legal/page'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return legalMetadata(DOCS.about, locale)
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return renderLegal(DOCS.about, locale)
}
