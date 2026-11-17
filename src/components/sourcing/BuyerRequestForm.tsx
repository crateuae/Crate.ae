'use client'
/** The buyer's "request supplier offers" form — /source and /source/<product>. */
import { useState } from 'react'
import { Loader2, CheckCircle2, Send, MessageCircle } from 'lucide-react'
import { CATEGORIES, DELIVERY, QTY_UNITS, SERVICES, type Bi } from '@/lib/sourcing/model'

const FIELD_MSG: Record<string, Bi> = {
  product: { en: 'Enter the product you need.', ar: 'أدخل المنتج المطلوب.' },
  category: { en: 'Choose a category.', ar: 'اختر الفئة.' },
  phone: { en: 'Enter a WhatsApp number with country code.', ar: 'أدخل رقم واتساب مع رمز الدولة.' },
  consent: { en: 'Tick the box so we can contact you with offers.', ar: 'ضع علامة لنتمكن من التواصل معك بالعروض.' },
}

export default function BuyerRequestForm({ locale, initial }: {
  locale: 'ar' | 'en'
  initial: { product: string; category: string; slug?: string; specHint?: string }
}) {
  const isAr = locale === 'ar'
  const t = (b: Bi) => (isAr ? b.ar : b.en)
  const L = (en: string, ar: string) => (isAr ? ar : en)
  const [f, setF] = useState({
    product: initial.product, category: initial.category, spec: '', quantity: '', qty_unit: 'kg', delivery: 'jebel_ali',
    target_price: '', currency: 'USD', needed_by: '', company: '', name: '', phone: '', email: '', notes: '',
  })
  const [services, setServices] = useState<string[]>([])
  const [consent, setConsent] = useState(false)
  const [hp, setHp] = useState('')
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState<string | null>(null)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (sending) return
    if (!consent) { setErr(t(FIELD_MSG.consent)); return }
    setErr(''); setSending(true)
    try {
      const res = await fetch('/api/buyer-requests', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...f, services, consent, locale, source_slug: initial.slug, website_hp: hp, source_page: window.location.pathname + window.location.search }),
      })
      const d = await res.json().catch(() => ({}))
      if (d?.ok) setDone(String(d.ref))
      else setErr(d?.field && FIELD_MSG[d.field] ? t(FIELD_MSG[d.field]) : L('The request could not be sent. Please try again.', 'تعذّر إرسال الطلب. حاول مرة أخرى.'))
    } catch { setErr(L('The request could not be sent. Please try again.', 'تعذّر إرسال الطلب. حاول مرة أخرى.')) }
    finally { setSending(false) }
  }

  const inp = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100'
  const lab = 'block text-xs font-semibold text-gray-600 mb-1'

  if (done) {
    const wa = `https://wa.me/971543000415?text=${encodeURIComponent(L(`Hello Crate, my sourcing request is ${done}.`, `مرحباً Crate، رقم طلب العروض ${done}.`))}`
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-3"><CheckCircle2 className="w-7 h-7" /></div>
        <h2 className="text-lg font-bold text-gray-900">{L('Request received', 'استلمنا طلبك')}</h2>
        <p className="text-sm text-gray-600 mt-1">{L('Reference', 'المرجع')}: <b dir="ltr">{done}</b></p>
        <p className="text-sm text-gray-600 mt-3 max-w-md mx-auto">{L('We match it against the supplier offers we hold and contact you on WhatsApp or email with the ones that fit.', 'نطابقه مع عروض الموردين المتوفرة لدينا ونتواصل معك على واتساب أو البريد بالعروض المناسبة.')}</p>
        <a href={wa} target="_blank" rel="noopener" className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5">
          <MessageCircle className="w-4 h-4" />{L('Message us on WhatsApp', 'راسلنا واتساب')}
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 flex flex-col gap-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className={lab}>{L('Product *', 'المنتج *')}</label><input value={f.product} onChange={set('product')} className={inp} /></div>
        <div><label className={lab}>{L('Category *', 'الفئة *')}</label>
          <select value={f.category} onChange={set('category')} className={inp}>
            <option value="">{L('Choose…', 'اختر…')}</option>
            {CATEGORIES.map(c => <option key={c.key} value={c.key}>{t(c.label)}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2"><label className={lab}>{L('Grade / specification', 'الدرجة / المواصفات')}</label><input value={f.spec} onChange={set('spec')} placeholder={initial.specHint} className={inp} /></div>
        <div>
          <label className={lab}>{L('Quantity', 'الكمية')}</label>
          <div className="flex gap-2">
            <input inputMode="decimal" value={f.quantity} onChange={set('quantity')} className={`${inp} min-w-0`} dir="ltr" />
            <select value={f.qty_unit} onChange={set('qty_unit')} className={`${inp} !w-32`}>{QTY_UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select>
          </div>
        </div>
        <div><label className={lab}>{L('Delivery', 'التسليم')}</label>
          <select value={f.delivery} onChange={set('delivery')} className={inp}>{DELIVERY.map(d => <option key={d.key} value={d.key}>{t(d.label)}</option>)}</select>
        </div>
        <div>
          <label className={lab}>{L('Target price (optional)', 'السعر المستهدف (اختياري)')}</label>
          <div className="flex gap-2">
            <input inputMode="decimal" value={f.target_price} onChange={set('target_price')} placeholder={L('per kg', 'للكيلو')} className={`${inp} min-w-0`} dir="ltr" />
            <select value={f.currency} onChange={set('currency')} className={`${inp} !w-24`}>{['USD', 'AED', 'EUR'].map(c => <option key={c}>{c}</option>)}</select>
          </div>
        </div>
        <div><label className={lab}>{L('Needed by', 'مطلوب بحلول')}</label><input value={f.needed_by} onChange={set('needed_by')} placeholder={L('e.g. before Ramadan', 'مثال: قبل رمضان')} className={inp} /></div>
      </div>

      <fieldset>
        <legend className={lab}>{L('Also help me with', 'ساعدوني أيضاً في')}</legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SERVICES.map(s => (
            <label key={s.key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={services.includes(s.key)} onChange={e => setServices(e.target.checked ? [...services, s.key] : services.filter(x => x !== s.key))} className="accent-orange-500" />
              {t(s.label)}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-gray-100 pt-4">
        <div><label className={lab}>{L('Company', 'الشركة')}</label><input value={f.company} onChange={set('company')} className={inp} autoComplete="organization" /></div>
        <div><label className={lab}>{L('Your name', 'الاسم')}</label><input value={f.name} onChange={set('name')} className={inp} autoComplete="name" /></div>
        <div><label className={lab}>{L('WhatsApp *', 'واتساب *')}</label><input value={f.phone} onChange={set('phone')} placeholder="+971 50 000 0000" className={inp} dir="ltr" inputMode="tel" autoComplete="tel" /></div>
        <div><label className={lab}>{L('Email', 'البريد الإلكتروني')}</label><input type="email" value={f.email} onChange={set('email')} className={inp} dir="ltr" autoComplete="email" /></div>
        <div className="sm:col-span-2"><label className={lab}>{L('Notes', 'ملاحظات')}</label><textarea value={f.notes} onChange={set('notes')} rows={2} className={`${inp} resize-none`} /></div>
        <input value={hp} onChange={e => setHp(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" name="website_hp" />
      </div>

      <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-1 accent-orange-500" />
        <span>
          {L('Crate may contact me about matching supplier offers. I agree to the ', 'أوافق على أن تتواصل معي Crate بشأن عروض الموردين المطابقة، وعلى ')}
          <a href={`/${locale}/privacy`} target="_blank" rel="noopener" className="text-orange-600 hover:underline">{L('Privacy Policy', 'سياسة الخصوصية')}</a>
          {L(' and ', ' و')}
          <a href={`/${locale}/terms`} target="_blank" rel="noopener" className="text-orange-600 hover:underline">{L('Terms', 'الشروط والأحكام')}</a>.
        </span>
      </label>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button type="submit" disabled={sending} className="w-full sm:w-auto sm:self-start rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-semibold px-8 py-3 inline-flex items-center justify-center gap-2 shadow-sm shadow-orange-500/30">
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}{sending ? L('Sending…', 'جارٍ الإرسال…') : L('Request offers — free', 'اطلب العروض — مجاناً')}
      </button>
    </form>
  )
}
