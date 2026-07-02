'use client'

import { useState } from 'react'
import { BadgeCheck, Loader2, CheckCircle2 } from 'lucide-react'

export default function ClaimForm({ providerId, isAr }: { providerId: string; isAr: boolean }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({ contact_name: '', email: '', phone: '' })
  const [consent, setConsent] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const T = {
    heading: isAr ? 'هل هذه شركتك؟' : 'Is this your company?',
    sub: isAr ? 'وثّق شركتك واستقبل فرص الاستيراد والتوريد ذات الصلة أولاً بأول — مجاناً.' : 'Claim your company and receive relevant import & supply opportunities first — free.',
    claim: isAr ? 'وثّق شركتك' : 'Claim this company',
    name: isAr ? 'اسم المسؤول' : 'Contact name',
    email: isAr ? 'البريد الإلكتروني للعمل' : 'Business email',
    phone: isAr ? 'رقم الهاتف (اختياري)' : 'Phone (optional)',
    consent: isAr ? 'أوافق على استقبال فرص وعروض ذات صلة من Crate، ويمكنني إلغاء الاشتراك في أي وقت.' : 'I agree to receive relevant opportunities from Crate and can unsubscribe anytime.',
    submit: isAr ? 'إرسال التوثيق' : 'Submit claim',
    thanks: isAr ? 'تم استلام طلب التوثيق!' : 'Claim received!',
    thanksSub: isAr ? 'سنراجع الطلب ونبدأ بإرسال الفرص ذات الصلة قريباً.' : "We'll review it and start sending relevant opportunities soon.",
    reqEmail: isAr ? 'أدخل بريداً صحيحاً' : 'Enter a valid email',
    reqConsent: isAr ? 'يجب الموافقة على الاستقبال' : 'Please agree to receive opportunities',
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null)
    if (!form.email.includes('@')) { setErr(T.reqEmail); return }
    if (!consent) { setErr(T.reqConsent); return }
    setBusy(true)
    try {
      const r = await fetch('/api/providers/claim', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider_id: providerId, ...form }),
      })
      if (r.ok) setDone(true)
      else setErr((await r.json()).error ?? 'error')
    } finally { setBusy(false) }
  }

  if (done) return (
    <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-5 flex items-center gap-3">
      <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
      <div>
        <p className="font-bold text-emerald-800 text-sm">{T.thanks}</p>
        <p className="text-xs text-emerald-600">{T.thanksSub}</p>
      </div>
    </div>
  )

  const inp = 'w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300'

  return (
    <div className="rounded-2xl bg-orange-50/60 border border-orange-100 p-5" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex items-start gap-3 mb-1">
        <BadgeCheck className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-black text-stone-900 text-sm">{T.heading}</h3>
          <p className="text-xs text-stone-500 leading-relaxed">{T.sub}</p>
        </div>
      </div>
      {!open ? (
        <button onClick={() => setOpen(true)}
          className="mt-3 inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors">
          {T.claim}
        </button>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} placeholder={T.name} className={inp} />
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder={T.email} className={inp} dir="ltr" />
          </div>
          <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder={T.phone} className={inp} dir="ltr" />
          <label className="flex items-start gap-2 text-xs text-stone-600 leading-relaxed cursor-pointer">
            <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5 accent-orange-500" />
            {T.consent}
          </label>
          {err && <p className="text-xs text-rose-600">{err}</p>}
          <button type="submit" disabled={busy}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2 rounded-xl disabled:opacity-60 transition-colors">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}{T.submit}
          </button>
        </form>
      )}
    </div>
  )
}
