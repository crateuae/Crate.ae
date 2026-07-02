'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, CheckCircle2, ArrowLeft, ArrowRight, Package, Phone, Mail } from 'lucide-react'

interface Props {
  product: string
  type: string | null
  isAr: boolean
  locale: string
}

export default function RfqPageForm({ product, type, isAr, locale }: Props) {
  const Arrow = isAr ? ArrowLeft : ArrowRight
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    product_name: product || '',
    contact_name: '', contact_email: '', contact_phone: '',
    company_name: '', quantity: '', destination: '', budget_aed: '', notes: '',
  })

  const T = {
    title: isAr ? 'اطلب عرض سعر' : 'Request a Quote',
    subtitle: isAr
      ? 'أرسل تفاصيل طلبك وسنتواصل معك خلال ٢٤ ساعة بأفضل عرض من مورّد موثّق.'
      : "Send your request details and we'll get back to you within 24 hours with the best offer from a verified supplier.",
    product: isAr ? 'المنتج المطلوب' : 'Requested product',
    name: isAr ? 'الاسم' : 'Full name',
    company: isAr ? 'اسم الشركة' : 'Company name',
    email: isAr ? 'البريد الإلكتروني' : 'Email',
    phone: isAr ? 'رقم الهاتف' : 'Phone number',
    qty: isAr ? 'الكمية المطلوبة' : 'Required quantity',
    qtyPh: isAr ? 'مثال: ٥٠٠ كرتون' : 'e.g. 500 cartons',
    dest: isAr ? 'وجهة الشحن' : 'Delivery destination',
    destPh: isAr ? 'مثال: دبي، جبل علي' : 'e.g. Dubai, Jebel Ali',
    budget: isAr ? 'الميزانية التقريبية (درهم)' : 'Approx. budget (AED)',
    notes: isAr ? 'ملاحظات إضافية' : 'Additional notes',
    notesPh: isAr ? 'أي تفاصيل تساعدنا في تجهيز العرض…' : 'Any details that help us prepare the offer…',
    send: isAr ? 'إرسال الطلب' : 'Send request',
    thanks: isAr ? 'تم استلام طلبك بنجاح!' : 'Your request has been received!',
    thanksSub: isAr ? 'سنتواصل معك خلال ٢٤ ساعة على بيانات التواصل التي أدخلتها.' : "We'll contact you within 24 hours using the details you provided.",
    backProducts: isAr ? 'تصفّح منتجات أخرى' : 'Browse more products',
    reqName: isAr ? 'الرجاء إدخال الاسم' : 'Please enter your name',
    reqProduct: isAr ? 'الرجاء إدخال اسم المنتج' : 'Please enter the product name',
    contactMethod: isAr ? 'الرجاء إدخال هاتف أو بريد للتواصل' : 'Please provide a phone or email',
    errGeneric: isAr ? 'تعذّر إرسال الطلب، حاول مجدداً.' : 'Could not send the request, please try again.',
    optional: isAr ? '(اختياري)' : '(optional)',
    required: isAr ? '*' : '*',
  }

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.contact_name.trim()) { setError(T.reqName); return }
    if (!form.product_name.trim()) { setError(T.reqProduct); return }
    if (!form.contact_email.trim() && !form.contact_phone.trim()) { setError(T.contactMethod); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/rfq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          intent: type === 'import' ? 'requirement' : 'quote',
          source_page: `/${locale}/rfq`,
          locale,
        }),
      })
      if (!res.ok) { setError(T.errGeneric); return }
      setDone(true)
    } catch {
      setError(T.errGeneric)
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls =
    'w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition'
  const labelCls = 'block text-xs font-semibold text-stone-600 mb-1.5'

  if (done) {
    return (
      <div className="max-w-lg mx-auto text-center bg-white border border-stone-200/80 rounded-3xl p-10 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-black text-stone-900 mb-2">{T.thanks}</h2>
        <p className="text-sm text-stone-500 leading-relaxed mb-7">{T.thanksSub}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href={`/${locale}/products`}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-2xl text-sm transition-all">
            <Package className="w-4 h-4" />{T.backProducts}
          </Link>
          <a href="tel:+971543000415"
            className="inline-flex items-center gap-2 bg-white border border-stone-200 hover:border-orange-200 text-stone-700 font-semibold px-6 py-3 rounded-2xl text-sm transition-all" dir="ltr">
            <Phone className="w-4 h-4 text-orange-500" /> +971 54 300 0415
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 mb-4">
          <Package className="w-6 h-6 text-orange-500" />
        </div>
        <h1 className="text-3xl font-black text-stone-900 tracking-tight mb-2">{T.title}</h1>
        <p className="text-sm text-stone-500 leading-relaxed max-w-md mx-auto">{T.subtitle}</p>
      </div>

      <form onSubmit={submit} className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        {/* Product (prefilled, editable) */}
        <div>
          <label className={labelCls}>{T.product} <span className="text-orange-500">{T.required}</span></label>
          <input value={form.product_name} onChange={e => set('product_name', e.target.value)}
            className={`${inputCls} font-medium`} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>{T.name} <span className="text-orange-500">{T.required}</span></label>
            <input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{T.company} <span className="text-stone-400 font-normal">{T.optional}</span></label>
            <input value={form.company_name} onChange={e => set('company_name', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{T.phone}</label>
            <input value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} className={inputCls} dir="ltr" placeholder="+971 5x xxx xxxx" />
          </div>
          <div>
            <label className={labelCls}>{T.email}</label>
            <input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} className={inputCls} dir="ltr" placeholder="name@company.com" />
          </div>
          <div>
            <label className={labelCls}>{T.qty} <span className="text-stone-400 font-normal">{T.optional}</span></label>
            <input value={form.quantity} onChange={e => set('quantity', e.target.value)} className={inputCls} placeholder={T.qtyPh} />
          </div>
          <div>
            <label className={labelCls}>{T.dest} <span className="text-stone-400 font-normal">{T.optional}</span></label>
            <input value={form.destination} onChange={e => set('destination', e.target.value)} className={inputCls} placeholder={T.destPh} />
          </div>
        </div>

        <div>
          <label className={labelCls}>{T.notes} <span className="text-stone-400 font-normal">{T.optional}</span></label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} className={`${inputCls} resize-none`} placeholder={T.notesPh} />
        </div>

        {error && (
          <div className="text-xs bg-rose-50 text-rose-600 border border-rose-100 rounded-xl px-4 py-2.5">{error}</div>
        )}

        <button type="submit" disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold disabled:opacity-60 transition-all shadow-lg shadow-orange-500/20">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {T.send}
          {!submitting && <Arrow className="w-4 h-4" />}
        </button>

        {/* Direct contact fallback */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-1 text-[11px] text-stone-400">
          <a href="tel:+971543000415" className="inline-flex items-center gap-1.5 hover:text-orange-500 transition-colors" dir="ltr">
            <Phone className="w-3.5 h-3.5 text-orange-400" /> +971 54 300 0415
          </a>
          <a href="mailto:uae@crate.ae" className="inline-flex items-center gap-1.5 hover:text-orange-500 transition-colors">
            <Mail className="w-3.5 h-3.5 text-orange-400" /> uae@crate.ae
          </a>
        </div>
      </form>
    </div>
  )
}
