'use client'

import { useState, useEffect } from 'react'
import { Search, TrendingUp, AlertCircle, CheckCircle2, XCircle, RefreshCw, Sparkles, ExternalLink } from 'lucide-react'
import { useParams } from 'next/navigation'

interface Discovery {
  id: string
  keyword: string
  keyword_ar: string | null
  trend_score: number
  uae_interest_pct: number
  trend_direction: 'rising' | 'stable' | 'falling'
  category_guess: string
  gap_score: number
  is_available_uae: boolean | null
  status: 'pending' | 'reviewed' | 'added' | 'dismissed'
  discovered_at: string
}

const STATUS_CONFIG = {
  pending:   { label_ar: 'جديد', label_en: 'New', cls: 'bg-orange-100 text-orange-600' },
  reviewed:  { label_ar: 'تمت المراجعة', label_en: 'Reviewed', cls: 'bg-blue-100 text-blue-600' },
  added:     { label_ar: 'مضاف للكتالوج', label_en: 'Added', cls: 'bg-green-100 text-green-700' },
  dismissed: { label_ar: 'مُرفض', label_en: 'Dismissed', cls: 'bg-gray-100 text-gray-400' },
}

const DIR_LABEL = {
  rising:  { ar: '📈 صاعد', en: '📈 Rising' },
  stable:  { ar: '➡️ مستقر', en: '➡️ Stable' },
  falling: { ar: '📉 هابط', en: '📉 Falling' },
}

export default function DiscoverPage() {
  const params = useParams()
  const locale = params.locale as string
  const isAr = locale === 'ar'

  const [discoveries, setDiscoveries] = useState<Discovery[]>([])
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [scanResult, setScanResult] = useState<{ new_discoveries: number; top_opportunities: unknown[] } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function loadDiscoveries() {
    setLoading(true)
    try {
      const res = await fetch(`/api/trends/discover?status=${statusFilter}&limit=50`)
      const data = await res.json()
      setDiscoveries(data.discoveries || [])
    } catch {
      setError(isAr ? 'فشل التحميل' : 'Load failed')
    } finally {
      setLoading(false)
    }
  }

  async function startScan() {
    setScanning(true)
    setScanResult(null)
    try {
      const res = await fetch('/api/trends/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-cron-secret': 'dev' },
        body: JSON.stringify({ limit: 15 }),
      })
      const data = await res.json()
      setScanResult(data)
      await loadDiscoveries()
    } catch {
      setError(isAr ? 'فشل المسح' : 'Scan failed')
    } finally {
      setScanning(false)
    }
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/market/signals`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, table: 'trend_discoveries', status }),
    })
    if (res.ok) {
      setDiscoveries(prev => prev.map(d => d.id === id ? { ...d, status: status as Discovery['status'] } : d))
    }
  }

  useEffect(() => { loadDiscoveries() }, [statusFilter])

  const pendingCount = discoveries.filter(d => d.status === 'pending').length
  const highGapCount = discoveries.filter(d => d.gap_score >= 70).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 mb-1">
              {isAr ? '🔍 اكتشاف منتجات جديدة' : '🔍 Product Discovery'}
            </h1>
            <p className="text-sm text-gray-400">
              {isAr
                ? 'كلمات بحث ترند في الإمارات لا يوجد لها منتج في الكتالوج — فرص تجارية محتملة'
                : 'UAE trending search keywords with no matching product in catalog — potential business opportunities'}
            </p>
          </div>
          <button onClick={startScan} disabled={scanning}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 shadow-sm hover:shadow-md transition-all">
            <Sparkles className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
            {scanning
              ? (isAr ? 'جاري المسح...' : 'Scanning...')
              : (isAr ? 'مسح UAE Trends' : 'Scan UAE Trends')}
          </button>
        </div>

        {scanResult && (
          <div className="max-w-6xl mx-auto mt-3 flex items-center gap-3 flex-wrap">
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
              🎯 {isAr ? `${scanResult.new_discoveries} اكتشاف جديد` : `${scanResult.new_discoveries} new discoveries`}
            </span>
            {(scanResult.top_opportunities as { keyword: string; gap_score: number }[]).slice(0, 3).map((o) => (
              <span key={o.keyword} className="bg-orange-50 text-orange-600 border border-orange-200 px-3 py-1 rounded-full text-xs font-semibold">
                {o.keyword} ({o.gap_score})
              </span>
            ))}
          </div>
        )}

        {error && (
          <div className="max-w-6xl mx-auto mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 inline me-1" />{error}
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { val: discoveries.length, label_ar: 'إجمالي الاكتشافات', label_en: 'Total Discoveries', color: 'text-gray-900' },
            { val: pendingCount, label_ar: 'قيد المراجعة', label_en: 'Pending Review', color: 'text-orange-500' },
            { val: highGapCount, label_ar: 'فجوة عالية (70+)', label_en: 'High Gap (70+)', color: 'text-red-600' },
            { val: discoveries.filter(d => d.trend_direction === 'rising').length, label_ar: 'اتجاه صاعد', label_en: 'Rising Trend', color: 'text-green-600' },
          ].map(s => (
            <div key={s.label_en} className="bg-white border border-gray-200 rounded-2xl p-4">
              <div className={`text-3xl font-black ${s.color}`}>{s.val}</div>
              <div className="text-xs text-gray-400 mt-1">{isAr ? s.label_ar : s.label_en}</div>
            </div>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <button key={key} onClick={() => setStatusFilter(key)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                statusFilter === key ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-orange-300'}`}>
              {isAr ? cfg.label_ar : cfg.label_en}
            </button>
          ))}
        </div>

        {/* Discoveries list */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-orange-400" />
          </div>
        ) : discoveries.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-16 text-center">
            <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              {isAr ? 'لا توجد اكتشافات. اضغط "مسح UAE Trends" لبدء الفحص.' : 'No discoveries yet. Click "Scan UAE Trends" to start.'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {discoveries.map(disc => {
              const sc = STATUS_CONFIG[disc.status]
              const dir = DIR_LABEL[disc.trend_direction]
              return (
                <div key={disc.id} className={`bg-white border rounded-2xl p-4 hover:shadow-md transition-all ${
                  disc.gap_score >= 70 ? 'border-orange-300' : 'border-gray-200'
                }`}>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-gray-900 text-sm">{disc.keyword}</span>
                        {disc.trend_direction === 'rising' && (
                          <TrendingUp className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                      {disc.keyword_ar && (
                        <div className="text-xs text-gray-400 mt-0.5">{disc.keyword_ar}</div>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.cls}`}>
                      {isAr ? sc.label_ar : sc.label_en}
                    </span>
                  </div>

                  {/* Category */}
                  <div className="text-[10px] bg-purple-50 text-purple-600 rounded-md px-2 py-0.5 inline-block mb-3 font-medium">
                    {disc.category_guess}
                  </div>

                  {/* Scores */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-2 text-center">
                      <div className={`text-lg font-black ${disc.trend_score >= 70 ? 'text-orange-500' : disc.trend_score >= 40 ? 'text-blue-500' : 'text-gray-400'}`}>
                        {disc.trend_score}
                      </div>
                      <div className="text-[9px] text-gray-400">{isAr ? 'Trends' : 'Trend'}</div>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-2 text-center">
                      <div className="text-lg font-black text-gray-700">{disc.uae_interest_pct}</div>
                      <div className="text-[9px] text-gray-400">{isAr ? 'UAE' : 'UAE Int.'}</div>
                    </div>
                    <div className={`border rounded-xl p-2 text-center ${disc.gap_score >= 70 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-100'}`}>
                      <div className={`text-lg font-black ${disc.gap_score >= 70 ? 'text-orange-600' : 'text-gray-600'}`}>
                        {disc.gap_score}
                      </div>
                      <div className="text-[9px] text-gray-400">{isAr ? 'فجوة' : 'Gap'}</div>
                    </div>
                  </div>

                  {/* Trend direction + availability */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="text-xs text-gray-500">{isAr ? dir.ar : dir.en}</span>
                    {disc.is_available_uae !== null && (
                      <span className={`flex items-center gap-1 text-[10px] font-semibold ${disc.is_available_uae ? 'text-green-600' : 'text-red-500'}`}>
                        {disc.is_available_uae
                          ? <><CheckCircle2 className="w-3 h-3" />{isAr ? 'متوفر UAE' : 'Available UAE'}</>
                          : <><XCircle className="w-3 h-3" />{isAr ? 'غير متوفر UAE ⚡' : 'Not in UAE ⚡'}</>}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <a href={`https://trends.google.com/trends/explore?q=${encodeURIComponent(disc.keyword)}&geo=AE`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 font-semibold">
                      <ExternalLink className="w-3 h-3" />
                      Trends
                    </a>
                    {disc.status === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(disc.id, 'reviewed')}
                          className="ms-auto text-xs text-blue-600 hover:text-blue-700 font-semibold px-2.5 py-1 bg-blue-50 rounded-lg">
                          {isAr ? 'مراجعة' : 'Review'}
                        </button>
                        <button onClick={() => updateStatus(disc.id, 'dismissed')}
                          className="text-xs text-gray-400 hover:text-gray-600 font-semibold px-2.5 py-1 bg-gray-50 rounded-lg">
                          {isAr ? 'رفض' : 'Dismiss'}
                        </button>
                      </>
                    )}
                    {disc.status === 'reviewed' && (
                      <button onClick={() => updateStatus(disc.id, 'added')}
                        className="ms-auto text-xs text-green-600 hover:text-green-700 font-semibold px-2.5 py-1 bg-green-50 rounded-lg flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {isAr ? 'أضف للكتالوج' : 'Add to Catalog'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* How it works */}
        <div className="mt-8 bg-purple-50 border border-purple-200 rounded-2xl p-5">
          <h3 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            {isAr ? 'كيف يعمل نظام الاكتشاف؟' : 'How does discovery work?'}
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-purple-700">
            <div>
              <div className="font-semibold mb-1">1. {isAr ? 'مسح الكلمات' : 'Keyword Scan'}</div>
              <div className="text-xs text-purple-600">{isAr ? 'يبحث في 30+ كلمة مفتاحية FMCG في الإمارات' : 'Scans 30+ UAE FMCG keywords via Google Trends'}</div>
            </div>
            <div>
              <div className="font-semibold mb-1">2. {isAr ? 'فلترة الموجود' : 'Filter Existing'}</div>
              <div className="text-xs text-purple-600">{isAr ? 'يزيل الكلمات التي لها منتج في الكتالوج' : 'Removes keywords already matched in catalog'}</div>
            </div>
            <div>
              <div className="font-semibold mb-1">3. {isAr ? 'تقييم الفجوة' : 'Gap Scoring'}</div>
              <div className="text-xs text-purple-600">{isAr ? 'يحسب درجة الفرصة: Trend(50%) + UAE Interest(30%) + Direction(20%)' : 'Scores opportunity: Trend(50%) + UAE Interest(30%) + Direction(20%)'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
