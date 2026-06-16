'use client'
import { useState } from 'react'
import { Plus, Edit2, X, Trash2 } from 'lucide-react'

interface PackagingSpec {
  id: string
  type: string
  type_ar: string
  size: string
  dims_cm: string
  max_weight_kg: number
  units_per_carton: number
  cartons_per_pallet: number
  material: string
  material_ar: string
  cost_aed: number
  suitable_for_ar: string
  suitable_for_en: string
  is_active: boolean
}

const INITIAL: PackagingSpec[] = [
  { id: 'pk1', type: 'Bag', type_ar: 'كيس', size: '1kg', dims_cm: '20×10×5 سم', max_weight_kg: 1, units_per_carton: 24, cartons_per_pallet: 60, material: 'PP Woven', material_ar: 'بولي بروبيلين منسوج', cost_aed: 0.5, suitable_for_ar: 'أرز، سكر، دقيق، بقوليات', suitable_for_en: 'Rice, sugar, flour, legumes', is_active: true },
  { id: 'pk2', type: 'Bag', type_ar: 'كيس', size: '5kg', dims_cm: '40×20×10 سم', max_weight_kg: 5, units_per_carton: 6, cartons_per_pallet: 40, material: 'PP Woven', material_ar: 'بولي بروبيلين منسوج', cost_aed: 1.2, suitable_for_ar: 'أرز، دقيق، حبوب خشنة', suitable_for_en: 'Rice, flour, coarse grains', is_active: true },
  { id: 'pk3', type: 'Master Carton', type_ar: 'كرتون ماستر', size: '30×20×15 سم', dims_cm: '30×20×15 سم', max_weight_kg: 12, units_per_carton: 12, cartons_per_pallet: 80, material: 'Corrugated B-flute', material_ar: 'كرتون مموج B', cost_aed: 3.5, suitable_for_ar: 'علب معلبة، منتجات خفيفة الوزن', suitable_for_en: 'Canned goods, lightweight products', is_active: true },
  { id: 'pk4', type: 'Master Carton', type_ar: 'كرتون ماستر', size: '40×30×20 سم', dims_cm: '40×30×20 سم', max_weight_kg: 20, units_per_carton: 24, cartons_per_pallet: 50, material: 'Corrugated C-flute', material_ar: 'كرتون مموج C', cost_aed: 5.0, suitable_for_ar: 'عبوات زجاجية، زجاجات بلاستيك', suitable_for_en: 'Glass jars, plastic bottles', is_active: true },
  { id: 'pk5', type: 'Master Carton', type_ar: 'كرتون ماستر', size: '60×40×30 سم', dims_cm: '60×40×30 سم', max_weight_kg: 30, units_per_carton: 48, cartons_per_pallet: 30, material: 'Corrugated BC-flute', material_ar: 'كرتون مموج BC', cost_aed: 8.0, suitable_for_ar: 'معلبات ثقيلة، زيوت', suitable_for_en: 'Heavy cans, oils', is_active: true },
  { id: 'pk6', type: 'Shrink Wrap', type_ar: 'تغليف حراري', size: 'قياسي', dims_cm: '—', max_weight_kg: 5, units_per_carton: 6, cartons_per_pallet: 0, material: 'PE Film', material_ar: 'فيلم بولي إيثيلين', cost_aed: 0.3, suitable_for_ar: 'زجاجات مياه، عبوات عصير', suitable_for_en: 'Water bottles, juice packs', is_active: true },
  { id: 'pk7', type: 'Pallet', type_ar: 'طبليّة', size: '80×120 سم', dims_cm: '80×120×14 سم', max_weight_kg: 1000, units_per_carton: 0, cartons_per_pallet: 0, material: 'Plastic HDPE', material_ar: 'بلاستيك HDPE', cost_aed: 45, suitable_for_ar: 'جميع أنواع الشحن', suitable_for_en: 'All shipment types', is_active: true },
]

const EMPTY: Partial<PackagingSpec> = { type: 'Bag', type_ar: 'كيس', size: '', dims_cm: '', max_weight_kg: 0, units_per_carton: 12, cartons_per_pallet: 0, material: '', material_ar: '', cost_aed: 0, suitable_for_ar: '', suitable_for_en: '', is_active: true }

export default function DashboardPackaging() {
  const [specs, setSpecs] = useState<PackagingSpec[]>(INITIAL)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Partial<PackagingSpec>>(EMPTY)
  const [isEditing, setIsEditing] = useState(false)

  function openAdd() {
    setEditItem({ ...EMPTY, id: 'pk' + Date.now() })
    setIsEditing(false)
    setShowModal(true)
  }

  function openEdit(s: PackagingSpec) {
    setEditItem({ ...s })
    setIsEditing(true)
    setShowModal(true)
  }

  function handleSave() {
    if (!editItem.size || !editItem.type_ar) return
    if (isEditing) {
      setSpecs(prev => prev.map(s => s.id === editItem.id ? { ...s, ...editItem } as PackagingSpec : s))
    } else {
      setSpecs(prev => [...prev, editItem as PackagingSpec])
    }
    setShowModal(false)
  }

  function deleteSpec(id: string) {
    setSpecs(prev => prev.filter(s => s.id !== id))
  }

  const PKG_TYPES = ['Bag', 'Master Carton', 'Shrink Wrap', 'Pallet', 'Can', 'Bottle', 'Pouch']
  const PKG_TYPES_AR = ['كيس', 'كرتون ماستر', 'تغليف حراري', 'طبليّة', 'علبة معدنية', 'زجاجة/بلاستيك', 'كيس مضغوط']

  return (
    <div className="px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">مواصفات التعبئة</h1>
          <p className="text-gray-400 text-sm mt-0.5">الأحجام القياسية والمواد والتكاليف — تُستخدم في حساب خطط التوريد</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm text-sm">
          <Plus className="w-4 h-4" /> مواصفة جديدة
        </button>
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {specs.map(s => (
          <div key={s.id} className={`bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all ${!s.is_active ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-xs bg-orange-100 text-orange-700 rounded-full px-2.5 py-0.5 font-bold">{s.type_ar}</span>
                <h3 className="font-black text-gray-900 text-lg mt-1">{s.size}</h3>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => deleteSpec(s.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-gray-400">الأبعاد</span><span className="font-semibold text-gray-700">{s.dims_cm}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">الحد الأقصى</span><span className="font-semibold text-gray-700">{s.max_weight_kg} كجم</span></div>
              <div className="flex justify-between"><span className="text-gray-400">وحدة/كرتون</span><span className="font-semibold text-gray-700">{s.units_per_carton || '—'}</span></div>
              {s.cartons_per_pallet > 0 && <div className="flex justify-between"><span className="text-gray-400">كرتون/طبليّة</span><span className="font-semibold text-gray-700">{s.cartons_per_pallet}</span></div>}
              <div className="flex justify-between"><span className="text-gray-400">المادة</span><span className="font-semibold text-gray-700">{s.material_ar}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">التكلفة</span><span className="font-bold text-orange-500">{s.cost_aed} AED</span></div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 leading-relaxed">{s.suitable_for_ar}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-gray-900">{isEditing ? 'تعديل المواصفة' : 'مواصفة تعبئة جديدة'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">النوع بالعربية *</label>
                  <select value={editItem.type_ar || ''} onChange={e => {
                    const idx = PKG_TYPES_AR.indexOf(e.target.value)
                    setEditItem(p => ({ ...p, type_ar: e.target.value, type: PKG_TYPES[idx] || e.target.value }))
                  }} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 cursor-pointer">
                    {PKG_TYPES_AR.map((t, i) => <option key={i} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">الحجم / المقاس *</label>
                  <input value={editItem.size || ''} onChange={e => setEditItem(p => ({ ...p, size: e.target.value }))}
                    placeholder="مثال: 5kg أو 30×20×15" dir="ltr"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">الأبعاد (سم)</label>
                <input value={editItem.dims_cm || ''} onChange={e => setEditItem(p => ({ ...p, dims_cm: e.target.value }))}
                  placeholder="مثال: 30×20×15 سم" dir="ltr"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">وزن أقصى (كجم)</label>
                  <input type="number" value={editItem.max_weight_kg || 0} onChange={e => setEditItem(p => ({ ...p, max_weight_kg: +e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" dir="ltr" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">وحدة/كرتون</label>
                  <input type="number" value={editItem.units_per_carton || 0} onChange={e => setEditItem(p => ({ ...p, units_per_carton: +e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" dir="ltr" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">كرتون/طبليّة</label>
                  <input type="number" value={editItem.cartons_per_pallet || 0} onChange={e => setEditItem(p => ({ ...p, cartons_per_pallet: +e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" dir="ltr" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">المادة (AR)</label>
                  <input value={editItem.material_ar || ''} onChange={e => setEditItem(p => ({ ...p, material_ar: e.target.value }))}
                    placeholder="مثال: كرتون مموج B" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">المادة (EN)</label>
                  <input value={editItem.material || ''} onChange={e => setEditItem(p => ({ ...p, material: e.target.value }))}
                    placeholder="e.g. Corrugated B-flute" dir="ltr" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">التكلفة (AED)</label>
                <input type="number" step="0.1" value={editItem.cost_aed || 0} onChange={e => setEditItem(p => ({ ...p, cost_aed: +e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" dir="ltr" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">مناسب لـ (AR)</label>
                <input value={editItem.suitable_for_ar || ''} onChange={e => setEditItem(p => ({ ...p, suitable_for_ar: e.target.value }))}
                  placeholder="مثال: أرز، سكر، دقيق" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">مناسب لـ (EN)</label>
                <input value={editItem.suitable_for_en || ''} onChange={e => setEditItem(p => ({ ...p, suitable_for_en: e.target.value }))}
                  placeholder="e.g. Rice, sugar, flour" dir="ltr" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editItem.is_active || false} onChange={e => setEditItem(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 accent-orange-500" />
                <span className="text-sm text-gray-700">مواصفة نشطة</span>
              </label>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3">
              <button onClick={handleSave} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl transition-colors">حفظ</button>
              <button onClick={() => setShowModal(false)} className="px-5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors font-medium">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
