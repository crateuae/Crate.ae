'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search, TrendingUp, TrendingDown, Minus, AlertCircle,
  CheckCircle2, XCircle, RefreshCw, Sparkles, ExternalLink,
  Filter, ChevronDown, Eye, Plus, Trash2, BarChart3, Globe,
} from 'lucide-react'
import { useParams } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Discovery {
  id: string
  keyword: string
  keyword_ar: string | null
  trend_score: number
  uae_interest_pct: number
  trend_direction: 'rising' | 'stable' | 'falling'
  category_guess: string | null
  gap_score: number
  is_available_uae: boolean | null
  status: 'pending' | 'reviewed' | 'added' | 'dismissed'
  notes: string | null
  source_label: string | null
  related_queries: string[] | null
  retailer_mentions: string[] | null
  avg_price_aed: number | null
  discovered_at: string
}

interface ScanResult {
  new_discoveries: number
  inserted: number
  scanned: number
  top_opportunities: { keyword: string; gap_score: number; trend_direction: string }[]
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending:   { label_ar: 'جديد',            label_en: 'New',       cls: 'bg-orange-100 text-orange-700 border-orange-200',  dot: 'bg-orange-400' },
  reviewed:  { label_ar: 'تمت المراجعة',    label_en: 'Reviewed',  cls: 'bg-blue-100 text-blue-700 border-blue-200',         dot: 'bg-blue-400' },
  added:     { label_ar: 'في الكتالوج',     label_en: 'Added',     cls: 'bg-green-100 text-green-700 border-green-200',      dot: 'bg-green-400' },
  dismissed: { label_ar: 'مُستبعد',         label_en: 'Dismissed', cls: 'bg-gray-100 text-gray-500 border-gray-200',         dot: 'bg-gray-300' },
} as const

const DIR_CONFIG = {
  rising:  { icon: TrendingUp,   color: 'text-green-600', bg: 'bg-green-50',  label_ar: 'صاعد',  label_en: 'Rising'  },
  stable:  { icon: Minus,        color: 'text-gray-500',  bg: 'bg-gray-50',   label_ar: 'مستقر', label_en: 'Stable'  },
  falling: { icon: TrendingDown, color: 'text-red-500',   bg: 'bg-red-50',    label_ar: 'هابط',  label_en: 'Falling' },
}

const SORT_OPTIONS = [
  { val: 'gap_score',        label_ar: 'درجة الفجوة',   label_en: 'Gap Score' },
  { val: 'trend_score',      label_ar: 'درجة الترند',   label_en: 'Trend Score' },
  { val: 'discovered_at',    label_ar: 'الأحدث',        label_en: 'Newest' },
  { val: 'uae_interest_pct', label_ar: 'الاهتمام UAE',  label_en: 'UAE Interest' },
]

function GapBar({ score }: { score: number }) {
  const color = score >= 75 ? 'bg-red-500' : score >= 55 ? 'bg-orange-500' : 'bg-blue-400'
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
      <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${score}%` }} />
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DiscoverPage() {
  const params = useParams()
  const locale = params.locale as string
  const isAr = locale === 'ar'

  const [discoveries, setDiscoveries]       = useState<Discovery[]>([])
  const [loading, setLoading]               = useState(true)
  const [scanning, setScanning]             = useState(false)
  const [statusFilter, setStatusFilter]     = useState<string>('all')
  const [catFilter, setCatFilter]           = useState<string>('all')
  const [sortBy, setSortBy]                 = useState('gap_score')
  const [scanResult, setScanResult]         = useState<ScanResult | null>(null)
  const [error, setError]                   = useState<string | null>(null)
  const [expandedId, setExpandedId]         = useState<string | null>(null)
  const [updatingId, setUpdatingId]         = useState<string | null>(null)

  // Derived
  const categories = Array.from(new Set(discoveries.map(d => d.category_guess).filter(Boolean))) as string[]

  const filtered = discoveries
    .filter(d => statusFilter === 'all' || d.status === statusFilter)
    .filter(d => catFilter === 'all' || d.category_guess === catFilter)
    .sort((a, b) => {
      if (sortBy === 'gap_score') return b.gap_score - a.gap_score
      if (sortBy === 'trend_score') return b.trend_score - a.trend_score
      if (sortBy === 'uae_interest_pct') return b.uae_interest_pct - a.uae_interest_pct
      return new Date(b.discovered_at).getTime() - new Date(a.discovered_at).getTime()
    })

  const stats = {
    total:    discoveries.length,
    pending:  discoveries.filter(d => d.status === 'pending').length,
    highGap:  discoveries.filter(d => d.gap_score >= 70).length,
    rising:   discoveries.filter(d => d.trend_direction === 'rising').length,
  }

  const loadDiscoveries = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/trends/discover?status=all&limit=100')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setDiscoveries(data.discoveries || [])
    } catch (e) {
      setError(isAr ? 'فشل في تحميل الاكتشافات' : 'Failed to load discoveries')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [isAr])

  async function startScan() {
    setScanning(true)
    setScanResult(null)
    setError(null)
    try {
      const res = await fetch('/api/trends/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-cron-secret': 'dev' },
        body: JSON.stringify({ limit: 20 }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      const data: ScanResult = await res.json()
      setScanResult(data)
      await loadDiscoveries()
    } catch (e: unknown) {
      setError(isAr ? `فشل المسح: ${(e as Error).message}` : `Scan failed: ${(e as Error).message}`)
    } finally {
      setScanning(false)
    }
  }

  async function updateStatus(id: string, status: Discovery['status']) {
    setUpdatingId(id)
    try {
      const res = await fetch('/api/trends/discover', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) {
        setDiscoveries(prev => prev.map(d => d.id === id ? { ...d, status } : d))
        if (expandedId === id && (status === 'dismissed' || status === 'added')) {
          setExpandedId(null)
        }
      }
    } finally {
      setUpdatingId(null)
    }
  }

  useEffect(() => { loadDiscoveries() }, [loadDiscoveries])

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <span className="text-2xl">🔍</span>
              {isAr ? 'اكتشاف المنتجات' : 'Product Discovery'}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {isAr
                ? 'كلمات بحث ترند في الإمارات بدون منتج في الكتالوج — فرص تجارية حقيقية'
                : 'UAE trending keywords with no catalog match — real business gaps'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadDiscoveries} disabled={loading}
              className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-40">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={startScan} disabled={scanning || loading}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 shadow-sm hover:shadow-md transition-all">
              <Sparkles className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
              {scanning
                ? (isAr ? 'جاري المسح...' : 'Scanning...')
                : (isAr ? 'مسح UAE Trends' : 'Scan UAE Trends')}
            </button>
          </div>
        </div>

        {/* Scan result banner */}
        {scanResult && (
          <div className="max-w-7xl mx-auto mt-3 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 flex-wrap">
            <span className="text-green-700 font-bold text-sm">
              ✅ {isAr
                ? `تم مسح ${scanResult.scanned} كلمة — ${scanResult.inserted} اكتشاف جديد`
                : `Scanned ${scanResult.scanned} keywords — ${scanResult.inserted} new discoveries`}
            </span>
            {scanResult.top_opportunities.slice(0, 4).map(o => (
              <span key={o.keyword} className="flex items-center gap-1 bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                {o.trend_direction === 'rising' && <TrendingUp className="w-3 h-3" />}
                {o.keyword.replace(' UAE', '')} <span className="text-orange-400">({o.gap_score})</span>
              </span>
            ))}
          </div>
        )}

        {error && (
          <div className="max-w-7xl mx-auto mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { val: stats.total,   label_ar: 'إجمالي الاكتشافات',  label_en: 'Total',        color: 'text-gray-900',   icon: '🗂️' },
            { val: stats.pending, label_ar: 'قيد المراجعة',        label_en: 'Pending',      color: 'text-orange-500', icon: '⏳' },
            { val: stats.highGap, label_ar: 'فجوة عالية (70+)',    label_en: 'High Gap 70+', color: 'text-red-600',    icon: '🎯' },
            { val: stats.rising,  label_ar: 'اتجاه صاعد',          label_en: 'Rising Trend', color: 'text-green-600',  icon: '📈' },
          ].map(s => (
            <div key={s.label_en} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <div className={`text-2xl font-black ${s.color}`}>{s.val}</div>
                <div className="text-xs text-gray-400">{isAr ? s.label_ar : s.label_en}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filters & Sort ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />

          {/* Status chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${statusFilter === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'text-gray-500 border-gray-200 hover:border-gray-400'}`}>
              {isAr ? 'الكل' : 'All'} ({discoveries.length})
            </button>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
              const count = discoveries.filter(d => d.status === key).length
              if (count === 0) return null
              return (
                <button key={key} onClick={() => setStatusFilter(key)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                    statusFilter === key ? `${cfg.cls} border-current` : 'text-gray-500 border-gray-200 hover:border-gray-400'
                  }`}>
                  {isAr ? cfg.label_ar : cfg.label_en} ({count})
                </button>
              )
            })}
          </div>

          <div className="h-5 w-px bg-gray-200 hidden md:block" />

          {/* Category filter */}
          {categories.length > 0 && (
            <div className="relative">
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-lg ps-3 pe-7 py-1 text-xs text-gray-600 focus:outline-none focus:border-orange-300 cursor-pointer">
                <option value="all">{isAr ? 'كل التصنيفات' : 'All Categories'}</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute end-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
          )}

          {/* Sort */}
          <div className="ms-auto flex items-center gap-1.5">
            <span className="text-xs text-gray-400">{isAr ? 'ترتيب:' : 'Sort:'}</span>
            <div className="relative">
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-lg ps-3 pe-7 py-1 text-xs text-gray-600 focus:outline-none focus:border-orange-300 cursor-pointer">
                {SORT_OPTIONS.map(o => (
                  <option key={o.val} value={o.val}>{isAr ? o.label_ar : o.label_en}</option>
                ))}
              </select>
              <ChevronDown className="absolute end-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ── List ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-orange-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-16 text-center">
            <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-semibold">
              {isAr ? 'لا توجد اكتشافات بهذا الفلتر' : 'No discoveries match this filter'}
            </p>
            <p className="text-gray-300 text-xs mt-1">
              {isAr ? 'جرّب "مسح UAE Trends" لاكتشاف منتجات جديدة' : 'Try "Scan UAE Trends" to find new products'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(disc => {
              const sc  = STATUS_CONFIG[disc.status]
              const dir = DIR_CONFIG[disc.trend_direction]
              const DirIcon = dir.icon
              const isExpanded = expandedId === disc.id
              const isUpdating = updatingId === disc.id
              const isHighGap = disc.gap_score >= 70

              return (
                <div key={disc.id}
                  className={`bg-white rounded-2xl border transition-all hover:shadow-md ${
                    isHighGap ? 'border-orange-300 shadow-orange-50 shadow-sm' : 'border-gray-200'
                  } ${disc.status === 'dismissed' ? 'opacity-50' : ''}`}>

                  {/* Card header */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1 me-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isHighGap && <span className="text-[10px] font-black text-orange-500">🎯</span>}
                          <span className="font-bold text-gray-900 text-sm leading-tight">
                            {disc.keyword.replace(' UAE', '')}
                          </span>
                          {disc.trend_direction === 'rising' && (
                            <TrendingUp className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                        {disc.keyword_ar && (
                          <div className="text-xs text-gray-400 mt-0.5" dir="rtl">{disc.keyword_ar.replace(' الإمارات', '')}</div>
                        )}
                      </div>
                      <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.cls}`}>
                        {isAr ? sc.label_ar : sc.label_en}
                      </span>
                    </div>

                    {/* Category tag */}
                    {disc.category_guess && (
                      <div className="text-[10px] bg-purple-50 text-purple-600 border border-purple-100 rounded-md px-2 py-0.5 inline-block mb-3 font-semibold">
                        {disc.category_guess}
                      </div>
                    )}

                    {/* Scores grid */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-gray-50 rounded-xl p-2 text-center">
                        <div className={`text-base font-black ${disc.trend_score >= 70 ? 'text-orange-500' : disc.trend_score >= 45 ? 'text-blue-500' : 'text-gray-400'}`}>
                          {disc.trend_score}
                        </div>
                        <div className="text-[9px] text-gray-400 mt-0.5">Trend</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-2 text-center">
                        <div className="text-base font-black text-gray-700">{disc.uae_interest_pct}%</div>
                        <div className="text-[9px] text-gray-400 mt-0.5">UAE</div>
                      </div>
                      <div className={`rounded-xl p-2 text-center ${isHighGap ? 'bg-orange-50' : 'bg-gray-50'}`}>
                        <div className={`text-base font-black ${isHighGap ? 'text-orange-600' : 'text-gray-600'}`}>
                          {disc.gap_score}
                        </div>
                        <div className="text-[9px] text-gray-400 mt-0.5">{isAr ? 'فجوة' : 'Gap'}</div>
                      </div>
                    </div>
                    <GapBar score={disc.gap_score} />

                    {/* Direction + availability */}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${dir.bg} ${dir.color}`}>
                        <DirIcon className="w-3 h-3" />
                        {isAr ? dir.label_ar : dir.label_en}
                      </span>
                      {disc.is_available_uae === false && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" />
                          {isAr ? 'غير متوفر UAE ⚡' : 'Not in UAE ⚡'}
                        </span>
                      )}
                      {disc.is_available_uae === true && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-green-600">
                          <CheckCircle2 className="w-3 h-3" />
                          {isAr ? 'متوفر' : 'Available'}
                        </span>
                      )}
                      {disc.avg_price_aed && (
                        <span className="ms-auto text-[10px] text-gray-400 font-medium">
                          ~{disc.avg_price_aed} AED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (disc.related_queries?.length || disc.retailer_mentions?.length || disc.notes) && (
                    <div className="border-t border-gray-100 px-4 py-3 space-y-2">
                      {disc.related_queries && disc.related_queries.length > 0 && (
                        <div>
                          <div className="text-[10px] text-gray-400 font-semibold mb-1.5">
                            {isAr ? 'بحثات مرتبطة:' : 'Related searches:'}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {disc.related_queries.slice(0, 5).map(q => (
                              <span key={q} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">{q}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {disc.retailer_mentions && disc.retailer_mentions.length > 0 && (
                        <div>
                          <div className="text-[10px] text-gray-400 font-semibold mb-1.5">
                            <Globe className="w-3 h-3 inline me-1" />
                            {isAr ? 'متاجر تذكره:' : 'Retailer mentions:'}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {disc.retailer_mentions.map(r => (
                              <span key={r} className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-md">{r}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {disc.source_label && (
                        <div className="text-[10px] text-gray-300 flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" />
                          {disc.source_label}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action bar */}
                  <div className="border-t border-gray-100 px-4 py-2.5 flex items-center gap-2">
                    <a href={`https://trends.google.com/trends/explore?q=${encodeURIComponent(disc.keyword)}&geo=AE`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-600 font-semibold">
                      <ExternalLink className="w-3 h-3" />
                      Trends
                    </a>
                    <a href={`https://www.google.com/search?q=${encodeURIComponent(disc.keyword + ' UAE price')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600">
                      <Search className="w-3 h-3" />
                      Search
                    </a>

                    {/* Expand toggle */}
                    {(disc.related_queries?.length || disc.retailer_mentions?.length) ? (
                      <button onClick={() => setExpandedId(isExpanded ? null : disc.id)}
                        className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600">
                        <Eye className="w-3 h-3" />
                        {isExpanded ? (isAr ? 'أقل' : 'Less') : (isAr ? 'تفاصيل' : 'More')}
                      </button>
                    ) : null}

                    {/* Status actions */}
                    <div className="ms-auto flex items-center gap-1.5">
                      {isUpdating ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-gray-400" />
                      ) : (
                        <>
                          {disc.status === 'pending' && (
                            <>
                              <button onClick={() => updateStatus(disc.id, 'reviewed')}
                                className="text-[11px] text-blue-600 hover:text-blue-700 font-bold px-2.5 py-1 bg-blue-50 rounded-lg transition-colors">
                                {isAr ? 'راجع' : 'Review'}
                              </button>
                              <button onClick={() => updateStatus(disc.id, 'dismissed')}
                                className="text-[11px] text-gray-400 hover:text-gray-600 px-2 py-1 bg-gray-50 rounded-lg transition-colors">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                          {disc.status === 'reviewed' && (
                            <>
                              <button onClick={() => updateStatus(disc.id, 'added')}
                                className="flex items-center gap-1 text-[11px] text-green-700 font-bold px-2.5 py-1 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                                <Plus className="w-3 h-3" />
                                {isAr ? 'للكتالوج' : 'Add'}
                              </button>
                              <button onClick={() => updateStatus(disc.id, 'dismissed')}
                                className="text-[11px] text-gray-400 hover:text-gray-600 px-2 py-1 bg-gray-50 rounded-lg transition-colors">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                          {disc.status === 'added' && (
                            <span className="flex items-center gap-1 text-[11px] text-green-600 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {isAr ? 'مضاف' : 'Added'}
                            </span>
                          )}
                          {disc.status === 'dismissed' && (
                            <button onClick={() => updateStatus(disc.id, 'pending')}
                              className="text-[11px] text-gray-400 hover:text-orange-500 transition-colors">
                              {isAr ? 'استعادة' : 'Restore'}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── How it works ── */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-5">
          <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4" />
            {isAr ? 'كيف يعمل محرك الاكتشاف؟' : 'How does the discovery engine work?'}
          </h3>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { num: '01', title_ar: 'مسح الكلمات', title_en: 'Keyword Scan', desc_ar: '30+ كلمة FMCG عبر Google Trends UAE', desc_en: '30+ FMCG keywords via Google Trends UAE' },
              { num: '02', title_ar: 'فلترة الكتالوج', title_en: 'Catalog Filter', desc_ar: 'يستبعد المنتجات الموجودة في قاعدة البيانات', desc_en: 'Excludes keywords already in the catalog' },
              { num: '03', title_ar: 'تحليل السوق', title_en: 'Market Analysis', desc_ar: 'SerpAPI + UAE retailers + FMCG scoring', desc_en: 'SerpAPI + UAE retailers + FMCG scoring' },
              { num: '04', title_ar: 'درجة الفجوة', title_en: 'Gap Score', desc_ar: 'Trend×50% + UAE×30% + Direction×20%', desc_en: 'Trend×50% + UAE Int.×30% + Direction×20%' },
            ].map(step => (
              <div key={step.num} className="flex gap-3">
                <span className="text-purple-300 font-black text-lg leading-none flex-shrink-0">{step.num}</span>
                <div>
                  <div className="font-semibold text-purple-800 text-xs mb-0.5">{isAr ? step.title_ar : step.title_en}</div>
                  <div className="text-purple-600 text-[11px] leading-relaxed">{isAr ? step.desc_ar : step.desc_en}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
