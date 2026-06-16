import { TrendingUp, TrendingDown, AlertTriangle, Zap, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

async function getAlerts() {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${base}/api/market/signals?limit=30`, {
      headers: { 'x-cron-secret': process.env.CRON_SECRET || '' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

const ALERT_CONFIG = {
  shortage: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 border-red-200', topBar: 'border-t-red-500', label_ar: 'نقص في العرض', label_en: 'Supply Shortage' },
  arbitrage: { icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', topBar: 'border-t-amber-500', label_ar: 'فرصة مراجحة', label_en: 'Arbitrage Opportunity' },
  trend_rising: { icon: TrendingUp, color: 'text-green-600', bg: 'bg-white border-gray-200', topBar: 'border-t-green-500', label_ar: 'طلب صاعد', label_en: 'Rising Demand' },
  trend_falling: { icon: TrendingDown, color: 'text-blue-600', bg: 'bg-white border-gray-200', topBar: 'border-t-blue-500', label_ar: 'طلب هابط', label_en: 'Falling Demand' },
  balanced: { icon: TrendingUp, color: 'text-gray-500', bg: 'bg-white border-gray-200', topBar: 'border-t-gray-400', label_ar: 'متوازن', label_en: 'Balanced' },
}

const URGENCY = {
  high: { label_ar: 'عاجل', label_en: 'Urgent', cls: 'bg-red-100 text-red-700' },
  medium: { label_ar: 'متوسط', label_en: 'Medium', cls: 'bg-amber-100 text-amber-700' },
  low: { label_ar: 'منخفض', label_en: 'Low', cls: 'bg-gray-100 text-gray-500' },
}

/* Static demo signals when DB is empty */
const DEMO_SIGNALS = [
  {
    id: 'd1', alert_type: 'shortage', urgency: 'high',
    demand_score: 87, supply_score: 12, gap_score: 75,
    details_ar: 'نافد في نون وكارفور ٣ أسابيع، بحث Google +42% هذا الشهر',
    details_en: 'Out of stock on Noon & Carrefour for 3 weeks, Google search +42% this month',
    recommended_action_ar: 'تواصل مع موزع إقليمي لتأمين كمية قبل الشحنة التالية',
    recommended_action_en: 'Contact regional distributor to secure stock before next shipment',
    detected_at: new Date().toISOString(),
    products: { name_ar: 'كوكاكولا 330ml × 24', name_en: 'Coca-Cola 330ml × 24', slug: 'coca-cola-330ml', images: [] },
    category_ar: 'مشروبات غازية',
  },
  {
    id: 'd2', alert_type: 'trend_rising', urgency: 'medium',
    demand_score: 74, supply_score: 55, gap_score: 19,
    details_ar: 'بحث Google +38% أسبوعين، رمضان قادم، أعلى مبيعاً نون هذا الشهر',
    details_en: 'Google search +38% for 2 weeks, Ramadan approaching, #1 bestseller on Noon',
    recommended_action_ar: 'بدء تخزين استراتيجي — السعر سيرتفع خلال ٣ أسابيع',
    recommended_action_en: 'Start strategic stockpiling — price will rise within 3 weeks',
    detected_at: new Date().toISOString(),
    products: { name_ar: 'رز بسمتي حبة طويلة 5kg', name_en: 'Basmati Long Grain Rice 5kg', slug: 'basmati-rice-5kg', images: [] },
    category_ar: 'حبوب — أرز',
  },
  {
    id: 'd3', alert_type: 'arbitrage', urgency: 'medium',
    demand_score: 61, supply_score: 70, gap_score: 44,
    details_ar: 'لولو بـ 18 AED، يباع في البقالات بـ 26 AED — فجوة سعرية 44%',
    details_en: 'Lulu at 18 AED, sold in mini-marts at 26 AED — 44% price gap',
    recommended_action_ar: 'شراء بالجملة + توزيع على المنافذ بهامش 25%+',
    recommended_action_en: 'Buy bulk + distribute to retail outlets with 25%+ margin',
    detected_at: new Date().toISOString(),
    products: { name_ar: 'زيت ذرة Sunola 4L', name_en: 'Sunola Corn Oil 4L', slug: 'sunola-corn-oil-4l', images: [] },
    category_ar: 'زيوت — زيت نباتي',
  },
  {
    id: 'd4', alert_type: 'shortage', urgency: 'high',
    demand_score: 92, supply_score: 0, gap_score: 92,
    details_ar: 'Keyword Volume 5,400/شهر، غير مسجّل بالإمارات، مطلوب بشدة',
    details_en: 'Keyword Volume 5,400/month, not registered in UAE, high demand',
    recommended_action_ar: 'افحص المطابقة → قدّم للتسجيل كوكيل حصري',
    recommended_action_en: 'Check compliance → apply for exclusive agency registration',
    detected_at: new Date().toISOString(),
    products: { name_ar: 'Red Bull Tropical 250ml', name_en: 'Red Bull Tropical 250ml', slug: 'red-bull-tropical', images: [] },
    category_ar: 'مشروبات طاقة',
  },
  {
    id: 'd5', alert_type: 'trend_rising', urgency: 'medium',
    demand_score: 68, supply_score: 48, gap_score: 20,
    details_ar: 'مبيعات أمازون.ae +67% هذا الشهر، مخزون نون ينخفض بسرعة',
    details_en: 'Amazon.ae sales +67% this month, Noon inventory dropping fast',
    recommended_action_ar: 'استيراد مباشر من إندونيسيا بسعر أقل 30%',
    recommended_action_en: 'Direct import from Indonesia at 30% lower cost',
    detected_at: new Date().toISOString(),
    products: { name_ar: 'Indomie Mi Goreng 80g × 40', name_en: 'Indomie Mi Goreng 80g × 40', slug: 'indomie-mi-goreng', images: [] },
    category_ar: 'حبوب — نودلز',
  },
  {
    id: 'd6', alert_type: 'arbitrage', urgency: 'low',
    demand_score: 55, supply_score: 60, gap_score: 28,
    details_ar: 'طلب مؤسسي مرتفع من مطاعم وفنادق، فرصة عقد توريد شهري',
    details_en: 'High institutional demand from restaurants & hotels, monthly supply contract opportunity',
    recommended_action_ar: 'طرح عروض توريد شهرية على الفنادق والمطاعم',
    recommended_action_en: 'Offer monthly supply contracts to hotels and restaurants',
    detected_at: new Date().toISOString(),
    products: { name_ar: 'Almarai Laban 1L × 12', name_en: 'Almarai Laban 1L × 12', slug: 'almarai-laban-1l', images: [] },
    category_ar: 'منتجات ألبان',
  },
]

export default async function MarketPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const isAr = locale === 'ar'
  const dbAlerts = await getAlerts()
  const alerts = dbAlerts.length > 0 ? dbAlerts : DEMO_SIGNALS

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 mb-1 tracking-tight">
              {isAr ? '📡 رادار السوق' : '📡 Market Radar'}
            </h1>
            <p className="text-gray-400 text-sm">
              {isAr
                ? 'إشارات العرض والطلب — مصدرها نون · أمازون.ae · كارفور · لولو · Google Trends · Keyword Planner'
                : 'Supply & demand signals from Noon · Amazon.ae · Carrefour · Lulu · Google Trends · Keyword Planner'}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-4 py-2">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            <span className="text-orange-600 text-sm font-semibold">
              {alerts.length} {isAr ? 'إشارة نشطة' : 'active signals'}
            </span>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 flex-wrap mb-6">
          {[
            { label_ar: `الكل (${alerts.length})`, label_en: `All (${alerts.length})` },
            { label_ar: '🔴 نقص عرض', label_en: '🔴 Shortage' },
            { label_ar: '🟢 طلب صاعد', label_en: '🟢 Rising Demand' },
            { label_ar: '🟡 مراجحة', label_en: '🟡 Arbitrage' },
            { label_ar: '⚡ عاجل فقط', label_en: '⚡ Urgent Only' },
          ].map((f, i) => (
            <button key={i}
              className={`px-4 py-1.5 rounded-full text-sm border transition-all ${
                i === 0
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50'
              }`}>
              {isAr ? f.label_ar : f.label_en}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {alerts.map((alert: {
            id: string
            alert_type: keyof typeof ALERT_CONFIG
            urgency: keyof typeof URGENCY
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
          }) => {
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
                    { label: isAr ? 'الفجوة' : 'Gap', val: alert.gap_score, color: 'text-orange-500' },
                  ].map(m => (
                    <div key={m.label} className="bg-white/70 border border-white rounded-xl p-2.5 text-center">
                      <div className={`text-xl font-black ${m.color}`}>{Math.round(m.val)}</div>
                      <div className="text-gray-400 text-[10px] mt-0.5">{m.label}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-white/70 border border-white rounded-xl p-3 text-xs text-gray-600 leading-relaxed">
                  <span className="text-gray-400 font-semibold block mb-0.5">{isAr ? 'الإجراء المقترح' : 'Recommended Action'}</span>
                  {isAr ? alert.recommended_action_ar : alert.recommended_action_en}
                </div>

                {alert.products?.slug && (
                  <Link href={`/${locale}/products/${alert.products.slug}`}
                    className={`mt-3 flex items-center gap-1 text-xs font-semibold ${cfg.color} hover:underline`}>
                    {isAr ? 'عرض المنتج' : 'View Product'} <ArrowUpRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
