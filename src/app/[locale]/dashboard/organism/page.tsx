'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  Activity, Brain, Eye, Hand, Zap, RefreshCw, Loader2, TrendingUp,
  CheckCircle2, Clock, ShieldCheck, Sparkles, Package, AlertCircle,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Opp {
  id: string
  title: string
  title_ar: string | null
  source: string
  stage: string
  composite_score: number
  quality_score: number
  trend_score: number
  is_registered: boolean
  is_available_uae: boolean | null
  published_url: string | null
  views: number
  rfq_count: number
  deals_count: number
}

interface PipelineData {
  vitals: { total: number; sensed_today: number; moved_today: number; live_pages: number; deals_won: number }
  stage_counts: Record<string, number>
  brain: {
    version: number
    weights: Record<string, number>
    approve_threshold: number
    quality_threshold: number
    daily_publish_cap: number
  }
  approved_queue: Opp[]
  scored_held: Opp[]
  fresh: Opp[]
}

// ─── Stage config ────────────────────────────────────────────────────────────

const STAGES: { key: string; ar: string; en: string; Icon: typeof Eye; color: string }[] = [
  { key: 'sensed',     ar: 'مُكتشفة',    en: 'Sensed',     Icon: Eye,         color: 'text-sky-600 bg-sky-50' },
  { key: 'scored',     ar: 'مُقيّمة',     en: 'Scored',     Icon: Brain,       color: 'text-violet-600 bg-violet-50' },
  { key: 'approved',   ar: 'مُعتمدة',     en: 'Approved',   Icon: CheckCircle2,color: 'text-amber-600 bg-amber-50' },
  { key: 'published',  ar: 'منشورة',     en: 'Published',  Icon: Sparkles,    color: 'text-emerald-600 bg-emerald-50' },
  { key: 'capturing',  ar: 'تلتقط طلباً', en: 'Capturing',  Icon: TrendingUp,  color: 'text-teal-600 bg-teal-50' },
  { key: 'converting', ar: 'قيد التحويل', en: 'Converting', Icon: Zap,         color: 'text-orange-600 bg-orange-50' },
  { key: 'won',        ar: 'ربحت',       en: 'Won',        Icon: ShieldCheck, color: 'text-green-700 bg-green-100' },
]

const SOURCE_AR: Record<string, string> = {
  radar_discovery: 'رادار — غير مسجّل',
  gap_alert: 'فجوة — مسجّل',
  product_trend: 'ترند منتج',
  manual: 'يدوي',
}

export default function OrganismPage() {
  const { locale } = useParams()
  const isAr = locale === 'ar'
  const [data, setData] = useState<PipelineData | null>(null)
  const [loading, setLoading] = useState(true)
  const [pulsing, setPulsing] = useState(false)
  const [lastBeat, setLastBeat] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/organism/pipeline', { cache: 'no-store' })
      setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 30000) // live refresh every 30s
    return () => clearInterval(t)
  }, [load])

  async function pulse() {
    setPulsing(true)
    try {
      const res = await fetch('/api/organism/heartbeat', { method: 'GET', cache: 'no-store' })
      const json = await res.json()
      setLastBeat(
        isAr
          ? `حسّ ${json.sense?.created ?? 0} · قيّم ${json.score?.scored ?? 0} · اعتمد ${json.score?.approved ?? 0}`
          : `sensed ${json.sense?.created ?? 0} · scored ${json.score?.scored ?? 0} · approved ${json.score?.approved ?? 0}`
      )
      await load()
    } finally {
      setPulsing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  const v = data?.vitals
  const sc = data?.stage_counts ?? {}

  return (
    <div className="p-6 max-w-6xl mx-auto" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Activity className="w-7 h-7 text-emerald-600" />
            <span className="absolute -top-1 -end-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">{isAr ? 'حالة الكائن' : 'Organism Vitals'}</h1>
            <p className="text-xs text-gray-500">
              {isAr ? 'الكائن ذاتي النمو — نبضٌ حيّ كل 6 ساعات' : 'Autonomous growth organism — live pulse every 6h'}
            </p>
          </div>
        </div>
        <button onClick={pulse} disabled={pulsing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-60 transition-colors">
          {pulsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {isAr ? 'نبضة الآن' : 'Pulse now'}
        </button>
      </div>

      {lastBeat && (
        <div className="mb-4 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg px-3 py-2">
          {isAr ? 'آخر نبضة: ' : 'Last beat: '}{lastBeat}
        </div>
      )}

      {/* Vitals */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label_ar: 'إجمالي الفرص', label_en: 'Total', val: v?.total ?? 0, Icon: Package },
          { label_ar: 'حُسّت اليوم', label_en: 'Sensed today', val: v?.sensed_today ?? 0, Icon: Eye },
          { label_ar: 'تحرّكت اليوم', label_en: 'Moved today', val: v?.moved_today ?? 0, Icon: Activity },
          { label_ar: 'صفحات حيّة', label_en: 'Live pages', val: v?.live_pages ?? 0, Icon: Sparkles },
          { label_ar: 'صفقات', label_en: 'Deals won', val: v?.deals_won ?? 0, Icon: ShieldCheck },
        ].map((c, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4">
            <c.Icon className="w-4 h-4 text-gray-400 mb-2" />
            <div className="text-2xl font-black text-gray-900">{c.val}</div>
            <div className="text-xs text-gray-500">{isAr ? c.label_ar : c.label_en}</div>
          </div>
        ))}
      </div>

      {/* Pipeline flow */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
        <h2 className="text-sm font-bold text-gray-700 mb-4">{isAr ? 'خط الأنابيب' : 'The Pipeline'}</h2>
        <div className="flex items-stretch gap-2 overflow-x-auto pb-2">
          {STAGES.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2 flex-shrink-0">
              <div className={`rounded-xl px-3 py-3 min-w-[88px] text-center ${s.color}`}>
                <s.Icon className="w-4 h-4 mx-auto mb-1" />
                <div className="text-xl font-black">{sc[s.key] ?? 0}</div>
                <div className="text-[10px] font-medium opacity-80">{isAr ? s.ar : s.en}</div>
              </div>
              {i < STAGES.length - 1 && (
                <div className={`text-gray-300 ${isAr ? 'rotate-180' : ''}`}>→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Brain */}
      {data?.brain && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-violet-600" />
            <h2 className="text-sm font-bold text-gray-700">
              {isAr ? `العقل — نسخة ${data.brain.version}` : `Brain — v${data.brain.version}`}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {Object.entries(data.brain.weights).map(([k, w]) => (
              <span key={k} className="text-xs bg-violet-50 text-violet-700 border border-violet-200 rounded-lg px-2.5 py-1">
                {k}: {(w * 100).toFixed(0)}%
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <span><ShieldCheck className="w-3 h-3 inline me-1" />{isAr ? 'عتبة الاعتماد' : 'Approve'}: {data.brain.approve_threshold}</span>
            <span>{isAr ? 'عتبة الجودة' : 'Quality'}: {data.brain.quality_threshold}</span>
            <span>{isAr ? 'سقف يومي' : 'Daily cap'}: {data.brain.daily_publish_cap}</span>
          </div>
        </div>
      )}

      {/* Approved queue — waiting for the hands */}
      <OppList
        isAr={isAr}
        title={isAr ? 'طابور الاعتماد — جاهزة للنشر' : 'Approved queue — ready to publish'}
        Icon={Hand}
        empty={isAr ? 'لا فرص معتمدة بعد — شغّل نبضة' : 'No approved opportunities yet — run a pulse'}
        opps={data?.approved_queue ?? []}
        accent="amber"
      />

      <div className="h-4" />

      {/* Held — below the gate */}
      <OppList
        isAr={isAr}
        title={isAr ? 'تحت العتبة — مراقبة' : 'Below the gate — watching'}
        Icon={Clock}
        empty={isAr ? 'لا شيء' : 'Nothing'}
        opps={data?.scored_held ?? []}
        accent="gray"
      />
    </div>
  )
}

// ─── Opportunity list ────────────────────────────────────────────────────────

function OppList({ isAr, title, Icon, empty, opps, accent }: {
  isAr: boolean; title: string; Icon: typeof Eye; empty: string; opps: Opp[]; accent: 'amber' | 'gray'
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${accent === 'amber' ? 'text-amber-600' : 'text-gray-400'}`} />
        <h2 className="text-sm font-bold text-gray-700">{title}</h2>
        <span className="text-xs text-gray-400">({opps.length})</span>
      </div>
      {opps.length === 0 ? (
        <p className="text-xs text-gray-400 py-4 text-center flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />{empty}
        </p>
      ) : (
        <div className="space-y-2">
          {opps.map(o => (
            <div key={o.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {isAr ? (o.title_ar || o.title) : o.title}
                </div>
                <div className="text-[11px] text-gray-400">{SOURCE_AR[o.source] ?? o.source}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-bold text-gray-700 bg-gray-100 rounded-lg px-2 py-1">
                  {o.composite_score}
                </span>
                <span className="text-[10px] text-gray-400">Q{o.quality_score}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
