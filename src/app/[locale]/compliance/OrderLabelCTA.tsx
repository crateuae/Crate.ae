'use client'

// ─────────────────────────────────────────────────────────────────────────────
// "Order a compliant label" — the bridge from a compliance verdict to a real
// printed order, fulfilled by our partner Art for Printing (dropship, commission
// model). Gets a LIVE price from AFP's engine, then injects the order. AFP
// collects payment from the buyer and confirms specs before production.
// ─────────────────────────────────────────────────────────────────────────────
import { useRef, useState } from 'react'
import { Tag, Loader2, CheckCircle2, X, Upload } from 'lucide-react'

type Props = { isAr: boolean; productName?: string; verdict?: string }

function newRequestId(): string {
  try { return crypto.randomUUID() } catch { return `req-${Date.now()}-${Math.floor(Math.random() * 1e6)}` }
}

export default function OrderLabelCTA({ isAr, productName, verdict }: Props) {
  const [open, setOpen] = useState(false)
  const reqId = useRef<string>('')

  const t = isAr ? {
    cta: 'اطلب ملصقاً مطابقاً',
    ctaHint: 'اطبع ملصقاً جاهزاً للتسجيل عبر شريكنا Art for Printing',
    title: 'اطلب ملصقاً مطابقاً',
    sub: 'ننفّذ ملصقك عبر شريك التصنيع — طباعة رقمية قصيرة المدى بلا حد أدنى ضخم.',
    qty: 'الكمية (أفرخ)', qtyHint: 'يؤكّد الشريك المقاس النهائي وعدد الملصقات لكل فرخ عند التواصل.',
    details: 'تفاصيل الملصق', detailsPh: 'المقاس، الخامة (لامع/مطفي)، عدد الملصقات، أي ملاحظات…',
    artwork: 'ملف التصميم (اختياري)', artworkHint: 'PDF أو صورة جاهزة للطباعة — أو اتركه ويساعدك الشريق في التصميم.',
    getPrice: 'احسب السعر', unit: 'سعر الفرخ', total: 'الإجمالي التقديري',
    name: 'الاسم *', phone: 'الهاتف *', email: 'البريد الإلكتروني', address: 'عنوان التسليم',
    company: 'الشركة',
    submit: 'أرسل الطلب', sending: 'جارٍ الإرسال…',
    okTitle: 'تم استلام طلبك ✓', okBody: 'سيتواصل معك Art for Printing لتأكيد التفاصيل وتحصيل الدفع قبل الإنتاج.',
    ref: 'رقم الطلب', close: 'إغلاق',
    errBuyer: 'الاسم والهاتف مطلوبان', errPrice: 'تعذّر حساب السعر الآن', errSend: 'تعذّر إرسال الطلب — حاول لاحقاً',
    unavailable: 'خدمة الطلب قيد التفعيل — سنفعّلها قريباً.',
    aed: 'د.إ',
  } : {
    cta: 'Order a compliant label',
    ctaHint: 'Print a registration-ready label via our partner Art for Printing',
    title: 'Order a compliant label',
    sub: 'Fulfilled by our manufacturing partner — short-run digital printing, no huge minimum.',
    qty: 'Quantity (sheets)', qtyHint: 'The partner confirms final size and labels-per-sheet when they contact you.',
    details: 'Label details', detailsPh: 'Size, material (gloss/matt), label count, any notes…',
    artwork: 'Artwork file (optional)', artworkHint: 'Print-ready PDF or image — or leave it and the partner helps with design.',
    getPrice: 'Get price', unit: 'Per sheet', total: 'Estimated total',
    name: 'Name *', phone: 'Phone *', email: 'Email', address: 'Delivery address',
    company: 'Company',
    submit: 'Send order', sending: 'Sending…',
    okTitle: 'Order received', okBody: 'Art for Printing will contact you to confirm details and collect payment before production.',
    ref: 'Order ref', close: 'Close',
    errBuyer: 'Name and phone are required', errPrice: 'Could not fetch a price right now', errSend: 'Could not send the order — try again later',
    unavailable: 'Ordering is being activated — available soon.',
    aed: 'AED',
  }

  return (
    <>
      <button
        onClick={() => { reqId.current = newRequestId(); setOpen(true) }}
        className="w-full rounded-2xl border border-orange-200 bg-gradient-to-b from-orange-50 to-white p-4 text-start hover:border-orange-300 hover:shadow-sm transition-all group"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-sm shadow-orange-500/30 group-hover:scale-105 transition-transform">
            <Tag className="w-5 h-5" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-semibold text-orange-600">{t.cta}</span>
            <span className="block text-xs text-stone-500 mt-0.5">{t.ctaHint}</span>
          </span>
        </div>
      </button>

      {open && (
        <OrderModal isAr={isAr} t={t} productName={productName} verdict={verdict} reqId={reqId.current} onClose={() => setOpen(false)} />
      )}
    </>
  )
}

function OrderModal({ isAr, t, productName, verdict, reqId, onClose }: {
  isAr: boolean; t: Record<string, string>; productName?: string; verdict?: string; reqId: string; onClose: () => void
}) {
  const [qty, setQty] = useState(10)
  const [details, setDetails] = useState('')
  const [artwork, setArtwork] = useState<{ name: string; dataUrl: string } | null>(null)
  const [quote, setQuote] = useState<{ unit: number; total: number } | null>(null)
  const [pricing, setPricing] = useState(false)
  const [buyer, setBuyer] = useState({ name: '', phone: '', email: '', address: '', company: '' })
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState<string | null>(null)

  const onFile = (f: File | undefined) => {
    if (!f) { setArtwork(null); return }
    if (f.size > 15 * 1024 * 1024) { setErr(isAr ? 'الملف كبير جداً (حد 15MB)' : 'File too large (15MB max)'); return }
    const reader = new FileReader()
    reader.onload = () => setArtwork({ name: f.name, dataUrl: String(reader.result) })
    reader.readAsDataURL(f)
  }

  const getPrice = async () => {
    setErr(''); setPricing(true); setQuote(null)
    try {
      const res = await fetch('/api/partner/quote', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ quantity: qty }),
      })
      const d = await res.json()
      if (res.status === 503) { setErr(t.unavailable) }
      else if (!d.ok) { setErr(t.errPrice) }
      else setQuote({ unit: d.unit_price_aed, total: d.line_total_aed })
    } catch { setErr(t.errPrice) } finally { setPricing(false) }
  }

  const submit = async () => {
    if (!buyer.name.trim() || !buyer.phone.trim()) { setErr(t.errBuyer); return }
    setErr(''); setSending(true)
    try {
      const res = await fetch('/api/partner/order', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          crate_request_id: reqId,
          quantity: qty,
          configNote: [productName ? `Product: ${productName}` : '', details].filter(Boolean).join(' — '),
          artwork: artwork ?? undefined,
          buyer,
          source_page: 'compliance',
          compliance_product: productName ?? null,
        }),
      })
      const d = await res.json()
      if (res.status === 503) { setErr(t.unavailable) }
      else if (!d.ok || !d.afp_ref) { setErr(t.errSend) }
      else setDone(d.afp_ref)
    } catch { setErr(t.errSend) } finally { setSending(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-900/40 backdrop-blur-sm p-0 sm:p-4" onClick={onClose} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white/90 backdrop-blur border-b border-stone-100 px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-stone-800">{t.title}</h3>
            <p className="text-xs text-stone-500 mt-0.5">{t.sub}</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1"><X className="w-5 h-5" /></button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-50 text-green-500 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-semibold text-stone-800">{t.okTitle}</h4>
            <p className="text-sm text-stone-500 mt-2 leading-relaxed max-w-xs mx-auto">{t.okBody}</p>
            <p className="mt-4 inline-block bg-orange-50 text-orange-600 text-sm font-semibold px-4 py-2 rounded-xl">{t.ref}: {done}</p>
            <div className="mt-6"><button onClick={onClose} className="text-sm text-stone-500 hover:text-stone-700">{t.close}</button></div>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Quantity + price */}
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">{t.qty}</label>
              <div className="flex gap-2">
                <input type="number" min={1} value={qty}
                  onChange={e => { setQty(Math.max(1, Math.floor(Number(e.target.value) || 1))); setQuote(null) }}
                  className="flex-1 rounded-xl border border-stone-200 px-3 py-2.5 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none" />
                <button onClick={getPrice} disabled={pricing}
                  className="rounded-xl bg-stone-800 text-white text-sm px-4 py-2.5 hover:bg-stone-700 disabled:opacity-60 whitespace-nowrap inline-flex items-center gap-1.5">
                  {pricing && <Loader2 className="w-4 h-4 animate-spin" />}{t.getPrice}
                </button>
              </div>
              <p className="text-[11px] text-stone-400 mt-1">{t.qtyHint}</p>
              {quote && (
                <div className="mt-2 flex items-center justify-between bg-orange-50 rounded-xl px-3 py-2 text-sm">
                  <span className="text-stone-500">{t.unit}: <span className="text-stone-700">{quote.unit} {t.aed}</span></span>
                  <span className="font-semibold text-orange-600">{t.total}: {quote.total} {t.aed}</span>
                </div>
              )}
            </div>

            {/* Details */}
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">{t.details}</label>
              <textarea value={details} onChange={e => setDetails(e.target.value)} rows={2} placeholder={t.detailsPh}
                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none resize-none" />
            </div>

            {/* Artwork */}
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">{t.artwork}</label>
              <label className="flex items-center gap-2 rounded-xl border border-dashed border-stone-300 px-3 py-2.5 text-sm text-stone-500 cursor-pointer hover:border-orange-300">
                <Upload className="w-4 h-4 text-stone-400" />
                <span className="truncate">{artwork ? artwork.name : (isAr ? 'اختر ملفاً…' : 'Choose a file…')}</span>
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => onFile(e.target.files?.[0])} />
              </label>
              <p className="text-[11px] text-stone-400 mt-1">{t.artworkHint}</p>
            </div>

            {/* Buyer */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <input placeholder={t.name} value={buyer.name} onChange={e => setBuyer({ ...buyer, name: e.target.value })}
                className="col-span-2 rounded-xl border border-stone-200 px-3 py-2.5 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none" />
              <input placeholder={t.phone} value={buyer.phone} onChange={e => setBuyer({ ...buyer, phone: e.target.value })} dir="ltr"
                className="rounded-xl border border-stone-200 px-3 py-2.5 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none" />
              <input placeholder={t.email} value={buyer.email} onChange={e => setBuyer({ ...buyer, email: e.target.value })} dir="ltr"
                className="rounded-xl border border-stone-200 px-3 py-2.5 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none" />
              <input placeholder={t.address} value={buyer.address} onChange={e => setBuyer({ ...buyer, address: e.target.value })}
                className="col-span-2 rounded-xl border border-stone-200 px-3 py-2.5 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none" />
            </div>

            {err && <p className="text-sm text-red-500">{err}</p>}

            <button onClick={submit} disabled={sending}
              className="w-full rounded-xl bg-orange-500 text-white text-sm font-semibold py-3 hover:bg-orange-600 disabled:opacity-60 inline-flex items-center justify-center gap-2 shadow-sm shadow-orange-500/30">
              {sending && <Loader2 className="w-4 h-4 animate-spin" />}{sending ? t.sending : t.submit}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
