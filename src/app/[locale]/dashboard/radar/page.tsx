'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  Radar, Search, BarChart3, Loader2, RefreshCw, TrendingUp, TrendingDown,
  Minus, CheckCircle2, XCircle, Activity, Sparkles, AlertTriangle, Eye,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Discovery {
  id: string; keyword: string; keyword_ar: string | null
  trend_score: number; uae_interest_pct: number; gap_score: number
  trend_direction: string | null; category_guess: string | null
  is_available_uae: boolean | null; status: string
}
interface Gap {
  id: string; alert_type: string; gap_score: number; urgency: string | null
  product_id: string; products?: { name_ar?: string; name_en?: string }
}
interface Vitals { total: number; sensed_today: number; live_pages: number }

const DIR = (d: string | null) =>
  d === 'rising' ? { Icon: TrendingUp, c: 'text-emerald-600', ar: 'صاعد' }
  : d === 'falling' ? { Icon: TrendingDown, c: 'text-red-500', ar: 'هابط' }
  : { Icon: Minus, c: 'text-slate-400', ar: 'مستقر' }

export default function RadarPage() {
  const { locale } = useParams()
  const isAr = locale === 'ar'
  const [discoveries, setDiscoveries] = useState<Discovery[]>([])
  const [gaps, setGaps] = useState<Gap[]>([])
  const [vitals, setVitals] = useState<Vitals | null>(null)
  const [loading, setLoading] = useState(true)
  const [scan, setScan] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [d, g, p] = await Promise.all([
        fetch('/api/trends/discover?status=all&limit=100', { cache: 'no-store' }).then(r => r.json()).catch(() => ({})),
        fetch('/api/market/signals?limit=50', { cache: 'no-store' }).then(r => r.json()).catch(() => []),
        fetch('/api/organism/pipeline', { cache: 'no-store' }).then(r => r.json()).catch(() => ({})),
      ])
      setDiscoveries(d.discoveries ?? [])
      setGaps(Array.isArray(g) ? g : [])
      setVitals(p.vitals ?? null)
    } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  // Full scan: run all three radar sources, then feed the organism.
  async function fullScan() {
    const steps: [string, () => Promise<unknown>][] = [
      [isAr ? 'مسح الترندات والاكتشافات…' : 'Scanning trends…', () => fetch('/api/trends/discover', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ limit: 20 }) })],
      [isAr ? 'تحليل فجوات السوق…' : 'Analyzing gaps…', () => fetch('/api/market/signals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })],
      [isAr ? 'تغذية الكائن (نبضة)…' : 'Feeding organism…', () => fetch('/api/organism/heartbeat', { cache: 'no-store' })],
    ]
    for (const [label, fn] of steps) {
      setScan(label)
      try { await fn() } catch { /* keep going */ }
    }
    setScan(isAr ? '✓ اكتمل المسح — غُذّي الكائن' : '✓ Scan complete')
    await load()
    setTimeout(() => setScan(null), 4000)
  }

  async function setStatus(id: string, status: string) {
    await fetch('/api/trends/discover', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
    setDiscoveries(prev => prev.map(x => x.id === id ? { ...x, status } : x))
  }

  const pending = discoveries.filter(d => d.status === 'pending' || d.status === 'reviewed')

  return (
    <div className="p-6 max-w-7xl mx-auto" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Radar className="w-6 h-6 text-sky-600" />
          <div>
            <h1 className="text-xl font-black text-slate-900">{isAr ? 'الرادار — الإدراك الموحّد' : 'Radar — Unified Sensing'}</h1>
            <p className="text-xs text-slate-500">{isAr ? 'ترندات + اكتشافات + فجوات → تغذّي الكائن' : 'Trends + discoveries + gaps → feed the organism'}</p>
          </div>
        </div>
        <button onClick={fullScan} disabled={!!scan}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 text-white text-sm font-bold hover:bg-sky-700 disabled:opacity-60 transition-colors">
          {scan ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}{isAr ? 'مسح شامل' : 'Full scan'}
        </button>
      </div>

      {scan && <div className="mb-4 text-xs bg-sky-50 text-sky-700 border border-sky-200 rounded-lg px-3 py-2">{scan}</div>}

      {/* Vitals */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { l: isAr ? 'اكتشافات' : 'Discoveries', v: discoveries.length, Icon: Search },
          { l: isAr ? 'قيد المراجعة' : 'Pending', v: pending.length, Icon: Eye },
          { l: isAr ? 'فجوات سوق' : 'Gap alerts', v: gaps.length, Icon: BarChart3 },
          { l: isAr ? 'فرص الكائن' : 'Opportunities', v: vitals?.total ?? 0, Icon: Activity },
          { l: isAr ? 'صفحات حيّة' : 'Live pages', v: vitals?.live_pages ?? 0, Icon: Sparkles },
        ].map((c, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4">
            <c.Icon className="w-4 h-4 text-slate-400 mb-2" />
            <div className="text-2xl font-black text-slate-900">{c.v}</div>
            <div className="text-xs text-slate-500">{c.l}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Discoveries */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2"><Search className="w-4 h-4 text-sky-500" />{isAr ? 'اكتشاف المنتجات (غير مسجّلة)' : 'Product discoveries'}</h2>
            {discoveries.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">{isAr ? 'اضغط «مسح شامل» لتوليد اكتشافات' : 'Run a full scan'}</p>
            ) : (
              <div className="space-y-2 max-h-[28rem] overflow-y-auto">
                {discoveries.map(d => {
                  const dir = DIR(d.trend_direction)
                  return (
                    <div key={d.id} className="border border-slate-100 rounded-xl p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-slate-900 truncate">{isAr ? (d.keyword_ar || d.keyword) : d.keyword}</div>
                          <div className="text-[10px] text-slate-400">{d.category_guess ?? '—'}</div>
                        </div>
                        <span className={`flex items-center gap-0.5 text-[10px] font-bold ${dir.c}`}><dir.Icon className="w-3 h-3" />{isAr ? dir.ar : d.trend_direction}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                        <span>{isAr ? 'ترند' : 'Trend'} <b className="text-slate-700">{d.trend_score}</b></span>
                        <span>{isAr ? 'فجوة' : 'Gap'} <b className="text-slate-700">{d.gap_score}</b></span>
                        <span>{isAr ? 'اهتمام' : 'Interest'} <b className="text-slate-700">{d.uae_interest_pct}%</b></span>
                        <span className={`ms-auto px-1.5 py-0.5 rounded ${d.status === 'dismissed' ? 'bg-red-50 text-red-500' : d.status === 'reviewed' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>{d.status}</span>
                      </div>
                      {(d.status === 'pending' || d.status === 'reviewed') && (
                        <div className="flex gap-1.5 mt-2">
                          <button onClick={() => setStatus(d.id, 'reviewed')} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"><CheckCircle2 className="w-3 h-3" />{isAr ? 'اعتماد' : 'Keep'}</button>
                          <button onClick={() => setStatus(d.id, 'dismissed')} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"><XCircle className="w-3 h-3" />{isAr ? 'استبعاد' : 'Dismiss'}</button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Gaps */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-amber-500" />{isAr ? 'فجوات السوق (منتجات قائمة)' : 'Market gaps'}</h2>
            {gaps.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">{isAr ? 'لا فجوات — تحتاج منتجات في الكتالوج' : 'No gaps (needs products in catalog)'}</p>
            ) : (
              <div className="space-y-2 max-h-[28rem] overflow-y-auto">
                {gaps.map(g => (
                  <div key={g.id} className="border border-slate-100 rounded-xl p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 truncate">{isAr ? (g.products?.name_ar || g.products?.name_en) : g.products?.name_en}</div>
                      <div className="text-[10px] text-slate-400">{g.alert_type}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {g.urgency && <span className="flex items-center gap-0.5 text-[10px] text-amber-600"><AlertTriangle className="w-3 h-3" />{g.urgency}</span>}
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 rounded-lg px-2 py-1">{g.gap_score}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <p className="mt-5 text-center text-[11px] text-slate-400">
        {isAr ? 'كل مسح يغذّي الكائن تلقائياً — تابع النتيجة في «حالة الكائن»' : 'Every scan feeds the organism automatically — see "Organism"'}
      </p>
    </div>
  )
}
