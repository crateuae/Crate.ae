import type { Metadata } from 'next'
import { DOCS, legalMetadata, renderLegal } from '@/lib/legal/page'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return legalMetadata(DOCS.terms, locale)
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return renderLegal(DOCS.terms, locale)
}
