'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, X, Save, RefreshCw, Search, CheckCircle, XCircle, Store, Repeat2, ChevronDown } from 'lucide-react'

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
}

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

async function apiCall(method: string, body?: object) {
  const res = await fetch('/api/admin/providers', {
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProvidersAdminPage() {
  const [isAr] = useState(true)
  const [providers, setProviders]   = useState<Provider[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [typeFilter, setTypeFilter] = useState<'all'|'trader'|'repackager'>('all')
  const [statusFilter, setStatusFilter] = useState<'all'|'active'|'inactive'|'pending'>('all')
  const [editing, setEditing]       = useState<Provider | null>(null)
  const [deleting, setDeleting]     = useState<string | null>(null)
  const [total, setTotal]           = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiCall('GET')
      setProviders(data.rows ?? [])
      setTotal(data.total ?? 0)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function save(p: Provider) {
    if (p.id) {
      await apiCall('PATCH', p)
    } else {
      await apiCall('POST', p)
    }
    setEditing(null)
    await load()
  }

  async function remove(id: string) {
    await apiCall('DELETE', { id })
    setDeleting(null)
    await load()
  }

  async function toggleActive(p: Provider) {
    await apiCall('PATCH', { ...p, is_active: !p.is_active })
    await load()
  }

  async function toggleVerified(p: Provider) {
    await apiCall('PATCH', { ...p, is_verified: !p.is_verified })
    await load()
  }

  // Filter client-side
  const filtered = providers.filter(p => {
    const q = search.toLowerCase()
    const matchQ = !q || p.name_en.toLowerCase().includes(q) || p.name_ar.includes(q) || (p.license_no ?? '').toLowerCase().includes(q)
    const matchT = typeFilter === 'all' || p.type === typeFilter
    const matchS = statusFilter === 'all'
      || (statusFilter === 'active'   && p.is_active)
      || (statusFilter === 'inactive' && !p.is_active)
      || (statusFilter === 'pending'  && p.is_active && !p.is_verified)
    return matchQ && matchT && matchS
  })

  const stats = {
    total:    providers.length,
    active:   providers.filter(p => p.is_active).length,
    verified: providers.filter(p => p.is_verified).length,
    traders:  providers.filter(p => p.type === 'trader').length,
    repack:   providers.filter(p => p.type === 'repackager').length,
    pending:  providers.filter(p => p.is_active && !p.is_verified).length,
  }

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
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={isAr ? 'بحث بالاسم أو رقم الرخصة...' : 'Search by name or license...'}
            className="flex-1 py-2 text-sm focus:outline-none" dir={isAr ? 'rtl' : 'ltr'}/>
          {search && <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-slate-400"/></button>}
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as typeof typeFilter)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-white">
          <option value="all">{isAr ? 'كل الأنواع' : 'All types'}</option>
          <option value="trader">{isAr ? 'تجار' : 'Traders'}</option>
          <option value="repackager">{isAr ? 'معبئون' : 'Repackers'}</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-white">
          <option value="all">{isAr ? 'كل الحالات' : 'All status'}</option>
          <option value="active">{isAr ? 'نشط' : 'Active'}</option>
          <option value="inactive">{isAr ? 'غير نشط' : 'Inactive'}</option>
          <option value="pending">{isAr ? 'بانتظار التوثيق' : 'Pending verification'}</option>
        </select>
        <span className="text-xs text-slate-400 self-center">{filtered.length} {isAr ? 'نتيجة' : 'results'}</span>
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
                    isAr?'الرخصة':'License',
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
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-slate-500">{p.license_no ?? '—'}</span>
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
