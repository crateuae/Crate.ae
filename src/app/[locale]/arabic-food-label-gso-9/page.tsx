import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, Tag, ScanLine, MessageCircle, FileText, Compass, Ship, ExternalLink } from 'lucide-react'
import { pageAlternates } from '@/lib/seo/alternates'
import { GSO9, GSO9_PATH, GSO9_UPDATED, GSO9_SAMPLE_LABEL, type Bi } from '@/lib/content/gso9'
import { buildLabelSVG } from '@/lib/label/compliant-label'

const BASE = 'https://www.crate.ae'
const PHONE_E164 = '+971543000415'
const EMAIL = 'uae@crate.ae'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'
  const t = (b: Bi) => (isAr ? b.ar : b.en)
  return {
    title: t(GSO9.title),
    description: t(GSO9.description),
    alternates: pageAlternates(locale, GSO9_PATH),
    openGraph: { title: t(GSO9.title), description: t(GSO9.description), url: `${BASE}/${locale}${GSO9_PATH}`, type: 'article' },
  }
}

export default async function Gso9Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: loc } = await params
  const locale: 'ar' | 'en' = loc === 'en' ? 'en' : 'ar'
  const isAr = locale === 'ar'
  const t = (b: Bi) => (isAr ? b.ar : b.en)
  const Arrow = isAr ? ArrowLeft : ArrowRight
  const url = `${BASE}/${locale}${GSO9_PATH}`
  const L = (p: string) => `/${locale}${p}`

  const quoteHref = `${L('/rfq')}?product=${encodeURIComponent(isAr ? 'طباعة ملصق غذائي عربي (GSO 9)' : 'Arabic food label printing (GSO 9)')}&type=labels`
  const waHref = `https://wa.me/${PHONE_E164.replace('+', '')}?text=${encodeURIComponent(isAr ? 'مرحباً Crate، أريد عرض سعر لطباعة ملصق غذائي عربي مطابق لـ GSO 9.' : 'Hello Crate, I need a quote for GSO 9 compliant Arabic food labels.')}`
  const labelSvg = buildLabelSVG(GSO9_SAMPLE_LABEL)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article', '@id': `${url}#article`,
        headline: t(GSO9.h1), description: t(GSO9.description), inLanguage: locale,
        datePublished: GSO9_UPDATED, dateModified: GSO9_UPDATED,
        author: { '@type': 'Organization', name: 'Crate', url: BASE },
        publisher: { '@type': 'Organization', name: 'Crate', url: BASE },
        mainEntityOfPage: url,
        about: [{ '@type': 'Thing', name: 'GSO 9' }, { '@type': 'Thing', name: isAr ? 'الملصق الغذائي العربي' : 'Arabic food label' }],
        citation: GSO9.sources.map(s => ({ '@type': 'CreativeWork', name: s.label, url: s.url })),
      },
      {
        '@type': 'Service', '@id': `${url}#service`,
        name: isAr ? 'طباعة ملصقات غذائية عربية مطابقة لـ GSO 9' : 'Arabic food label printing (GSO 9 compliant)',
        serviceType: isAr ? 'طباعة ملصقات غذائية' : 'Food label printing',
        description: t(GSO9.printing.answer),
        url: `${url}#printing`,
        provider: { '@type': 'Organization', name: 'Crate', url: BASE, email: EMAIL, telephone: PHONE_E164 },
        areaServed: { '@type': 'Country', name: 'United Arab Emirates' },
        availableLanguage: ['ar', 'en'],
      },
      {
        '@type': 'FAQPage',
        mainEntity: GSO9.faq.items.map(f => ({ '@type': 'Question', name: t(f.q), acceptedAnswer: { '@type': 'Answer', text: t(f.a) } })),
      },
      {
        '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Crate', item: `${BASE}/${locale}` },
          { '@type': 'ListItem', position: 2, name: isAr ? 'الاستيراد' : 'Import', item: `${BASE}/${locale}/import` },
          { '@type': 'ListItem', position: 3, name: t(GSO9.crumb), item: url },
        ],
      },
    ],
  }

  const card = 'bg-white border border-gray-200 rounded-2xl p-5 md:p-7'
  const h2 = 'text-xl md:text-2xl font-bold text-gray-900 mb-2'
  const answer = 'text-gray-700 leading-relaxed mb-4'
  const btnPrimary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-3 shadow-sm shadow-orange-500/30 transition-colors'
  const btnSecondary = 'inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white hover:border-orange-300 text-gray-800 text-sm font-semibold px-5 py-3 transition-colors'

  return (
    <div className="min-h-screen bg-gray-50" dir={isAr ? 'rtl' : 'ltr'}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero — answer first */}
      <section className="bg-gradient-to-b from-orange-50/70 via-white to-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-5 py-12 md:py-16">
          <nav aria-label="breadcrumb" className="text-xs text-gray-400 mb-4">
            <Link href={L('')} className="hover:text-orange-600">Crate</Link> / <Link href={L('/import')} className="hover:text-orange-600">{isAr ? 'الاستيراد' : 'Import'}</Link> / <span className="text-gray-600">{t(GSO9.crumb)}</span>
          </nav>
          <div className="text-xs text-orange-600 tracking-wide mb-2">{isAr ? 'دليل + خدمة · مراجعة' : 'Guide + service · reviewed'} <time dateTime={GSO9_UPDATED}>{GSO9_UPDATED}</time></div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4" style={{ textWrap: 'balance' }}>{t(GSO9.h1)}</h1>
          <p className="text-gray-700 text-base md:text-lg leading-relaxed max-w-3xl mb-6">{t(GSO9.answer)}</p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <Link href={quoteHref} className={btnPrimary}><Tag className="w-4 h-4" />{t(GSO9.cta.quote)}</Link>
            <Link href={L('/compliance')} className={btnSecondary}><ScanLine className="w-4 h-4" />{t(GSO9.cta.precheck)}</Link>
            <a href={waHref} target="_blank" rel="noopener" className={btnSecondary}><MessageCircle className="w-4 h-4" />{t(GSO9.cta.whatsapp)}</a>
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-5 py-10 flex flex-col gap-8">
        {/* 1 — What is GSO 9 */}
        <section className={card} id="gso-9">
          <h2 className={h2}>{t(GSO9.what.h2)}</h2>
          <p className={answer}>{t(GSO9.what.answer)}</p>
          <p className="text-sm font-semibold text-gray-800 mb-2">{t(GSO9.what.lead)}</p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 mb-4">
            {GSO9.what.items.map((it, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700 leading-relaxed"><CheckCircle2 className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />{t(it)}</li>
            ))}
          </ul>
          <p className="text-sm text-gray-500">{t(GSO9.what.note)}</p>
        </section>

        {/* Figure — rendered by the real generator, no image file to load */}
        <figure className={`${card} overflow-hidden`}>
          <div className="mx-auto max-w-2xl" role="img" aria-label={t(GSO9.figure.alt)} dangerouslySetInnerHTML={{ __html: labelSvg.replace(/<svg /, '<svg style="width:100%;height:auto" ') }} />
          <figcaption className="text-xs text-gray-500 mt-3 text-center">{t(GSO9.figure.caption)}</figcaption>
        </figure>

        {/* 2 — Checklist table */}
        <section className={card} id="checklist">
          <h2 className={h2}>{t(GSO9.checklist.h2)}</h2>
          <p className={answer}>{t(GSO9.checklist.answer)}</p>
          <div className="overflow-x-auto -mx-5 md:mx-0">
            <table className="min-w-[640px] w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  {GSO9.checklist.cols.map((c, i) => <th key={i} className="text-start font-semibold px-4 py-2.5 border-b border-gray-200">{t(c)}</th>)}
                </tr>
              </thead>
              <tbody>
                {GSO9.checklist.rows.map((r, i) => (
                  <tr key={i} className="align-top odd:bg-white even:bg-gray-50/60">
                    <td className="px-4 py-2.5 border-b border-gray-100 font-semibold text-gray-900 whitespace-nowrap">{t(r.item)}</td>
                    <td className="px-4 py-2.5 border-b border-gray-100 text-gray-700">{t(r.req)}</td>
                    <td className="px-4 py-2.5 border-b border-gray-100 text-gray-600">{t(r.fmt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 3 — Translation trap */}
        <section className={card} id="translation">
          <h2 className={h2}>{t(GSO9.trap.h2)}</h2>
          <p className={answer}>{t(GSO9.trap.answer)}</p>
          <ul className="flex flex-col gap-2.5">
            {GSO9.trap.items.map((it, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 leading-relaxed"><AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />{t(it)}</li>
            ))}
          </ul>
        </section>

        {/* 4 — How Crate helps (registration + import) */}
        <section className={card} id="registration">
          <h2 className={h2}>{t(GSO9.helps.h2)}</h2>
          <p className={answer}>{t(GSO9.helps.answer)}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {GSO9.helps.items.map((it, i) => {
              const Icon = [Compass, Ship, ScanLine][i] ?? FileText
              return (
                <Link key={it.href} href={L(it.href)} className="group border border-gray-200 hover:border-orange-300 hover:shadow-sm rounded-2xl p-4 flex flex-col transition-all">
                  <span className="w-9 h-9 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center mb-3"><Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" /></span>
                  <span className="text-sm font-semibold text-gray-900 mb-1">{t(it.title)}</span>
                  <span className="text-sm text-gray-600 leading-relaxed flex-1">{t(it.body)}</span>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm text-orange-600 group-hover:gap-2.5 transition-all">{t(it.link)}<Arrow className="w-4 h-4" /></span>
                </Link>
              )
            })}
          </div>
        </section>

        {/* 5 — Core service: printing */}
        <section className="rounded-3xl border-2 border-orange-200 bg-gradient-to-b from-orange-50/80 to-white p-5 md:p-8" id="printing">
          <div className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">{t(GSO9.printing.eyebrow)}</div>
          <h2 className={h2}>{t(GSO9.printing.h2)}</h2>
          <p className={answer}>{t(GSO9.printing.answer)}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {GSO9.printing.cards.map((c, i) => (
              <div key={i} className="bg-white border border-orange-100 rounded-2xl p-4">
                <div className="text-sm font-semibold text-gray-900 mb-1">{t(c.title)}</div>
                <p className="text-sm text-gray-600 leading-relaxed">{t(c.body)}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <Link href={quoteHref} className={btnPrimary}><Tag className="w-4 h-4" />{t(GSO9.cta.quote)}</Link>
            <a href={waHref} target="_blank" rel="noopener" className={btnSecondary}><MessageCircle className="w-4 h-4" />{t(GSO9.cta.whatsapp)}</a>
          </div>
        </section>

        {/* 6 — How it works (a real sequence, hence the numbers) */}
        <section className={card} id="how-it-works">
          <h2 className={h2}>{t(GSO9.steps.h2)}</h2>
          <p className={answer}>{t(GSO9.steps.answer)}</p>
          <ol className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {GSO9.steps.items.map((s, i) => (
              <li key={i} className="border border-gray-200 rounded-2xl p-4">
                <div className="w-8 h-8 rounded-full bg-gray-900 text-white text-sm font-bold flex items-center justify-center mb-3 tabular-nums">{i + 1}</div>
                <div className="text-sm font-semibold text-gray-900 mb-1">{t(s.title)}</div>
                <p className="text-sm text-gray-600 leading-relaxed">{t(s.body)}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* 7 — FAQ */}
        <section className={card} id="faq">
          <h2 className={h2}>{t(GSO9.faq.h2)}</h2>
          <div className="flex flex-col divide-y divide-gray-100">
            {GSO9.faq.items.map((f, i) => (
              <div key={i} className="py-4 first:pt-2 last:pb-0">
                <h3 className="text-base font-semibold text-gray-900 mb-1">{t(f.q)}</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{t(f.a)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 8 — Final CTA + contact */}
        <section className="rounded-3xl bg-gray-900 text-white p-6 md:p-10" id="contact">
          <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ textWrap: 'balance' }}>{t(GSO9.final.h2)}</h2>
          <p className="text-gray-300 leading-relaxed max-w-2xl mb-6">{t(GSO9.final.body)}</p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
            <Link href={quoteHref} className={btnPrimary}><Tag className="w-4 h-4" />{t(GSO9.cta.quote)}</Link>
            <Link href={L('/tools/product-registration-uae')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-600 hover:border-gray-400 text-white text-sm font-semibold px-5 py-3 transition-colors"><Compass className="w-4 h-4" />{isAr ? 'أين أسجّل منتجي؟' : 'Where do I register my product?'}</Link>
          </div>
          <div className="flex flex-col sm:flex-row gap-x-6 gap-y-2 text-sm text-gray-300">
            <a href={`mailto:${EMAIL}`} className="hover:text-white">{EMAIL}</a>
            <a href={waHref} target="_blank" rel="noopener" className="hover:text-white" dir="ltr">+971 54 300 0415 (WhatsApp)</a>
          </div>
        </section>

        {/* Sources + review date — the trust footer AI engines read */}
        <section className="text-xs text-gray-500">
          <div className="font-semibold text-gray-700 mb-1.5">{t(GSO9.sourcesLabel)} · {t(GSO9.reviewed)}: <time dateTime={GSO9_UPDATED}>{GSO9_UPDATED}</time></div>
          <ul className="flex flex-col gap-1">
            {GSO9.sources.map(s => (
              <li key={s.url}><a href={s.url} target="_blank" rel="noopener nofollow" className="inline-flex items-center gap-1 hover:text-orange-600">{s.label}<ExternalLink className="w-3 h-3" /></a></li>
            ))}
          </ul>
          <p className="mt-3 max-w-3xl leading-relaxed">
            {isAr
              ? 'Crate منصة مستقلة وليست جهة حكومية. المرجع النهائي هو نص المواصفة المعتمد والجهة المختصة (بلدية دبي، ADAFSA، وزارة الصناعة والتكنولوجيا المتقدمة). '
              : 'Crate is an independent platform, not a government body. The adopted text of the standard and the competent authority (Dubai Municipality, ADAFSA, MoIAT) are the final reference. '}
            <Link href={L('/about#methodology')} className="hover:text-orange-600 underline">{isAr ? 'منهجيتنا' : 'Our methodology'}</Link>
          </p>
        </section>
      </main>
    </div>
  )
}
