'use client'

import { useState } from 'react'
import { Loader2, CheckCircle2, ChevronLeft } from 'lucide-react'

interface Props {
  opportunityId: string | null
  productName: string
  productNameAr: string | null
  sourcePage: string
  isAr: boolean
  locale: string
}

export default function RfqForm({ opportunityId, productName, productNameAr, sourcePage, isAr, locale }: Props) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({
    contact_name: '', contact_email: '', contact_phone: '',
    company_name: '', quantity: '', destination: '', notes: '',
  })

  const T = {
    cta: isAr ? 'اطلب عرض سعر الآن' : 'Request a quote now',
    subtitle: isAr
      ? 'مهتم بهذا المنتج؟ أرسل طلبك ونربطك بأفضل مورّد موثّق'
      : "Interested? Send your request and we'll connect you with a verified supplier",
    name: isAr ? 'الاسم *' : 'Name *',
    email: isAr ? 'البريد الإلكتروني' : 'Email',
    phone: isAr ? 'رقم الهاتف' : 'Phone',
    company: isAr ? 'اسم الشركة' : 'Company',
    qty: isAr ? 'الكمية المطلوبة (مثال: 500 كرتون)' : 'Required quantity (e.g. 500 cartons)',
    dest: isAr ? 'وجهة الشحن' : 'Delivery destination',
    notes: isAr ? 'ملاحظات إضافية' : 'Additional notes',
    send: isAr ? 'إرسال الطلب' : 'Send request',
    cancel: isAr ? 'إلغاء' : 'Cancel',
    thanks: isAr ? 'تم استلام طلبك! سنتواصل معك قريباً.' : "Request received! We'll contact you soon.",
    required: isAr ? 'الاسم مطلوب' : 'Name is required',
  }

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.contact_name.trim()) return
    setSubmitting(true)
    try {
      await fetch('/api/rfq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunity_id: opportunityId,
          product_name: productName,
          product_name_ar: productNameAr,
          ...form,
          source_page: sourcePage,
          locale,
        }),
      })
      setDone(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="mt-10 p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
        <p className="text-sm font-bold text-gray-900">{T.thanks}</p>
      </div>
    )
  }

  return (
    <div className="mt-10 p-5 bg-orange-50 border border-orange-200 rounded-2xl" dir={isAr ? 'rtl' : 'ltr'}>
      {!open ? (
        <div className="text-center">
          <p className="text-sm font-bold text-gray-900 mb-1">{T.subtitle}</p>
          <button
            onClick={() => setOpen(true)}
            className="mt-3 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-bold hover:bg-orange-700 transition-colors"
          >
            {T.cta}
            <ChevronLeft className={`w-4 h-4 ${isAr ? '' : 'rotate-180'}`} />
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <p className="text-sm font-black text-gray-900 mb-4">{T.cta}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input required value={form.contact_name} onChange={e => set('contact_name', e.target.value)}
              placeholder={T.name}
              className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400" />
            <input value={form.company_name} onChange={e => set('company_name', e.target.value)}
              placeholder={T.company}
              className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400" />
            <input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)}
              placeholder={T.email}
              className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400" />
            <input value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)}
              placeholder={T.phone}
              className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400" />
            <input value={form.quantity} onChange={e => set('quantity', e.target.value)}
              placeholder={T.qty}
              className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400" />
            <input value={form.destination} onChange={e => set('destination', e.target.value)}
              placeholder={T.dest}
              className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>

          <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
            rows={3} placeholder={T.notes}
            className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-bold hover:bg-orange-700 disabled:opacity-60 transition-colors">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {T.send}
            </button>
            <button type="button" onClick={() => setOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-orange-200 text-sm text-gray-600 hover:bg-orange-100 transition-colors">
              {T.cancel}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
