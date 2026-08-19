'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { ArrowLeft, Loader2, Save, Truck, RefreshCw, Coins, Package, ListChecks, Globe, KeyRound } from 'lucide-react'

type Partner = Record<string, any>
interface Order { id: string; created_at: string; afp_ref: string; product_slug: string | null; quantity: number; buyer_name: string | null; buyer_email: string | null; afp_total_aed: number; commission_aed: number; status: string; compliance_product: string | null }
interface Payload {
  partner: Partner; orders: Order[]
  summary: { count: number; total_aed: number; commission_aed: number; byStatus: Record<string, number> } | null
  monthly?: { month: string; count: number; total_aed: number; commission_aed: number }[]
}

// Module-level so their identity is STABLE across renders. (Defining these inside
// the page recreated them every keystroke → React remounted each <input> and focus
// was lost after every character.)
const INP = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 transition-colors'
function Field({ label, value, onChange, type = 'text', dir }: { label: string; value: any; onChange: (v: string) => void; type?: string; dir?: 'rtl' | 'ltr' }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">{label}</label>
      <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} className={INP} dir={dir} />
    </div>
  )
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
      <h3 className="font-bold text-slate-700 text-sm">{title}</h3>{children}
    </div>
  )
}
function Toggle({ on, onClick, icon, label }: { on: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none" onClick={onClick}>
      <span className={`w-10 h-5 rounded-full transition-colors relative ${on ? 'bg-emerald-500' : 'bg-slate-200'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? 'start-5' : 'start-0.5'}`} />
      </span>
      <span className="text-sm font-semibold text-slate-700 inline-flex items-center gap-1">{icon}{label}</span>
    </label>
  )
}

export default function PartnerDetailPage() {
  const isAr = !usePathname()?.startsWith('/en')
  const locale = isAr ? 'ar' : 'en'
  const id = String(useParams()?.id || '')
  const [d, setD] = useState<Payload | null>(null)
  const [form, setForm] = useState<Partner>({})
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const load = () => fetch(`/api/admin/partners/${id}`, { cache: 'no-store' })
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then((p: Payload) => { setD(p); setForm(p.partner) })
    .catch(() => setErr(isAr ? 'تعذّر التحميل' : 'Failed to load'))
  useEffect(() => { if (id) load() /* eslint-disable-next-line */ }, [id])

  const upd = (k: string, v: any) => { setForm(f => ({ ...f, [k]: v })); setSaved(false) }

  const save = async () => {
    setSaving(true); setErr('')
    try {
      const res = await fetch('/api/admin/partners', {
        method: 'PATCH', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, ...form }),
      })
      const j = await res.json()
      if (!res.ok || !j.ok) setErr(j.error === 'slug_taken' ? (isAr ? 'الـslug مستخدم' : 'Slug taken') : (isAr ? 'تعذّر الحفظ' : 'Save failed'))
      else { setSaved(true); await load() }
    } finally { setSaving(false) }
  }

  const refresh = async () => {
    setRefreshing(true)
    try { await fetch('/api/admin/partner-orders', { method: 'POST' }); await load() }
    finally { setRefreshing(false) }
  }

  const T = {
    back: isAr ? 'الشركاء' : 'Partners',
    save: isAr ? 'حفظ' : 'Save', saved: isAr ? 'تم الحفظ ✓' : 'Saved ✓',
    identity: isAr ? 'الهوية' : 'Identity',
    legal: isAr ? 'البيانات القانونية (KYC)' : 'Legal / KYC',
    contact: isAr ? 'التواصل' : 'Contact',
    offering: isAr ? 'الخدمات والمواد' : 'Services & materials',
    relationship: isAr ? 'العلاقة والإعدادات' : 'Relationship & settings',
    nameEn: isAr ? 'الاسم (إنجليزي)' : 'Name (EN)', nameAr: isAr ? 'الاسم (عربي)' : 'Name (AR)',
    slug: isAr ? 'المُعرّف (slug للصفحة العامة)' : 'Slug (public page)',
    licNo: isAr ? 'رقم الرخصة التجارية' : 'Trade license no.', licType: isAr ? 'نوع الرخصة' : 'License type',
    licExp: isAr ? 'انتهاء الرخصة' : 'License expiry', trn: isAr ? 'الرقم الضريبي (TRN)' : 'Tax reg. no. (TRN)',
    phone: isAr ? 'الهاتف' : 'Phone', email: isAr ? 'البريد' : 'Email', website: isAr ? 'الموقع' : 'Website',
    emirate: isAr ? 'الإمارة' : 'Emirate', address: isAr ? 'العنوان' : 'Address',
    services: isAr ? 'الخدمات' : 'Services', materials: isAr ? 'المواد' : 'Materials', desc: isAr ? 'وصف' : 'Description',
    status: isAr ? 'الحالة' : 'Status', commission: isAr ? 'نسبة العمولة %' : 'Commission %',
    fulfillment: isAr ? 'شريك تنفيذ (دروبشيب)' : 'Fulfillment partner (dropship)',
    published: isAr ? 'نشر الصفحة العامة' : 'Publish public page',
    account: isAr ? 'بريد حساب الدخول' : 'Account login email',
    orders: isAr ? 'طلبات الدروبشيب' : 'Dropship orders', refresh: isAr ? 'تحديث الحالات من AFP' : 'Refresh statuses from AFP',
    count: isAr ? 'الطلبات' : 'Orders', value: isAr ? 'إجمالي القيمة' : 'Total value', comm: isAr ? 'عمولتك' : 'Your commission',
    none: isAr ? 'لا طلبات بعد' : 'No orders yet',
    ref: isAr ? 'المرجع' : 'Ref', buyer: isAr ? 'المشتري' : 'Buyer', product: isAr ? 'المنتج' : 'Product',
    qty: isAr ? 'كمية' : 'Qty', total: isAr ? 'الإجمالي' : 'Total', cut: isAr ? 'عمولتك' : 'Commission', st: isAr ? 'الحالة' : 'Status', date: isAr ? 'التاريخ' : 'Date',
    viewPublic: isAr ? 'عرض الصفحة العامة' : 'View public page',
    aed: isAr ? 'د.إ' : 'AED',
  }
  const STATUS: Record<string, { label: string; cls: string }> = {
    pending: { label: isAr ? 'بانتظار الدفع' : 'Awaiting payment', cls: 'bg-amber-100 text-amber-700' },
    confirmed: { label: isAr ? 'مؤكّد' : 'Confirmed', cls: 'bg-blue-100 text-blue-700' },
    in_production: { label: isAr ? 'قيد الإنتاج' : 'In production', cls: 'bg-indigo-100 text-indigo-700' },
    ready: { label: isAr ? 'جاهز' : 'Ready', cls: 'bg-teal-100 text-teal-700' },
    delivered: { label: isAr ? 'تم التسليم' : 'Delivered', cls: 'bg-emerald-100 text-emerald-700' },
    cancelled: { label: isAr ? 'ملغى' : 'Cancelled', cls: 'bg-red-100 text-red-600' },
  }
  const stOf = (s: string) => STATUS[s] ?? { label: s, cls: 'bg-slate-100 text-slate-600' }
  const money = (n: number) => (Number(n) || 0).toLocaleString(isAr ? 'ar-AE' : 'en-AE', { maximumFractionDigits: 2 })

  if (err && !d) return <div className="p-10 text-center text-red-500">{err}</div>
  if (!d) return <div className="p-20 flex justify-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link href={`/${locale}/dashboard/partners`} className="text-xs text-slate-400 hover:text-orange-500 inline-flex items-center gap-1">
            <ArrowLeft className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />{T.back}
          </Link>
          <h1 className="text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
            {d.partner.is_fulfillment && <Truck className="w-5 h-5 text-orange-500" />}{d.partner.name_en}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {d.partner.public_published && d.partner.slug && (
            <a href={`/${locale}/partners/${d.partner.slug}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 text-sm px-4 py-2.5 text-slate-600 hover:bg-slate-50">
              <Globe className="w-4 h-4" />{T.viewPublic}
            </a>
          )}
          <button onClick={save} disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 text-white text-sm font-semibold px-5 py-2.5 hover:bg-orange-600 disabled:opacity-60 shadow-sm shadow-orange-500/30">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{saved ? T.saved : T.save}
          </button>
        </div>
      </div>
      {err && <p className="text-sm text-red-500">{err}</p>}

      <div className="grid lg:grid-cols-2 gap-5">
        <Card title={T.identity}>
          <div className="grid grid-cols-2 gap-3">
            <Field label={T.nameEn} value={form.name_en} onChange={v => upd('name_en', v)} />
            <Field label={T.nameAr} value={form.name_ar} onChange={v => upd('name_ar', v)} dir="rtl" />
          </div>
          <Field label={T.slug} value={form.slug} onChange={v => upd('slug', v)} dir="ltr" />
        </Card>
        <Card title={T.legal}>
          <div className="grid grid-cols-2 gap-3">
            <Field label={T.licNo} value={form.trade_license_no} onChange={v => upd('trade_license_no', v)} dir="ltr" />
            <Field label={T.licType} value={form.trade_license_type} onChange={v => upd('trade_license_type', v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={T.licExp} value={form.trade_license_expiry} onChange={v => upd('trade_license_expiry', v)} type="date" />
            <Field label={T.trn} value={form.trn} onChange={v => upd('trn', v)} dir="ltr" />
          </div>
        </Card>
        <Card title={T.contact}>
          <div className="grid grid-cols-2 gap-3">
            <Field label={T.phone} value={form.phone} onChange={v => upd('phone', v)} dir="ltr" />
            <Field label={T.email} value={form.email} onChange={v => upd('email', v)} dir="ltr" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={T.website} value={form.website} onChange={v => upd('website', v)} dir="ltr" />
            <Field label={T.emirate} value={form.emirate} onChange={v => upd('emirate', v)} />
          </div>
          <Field label={T.address} value={form.address} onChange={v => upd('address', v)} />
        </Card>
        <Card title={T.offering}>
          <Field label={T.services} value={form.services} onChange={v => upd('services', v)} />
          <Field label={T.materials} value={form.materials} onChange={v => upd('materials', v)} />
          <Field label={T.desc} value={form.description} onChange={v => upd('description', v)} />
        </Card>
      </div>

      <Card title={T.relationship}>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">{T.status}</label>
            <select value={form.status ?? 'active'} onChange={e => upd('status', e.target.value)} className={INP}>
              <option value="active">{isAr ? 'نشط' : 'Active'}</option>
              <option value="pending">{isAr ? 'قيد المراجعة' : 'Pending'}</option>
              <option value="paused">{isAr ? 'موقوف' : 'Paused'}</option>
            </select>
          </div>
          <Field label={T.commission} value={form.commission_pct} onChange={v => upd('commission_pct', v)} type="number" />
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block flex items-center gap-1"><KeyRound className="w-3 h-3" />{T.account}</label>
            <input value={form.account_email ?? ''} onChange={e => upd('account_email', e.target.value)} className={INP} dir="ltr" />
          </div>
        </div>
        <div className="flex flex-wrap gap-5 pt-1">
          <Toggle on={!!form.is_fulfillment} onClick={() => upd('is_fulfillment', !form.is_fulfillment)} icon={<Truck className="w-3.5 h-3.5" />} label={T.fulfillment} />
          <Toggle on={!!form.public_published} onClick={() => upd('public_published', !form.public_published)} icon={<Globe className="w-3.5 h-3.5" />} label={T.published} />
        </div>
      </Card>

      {d.partner.is_fulfillment && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2"><Package className="w-4 h-4 text-orange-500" />{T.orders}</h3>
            <button onClick={refresh} disabled={refreshing} className="inline-flex items-center gap-2 text-xs rounded-xl border border-slate-200 px-3 py-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-60">
              {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}{T.refresh}
            </button>
          </div>
          {d.summary && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: ListChecks, label: T.count, v: d.summary.count.toLocaleString(), c: 'text-slate-700' },
                { icon: Package, label: T.value, v: `${money(d.summary.total_aed)} ${T.aed}`, c: 'text-blue-600' },
                { icon: Coins, label: T.comm, v: `${money(d.summary.commission_aed)} ${T.aed}`, c: 'text-emerald-600' },
              ].map((c, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-3">
                  <c.icon className={`w-4 h-4 ${c.c}`} />
                  <div className="text-lg font-black text-slate-900 mt-1 tabular-nums">{c.v}</div>
                  <div className="text-[10px] text-slate-400">{c.label}</div>
                </div>
              ))}
            </div>
          )}
          {/* Monthly settlement rollup — commission owed to Crate per calendar month */}
          {!!d.monthly?.length && (
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-500">{isAr ? 'التسوية الشهرية — العمولة المستحقّة لك' : 'Monthly settlement — commission owed to you'}</div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-slate-400 text-[10px] uppercase">
                    <th className="text-start px-3 py-1.5 font-bold">{isAr ? 'الشهر' : 'Month'}</th>
                    <th className="text-center px-3 py-1.5 font-bold">{isAr ? 'طلبات' : 'Orders'}</th>
                    <th className="text-end px-3 py-1.5 font-bold">{isAr ? 'الإجمالي' : 'Total'}</th>
                    <th className="text-end px-3 py-1.5 font-bold">{isAr ? 'عمولتك' : 'Commission'}</th>
                  </tr></thead>
                  <tbody>
                    {d.monthly.map(m => (
                      <tr key={m.month} className="border-t border-slate-50">
                        <td className="px-3 py-1.5 font-mono text-slate-700 whitespace-nowrap">{m.month}</td>
                        <td className="px-3 py-1.5 text-center tabular-nums text-slate-500">{m.count}</td>
                        <td className="px-3 py-1.5 text-end tabular-nums text-slate-600">{money(m.total_aed)}</td>
                        <td className="px-3 py-1.5 text-end tabular-nums text-emerald-600 font-semibold">{money(m.commission_aed)} {T.aed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!d.orders.length ? <p className="text-sm text-slate-400 py-4 text-center">{T.none}</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="text-slate-400 text-[10px] uppercase">
                  <th className="text-start pb-2 font-bold">{T.ref}</th><th className="text-start pb-2 font-bold">{T.buyer}</th>
                  <th className="text-start pb-2 font-bold">{T.product}</th><th className="text-center pb-2 font-bold">{T.qty}</th>
                  <th className="text-end pb-2 font-bold">{T.total}</th><th className="text-end pb-2 font-bold">{T.cut}</th>
                  <th className="text-center pb-2 font-bold">{T.st}</th><th className="text-end pb-2 font-bold">{T.date}</th>
                </tr></thead>
                <tbody>
                  {d.orders.map(o => (
                    <tr key={o.id} className="border-t border-slate-50">
                      <td className="py-2 font-mono text-slate-700 whitespace-nowrap">{o.afp_ref}</td>
                      <td className="py-2 text-slate-600 truncate max-w-[120px]" title={o.buyer_email ?? ''}>{o.buyer_name ?? '—'}</td>
                      <td className="py-2 text-slate-500 truncate max-w-[150px]" title={o.compliance_product ?? ''}>{o.compliance_product || o.product_slug || '—'}</td>
                      <td className="py-2 text-center tabular-nums text-slate-500">{o.quantity}</td>
                      <td className="py-2 text-end tabular-nums text-slate-700">{money(o.afp_total_aed)}</td>
                      <td className="py-2 text-end tabular-nums text-emerald-600 font-semibold">{money(o.commission_aed)}</td>
                      <td className="py-2 text-center"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${stOf(o.status).cls}`}>{stOf(o.status).label}</span></td>
                      <td className="py-2 text-end text-slate-400 whitespace-nowrap">{new Date(o.created_at).toLocaleDateString(isAr ? 'ar-AE' : 'en-AE')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
