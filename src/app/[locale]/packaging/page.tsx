'use client'
import { useState, useMemo, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import {
  Package, AlertCircle, CheckSquare, TrendingUp, Boxes, Warehouse,
  Layers, Send, Truck, MapPin, Loader2, CheckCircle2, Calculator,
  ShoppingBasket, RefreshCw, ChevronDown, Star, Shield, Clock,
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

        {/* ══ PHASE: SETUP — single card with two sections ══ */}
        {phase === 'setup' && (
          <div className="space-y-3">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

              {/* ── Section 1: Quantity ── */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 transition-colors duration-300 ${hasQty?'bg-emerald-500 text-white':'bg-slate-900 text-white'}`}>
                    {hasQty?'✓':'1'}
                  </div>
                  <span className="font-black text-slate-800 text-sm">{isAr?'الكمية والمنتج':'Quantity & Product'}</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 mb-1 block">{isAr?'وصف المنتج (اختياري)':'Product description (optional)'}</label>
                    <input value={productLabel} onChange={e=>setProductLabel(e.target.value)}
                      placeholder={isAr?'مثال: أرز بسمتي 1كجم':'e.g. Basmati Rice 1kg'}
                      dir={isAr?'rtl':'ltr'}
                      className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 transition-colors placeholder:text-slate-300"/>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="inline-flex bg-slate-100 rounded-xl p-0.5 gap-0.5">
                      {(['weight','units'] as const).map(m=>(
                        <button key={m} onClick={()=>setQtyMode(m)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${qtyMode===m?'bg-white text-slate-900 shadow-sm':'text-slate-500 hover:text-slate-700'}`}>
                          {m==='weight'?(isAr?'وزن':'Weight'):(isAr?'عدد الوحدات':'Unit count')}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-1 items-center gap-2">
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
                </div>
              </div>

              {/* ── Section 2: Primary packaging ── */}
              <div className={`px-4 py-3 transition-opacity duration-300 ${hasQty?'opacity-100':'opacity-40 pointer-events-none'}`}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 transition-colors duration-300 ${primaryDone?'bg-emerald-500 text-white':'bg-slate-900 text-white'}`}>
                    {primaryDone?'✓':'2'}
                  </div>
                  <span className="font-black text-slate-800 text-sm">{isAr?'التغليف الأساسي (الوحدة)':'Primary packaging'}</span>
                </div>
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
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
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
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {masterCartons.map((mc,idx)=>{
                  const sel = carton?.id===mc.id
                  const tint  = CARTON_TINTS[idx%CARTON_TINTS.length]
                  const stk   = CARTON_STROKES[idx%CARTON_STROKES.length]
                  return (
                    <button key={mc.id} onClick={()=>setCarton(mc)}
                      className={`relative flex flex-row ${isAr?'flex-row-reverse':''} text-start rounded-2xl border-2 transition-all bg-white overflow-hidden ${sel?'border-orange-500 shadow-md':'border-slate-200 hover:border-orange-300 hover:shadow-sm'}`}>
                      {sel&&<div className={`absolute top-2 ${isAr?'start-2':'end-2'} z-10 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center shadow`}><div className="w-2 h-2 rounded-full bg-white"/></div>}

                      {/* Image area — square left (en) / right (ar) */}
                      <div className="flex-shrink-0 w-28 bg-slate-50 flex items-center justify-center p-2">
                        {mc.image_url?(
                          <img src={resolveImageUrl(mc.image_url)} alt={isAr?mc.name_ar:mc.name_en}
                            className="w-full h-full object-contain"/>
                        ):(
                          <CartonSvg size={52} tint={tint} stroke={stk}/>
                        )}
                      </div>

                      {/* Info area */}
                      <div className={`flex-1 px-3 py-3 ${isAr?'border-r':'border-l'} border-slate-100 flex flex-col justify-center`}>
                        <div className="font-black text-slate-900 text-sm leading-tight mb-1">{isAr?mc.name_ar:mc.name_en}</div>
                        <div className="text-[10px] text-slate-400 tabular-nums">{mc.l_cm}×{mc.w_cm}×{mc.h_cm} cm</div>
                        <div className="text-[10px] text-slate-400 mb-1.5">{isAr?`حتى ${mc.max_weight_kg}كجم`:`up to ${mc.max_weight_kg}kg`}</div>
                        <div className="text-sm font-black text-orange-500">{Number(mc.cost_aed).toFixed(1)} AED</div>
                      </div>
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

// ─── Basket Calculator ───────────────────────────────────────────────────────

interface BasketItem { id: string; name: string; brand: string; weightKg: number; qty: number }

function calcBoxesPerPallet(l: number, w: number, h: number): number {
  if (!l || !w || !h) return 1
  const layers = Math.max(1, Math.floor(160 / h))
  const a = Math.floor(120 / l) * Math.floor(100 / w)
  const b = Math.floor(120 / w) * Math.floor(100 / l)
  return Math.max(a, b, 1) * layers
}

// weight formatter: ≥1000 kg → طن, else kg
function fmtW(kg: number): string {
  if (kg >= 1000) return `${(kg/1000).toFixed(2)} طن`
  return `${kg.toFixed(1)} kg`
}

function BasketCalculator({ isAr, masterCartons }: { isAr: boolean; masterCartons: MasterCarton[] }) {
  const [cartonOnly, setCartonOnly]   = useState(false)
  const [items, setItems] = useState<BasketItem[]>([
    { id: '1', name: isAr ? 'أرز' : 'Rice', brand: '', weightKg: 2, qty: 1 },
    { id: '2', name: isAr ? 'زيت' : 'Oil',  brand: '', weightKg: 1.8, qty: 1 },
  ])
  const [basketCount, setBasketCount] = useState('1000')
  const [cartonMode, setCartonMode]   = useState<'db'|'custom'>('db')
  const [selCarton,  setSelCarton]    = useState<MasterCarton|null>(null)
  const [cL, setCL] = useState(''); const [cW, setCW] = useState(''); const [cH, setCH] = useState('')
  const [cCost, setCCost] = useState(''); const [cName, setCName] = useState('')
  const [cEmptyW, setCEmptyW] = useState('')  // custom carton empty weight kg
  const [priceUnknown, setPriceUnknown] = useState(true)
  const [actionOpen, setActionOpen] = useState(true)
  const [contact, setContact] = useState({ name:'', company:'', email:'', phone:'' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [submitErr, setSubmitErr]   = useState<string|null>(null)

  function addItem() { setItems(p=>[...p,{id:Date.now().toString(),name:'',brand:'',weightKg:0,qty:1}]) }
  function delItem(id:string) { setItems(p=>p.filter(i=>i.id!==id)) }
  function upd(id:string, f:keyof BasketItem, v:string|number) { setItems(p=>p.map(i=>i.id===id?{...i,[f]:v}:i)) }

  const totalW = useMemo(()=>
    cartonOnly ? 0 : items.reduce((s,i)=>s+(i.weightKg||0)*(i.qty||0),0)
  ,[items, cartonOnly])
  const baskets = parseInt(basketCount)||0

  const carton = useMemo<MasterCarton|null>(()=>{
    if (cartonMode==='db') {
      if (!selCarton) return null
      const cost = priceUnknown ? 0 : (parseFloat(cCost) || Number(selCarton.cost_aed) || 0)
      return { ...selCarton, cost_aed: cost }
    }
    const l=parseFloat(cL)||0, w=parseFloat(cW)||0, h=parseFloat(cH)||0
    const cost = priceUnknown ? 0 : (parseFloat(cCost)||0)
    if (!l||!w||!h) return null
    return { id:'custom', l_cm:l, w_cm:w, h_cm:h, cost_aed:cost,
             name_ar: cName||'كرتون مخصص', name_en: cName||'Custom carton',
             max_weight_kg:50,
             empty_weight_kg: parseFloat(cEmptyW)||null,
           } as unknown as MasterCarton
  },[cartonMode,selCarton,cL,cW,cH,cCost,cName,priceUnknown,cEmptyW])

  // empty_weight_kg from selected carton or custom input
  const cartonEmptyW = carton
    ? ((carton as unknown as {empty_weight_kg?:number|null}).empty_weight_kg ?? null)
    : null
  const totalEmptyW  = (cartonEmptyW && baskets) ? cartonEmptyW * baskets : null

  const calc = useMemo(()=>{
    if (!carton||!baskets) return null
    const bpp  = calcBoxesPerPallet(carton.l_cm, carton.w_cm, carton.h_cm)
    const pals = Math.ceil(baskets/bpp)
    const flr  = Math.ceil(pals*1.2)
    const cost = priceUnknown ? null : baskets*Number(carton.cost_aed)
    const ton  = (baskets*totalW)/1000
    return { bpp, pals, flr, cost, ton }
  },[carton,baskets,totalW,priceUnknown])

  function openPrintWindow(showContact: boolean) {
    if (!calc||!carton) return
    const date = new Date().toLocaleDateString('ar-AE')
    const ref  = 'BSK-'+Date.now().toString().slice(-6)
    const rows = items.filter(i=>i.qty>0||i.name).map(i=>
      `<tr>
        <td>${i.name||'—'}</td><td style="color:#64748b">${i.brand||'—'}</td>
        <td style="text-align:center;direction:ltr">${i.weightKg} kg</td>
        <td style="text-align:center">${i.qty}</td>
        <td style="text-align:center;font-weight:700;direction:ltr">${(i.weightKg*i.qty).toFixed(2)} kg</td>
       </tr>`
    ).join('')
    const hasCost   = !priceUnknown && calc.cost !== null
    const loadMin   = cartonOnly ? (carton as unknown as {max_weight_kg?:number}).max_weight_kg || 30 : Math.ceil(totalW * 1.15)
    const emptyWKg  = (carton as unknown as {empty_weight_kg?:number|null}).empty_weight_kg ?? null
    const totalEW   = emptyWKg && baskets ? emptyWKg * baskets : null
    const footer    = `<div style="border-top:1px solid #f1f5f9;padding-top:10px;margin-top:20px;font-size:10px;color:#94a3b8;display:flex;justify-content:center;gap:20px;flex-wrap:wrap">
  <span>&#128222; +971 543 000 415</span>
  <span>&#9993; uae@crate.ae</span>
  <span>&#127760; crate.ae</span>
</div>`

    const html = cartonOnly
    ? `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8">
<title>طلب تسعير كرتون - ${ref}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;background:#fff;padding:32px;direction:rtl;max-width:750px;margin:0 auto}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #f97316;padding-bottom:16px;margin-bottom:20px}
h2{font-size:13px;font-weight:800;color:#f97316;margin:18px 0 8px;border-bottom:1px solid #f1f5f9;padding-bottom:5px}
table{width:100%;border-collapse:collapse;font-size:12px}
td{padding:8px 10px;border-bottom:1px solid #f1f5f9}
.rfq-box{background:#f0fdf4;border:2px solid #bbf7d0;border-radius:10px;padding:14px;text-align:center;margin:14px 0}
@media print{body{padding:16px}}</style></head><body>
<div class="hdr">
  <div>
    <div style="font-size:22px;font-weight:900;color:#f97316">Crate.ae</div>
    <div style="font-size:11px;color:#64748b;margin-top:2px">حلول التجهيز والتعبئة والتغليف</div>
  </div>
  <div style="text-align:left;font-size:12px;color:#64748b;line-height:1.8">
    <div style="font-size:15px;font-weight:800;color:#1e293b;margin-bottom:4px">طلب تسعير كرتون</div>
    <div>التاريخ: ${date}</div>
    <div>Ref: ${ref}</div>
  </div>
</div>
${showContact && contact.name ? `<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:12px;margin-bottom:16px;font-size:12px;line-height:1.8">
  <strong>العميل:</strong> ${contact.name}${contact.company?' — '+contact.company:''}
  ${contact.email?'<br><strong>البريد:</strong> '+contact.email:''}
  ${contact.phone?'<br><strong>الهاتف:</strong> '+contact.phone:''}
</div>` : ''}
<h2>مواصفات الكرتون</h2>
<table><tbody>
<tr><td style="font-weight:700;width:200px">الاسم</td><td>${carton.name_ar}</td></tr>
<tr><td style="font-weight:700">الأبعاد الداخلية</td><td style="direction:ltr;text-align:right">${Math.round(carton.l_cm*10)} × ${Math.round(carton.w_cm*10)} × ${Math.round(carton.h_cm*10)} mm (L×W×H)</td></tr>
${emptyWKg ? `<tr><td style="font-weight:700">وزن الكرتون الفارغ</td><td style="direction:ltr;text-align:right">${emptyWKg} kg</td></tr>` : ''}
<tr><td style="font-weight:700">تحمل الوزن الأدنى</td><td style="direction:ltr;text-align:right">≥ ${loadMin} kg</td></tr>
${hasCost ? `<tr><td style="font-weight:700">سعر الكرتون</td><td style="direction:ltr;text-align:right">${Number(carton.cost_aed).toFixed(2)} AED</td></tr>` : ''}
</tbody></table>
<h2>مواصفات التوريد</h2>
<table><tbody>
<tr><td style="font-weight:700;width:200px">أبعاد داخلية / Internal Dims</td><td style="direction:ltr;text-align:right">${Math.round(carton.l_cm*10)} × ${Math.round(carton.w_cm*10)} × ${Math.round(carton.h_cm*10)} mm</td></tr>
<tr><td style="font-weight:700">نوع الكرتون / Type</td><td>Double Wall — خماسي الطبقات (BC Flute) RSC</td></tr>
<tr><td style="font-weight:700">Burst Strength</td><td>≥ 200 PSI</td></tr>
<tr><td style="font-weight:700">ECT</td><td>≥ 44 ECT</td></tr>
<tr><td style="font-weight:700">الليناء / Liner</td><td>Kraft Liner</td></tr>
<tr><td style="font-weight:700">الكمية / Qty</td><td style="direction:ltr;text-align:right">${baskets.toLocaleString('en-US')} قطعة</td></tr>
${totalEW ? `<tr><td style="font-weight:700">إجمالي وزن الكراتين الفارغة</td><td style="direction:ltr;text-align:right">${totalEW >= 1000 ? (totalEW/1000).toFixed(2)+' طن' : totalEW.toFixed(1)+' kg'}</td></tr>` : ''}
<tr><td style="font-weight:700">التعبئة / Packing</td><td>على باليتات — stretch wrap — 4 طبقات</td></tr>
</tbody></table>
${hasCost
  ? `<div style="background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;border-radius:10px;padding:14px;text-align:center;margin:14px 0">
      <div style="font-size:11px;opacity:.85">التكلفة التقريبية الإجمالية</div>
      <div style="font-size:24px;font-weight:900;direction:ltr">${(calc.cost??0).toLocaleString('en-US')} AED</div>
     </div>`
  : `<div class="rfq-box">
      <div style="font-size:13px;font-weight:800;color:#166534;margin-bottom:3px">احصل على عرض سعر مخصص</div>
      <div style="font-size:11px;color:#15803d">يرجى التواصل معنا لتسعير الكمية المطلوبة</div>
     </div>`}
${footer}
</body></html>`

    : `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8">
<title>متطلبات كرتون السلة الغذائية - ${ref}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;background:#fff;padding:32px;direction:rtl}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #f97316;padding-bottom:18px;margin-bottom:24px}
.docinfo{text-align:left;font-size:12px;color:#64748b;line-height:1.8}
h2{font-size:13px;font-weight:800;color:#f97316;margin:20px 0 10px;border-bottom:1px solid #f1f5f9;padding-bottom:6px}
table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:12px}
th{background:#f8fafc;padding:9px 12px;text-align:right;font-weight:700;color:#475569;border-bottom:2px solid #e2e8f0}
td{padding:9px 12px;border-bottom:1px solid #f1f5f9}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:16px 0}
.stat{background:#f8fafc;border-radius:10px;padding:14px;text-align:center;border:1px solid #e2e8f0}
.sv{font-size:20px;font-weight:900;color:#f97316;direction:ltr}.sl{font-size:10px;color:#94a3b8;margin-top:3px}
.total{background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;border-radius:12px;padding:18px;text-align:center;margin:16px 0}
.rfq-box{background:#f0fdf4;border:2px solid #bbf7d0;border-radius:12px;padding:18px;text-align:center;margin:16px 0}
@media print{body{padding:16px}}</style></head><body>
<div class="hdr">
  <div>
    <div style="font-size:22px;font-weight:900;color:#f97316">Crate.ae</div>
    <div style="font-size:11px;color:#64748b;margin-top:3px">حلول التجهيز والتعبئة والتغليف</div>
  </div>
  <div class="docinfo">
    <div style="font-size:15px;font-weight:800;color:#1e293b;margin-bottom:4px">متطلبات كرتون السلة الغذائية</div>
    <div>التاريخ: ${date}</div>
    <div>Ref: ${ref}</div>
  </div>
</div>
${showContact && contact.name ? `<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:14px;margin-bottom:20px;font-size:12px;line-height:1.8">
  <strong>العميل:</strong> ${contact.name}${contact.company?' — '+contact.company:''}
  ${contact.email?'<br><strong>البريد:</strong> '+contact.email:''}
  ${contact.phone?'<br><strong>الهاتف:</strong> '+contact.phone:''}
</div>` : ''}
<h2>محتويات السلة (لكل وحدة)</h2>
<table><thead><tr><th>المنتج</th><th>البراند</th><th style="text-align:center">الوزن/وحدة</th><th style="text-align:center">العدد</th><th style="text-align:center">الوزن الإجمالي</th></tr></thead>
<tbody>${rows}</tbody>
<tfoot><tr style="font-weight:800;background:#fff7ed">
  <td colspan="4">إجمالي وزن السلة الواحدة</td>
  <td style="text-align:center;direction:ltr">${totalW.toFixed(2)} kg</td>
</tr></tfoot></table>
<h2>مواصفات الكرتون</h2>
<table><tbody>
<tr><td style="font-weight:700;width:200px">الاسم</td><td>${carton.name_ar}</td></tr>
<tr><td style="font-weight:700">الأبعاد الداخلية</td><td style="direction:ltr;text-align:right">${Math.round(carton.l_cm*10)} × ${Math.round(carton.w_cm*10)} × ${Math.round(carton.h_cm*10)} mm (L×W×H)</td></tr>
${emptyWKg ? `<tr><td style="font-weight:700">وزن الكرتون الفارغ</td><td style="direction:ltr;text-align:right">${emptyWKg} kg</td></tr>` : ''}
<tr><td style="font-weight:700">تحمل الوزن الأدنى</td><td style="direction:ltr;text-align:right">≥ ${loadMin} kg</td></tr>
${hasCost ? `<tr><td style="font-weight:700">سعر الكرتون</td><td style="direction:ltr;text-align:right">${Number(carton.cost_aed).toFixed(2)} AED</td></tr>` : ''}
</tbody></table>
<h2>نتائج الحساب</h2>
<div class="grid">
<div class="stat"><div class="sv">${baskets.toLocaleString('en-US')}</div><div class="sl">كرتون مطلوب</div></div>
<div class="stat"><div class="sv">${calc.pals.toLocaleString('en-US')}</div><div class="sl">باليت</div></div>
<div class="stat"><div class="sv">${calc.flr} m²</div><div class="sl">مساحة أرضية</div></div>
${totalEW ? `<div class="stat"><div class="sv">${totalEW>=1000?(totalEW/1000).toFixed(2)+' طن':totalEW.toFixed(1)+' kg'}</div><div class="sl">وزن الكراتين الفارغة</div></div>` :
`<div class="stat"><div class="sv">${calc.ton>=1?calc.ton.toFixed(2)+' طن':(calc.ton*1000).toFixed(1)+' kg'}</div><div class="sl">وزن المحتوى الإجمالي</div></div>`}
</div>
${hasCost
  ? `<div class="total">
      <div style="font-size:12px;opacity:.85;margin-bottom:4px">التكلفة التقريبية الإجمالية للكراتين</div>
      <div style="font-size:28px;font-weight:900;direction:ltr">${(calc.cost??0).toLocaleString('en-US')} AED</div>
      <div style="font-size:11px;opacity:.75;margin-top:4px;direction:ltr">${baskets.toLocaleString('en-US')} × ${Number(carton.cost_aed).toFixed(2)} AED</div>
     </div>`
  : `<div class="rfq-box">
      <div style="font-size:13px;font-weight:800;color:#166534;margin-bottom:4px">احصل على عرض سعر مخصص</div>
      <div style="font-size:11px;color:#15803d">يرجى التواصل معنا لتسعير الكمية المطلوبة</div>
     </div>`}
<h2>مواصفات التوريد</h2>
<table><tbody>
<tr><td style="font-weight:700;width:220px">أبعاد داخلية / Internal Dims</td><td style="direction:ltr;text-align:right">${Math.round(carton.l_cm*10)} × ${Math.round(carton.w_cm*10)} × ${Math.round(carton.h_cm*10)} mm</td></tr>
<tr><td style="font-weight:700">نوع الكرتون / Type</td><td>Double Wall — خماسي الطبقات (BC Flute) RSC</td></tr>
<tr><td style="font-weight:700">Burst Strength</td><td>≥ 200 PSI</td></tr>
<tr><td style="font-weight:700">ECT</td><td>≥ 44 ECT</td></tr>
<tr><td style="font-weight:700">الليناء / Liner</td><td>Kraft Liner</td></tr>
<tr><td style="font-weight:700">الكمية / Qty</td><td style="direction:ltr;text-align:right">${baskets.toLocaleString('en-US')} قطعة</td></tr>
${totalEW ? `<tr><td style="font-weight:700">إجمالي وزن الكراتين الفارغة</td><td style="direction:ltr;text-align:right">${totalEW>=1000?(totalEW/1000).toFixed(2)+' طن':totalEW.toFixed(1)+' kg'}</td></tr>` : ''}
<tr><td style="font-weight:700">الباليتات / Pallets</td><td style="direction:ltr;text-align:right">${calc.pals.toLocaleString('en-US')} باليت — ${calc.bpp} كرتون/باليت</td></tr>
<tr><td style="font-weight:700">التعبئة / Packing</td><td>على باليتات — stretch wrap — 4 طبقات</td></tr>
</tbody></table>
${footer}
</body></html>`
    const w = window.open('','_blank')
    if (!w) return
    w.document.write(html); w.document.close()
    setTimeout(()=>w.print(), 600)
  }

  async function submitAndDownload() {
    if (!calc||!carton) return
    if (!contact.name || !contact.email || !contact.phone) {
      setSubmitErr(isAr?'الاسم والبريد الإلكتروني ورقم الهاتف مطلوبة':'Name, email and phone are required')
      return
    }
    setSubmitting(true); setSubmitErr(null)
    try {
      const res = await fetch('/api/packaging/basket-rfq', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          contact_name: contact.name, contact_company: contact.company,
          contact_email: contact.email, contact_phone: contact.phone,
          basket_count: baskets, total_weight_kg: totalW, price_known: !priceUnknown,
          carton_name: carton.name_ar || carton.name_en || 'كرتون',
          carton_dims: `${Math.round(carton.l_cm*10)}×${Math.round(carton.w_cm*10)}×${Math.round(carton.h_cm*10)} mm`,
          carton_cost_aed: priceUnknown ? null : Number(carton.cost_aed),
          items, calc,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(()=>({}))
        setSubmitErr(err.error || (isAr?'خطأ من الخادم':'Server error'))
        setSubmitting(false)
        return
      }
      setSubmitted(true)
    } catch {
      setSubmitErr(isAr?'تعذّر الاتصال بالخادم، تحقق من الإنترنت':'Connection failed, check your internet')
    } finally { setSubmitting(false) }
    // Open print window outside try/catch so any print error doesn't mask submit success
    openPrintWindow(true)
  }

  const canAct = !!calc

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 items-start">
      {/* ── LEFT ── */}
      <div className="space-y-3">

        {/* Basket contents */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100">
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black">1</div>
            <span className="font-black text-slate-800 text-sm">{isAr?'محتويات السلة (لكل وحدة)':'Basket contents (per unit)'}</span>
            <button onClick={()=>setCartonOnly(p=>!p)}
              className={`ms-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-colors ${cartonOnly?'border-blue-400 bg-blue-50 text-blue-700':'border-slate-200 text-slate-400 hover:border-slate-300'}`}>
              <span className={`w-3 h-3 rounded border-2 flex items-center justify-center flex-shrink-0 ${cartonOnly?'bg-blue-500 border-blue-500':'border-slate-300'}`}>
                {cartonOnly&&<span className="text-white text-[8px] font-black">✓</span>}
              </span>
              {isAr?'تسعير الكرتون فقط':'Carton quote only'}
            </button>
          </div>
          <div className="p-4 space-y-2">
            {cartonOnly ? (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <Boxes className="w-5 h-5 text-blue-400 flex-shrink-0"/>
                <p className="text-xs text-blue-700 leading-relaxed">
                  {isAr
                    ? 'وضع تسعير الكرتون فقط — المنتجات غير مطلوبة. سيتضمن الطلب مواصفات الكرتون والكمية فقط.'
                    : 'Carton-only quote mode — no products required. The request will include carton specs and quantity only.'}
                </p>
              </div>
            ) : (
              <>
                {/* Header row */}
                <div className="grid grid-cols-[1fr_1fr_80px_52px_32px] gap-2 text-[10px] font-bold text-slate-400 px-1">
                  <span>{isAr?'المنتج':'Product'}</span>
                  <span>{isAr?'البراند (اختياري)':'Brand (optional)'}</span>
                  <span className="text-center">{isAr?'وزن/وحدة kg':'Weight kg'}</span>
                  <span className="text-center">{isAr?'العدد':'Qty'}</span>
                  <span/>
                </div>
                {items.map((item,idx)=>(
                  <div key={item.id} className="grid grid-cols-[1fr_1fr_80px_52px_32px] gap-2 items-center">
                    <input value={item.name} onChange={e=>upd(item.id,'name',e.target.value)}
                      placeholder={isAr?`منتج ${idx+1}`:`Item ${idx+1}`} dir={isAr?'rtl':'ltr'}
                      className="border-2 border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 transition-colors"/>
                    <input value={item.brand} onChange={e=>upd(item.id,'brand',e.target.value)}
                      placeholder={isAr?'مثال: Almarai':'e.g. Almarai'} dir={isAr?'rtl':'ltr'}
                      className="border-2 border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 transition-colors text-slate-500 placeholder:text-slate-300"/>
                    <input type="number" min="0" step="0.1" value={item.weightKg||''} dir="ltr"
                      onChange={e=>upd(item.id,'weightKg',parseFloat(e.target.value)||0)}
                      className="border-2 border-slate-200 rounded-xl px-2 py-2 text-sm text-center font-bold focus:outline-none focus:border-orange-400 tabular-nums"/>
                    <input type="number" min="1" step="1" value={item.qty||''} dir="ltr"
                      onChange={e=>upd(item.id,'qty',parseInt(e.target.value)||1)}
                      className="border-2 border-slate-200 rounded-xl px-2 py-2 text-sm text-center font-bold focus:outline-none focus:border-orange-400 tabular-nums"/>
                    <button onClick={()=>delItem(item.id)} disabled={items.length===1}
                      className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors disabled:opacity-30">
                      <span className="text-lg leading-none">×</span>
                    </button>
                  </div>
                ))}
                <button onClick={addItem}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border-2 border-dashed border-slate-200 text-xs font-bold text-slate-400 hover:border-orange-300 hover:text-orange-500 transition-colors">
                  <span className="text-base leading-none">+</span>
                  {isAr?'إضافة منتج':'Add item'}
                </button>
                {totalW > 0 && (
                  <div className="flex items-center justify-between px-2 py-2 bg-orange-50 rounded-xl">
                    <span className="text-xs font-bold text-orange-700">{isAr?'إجمالي وزن السلة':'Total basket weight'}</span>
                    <span className="text-sm font-black text-orange-600 tabular-nums">{totalW.toFixed(2)} kg</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Basket count */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100">
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black">2</div>
            <span className="font-black text-slate-800 text-sm">{isAr?'عدد السلال الإجمالي':'Total baskets'}</span>
          </div>
          <div className="px-4 py-4">
            <div className="flex items-center gap-3">
              <input type="number" min="1" value={basketCount} dir="ltr"
                onChange={e=>setBasketCount(e.target.value)}
                className="flex-1 border-2 border-slate-200 rounded-xl px-3 py-2.5 text-lg font-black text-slate-900 focus:outline-none focus:border-orange-400 transition-colors tabular-nums"/>
              <span className="text-slate-500 font-semibold text-sm flex-shrink-0">{isAr?'سلة / كرتون':'basket / carton'}</span>
            </div>
          </div>
        </div>

        {/* Carton selection */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100">
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black">3</div>
            <span className="font-black text-slate-800 text-sm">{isAr?'مواصفات الكرتون':'Carton specs'}</span>
          </div>
          <div className="p-4 space-y-3">
            {/* Mode toggle */}
            <div className="inline-flex bg-slate-100 rounded-xl p-0.5 gap-0.5">
              {([{v:'custom',ar:'أبعاد مخصصة',en:'Custom dims'},{v:'db',ar:'اختر من القائمة',en:'From library'}] as const).map(m=>(
                <button key={m.v} onClick={()=>setCartonMode(m.v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${cartonMode===m.v?'bg-white text-slate-900 shadow-sm':'text-slate-500 hover:text-slate-700'}`}>
                  {isAr?m.ar:m.en}
                </button>
              ))}
            </div>

            {cartonMode==='custom' ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 mb-1 block">{isAr?'اسم الكرتون (اختياري)':'Carton name (optional)'}</label>
                  <input value={cName} onChange={e=>setCName(e.target.value)}
                    placeholder={isAr?'مثال: كرتون سلة رمضان':'e.g. Ramadan basket carton'}
                    className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 transition-colors"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 mb-1.5 block">{isAr?'الأبعاد الداخلية (سم)':'Internal dimensions (cm)'}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[{v:cL,s:setCL,p:'الطول L'},{v:cW,s:setCW,p:'العرض W'},{v:cH,s:setCH,p:'الارتفاع H'}].map((f,i)=>(
                      <div key={i}>
                        <label className="text-[9px] text-slate-400 block mb-0.5 text-center">{f.p}</label>
                        <input type="number" min="1" step="0.1" value={f.v} dir="ltr"
                          onChange={e=>f.s(e.target.value)}
                          className="w-full border-2 border-slate-200 rounded-xl px-2 py-2 text-sm font-bold text-center focus:outline-none focus:border-orange-400 tabular-nums"/>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 mb-1 block">{isAr?'وزن الكرتون الفارغ (kg)':'Empty carton weight (kg)'}</label>
                    <input type="number" min="0" step="0.1" value={cEmptyW} dir="ltr"
                      onChange={e=>setCEmptyW(e.target.value)} placeholder="0.0"
                      className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-orange-400 tabular-nums"/>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 mb-1 block">{isAr?'طاقة تحمل الكرتون (kg)':'Load capacity (kg)'}</label>
                    <input type="number" min="0" step="1" value="" dir="ltr"
                      readOnly placeholder={isAr?'تلقائي':'Auto'}
                      className="w-full border-2 border-slate-100 bg-slate-50 rounded-xl px-3 py-2 text-sm text-slate-400 tabular-nums cursor-default"/>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {masterCartons.length===0 && (
                  <p className="text-xs text-slate-400 col-span-2 py-4 text-center">{isAr?'لا توجد كراتين محفوظة':'No cartons in library yet'}</p>
                )}
                {masterCartons.map((mc,idx)=>{
                  const sel = selCarton?.id===mc.id
                  const tint   = CARTON_TINTS[idx%CARTON_TINTS.length]
                  const stk    = CARTON_STROKES[idx%CARTON_STROKES.length]
                  return (
                    <button key={mc.id} onClick={()=>setSelCarton(mc)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 text-start transition-all ${sel?'border-orange-500 bg-orange-50':'border-slate-200 hover:border-orange-300'}`}>
                      <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-white rounded-lg">
                        {mc.image_url ? <img src={resolveImageUrl(mc.image_url)} alt="" className="w-full h-full object-contain rounded-lg"/> : <CartonSvg size={32} tint={tint} stroke={stk}/>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-black text-slate-900 text-xs truncate">{isAr?mc.name_ar:mc.name_en}</div>
                        <div className="text-[10px] text-slate-400">{mc.l_cm}×{mc.w_cm}×{mc.h_cm} cm</div>
                        <div className="text-[10px] font-black text-orange-500">{Number(mc.cost_aed).toFixed(1)} AED</div>
                      </div>
                      {sel && <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0"><div className="w-1.5 h-1.5 rounded-full bg-white"/></div>}
                    </button>
                  )
                })}
              </div>
            )}
            {/* Price toggle — shown in both modes */}
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold text-slate-400">{isAr?'سعر الكرتون':'Carton price'}</label>
                <button onClick={()=>setPriceUnknown(p=>!p)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-2 text-[10px] font-bold transition-colors ${!priceUnknown?'border-emerald-400 bg-emerald-50 text-emerald-700':'border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                  <span className={`w-3 h-3 rounded border-2 flex items-center justify-center flex-shrink-0 ${!priceUnknown?'bg-emerald-500 border-emerald-500':'border-slate-300'}`}>
                    {!priceUnknown&&<span className="text-white text-[8px] font-black">✓</span>}
                  </span>
                  {isAr?'أعلم السعر':'I know the price'}
                </button>
              </div>
              {priceUnknown ? (
                <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2.5">
                  <span className="text-orange-400 text-sm">💬</span>
                  <p className="text-[11px] text-orange-700 font-medium">{isAr?'سيظهر في الملف: احصل على عرض سعر مخصص':'PDF will show: Get a custom quote'}</p>
                </div>
              ) : (
                <input type="number" min="0" step="0.5" value={cCost} dir="ltr"
                  onChange={e=>setCCost(e.target.value)}
                  placeholder={isAr?'أدخل السعر يدوياً...':'Enter price manually...'}
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-orange-400 tabular-nums"/>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ── RIGHT sidebar ── */}
      <div className="lg:sticky lg:top-4 space-y-3">

        {/* Results card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
            <Calculator className="w-3.5 h-3.5 text-orange-500"/>
            <p className="text-xs font-black text-slate-600">{isAr?'النتائج':'Results'}</p>
          </div>
          <div className="p-4">
            {calc ? (
              <div className="space-y-3">
                {/* Primary stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-orange-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-black tabular-nums text-orange-600" dir="ltr">{fmt(baskets)}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{isAr?'كرتون مطلوب':'Cartons'}</div>
                  </div>
                  {totalEmptyW !== null ? (
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <div className="text-xl font-black tabular-nums text-slate-700" dir="ltr">{fmtW(totalEmptyW)}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{isAr?'وزن الكراتين الفارغة':'Empty cartons weight'}</div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <div className="text-[11px] font-bold text-slate-300 mt-2">{isAr?'أضف وزن الكرتون':'Add carton weight'}</div>
                      <div className="text-[10px] text-slate-300 mt-0.5">{isAr?'لحساب الوزن الفارغ':'to calc empty weight'}</div>
                    </div>
                  )}
                </div>

                {/* Cost line */}
                {calc.cost !== null ? (
                  <div className="flex justify-between items-center bg-emerald-50 rounded-xl px-3 py-2.5">
                    <span className="text-xs font-bold text-emerald-700">{isAr?'تكلفة الكراتين':'Carton cost'}</span>
                    <span className="font-black text-emerald-600 tabular-nums text-sm" dir="ltr">{fmt(calc.cost)} AED</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-orange-50 rounded-xl px-3 py-2.5">
                    <span className="text-orange-400 text-sm">◎</span>
                    <span className="text-xs text-orange-600 font-bold">{isAr?'احصل على عرض سعر مخصص':'Get a custom quote'}</span>
                  </div>
                )}

                {/* Additional notes */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                  <p className="text-[10px] font-black text-slate-500 mb-2">{isAr?'ملاحظات إضافية':'Additional notes'}</p>
                  {[
                    {la:'توزيع الباليت',  en:'Per pallet',     v:`${calc.bpp} ${isAr?'كرتون':'cartons'}`},
                    {la:'عدد الباليتات', en:'Pallets',         v:fmt(calc.pals)},
                    {la:'مساحة أرضية',  en:'Floor area',      v:`${calc.flr} m²`},
                    ...(!cartonOnly && totalW > 0 ? [{la:'وزن محتوى السلة', en:'Basket content weight', v:fmtW(totalW)}] : []),
                    ...(!cartonOnly && calc.ton > 0 ? [{la:'إجمالي وزن المحتوى', en:'Total content weight', v:fmtW(calc.ton*1000)}] : []),
                    {la:'تعبئة الشحن',   en:'Packing method',  v:'Stretch wrap · 4 طبقات'},
                  ].map((r,i)=>(
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-slate-400">{isAr?r.la:r.en}</span>
                      <span className="font-semibold text-slate-700 tabular-nums" dir="ltr">{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Boxes className="w-5 h-5 text-slate-300"/>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isAr?'أدخل أبعاد الكرتون لتبدأ الحساب':'Enter carton dimensions to calculate'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Action card ── */}
        {submitted ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto"/>
            <div>
              <p className="font-black text-emerald-800 text-sm mb-1">{isAr?'تم إرسال طلبك بنجاح!':'Request sent successfully!'}</p>
              <p className="text-xs text-emerald-600 leading-relaxed">{isAr?'شكراً لك! سيتواصل معك فريقنا فور تجهيز الأسعار.':'Thank you! Our team will contact you as soon as prices are ready.'}</p>
            </div>
            <a href="https://wa.me/971543000415?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%20%D8%B4%D9%83%D8%B1%D8%A7%D9%8B%20%D9%84%D8%AA%D9%88%D8%A7%D8%B5%D9%84%D9%83%D9%85%20%D9%85%D8%B9%D9%86%D8%A7%2C%20%D9%82%D9%85%D8%AA%20%D8%A8%D8%AA%D9%82%D8%AF%D9%8A%D9%85%20%D8%B7%D9%84%D8%A8%20%D8%AA%D8%B3%D8%B9%D9%8A%D8%B1%20%D9%84%D9%83%D8%B1%D8%A7%D8%AA%D9%8A%D9%86%20%D8%A7%D9%84%D8%B3%D9%84%D8%A9%20%D8%A7%D9%84%D8%BA%D8%B0%D8%A7%D8%A6%D9%8A%D8%A9" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-2.5 rounded-xl text-sm transition-colors">
              <span>💬</span>
              {isAr?'تواصل معنا على واتساب':'Contact us on WhatsApp'}
            </a>
            <button onClick={()=>openPrintWindow(false)} className="w-full flex items-center justify-center gap-2 border-2 border-emerald-300 text-emerald-700 font-bold py-2.5 rounded-xl text-sm hover:bg-emerald-100 transition-colors">
              <Send className="w-4 h-4"/>
              {isAr?'تحميل نسخة المتطلبات':'Download requirements'}
            </button>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-slate-900 flex items-center gap-2">
              <Send className="w-3.5 h-3.5 text-orange-400"/>
              <p className="text-xs font-black text-white">{isAr?'عرض المتطلبات وطلب التسعير':'Requirements & Quote Request'}</p>
            </div>

            {/* Toggle: submit vs download only */}
            <div className="px-4 pt-3 pb-1">
              <div className="inline-flex bg-slate-100 rounded-xl p-0.5 gap-0.5 w-full">
                <button onClick={()=>setActionOpen(true)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${actionOpen?'bg-white text-slate-900 shadow-sm':'text-slate-500 hover:text-slate-700'}`}>
                  {isAr?'تقديم طلب + تحميل':'Submit & Download'}
                </button>
                <button onClick={()=>setActionOpen(false)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${!actionOpen?'bg-white text-slate-900 shadow-sm':'text-slate-500 hover:text-slate-700'}`}>
                  {isAr?'تحميل فقط':'Download only'}
                </button>
              </div>
            </div>

            <div className="p-4 pt-3 space-y-3">
              {actionOpen ? (
                <>
                  <p className="text-[10px] text-slate-400 leading-relaxed">{isAr?'أدخل بياناتك لإرسال طلب التسعير ونسخة المتطلبات للفريق، وتحميل نسخة للاستخدام الشخصي.':'Enter your details to send a quote request to our team and download your copy.'}</p>
                  <div className="space-y-2">
                    {[
                      {k:'name',    ar:'الاسم *',                    en:'Name *',          t:'text'},
                      {k:'company', ar:'الشركة',                     en:'Company',          t:'text'},
                      {k:'email',   ar:'البريد الإلكتروني *',        en:'Email *',          t:'email'},
                      {k:'phone',   ar:'الهاتف / واتساب *',          en:'Phone / WhatsApp *', t:'text'},
                    ].map(f=>(
                      <input key={f.k} type={f.t} value={contact[f.k as keyof typeof contact]}
                        onChange={e=>setContact({...contact,[f.k]:e.target.value})}
                        placeholder={isAr?f.ar:f.en} dir={isAr?'rtl':'ltr'}
                        className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 transition-colors"/>
                    ))}
                  </div>
                  {submitErr && <p className="text-xs text-red-500">{submitErr}</p>}
                  <button onClick={submitAndDownload} disabled={!canAct||submitting}
                    className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black py-3 rounded-xl text-sm transition-colors">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
                    {isAr?'إرسال الطلب وتحميل النسخة':'Send request & download'}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-[10px] text-slate-400 leading-relaxed">{isAr?'حمّل ملف المتطلبات الكاملة جاهزاً للإرسال لمورد الكراتين، دون تسجيل بيانات.':'Download the full requirements file ready to send to your carton supplier.'}</p>
                  <button onClick={()=>openPrintWindow(false)} disabled={!canAct}
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-700 disabled:opacity-40 text-white font-black py-3 rounded-xl text-sm transition-colors">
                    <Send className="w-4 h-4"/>
                    {isAr?'تحميل ملف المتطلبات':'Download requirements file'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Spec hint */}
        {calc && totalW > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-700 space-y-1">
            <p className="font-black">{isAr?'مواصفات للمورد':'Supplier specs'}</p>
            <p>Double Wall · BC Flute · RSC</p>
            <p dir="ltr" className="text-start">Burst ≥ 200 PSI · ECT ≥ 44</p>
            <p className="font-semibold" dir="ltr">{`Load ≥ ${Math.ceil(totalW*1.15)} kg`}</p>
          </div>
        )}

      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

const TOOLS = [
  {
    v: 'cartons' as const,
    ar: 'تغليف المنتجات',
    en: 'Product Packaging',
    descAr: 'احسب عدد الوحدات، اختر التغليف الأساسي والكرتون المناسب، واحصل على تكلفة دقيقة لكل وحدة.',
    descEn: 'Calculate units, choose primary packaging and master carton, get accurate cost per unit.',
    icon: Package,
    color: 'orange',
    tagAr: 'الأكثر استخداماً',
    tagEn: 'Most popular',
  },
  {
    v: 'basket' as const,
    ar: 'سلة غذائية مختلطة',
    en: 'Food Basket',
    descAr: 'صمّم سلتك الغذائية، حدد المنتجات والأوزان، واحسب عدد الكراتين والباليت مع تكلفة التعبئة.',
    descEn: 'Design your food basket, set products and weights, calculate cartons, pallets and packaging cost.',
    icon: ShoppingBasket,
    color: 'emerald',
    tagAr: 'مناسب للمواسم',
    tagEn: 'Perfect for seasons',
  },
  {
    v: 'repack' as const,
    ar: 'إعادة تعبئة',
    en: 'Repackaging',
    descAr: 'استورد مواد خام بالجملة وأعد تعبئتها تحت علامتك التجارية الخاصة في الإمارات بتكلفة مثالية.',
    descEn: 'Import bulk raw materials and repackage under your own UAE brand at optimal cost.',
    icon: RefreshCw,
    color: 'blue',
    tagAr: 'White Label',
    tagEn: 'White Label',
  },
] as const

const TOOL_COLORS: Record<string, { bg: string; border: string; text: string; badge: string; icon: string; ring: string }> = {
  orange:  { bg:'bg-orange-50',  border:'border-orange-300',  text:'text-orange-600',  badge:'bg-orange-100 text-orange-700',  icon:'bg-orange-100 text-orange-600', ring:'ring-orange-400' },
  emerald: { bg:'bg-emerald-50', border:'border-emerald-300', text:'text-emerald-600', badge:'bg-emerald-100 text-emerald-700',icon:'bg-emerald-100 text-emerald-600',ring:'ring-emerald-400'},
  blue:    { bg:'bg-blue-50',    border:'border-blue-300',    text:'text-blue-600',    badge:'bg-blue-100 text-blue-700',    icon:'bg-blue-100 text-blue-600',    ring:'ring-blue-400'   },
}

function SeoSection({ isAr }: { isAr: boolean }) {
  const features = [
    { icon: Calculator, ar: 'حاسبة دقيقة ومجانية', en: 'Free & Accurate Calculator', dAr: 'احسب تكاليف التغليف الحقيقية بناءً على أبعاد الكرتون وعدد الوحدات وأسعار السوق.', dEn: 'Calculate real packaging costs based on carton dimensions, unit count, and market prices.' },
    { icon: Truck,      ar: 'من المصنع إلى المستهلك', en: 'Factory to Consumer',       dAr: 'نغطي كامل سلسلة التوريد: استيراد، إعادة تعبئة، تخزين، وتوزيع داخل الإمارات.',              dEn: 'We cover the full supply chain: import, repackaging, storage, and UAE distribution.' },
    { icon: Shield,     ar: 'مطابقة لمتطلبات الإمارات', en: 'UAE Compliant',           dAr: 'تغليف مطابق لاشتراطات هيئة الغذاء والدواء الإماراتية ومواصفات المنافذ التجارية.',        dEn: 'Packaging compliant with UAE Food & Drug Authority and retail outlet specifications.' },
    { icon: Star,       ar: 'أكثر من 95 منتجاً جاهزاً', en: '95+ Ready Products',     dAr: 'مكتبة منتجات جاهزة للاستيراد والتعبئة الفورية، من المواد الغذائية إلى المنظفات.',         dEn: 'Ready product library for immediate import and packaging, from food to cleaning supplies.' },
  ]

  const faq = [
    {
      qAr: 'كيف أحسب عدد الكراتين المطلوبة لشحنتي؟',
      qEn: 'How do I calculate the number of cartons needed for my shipment?',
      aAr: 'استخدم حاسبة "تغليف المنتجات" أعلاه — أدخل عدد الوحدات أو الوزن، اختر التغليف الأساسي (كيس، زجاجة، برطمان...)، ثم اختر كرتون الشحن. ستحصل فوراً على عدد الكراتين المطلوبة وتكلفة التغليف الإجمالية.',
      aEn: 'Use the "Product Packaging" calculator above — enter unit count or weight, choose primary packaging (bag, bottle, jar...), then select a master carton. You\'ll instantly get the number of cartons needed and total packaging cost.',
    },
    {
      qAr: 'ما هو الفرق بين التغليف الأساسي وكرتون الشحن؟',
      qEn: 'What is the difference between primary packaging and master carton?',
      aAr: 'التغليف الأساسي هو العبوة المباشرة للمنتج (كيس، زجاجة، علبة) التي يراها المستهلك. أما كرتون الشحن (Master Carton) فهو الصندوق الخارجي الذي يحتوي على عدة وحدات من التغليف الأساسي ويُستخدم للنقل والتخزين.',
      aEn: 'Primary packaging is the direct product container (bag, bottle, box) that the consumer sees. The master carton is the outer box containing multiple primary packaging units, used for transport and storage.',
    },
    {
      qAr: 'هل يمكنني إعادة تعبئة المنتجات تحت علامتي التجارية في الإمارات؟',
      qEn: 'Can I repackage products under my own brand in the UAE?',
      aAr: 'نعم، هذه من أكثر الخدمات طلباً في Crate.ae. نستورد المواد الخام أو المنتجات بالجملة، ثم نُعيد تعبئتها بتصاميم وأحجام وعلامات تجارية مخصصة لك، متوافقة مع اشتراطات الاستيراد الإماراتية.',
      aEn: 'Yes, this is one of Crate.ae\'s most requested services. We import raw materials or bulk products, then repackage them with your custom designs, sizes, and brand, compliant with UAE import requirements.',
    },
    {
      qAr: 'كيف أحسب تكلفة سلة الرمضان أو السلة الغذائية المختلطة؟',
      qEn: 'How do I calculate the cost of a Ramadan or mixed food basket?',
      aAr: 'استخدم حاسبة "السلة الغذائية المختلطة" أعلاه. أضف المنتجات مع الكميات والأوزان، حدد كرتون التعبئة، وستحصل على عدد الكراتين المطلوبة، عدد الباليت، المساحة التخزينية، والتكلفة الإجمالية. يمكنك أيضاً تقديم طلب عرض سعر مباشرة.',
      aEn: 'Use the "Food Basket" calculator above. Add products with quantities and weights, select the packaging carton, and you\'ll get required cartons, pallets, storage floor space, and total cost. You can also submit a quote request directly.',
    },
    {
      qAr: 'ما الحد الأدنى لكمية الطلب في خدمات التعبئة والتغليف؟',
      qEn: 'What is the minimum order quantity for packaging services?',
      aAr: 'يختلف الحد الأدنى حسب نوع المنتج والتغليف. بشكل عام نبدأ من 500 وحدة للتغليف الأساسي، ومن 1000 سلة للسلات الغذائية. تواصل معنا للحصول على عرض سعر مخصص لكميتك.',
      aEn: 'The minimum varies by product type and packaging. Generally we start from 500 units for primary packaging, and 1,000 baskets for food baskets. Contact us for a custom quote based on your quantity.',
    },
  ]

  const [openFaq, setOpenFaq] = useState<number|null>(null)

  return (
    <div className="max-w-5xl mx-auto px-6 pb-20 space-y-16 mt-16">

      {/* Why Crate */}
      <section>
        <div className="text-center mb-10">
          <p className="text-xs font-bold text-orange-500 tracking-widest uppercase mb-2">{isAr?'لماذا Crate.ae':'Why Crate.ae'}</p>
          <h2 className="text-2xl font-black text-slate-900">{isAr?'كل ما تحتاجه لتعبئة وتغليف منتجاتك في الإمارات':'Everything you need to package your products in the UAE'}</h2>
          <p className="text-slate-500 mt-3 max-w-2xl mx-auto text-sm leading-relaxed">
            {isAr
              ? 'من الاستيراد إلى التغليف النهائي — نقدم أدوات حساب دقيقة وخدمات متكاملة لمساعدتك على إطلاق منتجاتك بكفاءة وتكلفة مثالية.'
              : 'From import to final packaging — we provide accurate calculation tools and integrated services to help you launch products efficiently at optimal cost.'}
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f,i)=>(
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-3">
                <f.icon className="w-5 h-5"/>
              </div>
              <h3 className="font-black text-slate-900 text-sm mb-1.5">{isAr?f.ar:f.en}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{isAr?f.dAr:f.dEn}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Service Details */}
      <section className="grid md:grid-cols-3 gap-6">
        {[
          {
            icon: Package, color:'orange',
            titleAr:'تغليف المنتجات الغذائية والاستهلاكية', titleEn:'Food & Consumer Product Packaging',
            bodyAr:'نوفر تغليف أساسي بمواصفات دقيقة: أكياس مخصصة، زجاجات PET، برطمانات زجاجية، علب كرتون مع تصاميم طباعة باللغتين العربية والإنجليزية. نضمن مطابقة الملصقات لاشتراطات هيئة الغذاء والدواء الإماراتية.',
            bodyEn:'We provide primary packaging with precise specifications: custom bags, PET bottles, glass jars, carton boxes with Arabic/English print designs. Labels comply with UAE Food & Drug Authority requirements.',
          },
          {
            icon: ShoppingBasket, color:'emerald',
            titleAr:'السلال الغذائية للمناسبات والشركات', titleEn:'Occasion & Corporate Food Baskets',
            bodyAr:'متخصصون في تعبئة سلال رمضان والأعياد للشركات والتجزئة. نصمم السلة وفق ميزانيتك، نختار المنتجات، نعبّئها ونرتبها بشكل احترافي، ونوفر باليت كاملة جاهزة للتوزيع.',
            bodyEn:'Specialists in Ramadan and occasion basket packaging for corporate and retail clients. We design the basket to your budget, select products, pack and arrange professionally, and provide full pallets ready for distribution.',
          },
          {
            icon: RefreshCw, color:'blue',
            titleAr:'إعادة التعبئة تحت العلامة التجارية الخاصة', titleEn:'Private Label Repackaging',
            bodyAr:'استورد مواد خام أو منتجات سائبة بأسعار الجملة، ثم أعد تعبئتها تحت علامتك التجارية. نتولى كل شيء: تصميم العبوة، الطباعة، التعبئة، والمطابقة مع متطلبات الاستيراد في الإمارات.',
            bodyEn:'Import raw materials or bulk products at wholesale prices, then repackage under your brand. We handle everything: packaging design, printing, packing, and UAE import compliance.',
          },
        ].map((s,i)=>{
          const c = TOOL_COLORS[s.color]
          return (
            <div key={i} className={`${c.bg} border ${c.border} rounded-2xl p-5`}>
              <div className={`w-10 h-10 ${c.icon} rounded-xl flex items-center justify-center mb-3`}>
                <s.icon className="w-5 h-5"/>
              </div>
              <h3 className={`font-black text-slate-900 text-sm mb-2 leading-snug`}>{isAr?s.titleAr:s.titleEn}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{isAr?s.bodyAr:s.bodyEn}</p>
            </div>
          )
        })}
      </section>

      {/* FAQ */}
      <section>
        <div className="text-center mb-8">
          <p className="text-xs font-bold text-orange-500 tracking-widest uppercase mb-2">{isAr?'أسئلة شائعة':'FAQ'}</p>
          <h2 className="text-2xl font-black text-slate-900">{isAr?'أسئلة متكررة عن التعبئة والتغليف':'Frequently Asked Questions About Packaging'}</h2>
        </div>
        <div className="space-y-2 max-w-3xl mx-auto">
          {faq.map((item,i)=>(
            <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <button onClick={()=>setOpenFaq(openFaq===i?null:i)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-right hover:bg-slate-50 transition-colors">
                <h3 className="font-bold text-slate-900 text-sm text-right flex-1">{isAr?item.qAr:item.qEn}</h3>
                <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${openFaq===i?'rotate-180':''}`}/>
              </button>
              {openFaq===i && (
                <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {isAr?item.aAr:item.aEn}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 rounded-3xl p-8 md:p-12 text-center">
        <Clock className="w-10 h-10 text-orange-400 mx-auto mb-4"/>
        <h2 className="text-xl md:text-2xl font-black text-white mb-3">
          {isAr?'هل تحتاج عرض سعر مخصص لمشروعك؟':'Need a custom quote for your project?'}
        </h2>
        <p className="text-slate-400 text-sm mb-6 max-w-xl mx-auto leading-relaxed">
          {isAr
            ? 'فريقنا جاهز لمساعدتك في حساب تكاليف التغليف وتقديم حلول مخصصة لنشاطك التجاري في الإمارات.'
            : 'Our team is ready to help you calculate packaging costs and offer custom solutions for your UAE business.'}
        </p>
        <a href={`mailto:crateuae@gmail.com?subject=${encodeURIComponent(isAr?'طلب عرض سعر تغليف':'Packaging Quote Request')}`}
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black px-6 py-3 rounded-xl transition-colors text-sm">
          <Send className="w-4 h-4"/>
          {isAr?'تواصل معنا الآن':'Contact Us Now'}
        </a>
      </section>

    </div>
  )
}

const calcRef = { current: null as HTMLDivElement | null }

export default function PackagingPage() {
  const params = useParams()
  const locale = (params.locale as string)||'ar'
  const isAr   = locale==='ar'
  const [mode, setMode]                         = useState<'cartons'|'repack'|'basket'|null>(null)
  const [primaryPacks, setPrimaryPacks]         = useState<PrimaryPack[]>([])
  const [masterCartons, setMasterCartons]       = useState<MasterCarton[]>([])
  const [packagingOptions, setPackagingOptions] = useState<PackagingOption[]>([])
  const calcSectionRef = useRef<HTMLDivElement>(null)

  useEffect(()=>{
    fetch('/api/packaging/specs').then(r=>r.json()).then(d=>{
      if(d.primary_packs) setPrimaryPacks(d.primary_packs.filter((p:PrimaryPack)=>p.is_active!==false))
      if(d.master_cartons) setMasterCartons(d.master_cartons.filter((c:MasterCarton)=>c.is_active!==false))
      if(d.options) setPackagingOptions(d.options.filter((o:PackagingOption)=>o.is_active!==false))
    }).catch(()=>{})
  },[])

  function selectMode(v: 'cartons'|'repack'|'basket') {
    setMode(v)
    // Scroll to calculator after state update
    setTimeout(()=>{
      calcSectionRef.current?.scrollIntoView({ behavior:'smooth', block:'start' })
    }, 50)
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-12 md:py-16 text-center">
          <div className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-700 text-[11px] font-bold px-3 py-1.5 rounded-full mb-5">
            <Calculator className="w-3.5 h-3.5"/>
            {isAr?'أدوات مجانية — لا تسجيل مطلوب':'Free Tools — No Registration Required'}
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-4">
            {isAr
              ? <><span className="text-orange-500">حاسبة التعبئة والتغليف</span><br/>في الإمارات العربية المتحدة</>
              : <><span className="text-orange-500">Packaging Calculator</span><br/>for the UAE Market</>}
          </h1>
          <p className="text-slate-500 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            {isAr
              ? 'احسب تكاليف تغليف منتجاتك، صمّم سلتك الغذائية، أو خطط لإعادة التعبئة تحت علامتك الخاصة — كل ذلك مجاناً وفي ثوانٍ.'
              : 'Calculate your product packaging costs, design your food basket, or plan private-label repackaging — all free and in seconds.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
            {(isAr
              ? ['✓ تكاليف دقيقة', '✓ حساب الباليت', '✓ طلب عرض سعر', '✓ تصدير PDF']
              : ['✓ Accurate costs', '✓ Pallet calculation', '✓ Request a quote', '✓ PDF export']
            ).map((t,i)=><span key={i} className="font-medium">{t}</span>)}
          </div>
        </div>
      </section>

      {/* ── 3 TOOL CARDS ──────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-10">
        <p className="text-center text-xs font-bold text-slate-400 tracking-widest uppercase mb-6">
          {isAr?'اختر الأداة المناسبة لك':'Choose Your Tool'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TOOLS.map(t=>{
            const c = TOOL_COLORS[t.color]
            const active = mode === t.v
            return (
              <button key={t.v} onClick={()=>selectMode(t.v)}
                className={`group text-right w-full rounded-2xl border-2 p-5 md:p-6 transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none
                  ${active ? `${c.bg} ${c.border} ring-2 ${c.ring} ring-offset-2` : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${active ? c.icon : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>
                    <t.icon className="w-5 h-5"/>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${active ? c.badge : 'bg-slate-100 text-slate-400'}`}>
                    {isAr?t.tagAr:t.tagEn}
                  </span>
                </div>
                <h2 className={`font-black text-base mb-1.5 leading-snug transition-colors ${active ? c.text : 'text-slate-900'}`}>
                  {isAr?t.ar:t.en}
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isAr?t.descAr:t.descEn}
                </p>
                {active && (
                  <div className={`mt-3 flex items-center gap-1 text-xs font-bold ${c.text}`}>
                    <ChevronDown className="w-3.5 h-3.5"/>
                    {isAr?'الحاسبة أدناه':'Calculator below'}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* ── CALCULATOR ────────────────────────────────────────────────────── */}
      {mode && (
        <div ref={calcSectionRef} className="max-w-5xl mx-auto px-6 pb-10 scroll-mt-6">
          <div className="bg-white border-2 border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            {/* Calculator header strip */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 bg-slate-50">
              {(() => {
                const t = TOOLS.find(x=>x.v===mode)!
                const c = TOOL_COLORS[t.color]
                return (
                  <>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${c.icon}`}>
                      <t.icon className="w-4 h-4"/>
                    </div>
                    <span className={`font-black text-sm ${c.text}`}>{isAr?t.ar:t.en}</span>
                    <button onClick={()=>setMode(null)} className="ms-auto text-slate-400 hover:text-slate-600 text-lg font-bold leading-none px-1">×</button>
                  </>
                )
              })()}
            </div>
            <div className="p-4 md:p-6">
              {mode==='cartons' && <CartonsCalculator isAr={isAr} primaryPacks={primaryPacks} masterCartons={masterCartons} packagingOptions={packagingOptions}/>}
              {mode==='basket'  && <BasketCalculator  isAr={isAr} masterCartons={masterCartons}/>}
              {mode==='repack'  && <RepackCalculator  isAr={isAr}/>}
            </div>
          </div>
        </div>
      )}

      {/* ── SEO CONTENT ───────────────────────────────────────────────────── */}
      <SeoSection isAr={isAr}/>

    </div>
  )
}
