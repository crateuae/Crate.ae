import Link from 'next/link'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import {
  BarChart2, ShieldCheck, Package, Boxes, Users, BookOpen,
  ArrowLeft, ArrowRight, TrendingUp, TrendingDown, Minus,
  Sparkles, Database, Search, CheckCircle2, Globe2, Clock,
} from 'lucide-react'

export const revalidate = 1800 // refresh live data every 30 min

// ─── Live data ────────────────────────────────────────────────────────────────

interface Opp {
  id: string
  title: string
  title_ar: string | null
  category_guess: string | null
  trend_direction: string | null
  composite_score: number | null
  stage: string | null
  updated_at: string
}

async function getLiveData() {
  const fallback = {
    providers: 47303, opportunities: 37, products: 33, rules: 18,
    topOpps: [] as Opp[], lastSync: new Date().toISOString(),
  }
  try {
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )
    const [prov, opps, prods, rules, top] = await Promise.all([
      supabase.from('providers').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('opportunities').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('compliance_rules').select('id', { count: 'exact', head: true }),
      supabase.from('opportunities')
        .select('id, title, title_ar, category_guess, trend_direction, composite_score, stage, updated_at')
        // public surface: only vetted stages, never raw/blocked/dismissed rows
        .in('stage', ['scored', 'approved', 'published', 'capturing', 'converting', 'won'])
        .or('blocked_reason.is.null,blocked_reason.not.ilike.content_gate*')
        .order('composite_score', { ascending: false })
        .limit(6),
    ])
    return {
      providers: prov.count ?? fallback.providers,
      opportunities: opps.count ?? fallback.opportunities,
      products: prods.count ?? fallback.products,
      rules: rules.count ?? fallback.rules,
      topOpps: (top.data ?? []) as Opp[],
      lastSync: (top.data?.[0]?.updated_at as string) ?? fallback.lastSync,
    }
  } catch {
    return fallback
  }
}

const fmt = (n: number) => n.toLocaleString('en-US')

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const isAr = locale === 'ar'
  const Arrow = isAr ? ArrowLeft : ArrowRight
  const d = await getLiveData()

  const trendIcon = (t: string | null) =>
    t === 'rising' ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
    : t === 'falling' ? <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
    : <Minus className="w-3.5 h-3.5 text-stone-400" />

  const trendLabel = (t: string | null) =>
    t === 'rising' ? (isAr ? 'صاعد' : 'Rising')
    : t === 'falling' ? (isAr ? 'هابط' : 'Falling')
    : (isAr ? 'مستقر' : 'Stable')

  const tickerItems = d.topOpps.length
    ? d.topOpps.map(o => ({
        t: (isAr ? o.title_ar : o.title) || o.title,
        s: o.composite_score ?? 0,
        dir: o.trend_direction,
      }))
    : [{ t: isAr ? 'يتم تحديث فرص السوق' : 'Market opportunities updating', s: 0, dir: 'stable' }]

  const syncDate = new Date(d.lastSync).toLocaleDateString(isAr ? 'ar-AE' : 'en-AE', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const track = (cls: string) => (isAr ? '' : cls) // no letter-spacing on Arabic (tears glyph joins)

  return (
    <div className="min-h-screen bg-white" dir={isAr ? 'rtl' : 'ltr'}>

      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'Organization',
        name: 'Crate', url: 'https://www.crate.ae',
        email: 'uae@crate.ae', telephone: '+971543000415',
        description: isAr
          ? 'منصة الاستيراد والتوريد الذكية في السوق الإماراتي'
          : 'The smart import and supply platform for the UAE market',
        address: { '@type': 'PostalAddress', addressCountry: 'AE' },
      }) }} />

      {/* ════ HERO ════ */}
      <section className="relative overflow-hidden">
        {/* soft warm gradient wash */}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-orange-50/70 via-white to-white" />
        <div aria-hidden className="absolute -top-32 start-[8%] w-[520px] h-[520px] rounded-full opacity-50 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, #ffedd5, transparent)' }} />
        <div aria-hidden className="absolute top-10 end-[6%] w-[360px] h-[360px] rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, #fde9d3, transparent)' }} />

        <div className="relative max-w-6xl mx-auto px-5 pt-16 pb-14 lg:pt-24 lg:pb-20">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">

            {/* ── Copy ── */}
            <div>
              <div className={`inline-flex items-center gap-2 bg-white border border-orange-100 shadow-sm rounded-full px-4 py-1.5 text-[11px] font-semibold text-orange-600 mb-7 ${track('tracking-wide')}`}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                </span>
                {isAr ? 'بيانات السوق محدّثة يومياً' : 'Market data, updated daily'}
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-[3.3rem] font-black text-stone-900 leading-[1.14] tracking-tight mb-6">
                {isAr ? (
                  <>استورد بذكاء،<br />ووزّع <span className="text-orange-500">بثقة</span></>
                ) : (
                  <>Import smart,<br />supply with <span className="text-orange-500">confidence</span></>
                )}
              </h1>

              <p className="text-stone-500 text-base lg:text-lg leading-relaxed mb-4 max-w-xl">
                {isAr
                  ? 'منصة متكاملة تدير دورة الاستيراد كاملة — من اكتشاف الفرصة عبر ست قنوات، إلى فحص الاشتراطات، إلى خطة توريد وتعبئة جاهزة للتنفيذ.'
                  : 'An all-in-one platform for the full import cycle — from discovering the opportunity across six channels, to checking requirements, to an execution-ready supply and packing plan.'}
              </p>
              <p className="text-[13px] text-stone-400 font-medium mb-9">
                {isAr
                  ? `مدعومة بسجل ${fmt(d.providers)} شركة مرخّصة · ESMA · UAE.S · ADAFSA`
                  : `Backed by a registry of ${fmt(d.providers)} licensed companies · ESMA · UAE.S · ADAFSA`}
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href={`/${locale}/market`}
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-7 py-3.5 rounded-2xl transition-all text-sm shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5">
                  <Sparkles className="w-4 h-4" />
                  {isAr ? 'اكتشف فرص السوق' : 'Explore opportunities'}
                  <Arrow className="w-4 h-4" />
                </Link>
                <Link href={`/${locale}/compliance`}
                  className="inline-flex items-center gap-2 bg-white hover:bg-orange-50 text-stone-700 font-semibold px-6 py-3.5 rounded-2xl border border-stone-200 hover:border-orange-200 transition-all text-sm">
                  <ShieldCheck className="w-4 h-4 text-orange-500" />
                  {isAr ? 'افحص اشتراطات منتجك' : 'Check product requirements'}
                </Link>
              </div>
            </div>

            {/* ── Live opportunity card (light) ── */}
            <div className="bg-white border border-stone-200/80 rounded-3xl overflow-hidden shadow-xl shadow-stone-200/50">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100 bg-gradient-to-r from-orange-50/60 to-white">
                <div className={`text-[11px] font-semibold text-stone-500 ${track('tracking-wide')}`}>
                  <span className="text-orange-600 font-bold">Crate</span> · {isAr ? 'لوحة الفرص المباشرة' : 'Live Opportunities'}
                </div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  {isAr ? 'مباشر' : 'Live'}
                </span>
              </div>

              <div className="divide-y divide-stone-100">
                {d.topOpps.slice(0, 4).map((o, i) => (
                  <div key={o.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-orange-50/40 transition-colors">
                    <span className="font-mono text-[10px] text-stone-300 w-5">{String(i + 1).padStart(2, '0')}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-stone-800 truncate">
                        {(isAr ? o.title_ar : o.title) || o.title}
                      </div>
                      <div className="text-[10px] text-stone-400 mt-0.5">{o.category_guess ?? '—'}</div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-stone-500">
                      {trendIcon(o.trend_direction)}
                      {trendLabel(o.trend_direction)}
                    </div>
                    <div className="w-16">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[11px] font-bold text-orange-500">{o.composite_score ?? 0}</span>
                        <span className="font-mono text-[9px] text-stone-300">/100</span>
                      </div>
                      <div className="h-1 rounded-full bg-stone-100 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-400"
                          style={{ width: `${Math.min(o.composite_score ?? 0, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
                {!d.topOpps.length && (
                  <div className="px-5 py-10 text-center text-xs text-stone-400">
                    {isAr ? 'يتم تحديث الفرص…' : 'Opportunities updating…'}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between px-5 py-3 border-t border-stone-100 bg-stone-50/50">
                <span className="text-[10px] text-stone-400 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  {isAr ? `آخر تحديث: ${syncDate}` : `Last update: ${syncDate}`}
                </span>
                <Link href={`/${locale}/market`} className="text-[11px] font-semibold text-orange-500 hover:text-orange-600 transition-colors">
                  {isAr ? 'عرض كل الفرص ←' : 'View all →'}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Ticker strip (light) ── */}
        <div className="relative border-y border-orange-100 bg-orange-50/50 overflow-hidden" dir="ltr">
          <div
            className="flex w-max whitespace-nowrap animate-[crate-ticker_50s_linear_infinite] hover:[animation-play-state:paused] motion-reduce:animate-none py-2.5"
            style={isAr ? { animationDirection: 'reverse' } : undefined}>
            {Array.from({ length: tickerItems.length >= 5 ? 3 : 12 }).flatMap((_, rep) =>
              tickerItems.map((x, i) => (
                <span key={`${rep}-${i}`} dir={isAr ? 'rtl' : 'ltr'}
                  className="inline-flex items-center gap-2 px-6 text-[11px] font-medium text-stone-500">
                  <span className={x.dir === 'rising' ? 'text-emerald-500' : x.dir === 'falling' ? 'text-rose-400' : 'text-stone-400'}>
                    {x.dir === 'rising' ? '▲' : x.dir === 'falling' ? '▼' : '◆'}
                  </span>
                  <span dir="auto">{x.t}</span>
                  {x.s > 0 && <span className="font-mono text-orange-500 font-bold">{x.s}</span>}
                  <span className="text-orange-200 ps-6">|</span>
                </span>
              ))
            )}
          </div>
          <style>{`@keyframes crate-ticker { from { transform: translateX(0) } to { transform: translateX(-33.33%) } }`}</style>
        </div>
      </section>

      {/* ════ METRICS BAND ════ */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-5 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-8">
            {[
              { v: fmt(d.providers) + '+', ar: 'شركة مرخّصة في السجل', en: 'Licensed companies', icon: Database },
              { v: String(d.opportunities), ar: 'فرصة قيد التقييم', en: 'Opportunities evaluated', icon: Sparkles },
              { v: String(d.products), ar: 'منتج تحت المتابعة', en: 'Products tracked daily', icon: Boxes },
              { v: String(d.rules), ar: 'اشتراط تسجيل موثّق', en: 'Documented requirements', icon: ShieldCheck },
              { v: '6', ar: 'قنوات متابعة للسوق', en: 'Market channels', icon: Search },
              { v: '24/7', ar: 'تحديث تلقائي مستمر', en: 'Continuous auto-update', icon: Clock },
            ].map((s, i) => (
              <div key={i} className="text-center lg:text-start">
                <s.icon className="w-4 h-4 text-orange-400 mb-2 mx-auto lg:mx-0" />
                <div className="font-mono text-2xl lg:text-[1.7rem] font-black text-stone-900 tracking-tight [font-variant-numeric:tabular-nums]">
                  {s.v}
                </div>
                <div className="text-[11px] text-stone-400 mt-1 leading-snug">{isAr ? s.ar : s.en}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ MODULES ════ */}
      <section className="bg-gradient-to-b from-white to-orange-50/40">
        <div className="max-w-6xl mx-auto px-5 py-16 lg:py-20">
          <div className="mb-10">
            <div className={`text-[10px] font-bold text-orange-500 uppercase mb-3 ${track('tracking-[0.22em]')}`}>
              {isAr ? 'وحدات المنصة' : 'Platform Modules'}
            </div>
            <h2 className="text-3xl font-black text-stone-900 tracking-tight mb-3">
              {isAr ? 'ست وحدات. دورة استيراد واحدة متكاملة.' : 'Six modules. One integrated import cycle.'}
            </h2>
            <p className="text-stone-500 text-sm max-w-2xl leading-relaxed">
              {isAr
                ? 'كل وحدة مبنية على بيانات حية ومعايير رسمية — لا محتوى إنشائي، ولا أرقام تقديرية.'
                : 'Every module is built on live data and official standards — no filler content, no estimated figures.'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                code: '01', icon: BarChart2, href: '/market',
                t_ar: 'تحليلات السوق', t_en: 'Market Analytics',
                d_ar: 'متابعة يومية لنون وأمازون.ae وكارفور ولولو وGoogle Trends — تحسب فجوات العرض والطلب وترتّب الفرص بدرجة مركّبة من أربعة مؤشرات.',
                d_en: 'Daily tracking of Noon, Amazon.ae, Carrefour, Lulu & Google Trends — computing supply/demand gaps and ranking opportunities by a four-factor composite score.',
              },
              {
                code: '02', icon: ShieldCheck, href: '/compliance',
                t_ar: 'محرك الاشتراطات', t_en: 'Compliance Engine',
                d_ar: 'فحص فوري ضد ESMA وUAE.S 9:2019 و1926:2015 — قائمة نواقص كاملة ببنودها الدقيقة بدل شهر من الاكتشاف التدريجي.',
                d_en: 'Instant checks against ESMA, UAE.S 9:2019 and 1926:2015 — a complete gap list with exact clauses instead of a month of gradual discovery.',
              },
              {
                code: '03', icon: Package, href: '/packaging',
                t_ar: 'تخطيط التوريد والتعبئة', t_en: 'Supply & Repack Planner',
                d_ar: 'من الطلب إلى الطن: مصادر الشراء، توزيع الكراتين والباليتات، التكلفة الكاملة، السعر المقترح، وليبل مطابق جاهز للطباعة.',
                d_en: 'From order to tonnage: sourcing, carton and pallet distribution, full costing, suggested pricing, and a compliant print-ready label.',
              },
              {
                code: '04', icon: Users, href: '/providers',
                t_ar: 'سجل الموردين', t_en: 'Supplier Registry',
                d_ar: `${fmt(d.providers)} شركة مرخّصة من سجل دبي التجاري — بتصنيفاتها ورخصها وحالتها القانونية، وبحث ثنائي اللغة فوري.`,
                d_en: `${fmt(d.providers)} licensed companies from the Dubai Commerce Registry — with categories, licenses and legal status, instantly searchable in both languages.`,
              },
              {
                code: '05', icon: Boxes, href: '/products',
                t_ar: 'صفحات المنتجات والإشارات', t_en: 'Product Signal Pages',
                d_ar: 'لكل منتج صفحة تحليل كاملة: مسارات الربح المحلية والاستيرادية، إشارات السوق، سرعة الدوران، والمواصفات التفصيلية.',
                d_en: 'A full analysis page per product: local and import profit paths, market signals, sales velocity, and detailed specifications.',
              },
              {
                code: '06', icon: BookOpen, href: '/guides/carton-specs',
                t_ar: 'مركز معرفة الكراتين', t_en: 'Carton Knowledge Hub',
                d_ar: 'دليل المواصفات الكامل: أنواع الفلوت والطبقات ودرجات الورق والقياسات الستاندرد المتداولة في السوق الإماراتي.',
                d_en: 'The complete specifications guide: flute types, wall layers, paper grades, and standard sizes traded in the UAE market.',
              },
            ].map(m => (
              <Link key={m.code} href={`/${locale}${m.href}`}
                className="group bg-white border border-stone-200/80 hover:border-orange-200 rounded-2xl p-6 transition-all hover:shadow-xl hover:shadow-orange-500/5 hover:-translate-y-0.5 flex flex-col">
                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-100 group-hover:bg-orange-100 flex items-center justify-center transition-colors">
                    <m.icon className="w-[19px] h-[19px] text-orange-500 transition-colors" />
                  </div>
                  <span className={`font-mono text-[10px] font-semibold text-stone-300 group-hover:text-orange-300 transition-colors ${track('tracking-[0.18em]')}`}>
                    {isAr ? `وحدة ${m.code}` : `MODULE ${m.code}`}
                  </span>
                </div>
                <h3 className="font-black text-stone-900 text-base mb-2">{isAr ? m.t_ar : m.t_en}</h3>
                <p className="text-[13px] text-stone-500 leading-relaxed flex-1">{isAr ? m.d_ar : m.d_en}</p>
                <div className="mt-5 text-[12px] font-semibold text-stone-400 group-hover:text-orange-500 transition-colors flex items-center gap-1.5">
                  {isAr ? 'افتح الوحدة' : 'Open module'}
                  <Arrow className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ════ LIVE OPPORTUNITY BOARD ════ */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-5 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <div className={`text-[10px] font-bold text-orange-500 uppercase mb-3 ${track('tracking-[0.22em]')}`}>
                {isAr ? 'بيانات فعلية — ليست عيّنة' : 'Real data — not a sample'}
              </div>
              <h2 className="text-3xl font-black text-stone-900 tracking-tight">
                {isAr ? 'لوحة الفرص المباشرة' : 'Live Opportunity Board'}
              </h2>
            </div>
            <Link href={`/${locale}/market`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors">
              {isAr ? 'اللوحة الكاملة' : 'Full board'}
              <Arrow className="w-4 h-4" />
            </Link>
          </div>

          <div className="border border-stone-200/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-orange-50/50 text-[11px] text-stone-500">
                    <th className="text-start font-semibold px-5 py-3.5 w-10">#</th>
                    <th className="text-start font-semibold px-5 py-3.5">{isAr ? 'الفرصة' : 'Opportunity'}</th>
                    <th className="text-start font-semibold px-5 py-3.5">{isAr ? 'التصنيف' : 'Category'}</th>
                    <th className="text-start font-semibold px-5 py-3.5">{isAr ? 'الاتجاه' : 'Trend'}</th>
                    <th className="text-start font-semibold px-5 py-3.5">{isAr ? 'الدرجة المركّبة' : 'Composite Score'}</th>
                    <th className="text-start font-semibold px-5 py-3.5">{isAr ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody>
                  {d.topOpps.slice(0, 5).map((o, i) => (
                    <tr key={o.id} className="border-t border-stone-100 hover:bg-orange-50/40 transition-colors">
                      <td className="px-5 py-4 font-mono text-[11px] text-stone-400">{String(i + 1).padStart(2, '0')}</td>
                      <td className="px-5 py-4 font-semibold text-stone-900">{(isAr ? o.title_ar : o.title) || o.title}</td>
                      <td className="px-5 py-4 text-stone-500 text-[13px]">{o.category_guess ?? '—'}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-stone-600">
                          {trendIcon(o.trend_direction)}{trendLabel(o.trend_direction)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-stone-900 [font-variant-numeric:tabular-nums]">{o.composite_score ?? 0}</span>
                          <div className="w-20 h-1.5 rounded-full bg-stone-100 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-400"
                              style={{ width: `${Math.min(o.composite_score ?? 0, 100)}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {o.stage === 'published' ? (
                          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                            {isAr ? 'منشورة' : 'Published'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                            {isAr ? 'قيد المتابعة' : 'Tracking'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!d.topOpps.length && (
                    <tr><td colSpan={6} className="px-5 py-10 text-center text-stone-400 text-xs">
                      {isAr ? 'يتم تحديث الفرص…' : 'Opportunities updating…'}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-4 text-[11px] text-stone-400 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            {isAr
              ? `تُحسب الدرجة المركّبة من أربعة مؤشرات: الاتجاه، الفجوة، المراجحة، وقابلية التسجيل — آخر تحديث ${syncDate}`
              : `Composite score derives from four indicators: trend, gap, arbitrage and registrability — last updated ${syncDate}`}
          </p>
        </div>
      </section>

      {/* ════ PIPELINE ════ */}
      <section className="bg-gradient-to-b from-orange-50/40 to-white">
        <div className="max-w-6xl mx-auto px-5 py-16 lg:py-20">
          <div className="mb-10">
            <div className={`text-[10px] font-bold text-orange-500 uppercase mb-3 ${track('tracking-[0.22em]')}`}>
              {isAr ? 'منهجية العمل' : 'How It Works'}
            </div>
            <h2 className="text-3xl font-black text-stone-900 tracking-tight">
              {isAr ? 'من الفرصة إلى الشحنة — أربع مراحل' : 'From opportunity to shipment — four stages'}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { n: '01', icon: Search, t_ar: 'اكتشاف', t_en: 'Discover',
                d_ar: 'ست قنوات تتابع الأسعار والتوفر والطلب على مدار الساعة.',
                d_en: 'Six channels tracking prices, availability and demand around the clock.' },
              { n: '02', icon: BarChart2, t_ar: 'تقييم', t_en: 'Score',
                d_ar: 'درجة مركّبة من أربعة مؤشرات تفرز الفرص الحقيقية من الضجيج.',
                d_en: 'A four-factor composite score separates real opportunities from noise.' },
              { n: '03', icon: ShieldCheck, t_ar: 'امتثال', t_en: 'Comply',
                d_ar: 'فحص الاشتراطات وبناء ملف التسجيل الكامل قبل أي التزام مالي.',
                d_en: 'Requirements check and full registration file before any financial commitment.' },
              { n: '04', icon: Package, t_ar: 'تنفيذ', t_en: 'Execute',
                d_ar: 'خطة توريد وتعبئة وتسعير جاهزة للتشغيل — بالأرقام الكاملة.',
                d_en: 'A supply, repack and pricing plan ready to run — with complete figures.' },
            ].map((s, i) => (
              <div key={s.n} className="relative bg-white border border-stone-200/80 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                    <s.icon className="w-[18px] h-[18px] text-orange-500" />
                  </div>
                  <span className="font-mono text-2xl font-black text-orange-100">{s.n}</span>
                </div>
                <h3 className="font-black text-stone-900 mb-1.5">{isAr ? s.t_ar : s.t_en}</h3>
                <p className="text-[12.5px] text-stone-500 leading-relaxed">{isAr ? s.d_ar : s.d_en}</p>
                {i < 3 && (
                  <div aria-hidden className="hidden lg:block absolute top-1/2 -end-2 w-4 h-px bg-orange-200" />
                )}
              </div>
            ))}
          </div>

          {/* Provenance */}
          <div className="mt-12 bg-white border border-stone-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Globe2 className="w-4 h-4 text-orange-500" />
              <span className={`text-[11px] font-bold text-stone-500 uppercase ${track('tracking-[0.14em]')}`}>
                {isAr ? 'مصادر البيانات والمعايير' : 'Data Sources & Standards'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Dubai DED Registry', 'ESMA', 'UAE.S 9:2019', 'UAE.S 1926:2015', 'ADAFSA', 'Noon', 'Amazon.ae', 'Carrefour', 'Lulu', 'Google Trends'].map(src => (
                <span key={src} className="text-[11px] font-medium px-3 py-1.5 rounded-lg bg-orange-50/60 border border-orange-100 text-stone-600">
                  {src}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════ FINAL CTA (soft orange) ════ */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-5 pb-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 to-amber-500 text-white px-6 py-16 text-center shadow-xl shadow-orange-500/20">
            <div aria-hidden className="absolute -top-16 end-10 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
            <div aria-hidden className="absolute -bottom-20 start-10 w-72 h-72 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
                {isAr ? 'الفرصة تظهر لمن يتابع الأرقام' : 'Opportunity reveals itself to those watching the numbers'}
              </h2>
              <p className="text-white/90 text-sm md:text-base mb-9 max-w-xl mx-auto leading-relaxed">
                {isAr
                  ? `${fmt(d.providers)} شركة مرخّصة، ${d.opportunities} فرصة مرصودة، ومحرك اشتراطات يعمل الآن — ابدأ قبل منافسك.`
                  : `${fmt(d.providers)} licensed companies, ${d.opportunities} tracked opportunities, and a compliance engine running now — start before your competitor.`}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href={`/${locale}/market`}
                  className="inline-flex items-center gap-2 bg-white text-orange-600 font-semibold px-8 py-4 rounded-2xl transition-all text-sm hover:-translate-y-0.5 hover:shadow-lg">
                  {isAr ? 'ابدأ الآن — مجاناً' : 'Start now — free'}
                  <Arrow className="w-4 h-4" />
                </Link>
                <Link href={`/${locale}/products`}
                  className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-semibold px-7 py-4 rounded-2xl border border-white/20 transition-all text-sm">
                  <Boxes className="w-4 h-4" />
                  {isAr ? 'تصفّح المنتجات' : 'Browse products'}
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-2 text-[11px] text-white/80">
                {[
                  isAr ? 'بدون بطاقة ائتمان' : 'No credit card',
                  isAr ? 'ثنائي اللغة AR/EN' : 'Bilingual AR/EN',
                  isAr ? 'بيانات محدّثة يومياً' : 'Data refreshed daily',
                ].map(x => (
                  <span key={x} className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />{x}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
