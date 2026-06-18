'use client'
import { useState, useMemo, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import {
  Package, AlertCircle, CheckSquare, TrendingUp, Boxes, Warehouse,
  Layers, Send, Truck, MapPin, Loader2, CheckCircle2, Calculator,
} from 'lucide-react'
import { RAW_MATERIALS, PKG_COSTS, type RawMaterial } from '@/lib/data/products-catalog'
import {
  calcPackaging,
  type PrimaryPack, type MasterCarton, type PackagingOption, type PackagingCalcResult,
} from '@/lib/data/packaging-specs'
import { resolveImageUrl } from '@/lib/resolve-image-url'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString('en-US')

// ─── SVG Mockups ──────────────────────────────────────────────────────────────

function BagSvg({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <rect x="10" y="16" width="36" height="36" rx="5" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.4"/>
      <path d="M18 16c0-6 20-6 20 0" stroke="#cbd5e1" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      <rect x="14" y="22" width="28" height="1.5" rx=".75" fill="#e2e8f0"/>
      <rect x="14" y="26" width="20" height="1.2" rx=".6" fill="#e2e8f0"/>
      <rect x="14" y="36" width="28" height="8" rx="3" fill="#f1f5f9"/>
    </svg>
  )
}
function BottleSvg({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <rect x="22" y="8" width="12" height="8" rx="3" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1"/>
      <path d="M19 20q-1-4 3-4h12q4 0 3 4l2 28q0 4-9 4t-9-4z" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.4"/>
      <rect x="20" y="28" width="16" height="1.5" rx=".75" fill="#e2e8f0"/>
      <rect x="21" y="34" width="14" height="6" rx="2" fill="#f1f5f9"/>
    </svg>
  )
}
function JarSvg({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <rect x="18" y="10" width="20" height="6" rx="3" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1"/>
      <rect x="14" y="16" width="28" height="34" rx="6" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.4"/>
      <rect x="18" y="31" width="20" height="8" rx="3" fill="#f1f5f9"/>
    </svg>
  )
}
function BoxSvg({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <rect x="8" y="18" width="40" height="32" rx="3" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.4"/>
      <path d="M8 26h40M28 18v8" stroke="#e2e8f0" strokeWidth="1.2"/>
      <rect x="14" y="32" width="28" height="12" rx="2" fill="#f1f5f9"/>
    </svg>
  )
}
function PouchSvg({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <path d="M16 14h24l2 36q0 4-14 4t-14-4z" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.4"/>
      <rect x="16" y="14" width="24" height="6" rx="2" fill="#e2e8f0"/>
      <rect x="18" y="26" width="20" height="8" rx="2" fill="#f1f5f9"/>
    </svg>
  )
}
function CanSvg({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <ellipse cx="28" cy="14" rx="16" ry="5" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1"/>
      <rect x="12" y="14" width="32" height="30" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.4"/>
      <ellipse cx="28" cy="44" rx="16" ry="5" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1"/>
      <rect x="14" y="23" width="28" height="10" rx="2" fill="#f1f5f9"/>
    </svg>
  )
}
function CartonSvg({ size = 48, tint = '#f8fafc', stroke = '#e2e8f0' }: { size?: number; tint?: string; stroke?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <rect x="8" y="18" width="36" height="28" rx="3" fill={tint} stroke={stroke} strokeWidth="1.4"/>
      <path d="M8 18l5-8h26l5 8" fill={tint} stroke={stroke} strokeWidth="1.4"/>
      <path d="M26 10v8" stroke={stroke} strokeWidth="1" strokeDasharray="2 1.5"/>
      <path d="M8 26h36" stroke={stroke} strokeWidth="1"/>
      <path d="M44 18l5-5v33l-5 4" fill={tint} stroke={stroke} strokeWidth="1"/>
    </svg>
  )
}

const TYPE_SVGS: Record<string, React.FC<{ size?: number }>> = {
  bag: BagSvg, bottle: BottleSvg, jar: JarSvg, box: BoxSvg, pouch: PouchSvg, can: CanSvg,
}
const CARTON_TINTS   = ['#f8fafc','#eff6ff','#f0fdf4','#fefce8','#fdf4ff','#fff7ed','#f0f9ff']
const CARTON_STROKES = ['#e2e8f0','#dbeafe','#bbf7d0','#fef08a','#e9d5ff','#fed7aa','#bae6fd']

// ─── Animated reveal ──────────────────────────────────────────────────────────

function Appear({ show, children }: { show: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const prev = useRef(show)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (show && !prev.current) {
      el.style.maxHeight = '0px'; el.style.opacity = '0'; el.style.overflow = 'hidden'
      requestAnimationFrame(() => {
        el.style.transition = 'max-height 0.4s ease, opacity 0.3s ease'
        el.style.maxHeight = '2000px'; el.style.opacity = '1'
        setTimeout(() => { el.style.overflow = 'visible' }, 450)
      })
    } else if (!show && prev.current) {
      el.style.transition = 'max-height 0.25s ease, opacity 0.15s ease'
      el.style.overflow = 'hidden'; el.style.maxHeight = '0px'; el.style.opacity = '0'
    }
    prev.current = show
  }, [show])
  return (
    <div ref={ref} style={{ maxHeight: show ? undefined : '0px', opacity: show ? undefined : 0, overflow: show ? 'visible' : 'hidden' }}>
      {children}
    </div>
  )
}

// ─── Step card ───────────────────────────────────────────────────────────────

function Step({ n, title, done, children }: { n: number; title: string; done?: boolean; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 transition-colors duration-300 ${done ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'}`}>
          {done ? '✓' : n}
        </div>
        <span className="font-black text-slate-800 text-sm">{title}</span>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  )
}

// ─── Live Sidebar ─────────────────────────────────────────────────────────────

function LiveSidebar({
  isAr, result, primary, carton, selOptions, qtyMode, weight, weightUnit, unitsInput, productLabel, printNotes,
}: {
  isAr: boolean; result: PackagingCalcResult | null
  primary: PrimaryPack | null; carton: MasterCarton | null
  selOptions: PackagingOption[]; qtyMode: 'weight'|'units'
  weight: string; weightUnit: 'kg'|'ton'; unitsInput: string
  productLabel: string; printNotes: string
}) {
  const [rfqOpen, setRfqOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [done, setDone]       = useState(false)
  const [rfqErr, setRfqErr]   = useState<string|null>(null)
  const [form, setForm] = useState({ contact_name:'', company_name:'', email:'', phone:'', fulfilment:'delivery' as 'delivery'|'pickup', notes:'' })

  async function submit() {
    if (!form.contact_name || (!form.email && !form.phone)) {
      setRfqErr(isAr?'الاسم وطريقة تواصل مطلوبة':'Name and one contact required'); return
    }
    setSending(true); setRfqErr(null)
    try {
      const res = await fetch('/api/packaging/rfq', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ ...form, product_label: productLabel||'packaging',
          calc:{ mode:'cartons',qtyMode,weight,weightUnit,unitsInput,
                 primary:primary?.id??null,carton:carton?.id??null,
                 options:selOptions.map(o=>o.id),printNotes,result }}),
      })
      if (!res.ok) throw new Error()
      setDone(true)
    } catch { setRfqErr(isAr?'تعذّر الإرسال':'Send failed') }
    finally { setSending(false) }
  }

  if (done) return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-3"/>
      <p className="font-black text-emerald-800 text-sm">{isAr?'وصلنا طلبك!':'Request received!'}</p>
    </div>
  )

  return (
    <div className="space-y-3">
      {/* Live calc card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
          <Calculator className="w-3.5 h-3.5 text-orange-500"/>
          <p className="text-xs font-black text-slate-600">{isAr?'الحساب المباشر':'Live calculator'}</p>
        </div>
        <div className="p-4">
          {result ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {[
                  {v:result.primaryUnits>0?fmt(result.primaryUnits):'—',la:'وحدة',en:'Units',c:'text-blue-600'},
                  {v:fmt(result.totalCartons),la:'كرتون',en:'Cartons',c:'text-orange-600'},
                  {v:fmt(result.pallets),la:'باليت',en:'Pallets',c:'text-purple-600'},
                  {v:`${result.floorAreaM2}m²`,la:'أرضية',en:'Floor',c:'text-slate-600'},
                ].map((s,i)=>(
                  <div key={i} className="bg-slate-50 rounded-xl p-3 text-center">
                    <div className={`text-xl font-black tabular-nums ${s.c}`}>{s.v}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{isAr?s.la:s.en}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5 pt-1">
                {[
                  {la:'الكراتين',en:'Cartons',v:`${fmt(result.cartonCostAed)} AED`},
                  {la:'التغليف الأساسي',en:'Primary pkg',v:`${fmt(result.primaryCostAed)} AED`},
                  ...(result.optionsSetupAed>0?[{la:'رسوم إعداد',en:'Setup',v:`${fmt(result.optionsSetupAed)} AED`}]:[]),
                ].map((r,i)=>(
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-slate-400">{isAr?r.la:r.en}</span>
                    <span className="font-semibold text-slate-700 tabular-nums">{r.v}</span>
                  </div>
                ))}
                <div className="border-t border-slate-100 pt-2 flex justify-between">
                  <span className="text-xs font-bold text-slate-600">{isAr?'إجمالي التغليف':'Total packaging'}</span>
                  <span className="font-black text-emerald-600 tabular-nums">{fmt(result.totalPackagingAed)} AED</span>
                </div>
                {result.costPerPrimaryUnit>0 && (
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{isAr?'تكلفة/وحدة':'Cost/unit'}</span>
                    <span className="tabular-nums">{result.costPerPrimaryUnit} AED</span>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-300">{isAr?'* أسعار تقريبية بمتوسط السوق الإماراتي':'* Approximate UAE market averages'}</p>
            </div>
          ) : (
            <div className="py-6 text-center">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calculator className="w-5 h-5 text-slate-300"/>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-[180px] mx-auto">
                {isAr?'اختر كرتون الشحن لتبدأ الحسابات':'Choose a master carton to start calculating'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Selections summary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
        <p className="text-[11px] font-black text-slate-400 mb-2">{isAr?'اختياراتك':'Selections'}</p>
        {[
          { la:'الكمية', en:'Qty', v: qtyMode==='weight'?`${weight} ${weightUnit==='ton'?(isAr?'طن':'ton'):'kg'}`:`${parseInt(unitsInput).toLocaleString('en-US')} ${isAr?'وحدة':'units'}` },
          { la:'التغليف الأساسي', en:'Primary', v: primary?`${primary.size_label} ${isAr?primary.type_ar:primary.type_en}`:(isAr?'سائب':'Bulk') },
          { la:'كرتون الشحن', en:'Carton', v: carton?(isAr?carton.name_ar:carton.name_en):'—' },
          ...(selOptions.length>0?[{la:'الخيارات',en:'Options',v:selOptions.map(o=>isAr?o.label_ar:o.label_en).join('، ')}]:[]),
        ].map((r,i)=>(
          <div key={i} className="flex justify-between items-start gap-2 text-xs">
            <span className="text-slate-400 flex-shrink-0">{isAr?r.la:r.en}</span>
            <span className="font-semibold text-slate-700 text-end leading-tight">{r.v}</span>
          </div>
        ))}
      </div>

      {/* RFQ */}
      {!rfqOpen ? (
        <button onClick={()=>setRfqOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-700 text-white font-black px-4 py-3.5 rounded-2xl text-sm transition-colors">
          <Send className="w-4 h-4"/>
          {isAr?'اطلب عرض سعر':'Request a quote'}
        </button>
      ) : (
        <div className="bg-slate-900 rounded-2xl p-4 space-y-2.5">
          <p className="text-white font-black text-sm mb-1">{isAr?'بياناتك للتواصل':'Your contact info'}</p>
          {[
            {k:'contact_name',pa:'الاسم *',pe:'Name *',t:'text'},
            {k:'company_name',pa:'الشركة',pe:'Company',t:'text'},
            {k:'email',pa:'البريد الإلكتروني',pe:'Email',t:'email'},
            {k:'phone',pa:'الهاتف / واتساب',pe:'Phone / WhatsApp',t:'text'},
          ].map(f=>(
            <input key={f.k} type={f.t} value={form[f.k as keyof typeof form] as string}
              onChange={e=>setForm({...form,[f.k]:e.target.value})}
              placeholder={isAr?f.pa:f.pe}
              className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-900 bg-white/95 placeholder:text-slate-400 focus:outline-none"/>
          ))}
          <div className="flex gap-2">
            {([{v:'delivery',ar:'توصيل',en:'Delivery',I:Truck},{v:'pickup',ar:'استلام',en:'Pickup',I:MapPin}] as const).map(o=>(
              <button key={o.v} onClick={()=>setForm({...form,fulfilment:o.v})}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold flex-1 justify-center ${form.fulfilment===o.v?'bg-white text-slate-900':'bg-white/10 text-slate-300'}`}>
                <o.I className="w-3.5 h-3.5"/>{isAr?o.ar:o.en}
              </button>
            ))}
          </div>
          <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}
            placeholder={isAr?'ملاحظات...':'Notes...'} rows={2}
            className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-900 bg-white/95 placeholder:text-slate-400 focus:outline-none resize-none"/>
          {rfqErr && <p className="text-xs text-amber-300">{rfqErr}</p>}
          <button onClick={submit} disabled={sending}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black py-2.5 rounded-xl text-sm disabled:opacity-60">
            {sending?<Loader2 className="w-4 h-4 animate-spin"/>:<Send className="w-4 h-4"/>}
            {isAr?'إرسال الطلب':'Send request'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Cartons Calculator ──────────────────────────────────────────────────

type WeightUnit = 'kg' | 'ton'

function CartonsCalculator({ isAr, primaryPacks, masterCartons, packagingOptions }: {
  isAr: boolean; primaryPacks: PrimaryPack[]; masterCartons: MasterCarton[]; packagingOptions: PackagingOption[]
}) {
  // Phase: 'setup' = steps 1+2, 'carton' = steps 3+4 in same place
  const [phase, setPhase]               = useState<'setup'|'carton'>('setup')
  const [productLabel, setProductLabel] = useState('')
  const [qtyMode, setQtyMode]           = useState<'weight'|'units'>('weight')
  const [weight, setWeight]             = useState('10')
  const [weightUnit, setWeightUnit]     = useState<WeightUnit>('ton')
  const [unitsInput, setUnitsInput]     = useState('5000')
  const [selectedType, setSelectedType] = useState<string|null>(null)
  const [primary, setPrimary]           = useState<PrimaryPack|null>(null)
  const [primaryDone, setPrimaryDone]   = useState(false)
  const [carton, setCarton]             = useState<MasterCarton|null>(null)
  const [selOptions, setSelOptions]     = useState<PackagingOption[]>([])
  const [printNotes, setPrintNotes]     = useState('')

  const packTypes = useMemo(()=>{
    const seen = new Set<string>()
    return primaryPacks.filter(p=>{ if(seen.has(p.type))return false; seen.add(p.type); return true })
  },[primaryPacks])

  const sizesForType = useMemo(()=>primaryPacks.filter(p=>p.type===selectedType),[primaryPacks,selectedType])
  const hasQty = qtyMode==='weight' ? parseFloat(weight)>0 : parseInt(unitsInput)>0
  const canProceed = hasQty && primaryDone

  function pickType(type: string) { setSelectedType(type); setPrimary(null); setPrimaryDone(false) }
  function pickSize(pp: PrimaryPack) { setPrimary(pp); setPrimaryDone(true) }
  function pickBulk() { setSelectedType(null); setPrimary(null); setPrimaryDone(true) }
  function toggleOption(o: PackagingOption) {
    setSelOptions(prev=>prev.some(x=>x.id===o.id)?prev.filter(x=>x.id!==o.id):[...prev,o])
  }
  function goBack() { setPhase('setup'); setCarton(null); setSelOptions([]) }

  const hasCustomPrint = selOptions.some(o=>Number(o.setup_aed)>0)

  const result = useMemo<PackagingCalcResult|null>(()=>{
    if (!carton) return null
    const totalWeightKg = qtyMode==='weight'?(parseFloat(weight)||0)*(weightUnit==='ton'?1000:1):null
    const totalUnits    = qtyMode==='units'?(parseInt(unitsInput)||0):null
    return calcPackaging({totalWeightKg,totalUnits,primary,carton,options:selOptions})
  },[qtyMode,weight,weightUnit,unitsInput,primary,carton,selOptions])

  // Summary label for qty
  const qtySummary = qtyMode==='weight'
    ? `${weight} ${weightUnit==='ton'?(isAr?'طن':'ton'):'kg'}`
    : `${parseInt(unitsInput).toLocaleString('en-US')} ${isAr?'وحدة':'units'}`
  const pkgSummary = primary
    ? `${primary.size_label} ${isAr?primary.type_ar:primary.type_en}`
    : (isAr?'سائب':'Bulk')

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-5 items-start">

      {/* ── LEFT: wizard pane ── */}
      <div>

        {/* ══ PHASE: SETUP (steps 1 + 2 side by side) ══ */}
        {phase === 'setup' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
              {/* Step 1 — qty + label */}
              <Step n={1} title={isAr?'الكمية والمنتج':'Quantity & Product'} done={hasQty}>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 mb-1 block">{isAr?'وصف المنتج (اختياري)':'Product description (optional)'}</label>
                    <input value={productLabel} onChange={e=>setProductLabel(e.target.value)}
                      placeholder={isAr?'مثال: أرز بسمتي 1كجم':'e.g. Basmati Rice 1kg'}
                      dir={isAr?'rtl':'ltr'}
                      className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 transition-colors placeholder:text-slate-300"/>
                  </div>
                  <div className="inline-flex bg-slate-100 rounded-xl p-0.5 gap-0.5">
                    {(['weight','units'] as const).map(m=>(
                      <button key={m} onClick={()=>setQtyMode(m)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${qtyMode===m?'bg-white text-slate-900 shadow-sm':'text-slate-500 hover:text-slate-700'}`}>
                        {m==='weight'?(isAr?'وزن':'Weight'):(isAr?'عدد الوحدات':'Unit count')}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" min="0" value={qtyMode==='weight'?weight:unitsInput} dir="ltr"
                      onChange={e=>qtyMode==='weight'?setWeight(e.target.value):setUnitsInput(e.target.value)}
                      className="flex-1 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-orange-400 transition-colors tabular-nums"/>
                    {qtyMode==='weight'&&(
                      <div className="flex flex-col gap-1">
                        {(['ton','kg'] as WeightUnit[]).map(u=>(
                          <button key={u} onClick={()=>setWeightUnit(u)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-colors ${weightUnit===u?'border-orange-500 text-orange-600 bg-orange-50':'border-slate-200 text-slate-400'}`}>
                            {u==='ton'?(isAr?'طن':'ton'):'kg'}
                          </button>
                        ))}
                      </div>
                    )}
                    {qtyMode==='units'&&<span className="text-slate-400 text-sm font-semibold">{isAr?'وحدة':'units'}</span>}
                  </div>
                </div>
              </Step>

              {/* Step 2 — primary pack type → size (always visible, fades when no qty) */}
              <div className={`transition-opacity duration-300 ${hasQty?'opacity-100':'opacity-40 pointer-events-none'}`}>
                <Step n={2} title={isAr?'التغليف الأساسي (الوحدة)':'Primary packaging'} done={primaryDone}>
                  <div className="space-y-3">
                    {/* Bulk */}
                    <button onClick={pickBulk} disabled={!hasQty}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-bold transition-colors text-start ${primaryDone&&!primary?'border-orange-500 bg-orange-50 text-orange-700':'border-slate-200 text-slate-500 hover:border-orange-300 bg-white'}`}>
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <Package className="w-3.5 h-3.5 text-slate-400"/>
                      </div>
                      <div>
                        <div className="font-black text-xs leading-tight">{isAr?'سائب — بدون تغليف أساسي':'Bulk — no primary packaging'}</div>
                        <div className="text-[10px] font-normal text-slate-400">{isAr?'مباشر إلى كرتون الشحن':'Directly into master carton'}</div>
                      </div>
                      {primaryDone&&!primary&&<div className="ms-auto w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0"><div className="w-1.5 h-1.5 rounded-full bg-white"/></div>}
                    </button>

                    {/* Type cards */}
                    {packTypes.length>0&&(
                      <>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-px bg-slate-100"/>
                          <span className="text-[10px] text-slate-400 font-bold flex-shrink-0">{isAr?'أو اختر نوع':'or choose type'}</span>
                          <div className="flex-1 h-px bg-slate-100"/>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {packTypes.map(pp=>{
                            const Svg = TYPE_SVGS[pp.type]??BagSvg
                            const sel = selectedType===pp.type
                            return (
                              <button key={pp.type} onClick={()=>pickType(pp.type)}
                                className={`group flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all bg-white ${sel?'border-orange-500':'border-slate-200 hover:border-orange-300'}`}>
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${sel?'bg-orange-50':'bg-slate-50 group-hover:bg-slate-100'}`}>
                                  <Svg size={32}/>
                                </div>
                                <span className={`text-[10px] font-black leading-tight text-center ${sel?'text-orange-700':'text-slate-700'}`}>
                                  {isAr?pp.type_ar:pp.type_en}
                                </span>
                                {sel&&<div className="w-1 h-1 rounded-full bg-orange-500"/>}
                              </button>
                            )
                          })}
                        </div>
                      </>
                    )}

                    {/* Size cards */}
                    <Appear show={!!selectedType&&sizesForType.length>0}>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-500">
                          {isAr
                            ?`اختر الحجم — ${packTypes.find(p=>p.type===selectedType)?.type_ar??''}`
                            :`Size — ${packTypes.find(p=>p.type===selectedType)?.type_en??''}`}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                          {sizesForType.map(pp=>{
                            const sel = primary?.id===pp.id
                            const totalKg = parseFloat(weight)*(weightUnit==='ton'?1000:1)
                            const units = qtyMode==='weight'?Math.floor(totalKg/pp.size_value):parseInt(unitsInput)
                            return (
                              <button key={pp.id} onClick={()=>pickSize(pp)}
                                className={`relative flex flex-col items-center gap-0.5 p-3 rounded-xl border-2 transition-all bg-white ${sel?'border-orange-500':'border-slate-200 hover:border-orange-300'}`}>
                                {sel&&<div className="absolute -top-1.5 -end-1.5 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-white"/></div>}
                                <span className="text-lg font-black text-slate-900 tabular-nums">{pp.size_label}</span>
                                {units>0&&<span className="text-[10px] text-slate-400 tabular-nums">{fmt(units)} {isAr?'وحدة':'units'}</span>}
                                <span className="text-[10px] font-semibold text-orange-500">AED {Number(pp.cost_aed).toFixed(2)}</span>
                              </button>
                            )
                          })}
                        </div>
                        {primary&&(
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            <span className="w-1 h-2.5 bg-slate-200 rounded-full"/>
                            {isAr?primary.material_ar:primary.material_en}
                            {primary.suitable_for_ar?` · ${isAr?primary.suitable_for_ar:primary.suitable_for_en}`:''}
                          </p>
                        )}
                      </div>
                    </Appear>
                  </div>
                </Step>
              </div>
            </div>

            {/* Continue button */}
            <Appear show={canProceed}>
              <button onClick={()=>setPhase('carton')}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-700 text-white font-black py-3 rounded-2xl text-sm transition-colors shadow-sm">
                <span>{isAr?'التالي — اختر كرتون الشحن':'Next — Choose master carton'}</span>
                <span className="text-slate-400 text-[11px] font-normal ms-1">({qtySummary} · {pkgSummary})</span>
              </button>
            </Appear>
          </div>
        )}

        {/* ══ PHASE: CARTON + OPTIONS (same place, no scroll) ══ */}
        {phase === 'carton' && (
          <div className="space-y-3">

            {/* Summary bar with back button */}
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-3 shadow-sm">
              <button onClick={goBack}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors flex-shrink-0 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg">
                {isAr?'↩ تعديل':'↩ Edit'}
              </button>
              <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                <span className="text-xs text-slate-400">{isAr?'الكمية:':'Qty:'}</span>
                <span className="text-xs font-black text-slate-800 tabular-nums">{qtySummary}</span>
                <span className="text-slate-200">·</span>
                <span className="text-xs text-slate-400">{isAr?'التغليف:':'Pkg:'}</span>
                <span className="text-xs font-black text-slate-800">{pkgSummary}</span>
                {productLabel&&<><span className="text-slate-200">·</span><span className="text-xs text-slate-400 truncate">{productLabel}</span></>}
              </div>
            </div>

            {/* Step 3 — carton */}
            <Step n={3} title={isAr?'كرتون الشحن والتخزين':'Master carton'} done={!!carton}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {masterCartons.map((mc,idx)=>{
                  const sel = carton?.id===mc.id
                  const tint  = CARTON_TINTS[idx%CARTON_TINTS.length]
                  const stk   = CARTON_STROKES[idx%CARTON_STROKES.length]
                  return (
                    <button key={mc.id} onClick={()=>setCarton(mc)}
                      className={`relative flex flex-col text-start p-4 rounded-2xl border-2 transition-all bg-white ${sel?'border-orange-500':'border-slate-200 hover:border-orange-300'}`}>
                      {sel&&<div className="absolute -top-2 -end-2 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-white"/></div>}
                      {mc.image_url?(
                        <img src={resolveImageUrl(mc.image_url)} alt={isAr?mc.name_ar:mc.name_en}
                          className="w-full h-14 object-contain mb-2 rounded-xl bg-slate-50"/>
                      ):(
                        <div className="w-full h-12 flex items-center justify-center mb-2">
                          <CartonSvg size={40} tint={tint} stroke={stk}/>
                        </div>
                      )}
                      <div className="font-black text-slate-900 text-xs leading-tight mb-1">{isAr?mc.name_ar:mc.name_en}</div>
                      <div className="text-[10px] text-slate-400 tabular-nums">{mc.l_cm}×{mc.w_cm}×{mc.h_cm} cm</div>
                      <div className="text-[10px] text-slate-400">{isAr?`حتى ${mc.max_weight_kg}كجم`:`up to ${mc.max_weight_kg}kg`}</div>
                      <div className="text-[10px] font-bold text-orange-500 mt-1">{Number(mc.cost_aed).toFixed(1)} AED</div>
                    </button>
                  )
                })}
              </div>
            </Step>

            {/* Step 4 — options */}
            <Appear show={!!carton&&packagingOptions.length>0}>
              <Step n={4} title={isAr?'المواصفات والخيارات (اختياري)':'Specs & options (optional)'}>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {packagingOptions.map(o=>{
                      const sel=selOptions.some(x=>x.id===o.id)
                      return (
                        <button key={o.id} onClick={()=>toggleOption(o)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-bold transition-colors ${sel?'border-orange-500 text-orange-700 bg-orange-50':'border-slate-200 text-slate-600 hover:border-orange-300 bg-white'}`}>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${sel?'border-orange-500 bg-orange-500':'border-slate-300'}`}>
                            {sel&&<div className="w-1.5 h-1.5 rounded-full bg-white"/>}
                          </div>
                          {isAr?o.label_ar:o.label_en}
                          {Number(o.setup_aed)>0&&<span className="text-[10px] text-slate-400 font-normal">{o.setup_aed} AED</span>}
                        </button>
                      )
                    })}
                  </div>
                  <Appear show={hasCustomPrint}>
                    <div className="pt-2">
                      <label className="text-xs font-bold text-slate-600 mb-2 block">{isAr?'ملاحظات الطباعة':'Print notes'}</label>
                      <textarea value={printNotes} onChange={e=>setPrintNotes(e.target.value)}
                        rows={2} dir={isAr?'rtl':'ltr'}
                        placeholder={isAr?'لوغو، ألوان CMYK، طباعة من وجهين...':'Logo, CMYK colors, double-sided...'}
                        className="w-full border-2 border-orange-200 bg-orange-50 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-orange-400 resize-none placeholder:text-slate-400"/>
                    </div>
                  </Appear>
                </div>
              </Step>
            </Appear>

            {/* Mobile-only results */}
            <Appear show={!!result}>
              <div className="lg:hidden bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <h3 className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-orange-500"/>
                  {isAr?'نتائج الحساب':'Results'}
                </h3>
                {result&&(
                  <>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {[
                        {v:result.primaryUnits>0?fmt(result.primaryUnits):'—',la:'وحدة معبأة',en:'Units',c:'text-blue-600'},
                        {v:fmt(result.totalCartons),la:'كراتين',en:'Cartons',c:'text-orange-600'},
                        {v:fmt(result.pallets),la:'باليت',en:'Pallets',c:'text-purple-600'},
                        {v:`${result.floorAreaM2}m²`,la:'أرضية',en:'Floor',c:'text-slate-600'},
                      ].map((s,i)=>(
                        <div key={i} className="bg-slate-50 rounded-xl p-3 text-center">
                          <div className={`text-xl font-black tabular-nums ${s.c}`}>{s.v}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{isAr?s.la:s.en}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-3">
                      <span className="text-sm font-bold text-slate-600">{isAr?'إجمالي التغليف':'Total packaging'}</span>
                      <span className="font-black text-emerald-600 tabular-nums">{fmt(result.totalPackagingAed)} AED</span>
                    </div>
                  </>
                )}
              </div>
            </Appear>
          </div>
        )}
      </div>

      {/* ── RIGHT: sticky sidebar ── */}
      <div className="hidden lg:block lg:sticky lg:top-4">
        <LiveSidebar isAr={isAr} result={result} primary={primary} carton={carton}
          selOptions={selOptions} qtyMode={qtyMode} weight={weight} weightUnit={weightUnit}
          unitsInput={unitsInput} productLabel={productLabel} printNotes={printNotes}/>
      </div>

    </div>
  )
}

// ─── Repackaging calculator ───────────────────────────────────────────────────

const LABEL_REQUIREMENTS = [
  {id:'name',        text_ar:'اسم المنتج باللغتين العربية والإنجليزية',                    text_en:'Product name in Arabic and English',                        mandatory:true},
  {id:'ingredients', text_ar:'قائمة المكونات بالترتيب التنازلي للوزن (إن تعددت)',          text_en:'Ingredient list in descending order by weight',             mandatory:true},
  {id:'weight',      text_ar:'الوزن الصافي بالوحدات المترية (g / kg / mL / L)',           text_en:'Net weight in metric units (g / kg / mL / L)',             mandatory:true},
  {id:'origin',      text_ar:'بلد منشأ المادة الخام',                                      text_en:'Country of origin of raw material',                         mandatory:true},
  {id:'dates',       text_ar:'تاريخ الإنتاج وتاريخ انتهاء الصلاحية',                      text_en:'Production date and expiry date',                           mandatory:true},
  {id:'storage',     text_ar:'ظروف التخزين (°C، جافاً، بعيداً عن الضوء...)',              text_en:'Storage conditions (°C, dry, away from light...)',          mandatory:true},
  {id:'packer',      text_ar:'اسم وعنوان شركتك في الإمارات (المعبِّأ)',                   text_en:'Your UAE company name and address (packer)',                mandatory:true},
  {id:'esma',        text_ar:'رقم تسجيل علامتك التجارية لدى ESMA',                        text_en:'Your brand ESMA registration number',                       mandatory:true},
  {id:'barcode',     text_ar:'باركود EAN-13 (GS1 الإمارات ~500 AED/سنة)',                text_en:'EAN-13 barcode (GS1 UAE ~500 AED/year)',                    mandatory:true},
  {id:'nutrition',   text_ar:'جدول القيم الغذائية (إلزامي لمنتجات التجزئة)',              text_en:'Nutrition facts table (mandatory for retail)',              mandatory:true},
  {id:'halal',       text_ar:'علامة الحلال (إن كانت المادة من مصدر حيواني)',               text_en:'Halal mark (if material is of animal origin)',              mandatory:false},
  {id:'allergens',   text_ar:'تحذيرات المواد المسببة للحساسية (مكسرات، غلوتين...)',       text_en:'Allergen warnings (nuts, gluten, dairy...)',                mandatory:false},
]
const OVERHEAD_RATE = 0.08, WHOLESALE_MULT = 1.30, RETAIL_MULT = 1.45
interface SizeResult { size:number;units:number;raw_cost:number;pkg_cost:number;overhead:number;total_cogs:number;wholesale_price:number;retail_price:number;profit_per_unit:number;total_profit:number;margin_pct:number }

function RepackCalculator({ isAr }: { isAr: boolean }) {
  const [material, setMaterial]   = useState<RawMaterial|null>(null)
  const [bulkQty, setBulkQty]     = useState('500')
  const [bulkPrice, setBulkPrice] = useState('')
  const [sizes, setSizes]         = useState<number[]>([])
  const [catFilter, setCatFilter] = useState('')
  const [showResults, setShowResults] = useState(false)

  const cats = [...new Set(RAW_MATERIALS.map(m=>m.category_ar))]
  const visibleMaterials = catFilter?RAW_MATERIALS.filter(m=>m.category_ar===catFilter):RAW_MATERIALS

  function pick(m: RawMaterial) { setMaterial(m);setSizes([]);setShowResults(false);setBulkPrice(String(((m.typical_price_min+m.typical_price_max)/2).toFixed(1))) }
  function toggleSize(s:number) { setSizes(prev=>prev.includes(s)?prev.filter(x=>x!==s):[...prev,s].sort((a,b)=>a-b));setShowResults(false) }

  const results = useMemo<SizeResult[]>(()=>{
    if (!material||!bulkQty||!bulkPrice||sizes.length===0||!showResults) return []
    const qty=+bulkQty,price=+bulkPrice
    if (!qty||!price) return []
    const net=qty*(material.yield_pct/100)
    const pkgMap=PKG_COSTS[material.pkg_format]??{}
    return sizes.map(sz=>{
      const units=Math.floor(net/sz),raw=price*sz,pkg=pkgMap[sz]??0.5
      const over=(raw+pkg)*OVERHEAD_RATE,cogs=raw+pkg+over
      const ws=parseFloat((cogs*WHOLESALE_MULT).toFixed(2)),rt=parseFloat((ws*RETAIL_MULT).toFixed(2))
      const ppu=parseFloat((ws-cogs).toFixed(2)),tp=parseFloat((ppu*units).toFixed(0)),mp=Math.round((ppu/ws)*100)
      return {size:sz,units,raw_cost:raw,pkg_cost:pkg,overhead:over,total_cogs:cogs,wholesale_price:ws,retail_price:rt,profit_per_unit:ppu,total_profit:tp,margin_pct:mp}
    })
  },[material,bulkQty,bulkPrice,sizes,showResults])

  return (
    <div className="space-y-5">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-800">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500"/>
        {isAr?'استيراد مواد خام بالجملة وإعادة تعبئتها تحت علامتك الخاصة في الإمارات.':'Import bulk raw materials and repackage under your own UAE brand.'}
      </div>
      <div className="grid md:grid-cols-5 gap-4">
        <div className="md:col-span-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center text-white text-[11px] font-black">1</div>
            <h2 className="font-black text-slate-800 text-sm">{isAr?'اختر المادة الخام':'Select Raw Material'}</h2>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            <button onClick={()=>setCatFilter('')} className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${!catFilter?'bg-slate-900 text-white border-slate-900':'border-slate-200 text-slate-500 hover:border-orange-300'}`}>{isAr?'الكل':'All'}</button>
            {cats.map(c=><button key={c} onClick={()=>setCatFilter(c)} className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${catFilter===c?'bg-slate-900 text-white border-slate-900':'border-slate-200 text-slate-500 hover:border-orange-300'}`}>{c}</button>)}
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
            {visibleMaterials.map(m=>{
              const sel=material?.id===m.id
              return <button key={m.id} onClick={()=>pick(m)} className={`text-start p-3 rounded-xl border-2 transition-colors ${sel?'border-orange-500 bg-orange-50':'border-slate-200 hover:border-orange-300 bg-white'}`}>
                <span className="text-[10px] font-bold bg-orange-100 text-orange-600 rounded-full px-1.5 py-0.5">{m.category_ar}</span>
                <div className="font-black text-slate-900 text-xs mt-1.5 leading-tight">{isAr?m.name_ar:m.name_en}</div>
                <div className="text-[10px] text-slate-400">{m.origin_ar}</div>
                <div className="text-[10px] font-semibold text-emerald-600 mt-1">{m.typical_price_min}–{m.typical_price_max} AED/{m.bulk_unit}</div>
              </button>
            })}
          </div>
        </div>
        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex-1">
            <div className="flex items-center gap-2 mb-4"><div className="w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center text-white text-[11px] font-black">2</div><h2 className="font-black text-slate-800 text-sm">{isAr?'الكمية والسعر':'Qty & Price'}</h2></div>
            {material?(
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-slate-400 font-bold mb-1 block">{isAr?`الكمية (${material.bulk_unit})`:`Qty (${material.bulk_unit})`}</label>
                  <input type="number" min="1" value={bulkQty} dir="ltr" onChange={e=>setBulkQty(e.target.value)} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-xl font-black text-slate-900 focus:outline-none focus:border-orange-400 tabular-nums"/>
                  <p className="text-[11px] text-slate-400 mt-1">{isAr?'صافي: ':'Net: '}<strong className="text-slate-600 tabular-nums">{Math.floor(+bulkQty*material.yield_pct/100)} {material.bulk_unit}</strong></p>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-bold mb-1 block">{isAr?`سعر الشراء (AED/${material.bulk_unit})`:`Price (AED/${material.bulk_unit})`}</label>
                  <input type="number" min="0.1" step="0.1" value={bulkPrice} dir="ltr" onChange={e=>setBulkPrice(e.target.value)} placeholder={`${material.typical_price_min}–${material.typical_price_max}`} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-xl font-black text-slate-900 focus:outline-none focus:border-orange-400 tabular-nums"/>
                </div>
              </div>
            ):<p className="text-sm text-slate-400 text-center py-4">{isAr?'اختر المادة أولاً':'Select material first'}</p>}
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex-1">
            <div className="flex items-center gap-2 mb-4"><div className="w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center text-white text-[11px] font-black">3</div><h2 className="font-black text-slate-800 text-sm">{isAr?'أحجام التعبئة المستهدفة':'Target Sizes'}</h2></div>
            {material?(
              <div className="flex flex-wrap gap-2">
                {material.suitable_sizes.map(sz=>{
                  const isSel=sizes.includes(sz)
                  const unit=material.bulk_unit==='L'?(sz<1?`${sz*1000}ml`:`${sz}L`):(sz<1?`${sz*1000}g`:`${sz}kg`)
                  const units=Math.floor(+bulkQty*material.yield_pct/100/sz)
                  return (
                    <button key={sz} onClick={()=>toggleSize(sz)}
                      className={`relative flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-xl border-2 transition-colors min-w-[60px] ${isSel?'border-orange-500 bg-orange-50':'border-slate-200 hover:border-orange-300 bg-white'}`}>
                      {isSel&&<div className="absolute -top-2 -end-2 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-white"/></div>}
                      <span className="text-sm font-black text-slate-900 tabular-nums">{unit}</span>
                      <span className="text-[10px] text-slate-400 tabular-nums">{units.toLocaleString('en-US')}</span>
                    </button>
                  )
                })}
              </div>
            ):<p className="text-sm text-slate-400 text-center py-4">{isAr?'اختر المادة أولاً':'Select material first'}</p>}
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={()=>setShowResults(true)} disabled={!material||!bulkQty||!bulkPrice||sizes.length===0}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black px-7 py-3 rounded-2xl text-sm shadow-sm">
          <Calculator className="w-4 h-4"/>{isAr?'احسب الآن':'Calculate Now'}
        </button>
      </div>
      {showResults&&results.length>0&&(
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[
              {la:'إجمالي الوحدات',en:'Total Units',val:results.reduce((a,r)=>a+r.units,0).toLocaleString('en-US'),cls:'bg-blue-50 border-blue-100 text-blue-700'},
              {la:'تكلفة الخام',en:'Raw Cost',val:`${(+bulkQty*+bulkPrice).toFixed(0)} AED`,cls:'bg-slate-50 border-slate-200 text-slate-700'},
              {la:'إجمالي الربح',en:'Total Profit',val:`${results.reduce((a,r)=>a+r.total_profit,0).toLocaleString('en-US')} AED`,cls:'bg-emerald-50 border-emerald-100 text-emerald-700'},
            ].map((s,i)=><div key={i} className={`border rounded-2xl p-4 text-center ${s.cls}`}><div className="text-lg font-black tabular-nums">{s.val}</div><div className="text-xs mt-0.5 opacity-70">{isAr?s.la:s.en}</div></div>)}
          </div>
          {results.map(r=>{
            const unit=material!.bulk_unit==='L'?(r.size<1?`${r.size*1000}ml`:`${r.size}L`):(r.size<1?`${r.size*1000}g`:`${r.size}kg`)
            return (
              <div key={r.size} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2"><Package className="w-4 h-4 text-orange-500"/><span className="font-black text-slate-900">{unit}</span><span className="text-xs text-slate-400 tabular-nums">× {r.units.toLocaleString('en-US')} {isAr?'وحدة':'units'}</span></div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${r.margin_pct>=25?'bg-emerald-100 text-emerald-700':r.margin_pct>=15?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}`}>{isAr?`هامش ${r.margin_pct}%`:`${r.margin_pct}% margin`}</span>
                </div>
                <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  {[
                    {la:'تكلفة الخام/وحدة',en:'Raw/unit',v:`${r.raw_cost.toFixed(2)} AED`},
                    {la:'تكلفة الغلاف/وحدة',en:'Pkg/unit',v:`${r.pkg_cost.toFixed(2)} AED`},
                    {la:'إجمالي التكلفة/وحدة',en:'COGS/unit',v:`${r.total_cogs.toFixed(2)} AED`,bold:true},
                    {la:'سعر الجملة',en:'Wholesale',v:`${r.wholesale_price.toFixed(2)} AED`,orange:true},
                    {la:'سعر التجزئة',en:'Retail',v:`${r.retail_price.toFixed(2)} AED`,purple:true},
                    {la:'ربح/وحدة',en:'Profit/unit',v:`${r.profit_per_unit.toFixed(2)} AED`,green:true},
                    {la:'ربح الدفعة',en:'Batch profit',v:`${r.total_profit.toLocaleString('en-US')} AED`,greenBold:true},
                  ].map((row,i)=>(
                    <div key={i} className="bg-slate-50 rounded-xl p-3">
                      <div className="text-slate-400 mb-1">{isAr?row.la:row.en}</div>
                      <div className={`tabular-nums font-semibold ${(row as {greenBold?:boolean}).greenBold?'font-black text-emerald-700':(row as {orange?:boolean}).orange?'text-orange-600 font-black':(row as {purple?:boolean}).purple?'text-purple-600 font-bold':(row as {green?:boolean}).green?'text-emerald-600 font-bold':(row as {bold?:boolean}).bold?'font-bold text-slate-900':'text-slate-700'}`}>{row.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4"><CheckSquare className="w-5 h-5 text-orange-500"/><h2 className="font-black text-slate-900">{isAr?'متطلبات الليبل — UAE.S 9:2019':'Label Requirements — UAE.S 9:2019'}</h2></div>
            <div className="space-y-2">
              {LABEL_REQUIREMENTS.map(req=>(
                <div key={req.id} className="flex items-start gap-3 py-1">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-black ${req.mandatory?'bg-red-100 text-red-600':'bg-slate-100 text-slate-400'}`}>{req.mandatory?'!':'?'}</div>
                  <div className="flex-1 flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-slate-700">{isAr?req.text_ar:req.text_en}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${req.mandatory?'bg-red-50 text-red-500':'bg-slate-100 text-slate-400'}`}>{req.mandatory?(isAr?'إلزامي':'Mandatory'):(isAr?'اختياري':'Optional')}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 flex items-start gap-2">
              <TrendingUp className="w-4 h-4 flex-shrink-0 mt-0.5"/>
              <div>{isAr?<><strong>تسجيل علامتك في ESMA:</strong> 3,000–8,000 AED للمنتج الأول، 2–4 أشهر. GS1 الإمارات لـ EAN-13 (~500 AED/سنة).</>:<><strong>ESMA brand registration:</strong> 3,000–8,000 AED, 2–4 months. GS1 UAE for EAN-13 (~500 AED/year).</>}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PackagingPage() {
  const params = useParams()
  const locale = (params.locale as string)||'ar'
  const isAr   = locale==='ar'
  const [mode, setMode]                         = useState<'cartons'|'repack'>('cartons')
  const [primaryPacks, setPrimaryPacks]         = useState<PrimaryPack[]>([])
  const [masterCartons, setMasterCartons]       = useState<MasterCarton[]>([])
  const [packagingOptions, setPackagingOptions] = useState<PackagingOption[]>([])

  useEffect(()=>{
    fetch('/api/packaging/specs').then(r=>r.json()).then(d=>{
      if(d.primary_packs) setPrimaryPacks(d.primary_packs.filter((p:PrimaryPack)=>p.is_active!==false))
      if(d.master_cartons) setMasterCartons(d.master_cartons.filter((c:MasterCarton)=>c.is_active!==false))
      if(d.options) setPackagingOptions(d.options.filter((o:PackagingOption)=>o.is_active!==false))
    }).catch(()=>{})
  },[])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold text-orange-500 tracking-wider uppercase">Crate Tools</p>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">{isAr?'حاسبة التعبئة والتغليف':'Packaging Calculator'}</h1>
          </div>
          <div className="inline-flex bg-slate-100 rounded-xl p-1 gap-1 flex-shrink-0">
            {([{v:'cartons',ar:'حساب التغليف والكراتين',en:'Packaging & Cartons'},{v:'repack',ar:'إعادة تعبئة مادة خام',en:'Repackaging'}] as const).map(t=>(
              <button key={t.v} onClick={()=>setMode(t.v)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${mode===t.v?'bg-white text-slate-900 shadow-sm':'text-slate-500 hover:text-slate-700'}`}>
                {isAr?t.ar:t.en}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-4">
        {mode==='cartons'
          ?<CartonsCalculator isAr={isAr} primaryPacks={primaryPacks} masterCartons={masterCartons} packagingOptions={packagingOptions}/>
          :<RepackCalculator isAr={isAr}/>}
      </div>
    </div>
  )
}
