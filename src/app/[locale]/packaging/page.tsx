'use client'
import { useState, useMemo, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  Package, Calculator, AlertCircle, CheckSquare, TrendingUp,
  Boxes, Warehouse, Layers, Send, Truck, MapPin, Loader2, CheckCircle2,
  ChevronRight, ChevronLeft, ArrowLeft, ArrowRight,
} from 'lucide-react'
import { RAW_MATERIALS, PKG_COSTS, type RawMaterial } from '@/lib/data/products-catalog'
import {
  calcPackaging,
  type PrimaryPack, type MasterCarton, type PackagingOption, type PackagingCalcResult,
} from '@/lib/data/packaging-specs'

// ─── SVG Mockups ─────────────────────────────────────────────────────────────

function BagSvg({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <rect x="10" y="16" width="36" height="36" rx="5" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.2"/>
      <path d="M18 16c0-6 20-6 20 0" stroke="#cbd5e1" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <rect x="14" y="22" width="28" height="1.5" rx=".75" fill="#e2e8f0"/>
      <rect x="14" y="26" width="20" height="1.2" rx=".6" fill="#e2e8f0"/>
      <rect x="14" y="36" width="28" height="8" rx="3" fill="#f1f5f9"/>
      <rect x="17" y="39" width="10" height="1.5" rx=".75" fill="#cbd5e1"/>
    </svg>
  )
}

function BottleSvg({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <rect x="22" y="8" width="12" height="8" rx="3" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1"/>
      <path d="M19 20q-1-4 3-4h12q4 0 3 4l2 28q0 4-9 4t-9-4z" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.2"/>
      <rect x="20" y="28" width="16" height="1.5" rx=".75" fill="#e2e8f0"/>
      <rect x="21" y="34" width="14" height="6" rx="2" fill="#f1f5f9"/>
      <rect x="23" y="36" width="7" height="1.5" rx=".75" fill="#cbd5e1"/>
    </svg>
  )
}

function JarSvg({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <rect x="18" y="10" width="20" height="6" rx="3" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1"/>
      <rect x="14" y="16" width="28" height="34" rx="6" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.2"/>
      <rect x="16" y="24" width="24" height="1.5" rx=".75" fill="#e2e8f0"/>
      <rect x="18" y="31" width="20" height="8" rx="3" fill="#f1f5f9"/>
      <rect x="20" y="34" width="8" height="1.5" rx=".75" fill="#cbd5e1"/>
    </svg>
  )
}

function BoxSvg({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <rect x="8" y="18" width="40" height="32" rx="3" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.2"/>
      <path d="M8 26h40" stroke="#e2e8f0" strokeWidth="1.2"/>
      <path d="M28 18v8" stroke="#e2e8f0" strokeWidth="1.2"/>
      <rect x="14" y="32" width="28" height="12" rx="2" fill="#f1f5f9"/>
      <rect x="17" y="35" width="9" height="1.5" rx=".75" fill="#cbd5e1"/>
    </svg>
  )
}

function PouchSvg({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <path d="M16 14h24l2 36q0 4-14 4t-14-4z" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.2"/>
      <rect x="16" y="14" width="24" height="6" rx="2" fill="#e2e8f0"/>
      <rect x="18" y="26" width="20" height="8" rx="2" fill="#f1f5f9"/>
      <rect x="20" y="29" width="8" height="1.5" rx=".75" fill="#cbd5e1"/>
    </svg>
  )
}

function CanSvg({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <ellipse cx="28" cy="14" rx="16" ry="5" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1"/>
      <rect x="12" y="14" width="32" height="30" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.2"/>
      <ellipse cx="28" cy="44" rx="16" ry="5" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1"/>
      <rect x="14" y="23" width="28" height="10" rx="2" fill="#f1f5f9"/>
      <rect x="17" y="26" width="8" height="1.5" rx=".75" fill="#cbd5e1"/>
    </svg>
  )
}

function CartonSvg({ size = 56, tint = '#f8fafc', stroke = '#e2e8f0' }: { size?: number; tint?: string; stroke?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <rect x="8" y="18" width="36" height="28" rx="3" fill={tint} stroke={stroke} strokeWidth="1.2"/>
      <path d={`M8 18l5-8h26l5 8`} fill={tint} stroke={stroke} strokeWidth="1.2"/>
      <path d="M26 10v8" stroke={stroke} strokeWidth="1" strokeDasharray="2 1.5"/>
      <path d="M8 26h36" stroke={stroke} strokeWidth="1"/>
      <path d="M44 18l5-5v33l-5 4" fill={tint} stroke={stroke} strokeWidth="1"/>
      <rect x="12" y="30" width="26" height="12" rx="2" fill={stroke} opacity=".4"/>
      <rect x="15" y="33" width="8" height="1.5" rx=".75" fill={stroke}/>
    </svg>
  )
}

const PACK_SVGS: Record<string, React.FC<{ size?: number }>> = {
  bag: BagSvg, bottle: BottleSvg, jar: JarSvg, box: BoxSvg, pouch: PouchSvg, can: CanSvg,
}

const CARTON_TINTS = ['#f8fafc', '#eff6ff', '#f0fdf4', '#fefce8', '#fdf4ff', '#fff7ed', '#f0f9ff']
const CARTON_STROKES = ['#e2e8f0', '#dbeafe', '#bbf7d0', '#fef08a', '#e9d5ff', '#fed7aa', '#bae6fd']

// ─── Selector style helpers ───────────────────────────────────────────────────
// Selected = orange border only, background stays white
const cardBase = 'group flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all duration-150 bg-white cursor-pointer'
const cardIdle = 'border-slate-200 hover:border-orange-300 hover:shadow-sm'
const cardSel  = 'border-orange-500 shadow-sm'

const cardWideBase = 'group text-start p-4 rounded-2xl border-2 transition-all duration-150 bg-white cursor-pointer'
const cardWideIdle = 'border-slate-200 hover:border-orange-300 hover:shadow-sm'
const cardWideSel  = 'border-orange-500 shadow-sm'

// ─── RFQ section ─────────────────────────────────────────────────────────────

interface RfqPayload { product_label: string; calc: unknown }

function RfqSection({ isAr, payload }: { isAr: boolean; payload: RfqPayload }) {
  const [open, setOpen]       = useState(false)
  const [sending, setSending] = useState(false)
  const [done, setDone]       = useState(false)
  const [err, setErr]         = useState<string | null>(null)
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, product_label: payload.product_label, calc: payload.calc }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'failed') }
      setDone(true)
    } catch {
      setErr(isAr ? 'تعذّر إرسال الطلب، حاول مجدداً' : 'Could not send request, please try again')
    } finally { setSending(false) }
  }

  if (done) return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 text-center">
      <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-7 h-7 text-emerald-600" />
      </div>
      <h3 className="font-black text-emerald-900 text-lg mb-2">{isAr ? 'وصلنا طلبك!' : 'Request received!'}</h3>
      <p className="text-sm text-emerald-700 max-w-sm mx-auto leading-relaxed">
        {isAr
          ? 'فريق Crate سيجمع أفضل الأسعار من الموردين والمصانع ويعود إليك بعرض شامل.'
          : 'The Crate team will gather the best prices from suppliers and factories and come back with a full quote.'}
      </p>
    </div>
  )

  return (
    <div className="bg-slate-900 rounded-3xl p-7 text-white">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Send className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-black text-lg mb-1">{isAr ? 'اطلب عرض سعر من Crate' : 'Request a quote from Crate'}</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            {isAr
              ? 'نجمع الأسعار من مصانع الكراتين والموردين ونعود إليك بعرض واحد شامل.'
              : 'We collect prices from carton factories and suppliers and return one complete offer.'}
          </p>
        </div>
      </div>

      {!open ? (
        <button onClick={() => setOpen(true)}
          className="bg-white text-slate-900 font-black px-6 py-3 rounded-2xl text-sm hover:bg-slate-100 transition-colors">
          {isAr ? 'متابعة لطلب السعر ←' : '→ Continue to quote request'}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { k: 'contact_name', pa: 'الاسم *', pe: 'Name *', t: 'text', d: 'auto' },
              { k: 'company_name', pa: 'اسم الشركة', pe: 'Company', t: 'text', d: 'auto' },
              { k: 'email', pa: 'البريد الإلكتروني', pe: 'Email', t: 'email', d: 'ltr' },
              { k: 'phone', pa: 'الهاتف / واتساب', pe: 'Phone / WhatsApp', t: 'text', d: 'ltr' },
            ].map(f => (
              <input key={f.k} type={f.t}
                value={form[f.k as keyof typeof form] as string}
                onChange={e => setForm({ ...form, [f.k]: e.target.value })}
                placeholder={isAr ? f.pa : f.pe} dir={f.d}
                className="px-4 py-3 rounded-xl text-sm text-slate-900 bg-white/95 focus:outline-none placeholder:text-slate-400" />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{isAr ? 'الاستلام:' : 'Fulfilment:'}</span>
            {([
              { v: 'delivery', ar: 'توصيل', en: 'Delivery', Icon: Truck },
              { v: 'pickup',   ar: 'من الموقع', en: 'Pickup',   Icon: MapPin },
            ] as const).map(o => (
              <button key={o.v} onClick={() => setForm({ ...form, fulfilment: o.v })}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                  form.fulfilment === o.v ? 'bg-white text-slate-900' : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}>
                <o.Icon className="w-3.5 h-3.5" />{isAr ? o.ar : o.en}
              </button>
            ))}
          </div>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
            placeholder={isAr ? 'ملاحظات — ماركة، طباعة، موعد التسليم...' : 'Notes — brand, printing, deadline...'}
            dir={isAr ? 'rtl' : 'ltr'} rows={2}
            className="w-full px-4 py-3 rounded-xl text-sm text-slate-900 bg-white/95 focus:outline-none resize-none placeholder:text-slate-400" />
          {err && <p className="text-xs text-amber-300 font-semibold">{err}</p>}
          <button onClick={submit} disabled={sending}
            className="flex items-center gap-2 bg-white text-slate-900 font-black px-6 py-3 rounded-2xl text-sm hover:bg-slate-100 transition-colors disabled:opacity-60">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isAr ? 'إرسال طلب عرض السعر' : 'Send quote request'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Cartons Calculator (2-phase wizard, no background on select) ─────────────

type WeightUnit = 'kg' | 'ton'
type Phase = 'setup' | 'carton' | 'results'

interface CartonsCalcProps {
  isAr: boolean
  primaryPacks: PrimaryPack[]
  masterCartons: MasterCarton[]
  packagingOptions: PackagingOption[]
}

function CartonsCalculator({ isAr, primaryPacks, masterCartons, packagingOptions }: CartonsCalcProps) {
  const [phase, setPhase]             = useState<Phase>('setup')
  const [productLabel, setProductLabel] = useState('')
  const [qtyMode, setQtyMode]         = useState<'weight' | 'units'>('weight')
  const [weight, setWeight]           = useState('10')
  const [weightUnit, setWeightUnit]   = useState<WeightUnit>('ton')
  const [unitsInput, setUnitsInput]   = useState('5000')
  const [primary, setPrimary]         = useState<PrimaryPack | null>(null)
  const [carton, setCarton]           = useState<MasterCarton | null>(null)
  const [selOptions, setSelOptions]   = useState<PackagingOption[]>([])
  const [printNotes, setPrintNotes]   = useState('')

  useEffect(() => {
    if (primary === null && primaryPacks.length > 0)
      setPrimary(primaryPacks.find(p => p.size_label === '1kg') ?? primaryPacks[0])
    if (carton === null && masterCartons.length > 0)
      setCarton(masterCartons[1] ?? masterCartons[0])
  }, [primaryPacks, masterCartons, primary, carton])

  function toggleOption(o: PackagingOption) {
    setSelOptions(prev => prev.some(x => x.id === o.id) ? prev.filter(x => x.id !== o.id) : [...prev, o])
  }

  const hasCustomPrint = selOptions.some(o => Number(o.setup_aed) > 0)

  const result = useMemo<PackagingCalcResult | null>(() => {
    if (!carton || phase !== 'results') return null
    const totalWeightKg = qtyMode === 'weight'
      ? (parseFloat(weight) || 0) * (weightUnit === 'ton' ? 1000 : 1)
      : null
    const totalUnits = qtyMode === 'units' ? (parseInt(unitsInput) || 0) : null
    return calcPackaging({ totalWeightKg, totalUnits, primary, carton, options: selOptions })
  }, [qtyMode, weight, weightUnit, unitsInput, primary, carton, selOptions, phase])

  // Always English numbers
  const fmt = (n: number) => n.toLocaleString('en-US')

  // ── PHASE: SETUP (steps 1-3) ────────────────────────────────────────────────
  if (phase === 'setup') return (
    <div className="space-y-5">
      {/* Steps 1 + 2 side by side */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Step 1 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center text-white text-[11px] font-black flex-shrink-0">1</div>
            <h2 className="font-black text-slate-800 text-sm">{isAr ? 'ما الذي تريد تعبئته؟' : 'What are you packing?'}</h2>
          </div>
          <input value={productLabel} onChange={e => setProductLabel(e.target.value)}
            placeholder={isAr ? 'مثال: أرز Sunwhite 1كجم (اختياري)' : 'e.g. Sunwhite Rice 1kg (optional)'}
            dir={isAr ? 'rtl' : 'ltr'}
            className="w-full text-sm border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400 text-slate-800 placeholder:text-slate-400 transition-colors" />
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            {isAr ? 'يساعد في توجيه طلب السعر للجهة الصحيحة' : 'Helps route your quote to the right party'}
          </p>
        </div>

        {/* Step 2 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center text-white text-[11px] font-black flex-shrink-0">2</div>
            <h2 className="font-black text-slate-800 text-sm">{isAr ? 'الكمية' : 'Quantity'}</h2>
            {/* Mode toggle */}
            <div className="ms-auto flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
              {(['weight','units'] as const).map(m => (
                <button key={m} onClick={() => setQtyMode(m)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${qtyMode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                  {m === 'weight' ? (isAr ? 'وزن' : 'Weight') : (isAr ? 'عدد' : 'Units')}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="number" min="0" value={qtyMode === 'weight' ? weight : unitsInput} dir="ltr"
              onChange={e => qtyMode === 'weight' ? setWeight(e.target.value) : setUnitsInput(e.target.value)}
              className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-3 text-2xl font-black text-slate-900 focus:outline-none focus:border-orange-400 transition-colors" />
            {qtyMode === 'weight' && (
              <div className="flex flex-col gap-1">
                {(['ton','kg'] as WeightUnit[]).map(u => (
                  <button key={u} onClick={() => setWeightUnit(u)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-colors ${
                      weightUnit === u ? 'border-orange-500 text-orange-600 bg-orange-50' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}>
                    {u === 'ton' ? (isAr ? 'طن' : 'ton') : 'kg'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step 3 — primary pack (weight mode) */}
      {qtyMode === 'weight' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center text-white text-[11px] font-black flex-shrink-0">3</div>
            <h2 className="font-black text-slate-800 text-sm">{isAr ? 'التغليف الأساسي (الوحدة)' : 'Primary packaging'}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* None */}
            <button onClick={() => setPrimary(null)}
              className={`${cardBase} min-w-[72px] ${!primary ? cardSel : cardIdle}`}>
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-slate-400" />
              </div>
              <span className="text-[11px] font-bold text-slate-600">{isAr ? 'سائب' : 'Bulk'}</span>
            </button>

            {primaryPacks.map(pp => {
              const Svg = PACK_SVGS[pp.type] ?? BagSvg
              const sel = primary?.id === pp.id
              return (
                <button key={pp.id} onClick={() => setPrimary(pp)}
                  className={`${cardBase} min-w-[72px] ${sel ? cardSel : cardIdle}`}>
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                    <Svg size={36} />
                  </div>
                  <span className="text-xs font-black text-slate-900">{pp.size_label}</span>
                  <span className="text-[10px] text-slate-400">{isAr ? pp.type_ar : pp.type_en}</span>
                  <span className="text-[10px] font-semibold text-orange-500">{Number(pp.cost_aed).toFixed(2)} AED</span>
                </button>
              )
            })}
          </div>
          {primary && (
            <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1.5">
              <span className="w-1 h-3 bg-slate-300 rounded-full" />
              {isAr ? primary.material_ar : primary.material_en}
              {primary.suitable_for_ar ? ` · ${isAr ? primary.suitable_for_ar : primary.suitable_for_en}` : ''}
            </p>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={() => setPhase('carton')}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-700 text-white font-black px-7 py-3 rounded-2xl text-sm transition-colors shadow-sm">
          {isAr ? 'التالي' : 'Next'}
          {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )

  // ── PHASE: CARTON + OPTIONS ─────────────────────────────────────────────────
  if (phase === 'carton') return (
    <div className="space-y-5">
      {/* Summary bar */}
      <button onClick={() => setPhase('setup')}
        className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800 transition-colors">
        {isAr ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
        {productLabel || (isAr ? 'مواد التعبئة' : 'Packaging')}
        <span className="mx-1 text-slate-300">·</span>
        {qtyMode === 'weight'
          ? `${weight} ${weightUnit === 'ton' ? (isAr ? 'طن' : 'ton') : 'kg'}`
          : `${parseInt(unitsInput).toLocaleString('en-US')} ${isAr ? 'وحدة' : 'units'}`}
        {primary && <><span className="mx-1 text-slate-300">·</span>{primary.size_label}</>}
        <span className="text-orange-500 underline">{isAr ? '(تعديل)' : '(edit)'}</span>
      </button>

      {/* Step 4 — carton */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center text-white text-[11px] font-black flex-shrink-0">4</div>
          <h2 className="font-black text-slate-800 text-sm">{isAr ? 'كرتون الشحن والتخزين' : 'Master carton'}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {masterCartons.map((mc, idx) => {
            const sel = carton?.id === mc.id
            const tint = CARTON_TINTS[idx % CARTON_TINTS.length]
            const stk  = CARTON_STROKES[idx % CARTON_STROKES.length]
            return (
              <button key={mc.id} onClick={() => setCarton(mc)}
                className={`${cardWideBase} ${sel ? cardWideSel : cardWideIdle}`}>
                {/* Image or SVG */}
                {mc.image_url ? (
                  <img src={mc.image_url} alt={isAr ? mc.name_ar : mc.name_en}
                    className="w-full h-24 object-contain mb-3 rounded-xl bg-slate-50" />
                ) : (
                  <div className="w-full h-16 flex items-center justify-center mb-3">
                    <CartonSvg size={52} tint={tint} stroke={stk} />
                  </div>
                )}
                <div className="font-black text-slate-900 text-xs leading-tight mb-1">{isAr ? mc.name_ar : mc.name_en}</div>
                <div className="text-[10px] text-slate-400 tabular-nums">{mc.l_cm}×{mc.w_cm}×{mc.h_cm} cm</div>
                <div className="text-[10px] text-slate-400">{isAr ? `حتى ${mc.max_weight_kg}كجم` : `up to ${mc.max_weight_kg}kg`}</div>
                <div className="text-[10px] font-bold text-orange-500 mt-1">{Number(mc.cost_aed).toFixed(1)} AED</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Step 5 — options */}
      {packagingOptions.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center text-white text-[11px] font-black flex-shrink-0">5</div>
            <h2 className="font-black text-slate-800 text-sm">{isAr ? 'المواصفات والخيارات' : 'Specs & options'}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {packagingOptions.map(o => {
              const sel = selOptions.some(x => x.id === o.id)
              return (
                <button key={o.id} onClick={() => toggleOption(o)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-bold transition-colors ${
                    sel ? 'border-orange-500 text-orange-600 bg-orange-50' : 'border-slate-200 text-slate-600 hover:border-orange-300 bg-white'
                  }`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${sel ? 'border-orange-500 bg-orange-500' : 'border-slate-300'}`}>
                    {sel && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  {isAr ? o.label_ar : o.label_en}
                  {Number(o.setup_aed) > 0 && <span className="text-[10px] text-slate-400 font-normal">{o.setup_aed} AED</span>}
                </button>
              )
            })}
          </div>

          {/* Print notes — shown when custom print (setup_aed > 0) is selected */}
          {hasCustomPrint && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-600 mb-2">
                {isAr ? 'ملاحظات الطباعة (لوغو، ألوان، مواصفات الطباعة...)' : 'Print notes (logo, colors, print specs...)'}
              </label>
              <textarea value={printNotes} onChange={e => setPrintNotes(e.target.value)}
                rows={2} dir={isAr ? 'rtl' : 'ltr'}
                placeholder={isAr ? 'مثال: لوغو موجود بصيغة AI، ألوان CMYK، طباعة من وجهين' : 'e.g. AI logo ready, CMYK colors, double-sided print'}
                className="w-full border-2 border-orange-200 bg-orange-50 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-orange-400 resize-none placeholder:text-slate-400 transition-colors" />
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button onClick={() => setPhase('setup')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-bold transition-colors">
          {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {isAr ? 'السابق' : 'Back'}
        </button>
        <button onClick={() => setPhase('results')} disabled={!carton}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black px-7 py-3 rounded-2xl text-sm transition-colors shadow-sm">
          <Calculator className="w-4 h-4" />
          {isAr ? 'احسب الآن' : 'Calculate Now'}
        </button>
      </div>
    </div>
  )

  // ── PHASE: RESULTS ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Back bar */}
      <button onClick={() => setPhase('carton')}
        className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800 transition-colors">
        {isAr ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
        {isAr ? 'تعديل الاختيارات' : 'Edit selections'}
      </button>

      {result ? (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { Icon: Package,   v: result.primaryUnits > 0 ? fmt(result.primaryUnits) : '—', la: 'وحدة معبأة',     en: 'Primary units',  cls: 'bg-blue-50 border-blue-100 text-blue-700' },
              { Icon: Boxes,     v: fmt(result.totalCartons),                                  la: 'إجمالي الكراتين', en: 'Total cartons',  cls: 'bg-orange-50 border-orange-100 text-orange-700' },
              { Icon: Layers,    v: fmt(result.pallets),                                       la: 'باليت',           en: 'Pallets',        cls: 'bg-purple-50 border-purple-100 text-purple-700' },
              { Icon: Warehouse, v: `${result.floorAreaM2} m²`,                               la: 'مساحة الأرضية',  en: 'Floor area',     cls: 'bg-slate-50 border-slate-200 text-slate-700' },
            ].map((s, i) => (
              <div key={i} className={`border rounded-2xl p-4 ${s.cls}`}>
                <s.Icon className="w-4 h-4 mb-2 opacity-50" />
                <div className="text-2xl font-black leading-none tabular-nums">{s.v}</div>
                <div className="text-[11px] mt-1 opacity-70">{isAr ? s.la : s.en}</div>
              </div>
            ))}
          </div>

          {/* Cost breakdown */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
              {[
                { la: 'وحدة لكل كرتون',       en: 'Units per carton',       v: result.primaryUnits > 0 ? fmt(result.unitsPerCarton) : (isAr ? 'وزن سائب' : 'loose') },
                { la: 'حجم التخزين',           en: 'Storage volume',          v: `${result.storageVolumeM3} m³` },
                { la: 'تكلفة الكراتين',        en: 'Cartons cost',            v: `${fmt(result.cartonCostAed)} AED` },
                { la: 'تكلفة التغليف الأساسي', en: 'Primary packaging cost',  v: `${fmt(result.primaryCostAed)} AED` },
                { la: 'رسوم إعداد (طباعة)',    en: 'Setup fees (print)',       v: `${fmt(result.optionsSetupAed)} AED` },
                { la: 'إجمالي تكلفة التغليف', en: 'Total packaging cost',    v: `${fmt(result.totalPackagingAed)} AED`, bold: true },
              ].map((row, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-3">
                  <div className="text-[11px] text-slate-400 mb-1">{isAr ? row.la : row.en}</div>
                  <div className={`tabular-nums ${row.bold ? 'font-black text-emerald-600 text-base' : 'font-semibold text-slate-800 text-sm'}`}>{row.v}</div>
                </div>
              ))}
            </div>
            {result.costPerPrimaryUnit > 0 && (
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <span className="w-1 h-3 bg-slate-200 rounded-full" />
                {isAr ? 'تكلفة التغليف لكل وحدة: ' : 'Packaging cost per unit: '}
                <strong className="text-slate-600 tabular-nums">{result.costPerPrimaryUnit} AED</strong>
              </p>
            )}
            <p className="text-[11px] text-slate-400 mt-2">
              {isAr
                ? '* الأسعار تقريبية بمتوسط السوق الإماراتي. اطلب عرض سعر للحصول على أرقام نهائية.'
                : '* Prices are approximate UAE market averages. Request a quote for final numbers.'}
            </p>
          </div>

          <RfqSection isAr={isAr} payload={{
            product_label: productLabel || (isAr ? 'كراتين / تغليف فقط' : 'Cartons / packaging only'),
            calc: {
              mode: 'cartons', qtyMode, weight, weightUnit, unitsInput,
              primary: primary?.id ?? null, carton: carton?.id ?? null,
              options: selOptions.map(o => o.id), printNotes, result,
            },
          }} />
        </>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {isAr ? 'أدخل كمية صالحة لعرض النتائج.' : 'Enter a valid quantity to see results.'}
        </div>
      )}
    </div>
  )
}

// ─── Repackaging calculator ───────────────────────────────────────────────────

const LABEL_REQUIREMENTS = [
  { id: 'name',        text_ar: 'اسم المنتج باللغتين العربية والإنجليزية',                               text_en: 'Product name in Arabic and English',                           mandatory: true },
  { id: 'ingredients', text_ar: 'قائمة المكونات بالترتيب التنازلي للوزن (إن تعددت)',                     text_en: 'Ingredient list in descending order by weight (if multiple)',  mandatory: true },
  { id: 'weight',      text_ar: 'الوزن الصافي بالوحدات المترية (g / kg / mL / L)',                      text_en: 'Net weight in metric units (g / kg / mL / L)',                 mandatory: true },
  { id: 'origin',      text_ar: 'بلد منشأ المادة الخام',                                                text_en: 'Country of origin of raw material',                            mandatory: true },
  { id: 'dates',       text_ar: 'تاريخ الإنتاج وتاريخ انتهاء الصلاحية',                                text_en: 'Production date and expiry date',                              mandatory: true },
  { id: 'storage',     text_ar: 'ظروف التخزين (°C، جافاً، بعيداً عن الضوء...)',                        text_en: 'Storage conditions (°C, dry, away from light...)',             mandatory: true },
  { id: 'packer',      text_ar: 'اسم وعنوان شركتك في الإمارات (المعبِّأ)',                              text_en: 'Your UAE company name and address (packer)',                   mandatory: true },
  { id: 'esma',        text_ar: 'رقم تسجيل علامتك التجارية لدى ESMA',                                  text_en: 'Your brand ESMA registration number',                          mandatory: true },
  { id: 'barcode',     text_ar: 'باركود EAN-13 (GS1 الإمارات ~500 AED/سنة)',                           text_en: 'EAN-13 barcode (GS1 UAE ~500 AED/year)',                       mandatory: true },
  { id: 'nutrition',   text_ar: 'جدول القيم الغذائية (إلزامي لمنتجات التجزئة)',                         text_en: 'Nutrition facts table (mandatory for retail products)',         mandatory: true },
  { id: 'halal',       text_ar: 'علامة الحلال (إن كانت المادة من مصدر حيواني)',                         text_en: 'Halal mark (if material is of animal origin)',                 mandatory: false },
  { id: 'allergens',   text_ar: 'تحذيرات المواد المسببة للحساسية (مكسرات، غلوتين، ألبان...)',          text_en: 'Allergen warnings (nuts, gluten, dairy...)',                   mandatory: false },
]

const OVERHEAD_RATE = 0.08
const WHOLESALE_MULT = 1.30
const RETAIL_MULT    = 1.45

interface SizeResult {
  size: number; units: number; raw_cost: number; pkg_cost: number; overhead: number
  total_cogs: number; wholesale_price: number; retail_price: number
  profit_per_unit: number; total_profit: number; margin_pct: number
}

type RepackPhase = 'select' | 'calc' | 'results'

function RepackCalculator({ isAr }: { isAr: boolean }) {
  const [rPhase, setRPhase]         = useState<RepackPhase>('select')
  const [material, setMaterial]     = useState<RawMaterial | null>(null)
  const [bulkQty, setBulkQty]       = useState('500')
  const [bulkPrice, setBulkPrice]   = useState('')
  const [sizes, setSizes]           = useState<number[]>([])
  const [catFilter, setCatFilter]   = useState('')

  const cats = [...new Set(RAW_MATERIALS.map(m => m.category_ar))]
  const visibleMaterials = catFilter ? RAW_MATERIALS.filter(m => m.category_ar === catFilter) : RAW_MATERIALS

  function pick(m: RawMaterial) {
    setMaterial(m); setSizes([])
    setBulkPrice(String(((m.typical_price_min + m.typical_price_max) / 2).toFixed(1)))
    setRPhase('select')
  }
  function toggleSize(s: number) {
    setSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s].sort((a, b) => a - b))
  }

  const results = useMemo<SizeResult[]>(() => {
    if (!material || !bulkQty || !bulkPrice || sizes.length === 0 || rPhase !== 'results') return []
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
  }, [material, bulkQty, bulkPrice, sizes, rPhase])

  const totUnits  = results.reduce((a, r) => a + r.units, 0)
  const totProfit = results.reduce((a, r) => a + r.total_profit, 0)

  // ── REPACK PHASE: SELECT (steps 1-3 together) ─────────────────────────────
  if (rPhase === 'select' || rPhase === 'calc') return (
    <div className="space-y-5">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-800">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
        {isAr ? 'استيراد مواد خام بالجملة وإعادة تعبئتها تحت علامتك الخاصة في الإمارات.' : 'Import bulk raw materials and repackage under your own UAE brand.'}
      </div>

      <div className="grid md:grid-cols-5 gap-4">
        {/* Left: Step 1 — material selection */}
        <div className="md:col-span-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center text-white text-[11px] font-black flex-shrink-0">1</div>
            <h2 className="font-black text-slate-800 text-sm">{isAr ? 'اختر المادة الخام' : 'Select Raw Material'}</h2>
          </div>
          {/* Category filter */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <button onClick={() => setCatFilter('')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${!catFilter ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-500 hover:border-orange-300'}`}>
              {isAr ? 'الكل' : 'All'}
            </button>
            {cats.map(c => (
              <button key={c} onClick={() => setCatFilter(c)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${catFilter === c ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-500 hover:border-orange-300'}`}>
                {c}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
            {visibleMaterials.map(m => {
              const sel = material?.id === m.id
              return (
                <button key={m.id} onClick={() => pick(m)}
                  className={`text-start p-3 rounded-xl border-2 transition-colors ${sel ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-orange-300 bg-white'}`}>
                  <span className="text-[10px] font-bold bg-orange-100 text-orange-600 rounded-full px-1.5 py-0.5">{m.category_ar}</span>
                  <div className="font-black text-slate-900 text-xs mt-1.5 leading-tight">{isAr ? m.name_ar : m.name_en}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{m.origin_ar}</div>
                  <div className="text-[10px] font-semibold text-emerald-600 mt-1">{m.typical_price_min}–{m.typical_price_max} AED/{m.bulk_unit}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right: Steps 2+3 */}
        <div className="md:col-span-2 flex flex-col gap-4">
          {/* Step 2 — qty + price */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center text-white text-[11px] font-black flex-shrink-0">2</div>
              <h2 className="font-black text-slate-800 text-sm">{isAr ? 'الكمية والسعر' : 'Qty & Price'}</h2>
            </div>
            {material ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-slate-400 font-bold mb-1 block">{isAr ? `الكمية (${material.bulk_unit})` : `Qty (${material.bulk_unit})`}</label>
                  <input type="number" min="1" value={bulkQty} dir="ltr"
                    onChange={e => setBulkQty(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-xl font-black text-slate-900 focus:outline-none focus:border-orange-400 transition-colors tabular-nums" />
                  <p className="text-[11px] text-slate-400 mt-1">
                    {isAr ? 'صافي: ' : 'Net: '}<strong className="text-slate-600 tabular-nums">{Math.floor(+bulkQty * material.yield_pct / 100)} {material.bulk_unit}</strong>
                  </p>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-bold mb-1 block">{isAr ? `سعر الشراء (AED/${material.bulk_unit})` : `Price (AED/${material.bulk_unit})`}</label>
                  <input type="number" min="0.1" step="0.1" value={bulkPrice} dir="ltr"
                    onChange={e => setBulkPrice(e.target.value)}
                    placeholder={`${material.typical_price_min}–${material.typical_price_max}`}
                    className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-xl font-black text-slate-900 focus:outline-none focus:border-orange-400 transition-colors tabular-nums" />
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">{isAr ? 'اختر المادة أولاً ←' : '← Select a material first'}</p>
            )}
          </div>

          {/* Step 3 — sizes */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center text-white text-[11px] font-black flex-shrink-0">3</div>
              <h2 className="font-black text-slate-800 text-sm">{isAr ? 'أحجام التعبئة' : 'Target Sizes'}</h2>
            </div>
            {material ? (
              <div className="flex flex-wrap gap-2">
                {material.suitable_sizes.map(sz => {
                  const isSel = sizes.includes(sz)
                  const unit  = material.bulk_unit === 'L'
                    ? (sz < 1 ? `${sz * 1000}ml` : `${sz}L`)
                    : (sz < 1 ? `${sz * 1000}g` : `${sz}kg`)
                  const net   = +bulkQty * material.yield_pct / 100
                  const units = Math.floor(net / sz)
                  return (
                    <button key={sz} onClick={() => toggleSize(sz)}
                      className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border-2 transition-colors min-w-[58px] ${
                        isSel ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-orange-300 bg-white'
                      }`}>
                      <span className="text-sm font-black text-slate-900 tabular-nums">{unit}</span>
                      <span className="text-[10px] text-slate-400 tabular-nums">{units.toLocaleString('en-US')}</span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">{isAr ? 'اختر المادة أولاً' : 'Select material first'}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => { if (sizes.length > 0 && bulkQty && bulkPrice) setRPhase('results') }}
          disabled={!material || !bulkQty || !bulkPrice || sizes.length === 0}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black px-7 py-3 rounded-2xl text-sm transition-colors shadow-sm">
          <Calculator className="w-4 h-4" />
          {isAr ? 'احسب الآن' : 'Calculate Now'}
        </button>
      </div>
    </div>
  )

  // ── REPACK RESULTS ────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <button onClick={() => setRPhase('select')}
        className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800 transition-colors">
        {isAr ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
        {isAr ? 'تعديل الاختيارات' : 'Edit selections'}
      </button>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { la: 'إجمالي الوحدات', en: 'Total Units', val: totUnits.toLocaleString('en-US'), cls: 'bg-blue-50 border-blue-100 text-blue-700' },
          { la: 'تكلفة الخام',    en: 'Raw Cost',    val: `${(+bulkQty * +bulkPrice).toFixed(0)} AED`, cls: 'bg-slate-50 border-slate-200 text-slate-700' },
          { la: 'إجمالي الربح',   en: 'Total Profit', val: `${totProfit.toLocaleString('en-US')} AED`, cls: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
        ].map((s, i) => (
          <div key={i} className={`border rounded-2xl p-4 text-center ${s.cls}`}>
            <div className="text-lg font-black tabular-nums">{s.val}</div>
            <div className="text-xs mt-0.5 opacity-70">{isAr ? s.la : s.en}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {results.map(r => {
          const unit = material!.bulk_unit === 'L'
            ? (r.size < 1 ? `${r.size * 1000}ml` : `${r.size}L`)
            : (r.size < 1 ? `${r.size * 1000}g` : `${r.size}kg`)
          return (
            <div key={r.size} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-500" />
                  <span className="font-black text-slate-900">{unit}</span>
                  <span className="text-xs text-slate-400 tabular-nums">× {r.units.toLocaleString('en-US')} {isAr ? 'وحدة' : 'units'}</span>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${r.margin_pct >= 25 ? 'bg-emerald-100 text-emerald-700' : r.margin_pct >= 15 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                  {isAr ? `هامش ${r.margin_pct}%` : `${r.margin_pct}% margin`}
                </span>
              </div>
              <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {[
                  { la: 'تكلفة الخام/وحدة',    en: 'Raw/unit',       v: `${r.raw_cost.toFixed(2)} AED` },
                  { la: 'تكلفة الغلاف/وحدة',   en: 'Pkg/unit',       v: `${r.pkg_cost.toFixed(2)} AED` },
                  { la: 'إجمالي التكلفة/وحدة', en: 'COGS/unit',      v: `${r.total_cogs.toFixed(2)} AED`, bold: true },
                  { la: 'سعر الجملة',          en: 'Wholesale',      v: `${r.wholesale_price.toFixed(2)} AED`, orange: true },
                  { la: 'سعر التجزئة',         en: 'Retail',         v: `${r.retail_price.toFixed(2)} AED`, purple: true },
                  { la: 'ربح/وحدة',            en: 'Profit/unit',    v: `${r.profit_per_unit.toFixed(2)} AED`, green: true },
                  { la: 'ربح الدفعة',          en: 'Batch profit',   v: `${r.total_profit.toLocaleString('en-US')} AED`, greenBold: true },
                ].map((row, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-3">
                    <div className="text-slate-400 mb-1">{isAr ? row.la : row.en}</div>
                    <div className={`tabular-nums font-semibold ${row.greenBold ? 'font-black text-emerald-700' : row.orange ? 'text-orange-600 font-black' : row.purple ? 'text-purple-600 font-bold' : row.green ? 'text-emerald-600 font-bold' : row.bold ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                      {row.v}
                    </div>
                  </div>
                ))}
              </div>
              {/* Cost bar */}
              <div className="px-5 pb-4 flex items-center gap-2 text-[10px]">
                <span className="text-slate-400 flex-shrink-0">{isAr ? 'هيكل التكلفة' : 'Cost structure'}</span>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                  <div className="bg-blue-400 h-full" style={{ width: `${(r.raw_cost / r.wholesale_price) * 100}%` }} />
                  <div className="bg-orange-300 h-full" style={{ width: `${(r.pkg_cost / r.wholesale_price) * 100}%` }} />
                  <div className="bg-slate-300 h-full" style={{ width: `${(r.overhead / r.wholesale_price) * 100}%` }} />
                  <div className="bg-emerald-400 h-full" style={{ width: `${r.margin_pct}%` }} />
                </div>
                {[{ c: 'bg-blue-400', la: 'خام', en: 'Raw' }, { c: 'bg-orange-300', la: 'غلاف', en: 'Pkg' }, { c: 'bg-slate-300', la: 'تشغيل', en: 'OH' }, { c: 'bg-emerald-400', la: 'ربح', en: 'Profit' }].map(l => (
                  <span key={l.c} className="flex items-center gap-1 text-slate-400">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${l.c}`} />{isAr ? l.la : l.en}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Label requirements */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <CheckSquare className="w-5 h-5 text-orange-500" />
          <h2 className="font-black text-slate-900">{isAr ? 'متطلبات الليبل — UAE.S 9:2019' : 'Label Requirements — UAE.S 9:2019'}</h2>
        </div>
        <div className="space-y-2">
          {LABEL_REQUIREMENTS.map(req => (
            <div key={req.id} className="flex items-start gap-3 py-1">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-black ${req.mandatory ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                {req.mandatory ? '!' : '?'}
              </div>
              <div className="flex-1 flex items-center gap-2 flex-wrap">
                <span className="text-sm text-slate-700">{isAr ? req.text_ar : req.text_en}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${req.mandatory ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-400'}`}>
                  {req.mandatory ? (isAr ? 'إلزامي' : 'Mandatory') : (isAr ? 'اختياري' : 'Optional')}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 flex items-start gap-2">
          <TrendingUp className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            {isAr
              ? <><strong>تسجيل علامتك في ESMA:</strong> 3,000–8,000 AED للمنتج الأول، 2–4 أشهر. GS1 الإمارات لـ EAN-13 (~500 AED/سنة).</>
              : <><strong>ESMA brand registration:</strong> 3,000–8,000 AED, 2–4 months. GS1 UAE for EAN-13 (~500 AED/year).</>}
          </div>
        </div>
      </div>

      <RfqSection isAr={isAr} payload={{
        product_label: material ? `${isAr ? material.name_ar : material.name_en} (${isAr ? 'إعادة تعبئة' : 'repack'})` : '',
        calc: { mode: 'repack', material: material?.id, bulkQty, bulkPrice, sizes, results },
      }} />
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PackagingPage() {
  const params = useParams()
  const locale = (params.locale as string) || 'ar'
  const isAr   = locale === 'ar'

  const [mode, setMode]                         = useState<'cartons' | 'repack'>('cartons')
  const [primaryPacks, setPrimaryPacks]         = useState<PrimaryPack[]>([])
  const [masterCartons, setMasterCartons]       = useState<MasterCarton[]>([])
  const [packagingOptions, setPackagingOptions] = useState<PackagingOption[]>([])

  useEffect(() => {
    fetch('/api/packaging/specs')
      .then(r => r.json())
      .then(d => {
        if (d.primary_packs)  setPrimaryPacks(d.primary_packs.filter((p: PrimaryPack)  => p.is_active !== false))
        if (d.master_cartons) setMasterCartons(d.master_cartons.filter((c: MasterCarton) => c.is_active !== false))
        if (d.options)        setPackagingOptions(d.options.filter((o: PackagingOption)  => o.is_active !== false))
      })
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-orange-500 tracking-wider mb-2 uppercase">Crate Tools</p>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
            {isAr ? 'حاسبة التعبئة والتغليف' : 'Packaging Calculator'}
          </h1>
          <p className="text-slate-400 text-sm max-w-lg mb-5">
            {isAr
              ? 'احسب الكراتين والتكاليف ومساحة المخزن — ثم اطلب عرض سعر من Crate'
              : 'Calculate cartons, costs and warehouse space — then request a quote from Crate'}
          </p>
          {/* Mode tabs */}
          <div className="inline-flex bg-slate-100 rounded-xl p-1 gap-1">
            {([
              { v: 'cartons', ar: 'حساب التغليف والكراتين', en: 'Packaging & Cartons' },
              { v: 'repack',  ar: 'إعادة تعبئة مادة خام',   en: 'Repackaging'         },
            ] as const).map(t => (
              <button key={t.v} onClick={() => setMode(t.v)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                  mode === t.v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
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
