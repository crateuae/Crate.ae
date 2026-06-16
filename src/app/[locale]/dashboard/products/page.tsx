'use client'
import { useState } from 'react'
import { Plus, Search, Edit2, Eye, EyeOff, X, Globe, Tag, Award, ChevronDown } from 'lucide-react'
import { PRODUCTS_CATALOG, PRODUCT_CATEGORIES, type CatalogProduct } from '@/lib/data/products-catalog'

const SIGNAL_OPTIONS = ['shortage', 'rising', 'arbitrage', 'stable'] as const
const SIGNAL_LABELS = { shortage: 'نقص عرض', rising: 'طلب صاعد', arbitrage: 'مراجحة', stable: 'مستقر' }
const SIGNAL_COLORS = { shortage: 'bg-red-100 text-red-700', rising: 'bg-green-100 text-green-700', arbitrage: 'bg-amber-100 text-amber-700', stable: 'bg-gray-100 text-gray-500' }

const EMPTY: Partial<CatalogProduct> = {
  name_ar: '', name_en: '', brand: '', country_origin: '', country_origin_ar: '',
  category_ar: '', category_en: '', subcategory_ar: '', subcategory_en: '',
  unit_size: '', price_retail_aed: 0, price_wholesale_aed: 0, units_per_carton: 12,
  barcode_type: 'EAN-13', shelf_life_months: 12, storage_temp: '15 – 25 °C',
  certifications: [], hs_code: '', market_signal: 'stable', gap_score: 0,
  image_emoji: '📦', description_ar: '', description_en: '', is_active: true,
}

export default function DashboardProducts() {
  const [products, setProducts] = useState<CatalogProduct[]>(PRODUCTS_CATALOG)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [sigFilter, setSigFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Partial<CatalogProduct>>(EMPTY)
  const [isEditing, setIsEditing] = useState(false)
  const [certInput, setCertInput] = useState('')

  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    const matchQ = !q || p.name_ar.includes(search) || p.name_en.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
    const matchCat = !catFilter || p.category_ar === catFilter
    const matchSig = !sigFilter || p.market_signal === sigFilter
    return matchQ && matchCat && matchSig
  })

  function openAdd() {
    setEditItem({ ...EMPTY, id: 'p' + Date.now() })
    setIsEditing(false)
    setShowModal(true)
  }

  function openEdit(p: CatalogProduct) {
    setEditItem({ ...p })
    setIsEditing(true)
    setShowModal(true)
  }

  function toggleActive(id: string) {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !p.is_active } : p))
  }

  function handleSave() {
    if (!editItem.name_ar || !editItem.name_en) return
    if (isEditing) {
      setProducts(prev => prev.map(p => p.id === editItem.id ? { ...p, ...editItem } as CatalogProduct : p))
    } else {
      setProducts(prev => [...prev, editItem as CatalogProduct])
    }
    setShowModal(false)
  }

  function addCert() {
    if (!certInput.trim()) return
    setEditItem(prev => ({ ...prev, certifications: [...(prev.certifications || []), certInput.trim()] }))
    setCertInput('')
  }

  function removeCert(cert: string) {
    setEditItem(prev => ({ ...prev, certifications: (prev.certifications || []).filter(c => c !== cert) }))
  }

  const selectedCat = PRODUCT_CATEGORIES.find(c => c.name_ar === editItem.category_ar)

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
            className="w-full border border-gray-200 rounded-xl pr-9 pl-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:border-orange-400 transition-colors" />
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
                <th className="text-right py-3 px-4 font-bold text-gray-500 text-xs hidden lg:table-cell">المنشأ</th>
                <th className="text-right py-3 px-4 font-bold text-gray-500 text-xs">السعر</th>
                <th className="text-right py-3 px-4 font-bold text-gray-500 text-xs hidden md:table-cell">الإشارة</th>
                <th className="text-right py-3 px-4 font-bold text-gray-500 text-xs">الحالة</th>
                <th className="text-right py-3 px-4 font-bold text-gray-500 text-xs">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${!p.is_active ? 'opacity-50' : ''}`}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{p.image_emoji}</span>
                      <div>
                        <div className="font-semibold text-gray-900">{p.name_ar}</div>
                        <div className="text-xs text-gray-400">{p.name_en}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-500 hidden md:table-cell">{p.brand}</td>
                  <td className="py-3 px-4 hidden lg:table-cell">
                    <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{p.subcategory_ar}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs hidden lg:table-cell">{p.country_origin_ar}</td>
                  <td className="py-3 px-4">
                    <div className="text-orange-500 font-bold text-xs">{p.price_wholesale_aed} AED</div>
                    <div className="text-gray-400 text-[10px]">جملة</div>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SIGNAL_COLORS[p.market_signal]}`}>
                      {SIGNAL_LABELS[p.market_signal]}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => toggleActive(p.id)}
                      className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {p.is_active ? 'نشط' : 'معطّل'}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => openEdit(p)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-orange-600 hover:bg-orange-50 px-2.5 py-1.5 rounded-lg transition-colors border border-gray-200 hover:border-orange-200">
                      <Edit2 className="w-3.5 h-3.5" /> تعديل
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="py-12 text-center text-gray-400">لا توجد منتجات مطابقة</td></tr>
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
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Emoji */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center text-3xl">{editItem.image_emoji}</div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">رمز المنتج (Emoji)</label>
                  <input value={editItem.image_emoji || ''} onChange={e => setEditItem(p => ({ ...p, image_emoji: e.target.value }))}
                    className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">الاسم بالعربية *</label>
                  <input value={editItem.name_ar || ''} onChange={e => setEditItem(p => ({ ...p, name_ar: e.target.value }))}
                    placeholder="مثال: رز بسمتي حبة طويلة"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">الاسم بالإنجليزية *</label>
                  <input value={editItem.name_en || ''} onChange={e => setEditItem(p => ({ ...p, name_en: e.target.value }))}
                    placeholder="e.g. Basmati Long Grain Rice"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" dir="ltr" />
                </div>
              </div>

              {/* Brand + Country */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">البراند / الماركة</label>
                  <input value={editItem.brand || ''} onChange={e => setEditItem(p => ({ ...p, brand: e.target.value }))}
                    placeholder="مثال: Mars Food"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" dir="ltr" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">بلد المنشأ (AR)</label>
                  <input value={editItem.country_origin_ar || ''} onChange={e => setEditItem(p => ({ ...p, country_origin_ar: e.target.value }))}
                    placeholder="مثال: تايلاند"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">بلد المنشأ (EN)</label>
                <input value={editItem.country_origin || ''} onChange={e => setEditItem(p => ({ ...p, country_origin: e.target.value }))}
                  placeholder="e.g. Thailand"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" dir="ltr" />
              </div>

              {/* Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">التصنيف الرئيسي</label>
                  <select value={editItem.category_ar || ''} onChange={e => {
                    const cat = PRODUCT_CATEGORIES.find(c => c.name_ar === e.target.value)
                    setEditItem(p => ({ ...p, category_ar: e.target.value, category_en: cat?.name_en || '', subcategory_ar: '', subcategory_en: '' }))
                  }} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 cursor-pointer">
                    <option value="">اختر التصنيف</option>
                    {PRODUCT_CATEGORIES.map(c => <option key={c.id} value={c.name_ar}>{c.icon} {c.name_ar}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">التصنيف الفرعي</label>
                  <select value={editItem.subcategory_ar || ''} onChange={e => {
                    const sub = selectedCat?.subcategories.find(s => s.name_ar === e.target.value)
                    setEditItem(p => ({ ...p, subcategory_ar: e.target.value, subcategory_en: sub?.name_en || '' }))
                  }} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 cursor-pointer" disabled={!selectedCat}>
                    <option value="">اختر الفرعي</option>
                    {selectedCat?.subcategories.map(s => <option key={s.id} value={s.name_ar}>{s.name_ar}</option>)}
                  </select>
                </div>
              </div>

              {/* Prices + Size */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">سعر الجملة (AED)</label>
                  <input type="number" value={editItem.price_wholesale_aed || ''} onChange={e => setEditItem(p => ({ ...p, price_wholesale_aed: +e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" dir="ltr" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">سعر التجزئة (AED)</label>
                  <input type="number" value={editItem.price_retail_aed || ''} onChange={e => setEditItem(p => ({ ...p, price_retail_aed: +e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" dir="ltr" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">وحدات/كرتون</label>
                  <input type="number" value={editItem.units_per_carton || ''} onChange={e => setEditItem(p => ({ ...p, units_per_carton: +e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" dir="ltr" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">حجم الوحدة</label>
                  <input value={editItem.unit_size || ''} onChange={e => setEditItem(p => ({ ...p, unit_size: e.target.value }))}
                    placeholder="مثال: 5kg × 4"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" dir="ltr" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">مدة الصلاحية (شهر)</label>
                  <input type="number" value={editItem.shelf_life_months || ''} onChange={e => setEditItem(p => ({ ...p, shelf_life_months: +e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" dir="ltr" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">درجة التخزين</label>
                  <input value={editItem.storage_temp || ''} onChange={e => setEditItem(p => ({ ...p, storage_temp: e.target.value }))}
                    placeholder="مثال: 10 – 25 °C"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" dir="ltr" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">HS Code</label>
                  <input value={editItem.hs_code || ''} onChange={e => setEditItem(p => ({ ...p, hs_code: e.target.value }))}
                    placeholder="مثال: 1006.30"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" dir="ltr" />
                </div>
              </div>

              {/* Signal */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">إشارة السوق</label>
                  <select value={editItem.market_signal || 'stable'} onChange={e => setEditItem(p => ({ ...p, market_signal: e.target.value as any }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 cursor-pointer">
                    {SIGNAL_OPTIONS.map(s => <option key={s} value={s}>{SIGNAL_LABELS[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">درجة الفجوة (0-100)</label>
                  <input type="number" min="0" max="100" value={editItem.gap_score || 0} onChange={e => setEditItem(p => ({ ...p, gap_score: +e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" dir="ltr" />
                </div>
              </div>

              {/* Certifications */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">الشهادات والاعتمادات</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(editItem.certifications || []).map(cert => (
                    <span key={cert} className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                      {cert} <button type="button" onClick={() => removeCert(cert)} className="opacity-60 hover:opacity-100"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={certInput} onChange={e => setCertInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCert())}
                    placeholder="مثال: ESMA أو Halal"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                  <button type="button" onClick={addCert} className="px-3 py-2 bg-orange-50 text-orange-600 rounded-lg text-sm font-semibold border border-orange-200 hover:bg-orange-100">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Descriptions */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">الوصف بالعربية</label>
                <textarea value={editItem.description_ar || ''} onChange={e => setEditItem(p => ({ ...p, description_ar: e.target.value }))}
                  rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">الوصف بالإنجليزية</label>
                <textarea value={editItem.description_en || ''} onChange={e => setEditItem(p => ({ ...p, description_en: e.target.value }))}
                  rows={2} dir="ltr" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 resize-none" />
              </div>

              {/* Active */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={editItem.is_active || false} onChange={e => setEditItem(p => ({ ...p, is_active: e.target.checked }))}
                  className="w-4 h-4 accent-orange-500 rounded" />
                <span className="text-sm text-gray-700 font-medium">منتج نشط (يظهر في القائمة)</span>
              </label>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3">
              <button onClick={handleSave}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl transition-colors">
                {isEditing ? 'حفظ التعديلات' : 'إضافة المنتج'}
              </button>
              <button onClick={() => setShowModal(false)}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors font-medium">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
