'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, RefreshCw, BarChart2, AlertCircle, Zap, Eye } from 'lucide-react'
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
  fetched_at: string
}

const DIR_CONFIG = {
  rising:  { icon: TrendingUp,   color: 'text-green-600',  bg: 'bg-green-50 border-green-200',  label_ar: 'صاعد',  label_en: 'Rising'  },
  stable:  { icon: Minus,        color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200',     label_ar: 'مستقر', label_en: 'Stable'  },
  falling: { icon: TrendingDown, color: 'text-red-500',    bg: 'bg-red-50 border-red-200',       label_ar: 'هابط',  label_en: 'Falling' },
}

export default function TrendsPage() {
  const params = useParams()
  const locale = params.locale as string
  const isAr = locale === 'ar'

  const [trends, setTrends] = useState<TrendRow[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ synced: number; errors: number } | null>(null)
  const [syncingSlug, setSyncingSlug] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function loadTrends() {
    setLoading(true)
    try {
      const res = await fetch('/api/trends/sync', {
        headers: { 'x-cron-secret': process.env.NEXT_PUBLIC_CRON_SECRET || 'dev' },
      })
      const data = await res.json()
      setTrends(data.trends || [])
    } catch {
      setError(isAr ? 'فشل تحميل البيانات' : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  async function syncAll() {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch('/api/trends/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': 'dev',
        },
        body: JSON.stringify({ max: 10 }), // limit to 10 in manual sync
      })
      const data = await res.json()
      setSyncResult({ synced: data.synced, errors: data.errors })
      await loadTrends()
    } catch {
      setError(isAr ? 'فشل المزامنة' : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  async function syncSingle(slug: string) {
    setSyncingSlug(slug)
    try {
      const res = await fetch(`/api/trends/${slug}`)
      const data = await res.json()
      if (data.trend_score !== undefined) {
        setTrends(prev => {
          const existing = prev.find(t => t.keyword.includes(slug.replace(/-/g, ' ')))
          if (existing) {
            return prev.map(t => t === existing ? { ...t, ...data } : t)
          }
          return [data, ...prev]
        })
      }
    } finally {
      setSyncingSlug(null)
    }
  }

  useEffect(() => { loadTrends() }, [])

  // Build product-trend map
  const productTrendMap: Record<string, TrendRow> = {}
  for (const t of trends) {
    const slug = t.keyword.replace(' UAE', '').replace(/\s+/g, '-').toLowerCase()
    productTrendMap[t.product_id] = t
  }

  const productsWithMeta = PRODUCTS_CATALOG.filter(p => p.is_active).map(p => {
    const slug = getProductSlug(p)
    const pid = `prod-${p.id}-0000-0000-${String(parseInt(p.id.replace('p', ''))).padStart(12, '0')}`
    const trend = productTrendMap[pid]
    const fmcg = getProductFMCG(p)
    return { product: p, slug, trend, fmcg }
  })

  const withTrends = productsWithMeta.filter(x => x.trend)
  const withoutTrends = productsWithMeta.filter(x => !x.trend)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 mb-1">
              {isAr ? '📈 Google Trends — الإمارات' : '📈 Google Trends — UAE'}
            </h1>
            <p className="text-sm text-gray-400">
              {isAr
                ? 'مؤشرات بحث Google لكل منتج في السوق الإماراتي — يتحدث يومياً'
                : 'Google search signals per product in UAE market — updated daily'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={syncAll} disabled={syncing}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50 transition-colors">
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing
                ? (isAr ? 'جاري التزامن...' : 'Syncing...')
                : (isAr ? 'مزامنة الكل (10)' : 'Sync All (10)')}
            </button>
          </div>
        </div>

        {syncResult && (
          <div className="max-w-6xl mx-auto mt-3 flex items-center gap-2 text-sm">
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
              ✓ {isAr ? `${syncResult.synced} منتج تم` : `${syncResult.synced} synced`}
            </span>
            {syncResult.errors > 0 && (
              <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full font-semibold">
                {syncResult.errors} {isAr ? 'خطأ' : 'errors'}
              </span>
            )}
          </div>
        )}

        {error && (
          <div className="max-w-6xl mx-auto mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 inline me-1" />{error}
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label_ar: 'منتج متتبَّع', label_en: 'Tracked', val: withTrends.length, color: 'text-orange-500' },
            { label_ar: 'اتجاه صاعد', label_en: 'Rising', val: withTrends.filter(x => x.trend?.trend_direction === 'rising').length, color: 'text-green-600' },
            { label_ar: 'إشارة فجوة', label_en: 'Gap Signal', val: withTrends.filter(x => x.trend?.gap_signal).length, color: 'text-red-500' },
            { label_ar: 'بدون بيانات', label_en: 'No Data Yet', val: withoutTrends.length, color: 'text-gray-400' },
          ].map(s => (
            <div key={s.label_en} className="bg-white border border-gray-200 rounded-2xl p-4">
              <div className={`text-3xl font-black ${s.color}`}>{s.val}</div>
              <div className="text-xs text-gray-400 mt-1">{isAr ? s.label_ar : s.label_en}</div>
            </div>
          ))}
        </div>

        {/* Products with trend data */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-orange-400" />
            <p>{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
          </div>
        ) : (
          <>
            {withTrends.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">
                  {isAr ? 'منتجات بيانات Google Trends' : 'Products with Trend Data'} ({withTrends.length})
                </h2>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {withTrends
                    .sort((a, b) => (b.trend?.trend_score || 0) - (a.trend?.trend_score || 0))
                    .map(({ product: p, slug, trend, fmcg }) => {
                      if (!trend) return null
                      const dir = DIR_CONFIG[trend.trend_direction]
                      const DirIcon = dir.icon
                      return (
                        <div key={p.id} className={`bg-white border rounded-2xl p-4 ${trend.gap_signal ? 'border-orange-300 shadow-orange-100 shadow-sm' : 'border-gray-200'}`}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{p.image_emoji}</span>
                              <div>
                                <div className="font-bold text-gray-900 text-sm leading-tight">
                                  {isAr ? p.name_ar : p.name_en}
                                </div>
                                <div className="text-xs text-gray-400">{p.brand}</div>
                              </div>
                            </div>
                            {trend.gap_signal && (
                              <span className="text-[10px] bg-orange-100 text-orange-600 border border-orange-200 rounded-full px-2 py-0.5 font-bold">
                                {isAr ? '⚡ فجوة' : '⚡ Gap'}
                              </span>
                            )}
                          </div>

                          {/* Trend score bar */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-500">{isAr ? 'مؤشر البحث UAE' : 'UAE Search Index'}</span>
                              <span className="text-xs font-bold text-gray-700">{trend.trend_score}/100</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${trend.trend_score >= 70 ? 'bg-orange-500' : trend.trend_score >= 40 ? 'bg-blue-400' : 'bg-gray-300'}`}
                                style={{ width: `${trend.trend_score}%` }}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className={`border rounded-lg p-2 text-center ${dir.bg}`}>
                              <DirIcon className={`w-3.5 h-3.5 mx-auto mb-0.5 ${dir.color}`} />
                              <div className={`text-[10px] font-bold ${dir.color}`}>{isAr ? dir.label_ar : dir.label_en}</div>
                            </div>
                            <div className="border border-gray-100 bg-gray-50 rounded-lg p-2 text-center">
                              <div className="text-base font-black text-gray-800">{trend.uae_interest_pct}</div>
                              <div className="text-[10px] text-gray-400">{isAr ? 'اهتمام UAE' : 'UAE Interest'}</div>
                            </div>
                            <div className="border border-gray-100 bg-gray-50 rounded-lg p-2 text-center">
                              <div className={`text-base font-black ${fmcg ? (fmcg.class === 'A' ? 'text-emerald-600' : fmcg.class === 'B' ? 'text-blue-600' : 'text-gray-500') : 'text-gray-300'}`}>
                                {fmcg?.class || '—'}
                              </div>
                              <div className="text-[10px] text-gray-400">FMCG</div>
                            </div>
                          </div>

                          {/* Related queries */}
                          {trend.related_queries.length > 0 && (
                            <div className="mb-3">
                              <div className="text-[10px] text-gray-400 mb-1">{isAr ? 'بحث ذات صلة:' : 'Related searches:'}</div>
                              <div className="flex flex-wrap gap-1">
                                {trend.related_queries.slice(0, 3).map(q => (
                                  <span key={q} className="text-[9px] bg-blue-50 text-blue-600 rounded-md px-1.5 py-0.5">{q}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                            <Link href={`/${locale}/products/${slug}`}
                              className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 font-semibold">
                              <Eye className="w-3.5 h-3.5" />
                              {isAr ? 'عرض' : 'View'}
                            </Link>
                            <button onClick={() => syncSingle(slug)} disabled={syncingSlug === slug}
                              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 ms-auto">
                              <RefreshCw className={`w-3 h-3 ${syncingSlug === slug ? 'animate-spin' : ''}`} />
                              {isAr ? 'تحديث' : 'Refresh'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

            {/* Products without trend data */}
            {withoutTrends.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">
                  {isAr ? 'منتجات بدون بيانات بعد' : 'Products without trend data yet'} ({withoutTrends.length})
                </h2>
                <div className="grid md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {withoutTrends.map(({ product: p, slug }) => (
                    <div key={p.id} className="bg-white border border-dashed border-gray-200 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{p.image_emoji}</span>
                        <div className="text-xs font-semibold text-gray-600 leading-tight">
                          {isAr ? p.name_ar : p.name_en}
                        </div>
                      </div>
                      <button onClick={() => syncSingle(slug)} disabled={syncingSlug === slug}
                        className="p-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-500 transition-colors">
                        {syncingSlug === slug
                          ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          : <Zap className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Info card */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <BarChart2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-bold mb-1">{isAr ? 'كيف يعمل مؤشر Trends؟' : 'How does the Trends index work?'}</p>
              <p className="text-blue-600 text-xs leading-relaxed">
                {isAr
                  ? 'مؤشر البحث 0–100 يعكس اهتمام المستخدمين في الإمارات بهذا المنتج خلال آخر 12 شهراً. 100 = أعلى نقطة. الاتجاه الصاعد يعني ارتفاع الطلب. إشارة الفجوة تظهر عندما يكون البحث مرتفعاً (>65) مع طلب متصاعد — هذه فرصة تجارية.'
                  : 'Search index 0–100 reflects UAE user interest in this product over the last 12 months. 100 = peak. Rising direction means growing demand. Gap signal appears when search is high (>65) with rising demand — this is a business opportunity.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
