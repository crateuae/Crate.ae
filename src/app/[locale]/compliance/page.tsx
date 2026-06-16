'use client'
import { useState, useRef, KeyboardEvent } from 'react'
import { ShieldCheck, ShieldX, AlertTriangle, CheckCircle, XCircle, Loader2, Plus, X } from 'lucide-react'

const PRODUCT_CLASSES = [
  { value: 'beverage_general', label_ar: 'مشروب عام', label_en: 'General Beverage', cols_ar: ['القيمة/100ml', 'الحجم الصافي'], cols_en: ['Value/100ml', 'Net Volume'] },
  { value: 'beverage_energy', label_ar: 'مشروب طاقة', label_en: 'Energy Drink', cols_ar: ['الكافيين mg', 'السكر g/100ml', 'الحجم ml'], cols_en: ['Caffeine mg', 'Sugar g/100ml', 'Volume ml'] },
  { value: 'food_general', label_ar: 'غذاء عام', label_en: 'General Food', cols_ar: ['القيمة/100g', 'الدهون g', 'الكربوهيدرات g'], cols_en: ['Value/100g', 'Fat g', 'Carbs g'] },
  { value: 'dairy', label_ar: 'منتجات ألبان', label_en: 'Dairy', cols_ar: ['الدهون %', 'البروتين g', 'اللاكتوز g'], cols_en: ['Fat %', 'Protein g', 'Lactose g'] },
  { value: 'meat', label_ar: 'لحوم ودواجن', label_en: 'Meat & Poultry', cols_ar: ['الدهون %', 'البروتين g', 'الملح g'], cols_en: ['Fat %', 'Protein g', 'Salt g'] },
  { value: 'confectionery', label_ar: 'حلويات وسكاكر', label_en: 'Confectionery', cols_ar: ['السعرات/100g', 'السكر g', 'الدهون المشبعة g'], cols_en: ['Calories/100g', 'Sugar g', 'Sat. Fat g'] },
  { value: 'snack', label_ar: 'وجبات خفيفة', label_en: 'Snacks', cols_ar: ['السعرات/100g', 'الدهون g', 'الملح g'], cols_en: ['Calories/100g', 'Fat g', 'Salt g'] },
  { value: 'oil', label_ar: 'زيوت ودهون', label_en: 'Oils & Fats', cols_ar: ['الدهون المشبعة %', 'فيتامين E mg', 'الحجم ml'], cols_en: ['Sat. Fat %', 'Vitamin E mg', 'Volume ml'] },
  { value: 'dietary_supplement', label_ar: 'مكمل غذائي', label_en: 'Dietary Supplement', cols_ar: ['الكمية الموصى بها', 'نسبة الاحتياج اليومي', 'وحدة القياس'], cols_en: ['Recommended Amount', 'Daily Value %', 'Unit'] },
]

interface TableRow { ingredient: string; values: string[] }

interface CheckItem {
  clause: string
  requirement_en: string
  requirement_ar: string
  note?: string
}

interface ComplianceResult {
  standard: string
  verdict: 'registerable' | 'not_registerable' | 'needs_review'
  passed: CheckItem[]
  failed: CheckItem[]
  missing_count: number
  summary_ar: string
  summary_en: string
}

export default function CompliancePage() {
  const [productName, setProductName] = useState('Dr Pepper Strawberry 355ml')
  const [productClass, setProductClass] = useState('beverage_general')
  const [ingredients, setIngredients] = useState<string[]>(['ماء', 'سكر', 'حمض الفوسفوريك', 'كافيين', 'E211', 'نكهات طبيعية'])
  const [chipInput, setChipInput] = useState('')
  const [tableRows, setTableRows] = useState<TableRow[]>([
    { ingredient: 'ماء / Water', values: ['—', '355ml'] },
    { ingredient: 'سكر / Sugar', values: ['11g', '—'] },
    { ingredient: 'كافيين / Caffeine', values: ['32mg', '—'] },
    { ingredient: 'حمض الفوسفوريك', values: ['0.05g', '—'] },
    { ingredient: 'E211 بنزوات صوديوم', values: ['0.1g', '—'] },
  ])
  const [labelText, setLabelText] = useState('')
  const [caffeine, setCaffeine] = useState('32')
  const [hasSulfites, setHasSulfites] = useState(false)
  const [result, setResult] = useState<ComplianceResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedClass = PRODUCT_CLASSES.find(c => c.value === productClass) || PRODUCT_CLASSES[0]

  function addChip(val: string) {
    const trimmed = val.trim().replace(/,$|،$/, '')
    if (!trimmed || ingredients.includes(trimmed)) return
    setIngredients(prev => [...prev, trimmed])
    setTableRows(prev => [...prev, { ingredient: trimmed, values: selectedClass.cols_ar.map(() => '—') }])
  }

  function handleChipKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',' || e.key === '،') {
      e.preventDefault()
      addChip(chipInput)
      setChipInput('')
    } else if (e.key === 'Backspace' && !chipInput && ingredients.length > 0) {
      setIngredients(prev => prev.slice(0, -1))
      setTableRows(prev => prev.slice(0, -1))
    }
  }

  function removeChip(idx: number) {
    setIngredients(prev => prev.filter((_, i) => i !== idx))
    setTableRows(prev => prev.filter((_, i) => i !== idx))
  }

  function updateTableRow(rowIdx: number, colIdx: number, val: string) {
    setTableRows(prev => prev.map((r, i) =>
      i === rowIdx ? { ...r, values: r.values.map((v, j) => j === colIdx ? val : v) } : r
    ))
  }

  function removeTableRow(idx: number) {
    setTableRows(prev => prev.filter((_, i) => i !== idx))
    setIngredients(prev => prev.filter((_, i) => i !== idx))
  }

  function addTableRow() {
    setTableRows(prev => [...prev, { ingredient: '', values: selectedClass.cols_ar.map(() => '—') }])
  }

  function handleClassChange(val: string) {
    setProductClass(val)
    const cls = PRODUCT_CLASSES.find(c => c.value === val) || PRODUCT_CLASSES[0]
    setTableRows(prev => prev.map(r => ({ ...r, values: cls.cols_ar.map(() => '—') })))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/compliance/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: productName,
          product_class: productClass,
          ingredients: ingredients.join(', '),
          label_text: labelText,
          caffeine_mg_per_100ml: caffeine,
          has_sulfites: hasSulfites,
        }),
      })
      if (!res.ok) throw new Error('Check failed')
      setResult(await res.json())
    } catch {
      setError('حدث خطأ أثناء الفحص. حاول مرة أخرى.')
    } finally {
      setLoading(false)
    }
  }

  const verdictConfig = {
    registerable: {
      icon: ShieldCheck,
      colorText: 'text-green-700',
      bg: 'bg-green-50 border-green-200',
      label_ar: 'قابل للتسجيل ✓',
      label_en: 'Registerable ✓',
    },
    not_registerable: {
      icon: ShieldX,
      colorText: 'text-red-700',
      bg: 'bg-red-50 border-red-200',
      label_ar: 'غير قابل للتسجيل',
      label_en: 'Not Registerable',
    },
    needs_review: {
      icon: AlertTriangle,
      colorText: 'text-amber-700',
      bg: 'bg-amber-50 border-amber-200',
      label_ar: 'يحتاج مراجعة',
      label_en: 'Needs Review',
    },
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">🛡 فاحص المطابقة</h1>
          <p className="text-gray-400 text-sm max-w-xl mx-auto">
            أدخل بيانات المنتج — يفحص ضد UAE.S ويعرض جميع النواقص دفعة واحدة لا شهراً كاملاً
          </p>
          <div className="inline-block mt-3 text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-full px-4 py-1.5 font-semibold">
            يغطي: UAE.S 9:2019 · UAE.S 1926:2015 · معايير ESMA
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* ── FORM ── */}
          <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">

            {/* Product Name */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">اسم المنتج *</label>
              <input
                type="text"
                required
                value={productName}
                onChange={e => setProductName(e.target.value)}
                placeholder="مثال: Dr Pepper Strawberry 355ml"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-colors"
              />
            </div>

            {/* Product Class */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">فئة المنتج *</label>
              <select
                value={productClass}
                onChange={e => handleClassChange(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-orange-400 transition-colors cursor-pointer"
              >
                {PRODUCT_CLASSES.map(c => (
                  <option key={c.value} value={c.value}>{c.label_ar} — {c.label_en}</option>
                ))}
              </select>
            </div>

            {/* Ingredient Chips */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                المكونات <span className="normal-case font-normal text-gray-400">(اكتب واضغط Enter أو فاصلة)</span>
              </label>
              <div
                className="border border-gray-200 rounded-xl p-3 min-h-[72px] bg-white cursor-text focus-within:border-orange-400 transition-colors"
                onClick={() => inputRef.current?.focus()}
              >
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {ingredients.map((ing, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-orange-50 border border-orange-200 text-orange-700 rounded-full px-3 py-1 text-xs font-semibold">
                      {ing}
                      <button type="button" onClick={() => removeChip(i)} className="opacity-60 hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  ref={inputRef}
                  value={chipInput}
                  onChange={e => setChipInput(e.target.value)}
                  onKeyDown={handleChipKey}
                  placeholder={ingredients.length === 0 ? 'ماء، سكر، كافيين...' : ''}
                  className="border-none outline-none text-xs text-gray-700 w-full bg-transparent placeholder-gray-400"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">💡 كل مكون تضيفه يظهر في الجدول أدناه ويُحلَّل تلقائياً</p>
            </div>

            {/* Dynamic Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  📊 جدول البيانات — {selectedClass.label_ar}
                </label>
                <button type="button" onClick={addTableRow}
                  className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-semibold">
                  <Plus className="w-3.5 h-3.5" /> إضافة صف
                </button>
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-right py-2 px-3 font-bold text-gray-500">المكوّن / Ingredient</th>
                      {selectedClass.cols_ar.map((col, i) => (
                        <th key={i} className="text-right py-2 px-2 font-bold text-gray-500 whitespace-nowrap">{col}</th>
                      ))}
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row, rowIdx) => (
                      <tr key={rowIdx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="py-1.5 px-3">
                          <input
                            value={row.ingredient}
                            onChange={e => setTableRows(prev => prev.map((r, i) => i === rowIdx ? { ...r, ingredient: e.target.value } : r))}
                            className="w-full bg-transparent border-none outline-none text-gray-700 placeholder-gray-400"
                            placeholder="اسم المكوّن"
                          />
                        </td>
                        {selectedClass.cols_ar.map((_, colIdx) => (
                          <td key={colIdx} className="py-1.5 px-2">
                            <input
                              value={row.values[colIdx] ?? '—'}
                              onChange={e => updateTableRow(rowIdx, colIdx, e.target.value)}
                              className="w-full bg-transparent border-none outline-none text-gray-600 text-center"
                            />
                          </td>
                        ))}
                        <td className="py-1.5 px-2 text-center">
                          <button type="button" onClick={() => removeTableRow(rowIdx)}
                            className="text-gray-300 hover:text-red-500 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {tableRows.length === 0 && (
                      <tr><td colSpan={selectedClass.cols_ar.length + 2} className="py-6 text-center text-gray-400 text-xs">أضف مكوناً من الحقل أعلاه</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Label text */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">نص البطاقة الحالي</label>
              <textarea
                value={labelText}
                onChange={e => setLabelText(e.target.value)}
                placeholder="الص البطاقة كما هو مكتوب على المنتج..."
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-colors resize-none"
              />
            </div>

            {/* Caffeine (beverages only) */}
            {(productClass === 'beverage_energy' || productClass === 'beverage_general') && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">الكافيين (mg/100ml)</label>
                <input
                  type="number"
                  value={caffeine}
                  onChange={e => setCaffeine(e.target.value)}
                  placeholder="اتركه فارغاً إذا لا يوجد"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:border-orange-400 transition-colors"
                />
              </div>
            )}

            {/* Sulfites */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasSulfites}
                onChange={e => setHasSulfites(e.target.checked)}
                className="w-4 h-4 rounded accent-orange-500"
              />
              <span className="text-sm text-gray-600">يحتوي على سلفايت (E220, E221, E222...)</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors shadow-sm"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
              {loading ? 'جاري الفحص...' : 'افحص المطابقة الآن'}
            </button>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          </form>

          {/* ── RESULT ── */}
          <div>
            {!result ? (
              <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-10 text-center h-full flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <ShieldCheck className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-400 font-medium">ستظهر نتائج الفحص هنا</p>
                <p className="text-gray-300 text-sm mt-1">يغطي الفحص جميع متطلبات UAE.S دفعة واحدة</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(() => {
                  const cfg = verdictConfig[result.verdict]
                  return (
                    <div className={`border-2 rounded-2xl p-5 ${cfg.bg}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <cfg.icon className={`w-7 h-7 ${cfg.colorText}`} />
                        <span className={`text-xl font-black ${cfg.colorText}`}>
                          {result.verdict === 'registerable' ? 'قابل للتسجيل ✓' :
                           result.verdict === 'not_registerable' ? 'غير قابل للتسجيل' : 'يحتاج مراجعة'}
                        </span>
                        {result.missing_count > 0 && (
                          <span className="bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full">
                            {result.missing_count} نقص
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">{result.standard}</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{result.summary_ar}</p>
                    </div>
                  )
                })()}

                {result.failed.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <h3 className="font-bold text-red-600 mb-4 flex items-center gap-2 text-sm">
                      <XCircle className="w-4 h-4" />
                      النواقص ({result.failed.length})
                    </h3>
                    <div className="space-y-2">
                      {result.failed.map((f, i) => (
                        <div key={i} className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                          <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-gray-900 font-medium">{f.requirement_ar}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{f.requirement_en}</p>
                            <p className="text-[10px] text-orange-500 font-semibold mt-0.5">{f.clause}</p>
                            {f.note && <p className="text-[10px] text-amber-600 mt-0.5">{f.note}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.passed.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <h3 className="font-bold text-green-600 mb-4 flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      المستوفى ({result.passed.length})
                    </h3>
                    <div className="space-y-1.5">
                      {result.passed.map((p, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{p.requirement_ar}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
