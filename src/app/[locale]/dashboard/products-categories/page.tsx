'use client'
import { useState, useEffect, useTransition } from 'react'
import { Plus, Edit2, ChevronDown, ChevronRight, Eye, EyeOff, X, Trash2, Loader2 } from 'lucide-react'
import { getCategories, upsertCategory, toggleCategoryActive, upsertSubcategory, deleteSubcategory } from '@/lib/supabase/actions'

type SubCat = { id: string; name_ar: string; name_en: string; sort_order: number }
type MainCat = { id: string; name_ar: string; name_en: string; icon: string; sort_order: number; is_active: boolean; product_subcategories: SubCat[] }
type ModalMode = 'add-main' | 'edit-main' | 'add-sub' | 'edit-sub' | null

export default function DashboardCategories() {
  const [categories, setCategories] = useState<MainCat[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [parentId, setParentId] = useState('')
  const [form, setForm] = useState({ id: '', name_ar: '', name_en: '', icon: '📦', sort_order: 0, is_active: true })
  const [subForm, setSubForm] = useState({ id: '', name_ar: '', name_en: '', category_id: '' })
  const [saving, setSaving] = useState(false)
  const [, startTransition] = useTransition()

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { setCategories(await getCategories() as MainCat[]) } catch {}
    setLoading(false)
  }

  function toggle(id: string) {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function openAddMain() {
    setForm({ id: '', name_ar: '', name_en: '', icon: '📦', sort_order: categories.length + 1, is_active: true })
    setModalMode('add-main')
  }

  function openEditMain(cat: MainCat) {
    setForm({ id: cat.id, name_ar: cat.name_ar, name_en: cat.name_en, icon: cat.icon, sort_order: cat.sort_order, is_active: cat.is_active })
    setModalMode('edit-main')
  }

  function openAddSub(catId: string) {
    setParentId(catId)
    setSubForm({ id: '', name_ar: '', name_en: '', category_id: catId })
    setModalMode('add-sub')
  }

  function openEditSub(catId: string, sub: SubCat) {
    setParentId(catId)
    setSubForm({ id: sub.id, name_ar: sub.name_ar, name_en: sub.name_en, category_id: catId })
    setModalMode('edit-sub')
  }

  async function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      await toggleCategoryActive(id, !current)
      setCategories(prev => prev.map(c => c.id === id ? { ...c, is_active: !current } : c))
    })
  }

  async function saveMain() {
    if (!form.name_ar || !form.name_en) return
    setSaving(true)
    try {
      const payload: Record<string, unknown> = { name_ar: form.name_ar, name_en: form.name_en, icon: form.icon, sort_order: form.sort_order, is_active: form.is_active, slug: form.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-') }
      if (form.id) payload.id = form.id
      const saved = await upsertCategory(payload) as MainCat
      if (modalMode === 'edit-main') {
        setCategories(prev => prev.map(c => c.id === saved.id ? { ...c, ...saved } : c))
      } else {
        setCategories(prev => [...prev, { ...saved, product_subcategories: [] }])
      }
      setModalMode(null)
    } catch { alert('خطأ في الحفظ') }
    setSaving(false)
  }

  async function saveSub() {
    if (!subForm.name_ar || !subForm.name_en) return
    setSaving(true)
    try {
      const payload: Record<string, unknown> = { name_ar: subForm.name_ar, name_en: subForm.name_en, category_id: parentId }
      if (subForm.id) payload.id = subForm.id
      const saved = await upsertSubcategory(payload) as SubCat
      setCategories(prev => prev.map(c => {
        if (c.id !== parentId) return c
        const subs = c.product_subcategories
        if (modalMode === 'add-sub') return { ...c, product_subcategories: [...subs, saved] }
        return { ...c, product_subcategories: subs.map(s => s.id === saved.id ? saved : s) }
      }))
      setModalMode(null)
    } catch { alert('خطأ في الحفظ') }
    setSaving(false)
  }

  async function handleDeleteSub(catId: string, subId: string) {
    if (!confirm('حذف التصنيف الفرعي؟')) return
    startTransition(async () => {
      await deleteSubcategory(subId)
      setCategories(prev => prev.map(c => c.id === catId ? { ...c, product_subcategories: c.product_subcategories.filter(s => s.id !== subId) } : c))
    })
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
    </div>
  )

  return (
    <div className="px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">تصنيفات المنتجات</h1>
          <p className="text-gray-400 text-sm mt-0.5">{categories.length} تصنيف رئيسي · {categories.reduce((a, c) => a + c.product_subcategories.length, 0)} فرعي</p>
        </div>
        <button onClick={openAddMain} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm text-sm">
          <Plus className="w-4 h-4" /> تصنيف جديد
        </button>
      </div>

      <div className="space-y-2">
        {categories.map(cat => (
          <div key={cat.id} className={`bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm ${!cat.is_active ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-3 px-5 py-4">
              <button onClick={() => toggle(cat.id)} className="text-gray-400 hover:text-gray-700">
                {expanded.has(cat.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              <span className="text-xl">{cat.icon}</span>
              <div className="flex-1">
                <div className="font-bold text-gray-900">{cat.name_ar}</div>
                <div className="text-xs text-gray-400">{cat.name_en} · {cat.product_subcategories.length} تصنيف فرعي</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleToggle(cat.id, cat.is_active)}
                  className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cat.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {cat.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {cat.is_active ? 'نشط' : 'مخفي'}
                </button>
                <button onClick={() => openEditMain(cat)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-orange-600 hover:bg-orange-50 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-orange-200 transition-colors font-semibold">
                  <Edit2 className="w-3.5 h-3.5" /> تعديل
                </button>
              </div>
            </div>

            {expanded.has(cat.id) && (
              <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">
                <div className="space-y-1 mb-3">
                  {cat.product_subcategories.map(sub => (
                    <div key={sub.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-800">{sub.name_ar}</span>
                        <span className="text-xs text-gray-400 mx-2">·</span>
                        <span className="text-xs text-gray-400">{sub.name_en}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEditSub(cat.id, sub)} className="text-gray-400 hover:text-orange-500 p-1 rounded-lg hover:bg-orange-50">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteSub(cat.id, sub.id)} className="text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {cat.product_subcategories.length === 0 && <p className="text-sm text-gray-400 text-center py-2">لا توجد تصنيفات فرعية</p>}
                </div>
                <button onClick={() => openAddSub(cat.id)} className="flex items-center gap-2 text-sm text-orange-600 font-semibold px-3 py-2 rounded-lg hover:bg-orange-50 border border-dashed border-orange-200 w-full justify-center">
                  <Plus className="w-3.5 h-3.5" /> إضافة تصنيف فرعي
                </button>
              </div>
            )}
          </div>
        ))}
        {categories.length === 0 && (
          <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-12 text-center">
            <p className="text-gray-400">لا توجد تصنيفات — اضغط "تصنيف جديد"</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setModalMode(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-gray-900">
                {modalMode === 'add-main' && 'تصنيف رئيسي جديد'}
                {modalMode === 'edit-main' && 'تعديل التصنيف'}
                {modalMode === 'add-sub' && 'تصنيف فرعي جديد'}
                {modalMode === 'edit-sub' && 'تعديل الفرعي'}
              </h2>
              <button onClick={() => setModalMode(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {(modalMode === 'add-main' || modalMode === 'edit-main') ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-2xl">{form.icon}</div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">الأيقونة (Emoji)</label>
                      <input value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} className={`w-20 ${inputCls}`} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">الاسم بالعربية *</label>
                    <input value={form.name_ar} onChange={e => setForm(p => ({ ...p, name_ar: e.target.value }))} placeholder="مثال: مشروبات" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">الاسم بالإنجليزية *</label>
                    <input value={form.name_en} onChange={e => setForm(p => ({ ...p, name_en: e.target.value }))} dir="ltr" placeholder="e.g. Beverages" className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">الترتيب</label>
                      <input type="number" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: +e.target.value }))} className={inputCls} dir="ltr" />
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 cursor-pointer py-2.5">
                        <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 accent-orange-500" />
                        <span className="text-sm text-gray-700">نشط</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={saveMain} disabled={saving} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />} حفظ
                    </button>
                    <button onClick={() => setModalMode(null)} className="px-5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium">إلغاء</button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">الاسم بالعربية *</label>
                    <input value={subForm.name_ar} onChange={e => setSubForm(p => ({ ...p, name_ar: e.target.value }))} placeholder="مثال: مياه معبأة" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">الاسم بالإنجليزية *</label>
                    <input value={subForm.name_en} onChange={e => setSubForm(p => ({ ...p, name_en: e.target.value }))} dir="ltr" placeholder="e.g. Bottled Water" className={inputCls} />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={saveSub} disabled={saving} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />} حفظ
                    </button>
                    <button onClick={() => setModalMode(null)} className="px-5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium">إلغاء</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 bg-white'
