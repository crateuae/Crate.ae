import type { Metadata } from 'next'
import LegalDoc from '@/components/legal/LegalDoc'
import { CONTACT, DOCS, type Doc } from '@/lib/legal/content'

const BASE = 'https://www.crate.ae'
const LINKS = {
  privacy: { href: '/privacy', label: { en: 'Privacy Policy', ar: 'سياسة الخصوصية' } },
  terms: { href: '/terms', label: { en: 'Terms & Conditions', ar: 'الشروط والأحكام' } },
  about: { href: '/about', label: { en: 'About & methodology', ar: 'عن Crate والمنهجية' } },
}

export function legalMetadata(doc: Doc, locale: string): Metadata {
  const isAr = locale === 'ar'
  const path = `/${doc.key}`
  const title = isAr ? doc.title.ar : doc.title.en
  const description = isAr ? doc.description.ar : doc.description.en
  return {
    title, description,
    alternates: { canonical: `${BASE}/${locale}${path}`, languages: { ar: `${BASE}/ar${path}`, en: `${BASE}/en${path}`, 'x-default': `${BASE}/ar${path}` } },
    openGraph: { title, description, url: `${BASE}/${locale}${path}`, type: 'website' },
  }
}

export function renderLegal(doc: Doc, locale: string) {
  const loc: 'ar' | 'en' = locale === 'en' ? 'en' : 'ar'
  const isAr = loc === 'ar'
  const url = `${BASE}/${loc}/${doc.key}`
  const org = {
    '@type': 'Organization', '@id': `${BASE}/#organization`, name: 'Crate', url: BASE, email: CONTACT.email, telephone: CONTACT.phone.replace(/\s/g, ''),
    areaServed: { '@type': 'Country', name: 'United Arab Emirates' },
    contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', email: CONTACT.email, telephone: CONTACT.phone.replace(/\s/g, ''), availableLanguage: ['ar', 'en'], areaServed: 'AE' },
    publishingPrinciples: `${BASE}/${loc}/about#methodology`,
  }
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': doc.key === 'about' ? 'AboutPage' : 'WebPage', '@id': `${url}#page`, url, name: isAr ? doc.title.ar : doc.title.en, description: isAr ? doc.description.ar : doc.description.en, inLanguage: loc, dateModified: doc.updated, isPartOf: { '@id': `${BASE}/#website` }, publisher: { '@id': `${BASE}/#organization` }, ...(doc.key === 'about' ? { about: { '@id': `${BASE}/#organization` } } : {}) },
      ...(doc.key === 'about' ? [org] : []),
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Crate', item: `${BASE}/${loc}` },
        { '@type': 'ListItem', position: 2, name: isAr ? doc.title.ar : doc.title.en, item: url },
      ] },
    ],
  }
  const others = (['privacy', 'terms', 'about'] as const).filter(k => k !== doc.key).map(k => LINKS[k])
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LegalDoc doc={doc} locale={loc} others={others} />
    </>
  )
}

export { DOCS }
