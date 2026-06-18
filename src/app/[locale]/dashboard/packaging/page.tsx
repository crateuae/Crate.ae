'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, X, Save, RefreshCw } from 'lucide-react'

// ─── Types (mirror DB columns) ───────────────────────────────────────────────

interface PrimaryPack {
  id?: string
  type: string; type_ar: string; type_en: string; icon: string
  size_label: string; size_value: number; unit: string
  cost_aed: number; material_ar: string; material_en: string
  suitable_for_ar: string; suitable_for_en: string
  is_active: boolean; sort_order: number
}

interface MasterCarton {
  id?: string
  name_ar: string; name_en: string; icon: string
  l_cm: number; w_cm: number; h_cm: number
  max_weight_kg: number; default_units: number; cartons_per_pallet: number
  flute_ar: string; flute_en: string; cost_aed: number
  image_url: string
  suitable_for_ar: string; suitable_for_en: string
  is_active: boolean; sort_order: number
}

interface PackOption {
  id?: string
  label_ar: string; label_en: string
  carton_mult: number; per_unit_add: number; setup_aed: number
  is_active: boolean; sort_order: number
}

type Tab = 'packs' | 'cartons' | 'options'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EMPTY_PACK: PrimaryPack = {
  type:'bag', type_ar:'كيس', type_en:'Bag', icon:'👜',
  size_label:'', size_value:0, unit:'kg',
  cost_aed:0, material_ar:'', material_en:'',
  suitable_for_ar:'', suitable_for_en:'',
  is_active:true, sort_order:0,
}

const EMPTY_CARTON: MasterCarton = {
  name_ar:'', name_en:'', icon:'📦',
  l_cm:0, w_cm:0, h_cm:0,
  max_weight_kg:0, default_units:12, cartons_per_pallet:40,
  flute_ar:'', flute_en:'', cost_aed:0,
  image_url:'',
  suitable_for_ar:'', suitable_for_en:'',
  is_active:true, sort_order:0,
}

const EMPTY_OPTION: PackOption = {
  label_ar:'', label_en:'',
  carton_mult:1, per_unit_add:0, setup_aed:0,
  is_active:true, sort_order:0,
}

const PACK_TYPES = [
  { en:'bag',    ar:'كيس',     te:'Bag',    icon:'👜' },
  { en:'bottle', ar:'زجاجة',   te:'Bottle', icon:'🍶' },
  { en:'jar',    ar:'برطمان',  te:'Jar',    icon:'🫙' },
  { en:'box',    ar:'علبة',    te:'Box',    icon:'📦' },
  { en:'pouch',  ar:'كيس مضغوط', te:'Pouch', icon:'🧴' },
  { en:'can',    ar:'علبة معدنية', te:'Can', icon:'🥫' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
}

const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400'
const numInp = inp + ' tabular-nums'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPackaging() {
  const [tab, setTab] = useState<Tab>('packs')
  const [packs,   setPacks]   = useState<PrimaryPack[]>([])
  const [cartons, setCartons] = useState<MasterCarton[]>([])
  const [options, setOptions] = useState<PackOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [modal, setModal] = useState<{ kind: Tab; item: PrimaryPack | MasterCarton | PackOption; isNew: boolean } | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/packaging/specs')
    if (res.ok) {
      const d = await res.json()
      setPacks(d.primary_packs ?? [])
      setCartons(d.master_cartons ?? [])
      setOptions(d.options ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function save(kind: string, data: Record<string, unknown>) {
    setSaving(true); setErr(null)
    const res = await fetch('/api/packaging/specs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, data }),
    })
    setSaving(false)
    if (!res.ok) { setErr('حدث خطأ أثناء الحفظ'); return false }
    await load(); setModal(null); return true
  }

  async function del(kind: string, id: string) {
    if (!confirm('هل أنت متأكد من الحذف؟')) return
    await fetch(`/api/packaging/specs?kind=${kind}&id=${id}`, { method: 'DELETE' })
    await load()
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'packs',   label: 'التغليف الأساسي (الوحدة)', count: packs.length },
    { key: 'cartons', label: 'كراتين الشحن والتخزين',     count: cartons.length },
    { key: 'options', label: 'الخيارات والمواصفات',        count: options.length },
  ]

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">مواصفات التعبئة والتغليف</h1>
          <p className="text-gray-400 text-sm mt-0.5">بيانات ديناميكية — تظهر مباشرة في حاسبة التغليف العامة</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 border border-gray-200 text-gray-500 px-3 py-2 rounded-xl text-sm hover:bg-gray-50 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> تحديث
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-2xl w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
            <span className={`ms-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-500'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {err && <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{err}</div>}

      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">جاري التحميل...</div>
      ) : (
        <>
          {/* ── Primary Packs ── */}
          {tab === 'packs' && (
            <PacksTab packs={packs}
              onAdd={() => setModal({ kind: 'packs', item: { ...EMPTY_PACK }, isNew: true })}
              onEdit={p => setModal({ kind: 'packs', item: { ...p }, isNew: false })}
              onDelete={id => del('primary_pack', id!)} />
          )}
          {/* ── Master Cartons ── */}
          {tab === 'cartons' && (
            <CartonsTab cartons={cartons}
              onAdd={() => setModal({ kind: 'cartons', item: { ...EMPTY_CARTON }, isNew: true })}
              onEdit={c => setModal({ kind: 'cartons', item: { ...c }, isNew: false })}
              onDelete={id => del('master_carton', id!)} />
          )}
          {/* ── Options ── */}
          {tab === 'options' && (
            <OptionsTab options={options}
              onAdd={() => setModal({ kind: 'options', item: { ...EMPTY_OPTION }, isNew: true })}
              onEdit={o => setModal({ kind: 'options', item: { ...o }, isNew: false })}
              onDelete={id => del('option', id!)} />
          )}
        </>
      )}

      {/* ── Modals ── */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-gray-900">
                {modal.isNew ? 'إضافة' : 'تعديل'}
                {modal.kind === 'packs' ? ' تغليف أساسي' : modal.kind === 'cartons' ? ' كرتون' : ' خيار'}
              </h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>

            <div className="px-6 py-5">
              {modal.kind === 'packs' && (
                <PackForm item={modal.item as PrimaryPack} onChange={item => setModal(m => m ? { ...m, item } : m)}
                  onSave={() => {
                    const d = modal.item as PrimaryPack
                    save('primary_pack', d as unknown as Record<string, unknown>)
                  }} saving={saving} />
              )}
              {modal.kind === 'cartons' && (
                <CartonForm item={modal.item as MasterCarton} onChange={item => setModal(m => m ? { ...m, item } : m)}
                  onSave={() => {
                    const d = modal.item as MasterCarton
                    save('master_carton', d as unknown as Record<string, unknown>)
                  }} saving={saving} />
              )}
              {modal.kind === 'options' && (
                <OptionForm item={modal.item as PackOption} onChange={item => setModal(m => m ? { ...m, item } : m)}
                  onSave={() => {
                    const d = modal.item as PackOption
                    save('option', d as unknown as Record<string, unknown>)
                  }} saving={saving} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Packs Tab ───────────────────────────────────────────────────────────────

function PacksTab({ packs, onAdd, onEdit, onDelete }: {
  packs: PrimaryPack[]
  onAdd: () => void
  onEdit: (p: PrimaryPack) => void
  onDelete: (id: string | undefined) => void
}) {
  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={onAdd} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow-sm transition-colors">
          <Plus className="w-4 h-4" /> إضافة تغليف
        </button>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {packs.map(p => (
          <div key={p.id} className={`bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all ${!p.is_active ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">{p.icon}</div>
                <div>
                  <span className="text-[10px] bg-orange-100 text-orange-700 rounded-full px-2.5 py-0.5 font-bold">{p.type_ar}</span>
                  <h3 className="font-black text-gray-900 text-lg mt-1">{p.size_label}</h3>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => onEdit(p)} className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => onDelete(p.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-gray-400">الحجم</span><span className="font-semibold">{p.size_value} {p.unit}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">المادة</span><span className="font-semibold">{p.material_ar}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">التكلفة</span><span className="font-bold text-orange-500">{p.cost_aed} AED</span></div>
            </div>
            {p.suitable_for_ar && <div className="mt-3 pt-3 border-t border-gray-100 text-[10px] text-gray-400">{p.suitable_for_ar}</div>}
          </div>
        ))}
      </div>
    </>
  )
}

// ─── Cartons Tab ─────────────────────────────────────────────────────────────

function CartonsTab({ cartons, onAdd, onEdit, onDelete }: {
  cartons: MasterCarton[]
  onAdd: () => void
  onEdit: (c: MasterCarton) => void
  onDelete: (id: string | undefined) => void
}) {
  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={onAdd} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow-sm transition-colors">
          <Plus className="w-4 h-4" /> إضافة كرتون
        </button>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {cartons.map(c => (
          <div key={c.id} className={`bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all ${!c.is_active ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">{c.icon}</div>
                <div>
                  <h3 className="font-black text-gray-900 leading-tight">{c.name_ar}</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">{c.name_en}</p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => onEdit(c)} className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => onDelete(c.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-gray-400">الأبعاد</span><span className="font-semibold tabular-nums">{c.l_cm}×{c.w_cm}×{c.h_cm} سم</span></div>
              <div className="flex justify-between"><span className="text-gray-400">وزن أقصى</span><span className="font-semibold">{c.max_weight_kg} كجم</span></div>
              <div className="flex justify-between"><span className="text-gray-400">وحدة/كرتون</span><span className="font-semibold">{c.default_units}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">كرتون/باليت</span><span className="font-semibold">{c.cartons_per_pallet}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">النوع</span><span className="font-semibold">{c.flute_ar}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">التكلفة</span><span className="font-bold text-indigo-500">{c.cost_aed} AED</span></div>
            </div>
            {c.image_url && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <img src={c.image_url} alt={c.name_ar}
                  className="w-full h-28 object-contain rounded-xl bg-gray-50" />
              </div>
            )}
            {c.suitable_for_ar && <div className="mt-2 text-[10px] text-gray-400">{c.suitable_for_ar}</div>}
          </div>
        ))}
      </div>
    </>
  )
}

// ─── Options Tab ──────────────────────────────────────────────────────────────

function OptionsTab({ options, onAdd, onEdit, onDelete }: {
  options: PackOption[]
  onAdd: () => void
  onEdit: (o: PackOption) => void
  onDelete: (id: string | undefined) => void
}) {
  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={onAdd} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow-sm transition-colors">
          <Plus className="w-4 h-4" /> إضافة خيار
        </button>
      </div>
      <div className="space-y-3">
        {options.map(o => (
          <div key={o.id} className={`bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center gap-4 ${!o.is_active ? 'opacity-60' : ''}`}>
            <div className="flex-1">
              <div className="font-bold text-gray-900 text-sm">{o.label_ar}</div>
              <div className="text-xs text-gray-400 mt-0.5">{o.label_en}</div>
            </div>
            <div className="flex gap-6 text-xs text-gray-600 tabular-nums">
              <span title="معامل الكرتون">×{Number(o.carton_mult).toFixed(2)}</span>
              {o.per_unit_add > 0 && <span title="إضافة لكل وحدة">+{o.per_unit_add} AED/وحدة</span>}
              {o.setup_aed > 0 && <span title="رسوم إعداد">{o.setup_aed} AED إعداد</span>}
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => onEdit(o)} className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
              <button onClick={() => onDelete(o.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// ─── Pack Form ───────────────────────────────────────────────────────────────

function PackForm({ item, onChange, onSave, saving }: {
  item: PrimaryPack
  onChange: (i: PrimaryPack) => void
  onSave: () => void
  saving: boolean
}) {
  const set = (k: keyof PrimaryPack, v: unknown) => onChange({ ...item, [k]: v })
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-3xl">{item.icon}</div>
        <Field label="الأيقونة">
          <input value={item.icon} onChange={e => set('icon', e.target.value)}
            className="w-20 border border-gray-200 rounded-xl px-3 py-2.5 text-xl text-center focus:outline-none focus:border-orange-400" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="النوع">
          <select value={item.type} onChange={e => {
            const t = PACK_TYPES.find(x => x.en === e.target.value) ?? PACK_TYPES[0]
            onChange({ ...item, type: t.en, type_ar: t.ar, type_en: t.te, icon: t.icon })
          }} className={inp}>
            {PACK_TYPES.map(t => <option key={t.en} value={t.en}>{t.ar} ({t.en})</option>)}
          </select>
        </Field>
        <Field label="الوحدة">
          <select value={item.unit} onChange={e => set('unit', e.target.value)} className={inp}>
            <option value="kg">kg (كجم)</option>
            <option value="L">L (لتر)</option>
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="تسمية الحجم *">
          <input value={item.size_label} onChange={e => set('size_label', e.target.value)}
            placeholder="مثال: 1kg" dir="ltr" className={inp} />
        </Field>
        <Field label="قيمة الحجم (رقم)">
          <input type="number" step="0.001" value={item.size_value} onChange={e => set('size_value', +e.target.value)}
            className={numInp} dir="ltr" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="المادة (AR)">
          <input value={item.material_ar} onChange={e => set('material_ar', e.target.value)} className={inp} />
        </Field>
        <Field label="المادة (EN)">
          <input value={item.material_en} onChange={e => set('material_en', e.target.value)} dir="ltr" className={inp} />
        </Field>
      </div>
      <Field label="التكلفة (AED)">
        <input type="number" step="0.01" value={item.cost_aed} onChange={e => set('cost_aed', +e.target.value)}
          className={numInp} dir="ltr" />
      </Field>
      <Field label="مناسب لـ (AR)">
        <input value={item.suitable_for_ar} onChange={e => set('suitable_for_ar', e.target.value)} className={inp} />
      </Field>
      <Field label="مناسب لـ (EN)">
        <input value={item.suitable_for_en} onChange={e => set('suitable_for_en', e.target.value)} dir="ltr" className={inp} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="الترتيب">
          <input type="number" value={item.sort_order} onChange={e => set('sort_order', +e.target.value)} className={numInp} dir="ltr" />
        </Field>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
            <input type="checkbox" checked={item.is_active} onChange={e => set('is_active', e.target.checked)} className="w-4 h-4 accent-orange-500" />
            نشط
          </label>
        </div>
      </div>
      <SaveBar onSave={onSave} saving={saving} />
    </div>
  )
}

// ─── Carton Form ──────────────────────────────────────────────────────────────

function CartonForm({ item, onChange, onSave, saving }: {
  item: MasterCarton
  onChange: (i: MasterCarton) => void
  onSave: () => void
  saving: boolean
}) {
  const set = (k: keyof MasterCarton, v: unknown) => onChange({ ...item, [k]: v })
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl">{item.icon}</div>
        <Field label="الأيقونة">
          <input value={item.icon} onChange={e => set('icon', e.target.value)}
            className="w-20 border border-gray-200 rounded-xl px-3 py-2.5 text-xl text-center focus:outline-none focus:border-orange-400" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="الاسم بالعربية *">
          <input value={item.name_ar} onChange={e => set('name_ar', e.target.value)} className={inp} />
        </Field>
        <Field label="الاسم بالإنجليزية *">
          <input value={item.name_en} onChange={e => set('name_en', e.target.value)} dir="ltr" className={inp} />
        </Field>
      </div>
      <div>
        <label className="block text-[11px] font-bold text-gray-500 mb-2">الأبعاد الداخلية (سم)</label>
        <div className="grid grid-cols-3 gap-2">
          {(['l_cm','w_cm','h_cm'] as const).map((k, i) => (
            <div key={k}>
              <label className="block text-[10px] text-gray-400 mb-1">{['الطول','العرض','الارتفاع'][i]}</label>
              <input type="number" step="0.5" value={item[k]} onChange={e => set(k, +e.target.value)} className={numInp} dir="ltr" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="وزن أقصى (كجم)">
          <input type="number" step="0.5" value={item.max_weight_kg} onChange={e => set('max_weight_kg', +e.target.value)} className={numInp} dir="ltr" />
        </Field>
        <Field label="وحدة/كرتون">
          <input type="number" value={item.default_units} onChange={e => set('default_units', +e.target.value)} className={numInp} dir="ltr" />
        </Field>
        <Field label="كرتون/باليت">
          <input type="number" value={item.cartons_per_pallet} onChange={e => set('cartons_per_pallet', +e.target.value)} className={numInp} dir="ltr" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="نوع الكرتون (AR)">
          <input value={item.flute_ar} onChange={e => set('flute_ar', e.target.value)} className={inp} placeholder="مثال: مموج BC (جدار مزدوج)" />
        </Field>
        <Field label="نوع الكرتون (EN)">
          <input value={item.flute_en} onChange={e => set('flute_en', e.target.value)} dir="ltr" className={inp} placeholder="BC-flute (double wall)" />
        </Field>
      </div>
      <Field label="التكلفة (AED)">
        <input type="number" step="0.1" value={item.cost_aed} onChange={e => set('cost_aed', +e.target.value)} className={numInp} dir="ltr" />
      </Field>
      <Field label="رابط صورة الكرتون (اختياري)">
        <input value={item.image_url ?? ''} onChange={e => set('image_url', e.target.value)}
          dir="ltr" placeholder="https://..." className={inp} />
        {item.image_url && (
          <div className="mt-2 relative">
            <img src={item.image_url} alt="preview"
              className="w-full h-32 object-contain rounded-xl bg-gray-50 border border-gray-200" />
            <button type="button" onClick={() => set('image_url', '')}
              className="absolute top-1 end-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[11px] font-bold leading-none">×</button>
          </div>
        )}
      </Field>
      <Field label="مناسب لـ (AR)">
        <input value={item.suitable_for_ar} onChange={e => set('suitable_for_ar', e.target.value)} className={inp} />
      </Field>
      <Field label="مناسب لـ (EN)">
        <input value={item.suitable_for_en} onChange={e => set('suitable_for_en', e.target.value)} dir="ltr" className={inp} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="الترتيب">
          <input type="number" value={item.sort_order} onChange={e => set('sort_order', +e.target.value)} className={numInp} dir="ltr" />
        </Field>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
            <input type="checkbox" checked={item.is_active} onChange={e => set('is_active', e.target.checked)} className="w-4 h-4 accent-orange-500" />
            نشط
          </label>
        </div>
      </div>
      <SaveBar onSave={onSave} saving={saving} />
    </div>
  )
}

// ─── Option Form ──────────────────────────────────────────────────────────────

function OptionForm({ item, onChange, onSave, saving }: {
  item: PackOption
  onChange: (i: PackOption) => void
  onSave: () => void
  saving: boolean
}) {
  const set = (k: keyof PackOption, v: unknown) => onChange({ ...item, [k]: v })
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="الاسم بالعربية *">
          <input value={item.label_ar} onChange={e => set('label_ar', e.target.value)} className={inp} />
        </Field>
        <Field label="الاسم بالإنجليزية *">
          <input value={item.label_en} onChange={e => set('label_en', e.target.value)} dir="ltr" className={inp} />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="معامل الكرتون (×)">
          <input type="number" step="0.01" value={item.carton_mult} onChange={e => set('carton_mult', +e.target.value)} className={numInp} dir="ltr" />
        </Field>
        <Field label="إضافة/وحدة (AED)">
          <input type="number" step="0.01" value={item.per_unit_add} onChange={e => set('per_unit_add', +e.target.value)} className={numInp} dir="ltr" />
        </Field>
        <Field label="رسوم إعداد (AED)">
          <input type="number" step="1" value={item.setup_aed} onChange={e => set('setup_aed', +e.target.value)} className={numInp} dir="ltr" />
        </Field>
      </div>
      <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 space-y-1">
        <p><span className="font-bold">معامل الكرتون</span>: يُضرب في تكلفة الكرتون — مثال: 1.30 يعني +30%</p>
        <p><span className="font-bold">إضافة/وحدة</span>: مبلغ ثابت يُضاف لكل وحدة تغليف أساسية (AED)</p>
        <p><span className="font-bold">رسوم إعداد</span>: رسوم لمرة واحدة (مثال: لوح طباعة مخصص)</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="الترتيب">
          <input type="number" value={item.sort_order} onChange={e => set('sort_order', +e.target.value)} className={numInp} dir="ltr" />
        </Field>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
            <input type="checkbox" checked={item.is_active} onChange={e => set('is_active', e.target.checked)} className="w-4 h-4 accent-orange-500" />
            نشط
          </label>
        </div>
      </div>
      <SaveBar onSave={onSave} saving={saving} />
    </div>
  )
}

// ─── Save Bar ─────────────────────────────────────────────────────────────────

function SaveBar({ onSave, saving }: { onSave: () => void; saving: boolean }) {
  return (
    <div className="sticky bottom-0 bg-white border-t border-gray-100 pt-4 flex gap-3">
      <button onClick={onSave} disabled={saving}
        className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-colors text-sm">
        <Save className="w-4 h-4" />
        {saving ? 'جاري الحفظ...' : 'حفظ'}
      </button>
    </div>
  )
}
