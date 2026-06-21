'use client'

import { useState } from 'react'
import {
  Store, BadgeCheck, MapPin, MessageSquare, Loader2, CheckCircle2, X,
} from 'lucide-react'
import { catLabel, emirateLabel } from './labels'

export interface PublicProvider {
  id: string
  slug: string
  name_ar: string | null
  name_en: string | null
  type: string | null
  category: string | null
  categories: string[] | null
  emirate: string | null
  license_no: string | null
  issue_date: string | null
  is_verified: boolean
}

type Intent = 'quote' | 'product' | 'requirement'

const INTENTS: { key: Intent; ar: string; en: string }[] = [
  { key: 'quote',       ar: 'طلب عرض سعر',  en: 'Request a quote' },
  { key: 'product',     ar: 'سؤال عن منتج', en: 'Ask about a product' },
  { key: 'requirement', ar: 'متطلب توريد',  en: 'Supply requirement' },
]

export default function ProviderCard({ p, locale, isAr }: {
  p: PublicProvider; locale: string; isAr: boolean
}) {
  const [open, setOpen] = useState(false)
  const name = isAr ? (p.name_ar || p.name_en) : (p.name_en || p.name_ar)
  const sub = isAr ? p.name_en : p.name_ar
  const cats = p.categories?.length ? p.categories : p.category ? [p.category] : []
  const since = p.issue_date ? new Date(p.issue_date).getFullYear() : null

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-indigo-50">
              <Store className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="min-w-0">
              <div className="font-black text-gray-900 text-sm leading-tight line-clamp-2">{name}</div>
              {sub && <div className="text-[10px] text-gray-400 mt-0.5 truncate">{sub}</div>}
            </div>
          </div>
          {p.is_verified && (
            <span className="flex items-center gap-0.5 text-[9px] text-emerald-600 font-bold flex-shrink-0 ms-2">
              <BadgeCheck className="w-3.5 h-3.5" />{isAr ? 'موثّقة' : 'Verified'}
            </span>
          )}
        </div>

        {/* Category chips */}
        {cats.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {cats.slice(0, 2).map(c => (
              <span key={c} className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                {catLabel(c, isAr)}
              </span>
            ))}
          </div>
        )}

        {/* Trust line: location + license active + since */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 flex-wrap">
          {p.emirate && (
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{emirateLabel(p.emirate, isAr)}</span>
          )}
          {since && <><span className="text-gray-300">·</span><span>{isAr ? `منذ ${since}` : `Since ${since}`}</span></>}
        </div>

        {/* Single broker action — no direct contact exposed */}
        <button
          onClick={() => setOpen(true)}
          className="mt-auto w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          {isAr ? 'تواصل / طلب' : 'Contact / Request'}
        </button>
      </div>

      {open && (
        <ContactModal p={p} name={name ?? ''} locale={locale} isAr={isAr} onClose={() => setOpen(false)} />
      )}
    </>
  )
}

// ─── Broker contact modal ────────────────────────────────────────────────────

function ContactModal({ p, name, locale, isAr, onClose }: {
  p: PublicProvider; name: string; locale: string; isAr: boolean; onClose: () => void
}) {
  const [intent, setIntent] = useState<Intent>('quote')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({
    product: '', notes: '', contact_name: '', contact_email: '', contact_phone: '',
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.contact_name.trim()) return
    setSubmitting(true)
    try {
      await fetch('/api/rfq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_id: p.id,
          product_name: form.product.trim() || name,
          intent,
          notes: form.notes,
          contact_name: form.contact_name,
          contact_email: form.contact_email,
          contact_phone: form.contact_phone,
          company_name: name,
          source_page: `/${locale}/providers/${p.slug}`,
          locale,
        }),
      })
      setDone(true)
    } finally {
      setSubmitting(false)
    }
  }

  const inp = "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md my-8">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-black text-gray-900 text-sm leading-tight truncate">{name}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-900">
              {isAr ? 'وصلنا طلبك! ستتواصل معك Crate قريباً.' : "We received your request! Crate will contact you soon."}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              {isAr ? 'نتولّى التواصل مع الشركة نيابةً عنك.' : 'We handle the contact with the company on your behalf.'}
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 space-y-3">
            {/* Intent choice */}
            <div>
              <p className="text-[10px] text-gray-400 mb-1.5 font-bold">{isAr ? 'نوع الطلب' : 'Request type'}</p>
              <div className="flex flex-wrap gap-1.5">
                {INTENTS.map(it => (
                  <button key={it.key} type="button" onClick={() => setIntent(it.key)}
                    className={`text-[11px] px-3 py-1.5 rounded-lg border font-bold transition-all ${
                      intent === it.key
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300'
                    }`}>
                    {isAr ? it.ar : it.en}
                  </button>
                ))}
              </div>
            </div>

            <input value={form.product} onChange={e => set('product', e.target.value)}
              placeholder={isAr ? 'المنتج / الفئة (اختياري)' : 'Product / category (optional)'} className={inp} />
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
              placeholder={isAr ? 'تفاصيل طلبك أو استفسارك…' : 'Details of your request or question…'}
              className={inp + ' resize-none'} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <input required value={form.contact_name} onChange={e => set('contact_name', e.target.value)}
                placeholder={isAr ? 'اسمك *' : 'Your name *'} className={inp} />
              <input value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)}
                placeholder={isAr ? 'هاتف / واتساب' : 'Phone / WhatsApp'} className={inp} />
            </div>
            <input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)}
              placeholder={isAr ? 'البريد الإلكتروني' : 'Email'} className={inp} />

            <button type="submit" disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-60 transition-colors">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
              {isAr ? 'إرسال عبر Crate' : 'Send via Crate'}
            </button>
            <p className="text-[10px] text-gray-400 text-center">
              {isAr ? 'يمرّ طلبك عبر منصة Crate كوسيط موثوق.' : 'Your request is brokered through the Crate platform.'}
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
