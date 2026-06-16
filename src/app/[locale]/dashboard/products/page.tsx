'use client'
import { useState, useEffect, useTransition } from 'react'
import { Plus, Search, Edit2, Eye, EyeOff, X, Trash2, Loader2, ImageIcon } from 'lucide-react'
import { getProducts, upsertProduct, toggleProductActive, deleteProduct } from '@/lib/supabase/actions'
import { PRODUCT_CATEGORIES } from '@/lib/data/products-catalog'

const SIGNAL_OPTIONS = ['shortage', 'rising', 'arbitrage', 'stable'] as const
const SIGNAL_LABELS: Record<string, string> = { shortage: 'نقص عرض', rising: 'طلب صاعد', arbitrage: 'مراجحة', stable: 'مستقر' }
const SIGNAL_COLORS: Record<string, string> = { shortage: 'bg-red-100 text-red-700', rising: 'bg-green-100 text-green-700', arbitrage: 'bg-amber-100 text-amber-700', stable: 'bg-gray-100 text-gray-500' }

type Product = Record<string, unknown>

const EMPTY: Product = {
  name_ar: '', name_en: '', brand: '', country_origin: '', country_origin_ar: '',
  category_ar: '', category_en: '', subcategory_ar: '', subcategory_en: '',
  unit_size: '', price_retail_aed: '', price_wholesale_aed: '', price_import_aed: '',
  units_per_carton: 12, barcode_type: 'EAN-13', shelf_life_months: 12,
  storage_temp: '15 – 25 °C', certifications: [], hs_code: '', barcode: '',
  market_signal: 'stable', gap_score: 0, image_emoji: '📦',
  description_ar: '', description_en: '', is_active: true,
  registration_status: 'registered_uae', acquisition_type: 'both',
  local_distributor_note: '', registration_cost_aed: '', registration_months: '',
}

export default function DashboardProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [sigFilter, setSigFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Product>(EMPTY)
  const [isEditing, setIsEditing] = useState(false)
  const [certInput, setCertInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { setProducts(await getProducts()) } catch {}
    setLoading(false)
  }

  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    const matchQ = !q || String(p.name_ar).includes(search) || String(p.name_en).toLowerCase().includes(q) || String(p.brand).toLowerCase().includes(q)
    const matchCat = !catFilter || p.category_ar === catFilter
    const matchSig = !sigFilter || p.market_signal === sigFilter
    return matchQ && matchCat && matchSig
  })

  function openAdd() { setEditItem({ ...EMPTY }); setIsEditing(false); setShowModal(true); setCertInput('') }
  function openEdit(p: Product) { setEditItem({ ...p }); setIsEditing(true); setShowModal(true); setCertInput('') }

  async function handleToggle(id: string, active: boolean) {
    startTransition(async () => {
      await toggleProductActive(id, !active)
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !active } : p))
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('حذف المنتج نهائياً؟')) return
    startTransition(async () => {
      await deleteProduct(id as string)
      setProducts(prev => prev.filter(p => p.id !== id))
    })
  }

  async function handleSave() {
    if (!editItem.name_ar || !editItem.name_en) return
    setSaving(true)
    try {
      const payload = { ...editItem }
      if (!payload.id) { delete payload.id; payload.slug = String(editItem.name_en).toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now() }
      const saved = await upsertProduct(payload)
      if (isEditing) {
        setProducts(prev => prev.map(p => p.id === saved.id ? saved : p))
      } else {
        setProducts(prev => [saved, ...prev])
      }
      setShowModal(false)
    } catch (e) { alert('خطأ في الحفظ') }
    setSaving(false)
  }

  function addCert() {
    if (!certInput.trim()) return
    setEditItem(p => ({ ...p, certifications: [...((p.certifications as string[]) || []), certInput.trim()] }))
    setCertInput('')
  }

  function removeCert(cert: string) {
    setEditItem(p => ({ ...p, certifications: ((p.certifications as string[]) || []).filter(c => c !== cert) }))
  }

  const selectedCat = PRODUCT_CATEGORIES.find(c => c.name_ar === editItem.category_ar)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
    </div>
  )

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">إدارة المنتجات</h1>
          <p className="text-gray-400 text-sm mt-0.5">{products.length} منتج · {products.filter(p => p.is_active).length} نشط</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm text-sm">
          <Plus className="w-4 h-4" /> إضافة منتج
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو البراند..."
            className="w-full border border-gray-200 rounded-xl pr-9 pl-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:border-orange-400" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-600 bg-white focus:outline-none focus:border-orange-400 cursor-pointer min-w-40">
          <option value="">كل التصنيفات</option>
          {PRODUCT_CATEGORIES.map(c => <option key={c.id} value={c.name_ar}>{c.icon} {c.name_ar}</option>)}
        </select>
        <select value={sigFilter} onChange={e => setSigFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-600 bg-white focus:outline-none focus:border-orange-400 cursor-pointer">
          <option value="">كل الإشارات</option>
          {SIGNAL_OPTIONS.map(s => <option key={s} value={s}>{SIGNAL_LABELS[s]}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-right py-3 px-4 font-bold text-gray-500 text-xs">المنتج</th>
                <th className="text-right py-3 px-4 font-bold text-gray-500 text-xs hidden md:table-cell">البراند</th>
                <th className="text-right py-3 px-4 font-bold text-gray-500 text-xs hidden lg:table-cell">التصنيف</th>
                <th className="text-right py-3 px-4 font-bold text-gray-500 text-xs">السعر</th>
                <th className="text-right py-3 px-4 font-bold text-gray-500 text-xs hidden md:table-cell">الإشارة</th>
                <th className="text-right py-3 px-4 font-bold text-gray-500 text-xs">الحالة</th>
                <th className="text-right py-3 px-4 font-bold text-gray-500 text-xs">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={String(p.id)} className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${!p.is_active ? 'opacity-50' : ''}`}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{String(p.image_emoji || '📦')}</span>
                      <div>
                        <div className="font-semibold text-gray-900">{String(p.name_ar)}</div>
                        <div className="text-xs text-gray-400">{String(p.name_en)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-500 hidden md:table-cell">{String(p.brand || '—')}</td>
                  <td className="py-3 px-4 hidden lg:table-cell">
                    <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{String(p.subcategory_ar || p.category_ar || '—')}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-orange-500 font-bold text-xs">{p.price_wholesale_aed ? `${p.price_wholesale_aed} AED` : '—'}</div>
                    <div className="text-gray-400 text-[10px]">جملة</div>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SIGNAL_COLORS[String(p.market_signal)] || ''}`}>
                      {SIGNAL_LABELS[String(p.market_signal)] || '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => handleToggle(String(p.id), Boolean(p.is_active))}
                      className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {p.is_active ? 'نشط' : 'معطّل'}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1.5">
                      <button onClick={() => openEdit(p)}
                        className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-orange-600 hover:bg-orange-50 px-2.5 py-1.5 rounded-lg transition-colors border border-gray-200 hover:border-orange-200">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(String(p.id))}
                        className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors border border-gray-200 hover:border-red-200">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-16 text-center">
                  <ImageIcon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">{products.length === 0 ? 'لا توجد منتجات — اضغط "إضافة منتج"' : 'لا توجد نتائج مطابقة'}</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-black text-gray-900">{isEditing ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Emoji */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center text-3xl">{String(editItem.image_emoji)}</div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">رمز المنتج (Emoji)</label>
                  <input value={String(editItem.image_emoji || '')} onChange={e => setEditItem(p => ({ ...p, image_emoji: e.target.value }))}
                    className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="الاسم بالعربية *">
                  <input value={String(editItem.name_ar || '')} onChange={e => setEditItem(p => ({ ...p, name_ar: e.target.value }))} placeholder="مثال: رز بسمتي" className={inputCls} />
                </Field>
                <Field label="الاسم بالإنجليزية *">
                  <input value={String(editItem.name_en || '')} onChange={e => setEditItem(p => ({ ...p, name_en: e.target.value }))} dir="ltr" placeholder="e.g. Basmati Rice" className={inputCls} />
                </Field>
              </div>

              {/* Brand + Country */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="البراند">
                  <input value={String(editItem.brand || '')} onChange={e => setEditItem(p => ({ ...p, brand: e.target.value }))} dir="ltr" placeholder="e.g. Mars Food" className={inputCls} />
                </Field>
                <Field label="بلد المنشأ (AR)">
                  <input value={String(editItem.country_origin_ar || '')} onChange={e => setEditItem(p => ({ ...p, country_origin_ar: e.target.value }))} placeholder="مثال: تايلاند" className={inputCls} />
                </Field>
              </div>
              <Field label="بلد المنشأ (EN)">
                <input value={String(editItem.country_origin || '')} onChange={e => setEditItem(p => ({ ...p, country_origin: e.target.value }))} dir="ltr" placeholder="e.g. Thailand" className={inputCls} />
              </Field>

              {/* Category */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="التصنيف الرئيسي">
                  <select value={String(editItem.category_ar || '')} onChange={e => {
                    const cat = PRODUCT_CATEGORIES.find(c => c.name_ar === e.target.value)
                    setEditItem(p => ({ ...p, category_ar: e.target.value, category_en: cat?.name_en || '', subcategory_ar: '', subcategory_en: '' }))
                  }} className={inputCls}>
                    <option value="">اختر التصنيف</option>
                    {PRODUCT_CATEGORIES.map(c => <option key={c.id} value={c.name_ar}>{c.icon} {c.name_ar}</option>)}
                  </select>
                </Field>
                <Field label="التصنيف الفرعي">
                  <select value={String(editItem.subcategory_ar || '')} onChange={e => {
                    const sub = selectedCat?.subcategories.find((s: { name_ar: string; name_en: string }) => s.name_ar === e.target.value)
                    setEditItem(p => ({ ...p, subcategory_ar: e.target.value, subcategory_en: sub?.name_en || '' }))
                  }} className={inputCls} disabled={!selectedCat}>
                    <option value="">اختر الفرعي</option>
                    {selectedCat?.subcategories.map((s: { id: string; name_ar: string }) => <option key={s.id} value={s.name_ar}>{s.name_ar}</option>)}
                  </select>
                </Field>
              </div>

              {/* Registration */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="حالة التسجيل">
                  <select value={String(editItem.registration_status || 'registered_uae')} onChange={e => setEditItem(p => ({ ...p, registration_status: e.target.value }))} className={inputCls}>
                    <option value="registered_uae">مسجّل في الإمارات</option>
                    <option value="unregistered">غير مسجّل (فرصة)</option>
                  </select>
                </Field>
                <Field label="نوع الاستحواذ">
                  <select value={String(editItem.acquisition_type || 'both')} onChange={e => setEditItem(p => ({ ...p, acquisition_type: e.target.value }))} className={inputCls}>
                    <option value="local_trade">تجارة محلية</option>
                    <option value="direct_import">استيراد مباشر</option>
                    <option value="both">الاثنان</option>
                  </select>
                </Field>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-3 gap-4">
                <Field label="سعر الجملة (AED)">
                  <input type="number" value={String(editItem.price_wholesale_aed || '')} onChange={e => setEditItem(p => ({ ...p, price_wholesale_aed: e.target.value }))} className={inputCls} dir="ltr" />
                </Field>
                <Field label="سعر التجزئة (AED)">
                  <input type="number" value={String(editItem.price_retail_aed || '')} onChange={e => setEditItem(p => ({ ...p, price_retail_aed: e.target.value }))} className={inputCls} dir="ltr" />
                </Field>
                <Field label="سعر الاستيراد (AED)">
                  <input type="number" value={String(editItem.price_import_aed || '')} onChange={e => setEditItem(p => ({ ...p, price_import_aed: e.target.value }))} className={inputCls} dir="ltr" />
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Field label="وحدات/كرتون">
                  <input type="number" value={String(editItem.units_per_carton || '')} onChange={e => setEditItem(p => ({ ...p, units_per_carton: e.target.value }))} className={inputCls} dir="ltr" />
                </Field>
                <Field label="حجم الوحدة">
                  <input value={String(editItem.unit_size || '')} onChange={e => setEditItem(p => ({ ...p, unit_size: e.target.value }))} placeholder="5kg × 4" className={inputCls} dir="ltr" />
                </Field>
                <Field label="الصلاحية (شهر)">
                  <input type="number" value={String(editItem.shelf_life_months || '')} onChange={e => setEditItem(p => ({ ...p, shelf_life_months: e.target.value }))} className={inputCls} dir="ltr" />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="درجة التخزين">
                  <input value={String(editItem.storage_temp || '')} onChange={e => setEditItem(p => ({ ...p, storage_temp: e.target.value }))} placeholder="15 – 25 °C" className={inputCls} dir="ltr" />
                </Field>
                <Field label="HS Code">
                  <input value={String(editItem.hs_code || '')} onChange={e => setEditItem(p => ({ ...p, hs_code: e.target.value }))} placeholder="1006.30" className={inputCls} dir="ltr" />
                </Field>
              </div>

              {/* Signal */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="إشارة السوق">
                  <select value={String(editItem.market_signal || 'stable')} onChange={e => setEditItem(p => ({ ...p, market_signal: e.target.value }))} className={inputCls}>
                    {SIGNAL_OPTIONS.map(s => <option key={s} value={s}>{SIGNAL_LABELS[s]}</option>)}
                  </select>
                </Field>
                <Field label="درجة الفجوة (0-100)">
                  <input type="number" min="0" max="100" value={String(editItem.gap_score || 0)} onChange={e => setEditItem(p => ({ ...p, gap_score: e.target.value }))} className={inputCls} dir="ltr" />
                </Field>
              </div>

              {/* Unregistered fields */}
              {editItem.registration_status === 'unregistered' && (
                <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl space-y-3">
                  <p className="text-xs font-bold text-orange-600">معلومات التسجيل (للعلامات غير المسجّلة)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="تكلفة التسجيل (AED)">
                      <input type="number" value={String(editItem.registration_cost_aed || '')} onChange={e => setEditItem(p => ({ ...p, registration_cost_aed: e.target.value }))} className={inputCls} dir="ltr" />
                    </Field>
                    <Field label="مدة التسجيل (شهور)">
                      <input type="number" value={String(editItem.registration_months || '')} onChange={e => setEditItem(p => ({ ...p, registration_months: e.target.value }))} className={inputCls} dir="ltr" />
                    </Field>
                  </div>
                  <Field label="ملاحظة للمورد المحلي">
                    <input value={String(editItem.local_distributor_note || '')} onChange={e => setEditItem(p => ({ ...p, local_distributor_note: e.target.value }))} className={inputCls} />
                  </Field>
                </div>
              )}

              {/* Certifications */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">الشهادات والاعتمادات</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {((editItem.certifications as string[]) || []).map(cert => (
                    <span key={cert} className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                      {cert} <button type="button" onClick={() => removeCert(cert)}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={certInput} onChange={e => setCertInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCert())}
                    placeholder="مثال: ESMA أو Halal" className={`flex-1 ${inputCls}`} />
                  <button type="button" onClick={addCert} className="px-3 py-2 bg-orange-50 text-orange-600 rounded-lg text-sm font-semibold border border-orange-200 hover:bg-orange-100">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Descriptions */}
              <Field label="الوصف بالعربية">
                <textarea value={String(editItem.description_ar || '')} onChange={e => setEditItem(p => ({ ...p, description_ar: e.target.value }))} rows={2} className={`${inputCls} resize-none`} />
              </Field>
              <Field label="الوصف بالإنجليزية">
                <textarea value={String(editItem.description_en || '')} onChange={e => setEditItem(p => ({ ...p, description_en: e.target.value }))} rows={2} dir="ltr" className={`${inputCls} resize-none`} />
              </Field>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={Boolean(editItem.is_active)} onChange={e => setEditItem(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 accent-orange-500 rounded" />
                <span className="text-sm text-gray-700 font-medium">منتج نشط (يظهر في القائمة)</span>
              </label>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEditing ? 'حفظ التعديلات' : 'إضافة المنتج'}
              </button>
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors font-medium">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 bg-white'
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-bold text-gray-500 mb-1.5">{label}</label>{children}</div>
}
