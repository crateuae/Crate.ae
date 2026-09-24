import type { Metadata } from 'next'
import Link from 'next/link'
import { Search, Factory, ShieldCheck } from 'lucide-react'
import { KINDS, kindByKey, getPackagingKindCounts, getPackagingSuppliers } from '@/lib/packaging/directory'
import ProviderCard, { type PublicProvider } from '../../providers/ProviderCard'
import LoadMore from '../../providers/LoadMore'

export const revalidate = 3600
const PAGE_SIZE = 15

type SP = Promise<{ kind?: string; q?: string }>

export async function generateMetadata({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: SP }): Promise<Metadata> {
  const { locale } = await params
  const sp = await searchParams
  const isAr = locale === 'ar'
  const kind = kindByKey(sp.kind)
  const q = (sp.q ?? '').trim()
  const { total, byKind } = await getPackagingKindCounts()
  const n = (kind ? (byKind[kind.key] ?? 0) : total).toLocaleString('en-US')
  const url = (l: string) => `https://www.crate.ae/${l}/packaging/suppliers${kind ? `?kind=${kind.key}` : ''}`

  const title = kind
    ? (isAr ? `${kind.label.ar} في دبي — ${n} شركة مرخّصة` : `${kind.label.en} in Dubai — ${n} licensed companies`)
    : (isAr ? `موردو ومصانع وشركات التغليف في دبي — ${n} شركة مرخّصة` : `Packaging suppliers, factories & companies in Dubai — ${n} licensed companies`)
  const description = kind
    ? (isAr ? `دليل ${n} شركة: ${kind.desc.ar} من السجل التجاري في دبي. اطلب عرض سعر عبر Crate.` : `Directory of ${n} companies: ${kind.desc.en} From the Dubai commercial registry. Request a quote through Crate.`)
    : (isAr ? `دليل ${n} شركة تغليف مرخّصة في السجل التجاري بدبي: مواد التغليف، المصانع، وخدمات التعبئة وإعادة التعبئة والملصقات. اطلب عرض سعر عبر Crate.` : `A directory of ${n} packaging companies licensed in the Dubai commercial registry: materials, factories, packing, repacking and labelling services. Request a quote through Crate.`)
  return {
    title, description,
    alternates: { canonical: url(locale), languages: { ar: url('ar'), en: url('en'), 'x-default': url('ar') } },
    openGraph: { title, description, url: url(locale) },
    ...(q ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function PackagingSuppliersPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: SP }) {
  const { locale } = await params
  const sp = await searchParams
  const isAr = locale === 'ar'
  const kind = kindByKey(sp.kind)
  const q = (sp.q ?? '').trim()

  const [{ rows, total }, counts] = await Promise.all([
    getPackagingSuppliers({ kind: kind?.key, q, from: 0, to: PAGE_SIZE - 1 }),
    getPackagingKindCounts(),
  ])
  const first = rows as unknown as PublicProvider[]
  const href = (k?: string) => `/${locale}/packaging/suppliers${k ? `?kind=${k}` : ''}`
  const heading = kind ? (isAr ? kind.label.ar : kind.label.en) : (isAr ? 'موردو ومصانع وشركات التغليف' : 'Packaging suppliers, factories & companies')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [{ '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Crate', item: `https://www.crate.ae/${locale}` },
      { '@type': 'ListItem', position: 2, name: isAr ? 'التعبئة والتغليف' : 'Packaging', item: `https://www.crate.ae/${locale}/packaging` },
      { '@type': 'ListItem', position: 3, name: heading, item: `https://www.crate.ae/${locale}/packaging/suppliers${kind ? `?kind=${kind.key}` : ''}` },
    ] }],
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={isAr ? 'rtl' : 'ltr'}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="bg-gradient-to-br from-orange-50/70 via-white to-white border-b border-gray-100 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <nav className="text-xs text-gray-400 mb-4">
            <Link href={`/${locale}`} className="hover:text-orange-600">Crate</Link> / <Link href={`/${locale}/packaging`} className="hover:text-orange-600">{isAr ? 'التعبئة والتغليف' : 'Packaging'}</Link> / <span className="text-gray-600">{isAr ? 'الموردون والمصانع' : 'Suppliers & factories'}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-2"><Factory className="w-7 h-7 text-orange-500 flex-shrink-0" />{heading}</h1>
          <p className="text-gray-500 text-sm leading-relaxed max-w-2xl mb-6">
            {isAr
              ? `${(total ?? 0).toLocaleString('en-US')} ${q ? 'نتيجة' : 'شركة'} — ${kind ? kind.desc.ar : 'شركات تغليف مرخّصة في السجل التجاري بدبي.'} تواصل عبر Crate كوسيط موثوق.`
              : `${(total ?? 0).toLocaleString('en-US')} ${q ? 'results' : 'companies'} — ${kind ? kind.desc.en : 'packaging companies licensed in the Dubai commercial registry.'} Contact them through Crate as a trusted broker.`}
          </p>
          <form method="get" action={`/${locale}/packaging/suppliers`} className="max-w-xl flex gap-2">
            {kind && <input type="hidden" name="kind" value={kind.key} />}
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input name="q" defaultValue={q} placeholder={isAr ? 'ابحث باسم الشركة…' : 'Search by company name…'}
                className="w-full ps-9 pe-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" dir={isAr ? 'rtl' : 'ltr'} />
            </div>
            <button type="submit" className="bg-orange-500 text-white px-5 py-2.5 rounded-xl text-sm hover:bg-orange-600 transition-colors whitespace-nowrap">{isAr ? 'بحث' : 'Search'}</button>
          </form>
        </div>
      </section>

      {/* Kind chips */}
      <div className="bg-white border-b border-gray-100 sticky top-[58px] z-30">
        <div className="max-w-6xl mx-auto px-6 py-3 flex flex-wrap gap-2">
          <Link href={href()} className={`px-3 py-1.5 rounded-lg text-xs border transition-all flex items-center gap-1.5 ${!kind ? 'bg-orange-500 text-white border-orange-500' : 'text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600'}`}>
            {isAr ? 'الكل' : 'All'} <span className={`tabular-nums text-[10px] ${!kind ? 'text-orange-100' : 'text-gray-400'}`}>{counts.total.toLocaleString('en-US')}</span>
          </Link>
          {KINDS.map(k => {
            const active = kind?.key === k.key
            return (
              <Link key={k.key} href={href(active ? undefined : k.key)} className={`px-3 py-1.5 rounded-lg text-xs border transition-all flex items-center gap-1.5 ${active ? 'bg-orange-500 text-white border-orange-500' : 'text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600'}`}>
                {isAr ? k.short.ar : k.short.en} <span className={`tabular-nums text-[10px] ${active ? 'text-orange-100' : 'text-gray-400'}`}>{(counts.byKind[k.key] ?? 0).toLocaleString('en-US')}</span>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-5 flex items-start gap-2 rounded-xl bg-white border border-gray-200 px-4 py-3 text-xs text-gray-500">
          <ShieldCheck className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
          {isAr
            ? 'الأسماء والأنشطة من السجل التجاري العام. تفاصيل الرخصة وبيانات التواصل مقيّدة، ويمرّ كل طلب عبر Crate الذي يتولّى التواصل نيابةً عنك.'
            : 'Names and activities come from the public commercial registry. Licence details and contact data are restricted, and every request goes through Crate, which contacts the company on your behalf.'}
        </div>

        {first.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Factory className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="font-semibold">{isAr ? 'لا توجد شركات بهذه المعايير' : 'No companies match these filters'}</p>
            <Link href={href()} className="text-orange-500 text-sm mt-2 inline-block hover:underline">{isAr ? 'إعادة ضبط' : 'Reset'}</Link>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
              {first.map(p => <ProviderCard key={p.id} p={p} locale={locale} isAr={isAr} sourcePage={`/${locale}/packaging/suppliers`} />)}
            </div>
            <LoadMore locale={locale} isAr={isAr} cat="" q={q} kind={kind?.key ?? ''} endpoint="/api/packaging/suppliers"
              sourcePage={`/${locale}/packaging/suppliers`} initialFrom={PAGE_SIZE} total={total ?? 0} />
          </>
        )}

        <p className="mt-8 text-center text-xs text-gray-400">
          {isAr ? 'البيانات من السجل التجاري الرسمي — دبي.' : 'Data from the official commercial registry — Dubai.'}
        </p>
      </div>
    </div>
  )
}
