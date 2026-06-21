'use client'
import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, Search, MousePointerClick, Eye, Zap, RefreshCw, ChevronUp, ChevronDown, Minus, ExternalLink } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface GscRow {
  key: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  opportunity?: number
}

interface GscData {
  rows: GscRow[]
  quickWins: GscRow[]
  startDate: string
  endDate: string
  total: { clicks: number; impressions: number; avgCtr: number; avgPos: number }
  error?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt  = (n: number) => n.toLocaleString('en-US')
const fmtP = (n: number) => `${n.toFixed(1)}`

function posColor(p: number) {
  if (p <= 3)  return 'text-emerald-600 font-black'
  if (p <= 10) return 'text-blue-600 font-bold'
  if (p <= 20) return 'text-amber-600 font-semibold'
  return 'text-slate-400'
}

function posBadge(p: number) {
  if (p <= 3)  return 'bg-emerald-100 text-emerald-700'
  if (p <= 10) return 'bg-blue-100 text-blue-700'
  if (p <= 20) return 'bg-amber-100 text-amber-700'
  return 'bg-slate-100 text-slate-500'
}

function PosIcon({ p }: { p: number }) {
  if (p <= 3)  return <ChevronUp className="w-3 h-3 text-emerald-500"/>
  if (p <= 10) return <Minus className="w-3 h-3 text-blue-400"/>
  return <ChevronDown className="w-3 h-3 text-amber-400"/>
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.FC<{ className?: string }>
  label: string; value: string; sub?: string; color: string
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4"/>
      </div>
      <div className="text-2xl font-black text-slate-800 tabular-nums">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
      {sub && <div className="text-[10px] text-slate-300">{sub}</div>}
    </div>
  )
}

// ─── Table ────────────────────────────────────────────────────────────────────

type SortKey = 'clicks' | 'impressions' | 'ctr' | 'position' | 'opportunity'

function DataTable({ rows, dim, showOpportunity }: {
  rows: GscRow[]; dim: 'query' | 'page'; showOpportunity?: boolean
}) {
  const [sort, setSort] = useState<SortKey>(showOpportunity ? 'opportunity' : 'clicks')
  const [asc, setAsc]   = useState(false)
  const [search, setSearch] = useState('')

  function toggleSort(k: SortKey) {
    if (sort === k) setAsc(a => !a)
    else { setSort(k); setAsc(false) }
  }

  const filtered = rows
    .filter(r => !search || r.key.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const v = (a[sort] ?? 0) - (b[sort] ?? 0)
      return asc ? v : -v
    })

  const Th = ({ k, label }: { k: SortKey; label: string }) => (
    <th onClick={() => toggleSort(k)}
      className="px-3 py-2.5 text-[11px] font-bold text-slate-500 text-end cursor-pointer hover:text-slate-700 whitespace-nowrap select-none">
      <span className="flex items-center justify-end gap-1">
        {label}
        {sort === k && (asc ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>)}
      </span>
    </th>
  )

  const pagePath = (url: string) => {
    try { return new URL(url).pathname } catch { return url }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3">
        <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0"/>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={dim === 'query' ? 'بحث في الكلمات المفتاحية...' : 'بحث في الصفحات...'}
          className="flex-1 py-2 text-sm focus:outline-none" dir="ltr"/>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-3 py-2.5 text-[11px] font-bold text-slate-500 text-start">#</th>
              <th className="px-3 py-2.5 text-[11px] font-bold text-slate-500 text-start">
                {dim === 'query' ? 'الكلمة المفتاحية' : 'الصفحة'}
              </th>
              <Th k="position"    label="الترتيب"/>
              <Th k="impressions" label="ظهور"/>
              <Th k="clicks"      label="نقرات"/>
              <Th k="ctr"         label="CTR%"/>
              {showOpportunity && <Th k="opportunity" label="فرصة"/>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.slice(0, 100).map((r, i) => (
              <tr key={r.key} className="hover:bg-slate-50 transition-colors">
                <td className="px-3 py-2.5 text-[11px] text-slate-300 tabular-nums">{i + 1}</td>
                <td className="px-3 py-2.5 max-w-[280px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-slate-700 truncate font-medium" dir="ltr">
                      {dim === 'page' ? pagePath(r.key) : r.key}
                    </span>
                    {dim === 'page' && (
                      <a href={r.key} target="_blank" rel="noopener noreferrer"
                        className="flex-shrink-0 text-slate-300 hover:text-orange-500 transition-colors">
                        <ExternalLink className="w-3 h-3"/>
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-end">
                  <span className={`inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full ${posBadge(r.position)}`}>
                    <PosIcon p={r.position}/>
                    {fmtP(r.position)}
                  </span>
                </td>
                <td className={`px-3 py-2.5 text-end text-sm tabular-nums text-slate-600`}>{fmt(r.impressions)}</td>
                <td className="px-3 py-2.5 text-end text-sm font-bold tabular-nums text-slate-800">{fmt(r.clicks)}</td>
                <td className="px-3 py-2.5 text-end text-sm tabular-nums text-slate-500">{fmtP(r.ctr)}%</td>
                {showOpportunity && (
                  <td className="px-3 py-2.5 text-end">
                    <span className="text-xs font-black text-orange-600 tabular-nums">{fmt(r.opportunity ?? 0)}</span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-8 text-sm text-slate-400">لا توجد نتائج</div>
        )}
      </div>
      <p className="text-[10px] text-slate-300">{filtered.length} نتيجة</p>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type Tab = 'quickwins' | 'keywords' | 'pages'

// ─── Google Analytics panel ─────────────────────────────────────────────────

interface GaData {
  configured: boolean
  totals?: { users: number; pageviews: number; sessions: number }
  pages?: { path: string; users: number; pageviews: number; sessions: number }[]
  error?: string
}

function GaPanel({ range }: { range: number }) {
  const [ga, setGa] = useState<GaData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/ga?range=${range}`).then(r => r.json()).then(setGa).catch(() => setGa(null)).finally(() => setLoading(false))
  }, [range])

  if (loading) return <div className="bg-white border border-slate-200 rounded-2xl p-6 flex justify-center"><RefreshCw className="w-5 h-5 animate-spin text-slate-300" /></div>

  if (!ga?.configured) return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-700 space-y-1">
      <p className="font-bold">📊 Google Analytics غير مُفعّل بعد</p>
      <p>1. أنشئ خاصية <strong>GA4</strong> وانسخ <strong>Property ID</strong> الرقمي.</p>
      <p>2. في GA4 → Admin → Property Access → أضف بريد الـ Service Account (نفس GSC) كـ <strong>Viewer</strong>.</p>
      <p>3. في Vercel أضف <strong>GA4_PROPERTY_ID</strong> = المعرّف الرقمي → أعد النشر.</p>
    </div>
  )

  if (ga.error) return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-600">GA: {ga.error}</div>
  )

  const t = ga.totals!
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={Eye} label="مستخدمون نشطون" value={fmt(t.users)} sub={`آخر ${range} يوم`} color="bg-blue-100 text-blue-600" />
        <StatCard icon={MousePointerClick} label="مشاهدات الصفحات" value={fmt(t.pageviews)} sub="Analytics" color="bg-emerald-100 text-emerald-600" />
        <StatCard icon={TrendingUp} label="الجلسات" value={fmt(t.sessions)} sub="Analytics" color="bg-violet-100 text-violet-600" />
      </div>
      {ga.pages && ga.pages.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <h3 className="text-xs font-black text-slate-700 mb-2">أكثر الصفحات زيارةً (GA4)</h3>
          <div className="space-y-1">
            {ga.pages.slice(0, 8).map((p, i) => (
              <div key={i} className="flex items-center justify-between gap-2 text-xs py-1 border-b border-slate-50 last:border-0">
                <span className="text-slate-600 truncate font-mono text-[11px]" dir="ltr">{p.path}</span>
                <span className="text-slate-400 flex-shrink-0">{fmt(p.pageviews)} {fmt(p.users)}👤</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function SeoPage() {
  const [range, setRange]   = useState(28)
  const [data, setData]     = useState<GscData | null>(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab]       = useState<Tab>('quickwins')
  const [error, setError]   = useState<string | null>(null)

  const load = useCallback(async (r: number) => {
    setLoading(true); setError(null)
    try {
      const [qRes, pRes] = await Promise.all([
        fetch(`/api/admin/gsc?range=${r}&type=query`),
        fetch(`/api/admin/gsc?range=${r}&type=page`),
      ])
      const [qData, pData] = await Promise.all([qRes.json(), pRes.json()])
      if (qData.error) throw new Error(qData.error)
      setData({ ...qData, pages: pData.rows, pageQuickWins: pData.quickWins })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطأ في الاتصال')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load(range) }, [load, range])

  const extData = data as (GscData & { pages?: GscRow[]; pageQuickWins?: GscRow[] }) | null

  const TABS: { k: Tab; label: string; icon: React.FC<{className?:string}> }[] = [
    { k: 'quickwins', label: 'فرص سريعة 🎯', icon: Zap },
    { k: 'keywords',  label: 'الكلمات المفتاحية', icon: Search },
    { k: 'pages',     label: 'الصفحات', icon: TrendingUp },
  ]

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-800">SEO — Search Console + Analytics</h1>
          {data && (
            <p className="text-xs text-slate-400 mt-0.5">{data.startDate} → {data.endDate}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {([7, 28, 90] as const).map(r => (
            <button key={r} onClick={() => { setRange(r); load(r) }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${range === r ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'}`}>
              {r} يوم
            </button>
          ))}
          <button onClick={() => load(range)} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}/>
          </button>
        </div>
      </div>

      {/* Google Analytics (GA4) */}
      <GaPanel range={range} />

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-2">
          <p className="text-sm font-bold text-red-700">خطأ في الاتصال بـ Google Search Console</p>
          <p className="text-xs text-red-500 font-mono" dir="ltr">{error}</p>
          <div className="bg-white rounded-xl p-3 space-y-1 text-xs text-slate-600">
            <p className="font-bold text-slate-700 mb-2">خطوات الإعداد المطلوبة في Vercel:</p>
            <p>1. افتح <strong>Google Cloud Console</strong> → أنشئ مشروع → فعّل <strong>Search Console API</strong></p>
            <p>2. أنشئ <strong>Service Account</strong> → حمّل JSON Key</p>
            <p>3. افتح <strong>Search Console</strong> → Settings → Users → أضف بريد الـ Service Account كـ <strong>Owner</strong></p>
            <p>4. أضف هذه المتغيرات في <strong>Vercel → Settings → Environment Variables</strong>:</p>
            <div className="bg-slate-50 rounded-lg p-2 font-mono text-[10px] space-y-1 mt-1" dir="ltr">
              <p>GSC_SERVICE_ACCOUNT_EMAIL = <em>xxx@project.iam.gserviceaccount.com</em></p>
              <p>GSC_PRIVATE_KEY = <em>-----BEGIN RSA PRIVATE KEY-----\n...</em></p>
              <p>GSC_SITE_URL = <em>https://www.crate.ae</em></p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      {data && !error && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={MousePointerClick} label="إجمالي النقرات"    value={fmt(data.total.clicks)}
              sub={`آخر ${range} يوم`} color="bg-orange-100 text-orange-600"/>
            <StatCard icon={Eye}              label="إجمالي الظهور"      value={fmt(data.total.impressions)}
              sub="مرات الظهور في جوجل" color="bg-blue-100 text-blue-600"/>
            <StatCard icon={TrendingUp}       label="متوسط CTR"          value={`${data.total.avgCtr}%`}
              sub="نسبة النقر للظهور" color="bg-emerald-100 text-emerald-600"/>
            <StatCard icon={Search}           label="متوسط الترتيب"      value={`#${data.total.avgPos}`}
              sub="المركز في نتائج جوجل" color="bg-purple-100 text-purple-600"/>
          </div>

          {/* Quick wins summary banner */}
          {data.quickWins.length > 0 && (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-orange-500"/>
              </div>
              <div>
                <p className="font-black text-orange-800 text-sm">
                  {data.quickWins.length} فرصة سريعة — كلمات تظهر في مراكز 4-20 بظهور عالٍ
                </p>
                <p className="text-xs text-orange-600 mt-1 leading-relaxed">
                  تحسين هذه الكلمات بمحتوى أقوى سيُحرّكها للمراكز الأولى ويضاعف النقرات تلقائياً — مبدأ كرة الثلج.
                  الكلمة في المركز 1 تحصل على ~28% CTR مقابل 2-3% في المركز 10.
                </p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="flex border-b border-slate-100">
              {TABS.map(t => (
                <button key={t.k} onClick={() => setTab(t.k)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-bold transition-colors border-b-2 ${
                    tab === t.k ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                  <t.icon className="w-3.5 h-3.5"/>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="p-4">
              {tab === 'quickwins' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    <strong>الفرص السريعة</strong> = كلمات مفتاحية تظهر في مراكز 4-20 مع ظهور عالٍ.
                    تحسين صفحاتها بمحتوى أكثر تفصيلاً وعناوين H2 تحتوي الكلمة سيرفعها للمراكز 1-3.
                    عمود <strong>"فرصة"</strong> = عدد الزيارات المحتملة المهدرة يومياً.
                  </p>
                  <DataTable rows={data.quickWins} dim="query" showOpportunity/>
                </div>
              )}
              {tab === 'keywords' && (
                <DataTable rows={data.rows} dim="query"/>
              )}
              {tab === 'pages' && (
                <DataTable rows={extData?.pages ?? []} dim="page"/>
              )}
            </div>
          </div>

          {/* SEO Tips based on data */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                title: 'كلمات في المركز 4-10',
                desc: 'هذه تحتاج فقط تحسيناً بسيطاً في الـ Title و H1 وإضافة محتوى داخلي للوصل للمراكز 1-3',
                count: data.quickWins.filter(r => r.position <= 10).length,
                color: 'bg-blue-50 border-blue-200 text-blue-800',
                icon: '🎯',
              },
              {
                title: 'كلمات في المركز 11-20',
                desc: 'تحتاج مقالات أو صفحات جديدة تستهدف هذه الكلمات بشكل مباشر مع روابط داخلية',
                count: data.quickWins.filter(r => r.position > 10 && r.position <= 20).length,
                color: 'bg-amber-50 border-amber-200 text-amber-800',
                icon: '🔧',
              },
              {
                title: 'CTR أقل من 2%',
                desc: 'حسّن Meta Description ليكون أكثر إغراءً — جرّب أرقاماً وعروضاً في الوصف',
                count: data.rows.filter(r => r.ctr < 2 && r.impressions > 100).length,
                color: 'bg-purple-50 border-purple-200 text-purple-800',
                icon: '✍️',
              },
            ].map((tip, i) => (
              <div key={i} className={`border rounded-2xl p-4 ${tip.color}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{tip.icon}</span>
                  <span className="font-black text-sm">{tip.title}</span>
                  <span className="ms-auto text-2xl font-black tabular-nums">{tip.count}</span>
                </div>
                <p className="text-xs leading-relaxed opacity-80">{tip.desc}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {loading && !data && (
        <div className="flex items-center justify-center py-32 gap-2 text-slate-400">
          <RefreshCw className="w-5 h-5 animate-spin"/>
          <span className="text-sm">جارٍ تحميل بيانات جوجل...</span>
        </div>
      )}
    </div>
  )
}
