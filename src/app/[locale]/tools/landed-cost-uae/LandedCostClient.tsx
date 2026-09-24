'use client'
import { useEffect, useMemo, useState } from 'react'
import { Calculator, Printer, Search, AlertTriangle, BadgeCheck, Compass } from 'lucide-react'
import { HS_FMCG, searchHs, type HsEntry, type Excise } from '@/lib/customs/hs-fmcg'
import { computeLandedCost, sweetTier } from '@/lib/customs/landed-cost'
import { useLeadGate } from '@/components/leadgate/LeadGateProvider'

const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })
const num = (v: string) => { const n = parseFloat(v.replace(/,/g, '')); return Number.isFinite(n) ? n : 0 }

export default function LandedCostClient({ locale, faq }: { locale: 'ar' | 'en'; faq: string[][] }) {
  const isAr = locale === 'ar'
  const { gate } = useLeadGate()
  const [q, setQ] = useState('')
  const [hs, setHs] = useState<HsEntry>(HS_FMCG.find(e => e.code === '2202.10')!)
  const [excise, setExcise] = useState<Excise>('sweet')
  const [dutyOverride, setDutyOverride] = useState<0 | 5>(5)
  const [f, setF] = useState({ goods: '20000', freight: '2500', insurance: '200', units: '4800', litres: '1584', sugar: '10', retail: '', clearance: '900', transport: '600', compliance: '1500', margin: '30' })
  const [vatReg, setVatReg] = useState(true)
  const set = (k: keyof typeof f, v: string) => setF(p => ({ ...p, [k]: v }))
  const results = useMemo(() => searchHs(q), [q])

  const pick = (e: HsEntry) => { setHs(e); setExcise(e.excise ?? 'none'); setQ('') }

  // Deep link from the import guides: ?hs=1006 preselects the heading (and its excise class).
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('hs')
    const e = code ? HS_FMCG.find(x => x.code === code) : null
    if (e) { setHs(e); setExcise(e.excise ?? 'none') }
  }, [])

  const r = useMemo(() => computeLandedCost({
    goodsValue: num(f.goods), freight: num(f.freight), insurance: num(f.insurance), units: num(f.units),
    duty: hs.duty, dutyOverride, excise,
    litres: num(f.litres), sugarPer100ml: num(f.sugar), retailPricePerUnit: num(f.retail),
    clearance: num(f.clearance), transport: num(f.transport), compliance: num(f.compliance),
    vatRegistered: vatReg, targetMarginPct: num(f.margin),
  }), [f, hs, dutyOverride, excise, vatReg])

  const T = {
    eyebrow: isAr ? 'أداة مجانية · حساب فوري' : 'Free tool · instant calculation',
    title: isAr ? 'رمز HS وحاسبة التكلفة الواصلة' : 'HS code & landed-cost calculator',
    sub: isAr ? 'اختر رمز HS للمنتج، أدخل قيمة الشحنة، وتحصل على CIF والجمارك والضريبة الانتقائية 2026 وضريبة القيمة المضافة والتكاليف المحلية والتكلفة لكل وحدة وسعر البيع المقترح.' : 'Pick the HS code, enter the shipment values → CIF, customs duty, 2026 excise, VAT, local costs, cost per unit and a suggested selling price.',
    hsSearch: isAr ? 'ابحث عن المنتج أو الرمز (مثال: عصير، 0406، chocolate)' : 'Search product or code (e.g. juice, 0406, chocolate)',
    selected: isAr ? 'الرمز المختار' : 'Selected code',
    duty: isAr ? 'الرسوم الجمركية' : 'Customs duty', verify: isAr ? 'يختلف بحسب البند — اختر:' : 'Varies by tariff line — choose:',
    exciseL: isAr ? 'الضريبة الانتقائية' : 'Excise class',
    exNone: isAr ? 'لا انتقائية' : 'None', exSweet: isAr ? 'مشروب محلّى (شرائح السكر)' : 'Sweetened drink (sugar tiers)', exEnergy: isAr ? 'مشروب طاقة (100%)' : 'Energy drink (100%)', exTobacco: isAr ? 'تبغ / تدخين إلكتروني (100%)' : 'Tobacco / e-smoking (100%)',
    goods: isAr ? 'قيمة البضاعة (FOB) درهم' : 'Goods value (FOB) AED', freight: isAr ? 'الشحن درهم' : 'Freight AED', insurance: isAr ? 'التأمين درهم' : 'Insurance AED', units: isAr ? 'عدد الوحدات القابلة للبيع' : 'Sellable units',
    litres: isAr ? 'إجمالي اللترات في الشحنة' : 'Total litres in shipment', sugar: isAr ? 'السكر غ/100 مل' : 'Sugar g/100 ml', retail: isAr ? 'سعر التجزئة للوحدة (شامل الضريبة) درهم' : 'Retail price per unit (tax-inclusive) AED',
    clearance: isAr ? 'تخليص جمركي ورسوم ميناء درهم' : 'Customs clearance & port AED', transport: isAr ? 'نقل داخلي وتخزين درهم' : 'Inland transport & storage AED', compliance: isAr ? 'تسجيل + ملصقات + فحوص درهم' : 'Registration + labels + lab tests AED',
    vatReg: isAr ? 'المستورد مسجّل في ضريبة القيمة المضافة (يسترد ضريبة المدخلات)' : 'Importer is VAT-registered (recovers input VAT)',
    margin: isAr ? 'الهامش المستهدف % من سعر البيع' : 'Target margin % of selling price',
    cif: 'CIF', dutyRow: isAr ? 'الرسوم الجمركية' : 'Customs duty', exciseRow: isAr ? 'الضريبة الانتقائية' : 'Excise tax', vat: isAr ? 'ضريبة القيمة المضافة 5%' : 'VAT 5%', local: isAr ? 'التكاليف المحلية' : 'Local costs',
    landedEx: isAr ? 'التكلفة الواصلة قبل VAT' : 'Landed cost ex-VAT', landedTot: isAr ? 'التكلفة الواصلة شاملة VAT' : 'Landed cost incl. VAT',
    perUnit: isAr ? 'التكلفة لكل وحدة' : 'Cost per unit', eff: isAr ? 'نسبة الزيادة على قيمة البضاعة' : 'Uplift on goods value',
    price: isAr ? 'سعر البيع المقترح للوحدة' : 'Suggested selling price per unit', exVat: isAr ? 'قبل VAT' : 'ex-VAT', incVat: isAr ? 'شامل VAT' : 'incl. VAT',
    print: isAr ? 'طباعة / حفظ PDF' : 'Print / save as PDF', cert: isAr ? 'هل أحتاج شهادات؟' : 'Certificates needed?', router: isAr ? 'أين أسجّل منتجي؟' : 'Where do I register?',
    note: isAr ? 'الجمارك: التعرفة الخليجية الموحدة 5% على CIF مع إعفاءات غذائية أساسية 0% — أكّد البند على تعرفة جمارك دبي. الانتقائية: قرار مجلس الوزراء 197/2025 (ساري من 1 يناير 2026). VAT تُحسب فوق الجمارك والانتقائية. الأرقام تقديرية للتخطيط وليست تقييماً جمركياً.' : 'Duty: GCC unified tariff 5% on CIF with 0% food-security exemptions — confirm the line on the Dubai Customs tariff. Excise: Cabinet Decision 197/2025 (in force 1 Jan 2026). VAT is charged on top of duty and excise. Figures are planning estimates, not a customs valuation.',
    exciseNote: excise === 'sweet' ? (isAr ? `شريحة السكر: ${fmt(sweetTier(num(f.sugar)))} درهم/لتر × ${fmt(num(f.litres))} لتر` : `Sugar tier: AED ${fmt(sweetTier(num(f.sugar)))}/L × ${fmt(num(f.litres))} L`) : excise === 'none' ? '' : (isAr ? 'الانتقائية 100% = نصف سعر التجزئة الشامل × عدد الوحدات' : 'Excise 100% = half the tax-inclusive retail price × units'),
    faq: isAr ? 'أسئلة شائعة' : 'Frequently asked',
    tariff: isAr ? 'تعرفة جمارك دبي (بحث)' : 'Dubai Customs tariff search',
  }
  const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 tabular-nums'
  const Field = ({ k, label }: { k: keyof typeof f; label: string }) => (
    <label className="text-xs text-gray-600 flex flex-col gap-1">{label}<input inputMode="decimal" value={f[k]} onChange={e => set(k, e.target.value)} className={inp} /></label>
  )

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 print:bg-white print:py-0" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 text-center print:text-start">
          <div className="text-xs text-orange-600 tracking-wide mb-2 print:hidden">{T.eyebrow}</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2 print:justify-start print:text-2xl"><Calculator className="w-7 h-7 text-orange-500 print:hidden" />{T.title}</h1>
          <p className="text-gray-500 text-sm max-w-2xl mx-auto print:hidden">{T.sub}</p>
        </div>

        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-4">
          {/* Inputs */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 print:hidden">
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-gray-400 absolute top-3 start-3" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder={T.hsSearch} className={inp + ' ps-9'} />
              {q && results.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                  {results.map(e => (
                    <button key={e.code} type="button" onClick={() => pick(e)} className="w-full text-start px-3 py-2 hover:bg-orange-50 text-sm flex gap-3">
                      <span className="font-mono text-xs text-orange-600 w-16 flex-shrink-0">{e.code}</span><span className="text-gray-800">{isAr ? e.ar : e.en}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-xl bg-orange-50 border border-orange-100 p-3 mb-4 text-sm">
              <div className="text-xs text-gray-500">{T.selected}</div>
              <div className="text-gray-900"><span className="font-mono text-orange-600">{hs.code}</span> — {isAr ? hs.ar : hs.en}</div>
              <div className="text-xs text-gray-600 mt-1">{T.duty}: {hs.duty === 'verify' ? (
                <span className="inline-flex items-center gap-2">{T.verify}
                  {[0, 5].map(v => <button key={v} type="button" onClick={() => setDutyOverride(v as 0 | 5)} className={`rounded-full border px-2 py-0.5 text-xs ${dutyOverride === v ? 'border-orange-400 bg-white' : 'border-gray-200'}`}>{v}%</button>)}
                </span>) : <b>{hs.duty}%</b>}{hs.note ? ` · ${hs.note}` : ''}</div>
              <a href="https://www.dubaicustoms.gov.ae/en/eServices/ServicesForBusinesses/Pages/TariffSearch.aspx" target="_blank" rel="noopener" className="text-xs text-orange-600 mt-1 inline-block">{T.tariff} ↗</a>
            </div>

            <div className="text-xs text-gray-600 mb-1">{T.exciseL}</div>
            <div className="flex flex-wrap gap-2 mb-4">
              {([['none', T.exNone], ['sweet', T.exSweet], ['energy', T.exEnergy], ['tobacco', T.exTobacco]] as [Excise, string][]).map(([k, label]) => (
                <button key={k} type="button" onClick={() => setExcise(k)} className={`rounded-full border px-3 py-1.5 text-xs ${excise === k ? 'border-orange-400 bg-orange-50 text-gray-900' : 'border-gray-200 text-gray-600'}`}>{label}</button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <Field k="goods" label={T.goods} /><Field k="freight" label={T.freight} /><Field k="insurance" label={T.insurance} /><Field k="units" label={T.units} />
              {excise === 'sweet' && <><Field k="litres" label={T.litres} /><Field k="sugar" label={T.sugar} /></>}
              {(excise === 'energy' || excise === 'tobacco') && <Field k="retail" label={T.retail} />}
              <Field k="clearance" label={T.clearance} /><Field k="transport" label={T.transport} /><Field k="compliance" label={T.compliance} /><Field k="margin" label={T.margin} />
            </div>
            <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer"><input type="checkbox" checked={vatReg} onChange={e => setVatReg(e.target.checked)} className="mt-0.5 accent-orange-500" /><span>{T.vatReg}</span></label>
          </div>

          {/* Results */}
          <div className="bg-white border-2 border-orange-100 rounded-2xl p-5 print:border-0 print:p-0">
            <div className="text-xs text-gray-400 mb-2"><span className="font-mono text-orange-600">{hs.code}</span> — {isAr ? hs.ar : hs.en} · {fmt(num(f.units))} {isAr ? 'وحدة' : 'units'}</div>
            <table className="w-full text-sm tabular-nums">
              <tbody>
                <Row l={T.cif} v={r.cif} />
                <Row l={`${T.dutyRow} (${r.dutyRate}%)`} v={r.duty} />
                <Row l={`${T.exciseRow}${r.exciseTier ? ` (${r.exciseTier})` : ''}`} v={r.excise} sub={T.exciseNote} />
                <Row l={T.local} v={r.local} />
                <Row l={T.landedEx} v={r.landedExVat} bold />
                <Row l={T.vat} v={r.vat} />
                <Row l={T.landedTot} v={r.landedTotal} bold />
              </tbody>
            </table>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Stat l={`${T.perUnit} (${T.exVat})`} v={r.perUnitExVat} />
              <Stat l={`${T.perUnit} (${T.incVat})`} v={r.perUnitTotal} />
              <Stat l={`${T.price} (${T.exVat})`} v={r.suggestedPrice} accent />
              <Stat l={`${T.price} (${T.incVat})`} v={r.suggestedPriceIncVat} accent />
            </div>
            <div className="text-xs text-gray-500 mt-3">{T.eff}: <b className="tabular-nums">{r.effectiveRatePct.toFixed(1)}%</b></div>

            <div className="flex flex-wrap gap-2 mt-4 print:hidden">
              <button type="button" onClick={() => gate({ kind: 'pdf', title: `تكلفة واصلة: ${hs.code} ${hs.ar}`, category: `حاسبة التكلفة الواصلة · ${hs.code}`, run: () => window.print() })} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:border-orange-300"><Printer className="w-4 h-4" />{T.print}</button>
              <a href={`/${locale}/tools/certificates-uae`} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:border-orange-300"><BadgeCheck className="w-4 h-4" />{T.cert}</a>
              <a href={`/${locale}/tools/product-registration-uae`} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:border-orange-300"><Compass className="w-4 h-4" />{T.router}</a>
            </div>
            <div className="text-[11px] text-gray-400 mt-4 flex gap-1.5"><AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{T.note}</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 mt-4 print:hidden">
          <h2 className="text-base font-semibold text-gray-900 mb-3">{T.faq}</h2>
          <div className="flex flex-col gap-3">{faq.map(([qq, ans]) => <div key={qq}><div className="text-sm font-semibold text-gray-800">{qq}</div><div className="text-sm text-gray-600 mt-0.5">{ans}</div></div>)}</div>
        </div>
      </div>
    </div>
  )
}

function Row({ l, v, bold, sub }: { l: string; v: number; bold?: boolean; sub?: string }) {
  return (
    <tr className={`border-b border-gray-50 ${bold ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
      <td className="py-2">{l}{sub ? <div className="text-[11px] text-gray-400 font-normal">{sub}</div> : null}</td>
      <td className="py-2 text-end">{fmt(v)} <span className="text-[11px] text-gray-400">AED</span></td>
    </tr>
  )
}
function Stat({ l, v, accent }: { l: string; v: number; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${accent ? 'border-orange-200 bg-orange-50' : 'border-gray-100'}`}>
      <div className="text-[11px] text-gray-500">{l}</div>
      <div className={`text-lg tabular-nums ${accent ? 'text-orange-700' : 'text-gray-900'}`}>{fmt(v)} <span className="text-xs text-gray-400">AED</span></div>
    </div>
  )
}
