'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Handshake, Package, Coins, ListChecks, Loader2, RefreshCw, Truck } from 'lucide-react'

interface PartnerOrder {
  id: string
  created_at: string
  afp_ref: string
  product_slug: string | null
  quantity: number
  buyer_name: string | null
  buyer_email: string | null
  buyer_phone: string | null
  afp_total_aed: number
  commission_pct: number
  commission_aed: number
  status: string
  compliance_product: string | null
}
interface Payload {
  orders: PartnerOrder[]
  summary: { count: number; total_aed: number; commission_aed: number; byStatus: Record<string, number> }
}

export default function PartnersPage() {
  const isAr = !usePathname()?.startsWith('/en')
  const [d, setD] = useState<Payload | null>(null)
  const [err, setErr] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const load = () => fetch('/api/admin/partner-orders', { cache: 'no-store' })
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(setD).catch(() => setErr(isAr ? 'تعذّر تحميل البيانات' : 'Failed to load'))

  useEffect(() => { load() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [])

  const refresh = async () => {
    setRefreshing(true)
    try { await fetch('/api/admin/partner-orders', { method: 'POST' }); await load() }
    finally { setRefreshing(false) }
  }

  const T = {
    title: isAr ? 'الشركاء والتنفيذ' : 'Partners & Fulfillment',
    sub: isAr ? 'طلبات الدروبشيب المُوجَّهة إلى Art for Printing وعمولاتها' : 'Dropship orders routed to Art for Printing and their commissions',
    partner: isAr ? 'الشريك' : 'Partner',
    orders: isAr ? 'الطلبات' : 'Orders',
    value: isAr ? 'إجمالي قيمة الطلبات' : 'Total order value',
    commission: isAr ? 'عمولتك المتوقّعة' : 'Your expected commission',
    refresh: isAr ? 'تحديث الحالات من AFP' : 'Refresh statuses from AFP',
    none: isAr ? 'لا طلبات بعد — ستظهر هنا فور إرسال أول طلب ملصق من صفحة الفحص' : 'No orders yet — they appear here once a label order is sent from the compliance page',
    ref: isAr ? 'المرجع' : 'Ref',
    buyer: isAr ? 'المشتري' : 'Buyer',
    product: isAr ? 'المنتج' : 'Product',
    qty: isAr ? 'الكمية' : 'Qty',
    total: isAr ? 'الإجمالي' : 'Total',
    yourCut: isAr ? 'عمولتك' : 'Commission',
    status: isAr ? 'الحالة' : 'Status',
    date: isAr ? 'التاريخ' : 'Date',
    aed: isAr ? 'د.إ' : 'AED',
  }

  const STATUS: Record<string, { label: string; cls: string }> = {
    pending:       { label: isAr ? 'بانتظار الدفع' : 'Awaiting payment', cls: 'bg-amber-100 text-amber-700' },
    confirmed:     { label: isAr ? 'مؤكّد' : 'Confirmed', cls: 'bg-blue-100 text-blue-700' },
    in_production: { label: isAr ? 'قيد الإنتاج' : 'In production', cls: 'bg-indigo-100 text-indigo-700' },
    ready:         { label: isAr ? 'جاهز' : 'Ready', cls: 'bg-teal-100 text-teal-700' },
    delivered:     { label: isAr ? 'تم التسليم' : 'Delivered', cls: 'bg-emerald-100 text-emerald-700' },
    cancelled:     { label: isAr ? 'ملغى' : 'Cancelled', cls: 'bg-red-100 text-red-600' },
  }
  const st = (s: string) => STATUS[s] ?? { label: s, cls: 'bg-slate-100 text-slate-600' }
  const money = (n: number) => (Number(n) || 0).toLocaleString(isAr ? 'ar-AE' : 'en-AE', { maximumFractionDigits: 2 })

  if (err) return <div className="p-10 text-center text-red-500">{err}</div>
  if (!d) return <div className="p-20 flex justify-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>

  const cards = [
    { icon: ListChecks, label: T.orders, value: d.summary.count.toLocaleString(), color: 'text-slate-700' },
    { icon: Package, label: T.value, value: `${money(d.summary.total_aed)} ${T.aed}`, color: 'text-blue-600' },
    { icon: Coins, label: T.commission, value: `${money(d.summary.commission_aed)} ${T.aed}`, color: 'text-emerald-600' },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2"><Handshake className="w-6 h-6 text-orange-500" />{T.title}</h1>
          <p className="text-sm text-slate-400 mt-1">{T.sub}</p>
        </div>
        <button onClick={refresh} disabled={refreshing}
          className="inline-flex items-center gap-2 text-sm rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-600 hover:bg-slate-50 disabled:opacity-60">
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}{T.refresh}
        </button>
      </div>

      {/* Partner card */}
      <div className="bg-gradient-to-b from-orange-50 to-white border border-orange-100 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-sm shadow-orange-500/30">
          <Truck className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-slate-800">Art for Printing</div>
          <div className="text-xs text-slate-500 mt-0.5">{isAr ? 'شريك تصنيع الملصقات (دروبشيب) — طباعة رقمية قصيرة المدى' : 'Label manufacturing partner (dropship) — short-run digital printing'}</div>
        </div>
        <a href="https://www.artforprinting.ae" target="_blank" rel="noopener noreferrer" className="text-xs text-orange-600 hover:underline">artforprinting.ae</a>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4">
            <c.icon className={`w-5 h-5 ${c.color}`} />
            <div className="text-xl font-black text-slate-900 mt-2 tabular-nums">{c.value}</div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5 leading-tight">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      {Object.keys(d.summary.byStatus).length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {Object.entries(d.summary.byStatus).map(([s, n]) => (
            <span key={s} className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${st(s).cls}`}>{st(s).label}: {n}</span>
          ))}
        </div>
      )}

      {/* Orders table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        {d.orders.length === 0 ? <p className="text-sm text-slate-400 py-6 text-center">{T.none}</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-slate-400 text-[10px] uppercase">
                <th className="text-start pb-2 font-bold">{T.ref}</th>
                <th className="text-start pb-2 font-bold">{T.buyer}</th>
                <th className="text-start pb-2 font-bold">{T.product}</th>
                <th className="text-center pb-2 font-bold">{T.qty}</th>
                <th className="text-end pb-2 font-bold">{T.total}</th>
                <th className="text-end pb-2 font-bold">{T.yourCut}</th>
                <th className="text-center pb-2 font-bold">{T.status}</th>
                <th className="text-end pb-2 font-bold">{T.date}</th>
              </tr></thead>
              <tbody>
                {d.orders.map(o => (
                  <tr key={o.id} className="border-t border-slate-50">
                    <td className="py-2 font-mono text-slate-700 whitespace-nowrap">{o.afp_ref}</td>
                    <td className="py-2 text-slate-600 truncate max-w-[140px]" title={o.buyer_email ?? ''}>{o.buyer_name ?? '—'}</td>
                    <td className="py-2 text-slate-500 truncate max-w-[160px]" title={o.compliance_product ?? ''}>{o.compliance_product || o.product_slug || '—'}</td>
                    <td className="py-2 text-center tabular-nums text-slate-500">{o.quantity}</td>
                    <td className="py-2 text-end tabular-nums text-slate-700">{money(o.afp_total_aed)}</td>
                    <td className="py-2 text-end tabular-nums text-emerald-600 font-semibold">{money(o.commission_aed)}</td>
                    <td className="py-2 text-center"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${st(o.status).cls}`}>{st(o.status).label}</span></td>
                    <td className="py-2 text-end text-slate-400 whitespace-nowrap">{new Date(o.created_at).toLocaleDateString(isAr ? 'ar-AE' : 'en-AE')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
