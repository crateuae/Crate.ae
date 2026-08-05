'use client'
import { useState, useRef, KeyboardEvent } from 'react'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { ShieldCheck, ShieldX, AlertTriangle, CheckCircle, XCircle, Loader2, Plus, X, ScanLine, Sparkles } from 'lucide-react'
import type { ScanResult } from './SmartScanner'
import OrderLabelCTA from './OrderLabelCTA'

// Lazy-loaded so the ~8 MB OpenCV.js pipeline never touches the initial page bundle
const SmartScanner = dynamic(() => import('./SmartScanner'), { ssr: false })

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
  note_ar?: string
  note_en?: string
}

interface ComplianceResult {
  standard: string
  verdict: 'registerable' | 'not_registerable' | 'needs_review'
  passed: CheckItem[]
  failed: CheckItem[]
  review?: CheckItem[]
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
  // When a scan supplies its own table columns, they override the class template
  // so the checker can accept ANY product's data shape.
  const [customCols, setCustomCols] = useState<string[] | null>(null)
  const [labelText, setLabelText] = useState('')
  const [caffeine, setCaffeine] = useState('32')
  const [hasSulfites, setHasSulfites] = useState(false)
  const [result, setResult] = useState<ComplianceResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const pathname = usePathname()
  const isAr = !pathname?.startsWith('/en')

  const t = isAr ? {
    title: '🛡 فاحص المطابقة',
    subtitle: 'أدخل بيانات المنتج — يفحص ضد UAE.S ويعرض جميع النواقص دفعة واحدة لا شهراً كاملاً',
    coverage: 'يغطي: UAE.S 9:2019 · UAE.S 1926:2015 · معايير ESMA',
    scanTitle: 'مسح ذكي بالكاميرا',
    scanSub: 'صوّر بطاقة المنتج — نقرأها ونملأ الحقول ونفحص المطابقة تلقائياً',
    orManual: 'أو أدخل البيانات يدوياً',
    productName: 'اسم المنتج *', productNamePh: 'مثال: Dr Pepper Strawberry 355ml',
    productClass: 'فئة المنتج *',
    ingredients: 'المكونات', ingredientsHint: '(اكتب واضغط Enter أو فاصلة)', ingredientsPh: 'ماء، سكر، كافيين...',
    ingredientsNote: '💡 أضف المكوّنات هنا، وجدول القيم الغذائية يُدار بشكل منفصل أدناه (أو يُملأ تلقائياً من المسح الذكي)',
    tableWord: 'جدول البيانات', fromScan: 'من المسح الذكي', addRow: 'إضافة صف',
    colItem: 'العنصر', colIngredient: 'المكوّن', rowNamePh: 'اسم العنصر',
    emptyTable: 'أضف صفاً أو امسح البطاقة لتعبئة الجدول تلقائياً',
    labelText: 'نص البطاقة الحالي', labelTextPh: 'الصق البطاقة كما هو مكتوب على المنتج...',
    caffeine: 'الكافيين (mg/100ml)', caffeinePh: 'اتركه فارغاً إذا لا يوجد',
    sulfites: 'يحتوي على سلفايت (E220, E221, E222...)',
    checkBtn: 'افحص المطابقة الآن', checking: 'جاري الفحص...',
    errMsg: 'حدث خطأ أثناء الفحص. حاول مرة أخرى.',
    emptyResult1: 'ستظهر نتائج الفحص هنا', emptyResult2: 'يغطي الفحص جميع متطلبات UAE.S دفعة واحدة',
    missing: 'نقص', failed: 'النواقص', review: 'تحقّق يدوياً على التصميم', passed: 'المستوفى',
  } : {
    title: '🛡 Compliance Checker',
    subtitle: 'Enter your product data — checked against UAE.S with every gap shown at once, not over a whole month',
    coverage: 'Covers: UAE.S 9:2019 · UAE.S 1926:2015 · ESMA standards',
    scanTitle: 'Smart camera scan',
    scanSub: 'Photograph the label — we read it, fill the fields, and check compliance automatically',
    orManual: 'or enter data manually',
    productName: 'Product name *', productNamePh: 'e.g. Dr Pepper Strawberry 355ml',
    productClass: 'Product class *',
    ingredients: 'Ingredients', ingredientsHint: '(type and press Enter or comma)', ingredientsPh: 'water, sugar, caffeine...',
    ingredientsNote: '💡 Add ingredients here; the nutrition table below is managed separately (or auto-filled from a smart scan)',
    tableWord: 'Data table', fromScan: 'from smart scan', addRow: 'Add row',
    colItem: 'Item', colIngredient: 'Ingredient', rowNamePh: 'Item name',
    emptyTable: 'Add a row or scan the label to auto-fill the table',
    labelText: 'Current label text', labelTextPh: 'Paste the label exactly as printed on the product...',
    caffeine: 'Caffeine (mg/100ml)', caffeinePh: 'Leave empty if none',
    sulfites: 'Contains sulfites (E220, E221, E222...)',
    checkBtn: 'Check compliance now', checking: 'Checking...',
    errMsg: 'An error occurred during the check. Please try again.',
    emptyResult1: 'Check results will appear here', emptyResult2: 'The check covers all UAE.S requirements at once',
    missing: 'missing', failed: 'Issues', review: 'Verify manually on the artwork', passed: 'Met',
  }

  const selectedClass = PRODUCT_CLASSES.find(c => c.value === productClass) || PRODUCT_CLASSES[0]
  // Effective table columns: a scan's own columns, else the locale class template.
  const cols = (customCols && customCols.length) ? customCols : (isAr ? selectedClass.cols_ar : selectedClass.cols_en)

  // Prefill the whole form from a Smart-Scan result and show its (deterministic) verdict.
  // Builds a FLEXIBLE table from whatever nutrition structure the label had.
  function applyScan(r: ScanResult) {
    const ex = r.extracted
    if (ex.product_name) setProductName(ex.product_name)
    if (ex.product_class) setProductClass(ex.product_class)
    if (Array.isArray(ex.ingredients)) setIngredients(ex.ingredients.map(String).filter(Boolean))

    const nut = ex.nutrition
    if (nut && Array.isArray(nut.rows) && nut.rows.length && Array.isArray(nut.columns) && nut.columns.length) {
      // Real nutrition table → use its own columns and values.
      const c: string[] = nut.columns.map((x: unknown) => String(x))
      setCustomCols(c)
      setTableRows(nut.rows.map((row: { label?: string; values?: string[] }) => ({
        ingredient: String(row.label ?? ''),
        values: c.map((_col, i) => String(row.values?.[i] ?? '—')),
      })))
    } else if (Array.isArray(ex.ingredients) && ex.ingredients.length) {
      // No table on the label → list ingredients under a single generic value column.
      setCustomCols(['القيمة / Value'])
      setTableRows(ex.ingredients.map((ing: string) => ({ ingredient: String(ing), values: ['—'] })))
    }

    if (ex.label_text) setLabelText(ex.label_text)
    if (ex.caffeine_mg_per_100ml != null) setCaffeine(String(ex.caffeine_mg_per_100ml))
    setHasSulfites(!!ex.has_sulfites)
    setResult(r.compliance)
    setShowScanner(false)
  }

  function addChip(val: string) {
    const trimmed = val.trim().replace(/,$|،$/, '')
    if (!trimmed || ingredients.includes(trimmed)) return
    setIngredients(prev => [...prev, trimmed])
  }

  function handleChipKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',' || e.key === '،') {
      e.preventDefault()
      addChip(chipInput)
      setChipInput('')
    } else if (e.key === 'Backspace' && !chipInput && ingredients.length > 0) {
      setIngredients(prev => prev.slice(0, -1))
    }
  }

  function removeChip(idx: number) {
    setIngredients(prev => prev.filter((_, i) => i !== idx))
  }

  function updateTableRow(rowIdx: number, colIdx: number, val: string) {
    setTableRows(prev => prev.map((r, i) =>
      i === rowIdx ? { ...r, values: r.values.map((v, j) => j === colIdx ? val : v) } : r
    ))
  }

  function removeTableRow(idx: number) {
    setTableRows(prev => prev.filter((_, i) => i !== idx))
  }

  function addTableRow() {
    setTableRows(prev => [...prev, { ingredient: '', values: cols.map(() => '—') }])
  }

  function handleClassChange(val: string) {
    setProductClass(val)
    setCustomCols(null) // manual class change → revert to the class column template
    const cls = PRODUCT_CLASSES.find(c => c.value === val) || PRODUCT_CLASSES[0]
    setTableRows(prev => prev.map(r => ({ ...r, values: cls.cols_ar.map((_, i) => r.values[i] ?? '—') })))
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
      setError(t.errMsg)
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
    <div className="min-h-screen bg-gray-50 px-4 py-10" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">{t.title}</h1>
          <p className="text-gray-400 text-sm max-w-xl mx-auto">{t.subtitle}</p>
          <div className="inline-block mt-3 text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-full px-4 py-1.5 font-semibold">
            {t.coverage}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* ── FORM ── */}
          <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">

            {/* Smart Scan CTA */}
            <button type="button" onClick={() => setShowScanner(true)}
              className="w-full flex items-center gap-3 bg-gradient-to-l from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white rounded-2xl px-4 py-3.5 transition-all shadow-sm">
              <span className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <ScanLine className="w-5 h-5" />
              </span>
              <span className="text-start flex-1">
                <span className="block font-black text-sm">{t.scanTitle}</span>
                <span className="block text-[11px] text-white/85 font-medium">{t.scanSub}</span>
              </span>
              <Sparkles className="w-4 h-4 text-white/70 flex-shrink-0" />
            </button>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-[11px] text-gray-300 font-semibold">{t.orManual}</span></div>
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{t.productName}</label>
              <input
                type="text"
                required
                value={productName}
                onChange={e => setProductName(e.target.value)}
                placeholder={t.productNamePh}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-colors"
              />
            </div>

            {/* Product Class */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{t.productClass}</label>
              <select
                value={productClass}
                onChange={e => handleClassChange(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-orange-400 transition-colors cursor-pointer"
              >
                {PRODUCT_CLASSES.map(c => (
                  <option key={c.value} value={c.value}>{isAr ? c.label_ar : c.label_en}</option>
                ))}
              </select>
            </div>

            {/* Ingredient Chips */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                {t.ingredients} <span className="normal-case font-normal text-gray-400">{t.ingredientsHint}</span>
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
                  placeholder={ingredients.length === 0 ? t.ingredientsPh : ''}
                  className="border-none outline-none text-xs text-gray-700 w-full bg-transparent placeholder-gray-400"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">{t.ingredientsNote}</p>
            </div>

            {/* Dynamic Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  📊 {t.tableWord} — {customCols ? t.fromScan : (isAr ? selectedClass.label_ar : selectedClass.label_en)}
                </label>
                <button type="button" onClick={addTableRow}
                  className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-semibold">
                  <Plus className="w-3.5 h-3.5" /> {t.addRow}
                </button>
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-start py-2 px-3 font-bold text-gray-500">{customCols ? t.colItem : t.colIngredient}</th>
                      {cols.map((col, i) => (
                        <th key={i} className="text-start py-2 px-2 font-bold text-gray-500 whitespace-nowrap">{col}</th>
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
                            placeholder={t.rowNamePh}
                          />
                        </td>
                        {cols.map((_, colIdx) => (
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
                      <tr><td colSpan={cols.length + 2} className="py-6 text-center text-gray-400 text-xs">{t.emptyTable}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Label text */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{t.labelText}</label>
              <textarea
                value={labelText}
                onChange={e => setLabelText(e.target.value)}
                placeholder={t.labelTextPh}
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-colors resize-none"
              />
            </div>

            {/* Caffeine (beverages only) */}
            {(productClass === 'beverage_energy' || productClass === 'beverage_general') && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{t.caffeine}</label>
                <input
                  type="number"
                  value={caffeine}
                  onChange={e => setCaffeine(e.target.value)}
                  placeholder={t.caffeinePh}
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
              <span className="text-sm text-gray-600">{t.sulfites}</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors shadow-sm"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
              {loading ? t.checking : t.checkBtn}
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
                <p className="text-gray-400 font-medium">{t.emptyResult1}</p>
                <p className="text-gray-300 text-sm mt-1">{t.emptyResult2}</p>
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
                          {isAr ? cfg.label_ar : cfg.label_en}
                        </span>
                        {result.missing_count > 0 && (
                          <span className="bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full">
                            {result.missing_count} {t.missing}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">{result.standard}</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{isAr ? result.summary_ar : result.summary_en}</p>
                    </div>
                  )
                })()}

                {result.failed.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <h3 className="font-bold text-red-600 mb-4 flex items-center gap-2 text-sm">
                      <XCircle className="w-4 h-4" />
                      {t.failed} ({result.failed.length})
                    </h3>
                    <div className="space-y-2">
                      {result.failed.map((f, i) => {
                        const note = isAr ? (f.note_ar ?? f.note) : f.note_en
                        return (
                        <div key={i} className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                          <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-gray-900 font-medium">{isAr ? f.requirement_ar : f.requirement_en}</p>
                            <p className="text-[10px] text-orange-500 font-semibold mt-0.5">{f.clause}</p>
                            {note && <p className="text-[10px] text-amber-600 mt-0.5">{note}</p>}
                          </div>
                        </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {result.review && result.review.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <h3 className="font-bold text-amber-600 mb-4 flex items-center gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      {t.review} ({result.review.length})
                    </h3>
                    <div className="space-y-2">
                      {result.review.map((f, i) => {
                        const note = isAr ? (f.note_ar ?? f.note) : f.note_en
                        return (
                        <div key={i} className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-gray-900 font-medium">{isAr ? f.requirement_ar : f.requirement_en}</p>
                            <p className="text-[10px] text-orange-500 font-semibold mt-0.5">{f.clause}</p>
                            {note && <p className="text-[10px] text-amber-600 mt-0.5">{note}</p>}
                          </div>
                        </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {result.passed.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <h3 className="font-bold text-green-600 mb-4 flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      {t.passed} ({result.passed.length})
                    </h3>
                    <div className="space-y-1.5">
                      {result.passed.map((p, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{isAr ? p.requirement_ar : p.requirement_en}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bridge to fulfilment: order a compliant label (dropship via Art for Printing) */}
                <OrderLabelCTA isAr={isAr} productName={productName} verdict={result.verdict} />
              </div>
            )}
          </div>
        </div>
      </div>

      {showScanner && (
        <SmartScanner isAr={isAr} onClose={() => setShowScanner(false)} onApply={applyScan} />
      )}
    </div>
  )
}
