'use client'

import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, TrendingDown, Minus, RefreshCw, BarChart2, Zap, Eye, Database, Search } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { PRODUCTS_CATALOG, getProductSlug, getProductFMCG } from '@/lib/data/products-catalog'

interface TrendRow {
  product_id: string
  keyword: string
  trend_score: number
  trend_direction: 'rising' | 'stable' | 'falling'
  uae_interest_pct: number
  related_queries: string[]
  gap_signal: boolean
  is_available_uae: boolean
  retailer_mentions: string[]
  avg_price_aed: number | null
  fetched_at: string
}

interface SyncProduct {
  slug: string
  score: number
  direction: string
  sources: string
}

const DIR = {
  rising:  { icon: TrendingUp,   color: 'text-green-600',  bg: 'bg-green-50 border-green-200',  ar: 'صاعد',  en: 'Rising'  },
  stable:  { icon: Minus,        color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200',     ar: 'مستقر', en: 'Stable'  },
  falling: { icon: TrendingDown, color: 'text-red-500',    bg: 'bg-red-50 border-red-200',       ar: 'هابط',  en: 'Falling' },
}

export default function TrendsPage() {
  const params = useParams()
  const locale = params.locale as string
  const isAr = locale === 'ar'

  const [trends, setTrends]           = useState<TrendRow[]>([])
  const [loading, setLoading]         = useState(true)
  const [syncing, setSyncing]         = useState(false)
  const [syncMode, setSyncMode]       = useState<'serp' | 'fmcg' | null>(null)
  const [syncedProducts, setSyncedProducts] = useState<SyncProduct[]>([])
  const [syncingSlug, setSyncingSlug] = useState<string | null>(null)
  const [error, setError]             = useState<string | null>(null)

  // ── Load existing cached trends from DB ──────────────────────────
  const loadTrends = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/trends/sync')
      if (!res.ok) throw new Error(res.statusText)
      const data = await res.json()
      setTrends(data.trends || [])
    } catch {
      setError(isAr ? 'فشل تحميل البيانات' : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [isAr])

  // ── Sync all products ─────────────────────────────────────────────
  async function syncAll(skipSerp: boolean) {
    setSyncing(true)
    setSyncMode(skipSerp ? 'fmcg' : 'serp')
    setSyncedProducts([])
    setError(null)
    try {
      const res = await fetch('/api/trends/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-cron-secret': 'dev' },
        body: JSON.stringify({ max: 30, skip_serp: skipSerp }),
      })
      const data = await res.json()
      setSyncedProducts(data.products || [])
      await loadTrends()
    } catch {
      setError(isAr ? 'فشل المزامنة' : 'Sync failed')
    } finally {
      setSyncing(false)
      setSyncMode(null)
    }
  }

  // ── Sync single product ───────────────────────────────────────────
  async function syncSingle(slug: string) {
    setSyncingSlug(slug)
    try {
      const res = await fetch(`/api/trends/${slug}`)
      if (!res.ok) return
      const fresh = await res.json()
      setTrends(prev => {
        const filtered = prev.filter(t => !t.keyword.toLowerCase().includes(slug.replace(/-/g, ' ').split(' ')[0]))
        return [{ ...fresh, product_id: fresh.product_id || '' }, ...filtered]
      })
    } finally {
      setSyncingSlug(null)
    }
  }

  useEffect(() => { loadTrends() }, [loadTrends])

  // ── Build product → trend map ─────────────────────────────────────
  const trendByPid: Record<string, TrendRow> = {}
  for (const t of trends) {
    trendByPid[t.product_id] = t
  }

  const allProducts = PRODUCTS_CATALOG.filter(p => p.is_active).map(p => {
    const slug = getProductSlug(p)
    const pid  = `prod-${p.id}-0000-0000-${String(parseInt(p.id.replace('p', ''))).padStart(12, '0')}`
    return { p, slug, pid, trend: trendByPid[pid], fmcg: getProductFMCG(p) }
  })

  const withData    = allProducts.filter(x => x.trend).sort((a, b) => (b.trend!.trend_score) - (a.trend!.trend_score))
  const withoutData = allProducts.filter(x => !x.trend)

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
            <div>
              <h1 className="text-xl font-black text-gray-900 mb-0.5">
                {isAr ? '📈 مؤشرات السوق — الإمارات' : '📈 Market Trends — UAE'}
              </h1>
              <p className="text-xs text-gray-400">
                {isAr
                  ? 'Google Trends + بحث الإمارات + زياراتنا + تقييم FMCG — 4 مصادر مدمجة'
                  : 'Google Trends + UAE Search + Page Views + FMCG Score — 4 combined sources'}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {/* FMCG Only — zero quota */}
              <button onClick={() => syncAll(true)} disabled={syncing}
                className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-50 transition-colors">
                <Database className={`w-3.5 h-3.5 ${syncing && syncMode === 'fmcg' ? 'animate-pulse' : ''}`} />
                {syncing && syncMode === 'fmcg'
                  ? (isAr ? 'جاري...' : 'Running...')
                  : (isAr ? 'FMCG فقط (بدون quota)' : 'FMCG Only (no quota)')}
              </button>
              {/* Full sync — uses SerpAPI */}
              <button onClick={() => syncAll(false)} disabled={syncing}
                className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-50 transition-colors">
                <RefreshCw className={`w-3.5 h-3.5 ${syncing && syncMode === 'serp' ? 'animate-spin' : ''}`} />
                {syncing && syncMode === 'serp'
                  ? (isAr ? 'جاري المزامنة...' : 'Syncing...')
                  : (isAr ? 'مزامنة كاملة (SerpAPI)' : 'Full Sync (SerpAPI)')}
              </button>
            </div>
          </div>

          {/* Sync result */}
          {syncedProducts.length > 0 && (
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-xl text-xs">
              <span className="font-bold text-green-700">
                ✓ {isAr ? `${syncedProducts.length} منتج تمت مزامنته` : `${syncedProducts.length} products synced`}
              </span>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {syncedProducts.slice(0, 8).map(sp => (
                  <span key={sp.slug} className="bg-white border border-green-200 text-green-700 rounded-md px-2 py-0.5">
                    {sp.slug.split('-').slice(0, 2).join(' ')} — <b>{sp.score}</b>
                    <span className="text-[9px] text-green-500 ms-1">{sp.sources.split('+')[0].trim()}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="mt-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { ar: 'منتج بيانات', en: 'With Data',    val: withData.length,                                            color: 'text-orange-500' },
            { ar: 'صاعد',        en: 'Rising',        val: withData.filter(x => x.trend!.trend_direction === 'rising').length, color: 'text-green-600' },
            { ar: 'إشارة فجوة', en: 'Gap Signal',    val: withData.filter(x => x.trend!.gap_signal).length,          color: 'text-red-500' },
            { ar: 'بدون بيانات', en: 'No Data Yet',  val: withoutData.length,                                         color: 'text-gray-400' },
          ].map(s => (
            <div key={s.en} className="bg-white border border-gray-200 rounded-2xl p-4">
              <div className={`text-3xl font-black ${s.color}`}>{s.val}</div>
              <div className="text-xs text-gray-400 mt-1">{isAr ? s.ar : s.en}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-orange-400" />
            <p className="text-sm">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
          </div>
        ) : (
          <>
            {/* ── Products with data ── */}
            {withData.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                  {isAr ? 'منتجات بمؤشرات' : 'Products with trend data'} ({withData.length})
                </h2>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {withData.map(({ p, slug, trend, fmcg }) => {
                    const t = trend!
                    const dir = DIR[t.trend_direction] ?? DIR.stable
                    const DirIcon = dir.icon
                    return (
                      <div key={p.id} className={`bg-white border rounded-2xl p-4 ${t.gap_signal ? 'border-orange-300 shadow-sm shadow-orange-100' : 'border-gray-200'}`}>
                        {/* Product header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-2xl flex-shrink-0">{p.image_emoji}</span>
                            <div className="min-w-0">
                              <div className="font-bold text-gray-900 text-sm leading-tight truncate">
                                {isAr ? p.name_ar : p.name_en}
                              </div>
                              <div className="text-[10px] text-gray-400">{p.brand}</div>
                            </div>
                          </div>
                          {t.gap_signal && (
                            <span className="flex-shrink-0 text-[9px] bg-orange-100 text-orange-600 border border-orange-200 rounded-full px-2 py-0.5 font-bold ms-2">
                              ⚡ {isAr ? 'فجوة' : 'Gap'}
                            </span>
                          )}
                        </div>

                        {/* Score bar */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-gray-400">{isAr ? 'مؤشر الطلب UAE' : 'UAE Demand Index'}</span>
                            <span className="text-xs font-bold text-gray-700">{t.trend_score}/100</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${t.trend_score >= 70 ? 'bg-orange-500' : t.trend_score >= 40 ? 'bg-blue-400' : 'bg-gray-300'}`}
                              style={{ width: `${t.trend_score}%` }}
                            />
                          </div>
                        </div>

                        {/* Metrics row */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className={`border rounded-lg p-2 text-center ${dir.bg}`}>
                            <DirIcon className={`w-3.5 h-3.5 mx-auto mb-0.5 ${dir.color}`} />
                            <div className={`text-[9px] font-bold ${dir.color}`}>{isAr ? dir.ar : dir.en}</div>
                          </div>
                          <div className="border border-gray-100 bg-gray-50 rounded-lg p-2 text-center">
                            <div className="text-sm font-black text-gray-800">{t.uae_interest_pct}</div>
                            <div className="text-[9px] text-gray-400">UAE %</div>
                          </div>
                          <div className="border border-gray-100 bg-gray-50 rounded-lg p-2 text-center">
                            <div className={`text-sm font-black ${fmcg?.class === 'A' ? 'text-emerald-600' : fmcg?.class === 'B' ? 'text-blue-600' : 'text-gray-400'}`}>
                              {fmcg?.class ?? '—'}
                            </div>
                            <div className="text-[9px] text-gray-400">FMCG</div>
                          </div>
                        </div>

                        {/* Retailers */}
                        {t.retailer_mentions && t.retailer_mentions.length > 0 && (
                          <div className="mb-2">
                            <div className="text-[9px] text-gray-400 mb-1">{isAr ? 'متاح في:' : 'Found at:'}</div>
                            <div className="flex flex-wrap gap-1">
                              {t.retailer_mentions.slice(0, 3).map(r => (
                                <span key={r} className="text-[9px] bg-emerald-50 text-emerald-700 rounded px-1.5 py-0.5">{r}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Related */}
                        {t.related_queries && t.related_queries.length > 0 && (
                          <div className="mb-2">
                            <div className="text-[9px] text-gray-400 mb-1">{isAr ? 'بحث ذات صلة:' : 'Related:'}</div>
                            <div className="flex flex-wrap gap-1">
                              {t.related_queries.slice(0, 3).map(q => (
                                <span key={q} className="text-[9px] bg-blue-50 text-blue-600 rounded px-1.5 py-0.5">{q}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 mt-2">
                          {t.avg_price_aed && (
                            <span className="text-[9px] text-gray-400">{t.avg_price_aed} AED avg</span>
                          )}
                          <span className="text-[9px] text-gray-300 ms-auto">
                            {new Date(t.fetched_at).toLocaleDateString()}
                          </span>
                          <Link href={`/${locale}/products/${slug}`}
                            className="flex items-center gap-1 text-[10px] text-orange-500 hover:text-orange-600 font-semibold">
                            <Eye className="w-3 h-3" />
                          </Link>
                          <button onClick={() => syncSingle(slug)} disabled={syncingSlug === slug}
                            className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600">
                            <RefreshCw className={`w-3 h-3 ${syncingSlug === slug ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Products without data ── */}
            {withoutData.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  {isAr ? 'بدون بيانات بعد — اضغط ⚡ لمزامنة منتج واحد' : 'No data yet — tap ⚡ to sync individually'} ({withoutData.length})
                </h2>
                <div className="grid md:grid-cols-3 xl:grid-cols-4 gap-2">
                  {withoutData.map(({ p, slug }) => (
                    <div key={p.id} className="bg-white border border-dashed border-gray-200 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl flex-shrink-0">{p.image_emoji}</span>
                        <div className="text-xs font-semibold text-gray-600 truncate leading-tight">
                          {isAr ? p.name_ar : p.name_en}
                        </div>
                      </div>
                      <button onClick={() => syncSingle(slug)} disabled={syncingSlug === slug}
                        title={isAr ? 'مزامنة' : 'Sync'}
                        className="flex-shrink-0 p-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-500 ms-2">
                        {syncingSlug === slug
                          ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          : <Zap className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {withData.length === 0 && withoutData.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <Search className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="font-semibold">{isAr ? 'لا منتجات نشطة' : 'No active products'}</p>
              </div>
            )}
          </>
        )}

        {/* ── Info card ── */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <BarChart2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-blue-700 mb-2">
                {isAr ? 'كيف يُحسَب المؤشر؟ — 4 مصادر مدمجة' : 'How is the index calculated? — 4 combined sources'}
              </p>
              <div className="grid md:grid-cols-2 gap-2 text-xs text-blue-700">
                {[
                  { icon: '📊', ar: 'Google Trends (SerpAPI) 45%', en: 'Google Trends (SerpAPI) 45%', note_ar: 'اهتمام البحث في الإمارات آخر 12 شهر', note_en: 'UAE search interest last 12 months' },
                  { icon: '🔍', ar: 'إشارات بحث Google 20%', en: 'Google Search Signals 20%', note_ar: 'عدد النتائج + وجود في متاجر الإمارات', note_en: 'Result count + UAE retailer presence' },
                  { icon: '⚡', ar: 'تقييم FMCG 25%', en: 'FMCG Velocity Score 25%', note_ar: 'دوران المخزون، انتشار السوق، حجم المبيعات', note_en: 'Stock turnover, market penetration, volume' },
                  { icon: '👁', ar: 'زيارات صفحة المنتج 10%', en: 'Product Page Views 10%', note_ar: 'زياراتنا الفعلية آخر 30 يوم', note_en: 'Our own visitor data last 30 days' },
                ].map(s => (
                  <div key={s.en} className="flex items-start gap-2 bg-white rounded-xl p-2.5 border border-blue-100">
                    <span className="text-base flex-shrink-0">{s.icon}</span>
                    <div>
                      <div className="font-bold">{isAr ? s.ar : s.en}</div>
                      <div className="text-blue-500 text-[10px]">{isAr ? s.note_ar : s.note_en}</div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-blue-400 mt-2">
                {isAr
                  ? '"FMCG فقط" = صفر quota SerpAPI — استخدمها للمزامنة السريعة. "مزامنة كاملة" تستهلك ~2 calls/منتج من الـ 100/شهر.'
                  : '"FMCG Only" = zero SerpAPI quota — use for quick refresh. "Full Sync" uses ~2 calls/product of the 100/month budget.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
