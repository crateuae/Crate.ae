'use client'
/**
 * The label order configurator. A buyer thinks in PIECES of a SIZE; the factory (Art for
 * Printing) lays them out on its roll and prices the printed area, and Crate's margin is added
 * on the server (src/app/api/partner/quote). No price lives in this file. After the order the
 * buyer gets the factory's pay link straight away.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, CheckCircle2, Upload, CreditCard, MessageCircle, Info, Tag } from 'lucide-react'

type Bi = { en: string; ar: string }
type Quote = {
  line_total_aed: number; design_fee_aed: number
  subtotal_aed: number; vat_aed: number; total_aed: number
  sqm: { pieces: number; across: number; rows: number; run_m: number; roll_cm: number; printed_m2?: number; charged_m2: number; cut: string; finish: string }
}
type Done = { ref: string; total: number; payUrl: string | null }

const SIZES: Array<{ w: number; h: number; hint: Bi }> = [
  { w: 4, h: 6, hint: { en: 'small jars, spice packs', ar: 'برطمانات صغيرة، بهارات' } },
  { w: 5, h: 3.5, hint: { en: 'back labels, lids', ar: 'ملصق خلفي، أغطية' } },
  { w: 5, h: 5, hint: { en: 'jars, boxes', ar: 'برطمانات، علب' } },
  { w: 6, h: 9, hint: { en: 'bottles, pouches', ar: 'قوارير، أكياس' } },
  { w: 7, h: 10, hint: { en: 'full Arabic over-sticker', ar: 'ملصق عربي إضافي كامل' } },
  { w: 8, h: 12, hint: { en: 'large packs, tins', ar: 'عبوات كبيرة، علب معدنية' } },
  { w: 10, h: 15, hint: { en: 'cartons, buckets', ar: 'كراتين، سطول' } },
  { w: 29.7, h: 42, hint: { en: 'A3 carton marking', ar: 'وسم كرتون A3' } },
]
const PACKS = [250, 500, 1000, 2500]
const MAX_ART_BYTES = 3 * 1024 * 1024 // the order travels as JSON through a serverless function

const newRequestId = () => { try { return crypto.randomUUID() } catch { return `req-${Date.now()}-${Math.floor(Math.random() * 1e6)}` } }
const aed = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function LabelOrderClient({ locale, initial }: { locale: 'ar' | 'en'; initial: { product: string; w: number; h: number; qty: number } }) {
  const isAr = locale === 'ar'
  const t = (b: Bi) => (isAr ? b.ar : b.en)
  const L = (en: string, ar: string) => (isAr ? ar : en)

  const [w, setW] = useState(String(initial.w))
  const [h, setH] = useState(String(initial.h))
  const [qty, setQty] = useState(String(initial.qty))
  const [finish, setFinish] = useState<'matte' | 'glossy'>('matte')
  const [plotter, setPlotter] = useState(false)
  const [design, setDesign] = useState(false)
  const [product, setProduct] = useState(initial.product)
  const [details, setDetails] = useState('')
  const [artwork, setArtwork] = useState<{ name: string; dataUrl: string } | null>(null)
  const [buyer, setBuyer] = useState({ name: '', phone: '', email: '', company: '', address: '' })
  const [hp, setHp] = useState('')

  const [quote, setQuote] = useState<Quote | null>(null)
  const [quoting, setQuoting] = useState(false)
  const [quoteErr, setQuoteErr] = useState('')
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState<Done | null>(null)
  const reqId = useRef(newRequestId())
  const seq = useRef(0)

  const wMm = Math.round(Number(w) * 10 * 10) / 10, hMm = Math.round(Number(h) * 10 * 10) / 10
  const pieces = Math.floor(Number(qty))
  const valid = wMm >= 5 && hMm >= 5 && pieces >= 1
  const ask = useMemo(() => ({ w_mm: wMm, h_mm: hMm, pieces, finish, plotter }), [wMm, hMm, pieces, finish, plotter])

  // Live price, debounced. A stale answer (an earlier request landing late) is dropped.
  useEffect(() => {
    if (!valid) { setQuote(null); setQuoteErr(''); return }
    const mine = ++seq.current
    setQuoting(true); setQuoteErr('')
    const id = window.setTimeout(async () => {
      try {
        const res = await fetch('/api/partner/quote', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sqm: ask, design }) })
        const d = await res.json()
        if (mine !== seq.current) return
        if (d?.ok && d.sqm) { setQuote(d as Quote) }
        else {
          setQuote(null)
          setQuoteErr(d?.error === 'piece_too_large'
            ? (plotter
              ? L('This size is too wide to cut to shape on the roll. Choose rectangles, or send it as a quote request.', 'هذا المقاس أعرض من أن يُقص حسب الشكل على الرول. اختر «مستطيلات» أو أرسله كطلب عرض سعر.')
              : L('This size is wider than the roll we print on. Send it as a quote request and we price it individually.', 'هذا المقاس أعرض من الرول الذي نطبع عليه. أرسله كطلب عرض سعر ونسعّره منفرداً.'))
            : res.status === 503 ? L('Ordering is being activated — available soon.', 'خدمة الطلب قيد التفعيل — قريباً.')
            : L('Could not fetch a price right now. Try again in a moment.', 'تعذّر جلب السعر الآن. حاول بعد قليل.'))
        }
      } catch { if (mine === seq.current) { setQuote(null); setQuoteErr(L('Could not fetch a price right now. Try again in a moment.', 'تعذّر جلب السعر الآن. حاول بعد قليل.')) } }
      finally { if (mine === seq.current) setQuoting(false) }
    }, 350)
    return () => window.clearTimeout(id)
  }, [ask, design, valid]) // eslint-disable-line react-hooks/exhaustive-deps

  const onFile = (f?: File) => {
    setErr('')
    if (!f) { setArtwork(null); return }
    if (f.size > MAX_ART_BYTES) { setArtwork(null); setErr(L('That file is over 3 MB. Place the order without it and send the file on WhatsApp — quote your order number.', 'الملف أكبر من 3 ميغابايت. أتمّ الطلب بدونه وأرسل الملف واتساب مع رقم الطلب.')); return }
    const reader = new FileReader()
    reader.onload = () => setArtwork({ name: f.name, dataUrl: String(reader.result) })
    reader.readAsDataURL(f)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (sending) return
    if (!quote) { setErr(L('Choose a size and quantity first.', 'اختر المقاس والكمية أولاً.')); return }
    if (!buyer.name.trim() || !buyer.phone.trim()) { setErr(L('Name and phone are required.', 'الاسم والهاتف مطلوبان.')); return }
    setErr(''); setSending(true)
    try {
      const res = await fetch('/api/partner/order', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          crate_request_id: reqId.current, sqm: ask, design, locale, website: hp,
          configNote: [product ? `Product: ${product}` : '', details].filter(Boolean).join(' — '),
          artwork: artwork ?? undefined, buyer,
          source_page: 'labels', compliance_product: product || null,
        }),
      })
      const d = await res.json()
      if (d?.ok && d.afp_ref) setDone({ ref: d.afp_ref, total: Number(d.total_aed) || quote.total_aed, payUrl: d.pay_url || null })
      else setErr(res.status === 503 ? L('Ordering is being activated — available soon.', 'خدمة الطلب قيد التفعيل — قريباً.') : L('The order could not be sent. Try again, or message us on WhatsApp.', 'تعذّر إرسال الطلب. حاول مرة أخرى أو راسلنا واتساب.'))
    } catch { setErr(L('The order could not be sent. Try again, or message us on WhatsApp.', 'تعذّر إرسال الطلب. حاول مرة أخرى أو راسلنا واتساب.')) }
    finally { setSending(false) }
  }

  const wa = (text: string) => `https://wa.me/971543000415?text=${encodeURIComponent(text)}`
  const inp = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100'
  const chip = (on: boolean) => `rounded-xl border px-3 py-2 text-sm text-start transition ${on ? 'border-orange-400 bg-orange-50 text-gray-900' : 'border-gray-200 bg-white text-gray-700 hover:border-orange-200'}`
  const label = 'block text-sm font-semibold text-gray-800 mb-2'

  // Below the minimum order the price does not move with the quantity, so say how many
  // labels the same money buys.
  const pieceM2 = (wMm / 1000) * (hMm / 1000)
  const printedM2 = pieceM2 * Math.max(pieces, 0)
  const sameMoneyUpTo = quote && pieceM2 > 0 && quote.sqm.charged_m2 > printedM2 + 1e-9 ? Math.floor(quote.sqm.charged_m2 / pieceM2 + 1e-9) : 0
  const goodsIncVat = quote ? quote.line_total_aed * (quote.subtotal_aed > 0 ? 1 + quote.vat_aed / quote.subtotal_aed : 1) : 0

  if (done) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-10 text-center" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="w-16 h-16 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-8 h-8" /></div>
        <h2 className="text-xl font-bold text-gray-900">{L('Order received', 'تم استلام طلبك')}</h2>
        <p className="text-sm text-gray-600 mt-2">{L('Order number', 'رقم الطلب')}: <span className="font-semibold text-gray-900" dir="ltr">{done.ref}</span> · {L('Total', 'الإجمالي')}: <span className="font-semibold text-gray-900" dir="ltr">AED {aed(done.total)}</span></p>
        <p className="text-sm text-gray-500 mt-3 max-w-md mx-auto leading-relaxed">
          {L('Production starts once payment is received and you approve the proof. Payment is taken by our print partner Art for Printing on a secure card page.', 'يبدأ الإنتاج بعد استلام الدفع وموافقتك على البروفة. يتم الدفع لدى شريك الطباعة Art for Printing عبر صفحة بطاقات آمنة.')}
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          {done.payUrl && (
            <a href={done.payUrl} className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-6 py-3 shadow-sm shadow-orange-500/30">
              <CreditCard className="w-4 h-4" />{L(`Pay AED ${aed(done.total)} now`, `ادفع ${aed(done.total)} درهم الآن`)}
            </a>
          )}
          <a href={wa(L(`Hello Crate, my label order is ${done.ref}.`, `مرحباً Crate، رقم طلب الملصقات ${done.ref}.`))} target="_blank" rel="noopener" className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 hover:border-orange-300 text-gray-800 text-sm font-semibold px-6 py-3">
            <MessageCircle className="w-4 h-4" />{L('Send artwork on WhatsApp', 'أرسل التصميم واتساب')}
          </a>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-5 items-start" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Configuration ── */}
      <div className="bg-white border border-gray-200 rounded-3xl p-5 md:p-7 flex flex-col gap-6 min-w-0">
        <div>
          <span className={label}>{L('1. Label size', '١. مقاس الملصق')}</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SIZES.map(s => {
              const on = Number(w) === s.w && Number(h) === s.h
              return (
                <button key={`${s.w}x${s.h}`} type="button" onClick={() => { setW(String(s.w)); setH(String(s.h)) }} className={chip(on)}>
                  <span className="block font-semibold tabular-nums" dir="ltr">{s.w} × {s.h} cm</span>
                  <span className="block text-[11px] text-gray-500 leading-snug">{t(s.hint)}</span>
                </button>
              )
            })}
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
            <span>{L('or custom', 'أو مقاس خاص')}:</span>
            <input inputMode="decimal" value={w} onChange={e => setW(e.target.value)} aria-label={L('Width in cm', 'العرض بالسنتيمتر')} className={`${inp} !w-20 text-center tabular-nums`} dir="ltr" />
            <span>×</span>
            <input inputMode="decimal" value={h} onChange={e => setH(e.target.value)} aria-label={L('Height in cm', 'الارتفاع بالسنتيمتر')} className={`${inp} !w-20 text-center tabular-nums`} dir="ltr" />
            <span>cm</span>
          </div>
        </div>

        <div>
          <span className={label}>{L('2. Quantity (labels)', '٢. الكمية (ملصق)')}</span>
          <div className="flex flex-wrap items-center gap-2">
            {PACKS.map(p => (
              <button key={p} type="button" onClick={() => setQty(String(p))} className={`${chip(pieces === p)} tabular-nums`}>{p.toLocaleString('en-US')}</button>
            ))}
            <input inputMode="numeric" value={qty} onChange={e => setQty(e.target.value.replace(/[^0-9]/g, ''))} aria-label={L('Custom quantity', 'كمية خاصة')} className={`${inp} !w-28 text-center tabular-nums`} dir="ltr" />
          </div>
          <p className="mt-2 text-[12px] text-gray-500">{L('Priced by printed area — the larger the run, the lower the price per label.', 'السعر بحسب المساحة المطبوعة — كلما زادت الكمية انخفض سعر الملصق.')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <span className={label}>{L('3. Finish', '٣. التشطيب')}</span>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setFinish('matte')} className={chip(finish === 'matte')}>{L('Matte', 'مطفي')}</button>
              <button type="button" onClick={() => setFinish('glossy')} className={chip(finish === 'glossy')}>{L('Glossy', 'لامع')}</button>
            </div>
            <p className="mt-2 text-[12px] text-gray-500 leading-relaxed">{L('Laminated PVC vinyl. Both finishes are protected against scratches and UV, and cost the same.', 'فينيل PVC ملمّن. كلا التشطيبين محمي من الخدش والأشعة، وبالسعر نفسه.')}</p>
          </div>
          <div>
            <span className={label}>{L('4. Cut', '٤. القص')}</span>
            <div className="grid grid-cols-1 gap-2">
              <button type="button" onClick={() => setPlotter(false)} className={chip(!plotter)}>
                <span className="block font-semibold">{L('Rectangles', 'مستطيلات')}</span>
                <span className="block text-[11px] text-gray-500">{L('straight cut, included', 'قص مستقيم، ضمن السعر')}</span>
              </button>
              <button type="button" onClick={() => setPlotter(true)} className={chip(plotter)}>
                <span className="block font-semibold">{L('Cut to shape', 'قص حسب الشكل')}</span>
                <span className="block text-[11px] text-gray-500">{L('contour cut, charged per row — see the total', 'قص كنتور، يُحتسب لكل صف — انظر الإجمالي')}</span>
              </button>
            </div>
          </div>
        </div>

        <div>
          <span className={label}>{L('5. Artwork', '٥. التصميم')}</span>
          <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer mb-3">
            <input type="checkbox" checked={design} onChange={e => setDesign(e.target.checked)} className="mt-1 accent-orange-500" />
            <span>
              <span className="font-semibold text-gray-900">{L('Design it for me', 'صمّموه لي')}</span>
              <span className="block text-[12px] text-gray-500 leading-relaxed">{L('A designer sets the compliant Arabic + English label in your brand and sends a proof. One-time fee, shown in the total.', 'مصمم يضبط الملصق المطابق بالعربية والإنجليزية بهوية علامتك ويرسل بروفة. رسم لمرة واحدة يظهر في الإجمالي.')}</span>
            </span>
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-dashed border-gray-300 px-3 py-2.5 text-sm text-gray-600 cursor-pointer hover:border-orange-300">
            <Upload className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="truncate">{artwork ? artwork.name : L('Upload print-ready file or current label photo (optional, up to 3 MB)', 'ارفع ملف الطباعة أو صورة الملصق الحالي (اختياري، حتى 3 ميغابايت)')}</span>
            <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => onFile(e.target.files?.[0])} />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
            <input value={product} onChange={e => setProduct(e.target.value)} placeholder={L('Product name (e.g. Date syrup 400 g)', 'اسم المنتج (مثال: دبس تمر 400 غ)')} className={inp} />
            <input value={details} onChange={e => setDetails(e.target.value)} placeholder={L('Notes (surface, deadline…)', 'ملاحظات (السطح، الموعد…)')} className={inp} />
          </div>
        </div>

        <div>
          <span className={label}>{L('6. Your details', '٦. بياناتك')}</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input required value={buyer.name} onChange={e => setBuyer({ ...buyer, name: e.target.value })} placeholder={L('Name *', 'الاسم *')} className={inp} autoComplete="name" />
            <input required value={buyer.phone} onChange={e => setBuyer({ ...buyer, phone: e.target.value })} placeholder={L('Mobile / WhatsApp *', 'الجوال / واتساب *')} className={inp} dir="ltr" autoComplete="tel" inputMode="tel" />
            <input type="email" value={buyer.email} onChange={e => setBuyer({ ...buyer, email: e.target.value })} placeholder={L('Email (for the receipt)', 'البريد الإلكتروني (للإيصال)')} className={inp} dir="ltr" autoComplete="email" />
            <input value={buyer.company} onChange={e => setBuyer({ ...buyer, company: e.target.value })} placeholder={L('Company', 'الشركة')} className={inp} autoComplete="organization" />
            <input value={buyer.address} onChange={e => setBuyer({ ...buyer, address: e.target.value })} placeholder={L('Delivery address (emirate, area)', 'عنوان التسليم (الإمارة، المنطقة)')} className={`${inp} sm:col-span-2`} autoComplete="street-address" />
            <input value={hp} onChange={e => setHp(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" name="website" />
          </div>
        </div>
      </div>

      {/* ── Price ── */}
      <aside className="bg-white border-2 border-orange-200 rounded-3xl p-5 md:p-6 lg:sticky lg:top-24 min-w-0">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3"><Tag className="w-4 h-4 text-orange-500" />{L('Your price', 'سعرك')}{quoting && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}</div>
        {quote ? (
          <>
            <div className="text-3xl font-bold text-gray-900 tabular-nums" dir="ltr">AED {aed(quote.total_aed)}</div>
            <div className="text-xs text-gray-500 mb-4">{L('including 5% VAT', 'شامل ضريبة القيمة المضافة 5%')} · <span dir="ltr">AED {aed(goodsIncVat / Math.max(pieces, 1))}</span> {L('per label', 'للملصق')}</div>
            <dl className="text-sm flex flex-col gap-1.5 border-t border-gray-100 pt-3">
              <div className="flex justify-between gap-3"><dt className="text-gray-500">{L('Labels', 'الملصقات')} · <span dir="ltr">{quote.sqm.charged_m2} m²</span></dt><dd className="tabular-nums text-gray-900" dir="ltr">{aed(quote.line_total_aed)}</dd></div>
              {quote.design_fee_aed > 0 && <div className="flex justify-between gap-3"><dt className="text-gray-500">{L('Design', 'التصميم')}</dt><dd className="tabular-nums text-gray-900" dir="ltr">{aed(quote.design_fee_aed)}</dd></div>}
              <div className="flex justify-between gap-3"><dt className="text-gray-500">{L('VAT 5%', 'الضريبة 5%')}</dt><dd className="tabular-nums text-gray-900" dir="ltr">{aed(quote.vat_aed)}</dd></div>
            </dl>
            {sameMoneyUpTo > pieces && (
              <p className="mt-3 flex items-start gap-1.5 text-[12px] text-gray-600 leading-relaxed bg-orange-50 rounded-xl px-3 py-2">
                <Info className="w-3.5 h-3.5 text-orange-500 mt-0.5 shrink-0" />
                {L(`This is the minimum order. You can raise the quantity to ${sameMoneyUpTo.toLocaleString('en-US')} labels at the same price.`, `هذا هو الحد الأدنى للطلب. يمكنك رفع الكمية إلى ${sameMoneyUpTo.toLocaleString('en-US')} ملصقاً بالسعر نفسه.`)}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-500 leading-relaxed">{quoteErr || (quoting ? L('Calculating…', 'جارٍ الحساب…') : L('Choose a size and a quantity to see the price.', 'اختر المقاس والكمية لترى السعر.'))}</p>
        )}

        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
        <p className="mt-4 text-[11px] text-gray-400 leading-relaxed">
          {L('By ordering you agree to the ', 'بإرسال الطلب توافق على ')}
          <a href={`/${locale}/privacy`} target="_blank" rel="noopener" className="text-orange-600 hover:underline">{L('Privacy Policy', 'سياسة الخصوصية')}</a>
          {L(' and ', ' و')}
          <a href={`/${locale}/terms`} target="_blank" rel="noopener" className="text-orange-600 hover:underline">{L('Terms', 'الشروط والأحكام')}</a>.
        </p>
        <button type="submit" disabled={sending || !quote} className="mt-3 w-full rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold py-3 inline-flex items-center justify-center gap-2 shadow-sm shadow-orange-500/30">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}{sending ? L('Sending…', 'جارٍ الإرسال…') : L('Order and pay', 'اطلب وادفع')}
        </button>
        <p className="mt-2 text-[11px] text-gray-500 text-center leading-relaxed">{L('Printed and delivered by Art for Printing. You approve a proof before anything is printed.', 'الطباعة والتسليم من Art for Printing. توافق على بروفة قبل طباعة أي شيء.')}</p>
      </aside>
    </form>
  )
}
