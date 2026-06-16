'use client'
import { useState } from 'react'
import { Plus, Edit2, X, Search, ShieldCheck } from 'lucide-react'

interface ComplianceRule {
  id: string
  standard: string
  clause: string
  severity: 'critical' | 'major' | 'minor'
  requirement_ar: string
  requirement_en: string
  product_classes: string[]
  auto_fail: boolean
  note_ar: string
  is_active: boolean
}

const SEVERITY_CONFIG = {
  critical: { label_ar: 'حرج', label_en: 'Critical', cls: 'bg-red-100 text-red-700' },
  major: { label_ar: 'رئيسي', label_en: 'Major', cls: 'bg-amber-100 text-amber-700' },
  minor: { label_ar: 'ثانوي', label_en: 'Minor', cls: 'bg-gray-100 text-gray-600' },
}

const PRODUCT_CLASSES_ALL = [
  { value: 'food_general', label: 'غذاء عام' },
  { value: 'beverage_general', label: 'مشروب عام' },
  { value: 'beverage_energy', label: 'مشروب طاقة' },
  { value: 'dairy', label: 'منتجات ألبان' },
  { value: 'meat', label: 'لحوم ودواجن' },
  { value: 'confectionery', label: 'حلويات' },
  { value: 'snack', label: 'وجبات خفيفة' },
  { value: 'oil', label: 'زيوت ودهون' },
  { value: 'dietary_supplement', label: 'مكمل غذائي' },
]

const INITIAL_RULES: ComplianceRule[] = [
  { id: 'r01', standard: 'UAE.S 9:2019', clause: '7.2.1', severity: 'critical', requirement_ar: 'الاسم الغذائي للمنتج يجب أن يكون باللغة العربية', requirement_en: 'Product name must be in Arabic language', product_classes: ['food_general', 'beverage_general', 'beverage_energy', 'dairy', 'snack', 'oil'], auto_fail: true, note_ar: '', is_active: true },
  { id: 'r02', standard: 'UAE.S 9:2019', clause: '7.2.1', severity: 'critical', requirement_ar: 'تاريخ الإنتاج وتاريخ الانتهاء باللغة العربية', requirement_en: 'Production and expiry dates must be in Arabic', product_classes: ['food_general', 'beverage_general', 'beverage_energy', 'dairy', 'snack', 'oil', 'meat'], auto_fail: true, note_ar: '', is_active: true },
  { id: 'r03', standard: 'UAE.S 9:2019', clause: '5.1', severity: 'critical', requirement_ar: 'قائمة المكونات بالترتيب التنازلي للوزن باللغة العربية', requirement_en: 'Ingredient list in descending order by weight in Arabic', product_classes: ['food_general', 'beverage_general', 'beverage_energy', 'dairy', 'snack'], auto_fail: true, note_ar: '', is_active: true },
  { id: 'r04', standard: 'UAE.S 9:2019', clause: '5.2.4', severity: 'major', requirement_ar: 'إضافات الغذاء يجب الإشارة إليها برقم E أو اسمها الكامل', requirement_en: 'Food additives must be declared by E-number or full name', product_classes: ['food_general', 'beverage_general', 'beverage_energy', 'snack'], auto_fail: false, note_ar: 'مثال: E211 بنزوات الصوديوم', is_active: true },
  { id: 'r05', standard: 'UAE.S 9:2019', clause: '7.2.1', severity: 'critical', requirement_ar: 'ظروف التخزين باللغة العربية', requirement_en: 'Storage conditions in Arabic language', product_classes: ['food_general', 'beverage_general', 'dairy', 'meat'], auto_fail: true, note_ar: '', is_active: true },
  { id: 'r06', standard: 'UAE.S 9:2019', clause: '7.2.1', severity: 'critical', requirement_ar: 'بلد المنشأ مذكور بوضوح على البطاقة', requirement_en: 'Country of origin clearly stated on label', product_classes: ['food_general', 'beverage_general', 'beverage_energy', 'dairy', 'snack', 'oil', 'meat'], auto_fail: true, note_ar: '', is_active: true },
  { id: 'r07', standard: 'UAE.S 9:2019', clause: '7.2.1', severity: 'critical', requirement_ar: 'الوزن أو الحجم الصافي بالوحدات المترية', requirement_en: 'Net weight or volume in metric units', product_classes: ['food_general', 'beverage_general', 'beverage_energy', 'dairy', 'snack', 'oil'], auto_fail: true, note_ar: '', is_active: true },
  { id: 'r08', standard: 'UAE.S 1926:2015', clause: '5.3', severity: 'critical', requirement_ar: 'مشروبات الطاقة: الكافيين ≤ 400mg/L', requirement_en: 'Energy drinks: caffeine ≤ 400mg/L', product_classes: ['beverage_energy'], auto_fail: true, note_ar: 'إذا تجاوز الحد يرفض التسجيل', is_active: true },
  { id: 'r09', standard: 'UAE.S 1926:2015', clause: '7.1', severity: 'critical', requirement_ar: 'مشروبات الطاقة: تحذير "غير مناسب للأطفال والحوامل"', requirement_en: 'Energy drinks: warning "not suitable for children and pregnant"', product_classes: ['beverage_energy'], auto_fail: true, note_ar: '', is_active: true },
  { id: 'r10', standard: 'UAE.S 9:2019', clause: '8.1', severity: 'major', requirement_ar: 'المواد المسببة للحساسية (السلفايت) يجب الإعلان عنها', requirement_en: 'Allergens (sulfites) must be declared', product_classes: ['food_general', 'beverage_general', 'snack'], auto_fail: false, note_ar: 'سلفايت > 10mg/kg يجب ذكره', is_active: true },
  { id: 'r11', standard: 'ESMA', clause: 'Reg. 2023', severity: 'critical', requirement_ar: 'شهادة الحلال لمنتجات اللحوم والدواجن والجيلاتين', requirement_en: 'Halal certificate for meat, poultry and gelatin products', product_classes: ['meat', 'confectionery', 'dairy'], auto_fail: true, note_ar: 'معتمدة من جهة إسلامية معترف بها', is_active: true },
  { id: 'r12', standard: 'UAE.S 9:2019', clause: '5.4', severity: 'minor', requirement_ar: 'تعليمات الاستخدام أو التحضير إذا لزم الأمر', requirement_en: 'Instructions for use or preparation if required', product_classes: ['food_general', 'dietary_supplement'], auto_fail: false, note_ar: '', is_active: true },
]

const EMPTY: Partial<ComplianceRule> = {
  standard: 'UAE.S 9:2019', clause: '', severity: 'major',
  requirement_ar: '', requirement_en: '',
  product_classes: [], auto_fail: false, note_ar: '', is_active: true,
}

export default function DashboardComplianceRules() {
  const [rules, setRules] = useState<ComplianceRule[]>(INITIAL_RULES)
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Partial<ComplianceRule>>(EMPTY)
  const [isEditing, setIsEditing] = useState(false)

  const filtered = rules.filter(r => {
    const q = search.toLowerCase()
    const matchQ = !q || r.requirement_ar.includes(search) || r.requirement_en.toLowerCase().includes(q) || r.clause.includes(q) || r.standard.toLowerCase().includes(q)
    const matchCls = !classFilter || r.product_classes.includes(classFilter)
    const matchSev = !severityFilter || r.severity === severityFilter
    return matchQ && matchCls && matchSev && r.is_active
  })

  function openAdd() {
    setEditItem({ ...EMPTY, id: 'r' + Date.now() })
    setIsEditing(false)
    setShowModal(true)
  }

  function openEdit(r: ComplianceRule) {
    setEditItem({ ...r })
    setIsEditing(true)
    setShowModal(true)
  }

  function handleSave() {
    if (!editItem.requirement_ar || !editItem.clause) return
    if (isEditing) {
      setRules(prev => prev.map(r => r.id === editItem.id ? { ...r, ...editItem } as ComplianceRule : r))
    } else {
      setRules(prev => [...prev, editItem as ComplianceRule])
    }
    setShowModal(false)
  }

  function toggleClass(cls: string) {
    setEditItem(prev => {
      const cur = prev.product_classes || []
      return { ...prev, product_classes: cur.includes(cls) ? cur.filter(c => c !== cls) : [...cur, cls] }
    })
  }

  const STANDARDS = ['UAE.S 9:2019', 'UAE.S 1926:2015', 'ESMA', 'ADAFSA', 'Codex Alimentarius']

  return (
    <div className="px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">اشتراطات التسجيل</h1>
          <p className="text-gray-400 text-sm mt-0.5">{rules.filter(r => r.is_active).length} اشتراط نشط — UAE.S · ESMA · ADAFSA</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm text-sm">
          <Plus className="w-4 h-4" /> اشتراط جديد
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ابحث في الاشتراطات..."
            className="w-full border border-gray-200 rounded-xl pr-9 pl-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:border-orange-400" />
        </div>
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-600 bg-white focus:outline-none focus:border-orange-400 cursor-pointer min-w-36">
          <option value="">كل الفئات</option>
          {PRODUCT_CLASSES_ALL.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-600 bg-white focus:outline-none focus:border-orange-400 cursor-pointer">
          <option value="">كل المستويات</option>
          <option value="critical">حرج</option>
          <option value="major">رئيسي</option>
          <option value="minor">ثانوي</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'حرج', count: rules.filter(r => r.severity === 'critical' && r.is_active).length, cls: 'bg-red-50 border-red-200 text-red-700' },
          { label: 'رئيسي', count: rules.filter(r => r.severity === 'major' && r.is_active).length, cls: 'bg-amber-50 border-amber-200 text-amber-700' },
          { label: 'ثانوي', count: rules.filter(r => r.severity === 'minor' && r.is_active).length, cls: 'bg-gray-50 border-gray-200 text-gray-600' },
        ].map((s, i) => (
          <div key={i} className={`border rounded-xl px-4 py-3 flex items-center justify-between ${s.cls}`}>
            <span className="text-sm font-bold">{s.label}</span>
            <span className="text-2xl font-black">{s.count}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-right py-3 px-4 font-bold text-gray-500 text-xs">المعيار / البند</th>
                <th className="text-right py-3 px-4 font-bold text-gray-500 text-xs">الاشتراط</th>
                <th className="text-right py-3 px-4 font-bold text-gray-500 text-xs hidden md:table-cell">الفئات</th>
                <th className="text-right py-3 px-4 font-bold text-gray-500 text-xs">المستوى</th>
                <th className="text-right py-3 px-4 font-bold text-gray-500 text-xs hidden lg:table-cell">رفض تلقائي</th>
                <th className="text-right py-3 px-4 font-bold text-gray-500 text-xs">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const sev = SEVERITY_CONFIG[r.severity]
                return (
                  <tr key={r.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="text-xs font-bold text-orange-500">{r.standard}</div>
                      <div className="text-xs text-gray-400">البند {r.clause}</div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-medium text-gray-900 text-sm">{r.requirement_ar}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{r.requirement_en}</div>
                      {r.note_ar && <div className="text-xs text-amber-600 mt-0.5">⚠ {r.note_ar}</div>}
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {r.product_classes.slice(0, 3).map(cls => {
                          const found = PRODUCT_CLASSES_ALL.find(c => c.value === cls)
                          return <span key={cls} className="text-[9px] bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-1.5 py-0.5">{found?.label || cls}</span>
                        })}
                        {r.product_classes.length > 3 && <span className="text-[9px] text-gray-400">+{r.product_classes.length - 3}</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sev.cls}`}>{sev.label_ar}</span>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <span className={`text-[10px] font-bold ${r.auto_fail ? 'text-red-600' : 'text-gray-400'}`}>
                        {r.auto_fail ? '✗ يرفض تلقائياً' : '⚠ تحتاج مراجعة'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={() => openEdit(r)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-orange-600 hover:bg-orange-50 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-orange-200 transition-colors font-semibold">
                        <Edit2 className="w-3.5 h-3.5" /> تعديل
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">لا توجد اشتراطات مطابقة</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-gray-900">{isEditing ? 'تعديل الاشتراط' : 'اشتراط جديد'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">المعيار</label>
                  <select value={editItem.standard || 'UAE.S 9:2019'} onChange={e => setEditItem(p => ({ ...p, standard: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 cursor-pointer">
                    {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">رقم البند / المادة *</label>
                  <input value={editItem.clause || ''} onChange={e => setEditItem(p => ({ ...p, clause: e.target.value }))}
                    placeholder="مثال: 7.2.1" dir="ltr"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">الاشتراط بالعربية *</label>
                <textarea value={editItem.requirement_ar || ''} onChange={e => setEditItem(p => ({ ...p, requirement_ar: e.target.value }))}
                  rows={2} placeholder="اكتب الاشتراط كما هو في المعيار"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">الاشتراط بالإنجليزية</label>
                <textarea value={editItem.requirement_en || ''} onChange={e => setEditItem(p => ({ ...p, requirement_en: e.target.value }))}
                  rows={2} dir="ltr" placeholder="Requirement in English"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">ملاحظة / توضيح</label>
                <input value={editItem.note_ar || ''} onChange={e => setEditItem(p => ({ ...p, note_ar: e.target.value }))}
                  placeholder="ملاحظة إضافية..." className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">مستوى الأهمية</label>
                <div className="flex gap-2">
                  {(['critical', 'major', 'minor'] as const).map(sev => (
                    <button key={sev} type="button" onClick={() => setEditItem(p => ({ ...p, severity: sev }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${editItem.severity === sev ? SEVERITY_CONFIG[sev].cls + ' border-current' : 'bg-white border-gray-200 text-gray-500'}`}>
                      {SEVERITY_CONFIG[sev].label_ar}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">ينطبق على الفئات</label>
                <div className="flex flex-wrap gap-2">
                  {PRODUCT_CLASSES_ALL.map(c => {
                    const selected = (editItem.product_classes || []).includes(c.value)
                    return (
                      <button key={c.value} type="button" onClick={() => toggleClass(c.value)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${selected ? 'bg-orange-100 border-orange-300 text-orange-700' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                        {c.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editItem.auto_fail || false} onChange={e => setEditItem(p => ({ ...p, auto_fail: e.target.checked }))} className="w-4 h-4 accent-red-500" />
                <span className="text-sm text-gray-700">رفض تلقائي عند الفشل (لا يمكن التسجيل)</span>
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
