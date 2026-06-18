'use client'
import { useState, useMemo, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  Package, Calculator, AlertCircle, CheckSquare, TrendingUp,
  Boxes, Warehouse, Layers, Send, Truck, MapPin, Loader2, CheckCircle2,
} from 'lucide-react'
import { RAW_MATERIALS, PKG_COSTS, type RawMaterial } from '@/lib/data/products-catalog'
import {
  calcPackaging,
  type PrimaryPack, type MasterCarton, type PackagingOption, type PackagingCalcResult,
} from '@/lib/data/packaging-specs'

// ─── Shared small components ────────────────────────────────────────────────

function Step({ num, title }: { num: number | string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0">{num}</div>
      <h2 className="font-black text-gray-900">{title}</h2>
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${active ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-orange-200 hover:text-orange-500'}`}>
      {children}
    </button>
  )
}

// ─── RFQ (request a quote from Crate) ────────────────────────────────────────

interface RfqPayload {
  product_label: string
  calc: unknown
}

function RfqSection({ isAr, payload }: { isAr: boolean; payload: RfqPayload }) {
  const [open, setOpen]         = useState(false)
  const [sending, setSending]   = useState(false)
  const [done, setDone]         = useState(false)
  const [err, setErr]           = useState<string | null>(null)
  const [form, setForm] = useState({
    contact_name: '', company_name: '', email: '', phone: '',
    fulfilment: 'delivery' as 'delivery' | 'pickup', notes: '',
  })

  async function submit() {
    if (!form.contact_name || (!form.email && !form.phone)) {
      setErr(isAr ? 'الاسم وطريقة تواصل واحدة على الأقل مطلوبة' : 'Name and at least one contact method are required')
      return
    }
    setSending(true); setErr(null)
    try {
      const res = await fetch('/api/packaging/rfq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, product_label: payload.product_label, calc: payload.calc }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'failed') }
      setDone(true)
    } catch {
      setErr(isAr ? 'تعذّر إرسال الطلب، حاول مجدداً' : 'Could not send request, please try again')
    } finally { setSending(false) }
  }

  if (done) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center">
        <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
        <h3 className="font-black text-green-800 mb-1">{isAr ? 'وصلنا طلبك!' : 'Request received!'}</h3>
        <p className="text-sm text-green-700">
          {isAr
            ? 'فريق Crate سيجمع أفضل الأسعار من الموردين والمصانع ويعود إليك بعرض شامل.'
            : 'The Crate team will gather the best prices from suppliers and factories and come back with a full quote.'}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-3xl p-6 text-white">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Send className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-black text-lg">{isAr ? 'اطلب عرض سعر من Crate' : 'Request a quote from Crate'}</h3>
          <p className="text-indigo-100 text-sm mt-0.5">
            {isAr
              ? 'دع Crate تتولى التفاوض — نجمع الأسعار من مصانع الكراتين والموردين ونعود إليك بعرض واحد شامل.'
              : 'Let Crate handle the sourcing — we collect prices from carton factories and suppliers and return one complete offer.'}
          </p>
        </div>
      </div>

      {!open ? (
        <button onClick={() => setOpen(true)}
          className="bg-white text-indigo-700 font-black px-6 py-2.5 rounded-xl text-sm hover:bg-indigo-50 transition-colors">
          {isAr ? 'متابعة لطلب السعر' : 'Continue to quote request'}
        </button>
      ) : (
        <div className="bg-white/10 rounded-2xl p-4 space-y-3 mt-2">
          <div className="grid sm:grid-cols-2 gap-3">
            <input value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })}
              placeholder={isAr ? 'الاسم *' : 'Name *'} dir={isAr ? 'rtl' : 'ltr'}
              className="px-3 py-2.5 rounded-xl text-sm text-gray-900 bg-white/95 focus:outline-none" />
            <input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })}
              placeholder={isAr ? 'اسم الشركة' : 'Company'} dir={isAr ? 'rtl' : 'ltr'}
              className="px-3 py-2.5 rounded-xl text-sm text-gray-900 bg-white/95 focus:outline-none" />
            <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder={isAr ? 'البريد الإلكتروني' : 'Email'} dir="ltr" type="email"
              className="px-3 py-2.5 rounded-xl text-sm text-gray-900 bg-white/95 focus:outline-none" />
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder={isAr ? 'الهاتف / واتساب' : 'Phone / WhatsApp'} dir="ltr"
              className="px-3 py-2.5 rounded-xl text-sm text-gray-900 bg-white/95 focus:outline-none" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-indigo-100">{isAr ? 'الاستلام:' : 'Fulfilment:'}</span>
            {([
              { v: 'delivery', ar: 'توصيل', en: 'Delivery', Icon: Truck },
              { v: 'pickup',   ar: 'استلام من الموقع', en: 'Pickup', Icon: MapPin },
            ] as const).map(o => (
              <button key={o.v} onClick={() => setForm({ ...form, fulfilment: o.v })}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  form.fulfilment === o.v ? 'bg-white text-indigo-700' : 'bg-white/15 text-white hover:bg-white/25'
                }`}>
                <o.Icon className="w-3.5 h-3.5" />{isAr ? o.ar : o.en}
              </button>
            ))}
          </div>

          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
            placeholder={isAr ? 'ملاحظات إضافية (اختياري) — ماركة، طباعة، موعد التسليم...' : 'Notes (optional) — brand, printing, deadline...'}
            dir={isAr ? 'rtl' : 'ltr'} rows={2}
            className="w-full px-3 py-2.5 rounded-xl text-sm text-gray-900 bg-white/95 focus:outline-none resize-none" />

          {err && <p className="text-xs text-amber-200 font-semibold">{err}</p>}

          <button onClick={submit} disabled={sending}
            className="flex items-center gap-2 bg-white text-indigo-700 font-black px-6 py-2.5 rounded-xl text-sm hover:bg-indigo-50 transition-colors disabled:opacity-60">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isAr ? 'إرسال طلب عرض السعر' : 'Send quote request'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Cartons & packaging calculator (standalone tool) ────────────────────────

type WeightUnit = 'kg' | 'ton'

interface CartonsCalcProps {
  isAr: boolean
  primaryPacks: PrimaryPack[]
  masterCartons: MasterCarton[]
  packagingOptions: PackagingOption[]
}

function CartonsCalculator({ isAr, primaryPacks, masterCartons, packagingOptions }: CartonsCalcProps) {
  const [productLabel, setProductLabel] = useState('')
  const [qtyMode, setQtyMode]   = useState<'weight' | 'units'>('weight')
  const [weight, setWeight]     = useState('10')
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('ton')
  const [unitsInput, setUnitsInput] = useState('5000')
  const [primary, setPrimary]   = useState<PrimaryPack | null>(null)
  const [carton, setCarton]     = useState<MasterCarton | null>(null)

  // Set defaults once specs load
  useEffect(() => {
    if (primary === null && primaryPacks.length > 0) {
      setPrimary(primaryPacks.find(p => p.size_label === '1kg') ?? primaryPacks[0])
    }
    if (carton === null && masterCartons.length > 1) {
      setCarton(masterCartons[1])
    } else if (carton === null && masterCartons.length > 0) {
      setCarton(masterCartons[0])
    }
  }, [primaryPacks, masterCartons, primary, carton])
  const [selOptions, setSelOptions] = useState<PackagingOption[]>([])

  function toggleOption(o: PackagingOption) {
    setSelOptions(prev => prev.some(x => x.id === o.id) ? prev.filter(x => x.id !== o.id) : [...prev, o])
  }

  const result = useMemo<PackagingCalcResult | null>(() => {
    if (!carton) return null
    const totalWeightKg = qtyMode === 'weight'
      ? (parseFloat(weight) || 0) * (weightUnit === 'ton' ? 1000 : 1)
      : null
    const totalUnits = qtyMode === 'units' ? (parseInt(unitsInput) || 0) : null
    return calcPackaging({ totalWeightKg, totalUnits, primary, carton, options: selOptions })
  }, [qtyMode, weight, weightUnit, unitsInput, primary, carton, selOptions])

  const fmt = (n: number) => n.toLocaleString(isAr ? 'ar-EG' : 'en-US')

  return (
    <div className="space-y-8">

      {/* STEP 1 — what are you packing */}
      <section>
        <Step num={1} title={isAr ? 'ما الذي تريد تعبئته؟ (اختياري)' : 'What are you packing? (optional)'} />
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <input value={productLabel} onChange={e => setProductLabel(e.target.value)}
            placeholder={isAr ? 'مثال: أرز Sunwhite 1 كجم / سكر أبيض بالطن / اتركه فارغاً لحساب الكراتين فقط' : 'e.g. Sunwhite Rice 1kg / bulk white sugar / leave empty for cartons only'}
            dir={isAr ? 'rtl' : 'ltr'}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400" />
          <p className="text-xs text-gray-400 mt-2">
            {isAr
              ? 'إدخال المنتج يساعدنا على توجيه طلب السعر للجهة الصحيحة (مصنع كرتون، تاجر ماركة، أو مورد مواد خام).'
              : 'Naming the product helps route your quote to the right party (carton factory, brand trader, or raw-material supplier).'}
          </p>
        </div>
      </section>

      {/* STEP 2 — quantity */}
      <section>
        <Step num={2} title={isAr ? 'الكمية' : 'Quantity'} />
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex gap-2 mb-4">
            <Chip active={qtyMode === 'weight'} onClick={() => setQtyMode('weight')}>{isAr ? 'بالوزن' : 'By weight'}</Chip>
            <Chip active={qtyMode === 'units'} onClick={() => setQtyMode('units')}>{isAr ? 'بالعدد' : 'By units'}</Chip>
          </div>
          {qtyMode === 'weight' ? (
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-400 mb-2">{isAr ? 'إجمالي الوزن' : 'Total weight'}</label>
                <input type="number" min="0" value={weight} dir="ltr" onChange={e => setWeight(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-xl font-black text-gray-900 focus:outline-none focus:border-orange-400" />
              </div>
              <div className="flex gap-1 pb-1">
                {(['ton', 'kg'] as WeightUnit[]).map(u => (
                  <Chip key={u} active={weightUnit === u} onClick={() => setWeightUnit(u)}>{u === 'ton' ? (isAr ? 'طن' : 'ton') : 'kg'}</Chip>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2">{isAr ? 'عدد الوحدات' : 'Number of units'}</label>
              <input type="number" min="0" value={unitsInput} dir="ltr" onChange={e => setUnitsInput(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-xl font-black text-gray-900 focus:outline-none focus:border-orange-400" />
            </div>
          )}
        </div>
      </section>

      {/* STEP 3 — primary pack (weight mode) */}
      {qtyMode === 'weight' && (
        <section>
          <Step num={3} title={isAr ? 'التغليف الأساسي (الوحدة)' : 'Primary packaging (the unit)'} />
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-wrap gap-2 mb-2">
              <button onClick={() => setPrimary(null)}
                className={`px-4 py-3 rounded-2xl border-2 text-sm font-bold transition-all ${!primary ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-200'}`}>
                {isAr ? 'بدون — وزن سائب في الكرتون' : 'None — loose in carton'}
              </button>
              {primaryPacks.map(pp => {
                const sel = primary?.id === pp.id
                return (
                  <button key={pp.id} onClick={() => setPrimary(pp)}
                    className={`flex flex-col items-center gap-0.5 px-4 py-3 rounded-2xl border-2 transition-all min-w-[92px] ${sel ? 'border-orange-400 bg-orange-50 shadow-sm' : 'border-gray-200 hover:border-orange-200'}`}>
                    <span className="text-lg">{pp.icon}</span>
                    <span className="text-sm font-black text-gray-900">{pp.size_label}</span>
                    <span className="text-[10px] text-gray-400">{isAr ? pp.type_ar : pp.type_en}</span>
                    <span className="text-[10px] text-blue-500">{pp.cost_aed.toFixed(2)} AED</span>
                  </button>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* STEP 4 — master carton */}
      <section>
        <Step num={qtyMode === 'weight' ? 4 : 3} title={isAr ? 'الكرتون الماستر' : 'Master carton'} />
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {masterCartons.map(mc => {
              const sel = carton?.id === mc.id
              return (
                <button key={mc.id} onClick={() => setCarton(mc)}
                  className={`text-start p-4 rounded-2xl border-2 transition-all ${sel ? 'border-orange-400 bg-orange-50 shadow-sm' : 'border-gray-200 hover:border-orange-200'}`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-lg">{mc.icon}</span>
                    {sel && <div className="w-4 h-4 bg-orange-500 rounded-full" />}
                  </div>
                  <div className="font-black text-gray-900 text-sm">{isAr ? mc.name_ar : mc.name_en}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{mc.l_cm}×{mc.w_cm}×{mc.h_cm} cm</div>
                  <div className="text-[11px] text-gray-400">{isAr ? `حتى ${mc.max_weight_kg} كجم` : `up to ${mc.max_weight_kg}kg`}</div>
                  <div className="text-[10px] text-gray-500 mt-1">{isAr ? mc.flute_ar : mc.flute_en}</div>
                  <div className="text-[11px] text-blue-500 mt-1 font-semibold">{mc.cost_aed.toFixed(1)} AED/{isAr ? 'كرتون' : 'carton'}</div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* STEP 5 — options */}
      <section>
        <Step num={qtyMode === 'weight' ? 5 : 4} title={isAr ? 'المواصفات والخيارات' : 'Specs & options'} />
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-wrap gap-2">
          {packagingOptions.map(o => {
            const sel = selOptions.some(x => x.id === o.id)
            return (
              <button key={o.id} onClick={() => toggleOption(o)}
                className={`px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all ${sel ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-500 hover:border-orange-200'}`}>
                {sel ? '✓ ' : '+ '}{isAr ? o.label_ar : o.label_en}
              </button>
            )
          })}
        </div>
      </section>

      {/* RESULTS */}
      {result && (
        <>
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-black">✓</div>
              <h2 className="font-black text-gray-900">{isAr ? 'نتائج التغليف والمخزن' : 'Packaging & Storage Results'}</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { Icon: Package,   v: result.primaryUnits > 0 ? fmt(result.primaryUnits) : '—', la: 'وحدة معبأة', en: 'Primary units', cls: 'text-blue-700 bg-blue-50 border-blue-100' },
                { Icon: Boxes,     v: fmt(result.totalCartons), la: 'إجمالي الكراتين', en: 'Total cartons', cls: 'text-orange-700 bg-orange-50 border-orange-100' },
                { Icon: Layers,    v: fmt(result.pallets), la: 'طبليّة (بالِت)', en: 'Pallets', cls: 'text-purple-700 bg-purple-50 border-purple-100' },
                { Icon: Warehouse, v: `${result.floorAreaM2} m²`, la: 'مساحة الأرضية', en: 'Floor area', cls: 'text-gray-700 bg-gray-50 border-gray-100' },
              ].map((s, i) => (
                <div key={i} className={`border rounded-2xl p-4 ${s.cls}`}>
                  <s.Icon className="w-4 h-4 mb-1.5 opacity-60" />
                  <div className="text-2xl font-black leading-none">{s.v}</div>
                  <div className="text-[11px] mt-1 opacity-70">{isAr ? s.la : s.en}</div>
                </div>
              ))}
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                {[
                  { la: 'وحدة لكل كرتون', en: 'Units per carton', v: result.primaryUnits > 0 ? fmt(result.unitsPerCarton) : (isAr ? 'وزن سائب' : 'loose'), c: 'text-gray-800' },
                  { la: 'حجم التخزين', en: 'Storage volume', v: `${result.storageVolumeM3} m³`, c: 'text-gray-800' },
                  { la: 'تكلفة الكراتين', en: 'Cartons cost', v: `${fmt(result.cartonCostAed)} AED`, c: 'text-gray-800' },
                  { la: 'تكلفة التغليف الأساسي', en: 'Primary packaging cost', v: `${fmt(result.primaryCostAed)} AED`, c: 'text-gray-800' },
                  { la: 'رسوم إعداد (طباعة)', en: 'Setup fees (print)', v: `${fmt(result.optionsSetupAed)} AED`, c: 'text-gray-800' },
                  { la: 'إجمالي تكلفة التغليف', en: 'Total packaging cost', v: `${fmt(result.totalPackagingAed)} AED`, c: 'font-black text-green-600 text-base' },
                ].map((row, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3">
                    <div className="text-gray-400 text-xs mb-1">{isAr ? row.la : row.en}</div>
                    <div className={row.c}>{row.v}</div>
                  </div>
                ))}
              </div>
              {result.costPerPrimaryUnit > 0 && (
                <p className="text-xs text-gray-400 mt-3">
                  {isAr ? 'تكلفة التغليف لكل وحدة: ' : 'Packaging cost per unit: '}
                  <strong className="text-gray-600">{result.costPerPrimaryUnit} AED</strong>
                </p>
              )}
              <p className="text-[11px] text-gray-400 mt-2">
                {isAr
                  ? '* الأسعار تقريبية لمتوسط السوق الإماراتي بالجملة. اطلب عرض سعر للحصول على أرقام نهائية من الموردين.'
                  : '* Prices are approximate UAE wholesale market averages. Request a quote for final supplier numbers.'}
              </p>
            </div>
          </section>

          <RfqSection isAr={isAr} payload={{
            product_label: productLabel || (isAr ? 'كراتين / تغليف فقط' : 'Cartons / packaging only'),
            calc: {
              mode: 'cartons', qtyMode, weight, weightUnit, unitsInput,
              primary: primary?.id ?? null, carton: carton?.id ?? null,
              options: selOptions.map(o => o.id), result,
            },
          }} />
        </>
      )}

      {!result && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {isAr ? 'أدخل كمية صالحة لعرض النتائج.' : 'Enter a valid quantity to see results.'}
        </div>
      )}
    </div>
  )
}

// ─── Repackaging calculator (raw material → retail sizes + margin) ───────────

const LABEL_REQUIREMENTS = [
  { id: 'name',        text_ar: 'اسم المنتج باللغتين العربية والإنجليزية',                                    text_en: 'Product name in Arabic and English',                              mandatory: true },
  { id: 'ingredients', text_ar: 'قائمة المكونات بالترتيب التنازلي للوزن (إن تعددت)',                          text_en: 'Ingredient list in descending order by weight (if multiple)',      mandatory: true },
  { id: 'weight',      text_ar: 'الوزن الصافي بالوحدات المترية (g / kg / mL / L)',                           text_en: 'Net weight in metric units (g / kg / mL / L)',                    mandatory: true },
  { id: 'origin',      text_ar: 'بلد منشأ المادة الخام (وليس بلد إعادة التعبئة)',                            text_en: 'Country of origin of raw material (not country of repackaging)',   mandatory: true },
  { id: 'dates',       text_ar: 'تاريخ الإنتاج وتاريخ انتهاء الصلاحية',                                     text_en: 'Production date and expiry date',                                 mandatory: true },
  { id: 'storage',     text_ar: 'ظروف التخزين (°C، جافاً، بعيداً عن الضوء...)',                             text_en: 'Storage conditions (°C, dry, away from light...)',                mandatory: true },
  { id: 'packer',      text_ar: 'اسم وعنوان شركتك في الإمارات (المعبِّأ)',                                   text_en: 'Your UAE company name and address (packer)',                      mandatory: true },
  { id: 'esma',        text_ar: 'رقم تسجيل علامتك التجارية لدى ESMA',                                       text_en: 'Your brand ESMA registration number',                             mandatory: true },
  { id: 'barcode',     text_ar: 'باركود EAN-13 (يحتاج اشتراكاً في GS1 الإمارات ~500 AED/سنة)',              text_en: 'EAN-13 barcode (requires GS1 UAE subscription ~500 AED/year)',    mandatory: true },
  { id: 'nutrition',   text_ar: 'جدول القيم الغذائية (إلزامي لمنتجات التجزئة)',                              text_en: 'Nutrition facts table (mandatory for retail products)',            mandatory: true },
  { id: 'halal',       text_ar: 'علامة الحلال (إن كانت المادة من مصدر حيواني)',                              text_en: 'Halal mark (if material is of animal origin)',                    mandatory: false },
  { id: 'allergens',   text_ar: 'تحذيرات المواد المسببة للحساسية (مكسرات، غلوتين، ألبان...)',               text_en: 'Allergen warnings (nuts, gluten, dairy...)',                       mandatory: false },
]

const OVERHEAD_RATE = 0.08
const WHOLESALE_MULT = 1.30
const RETAIL_MULT    = 1.45

interface SizeResult {
  size: number; units: number; raw_cost: number; pkg_cost: number; overhead: number
  total_cogs: number; wholesale_price: number; retail_price: number
  profit_per_unit: number; total_profit: number; margin_pct: number
}

function RepackCalculator({ isAr }: { isAr: boolean }) {
  const [material, setMaterial]   = useState<RawMaterial | null>(null)
  const [bulkQty, setBulkQty]     = useState('500')
  const [bulkPrice, setBulkPrice] = useState('')
  const [sizes, setSizes]         = useState<number[]>([])
  const [calculated, setCalculated] = useState(false)
  const [catFilter, setCatFilter]   = useState('')

  const cats = [...new Set(RAW_MATERIALS.map(m => m.category_ar))]
  const visibleMaterials = catFilter ? RAW_MATERIALS.filter(m => m.category_ar === catFilter) : RAW_MATERIALS

  function pick(m: RawMaterial) {
    setMaterial(m); setSizes([])
    setBulkPrice(String(((m.typical_price_min + m.typical_price_max) / 2).toFixed(1)))
    setCalculated(false)
  }
  function toggleSize(s: number) {
    setSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s].sort((a, b) => a - b))
    setCalculated(false)
  }

  const results = useMemo<SizeResult[]>(() => {
    if (!material || !bulkQty || !bulkPrice || sizes.length === 0) return []
    const qty = +bulkQty, price = +bulkPrice
    if (!qty || !price) return []
    const net = qty * (material.yield_pct / 100)
    const pkgMap = PKG_COSTS[material.pkg_format] ?? {}
    return sizes.map(sz => {
      const units = Math.floor(net / sz)
      const raw   = price * sz
      const pkg   = pkgMap[sz] ?? 0.5
      const over  = (raw + pkg) * OVERHEAD_RATE
      const cogs  = raw + pkg + over
      const ws    = parseFloat((cogs * WHOLESALE_MULT).toFixed(2))
      const rt    = parseFloat((ws * RETAIL_MULT).toFixed(2))
      const ppu   = parseFloat((ws - cogs).toFixed(2))
      const tp    = parseFloat((ppu * units).toFixed(0))
      const mp    = Math.round((ppu / ws) * 100)
      return { size: sz, units, raw_cost: raw, pkg_cost: pkg, overhead: over, total_cogs: cogs, wholesale_price: ws, retail_price: rt, profit_per_unit: ppu, total_profit: tp, margin_pct: mp }
    })
  }, [material, bulkQty, bulkPrice, sizes])

  const totUnits  = results.reduce((a, r) => a + r.units, 0)
  const totProfit = results.reduce((a, r) => a + r.total_profit, 0)

  return (
    <div className="space-y-8">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-700">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        {isAr
          ? 'هذا الوضع لنشاط إعادة التعبئة — استيراد مواد خام بالجملة وإعادة تعبئتها تحت علامتك الخاصة في الإمارات.'
          : 'This mode is for repackaging — importing bulk raw materials and repackaging under your own UAE brand.'}
      </div>

      {/* STEP 1 */}
      <section>
        <Step num={1} title={isAr ? 'اختر المادة الخام' : 'Select Raw Material'} />
        <div className="flex flex-wrap gap-2 mb-4">
          <Chip active={!catFilter} onClick={() => setCatFilter('')}>{isAr ? 'الكل' : 'All'}</Chip>
          {cats.map(c => <Chip key={c} active={catFilter === c} onClick={() => setCatFilter(c)}>{c}</Chip>)}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visibleMaterials.map(m => {
            const sel = material?.id === m.id
            return (
              <button key={m.id} onClick={() => pick(m)}
                className={`text-start p-4 rounded-2xl border-2 transition-all ${sel ? 'border-orange-400 bg-orange-50 shadow-sm' : 'border-gray-200 bg-white hover:border-orange-200'}`}>
                <div className="flex justify-between mb-2">
                  <span className="text-[10px] font-bold bg-orange-100 text-orange-600 rounded-full px-2 py-0.5">{m.category_ar}</span>
                  {sel && <div className="w-4 h-4 bg-orange-500 rounded-full" />}
                </div>
                <div className="font-black text-gray-900 text-sm leading-tight mb-1">{isAr ? m.name_ar : m.name_en}</div>
                <div className="text-xs text-gray-400">{m.origin_ar} · HS {m.hs_code}</div>
                <div className="mt-2 flex justify-between text-xs">
                  <span className="font-semibold text-green-600">{m.typical_price_min}–{m.typical_price_max} AED/{m.bulk_unit}</span>
                  <span className="text-gray-400">{isAr ? `استرداد ${m.yield_pct}%` : `Yield ${m.yield_pct}%`}</span>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* STEP 2 */}
      {material && (
        <section>
          <Step num={2} title={isAr ? 'الكمية وسعر الشراء' : 'Quantity & Purchase Price'} />
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2">
                  {isAr ? `الكمية المشتراة (${material.bulk_unit})` : `Quantity Purchased (${material.bulk_unit})`}
                </label>
                <input type="number" min="1" value={bulkQty} dir="ltr"
                  onChange={e => { setBulkQty(e.target.value); setCalculated(false) }}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-xl font-black text-gray-900 focus:outline-none focus:border-orange-400" />
                <p className="text-xs text-gray-400 mt-1.5">
                  {isAr ? 'صافي الاسترداد: ' : 'Net yield: '}
                  <strong>{bulkQty ? Math.floor(+bulkQty * material.yield_pct / 100) : '—'} {material.bulk_unit}</strong>
                  {isAr ? ` (بعد خصم فقد التنظيف ${100 - material.yield_pct}%)` : ` (after ${100 - material.yield_pct}% cleaning loss)`}
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2">
                  {isAr ? `سعر الشراء الفعلي (AED/${material.bulk_unit})` : `Actual Purchase Price (AED/${material.bulk_unit})`}
                </label>
                <input type="number" min="0.1" step="0.1" value={bulkPrice} dir="ltr"
                  onChange={e => { setBulkPrice(e.target.value); setCalculated(false) }}
                  placeholder={`${material.typical_price_min}–${material.typical_price_max}`}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-xl font-black text-gray-900 focus:outline-none focus:border-orange-400" />
                <p className="text-xs text-gray-400 mt-1.5">
                  {isAr ? `نطاق السوق: ${material.typical_price_min}–${material.typical_price_max} AED` : `Market range: ${material.typical_price_min}–${material.typical_price_max} AED`}
                </p>
              </div>
            </div>
            <div className="mt-4 bg-gray-50 rounded-xl p-3 text-xs text-gray-500">
              {isAr
                ? `الحاسبة تضيف تلقائياً ${Math.round(OVERHEAD_RATE * 100)}% تكاليف تشغيل (خط التعبئة، عمالة، كهرباء). الهامش محسوب على سعر البيع بالجملة.`
                : `Calculator auto-adds ${Math.round(OVERHEAD_RATE * 100)}% overhead (packaging line, labor, utilities). Margin calculated on wholesale price.`}
            </div>
          </div>
        </section>
      )}

      {/* STEP 3 */}
      {material && bulkQty && bulkPrice && (
        <section>
          <Step num={3} title={isAr ? 'أحجام التعبئة المستهدفة' : 'Target Packaging Sizes'} />
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <p className="text-xs text-gray-400 mb-4">
              {isAr ? 'اختر حجماً أو أكثر — ستحصل على تحليل مالي مستقل لكل حجم' : 'Select one or more sizes — you\'ll get an independent financial analysis for each'}
            </p>
            <div className="flex flex-wrap gap-3 mb-5">
              {material.suitable_sizes.map(sz => {
                const isSel = sizes.includes(sz)
                const net   = +bulkQty * material.yield_pct / 100
                const units = Math.floor(net / sz)
                const pkgCost = (PKG_COSTS[material.pkg_format] ?? {})[sz] ?? 0.5
                const unit = material.bulk_unit === 'L'
                  ? (sz < 1 ? `${sz * 1000}ml` : `${sz}L`)
                  : (sz < 1 ? `${sz * 1000}g` : `${sz}kg`)
                return (
                  <button key={sz} onClick={() => toggleSize(sz)}
                    className={`relative flex flex-col items-center gap-1 px-5 py-4 rounded-2xl border-2 transition-all min-w-[100px] ${isSel ? 'border-orange-400 bg-orange-50 shadow-sm' : 'border-gray-200 bg-white hover:border-orange-200'}`}>
                    <span className="text-xl font-black text-gray-900">{unit}</span>
                    <span className="text-[10px] text-gray-400">{units.toLocaleString()} {isAr ? 'وحدة' : 'units'}</span>
                    <span className="text-[10px] text-blue-500">{pkgCost.toFixed(2)} AED {isAr ? 'غلاف' : 'pkg'}</span>
                    {isSel && <div className="absolute -top-1.5 -end-1.5 w-5 h-5 bg-orange-500 rounded-full" />}
                  </button>
                )
              })}
            </div>
            {sizes.length > 0 && (
              <button onClick={() => setCalculated(true)}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-2xl transition-colors shadow-sm">
                <Calculator className="w-4 h-4" />
                {isAr ? 'احسب الآن' : 'Calculate Now'}
              </button>
            )}
          </div>
        </section>
      )}

      {/* RESULTS */}
      {calculated && results.length > 0 && (
        <>
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-black">✓</div>
              <h2 className="font-black text-gray-900">{isAr ? 'النتائج والتحليل المالي' : 'Results & Financial Analysis'}</h2>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-5">
              {[
                { label_ar: 'إجمالي الوحدات', label_en: 'Total Units', val: totUnits.toLocaleString(), cls: 'bg-blue-50 border-blue-100 text-blue-700' },
                { label_ar: 'تكلفة الخام', label_en: 'Raw Cost', val: `${(+bulkQty * +bulkPrice).toFixed(0)} AED`, cls: 'bg-gray-50 border-gray-100 text-gray-700' },
                { label_ar: 'إجمالي الربح المتوقع', label_en: 'Expected Profit', val: `${totProfit.toLocaleString()} AED`, cls: 'bg-green-50 border-green-100 text-green-700' },
              ].map((s, i) => (
                <div key={i} className={`border rounded-2xl p-4 text-center ${s.cls}`}>
                  <div className="text-lg font-black">{s.val}</div>
                  <div className="text-xs mt-0.5 opacity-70">{isAr ? s.label_ar : s.label_en}</div>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {results.map(r => {
                const unit = material!.bulk_unit === 'L'
                  ? (r.size < 1 ? `${r.size * 1000}ml` : `${r.size}L`)
                  : (r.size < 1 ? `${r.size * 1000}g` : `${r.size}kg`)
                return (
                  <div key={r.size} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-orange-500" />
                        <span className="font-black text-gray-900">{unit}</span>
                        <span className="text-xs text-gray-400">× {r.units.toLocaleString()} {isAr ? 'وحدة' : 'units'}</span>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${r.margin_pct >= 25 ? 'bg-green-100 text-green-700' : r.margin_pct >= 15 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {isAr ? `هامش ${r.margin_pct}%` : `${r.margin_pct}% margin`}
                      </span>
                    </div>
                    <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      {[
                        { la: 'تكلفة الخام/وحدة', en: 'Raw cost/unit',     v: `${r.raw_cost.toFixed(2)} AED`,         c: 'text-gray-700' },
                        { la: 'تكلفة الغلاف/وحدة', en: 'Pkg cost/unit',    v: `${r.pkg_cost.toFixed(2)} AED`,         c: 'text-gray-700' },
                        { la: 'إجمالي التكلفة/وحدة',en: 'Total COGS/unit', v: `${r.total_cogs.toFixed(2)} AED`,       c: 'font-bold text-gray-900' },
                        { la: 'سعر الجملة المقترح', en: 'Wholesale price',  v: `${r.wholesale_price.toFixed(2)} AED`,  c: 'font-black text-orange-600' },
                        { la: 'سعر التجزئة المقترح',en: 'Retail price',     v: `${r.retail_price.toFixed(2)} AED`,    c: 'font-bold text-purple-600' },
                        { la: 'ربح/وحدة',           en: 'Profit/unit',      v: `${r.profit_per_unit.toFixed(2)} AED`, c: 'font-bold text-green-600' },
                        { la: 'إجمالي ربح الدفعة',  en: 'Batch profit',     v: `${r.total_profit.toLocaleString()} AED`, c: 'font-black text-green-700' },
                      ].map((row, i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-3">
                          <div className="text-gray-400 mb-1">{isAr ? row.la : row.en}</div>
                          <div className={row.c}>{row.v}</div>
                        </div>
                      ))}
                    </div>
                    <div className="px-5 pb-4 flex items-center gap-2 text-xs">
                      <span className="text-gray-400 flex-shrink-0">{isAr ? 'هيكل التكلفة' : 'Cost structure'}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden flex">
                        <div className="bg-blue-400 h-full" style={{ width: `${(r.raw_cost / r.wholesale_price) * 100}%` }} />
                        <div className="bg-orange-300 h-full" style={{ width: `${(r.pkg_cost / r.wholesale_price) * 100}%` }} />
                        <div className="bg-gray-300 h-full" style={{ width: `${(r.overhead / r.wholesale_price) * 100}%` }} />
                        <div className="bg-green-400 h-full" style={{ width: `${r.margin_pct}%` }} />
                      </div>
                      {[{ c: 'bg-blue-400', la: 'خام', en: 'Raw' }, { c: 'bg-orange-300', la: 'غلاف', en: 'Pkg' }, { c: 'bg-gray-300', la: 'تشغيل', en: 'OH' }, { c: 'bg-green-400', la: 'ربح', en: 'Profit' }].map(l => (
                        <span key={l.c} className="flex items-center gap-1 text-[10px] text-gray-400">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${l.c}`} />{isAr ? l.la : l.en}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Label requirements */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <CheckSquare className="w-5 h-5 text-orange-500" />
              <h2 className="font-black text-gray-900">{isAr ? 'متطلبات الليبل — UAE.S 9:2019' : 'Label Requirements — UAE.S 9:2019'}</h2>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                {isAr
                  ? 'لبيع منتجك المعبَّأ في السوق الإماراتي تحت علامتك الخاصة، يجب أن يستوفي الليبل هذه المتطلبات وفق UAE.S 9:2019.'
                  : 'To sell your repackaged product in the UAE market under your own brand, the label must meet these requirements per UAE.S 9:2019.'}
              </p>
              <div className="space-y-2.5">
                {LABEL_REQUIREMENTS.map(req => (
                  <div key={req.id} className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-black ${req.mandatory ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
                      {req.mandatory ? '!' : '?'}
                    </div>
                    <div>
                      <span className="text-sm text-gray-700">{isAr ? req.text_ar : req.text_en}</span>
                      <span className={`ms-2 text-[10px] font-bold px-1.5 py-0.5 rounded ${req.mandatory ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-400'}`}>
                        {req.mandatory ? (isAr ? 'إلزامي' : 'Mandatory') : (isAr ? 'اختياري' : 'Optional')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 flex items-start gap-2">
                <TrendingUp className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  {isAr
                    ? <><strong>تسجيل علامتك في ESMA:</strong> ضروري قبل وضع رقم التسجيل على الليبل. التكلفة التقديرية 3,000–8,000 AED للمنتج الأول، المدة 2–4 أشهر. تحتاج كذلك اشتراكاً في GS1 الإمارات للحصول على بارككود EAN-13 (~500 AED سنوياً).</>
                    : <><strong>ESMA brand registration:</strong> Required before printing the registration number. Estimated 3,000–8,000 AED for the first product, 2–4 months processing. You also need GS1 UAE subscription for EAN-13 barcode (~500 AED/year).</>}
                </div>
              </div>
              {material && (
                <div className="mt-3 p-3 bg-gray-50 rounded-xl text-xs text-gray-600">
                  <strong>{isAr ? 'ملاحظة للمادة المختارة: ' : 'Note for selected material: '}</strong>
                  {material.halal_note}
                </div>
              )}
            </div>
          </section>

          <RfqSection isAr={isAr} payload={{
            product_label: material ? `${isAr ? material.name_ar : material.name_en} (${isAr ? 'إعادة تعبئة' : 'repack'})` : '',
            calc: { mode: 'repack', material: material?.id, bulkQty, bulkPrice, sizes, results },
          }} />
        </>
      )}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PackagingPage() {
  const params = useParams()
  const locale = (params.locale as string) || 'ar'
  const isAr = locale === 'ar'
  const [mode, setMode] = useState<'cartons' | 'repack'>('cartons')
  const [primaryPacks,   setPrimaryPacks]   = useState<PrimaryPack[]>([])
  const [masterCartons,  setMasterCartons]  = useState<MasterCarton[]>([])
  const [packagingOptions, setPackagingOptions] = useState<PackagingOption[]>([])

  useEffect(() => {
    fetch('/api/packaging/specs')
      .then(r => r.json())
      .then(d => {
        if (d.primary_packs)  setPrimaryPacks(d.primary_packs.filter((p: PrimaryPack & { is_active: boolean }) => p.is_active))
        if (d.master_cartons) setMasterCartons(d.master_cartons.filter((c: MasterCarton & { is_active: boolean }) => c.is_active))
        if (d.options)        setPackagingOptions(d.options.filter((o: PackagingOption & { is_active: boolean }) => o.is_active))
      })
      .catch(() => {/* silently fallback to empty — calc shows placeholder */})
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                {isAr ? 'حاسبة التعبئة والتغليف' : 'Packaging Calculator'}
              </h1>
              <p className="text-gray-400 text-sm mt-0.5">
                {isAr
                  ? 'احسب الكراتين والكمية والتكلفة ومساحة المخزن — ثم اطلب عرض سعر من Crate'
                  : 'Calculate cartons, quantity, cost and warehouse space — then request a quote from Crate'}
              </p>
            </div>
          </div>

          {/* Mode tabs */}
          <div className="inline-flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {([
              { v: 'cartons', ar: 'حساب التغليف والكراتين', en: 'Packaging & Cartons' },
              { v: 'repack',  ar: 'إعادة تعبئة مادة خام',   en: 'Repackaging' },
            ] as const).map(t => (
              <button key={t.v} onClick={() => setMode(t.v)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  mode === t.v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {isAr ? t.ar : t.en}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {mode === 'cartons'
          ? <CartonsCalculator isAr={isAr} primaryPacks={primaryPacks} masterCartons={masterCartons} packagingOptions={packagingOptions} />
          : <RepackCalculator isAr={isAr} />}
      </div>
    </div>
  )
}
