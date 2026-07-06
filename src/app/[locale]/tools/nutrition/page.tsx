'use client'
import { useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Plus, X, Calculator, Info } from 'lucide-react'
import { NUTRIENTS, NUTRIENT_KEYS } from '@/lib/nutrition/reference'
import { computeNutritionFacts, type Ingredient } from '@/lib/nutrition/calculator'

const blankIngredient = (): Ingredient => ({ name: '', grams: 0, per100g: {} })

export default function NutritionCalculatorPage() {
  const isAr = !usePathname()?.startsWith('/en')
  const [servings, setServings] = useState(1)
  const [servingWeight, setServingWeight] = useState<number | ''>('')
  const [rows, setRows] = useState<Ingredient[]>([
    { name: '', grams: 0, per100g: {} },
    { name: '', grams: 0, per100g: {} },
  ])

  const recipeWeight = rows.reduce((s, r) => s + (Number(r.grams) || 0), 0)
  const effServingWeight = servingWeight === '' ? (servings ? recipeWeight / servings : recipeWeight) : servingWeight
  const facts = useMemo(
    () => computeNutritionFacts(rows, servings, effServingWeight),
    [rows, servings, effServingWeight],
  )

  const setRow = (i: number, patch: Partial<Ingredient>) =>
    setRows(prev => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  const setCell = (i: number, key: string, val: string) =>
    setRows(prev => prev.map((r, j) => (j === i ? { ...r, per100g: { ...r.per100g, [key]: Number(val) || 0 } } : r)))

  const T = {
    title: isAr ? 'حاسبة الحقائق الغذائية' : 'Nutrition Facts Calculator',
    sub: isAr
      ? 'أدخل مكوّنات الوصفة وقيمها لكل 100غم → تحصل على جدول جاهز للتقديم: لكل 100غم، لكل حصة، و% القيمة اليومية.'
      : 'Enter recipe ingredients and their per-100g values → get a submission-ready table: per 100g, per serving, and % Daily Value.',
    servings: isAr ? 'عدد الحصص' : 'Servings',
    servingWeight: isAr ? 'وزن الحصة (غم)' : 'Serving weight (g)',
    auto: isAr ? 'تلقائي' : 'auto',
    recipeWeight: isAr ? 'وزن الوصفة' : 'Recipe weight',
    ingredient: isAr ? 'المكوّن' : 'Ingredient',
    grams: isAr ? 'غم' : 'g',
    addRow: isAr ? 'إضافة مكوّن' : 'Add ingredient',
    perServing: isAr ? 'لكل حصة' : 'Per serving',
    per100: isAr ? 'لكل 100غم' : 'Per 100g',
    dv: '%DV',
    note: isAr
      ? 'القيم مرجعية للملصقات (قيم يومية بأساس 2000 سعرة). الجهة الملزمة للتسجيل هي ESMA.'
      : 'Values are labelling references (Daily Values on a 2,000 kcal basis). ESMA is the binding registration authority.',
    ph: isAr ? 'مثال: صلصة طماطم' : 'e.g. tomato sauce',
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-black text-gray-900 mb-2 flex items-center justify-center gap-2">
            <Calculator className="w-7 h-7 text-orange-500" />{T.title}
          </h1>
          <p className="text-gray-400 text-sm max-w-2xl mx-auto">{T.sub}</p>
        </div>

        {/* Recipe meta */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 flex flex-wrap items-center gap-4">
          <label className="text-sm text-gray-600 flex items-center gap-2">
            {T.servings}
            <input type="number" min={1} value={servings} onChange={e => setServings(Math.max(1, Number(e.target.value) || 1))}
              className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-orange-400" />
          </label>
          <label className="text-sm text-gray-600 flex items-center gap-2">
            {T.servingWeight}
            <input type="number" min={0} value={servingWeight} placeholder={T.auto}
              onChange={e => setServingWeight(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-24 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-orange-400" />
          </label>
          <span className="text-sm text-gray-400 ms-auto">{T.recipeWeight}: <b className="text-gray-700 tabular-nums">{recipeWeight.toLocaleString()} {T.grams}</b></span>
        </div>

        {/* Ingredient grid */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
          <div className="overflow-x-auto">
            <table className="text-xs" style={{ minWidth: 900 }}>
              <thead>
                <tr className="text-gray-400">
                  <th className="text-start font-bold px-2 py-1.5 sticky start-0 bg-white min-w-[140px]">{T.ingredient}</th>
                  <th className="font-bold px-1 py-1.5 min-w-[56px]">{T.grams}</th>
                  {NUTRIENTS.map(n => (
                    <th key={n.key} className="font-bold px-1 py-1.5 whitespace-nowrap min-w-[64px]" title={isAr ? n.ar : n.en}>
                      {isAr ? n.ar : n.en}<span className="block text-[9px] text-gray-300 normal-case">{n.unit}/100g</span>
                    </th>
                  ))}
                  <th className="w-6" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-gray-50">
                    <td className="px-2 py-1 sticky start-0 bg-white">
                      <input value={r.name} onChange={e => setRow(i, { name: e.target.value })} placeholder={T.ph}
                        className="w-full border border-gray-100 rounded-lg px-2 py-1 focus:outline-none focus:border-orange-300" />
                    </td>
                    <td className="px-1 py-1">
                      <input type="number" min={0} value={r.grams || ''} onChange={e => setRow(i, { grams: Number(e.target.value) || 0 })}
                        className="w-14 border border-gray-100 rounded-lg px-1 py-1 text-center focus:outline-none focus:border-orange-300" />
                    </td>
                    {NUTRIENT_KEYS.map(k => (
                      <td key={k} className="px-1 py-1">
                        <input type="number" min={0} value={r.per100g[k] ?? ''} onChange={e => setCell(i, k, e.target.value)}
                          className="w-16 border border-gray-100 rounded-lg px-1 py-1 text-center text-gray-600 focus:outline-none focus:border-orange-300" />
                      </td>
                    ))}
                    <td className="px-1 text-center">
                      {rows.length > 1 && (
                        <button onClick={() => setRows(prev => prev.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={() => setRows(prev => [...prev, blankIngredient()])}
            className="mt-3 flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-semibold">
            <Plus className="w-3.5 h-3.5" />{T.addRow}
          </button>
        </div>

        {/* Results: the submission-ready Nutrition Facts */}
        <div className="bg-white border-2 border-orange-100 rounded-2xl p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-xs border-b-2 border-gray-200">
                  <th className="text-start py-2 font-bold">{isAr ? 'العنصر' : 'Nutrient'}</th>
                  <th className="text-center py-2 font-bold">{T.per100}</th>
                  <th className="text-center py-2 font-bold">{T.perServing}</th>
                  <th className="text-center py-2 font-bold">{T.dv}</th>
                </tr>
              </thead>
              <tbody>
                {NUTRIENTS.map(n => (
                  <tr key={n.key} className="border-b border-gray-50">
                    <td className="py-2 font-semibold text-gray-700">{isAr ? n.ar : n.en} <span className="text-[10px] text-gray-300">{n.unit}</span></td>
                    <td className="py-2 text-center tabular-nums text-gray-600">{facts.per100g[n.key]}</td>
                    <td className="py-2 text-center tabular-nums font-bold text-gray-900">{facts.perServing[n.key]}</td>
                    <td className="py-2 text-center tabular-nums text-orange-600">{n.dv ? `${facts.dvPercent[n.key]}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[11px] text-gray-400 flex items-start gap-1.5"><Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />{T.note}</p>
        </div>
      </div>
    </div>
  )
}
