import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Package, Phone, Mail, Globe2, MapPin, ShieldCheck, Truck } from 'lucide-react'
import { adminClient } from '@/lib/supabase/admin'

export const revalidate = 300 // ISR — public partner profiles change rarely

async function getPartner(slug: string) {
  try {
    const { data } = await adminClient()
      .from('partners').select('*').eq('slug', slug).eq('public_published', true).maybeSingle()
    return data
  } catch { return null }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params
  const p = await getPartner(slug)
  if (!p) return { title: 'Partner — Crate' }
  const isAr = locale === 'ar'
  const name = (isAr && p.name_ar) ? p.name_ar : p.name_en
  const desc = p.description || (isAr ? `${name} — شريك معتمد على منصة Crate.` : `${name} — a verified partner on Crate.`)
  return {
    title: `${name} — Crate`,
    description: desc,
    alternates: { canonical: `https://www.crate.ae/${locale}/partners/${slug}` },
    openGraph: { title: `${name} — Crate`, description: desc, url: `https://www.crate.ae/${locale}/partners/${slug}` },
  }
}

export default async function PartnerPublicPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  const p = await getPartner(slug)
  if (!p) notFound()
  const isAr = locale === 'ar'
  const name = (isAr && p.name_ar) ? p.name_ar : p.name_en

  const t = isAr ? {
    partner: 'شريك معتمد', services: 'الخدمات', materials: 'المواد', about: 'نبذة',
    contact: 'للتواصل', quote: 'اطلب عرض سعر', emirate: 'الإمارة', fulfillment: 'شريك تنفيذ',
    trn: 'الرقم الضريبي', license: 'رقم الرخصة',
  } : {
    partner: 'Verified partner', services: 'Services', materials: 'Materials', about: 'About',
    contact: 'Contact', quote: 'Request a quote', emirate: 'Emirate', fulfillment: 'Fulfillment partner',
    trn: 'Tax reg. no.', license: 'Trade license',
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: p.name_en,
    ...(p.name_ar ? { alternateName: p.name_ar } : {}),
    ...(p.description ? { description: p.description } : {}),
    ...(p.website ? { url: p.website } : {}),
    ...(p.phone ? { telephone: p.phone } : {}),
    ...(p.email ? { email: p.email } : {}),
    ...(p.emirate ? { address: { '@type': 'PostalAddress', addressRegion: p.emirate, addressCountry: 'AE' } } : {}),
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/40 to-white" dir={isAr ? 'rtl' : 'ltr'}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-3xl mx-auto px-5 py-14">

        {/* Hero */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-3xl bg-orange-500 text-white flex items-center justify-center shadow-sm shadow-orange-500/30 flex-shrink-0">
            <Package className="w-8 h-8" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold text-orange-600 bg-orange-100 rounded-full px-2.5 py-0.5 inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />{t.partner}
              </span>
              {p.is_fulfillment && (
                <span className="text-[11px] font-semibold text-stone-600 bg-stone-100 rounded-full px-2.5 py-0.5 inline-flex items-center gap-1">
                  <Truck className="w-3 h-3" />{t.fulfillment}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black text-stone-900 mt-2 leading-tight">{name}</h1>
            {p.emirate && <p className="text-sm text-stone-500 mt-1 inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-orange-400" />{p.emirate}</p>}
          </div>
        </div>

        {/* About */}
        {p.description && (
          <section className="mt-8">
            <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-2">{t.about}</h2>
            <p className="text-stone-600 leading-relaxed">{p.description}</p>
          </section>
        )}

        {/* Services / Materials */}
        <div className="grid sm:grid-cols-2 gap-5 mt-8">
          {p.services && (
            <div className="bg-white border border-orange-100 rounded-2xl p-5">
              <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-2">{t.services}</h2>
              <p className="text-sm text-stone-700 leading-relaxed">{p.services}</p>
            </div>
          )}
          {p.materials && (
            <div className="bg-white border border-orange-100 rounded-2xl p-5">
              <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-2">{t.materials}</h2>
              <p className="text-sm text-stone-700 leading-relaxed">{p.materials}</p>
            </div>
          )}
        </div>

        {/* Contact */}
        <section className="mt-8 bg-white border border-stone-100 rounded-2xl p-5">
          <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-3">{t.contact}</h2>
          <ul className="space-y-2.5 text-sm">
            {p.phone && <li><a href={`tel:${p.phone}`} dir="ltr" className="inline-flex items-center gap-2 text-stone-600 hover:text-orange-500"><Phone className="w-4 h-4 text-orange-400" />{p.phone}</a></li>}
            {p.email && <li><a href={`mailto:${p.email}`} dir="ltr" className="inline-flex items-center gap-2 text-stone-600 hover:text-orange-500"><Mail className="w-4 h-4 text-orange-400" />{p.email}</a></li>}
            {p.website && <li><a href={p.website} target="_blank" rel="noopener noreferrer" dir="ltr" className="inline-flex items-center gap-2 text-stone-600 hover:text-orange-500"><Globe2 className="w-4 h-4 text-orange-400" />{p.website.replace(/^https?:\/\//, '')}</a></li>}
          </ul>
          {(p.trade_license_no || p.trn) && (
            <div className="mt-4 pt-4 border-t border-stone-100 flex flex-wrap gap-4 text-xs text-stone-500">
              {p.trade_license_no && <span>{t.license}: <span className="font-semibold text-stone-700">{p.trade_license_no}</span></span>}
              {p.trn && <span>{t.trn}: <span className="font-semibold text-stone-700">{p.trn}</span></span>}
            </div>
          )}
        </section>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link href={`/${locale}/rfq`}
            className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 text-white text-sm font-semibold px-6 py-3 hover:bg-orange-600 shadow-sm shadow-orange-500/30">
            {t.quote}
          </Link>
        </div>
      </div>
    </div>
  )
}
