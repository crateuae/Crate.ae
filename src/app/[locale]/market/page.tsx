'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { TrendingUp, TrendingDown, AlertTriangle, Zap, ArrowUpRight, Activity } from 'lucide-react'
import Link from 'next/link'

const ALERT_CONFIG = {
  shortage:     { icon: AlertTriangle, color: 'text-red-600',   bg: 'bg-red-50 border-red-200',   topBar: 'border-t-red-500',   label_ar: 'نقص في العرض',    label_en: 'Supply Shortage' },
  arbitrage:    { icon: Zap,           color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', topBar: 'border-t-amber-500', label_ar: 'فرصة مراجحة',    label_en: 'Price Opportunity' },
  trend_rising: { icon: TrendingUp,    color: 'text-green-600', bg: 'bg-white border-gray-200',    topBar: 'border-t-green-500', label_ar: 'طلب متصاعد',     label_en: 'Rising Demand' },
  trend_falling:{ icon: TrendingDown,  color: 'text-blue-600',  bg: 'bg-white border-gray-200',    topBar: 'border-t-blue-500',  label_ar: 'تراجع في الطلب', label_en: 'Demand Cooling' },
  balanced:     { icon: Activity,      color: 'text-gray-500',  bg: 'bg-white border-gray-200',    topBar: 'border-t-gray-400',  label_ar: 'سوق متوازن',     label_en: 'Stable Market' },
}

const URGENCY = {
  high:   { label_ar: 'فرصة عاجلة', label_en: 'Urgent',  cls: 'bg-red-100 text-red-700' },
  medium: { label_ar: 'مراقبة',     label_en: 'Watch',   cls: 'bg-amber-100 text-amber-700' },
  low:    { label_ar: 'استثمار',    label_en: 'Consider', cls: 'bg-gray-100 text-gray-500' },
}

type AlertType = keyof typeof ALERT_CONFIG
type UrgencyType = keyof typeof URGENCY

interface MarketAlert {
  id: string
  alert_type: AlertType
  urgency: UrgencyType
  demand_score: number
  supply_score: number
  gap_score: number
  details_ar: string
  details_en: string
  recommended_action_ar: string
  recommended_action_en: string
  detected_at: string
  category_ar?: string
  products: { name_ar: string; name_en: string; slug: string; images: string[] }
}

type FilterKey = 'all' | 'shortage' | 'trend_rising' | 'arbitrage' | 'urgent'

const FILTERS: { key: FilterKey; ar: string; en: string }[] = [
  { key: 'all',          ar: 'كل الإشارات',   en: 'All Signals' },
  { key: 'shortage',     ar: '🔴 نقص العرض',  en: '🔴 Shortage' },
  { key: 'trend_rising', ar: '🟢 طلب صاعد',   en: '🟢 Rising Demand' },
  { key: 'arbitrage',    ar: '🟡 مراجحة',      en: '🟡 Price Gap' },
  { key: 'urgent',       ar: '⚡ عاجل فقط',   en: '⚡ Urgent Only' },
]

export default function MarketPage() {
  const { locale } = useParams()
  const isAr = locale === 'ar'
  const [alerts, setAlerts] = useState<MarketAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')

  useEffect(() => {
    fetch('/api/market/signals?limit=50').then(r => r.json()).then(data => {
      setAlerts(Array.isArray(data) ? data : [])
    }).catch(() => setAlerts([])).finally(() => setLoading(false))
  }, [])

  const filtered = alerts.filter(a => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'urgent') return a.urgency === 'high'
    return a.alert_type === activeFilter
  })

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="max-w-6xl mx-auto">

        {/* Header — marketing copy */}
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
              {isAr
                ? 'اكتشف منتجات يبحث عنها السوق الآن'
                : 'Products the UAE Market is Looking For — Right Now'}
            </h1>
            <p className="text-gray-500 text-sm max-w-xl leading-relaxed">
              {isAr
                ? 'إشارات حيّة من البيانات الميدانية: منتجات تشهد طلباً متصاعداً، فجوات عرض حقيقية، وفرص استيراد لم يدخلها أحد بعد في السوق الإماراتي.'
                : 'Live signals from field data: products with rising demand, real supply gaps, and import opportunities not yet tapped in the UAE market.'}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-4 py-2 flex-shrink-0">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            <span className="text-orange-600 text-sm font-semibold">
              {alerts.length} {isAr ? 'إشارة نشطة' : 'live signals'}
            </span>
          </div>
        </div>

        {/* Filter chips — now interactive */}
        <div className="flex gap-2 flex-wrap mb-6">
          {FILTERS.map(f => {
            const count = f.key === 'all' ? alerts.length
              : f.key === 'urgent' ? alerts.filter(a => a.urgency === 'high').length
              : alerts.filter(a => a.alert_type === f.key).length
            const isActive = activeFilter === f.key
            return (
              <button key={f.key} onClick={() => setActiveFilter(f.key)}
                className={`px-4 py-1.5 rounded-full text-sm border transition-all ${
                  isActive
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50'
                }`}>
                {isAr ? f.ar : f.en} ({count})
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-24 text-gray-300">
            <Activity className="w-8 h-8 animate-pulse" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">
            {isAr ? 'لا إشارات تطابق هذا الفلتر' : 'No signals match this filter'}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(alert => {
              const cfg = ALERT_CONFIG[alert.alert_type] || ALERT_CONFIG.balanced
              const urg = URGENCY[alert.urgency] || URGENCY.low
              return (
                <div key={alert.id} className={`border-2 border-t-4 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all ${cfg.bg} ${cfg.topBar}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
                      <span className={`text-xs font-bold ${cfg.color}`}>
                        {isAr ? cfg.label_ar : cfg.label_en}
                      </span>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${urg.cls}`}>
                      {isAr ? urg.label_ar : urg.label_en}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 mb-1 text-[15px]">
                    {isAr ? alert.products?.name_ar : alert.products?.name_en}
                  </h3>
                  {alert.category_ar && (
                    <span className="inline-block text-[10px] bg-gray-100 text-gray-500 rounded-md px-2 py-0.5 mb-2">
                      {alert.category_ar}
                    </span>
                  )}
                  <p className="text-gray-500 text-xs mb-3 leading-relaxed">
                    {isAr ? alert.details_ar : alert.details_en}
                  </p>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { label: isAr ? 'الطلب' : 'Demand', val: alert.demand_score, color: 'text-green-600' },
                      { label: isAr ? 'العرض' : 'Supply', val: alert.supply_score, color: 'text-blue-600' },
                      { label: isAr ? 'الفجوة' : 'Gap',    val: alert.gap_score,    color: 'text-orange-500' },
                    ].map(m => (
                      <div key={m.label} className="bg-white/70 border border-white rounded-xl p-2.5 text-center">
                        <div className={`text-xl font-black ${m.color}`}>{Math.round(m.val)}</div>
                        <div className="text-gray-400 text-[10px] mt-0.5">{m.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white/70 border border-white rounded-xl p-3 text-xs text-gray-600 leading-relaxed">
                    <span className="text-gray-400 font-semibold block mb-0.5">
                      {isAr ? 'التوصية' : 'Recommendation'}
                    </span>
                    {isAr ? alert.recommended_action_ar : alert.recommended_action_en}
                  </div>

                  {alert.products?.slug && (
                    <Link href={`/${locale}/products/${alert.products.slug}`}
                      className={`mt-3 flex items-center gap-1 text-xs font-semibold ${cfg.color} hover:underline`}>
                      {isAr ? 'تفاصيل المنتج' : 'View Product'} <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <p className="text-center text-xs text-gray-400 mt-8">
            {isAr
              ? 'تُحدَّث الإشارات تلقائياً من بيانات ميدانية متعددة — آخر تحديث اليوم'
              : 'Signals updated automatically from multiple market data sources'}
          </p>
        )}
      </div>
    </div>
  )
}
