import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { BarChart2, Boxes, Users, Search, FileText, ArrowLeft, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { getProviders } from '@/lib/supabase/cached'
import { sectionOf } from '@/lib/sections'

export const revalidate = 1800

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'
  const title = isAr ? 'التجارة — فرص السوق والمنتجات والموردون في الإمارات' : 'Trade — market opportunities, products and suppliers in the UAE'
  const description = isAr
    ? 'قسم التجارة في Crate: فرص سوق مقيَّمة يومياً، ومنتجات مُتابَعة بصفحة إشارات لكل منها، ودليل شركات التجارة المرخّصة في دبي، وبحث ذكي عن الموردين.'
    : "Crate's trade section: market opportunities scored daily, tracked products with a signal page each, a directory of licensed trading companies in Dubai, and smart supplier search."
  return {
    title, description,
    alternates: { canonical: `https://www.crate.ae/${locale}/trade`, languages: { ar: '/ar/trade', en: '/en/trade', 'x-default': '/ar/trade' } },
    openGraph: { title, description, url: `https://www.crate.ae/${locale}/trade` },
  }
}

interface Opp { id: string; title: string; title_ar: string | null; category_guess: string | null; trend_direction: string | null; composite_score: number | null }

async function getTradeData() {
  const fallback = { opportunities: 0, products: 0, traders: 0, top: [] as Opp[] }
  try {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } })
    const [opps, prods, top, traders] = await Promise.all([
      sb.from('opportunities').select('id', { count: 'exact', head: true }),
      sb.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
      sb.from('opportunities').select('id, title, title_ar, category_guess, trend_direction, composite_score')
        .in('stage', ['scored', 'approved', 'published', 'capturing', 'converting', 'won'])
        .or('blocked_reason.is.null,blocked_reason.not.ilike.content_gate*')
        .order('composite_score', { ascending: false }).limit(4),
      getProviders({ type: 'trader', from: 0, to: 0 }),
    ])
    return { opportunities: opps.count ?? 0, products: prods.count ?? 0, traders: traders.total ?? 0, top: (top.data ?? []) as Opp[] }
  } catch { return fallback }
}

export default async function TradeHub({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: loc } = await params
  const locale: 'ar' | 'en' = loc === 'en' ? 'en' : 'ar'
  const isAr = locale === 'ar'
  const t = (b: { en: string; ar: string }) => (isAr ? b.ar : b.en)
  const Arrow = isAr ? ArrowLeft : ArrowRight
  const d = await getTradeData()
  const sec = sectionOf('trade')
  const n = (x: number) => x.toLocaleString('en-US')

  const CARDS = [
    { href: '/market', icon: BarChart2, count: d.opportunities, unit: { en: 'opportunities evaluated', ar: 'فرصة قيد التقييم' } },
    { href: '/products', icon: Boxes, count: d.products, unit: { en: 'products tracked', ar: 'منتج مُتابَع' } },
    { href: '/providers', icon: Users, count: d.traders, unit: { en: 'licensed trading companies', ar: 'شركة تجارة مرخّصة' } },
    { href: '/search', icon: Search, count: 0, unit: { en: '', ar: '' } },
    { href: '/rfq', icon: FileText, count: 0, unit: { en: '', ar: '' } },
  ]
  const trend = (x: string | null) => x === 'rising' ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> : x === 'falling' ? <TrendingDown className="w-3.5 h-3.5 text-rose-400" /> : <Minus className="w-3.5 h-3.5 text-gray-400" />

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', name: isAr ? 'التجارة — Crate' : 'Trade — Crate', inLanguage: locale, url: `https://www.crate.ae/${locale}/trade`, isPartOf: { '@id': 'https://www.crate.ae/#website' } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Crate', item: `https://www.crate.ae/${locale}` },
        { '@type': 'ListItem', position: 2, name: t(sec.label), item: `https://www.crate.ae/${locale}/trade` },
      ] },
    ],
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={isAr ? 'rtl' : 'ltr'}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="bg-gradient-to-b from-orange-50/70 via-white to-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-5 py-12 md:py-16">
          <nav className="text-xs text-gray-400 mb-4"><Link href={`/${locale}`} className="hover:text-orange-600">Crate</Link> / <span className="text-gray-600">{t(sec.label)}</span></nav>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-3">{isAr ? 'التجارة: فرص وموردون ومنتجات' : 'Trade: opportunities, suppliers and products'}</h1>
          <p className="text-gray-500 max-w-2xl leading-relaxed">{t(sec.tagline)}</p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-5 py-10 flex flex-col gap-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sec.links.map((l, i) => {
            const c = CARDS.find(x => x.href === l.href)!
            return (
              <Link key={l.href} href={`/${locale}${l.href}`} className="group bg-white border border-gray-200 hover:border-orange-300 hover:shadow-md rounded-2xl p-5 transition-all flex flex-col">
                <span className="flex items-center justify-between mb-3">
                  <span className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center"><c.icon className="w-5 h-5" /></span>
                  {c.count > 0 && <span className="text-sm tabular-nums text-gray-500">{n(c.count)} <span className="text-[11px] text-gray-400">{t(c.unit)}</span></span>}
                </span>
                <span className="text-base font-semibold text-gray-900 mb-1">{t(l.label)}</span>
                <span className="text-sm text-gray-500 leading-relaxed flex-1">{t(l.hint)}</span>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm text-orange-600 group-hover:gap-2.5 transition-all">{isAr ? 'افتح' : 'Open'}<Arrow className="w-4 h-4" /></span>
              </Link>
            )
          })}
        </div>

        {d.top.length > 0 && (
          <section>
            <div className="flex items-end justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">{isAr ? 'أعلى الفرص الآن' : 'Top opportunities now'}</h2>
              <Link href={`/${locale}/market`} className="text-sm text-orange-600 hover:text-orange-700">{isAr ? 'اللوحة الكاملة' : 'Full board'}</Link>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
              {d.top.map((o, i) => (
                <div key={o.id} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="font-mono text-[10px] text-gray-300 w-5">{String(i + 1).padStart(2, '0')}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{(isAr ? o.title_ar : o.title) || o.title}</div>
                    <div className="text-[11px] text-gray-400">{o.category_guess ?? '—'}</div>
                  </div>
                  {trend(o.trend_direction)}
                  <span className="font-mono text-sm font-bold text-orange-500 tabular-nums w-8 text-end">{o.composite_score ?? 0}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <p className="text-xs text-gray-400">
          {isAr
            ? 'يقتصر دليل الموردين هنا على شركات التجارة. شركات التغليف والمصانع في قسم '
            : 'The supplier directory here covers trading companies only. Packaging companies and factories live in the '}
          <Link href={`/${locale}/packaging`} className="text-orange-600 hover:underline">{isAr ? 'التعبئة والتغليف' : 'Packaging section'}</Link>.
        </p>
      </div>
    </div>
  )
}
