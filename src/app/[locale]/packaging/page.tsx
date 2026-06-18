'use client'
import { useState, useMemo, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  Package, Calculator, AlertCircle, CheckSquare, TrendingUp,
  Boxes, Warehouse, Layers, Send, Truck, MapPin, Loader2, CheckCircle2,
  ChevronRight, ChevronLeft,
} from 'lucide-react'
import { RAW_MATERIALS, PKG_COSTS, type RawMaterial } from '@/lib/data/products-catalog'
import {
  calcPackaging,
  type PrimaryPack, type MasterCarton, type PackagingOption, type PackagingCalcResult,
} from '@/lib/data/packaging-specs'

// ─── SVG Mockups ─────────────────────────────────────────────────────────────

function BagMockup({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="22" width="44" height="50" rx="6" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1.5"/>
      <path d="M28 22 C28 14 52 14 52 22" stroke="#cbd5e1" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <rect x="22" y="30" width="36" height="2" rx="1" fill="#e2e8f0"/>
      <rect x="22" y="35" width="28" height="1.5" rx="0.75" fill="#e2e8f0"/>
      <rect x="22" y="39" width="32" height="1.5" rx="0.75" fill="#e2e8f0"/>
      <rect x="22" y="50" width="36" height="10" rx="3" fill="#e2e8f0"/>
      <rect x="26" y="54" width="12" height="2" rx="1" fill="#cbd5e1"/>
    </svg>
  )
}

function BottleMockup({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="33" y="12" width="14" height="10" rx="3" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.2"/>
      <path d="M28 28 Q27 22 33 22 L47 22 Q53 22 52 28 L54 62 Q54 68 47 68 L33 68 Q26 68 26 62 Z" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1.5"/>
      <rect x="28" y="36" width="24" height="2" rx="1" fill="#e2e8f0"/>
      <rect x="30" y="46" width="20" height="8" rx="2" fill="#e2e8f0"/>
      <rect x="33" y="49" width="8" height="2" rx="1" fill="#cbd5e1"/>
    </svg>
  )
}

function JarMockup({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="26" y="14" width="28" height="8" rx="4" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.2"/>
      <rect x="22" y="22" width="36" height="46" rx="8" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1.5"/>
      <rect x="24" y="30" width="32" height="2" rx="1" fill="#e2e8f0"/>
      <rect x="26" y="40" width="28" height="10" rx="3" fill="#e2e8f0"/>
      <rect x="29" y="43" width="10" height="2" rx="1" fill="#cbd5e1"/>
    </svg>
  )
}

function BoxMockup({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="16" y="26" width="48" height="42" rx="4" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1.5"/>
      <path d="M16 36 L64 36" stroke="#e2e8f0" strokeWidth="1.5"/>
      <path d="M40 26 L40 36" stroke="#e2e8f0" strokeWidth="1.5"/>
      <rect x="24" y="42" width="32" height="18" rx="3" fill="#e2e8f0"/>
      <rect x="28" y="46" width="12" height="2" rx="1" fill="#cbd5e1"/>
    </svg>
  )
}

function CartonMockup({ size = 80, variant = 'sm' }: { size?: number; variant?: 'sm'|'md'|'lg'|'xl'|'move' }) {
  const colors: Record<string, string> = { sm:'#f1f5f9', md:'#eff6ff', lg:'#f0fdf4', xl:'#fefce8', move:'#fdf4ff' }
  const strokes: Record<string, string> = { sm:'#e2e8f0', md:'#dbeafe', lg:'#dcfce7', xl:'#fef08a', move:'#e9d5ff' }
  const bg = colors[variant] ?? '#f1f5f9'
  const st = strokes[variant] ?? '#e2e8f0'
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Front face */}
      <rect x="16" y="28" width="44" height="36" rx="3" fill={bg} stroke={st} strokeWidth="1.5"/>
      {/* Top flaps */}
      <path d="M16 28 L22 18 L54 18 L60 28" stroke={st} strokeWidth="1.5" fill={bg}/>
      <path d="M38 18 L38 28" stroke={st} strokeWidth="1.2" strokeDasharray="2 2"/>
      {/* Side face */}
      <path d="M60 28 L66 22 L66 58 L60 64" stroke={st} strokeWidth="1.2" fill={bg}/>
      {/* Flap divider */}
      <path d="M16 36 L60 36" stroke={st} strokeWidth="1"/>
      {/* Label area */}
      <rect x="20" y="40" width="34" height="16" rx="2" fill={st} opacity="0.5"/>
      <rect x="23" y="43" width="10" height="1.5" rx="0.75" fill={st}/>
      <rect x="23" y="47" width="16" height="1.5" rx="0.75" fill={st}/>
    </svg>
  )
}

function PouchMockup({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 20 L56 20 L58 62 Q58 68 40 68 Q22 68 22 62 Z" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1.5"/>
      <path d="M24 20 L22 28" stroke="#e2e8f0" strokeWidth="1.2"/>
      <path d="M56 20 L58 28" stroke="#e2e8f0" strokeWidth="1.2"/>
      <rect x="24" y="20" width="32" height="8" rx="2" fill="#e2e8f0"/>
      <rect x="26" y="35" width="28" height="10" rx="2" fill="#e2e8f0"/>
      <rect x="29" y="38" width="10" height="2" rx="1" fill="#cbd5e1"/>
      <path d="M26 55 Q40 60 54 55" stroke="#e2e8f0" strokeWidth="1.2" fill="none"/>
    </svg>
  )
}

function CanMockup({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="40" cy="22" rx="20" ry="6" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.2"/>
      <rect x="20" y="22" width="40" height="40" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1.5"/>
      <ellipse cx="40" cy="62" rx="20" ry="6" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.2"/>
      <rect x="22" y="32" width="36" height="14" rx="2" fill="#e2e8f0"/>
      <rect x="26" y="35" width="10" height="2" rx="1" fill="#cbd5e1"/>
      <line x1="20" y1="26" x2="60" y2="26" stroke="#e2e8f0" strokeWidth="0.8"/>
      <line x1="20" y1="58" x2="60" y2="58" stroke="#e2e8f0" strokeWidth="0.8"/>
    </svg>
  )
}

const PACK_MOCKUPS: Record<string, React.FC<{ size?: number }>> = {
  bag: BagMockup, bottle: BottleMockup, jar: JarMockup,
  box: BoxMockup, pouch: PouchMockup, can: CanMockup,
}

const CARTON_VARIANTS: Record<number, 'sm'|'md'|'lg'|'xl'|'move'> = {
  0: 'sm', 1: 'md', 2: 'lg', 3: 'xl', 4: 'move', 5: 'move', 6: 'move',
}

// ─── Shared small components ──────────────────────────────────────────────────

function Step({ num, title, sub }: { num: number | string; title: string; sub?: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-7 h-7 bg-slate-900 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0 mt-0.5">{num}</div>
      <div>
        <h2 className="font-black text-slate-900 text-base leading-tight">{title}</h2>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

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

  if (done) {
    return (
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
  }

  return (
    <div className="bg-slate-900 rounded-3xl p-8 text-white">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Send className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-black text-xl mb-1">{isAr ? 'اطلب عرض سعر من Crate' : 'Request a quote from Crate'}</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            {isAr
              ? 'دع Crate تتولى التفاوض — نجمع الأسعار من مصانع الكراتين والموردين ونعود إليك بعرض واحد شامل.'
              : 'Let Crate handle the sourcing — we collect prices from carton factories and suppliers and return one complete offer.'}
          </p>
        </div>
      </div>

      {!open ? (
        <button onClick={() => setOpen(true)}
          className="bg-white text-slate-900 font-black px-7 py-3 rounded-2xl text-sm hover:bg-slate-100 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
          {isAr ? 'متابعة لطلب السعر ←' : '→ Continue to quote request'}
        </button>
      ) : (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { key: 'contact_name', ph_ar: 'الاسم *', ph_en: 'Name *', type: 'text', dir: 'auto' },
              { key: 'company_name', ph_ar: 'اسم الشركة', ph_en: 'Company', type: 'text', dir: 'auto' },
              { key: 'email', ph_ar: 'البريد الإلكتروني', ph_en: 'Email', type: 'email', dir: 'ltr' },
              { key: 'phone', ph_ar: 'الهاتف / واتساب', ph_en: 'Phone / WhatsApp', type: 'text', dir: 'ltr' },
            ].map(f => (
              <input key={f.key}
                type={f.type}
                value={form[f.key as keyof typeof form] as string}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={isAr ? f.ph_ar : f.ph_en}
                dir={f.dir}
                className="px-4 py-3 rounded-xl text-sm text-slate-900 bg-white/95 focus:outline-none focus:ring-2 focus:ring-white/50 placeholder:text-slate-400" />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{isAr ? 'الاستلام:' : 'Fulfilment:'}</span>
            {([
              { v: 'delivery', ar: 'توصيل', en: 'Delivery', Icon: Truck },
              { v: 'pickup', ar: 'من الموقع', en: 'Pickup', Icon: MapPin },
            ] as const).map(o => (
              <button key={o.v} onClick={() => setForm({ ...form, fulfilment: o.v })}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  form.fulfilment === o.v ? 'bg-white text-slate-900' : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}>
                <o.Icon className="w-3.5 h-3.5" />{isAr ? o.ar : o.en}
              </button>
            ))}
          </div>

          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
            placeholder={isAr ? 'ملاحظات (اختياري) — ماركة، طباعة، موعد التسليم...' : 'Notes (optional) — brand, printing, deadline...'}
            dir={isAr ? 'rtl' : 'ltr'} rows={2}
            className="w-full px-4 py-3 rounded-xl text-sm text-slate-900 bg-white/95 focus:outline-none resize-none placeholder:text-slate-400" />

          {err && <p className="text-xs text-amber-300 font-semibold">{err}</p>}

          <button onClick={submit} disabled={sending}
            className="flex items-center gap-2 bg-white text-slate-900 font-black px-7 py-3 rounded-2xl text-sm hover:bg-slate-100 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isAr ? 'إرسال طلب عرض السعر' : 'Send quote request'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Cartons Calculator ───────────────────────────────────────────────────────

type WeightUnit = 'kg' | 'ton'

interface CartonsCalcProps {
  isAr: boolean
  primaryPacks: PrimaryPack[]
  masterCartons: MasterCarton[]
  packagingOptions: PackagingOption[]
}

function CartonsCalculator({ isAr, primaryPacks, masterCartons, packagingOptions }: CartonsCalcProps) {
  const [productLabel, setProductLabel] = useState('')
  const [qtyMode, setQtyMode]         = useState<'weight' | 'units'>('weight')
  const [weight, setWeight]           = useState('10')
  const [weightUnit, setWeightUnit]   = useState<WeightUnit>('ton')
  const [unitsInput, setUnitsInput]   = useState('5000')
  const [primary, setPrimary]         = useState<PrimaryPack | null>(null)
  const [carton, setCarton]           = useState<MasterCarton | null>(null)
  const [selOptions, setSelOptions]   = useState<PackagingOption[]>([])

  useEffect(() => {
    if (primary === null && primaryPacks.length > 0)
      setPrimary(primaryPacks.find(p => p.size_label === '1kg') ?? primaryPacks[0])
    if (carton === null && masterCartons.length > 0)
      setCarton(masterCartons[1] ?? masterCartons[0])
  }, [primaryPacks, masterCartons, primary, carton])

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

  const stepNum = (base: number) => qtyMode === 'weight' ? base : base - 1

  return (
    <div className="space-y-10">

      {/* STEP 1 — product label */}
      <section>
        <Step num={1}
          title={isAr ? 'ما الذي تريد تعبئته؟' : 'What are you packing?'}
          sub={isAr ? 'اختياري — يساعد في توجيه عرض السعر للجهة الصحيحة' : 'Optional — helps route your quote correctly'} />
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
          <input value={productLabel} onChange={e => setProductLabel(e.target.value)}
            placeholder={isAr
              ? 'مثال: أرز Sunwhite 1كجم · سكر أبيض بالطن · اتركه فارغاً للكراتين فقط'
              : 'e.g. Sunwhite Rice 1kg · bulk white sugar · leave empty for cartons only'}
            dir={isAr ? 'rtl' : 'ltr'}
            className="w-full text-sm text-slate-800 focus:outline-none placeholder:text-slate-400" />
        </div>
      </section>

      {/* STEP 2 — quantity */}
      <section>
        <Step num={2}
          title={isAr ? 'الكمية' : 'Quantity'}
          sub={isAr ? 'أدخل بالوزن الإجمالي أو عدد الوحدات' : 'Enter total weight or number of units'} />
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          {/* Mode toggle */}
          <div className="inline-flex bg-slate-100 rounded-xl p-1 mb-5 gap-1">
            {([
              { v: 'weight', ar: 'بالوزن', en: 'By weight' },
              { v: 'units',  ar: 'بالعدد', en: 'By units'  },
            ] as const).map(m => (
              <button key={m.v} onClick={() => setQtyMode(m.v)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                  qtyMode === m.v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>
                {isAr ? m.ar : m.en}
              </button>
            ))}
          </div>

          {qtyMode === 'weight' ? (
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-400 mb-2">{isAr ? 'إجمالي الوزن' : 'Total weight'}</label>
                <input type="number" min="0" value={weight} dir="ltr" onChange={e => setWeight(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-2xl font-black text-slate-900 focus:outline-none focus:border-slate-900 transition-colors" />
              </div>
              <div className="flex gap-1 pb-1">
                {(['ton','kg'] as WeightUnit[]).map(u => (
                  <button key={u} onClick={() => setWeightUnit(u)}
                    className={`px-3 py-2 rounded-xl text-sm font-bold border-2 transition-all duration-200 ${
                      weightUnit === u ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-500 hover:border-slate-400'
                    }`}>
                    {u === 'ton' ? (isAr ? 'طن' : 'ton') : 'kg'}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">{isAr ? 'عدد الوحدات' : 'Number of units'}</label>
              <input type="number" min="0" value={unitsInput} dir="ltr" onChange={e => setUnitsInput(e.target.value)}
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-2xl font-black text-slate-900 focus:outline-none focus:border-slate-900 transition-colors" />
            </div>
          )}
        </div>
      </section>

      {/* STEP 3 — primary pack (weight mode only) */}
      {qtyMode === 'weight' && (
        <section>
          <Step num={3}
            title={isAr ? 'التغليف الأساسي (الوحدة)' : 'Primary packaging'}
            sub={isAr ? 'الوعاء الذي يحتوي المنتج مباشرةً قبل الكرتون' : 'The container the product goes into before the carton'} />
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {/* None option */}
            <button onClick={() => setPrimary(null)}
              className={`group flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                !primary ? 'border-slate-900 bg-slate-900 text-white shadow-md' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg transition-colors ${!primary ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-slate-50'}`}>
                <Package className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-center leading-tight">{isAr ? 'وزن سائب' : 'Bulk / loose'}</span>
            </button>

            {primaryPacks.map(pp => {
              const Mockup = PACK_MOCKUPS[pp.type] ?? BagMockup
              const sel = primary?.id === pp.id
              return (
                <button key={pp.id} onClick={() => setPrimary(pp)}
                  className={`group flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                    sel ? 'border-slate-900 bg-slate-900 text-white shadow-md' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}>
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${sel ? 'bg-white/10' : 'bg-slate-50 group-hover:bg-white'}`}>
                    <Mockup size={48} />
                  </div>
                  <div className="text-center">
                    <div className={`text-sm font-black leading-none ${sel ? 'text-white' : 'text-slate-900'}`}>{pp.size_label}</div>
                    <div className={`text-[10px] mt-0.5 ${sel ? 'text-white/70' : 'text-slate-400'}`}>{isAr ? pp.type_ar : pp.type_en}</div>
                    <div className={`text-[10px] font-bold mt-1 ${sel ? 'text-white/90' : 'text-slate-500'}`}>{Number(pp.cost_aed).toFixed(2)} AED</div>
                  </div>
                </button>
              )
            })}
          </div>

          {primary && (
            <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
              {isAr ? `المادة: ${primary.material_ar}` : `Material: ${primary.material_en}`}
              {primary.suitable_for_ar && <> · <span>{isAr ? primary.suitable_for_ar : primary.suitable_for_en}</span></>}
            </div>
          )}
        </section>
      )}

      {/* STEP 4/3 — master carton */}
      <section>
        <Step num={stepNum(4)}
          title={isAr ? 'كرتون الشحن والتخزين' : 'Master carton'}
          sub={isAr ? 'الكرتون الخارجي الذي يجمع الوحدات للشحن والتخزين' : 'The outer carton grouping units for shipping & storage'} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {masterCartons.map((mc, idx) => {
            const sel = carton?.id === mc.id
            const variant = CARTON_VARIANTS[idx] ?? 'sm'
            const volL = +(mc.l_cm * mc.w_cm * mc.h_cm / 1000).toFixed(1)
            return (
              <button key={mc.id} onClick={() => setCarton(mc)}
                className={`group text-start p-5 rounded-2xl border-2 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
                  sel ? 'border-slate-900 bg-slate-900 text-white shadow-lg' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}>
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-4 transition-colors ${sel ? 'bg-white/10' : 'bg-slate-50 group-hover:bg-slate-100'}`}>
                  <CartonMockup size={56} variant={variant} />
                </div>
                <div className={`font-black text-sm mb-0.5 ${sel ? 'text-white' : 'text-slate-900'}`}>{isAr ? mc.name_ar : mc.name_en}</div>
                <div className={`text-[11px] tabular-nums mb-3 ${sel ? 'text-white/70' : 'text-slate-400'}`}>{mc.l_cm}×{mc.w_cm}×{mc.h_cm} cm · {volL}L</div>
                <div className="space-y-1.5">
                  {[
                    { la: 'وزن أقصى', en: 'Max weight', v: `${mc.max_weight_kg} kg` },
                    { la: 'وحدة/كرتون', en: 'Units/carton', v: String(mc.default_units) },
                    { la: 'كرتون/باليت', en: 'Cartons/pallet', v: String(mc.cartons_per_pallet) },
                  ].map(r => (
                    <div key={r.la} className={`flex justify-between text-[11px] ${sel ? 'text-white/80' : 'text-slate-500'}`}>
                      <span>{isAr ? r.la : r.en}</span>
                      <span className="font-semibold">{r.v}</span>
                    </div>
                  ))}
                </div>
                <div className={`mt-3 pt-3 border-t text-[11px] font-black ${sel ? 'border-white/20 text-white' : 'border-slate-100 text-slate-700'}`}>
                  {Number(mc.cost_aed).toFixed(1)} AED/{isAr ? 'كرتون' : 'carton'}
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* STEP 5/4 — options */}
      {packagingOptions.length > 0 && (
        <section>
          <Step num={stepNum(5)}
            title={isAr ? 'المواصفات والخيارات' : 'Specs & options'}
            sub={isAr ? 'تؤثر على التكلفة النهائية' : 'Affect the final cost'} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {packagingOptions.map(o => {
              const sel = selOptions.some(x => x.id === o.id)
              return (
                <button key={o.id} onClick={() => toggleOption(o)}
                  className={`group text-start p-4 rounded-2xl border-2 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                    sel ? 'border-slate-900 bg-slate-900 text-white shadow-md' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className={`text-sm font-bold leading-tight ${sel ? 'text-white' : 'text-slate-900'}`}>{isAr ? o.label_ar : o.label_en}</div>
                      <div className={`text-[11px] mt-1 space-y-0.5 ${sel ? 'text-white/70' : 'text-slate-400'}`}>
                        <div>×{Number(o.carton_mult).toFixed(2)} {isAr ? 'تكلفة الكرتون' : 'carton cost'}</div>
                        {Number(o.per_unit_add) > 0 && <div>+{o.per_unit_add} AED/{isAr ? 'وحدة' : 'unit'}</div>}
                        {Number(o.setup_aed) > 0 && <div>{o.setup_aed} AED {isAr ? 'إعداد' : 'setup'}</div>}
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                      sel ? 'border-white bg-white' : 'border-slate-300 group-hover:border-slate-500'
                    }`}>
                      {sel && <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* RESULTS */}
      {result ? (
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-black">✓</div>
            <h2 className="font-black text-slate-900">{isAr ? 'نتائج التغليف والمخزن' : 'Packaging & Storage Results'}</h2>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { Icon: Package,   v: result.primaryUnits > 0 ? fmt(result.primaryUnits) : '—', la: 'وحدة معبأة',     en: 'Primary units',  bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-100' },
              { Icon: Boxes,     v: fmt(result.totalCartons),                                  la: 'إجمالي الكراتين', en: 'Total cartons',  bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100' },
              { Icon: Layers,    v: fmt(result.pallets),                                       la: 'باليت',           en: 'Pallets',        bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100' },
              { Icon: Warehouse, v: `${result.floorAreaM2} m²`,                               la: 'مساحة الأرضية',  en: 'Floor area',     bg: 'bg-slate-50',  text: 'text-slate-700',  border: 'border-slate-100' },
            ].map((s, i) => (
              <div key={i} className={`border rounded-2xl p-4 ${s.bg} ${s.border}`}>
                <s.Icon className={`w-4 h-4 mb-2 opacity-50 ${s.text}`} />
                <div className={`text-2xl font-black leading-none ${s.text}`}>{s.v}</div>
                <div className={`text-[11px] mt-1 opacity-70 ${s.text}`}>{isAr ? s.la : s.en}</div>
              </div>
            ))}
          </div>

          {/* Cost breakdown */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-4">
              {[
                { la: 'وحدة لكل كرتون',       en: 'Units per carton',        v: result.primaryUnits > 0 ? fmt(result.unitsPerCarton) : (isAr ? 'وزن سائب' : 'loose') },
                { la: 'حجم التخزين',           en: 'Storage volume',          v: `${result.storageVolumeM3} m³` },
                { la: 'تكلفة الكراتين',        en: 'Cartons cost',            v: `${fmt(result.cartonCostAed)} AED` },
                { la: 'تكلفة التغليف الأساسي', en: 'Primary packaging cost',  v: `${fmt(result.primaryCostAed)} AED` },
                { la: 'رسوم إعداد (طباعة)',    en: 'Setup fees (print)',       v: `${fmt(result.optionsSetupAed)} AED` },
                { la: 'إجمالي تكلفة التغليف', en: 'Total packaging cost',    v: `${fmt(result.totalPackagingAed)} AED`, bold: true },
              ].map((row, i) => (
                <div key={i} className={`bg-slate-50 rounded-xl p-3 ${row.bold ? 'col-span-2 md:col-span-1' : ''}`}>
                  <div className="text-slate-400 text-[11px] mb-1">{isAr ? row.la : row.en}</div>
                  <div className={row.bold ? 'font-black text-emerald-600 text-base' : 'font-semibold text-slate-800'}>{row.v}</div>
                </div>
              ))}
            </div>
            {result.costPerPrimaryUnit > 0 && (
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                <span className="w-1 h-4 bg-slate-200 rounded-full" />
                {isAr ? 'تكلفة التغليف لكل وحدة: ' : 'Packaging cost per unit: '}
                <strong className="text-slate-700">{result.costPerPrimaryUnit} AED</strong>
              </div>
            )}
            <p className="text-[11px] text-slate-400">
              {isAr
                ? '* الأسعار تقريبية بمتوسط السوق الإماراتي. اطلب عرض سعر للحصول على أرقام نهائية.'
                : '* Prices are approximate UAE market averages. Request a quote for final numbers.'}
            </p>
          </div>

          <div className="mt-6">
            <RfqSection isAr={isAr} payload={{
              product_label: productLabel || (isAr ? 'كراتين / تغليف فقط' : 'Cartons / packaging only'),
              calc: { mode: 'cartons', qtyMode, weight, weightUnit, unitsInput, primary: primary?.id ?? null, carton: carton?.id ?? null, options: selOptions.map(o => o.id), result },
            }} />
          </div>
        </section>
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
  const [material, setMaterial]     = useState<RawMaterial | null>(null)
  const [bulkQty, setBulkQty]       = useState('500')
  const [bulkPrice, setBulkPrice]   = useState('')
  const [sizes, setSizes]           = useState<number[]>([])
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
    <div className="space-y-10">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-sm text-amber-800">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
        <span>{isAr
          ? 'هذا الوضع لنشاط إعادة التعبئة — استيراد مواد خام بالجملة وإعادة تعبئتها تحت علامتك الخاصة في الإمارات.'
          : 'This mode is for repackaging — importing bulk raw materials and repackaging under your own UAE brand.'}</span>
      </div>

      {/* STEP 1 — material */}
      <section>
        <Step num={1} title={isAr ? 'اختر المادة الخام' : 'Select Raw Material'} />
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => setCatFilter('')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 ${!catFilter ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
            {isAr ? 'الكل' : 'All'}
          </button>
          {cats.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 ${catFilter === c ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visibleMaterials.map(m => {
            const sel = material?.id === m.id
            return (
              <button key={m.id} onClick={() => pick(m)}
                className={`group text-start p-4 rounded-2xl border-2 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                  sel ? 'border-slate-900 bg-slate-900 text-white shadow-md' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}>
                <div className="flex justify-between mb-2">
                  <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${sel ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'}`}>{m.category_ar}</span>
                  {sel && <div className="w-4 h-4 bg-white rounded-full" />}
                </div>
                <div className={`font-black text-sm leading-tight mb-1 ${sel ? 'text-white' : 'text-slate-900'}`}>{isAr ? m.name_ar : m.name_en}</div>
                <div className={`text-xs mb-2 ${sel ? 'text-white/60' : 'text-slate-400'}`}>{m.origin_ar} · HS {m.hs_code}</div>
                <div className={`flex justify-between text-xs ${sel ? 'text-white/80' : ''}`}>
                  <span className={`font-semibold ${sel ? 'text-white' : 'text-emerald-600'}`}>{m.typical_price_min}–{m.typical_price_max} AED/{m.bulk_unit}</span>
                  <span className={sel ? 'text-white/60' : 'text-slate-400'}>{isAr ? `استرداد ${m.yield_pct}%` : `Yield ${m.yield_pct}%`}</span>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* STEP 2 — qty + price */}
      {material && (
        <section>
          <Step num={2} title={isAr ? 'الكمية وسعر الشراء' : 'Quantity & Purchase Price'} />
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">
                  {isAr ? `الكمية المشتراة (${material.bulk_unit})` : `Quantity Purchased (${material.bulk_unit})`}
                </label>
                <input type="number" min="1" value={bulkQty} dir="ltr"
                  onChange={e => { setBulkQty(e.target.value); setCalculated(false) }}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-2xl font-black text-slate-900 focus:outline-none focus:border-slate-900 transition-colors" />
                <p className="text-xs text-slate-400 mt-1.5">
                  {isAr ? 'صافي الاسترداد: ' : 'Net yield: '}
                  <strong className="text-slate-700">{bulkQty ? Math.floor(+bulkQty * material.yield_pct / 100) : '—'} {material.bulk_unit}</strong>
                  {isAr ? ` (بعد خصم فقد التنظيف ${100 - material.yield_pct}%)` : ` (after ${100 - material.yield_pct}% cleaning loss)`}
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">
                  {isAr ? `سعر الشراء الفعلي (AED/${material.bulk_unit})` : `Actual Purchase Price (AED/${material.bulk_unit})`}
                </label>
                <input type="number" min="0.1" step="0.1" value={bulkPrice} dir="ltr"
                  onChange={e => { setBulkPrice(e.target.value); setCalculated(false) }}
                  placeholder={`${material.typical_price_min}–${material.typical_price_max}`}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-2xl font-black text-slate-900 focus:outline-none focus:border-slate-900 transition-colors" />
                <p className="text-xs text-slate-400 mt-1.5">
                  {isAr ? `نطاق السوق: ${material.typical_price_min}–${material.typical_price_max} AED` : `Market range: ${material.typical_price_min}–${material.typical_price_max} AED`}
                </p>
              </div>
            </div>
            <div className="mt-4 bg-slate-50 rounded-xl p-3 text-xs text-slate-500">
              {isAr
                ? `الحاسبة تضيف تلقائياً ${Math.round(OVERHEAD_RATE * 100)}% تكاليف تشغيل (خط التعبئة، عمالة، كهرباء). الهامش محسوب على سعر البيع بالجملة.`
                : `Calculator auto-adds ${Math.round(OVERHEAD_RATE * 100)}% overhead (packaging line, labor, utilities). Margin calculated on wholesale price.`}
            </div>
          </div>
        </section>
      )}

      {/* STEP 3 — target sizes */}
      {material && bulkQty && bulkPrice && (
        <section>
          <Step num={3} title={isAr ? 'أحجام التعبئة المستهدفة' : 'Target Packaging Sizes'}
            sub={isAr ? 'اختر حجماً أو أكثر — تحليل مالي مستقل لكل حجم' : 'Select one or more — independent financial analysis per size'} />
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-5">
              {material.suitable_sizes.map(sz => {
                const isSel = sizes.includes(sz)
                const net   = +bulkQty * material.yield_pct / 100
                const units = Math.floor(net / sz)
                const pkgCost = (PKG_COSTS[material.pkg_format] ?? {})[sz] ?? 0.5
                const unit = material.bulk_unit === 'L'
                  ? (sz < 1 ? `${sz * 1000}ml` : `${sz}L`)
                  : (sz < 1 ? `${sz * 1000}g` : `${sz}kg`)
                const Mockup = material.pkg_format === 'bottle' ? BottleMockup : material.pkg_format === 'jar' ? JarMockup : BagMockup
                return (
                  <button key={sz} onClick={() => toggleSize(sz)}
                    className={`group relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                      isSel ? 'border-slate-900 bg-slate-900 text-white shadow-md' : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isSel ? 'bg-white/10' : 'bg-slate-50'}`}>
                      <Mockup size={44} />
                    </div>
                    <div className="text-center">
                      <div className={`text-sm font-black ${isSel ? 'text-white' : 'text-slate-900'}`}>{unit}</div>
                      <div className={`text-[10px] ${isSel ? 'text-white/70' : 'text-slate-400'}`}>{units.toLocaleString()} {isAr ? 'وحدة' : 'units'}</div>
                      <div className={`text-[10px] font-semibold ${isSel ? 'text-white/80' : 'text-slate-500'}`}>{pkgCost.toFixed(2)} AED</div>
                    </div>
                    {isSel && <div className="absolute -top-1.5 -end-1.5 w-5 h-5 bg-white border-2 border-slate-900 rounded-full flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-slate-900" /></div>}
                  </button>
                )
              })}
            </div>
            {sizes.length > 0 && (
              <button onClick={() => setCalculated(true)}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-black px-6 py-3 rounded-2xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-sm text-sm">
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
            <div className="flex items-center gap-3 mb-5">
              <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-black">✓</div>
              <h2 className="font-black text-slate-900">{isAr ? 'النتائج والتحليل المالي' : 'Results & Financial Analysis'}</h2>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { la: 'إجمالي الوحدات', en: 'Total Units', val: totUnits.toLocaleString(), bg: 'bg-blue-50 border-blue-100', t: 'text-blue-700' },
                { la: 'تكلفة الخام', en: 'Raw Cost', val: `${(+bulkQty * +bulkPrice).toFixed(0)} AED`, bg: 'bg-slate-50 border-slate-200', t: 'text-slate-700' },
                { la: 'إجمالي الربح المتوقع', en: 'Expected Profit', val: `${totProfit.toLocaleString()} AED`, bg: 'bg-emerald-50 border-emerald-100', t: 'text-emerald-700' },
              ].map((s, i) => (
                <div key={i} className={`border rounded-2xl p-4 text-center ${s.bg}`}>
                  <div className={`text-lg font-black ${s.t}`}>{s.val}</div>
                  <div className={`text-xs mt-0.5 opacity-70 ${s.t}`}>{isAr ? s.la : s.en}</div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {results.map(r => {
                const unit = material!.bulk_unit === 'L'
                  ? (r.size < 1 ? `${r.size * 1000}ml` : `${r.size}L`)
                  : (r.size < 1 ? `${r.size * 1000}g` : `${r.size}kg`)
                return (
                  <div key={r.size} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-orange-500" />
                        <span className="font-black text-slate-900">{unit}</span>
                        <span className="text-xs text-slate-400">× {r.units.toLocaleString()} {isAr ? 'وحدة' : 'units'}</span>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${r.margin_pct >= 25 ? 'bg-emerald-100 text-emerald-700' : r.margin_pct >= 15 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {isAr ? `هامش ${r.margin_pct}%` : `${r.margin_pct}% margin`}
                      </span>
                    </div>
                    <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      {[
                        { la: 'تكلفة الخام/وحدة',    en: 'Raw cost/unit',     v: `${r.raw_cost.toFixed(2)} AED` },
                        { la: 'تكلفة الغلاف/وحدة',   en: 'Pkg cost/unit',     v: `${r.pkg_cost.toFixed(2)} AED` },
                        { la: 'إجمالي التكلفة/وحدة', en: 'Total COGS/unit',   v: `${r.total_cogs.toFixed(2)} AED`, bold: true },
                        { la: 'سعر الجملة المقترح',  en: 'Wholesale price',   v: `${r.wholesale_price.toFixed(2)} AED`, orange: true },
                        { la: 'سعر التجزئة المقترح', en: 'Retail price',      v: `${r.retail_price.toFixed(2)} AED`, purple: true },
                        { la: 'ربح/وحدة',            en: 'Profit/unit',       v: `${r.profit_per_unit.toFixed(2)} AED`, green: true },
                        { la: 'إجمالي ربح الدفعة',   en: 'Batch profit',      v: `${r.total_profit.toLocaleString()} AED`, greenBold: true },
                      ].map((row, i) => (
                        <div key={i} className="bg-slate-50 rounded-xl p-3">
                          <div className="text-slate-400 mb-1">{isAr ? row.la : row.en}</div>
                          <div className={`font-semibold ${row.greenBold ? 'font-black text-emerald-700' : row.orange ? 'text-orange-600 font-black' : row.purple ? 'text-purple-600 font-bold' : row.green ? 'text-emerald-600 font-bold' : row.bold ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                            {row.v}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-5 pb-4 flex items-center gap-2 text-xs">
                      <span className="text-slate-400 flex-shrink-0">{isAr ? 'هيكل التكلفة' : 'Cost structure'}</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden flex">
                        <div className="bg-blue-400 h-full transition-all" style={{ width: `${(r.raw_cost / r.wholesale_price) * 100}%` }} />
                        <div className="bg-orange-300 h-full transition-all" style={{ width: `${(r.pkg_cost / r.wholesale_price) * 100}%` }} />
                        <div className="bg-slate-300 h-full transition-all" style={{ width: `${(r.overhead / r.wholesale_price) * 100}%` }} />
                        <div className="bg-emerald-400 h-full transition-all" style={{ width: `${r.margin_pct}%` }} />
                      </div>
                      {[
                        { c: 'bg-blue-400', la: 'خام', en: 'Raw' },
                        { c: 'bg-orange-300', la: 'غلاف', en: 'Pkg' },
                        { c: 'bg-slate-300', la: 'تشغيل', en: 'OH' },
                        { c: 'bg-emerald-400', la: 'ربح', en: 'Profit' },
                      ].map(l => (
                        <span key={l.c} className="flex items-center gap-1 text-[10px] text-slate-400">
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
              <h2 className="font-black text-slate-900">{isAr ? 'متطلبات الليبل — UAE.S 9:2019' : 'Label Requirements — UAE.S 9:2019'}</h2>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                {isAr
                  ? 'لبيع منتجك المعبَّأ في الإمارات تحت علامتك الخاصة، يجب استيفاء هذه المتطلبات وفق UAE.S 9:2019.'
                  : 'To sell your repackaged product in the UAE under your own brand, meet these requirements per UAE.S 9:2019.'}
              </p>
              <div className="space-y-2">
                {LABEL_REQUIREMENTS.map(req => (
                  <div key={req.id} className="flex items-start gap-3 py-1.5">
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
              <div className="mt-5 p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 flex items-start gap-2">
                <TrendingUp className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  {isAr
                    ? <><strong>تسجيل علامتك في ESMA:</strong> ضروري قبل وضع رقم التسجيل على الليبل. التكلفة التقديرية 3,000–8,000 AED للمنتج الأول، المدة 2–4 أشهر. تحتاج كذلك اشتراكاً في GS1 الإمارات للحصول على باركود EAN-13 (~500 AED سنوياً).</>
                    : <><strong>ESMA brand registration:</strong> Required before printing the registration number. Estimated 3,000–8,000 AED for the first product, 2–4 months. GS1 UAE subscription for EAN-13 barcode (~500 AED/year).</>}
                </div>
              </div>
              {material && (
                <div className="mt-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
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
  const isAr   = locale === 'ar'
  const Arrow  = isAr ? ChevronLeft : ChevronRight

  const [mode, setMode]                   = useState<'cartons' | 'repack'>('cartons')
  const [primaryPacks, setPrimaryPacks]   = useState<PrimaryPack[]>([])
  const [masterCartons, setMasterCartons] = useState<MasterCarton[]>([])
  const [packagingOptions, setPackagingOptions] = useState<PackagingOption[]>([])

  useEffect(() => {
    fetch('/api/packaging/specs')
      .then(r => r.json())
      .then(d => {
        if (d.primary_packs)  setPrimaryPacks(d.primary_packs.filter((p: PrimaryPack & { is_active?: boolean }) => p.is_active !== false))
        if (d.master_cartons) setMasterCartons(d.master_cartons.filter((c: MasterCarton & { is_active?: boolean }) => c.is_active !== false))
        if (d.options)        setPackagingOptions(d.options.filter((o: PackagingOption & { is_active?: boolean }) => o.is_active !== false))
      })
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-orange-500 tracking-wider mb-3 uppercase">
            {isAr ? 'أدوات Crate' : 'Crate Tools'}
          </p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            {isAr ? 'حاسبة التعبئة والتغليف' : 'Packaging Calculator'}
          </h1>
          <p className="text-slate-400 text-sm max-w-lg leading-relaxed mb-6">
            {isAr
              ? 'احسب الكراتين والكميات والتكاليف ومساحة المخزن — ثم اطلب عرض سعر شامل من Crate'
              : 'Calculate cartons, quantities, cost and warehouse space — then request a complete quote from Crate'}
          </p>

          {/* Mode tabs */}
          <div className="inline-flex items-center bg-slate-100 rounded-2xl p-1.5 gap-1">
            {([
              { v: 'cartons', ar: 'حساب التغليف والكراتين', en: 'Packaging & Cartons' },
              { v: 'repack',  ar: 'إعادة تعبئة مادة خام',   en: 'Repackaging'         },
            ] as const).map(t => (
              <button key={t.v} onClick={() => setMode(t.v)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  mode === t.v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>
                {isAr ? t.ar : t.en}
                {mode === t.v && <Arrow className="w-3.5 h-3.5 opacity-50" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {mode === 'cartons'
          ? <CartonsCalculator isAr={isAr} primaryPacks={primaryPacks} masterCartons={masterCartons} packagingOptions={packagingOptions} />
          : <RepackCalculator isAr={isAr} />}
      </div>
    </div>
  )
}
