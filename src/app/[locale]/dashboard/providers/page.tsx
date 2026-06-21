'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, Edit2, Trash2, X, Save, RefreshCw, Search, CheckCircle, XCircle, Eye, Inbox, Send, Mail } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Provider {
  id?: string
  name_ar: string; name_en: string
  slug: string
  type: 'trader' | 'repackager'
  category: string; categories?: string[]
  license_no: string | null; license_type: string | null; issue_date: string | null
  emirate: string | null
  phone: string | null; email: string | null; website: string | null
  city: string | null
  is_verified: boolean; is_active: boolean
  created_at?: string
  views_count?: number
  rfq_received_count?: number
  rfq_submitted_count?: number
  emails_count?: number
  last_activity_at?: string | null
}

const PAGE_SIZE = 50

// Real category values present in the DB (for the admin category filter).
const CAT_OPTIONS = [
  'Foodstuff Trading', 'Restaurant', 'Café & Coffee', 'Catering',
  'Beverages & Juices', 'Oils & Fats', 'Bakery & Pastry', 'Supermarket',
  'Seafood', 'Meat & Poultry', 'Grains & Flour', 'Health & Nutrition',
  'Chocolate & Sweets', 'Spices & Condiments', 'Dairy', 'Snacks',
  'Fast Food', 'Frozen Foods', 'General Trading', 'Grocery',
  'Packaging Services', 'Repackaging Services',
]

const EMPTY: Provider = {
  name_ar: '', name_en: '', slug: '',
  type: 'trader', category: 'Foodstuff Trading',
  license_no: null, license_type: null, issue_date: null,
  emirate: null, phone: null, email: null, website: null, city: null,
  is_verified: false, is_active: true,
}

const EMIRATES = ['Abu Dhabi','Dubai','Sharjah','Ajman','Umm Al Quwain','Ras Al Khaimah','Fujairah']

const CATEGORIES = [
  'Restaurants','Fast Food','Cafe & Coffee','Supermarket','Bakery','Catering',
  'Seafood','Meat & Poultry','Dairy','Frozen','Beverages','Chocolate & Sweets',
  'Spices','Grains & Flour','Oils & Fats','Organic','Health & Nutrition','Snacks',
  'Packaging / Repackaging','Grocery & General Food','General Trading','Foodstuff Trading',
]

// ─── Supabase client (service role via API route) ─────────────────────────────

async function apiCall(method: string, body?: object, qs?: string) {
  const res = await fetch(`/api/admin/providers${qs ? '?' + qs : ''}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// ─── Badge ────────────────────────────────────────────────────────────────────

function Badge({ label, color }: { label: string; color: string }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${color}`}>{label}</span>
}

// ─── Form Modal ───────────────────────────────────────────────────────────────

function ProviderForm({ item, onSave, onClose, isAr }: {
  item: Provider; onSave: (p: Provider) => Promise<void>; onClose: () => void; isAr: boolean
}) {
  const [form, setForm] = useState<Provider>({ ...item })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  function upd<K extends keyof Provider>(k: K, v: Provider[K]) {
    setForm(p => ({ ...p, [k]: v }))
  }

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  async function submit() {
    if (!form.name_en.trim()) { setErr('الاسم بالإنجليزية مطلوب'); return }
    if (!form.slug.trim()) { setErr('الـ Slug مطلوب'); return }
    setSaving(true); setErr(null)
    try { await onSave(form) } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'خطأ') }
    finally { setSaving(false) }
  }

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">{label}</label>
      {children}
    </div>
  )

  const inp = "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 transition-colors"
  const sel = "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 bg-white"

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-black text-slate-800">{item.id ? (isAr ? 'تعديل مورد' : 'Edit Provider') : (isAr ? 'إضافة مورد' : 'Add Provider')}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-500"/>
          </button>
        </div>
        <div className="p-5 space-y-4">

          {/* Names */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="الاسم بالإنجليزية *">
              <input value={form.name_en} onChange={e => { upd('name_en', e.target.value); if (!form.id) upd('slug', autoSlug(e.target.value)) }}
                placeholder="e.g. Gulf Food Trading LLC" className={inp}/>
            </Field>
            <Field label="الاسم بالعربية">
              <input value={form.name_ar} onChange={e => upd('name_ar', e.target.value)}
                placeholder="مثال: خليج للتجارة الغذائية" className={inp} dir="rtl"/>
            </Field>
          </div>

          {/* Slug + Type */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Slug (URL)">
              <input value={form.slug} onChange={e => upd('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,''))}
                placeholder="gulf-food-trading" className={inp} dir="ltr"/>
            </Field>
            <Field label="النوع">
              <select value={form.type} onChange={e => upd('type', e.target.value as 'trader'|'repackager')} className={sel}>
                <option value="trader">تاجر (Trader)</option>
                <option value="repackager">معبأ (Repackager)</option>
              </select>
            </Field>
          </div>

          {/* Category + Emirate */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="التصنيف">
              <select value={form.category} onChange={e => upd('category', e.target.value)} className={sel}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="الإمارة">
              <select value={form.emirate ?? ''} onChange={e => upd('emirate', e.target.value || null)} className={sel}>
                <option value="">— غير محدد —</option>
                {EMIRATES.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </Field>
          </div>

          {/* License */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="رقم الرخصة">
              <input value={form.license_no ?? ''} onChange={e => upd('license_no', e.target.value || null)}
                placeholder="CN-1234567" className={inp} dir="ltr"/>
            </Field>
            <Field label="نوع الرخصة">
              <input value={form.license_type ?? ''} onChange={e => upd('license_type', e.target.value || null)}
                placeholder="Commercial / Industrial" className={inp}/>
            </Field>
            <Field label="تاريخ الإصدار">
              <input type="date" value={form.issue_date ?? ''} onChange={e => upd('issue_date', e.target.value || null)} className={inp}/>
            </Field>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="الهاتف">
              <input value={form.phone ?? ''} onChange={e => upd('phone', e.target.value || null)}
                placeholder="+971 4 123 4567" className={inp} dir="ltr"/>
            </Field>
            <Field label="البريد الإلكتروني">
              <input type="email" value={form.email ?? ''} onChange={e => upd('email', e.target.value || null)}
                placeholder="info@company.ae" className={inp} dir="ltr"/>
            </Field>
            <Field label="الموقع الإلكتروني">
              <input value={form.website ?? ''} onChange={e => upd('website', e.target.value || null)}
                placeholder="https://company.ae" className={inp} dir="ltr"/>
            </Field>
          </div>

          {/* City */}
          <Field label="المدينة">
            <input value={form.city ?? ''} onChange={e => upd('city', e.target.value || null)}
              placeholder="Dubai / دبي" className={inp}/>
          </Field>

          {/* Toggles */}
          <div className="flex items-center gap-6 pt-1">
            {([
              { k: 'is_active'   as const, ar: 'نشط',    en: 'Active' },
              { k: 'is_verified' as const, ar: 'موثق',   en: 'Verified' },
            ]).map(t => (
              <label key={t.k} className="flex items-center gap-2 cursor-pointer select-none">
                <button type="button" onClick={() => upd(t.k, !form[t.k])}
                  className={`w-10 h-5 rounded-full transition-colors relative ${form[t.k] ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form[t.k] ? 'start-5' : 'start-0.5'}`}/>
                </button>
                <span className="text-sm font-semibold text-slate-700">{isAr ? t.ar : t.en}</span>
              </label>
            ))}
          </div>

          {err && <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{err}</p>}
        </div>
        <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button onClick={submit} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-60 transition-colors">
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin"/> : <Save className="w-3.5 h-3.5"/>}
            {isAr ? 'حفظ' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Provider activity log (drill-down) ──────────────────────────────────────

interface PEvent { id: string; event_type: string; actor: string | null; payload: Record<string, unknown> | null; created_at: string }
interface PRfq { id: string; product_name: string; status: string; contact_name: string; notes: string | null; created_at: string }

const EVENT_AR: Record<string, string> = {
  page_view: 'مشاهدة صفحة', rfq_received: 'طلب وارد', rfq_submitted: 'طلب صادر',
  email_sent: 'إيميل مُرسل', email_opened: 'إيميل مفتوح', note: 'ملاحظة', verified: 'توثيق',
}

function ActivityLog({ provider, isAr, onClose }: { provider: Provider; isAr: boolean; onClose: () => void }) {
  const [events, setEvents] = useState<PEvent[]>([])
  const [rfqs, setRfqs] = useState<PRfq[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/providers/events?provider_id=${provider.id}`)
      .then(r => r.json())
      .then(d => { setEvents(d.events ?? []); setRfqs(d.rfqs ?? []) })
      .finally(() => setLoading(false))
  }, [provider.id])

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-black text-slate-800 text-sm">{provider.name_en}</h2>
            {provider.name_ar && <p className="text-xs text-slate-400" dir="rtl">{provider.name_ar}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Counters */}
        <div className="grid grid-cols-4 gap-2 p-4 border-b border-slate-100">
          {[
            { Icon: Eye,   v: provider.views_count ?? 0,         l: isAr ? 'مشاهدات' : 'Views' },
            { Icon: Inbox, v: provider.rfq_received_count ?? 0,  l: isAr ? 'طلبات واردة' : 'RFQ in' },
            { Icon: Send,  v: provider.rfq_submitted_count ?? 0, l: isAr ? 'طلبات صادرة' : 'RFQ out' },
            { Icon: Mail,  v: provider.emails_count ?? 0,        l: isAr ? 'إيميلات' : 'Emails' },
          ].map((c, i) => (
            <div key={i} className="text-center bg-slate-50 rounded-xl p-2">
              <c.Icon className="w-3.5 h-3.5 text-slate-400 mx-auto mb-1" />
              <div className="text-lg font-black text-slate-700 tabular-nums">{c.v}</div>
              <div className="text-[9px] text-slate-400">{c.l}</div>
            </div>
          ))}
        </div>

        <div className="p-5 max-h-[50vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10"><RefreshCw className="w-5 h-5 animate-spin text-slate-300" /></div>
          ) : (
            <>
              {/* RFQs */}
              {rfqs.length > 0 && (
                <div className="mb-5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">{isAr ? 'الطلبات' : 'Requests'}</p>
                  <div className="space-y-1.5">
                    {rfqs.map(r => (
                      <div key={r.id} className="flex items-start justify-between gap-2 text-xs bg-slate-50 rounded-xl px-3 py-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-700 truncate">{r.product_name}</div>
                          <div className="text-slate-400">{r.contact_name}{r.notes ? ` · ${r.notes}` : ''}</div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-500 flex-shrink-0">{r.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Event timeline */}
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">{isAr ? 'سجل النشاط' : 'Activity log'}</p>
              {events.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">{isAr ? 'لا نشاط بعد' : 'No activity yet'}</p>
              ) : (
                <div className="space-y-1">
                  {events.map(e => (
                    <div key={e.id} className="flex items-center justify-between gap-2 text-xs py-1.5 border-b border-slate-50 last:border-0">
                      <span className="text-slate-600">{isAr ? (EVENT_AR[e.event_type] ?? e.event_type) : e.event_type}</span>
                      <span className="text-[10px] text-slate-400">{new Date(e.created_at).toLocaleString(isAr ? 'ar-AE' : 'en-AE')}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

interface Stats { total: number; active: number; verified: number; traders: number; repack: number; pending: number }

export default function ProvidersAdminPage() {
  const [isAr] = useState(true)
  const [providers, setProviders]   = useState<Provider[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [typeFilter, setTypeFilter] = useState<'all'|'trader'|'repackager'>('all')
  const [statusFilter, setStatusFilter] = useState<'all'|'active'|'inactive'|'pending'>('all')
  const [editing, setEditing]       = useState<Provider | null>(null)
  const [deleting, setDeleting]     = useState<string | null>(null)
  const [viewing, setViewing]       = useState<Provider | null>(null)
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stats, setStats]           = useState<Stats>({ total: 0, active: 0, verified: 0, traders: 0, repack: 0, pending: 0 })
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async (opts?: { page?: number; q?: string; type?: string; status?: string; category?: string }) => {
    setLoading(true)
    const p = opts?.page ?? page
    const qs = new URLSearchParams({ page: String(p), size: String(PAGE_SIZE) })
    const q = opts?.q ?? search
    const t = opts?.type ?? typeFilter
    const s = opts?.status ?? statusFilter
    const c = opts?.category ?? categoryFilter
    if (q) qs.set('q', q)
    if (t !== 'all') qs.set('type', t)
    if (s !== 'all') qs.set('status', s)
    if (c !== 'all') qs.set('category', c)
    try {
      const data = await apiCall('GET', undefined, qs.toString())
      setProviders(data.rows ?? [])
      setTotal(data.total ?? 0)
      setStats({
        total: data.total ?? 0,
        active: data.active ?? 0,
        verified: data.verified ?? 0,
        traders: data.traders ?? 0,
        repack: data.repack ?? 0,
        pending: data.pending ?? 0,
      })
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [page, search, typeFilter, statusFilter, categoryFilter])

  useEffect(() => { load({ page: 1 }); setPage(1) /* eslint-disable-next-line */ }, [])

  // Debounced server search
  function onSearch(v: string) {
    setSearch(v)
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => { setPage(1); load({ page: 1, q: v }) }, 350)
  }
  function onType(v: 'all'|'trader'|'repackager') { setTypeFilter(v); setPage(1); load({ page: 1, type: v }) }
  function onStatus(v: 'all'|'active'|'inactive'|'pending') { setStatusFilter(v); setPage(1); load({ page: 1, status: v }) }
  function onCategory(v: string) { setCategoryFilter(v); setPage(1); load({ page: 1, category: v }) }
  function goPage(p: number) { setPage(p); load({ page: p }) }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  async function save(p: Provider) {
    if (p.id) { await apiCall('PATCH', p) } else { await apiCall('POST', p) }
    setEditing(null)
    await load()
  }
  async function remove(id: string) { await apiCall('DELETE', { id }); setDeleting(null); await load() }
  async function toggleActive(p: Provider)   { await apiCall('PATCH', { id: p.id, is_active: !p.is_active }); await load() }
  async function toggleVerified(p: Provider) { await apiCall('PATCH', { id: p.id, is_verified: !p.is_verified }); await load() }

  // Server already filters — render rows as-is.
  const filtered = providers

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800">{isAr ? 'إدارة الموردين' : 'Providers'}</h1>
          <p className="text-sm text-slate-400 mt-0.5">{total.toLocaleString()} {isAr ? 'مورد إجمالي' : 'providers total'}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
            <RefreshCw className="w-3.5 h-3.5"/>
            {isAr ? 'تحديث' : 'Refresh'}
          </button>
          <button onClick={() => setEditing({ ...EMPTY })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-black transition-colors">
            <Plus className="w-3.5 h-3.5"/>
            {isAr ? 'إضافة مورد' : 'Add Provider'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: isAr ? 'الإجمالي' : 'Total',    v: stats.total,    c: 'text-slate-700' },
          { label: isAr ? 'نشط' : 'Active',         v: stats.active,   c: 'text-emerald-600' },
          { label: isAr ? 'موثق' : 'Verified',      v: stats.verified, c: 'text-blue-600' },
          { label: isAr ? 'تجار' : 'Traders',       v: stats.traders,  c: 'text-orange-600' },
          { label: isAr ? 'معبئون' : 'Repackers',   v: stats.repack,   c: 'text-purple-600' },
          { label: isAr ? 'بانتظار التوثيق' : 'Pending', v: stats.pending, c: 'text-amber-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-3 text-center">
            <div className={`text-2xl font-black tabular-nums ${s.c}`}>{s.v.toLocaleString()}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] border border-slate-200 rounded-xl px-3">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0"/>
          <input value={search} onChange={e => onSearch(e.target.value)}
            placeholder={isAr ? 'بحث بالاسم أو رقم الرخصة...' : 'Search by name or license...'}
            className="flex-1 py-2 text-sm focus:outline-none" dir={isAr ? 'rtl' : 'ltr'}/>
          {search && <button onClick={() => onSearch('')}><X className="w-3.5 h-3.5 text-slate-400"/></button>}
        </div>
        <select value={typeFilter} onChange={e => onType(e.target.value as typeof typeFilter)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-white">
          <option value="all">{isAr ? 'كل الأنواع' : 'All types'}</option>
          <option value="trader">{isAr ? 'تجار' : 'Traders'}</option>
          <option value="repackager">{isAr ? 'معبئون' : 'Repackers'}</option>
        </select>
        <select value={statusFilter} onChange={e => onStatus(e.target.value as typeof statusFilter)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-white">
          <option value="all">{isAr ? 'كل الحالات' : 'All status'}</option>
          <option value="active">{isAr ? 'نشط' : 'Active'}</option>
          <option value="inactive">{isAr ? 'غير نشط' : 'Inactive'}</option>
          <option value="pending">{isAr ? 'بانتظار التوثيق' : 'Pending verification'}</option>
        </select>
        <select value={categoryFilter} onChange={e => onCategory(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-white">
          <option value="all">{isAr ? 'كل التصنيفات' : 'All categories'}</option>
          {CAT_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="text-xs text-slate-400 self-center">{total.toLocaleString()} {isAr ? 'نتيجة' : 'results'}</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin"/>
            <span className="text-sm">{isAr ? 'جارٍ التحميل...' : 'Loading...'}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">{isAr ? 'لا توجد نتائج' : 'No results'}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {[
                    isAr?'الاسم':'Name',
                    isAr?'النوع':'Type',
                    isAr?'التصنيف':'Category',
                    isAr?'الإمارة':'Emirate',
                    isAr?'النشاط':'Activity',
                    isAr?'الحالة':'Status',
                    isAr?'إجراءات':'Actions',
                  ].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-[11px] font-bold text-slate-500 text-start whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(p => (
                  <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${!p.is_active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800 text-sm leading-tight">{p.name_en}</div>
                      {p.name_ar && <div className="text-xs text-slate-400 mt-0.5" dir="rtl">{p.name_ar}</div>}
                      {p.slug && <div className="text-[10px] text-slate-300 font-mono mt-0.5">/{p.slug}</div>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {p.type === 'trader'
                        ? <Badge label="Trader" color="bg-orange-100 text-orange-700"/>
                        : <Badge label="Repack" color="bg-purple-100 text-purple-700"/>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-600 max-w-[140px] block truncate">{p.category}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-slate-500">{p.emirate ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button onClick={() => setViewing(p)}
                        className="flex items-center gap-2.5 text-[11px] text-slate-500 hover:text-indigo-600 transition-colors"
                        title={isAr ? 'عرض السجل الكامل' : 'Open full log'}>
                        <span className="flex items-center gap-0.5"><Eye className="w-3 h-3 text-slate-400"/>{p.views_count ?? 0}</span>
                        <span className="flex items-center gap-0.5"><Inbox className="w-3 h-3 text-indigo-400"/>{p.rfq_received_count ?? 0}</span>
                        <span className="flex items-center gap-0.5"><Send className="w-3 h-3 text-orange-400"/>{p.rfq_submitted_count ?? 0}</span>
                        <span className="flex items-center gap-0.5"><Mail className="w-3 h-3 text-emerald-400"/>{p.emails_count ?? 0}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <button onClick={() => toggleActive(p)}
                          className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${p.is_active ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                          {p.is_active ? <CheckCircle className="w-3 h-3"/> : <XCircle className="w-3 h-3"/>}
                          {p.is_active ? (isAr?'نشط':'Active') : (isAr?'مخفي':'Hidden')}
                        </button>
                        <button onClick={() => toggleVerified(p)}
                          className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${p.is_verified ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}>
                          {p.is_verified ? (isAr?'✓ موثق':'✓ Verified') : (isAr?'⏳ بانتظار':'⏳ Pending')}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditing(p)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-orange-50 text-slate-400 hover:text-orange-500 transition-colors">
                          <Edit2 className="w-3.5 h-3.5"/>
                        </button>
                        <button onClick={() => setDeleting(p.id!)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5"/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => goPage(page - 1)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {isAr ? 'السابق' : 'Prev'}
          </button>
          <span className="text-sm text-slate-500 px-2 tabular-nums">
            {isAr ? `صفحة ${page.toLocaleString('ar-EG')} من ${totalPages.toLocaleString('ar-EG')}` : `Page ${page} of ${totalPages}`}
          </span>
          <button disabled={page >= totalPages} onClick={() => goPage(page + 1)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {isAr ? 'التالي' : 'Next'}
          </button>
        </div>
      )}

      {/* Activity Log Drawer */}
      {viewing && (
        <ActivityLog provider={viewing} isAr={isAr} onClose={() => setViewing(null)} />
      )}

      {/* Edit Modal */}
      {editing && (
        <ProviderForm item={editing} onSave={save} onClose={() => setEditing(null)} isAr={isAr}/>
      )}

      {/* Delete Confirm */}
      {deleting && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-red-500"/>
            </div>
            <div>
              <p className="font-black text-slate-800">{isAr ? 'حذف المورد؟' : 'Delete provider?'}</p>
              <p className="text-sm text-slate-400 mt-1">{isAr ? 'لا يمكن التراجع عن هذا الإجراء' : 'This action cannot be undone'}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDeleting(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button onClick={() => remove(deleting)}
                className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-black transition-colors">
                {isAr ? 'حذف' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
