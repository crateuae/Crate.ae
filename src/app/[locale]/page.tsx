import Link from 'next/link'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import {
  BarChart2, ShieldCheck, Package, Boxes, Users, BookOpen,
  ArrowLeft, ArrowRight, TrendingUp, TrendingDown, Minus,
  Activity, Database, Radar, CheckCircle2, Globe2, Clock,
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
        // public surface: never expose raw 'sensed' scrapes, dismissed/lost rows,
        // or content-gate-blocked items from this admin-only table
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
    : t === 'falling' ? <TrendingDown className="w-3.5 h-3.5 text-red-500" />
    : <Minus className="w-3.5 h-3.5 text-slate-400" />

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
    : [
        { t: isAr ? 'رصد السوق نشط' : 'Market radar active', s: 0, dir: 'stable' },
      ]

  const syncDate = new Date(d.lastSync).toLocaleDateString(isAr ? 'ar-AE' : 'en-AE', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-[#F8F9FB]" dir={isAr ? 'rtl' : 'ltr'}>

      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'Organization',
        name: 'Crate', url: 'https://www.crate.ae',
        email: 'uae@crate.ae', telephone: '+971543000415',
        description: isAr
          ? 'منصة استخبارات تجارية لسوق الاستيراد والتوريد في الإمارات'
          : 'Trade intelligence platform for the UAE import and supply market',
        address: { '@type': 'PostalAddress', addressCountry: 'AE' },
      }) }} />

      {/* ════ HERO — Command Center ════ */}
      <section className="relative bg-slate-950 text-white overflow-hidden">
        {/* grid pattern + glow */}
        <div aria-hidden className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }} />
        <div aria-hidden className="absolute -top-40 start-1/4 w-[600px] h-[400px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(closest-side, #f97316, transparent)' }} />

        <div className="relative max-w-6xl mx-auto px-5 pt-16 pb-14 lg:pt-24 lg:pb-20">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">

            {/* ── Copy ── */}
            <div>
              <div className={`inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-[11px] font-bold text-slate-300 mb-7 ${isAr ? '' : 'tracking-wide'}`}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                {isAr ? 'غرفة عمليات حية — مزامنة يومية آلية' : 'Live operations room — automated daily sync'}
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-[3.4rem] font-black leading-[1.12] tracking-tight mb-6">
                {isAr ? (
                  <>مركز القيادة التجاري<br /><span className="text-orange-500">لسوق الإمارات</span></>
                ) : (
                  <>The Trade Command Center<br /><span className="text-orange-500">for the UAE Market</span></>
                )}
              </h1>

              <p className="text-slate-400 text-base lg:text-lg leading-relaxed mb-4 max-w-xl">
                {isAr
                  ? 'منظومة استخبارات تجارية تدير دورة الاستيراد كاملة — من رصد الفرصة عبر ست قنوات متوازية، إلى فحص الاشتراطات، إلى خطة توريد وتعبئة جاهزة للتنفيذ.'
                  : 'A trade intelligence system running the full import cycle — from spotting opportunities across six parallel channels, to compliance checks, to an execution-ready supply and repacking plan.'}
              </p>
              <p className={`text-[13px] text-slate-500 font-semibold mb-9 ${isAr ? '' : 'tracking-wide'}`}>
                {isAr
                  ? `مدعومة بسجل ${fmt(d.providers)} شركة مرخّصة · ESMA · UAE.S · ADAFSA`
                  : `Backed by a registry of ${fmt(d.providers)} licensed companies · ESMA · UAE.S · ADAFSA`}
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href={`/${locale}/market`}
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black px-7 py-3.5 rounded-xl transition-all text-sm shadow-lg shadow-orange-500/20">
                  <Radar className="w-4 h-4" />
                  {isAr ? 'ادخل غرفة العمليات' : 'Enter the Operations Room'}
                  <Arrow className="w-4 h-4" />
                </Link>
                <Link href={`/${locale}/compliance`}
                  className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-slate-200 font-bold px-6 py-3.5 rounded-xl border border-white/10 hover:border-white/20 transition-all text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  {isAr ? 'افحص اشتراطات منتجك' : 'Check Product Requirements'}
                </Link>
              </div>
            </div>

            {/* ── Live signals terminal ── */}
            <div className="bg-slate-900/80 backdrop-blur border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.03]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase">
                  <span className="tracking-[0.2em]">Crate Live</span> · {isAr ? 'لوحة الإشارات' : <span className="tracking-[0.2em]">Signal Board</span>}
                </div>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-400" />
                </span>
              </div>

              <div className="divide-y divide-white/5">
                {(d.topOpps.slice(0, 4).length ? d.topOpps.slice(0, 4) : []).map((o, i) => (
                  <div key={o.id} className="flex items-center gap-3 px-4 py-3.5">
                    <span className="font-mono text-[10px] text-slate-600 w-5">{String(i + 1).padStart(2, '0')}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-slate-200 truncate">
                        {(isAr ? o.title_ar : o.title) || o.title}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{o.category_guess ?? '—'}</div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                      {trendIcon(o.trend_direction)}
                      {trendLabel(o.trend_direction)}
                    </div>
                    <div className="w-16">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[11px] font-black text-orange-400">{o.composite_score ?? 0}</span>
                        <span className="font-mono text-[9px] text-slate-600">/100</span>
                      </div>
                      <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
                          style={{ width: `${Math.min(o.composite_score ?? 0, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
                {!d.topOpps.length && (
                  <div className="px-4 py-8 text-center text-xs text-slate-500">
                    {isAr ? 'محرك الرصد قيد المزامنة…' : 'Radar engine syncing…'}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/10 bg-white/[0.02]">
                <span className="text-[10px] text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  {isAr ? `آخر مزامنة: ${syncDate}` : `Last sync: ${syncDate}`}
                </span>
                <Link href={`/${locale}/market`} className="text-[11px] font-bold text-orange-400 hover:text-orange-300 transition-colors">
                  {isAr ? 'عرض اللوحة الكاملة ←' : 'Full board →'}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Ticker strip ── */}
        <div className="relative border-t border-white/10 bg-black/40 overflow-hidden" dir="ltr">
          {/* w-max: transform % must resolve against content width, not viewport.
              reverse for Arabic: items enter from the left, per Arabic ticker convention. */}
          <div
            className="flex w-max whitespace-nowrap animate-[crate-ticker_45s_linear_infinite] hover:[animation-play-state:paused] motion-reduce:animate-none py-2.5"
            style={isAr ? { animationDirection: 'reverse' } : undefined}>
            {Array.from({ length: tickerItems.length >= 5 ? 3 : 12 }).flatMap((_, rep) =>
              tickerItems.map((x, i) => (
                <span key={`${rep}-${i}`} dir={isAr ? 'rtl' : 'ltr'}
                  className="inline-flex items-center gap-2 px-6 text-[11px] font-semibold text-slate-400">
                  <span className={x.dir === 'rising' ? 'text-emerald-400' : x.dir === 'falling' ? 'text-red-400' : 'text-slate-500'}>
                    {x.dir === 'rising' ? '▲' : x.dir === 'falling' ? '▼' : '◆'}
                  </span>
                  <span dir="auto">{x.t}</span>
                  {x.s > 0 && <span className="font-mono text-orange-400 font-black">{x.s}</span>}
                  <span className="text-slate-700 ps-6">|</span>
                </span>
              ))
            )}
          </div>
          <style>{`@keyframes crate-ticker { from { transform: translateX(0) } to { transform: translateX(-33.33%) } }`}</style>
        </div>
      </section>

      {/* ════ METRICS BAND ════ */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-5 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-8">
            {[
              { v: fmt(d.providers) + '+', ar: 'شركة مرخّصة في السجل', en: 'Licensed companies on registry', icon: Database },
              { v: String(d.opportunities), ar: 'فرصة قيد الرصد والتقييم', en: 'Opportunities under evaluation', icon: Radar },
              { v: String(d.products), ar: 'منتج تحت المراقبة اليومية', en: 'Products monitored daily', icon: Boxes },
              { v: String(d.rules), ar: 'اشتراط تسجيل موثّق', en: 'Documented requirements', icon: ShieldCheck },
              { v: '6', ar: 'قنوات رصد متوازية', en: 'Parallel monitoring channels', icon: Activity },
              { v: '24/7', ar: 'مزامنة آلية مستمرة', en: 'Continuous automated sync', icon: Clock },
            ].map((s, i) => (
              <div key={i} className="text-center lg:text-start">
                <s.icon className="w-4 h-4 text-orange-500 mb-2 mx-auto lg:mx-0" />
                <div className="font-mono text-2xl lg:text-[1.7rem] font-black text-slate-900 tracking-tight [font-variant-numeric:tabular-nums]">
                  {s.v}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 leading-snug">{isAr ? s.ar : s.en}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ MODULES ════ */}
      <section className="max-w-6xl mx-auto px-5 py-16 lg:py-20">
        <div className="mb-10">
          <div className={`text-[10px] font-black text-orange-500 uppercase mb-3 ${isAr ? '' : 'tracking-[0.25em]'}`}>
            {isAr ? 'وحدات المنظومة' : 'Platform Modules'}
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">
            {isAr ? 'ست وحدات تشغيلية. دورة استيراد واحدة متكاملة.' : 'Six operating modules. One integrated import cycle.'}
          </h2>
          <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
            {isAr
              ? 'كل وحدة مبنية على بيانات حية ومعايير رسمية — لا محتوى إنشائي، ولا أرقام تقديرية.'
              : 'Every module is built on live data and official standards — no filler content, no estimated figures.'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              code: '01', icon: BarChart2, href: '/market',
              t_ar: 'رصد السوق', t_en: 'Market Intelligence',
              d_ar: 'رصد يومي لنون وأمازون.ae وكارفور ولولو وGoogle Trends — يحسب فجوات العرض والطلب ويرتّب الفرص بدرجة مركّبة من أربعة مؤشرات.',
              d_en: 'Daily monitoring of Noon, Amazon.ae, Carrefour, Lulu & Google Trends — computing supply/demand gaps and ranking opportunities by a four-factor composite score.',
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
              className="group bg-white border border-slate-200 hover:border-orange-300 rounded-2xl p-6 transition-all hover:shadow-lg hover:shadow-orange-500/5 hover:-translate-y-0.5 flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <div className="w-10 h-10 rounded-xl border border-slate-200 group-hover:border-orange-200 group-hover:bg-orange-50 flex items-center justify-center transition-colors">
                  <m.icon className="w-[18px] h-[18px] text-slate-600 group-hover:text-orange-500 transition-colors" />
                </div>
                <span className={`font-mono text-[10px] font-black text-slate-300 group-hover:text-orange-300 transition-colors ${isAr ? '' : 'tracking-[0.2em]'}`}>
                  {isAr ? `وحدة ${m.code}` : `MODULE ${m.code}`}
                </span>
              </div>
              <h3 className="font-black text-slate-900 text-base mb-2">{isAr ? m.t_ar : m.t_en}</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed flex-1">{isAr ? m.d_ar : m.d_en}</p>
              <div className="mt-5 text-[12px] font-black text-slate-400 group-hover:text-orange-500 transition-colors flex items-center gap-1.5">
                {isAr ? 'افتح الوحدة' : 'Open module'}
                <Arrow className="w-3.5 h-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ════ LIVE OPPORTUNITY BOARD ════ */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-5 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <div className={`text-[10px] font-black text-orange-500 uppercase mb-3 ${isAr ? '' : 'tracking-[0.25em]'}`}>
                {isAr ? 'بيانات فعلية — ليست عيّنة' : 'Real data — not a sample'}
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                {isAr ? 'لوحة الفرص الحية' : 'Live Opportunity Board'}
              </h2>
            </div>
            <Link href={`/${locale}/market`}
              className="inline-flex items-center gap-2 text-sm font-black text-orange-500 hover:text-orange-600 transition-colors">
              {isAr ? 'اللوحة الكاملة' : 'Full board'}
              <Arrow className="w-4 h-4" />
            </Link>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-slate-50 text-[11px] text-slate-500">
                    <th className="text-start font-black px-5 py-3.5 w-10">#</th>
                    <th className="text-start font-black px-5 py-3.5">{isAr ? 'الفرصة' : 'Opportunity'}</th>
                    <th className="text-start font-black px-5 py-3.5">{isAr ? 'التصنيف' : 'Category'}</th>
                    <th className="text-start font-black px-5 py-3.5">{isAr ? 'الاتجاه' : 'Trend'}</th>
                    <th className="text-start font-black px-5 py-3.5">{isAr ? 'الدرجة المركّبة' : 'Composite Score'}</th>
                    <th className="text-start font-black px-5 py-3.5">{isAr ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody>
                  {d.topOpps.slice(0, 5).map((o, i) => (
                    <tr key={o.id} className="border-t border-slate-100 hover:bg-orange-50/40 transition-colors">
                      <td className="px-5 py-4 font-mono text-[11px] text-slate-400">{String(i + 1).padStart(2, '0')}</td>
                      <td className="px-5 py-4 font-bold text-slate-900">{(isAr ? o.title_ar : o.title) || o.title}</td>
                      <td className="px-5 py-4 text-slate-500 text-[13px]">{o.category_guess ?? '—'}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-slate-600">
                          {trendIcon(o.trend_direction)}{trendLabel(o.trend_direction)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-black text-slate-900 [font-variant-numeric:tabular-nums]">{o.composite_score ?? 0}</span>
                          <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
                              style={{ width: `${Math.min(o.composite_score ?? 0, 100)}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {o.stage === 'published' ? (
                          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {isAr ? 'منشورة' : 'Published'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            {isAr ? 'رصد نشط' : 'Active watch'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!d.topOpps.length && (
                    <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-xs">
                      {isAr ? 'محرك الرصد قيد المزامنة…' : 'Radar engine syncing…'}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-4 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3 h-3" />
            {isAr
              ? `تُحسب الدرجة المركّبة من أربعة مؤشرات: الاتجاه، الفجوة، المراجحة، وقابلية التسجيل — آخر تحديث ${syncDate}`
              : `Composite score derives from four indicators: trend, gap, arbitrage and registrability — last updated ${syncDate}`}
          </p>
        </div>
      </section>

      {/* ════ PIPELINE ════ */}
      <section className="max-w-6xl mx-auto px-5 py-16 lg:py-20">
        <div className="mb-10">
          <div className={`text-[10px] font-black text-orange-500 uppercase mb-3 ${isAr ? '' : 'tracking-[0.25em]'}`}>
            {isAr ? 'منهجية العمل' : 'Operating Methodology'}
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {isAr ? 'من الإشارة إلى الشحنة — أربع مراحل' : 'From signal to shipment — four stages'}
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { n: '01', icon: Radar, t_ar: 'رصد', t_en: 'Detect',
              d_ar: 'ست قنوات متوازية ترصد الأسعار والتوفر والطلب على مدار الساعة.',
              d_en: 'Six parallel channels monitoring prices, availability and demand around the clock.' },
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
            <div key={s.n} className="relative bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-lg bg-slate-950 flex items-center justify-center">
                  <s.icon className="w-4 h-4 text-orange-400" />
                </div>
                <span className="font-mono text-2xl font-black text-slate-100">{s.n}</span>
              </div>
              <h3 className="font-black text-slate-900 mb-1.5">{isAr ? s.t_ar : s.t_en}</h3>
              <p className="text-[12.5px] text-slate-500 leading-relaxed">{isAr ? s.d_ar : s.d_en}</p>
              {/* logical -end-2 already flips with dir — always faces the next card */}
              {i < 3 && (
                <div aria-hidden className="hidden lg:block absolute top-1/2 -end-2 w-4 h-px bg-slate-300" />
              )}
            </div>
          ))}
        </div>

        {/* Provenance */}
        <div className="mt-12 bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe2 className="w-4 h-4 text-orange-500" />
            <span className={`text-[11px] font-black text-slate-500 uppercase ${isAr ? '' : 'tracking-[0.15em]'}`}>
              {isAr ? 'مصادر البيانات والمعايير' : 'Data Sources & Standards'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {['Dubai DED Registry', 'ESMA', 'UAE.S 9:2019', 'UAE.S 1926:2015', 'ADAFSA', 'Noon', 'Amazon.ae', 'Carrefour', 'Lulu', 'Google Trends'].map(src => (
              <span key={src} className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600">
                {src}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ════ FINAL CTA ════ */}
      <section className="relative bg-slate-950 text-white overflow-hidden">
        <div aria-hidden className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(148,163,184,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }} />
        <div className="relative max-w-3xl mx-auto px-5 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
            {isAr ? 'الفرصة تظهر لمن يراقب الأرقام' : 'Opportunity reveals itself to those watching the numbers'}
          </h2>
          <p className="text-slate-400 text-sm md:text-base mb-9 max-w-xl mx-auto leading-relaxed">
            {isAr
              ? `${fmt(d.providers)} شركة مرخّصة، ${d.opportunities} فرصة مرصودة، ومحرك اشتراطات يعمل الآن — ادخل قبل منافسك.`
              : `${fmt(d.providers)} licensed companies, ${d.opportunities} tracked opportunities, and a compliance engine running now — get in before your competitor.`}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href={`/${locale}/market`}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black px-8 py-4 rounded-xl transition-all text-sm shadow-lg shadow-orange-500/25">
              {isAr ? 'ابدأ الآن — مجاناً' : 'Start now — free'}
              <Arrow className="w-4 h-4" />
            </Link>
            <Link href={`/${locale}/products`}
              className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-slate-200 font-bold px-7 py-4 rounded-xl border border-white/10 transition-all text-sm">
              <Boxes className="w-4 h-4" />
              {isAr ? 'تصفح المنتجات المرصودة' : 'Browse monitored products'}
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-2 text-[11px] text-slate-500">
            {[
              isAr ? 'بدون بطاقة ائتمان' : 'No credit card',
              isAr ? 'ثنائي اللغة AR/EN' : 'Bilingual AR/EN',
              isAr ? 'بيانات محدثة يومياً' : 'Data refreshed daily',
            ].map(x => (
              <span key={x} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />{x}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
