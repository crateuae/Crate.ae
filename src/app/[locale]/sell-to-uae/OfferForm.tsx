'use client'
/**
 * The supplier offer form. Short on purpose: five required fields (product, category, origin,
 * company, WhatsApp) and the rest optional but asked for, because a priced, documented offer
 * is the only kind a UAE importer acts on.
 */
import { useState } from 'react'
import { Loader2, CheckCircle2, MessageCircle, Send } from 'lucide-react'
import {
  CATEGORIES, CURRENCIES, PRICE_UNITS, INCOTERMS, PAYMENT_TERMS, DOCUMENTS, type Bi,
} from '@/lib/supplier-offers/model'

const FIELD_MSG: Record<string, Bi> = {
  product: { en: 'Enter the product.', ar: 'أدخل المنتج.' },
  category: { en: 'Choose a category.', ar: 'اختر الفئة.' },
  origin: { en: 'Enter the country of origin.', ar: 'أدخل بلد المنشأ.' },
  company: { en: 'Enter the company name.', ar: 'أدخل اسم الشركة.' },
  phone: { en: 'Enter a WhatsApp number with country code.', ar: 'أدخل رقم واتساب مع رمز الدولة.' },
  consent: { en: 'Tick the box to allow us to share your offer.', ar: 'ضع علامة للسماح لنا بمشاركة عرضك.' },
}

export default function OfferForm({ locale, initial }: { locale: 'ar' | 'en'; initial: { product: string; category: string } }) {
  const isAr = locale === 'ar'
  const t = (b: Bi) => (isAr ? b.ar : b.en)
  const L = (en: string, ar: string) => (isAr ? ar : en)

  const [f, setF] = useState({
    product: initial.product, category: initial.category, origin: '', grade: '', packaging: '',
    price: '', currency: 'USD', price_unit: 'kg', incoterm: 'CIF Jebel Ali',
    moq: '', moq_unit: 'kg', lead_time_days: '', payment_terms: '', private_label: false,
    company: '', name: '', phone: '', email: '', website: '', notes: '',
  })
  const [docs, setDocs] = useState<string[]>([])
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
      const res = await fetch('/api/supplier-offers', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...f, documents: docs, consent, locale, website_hp: hp, source_page: window.location.pathname + window.location.search }),
      })
      const d = await res.json().catch(() => ({}))
      if (d?.ok) setDone(String(d.ref))
      else setErr(d?.field && FIELD_MSG[d.field] ? t(FIELD_MSG[d.field]) : L('The offer could not be sent. Please try again.', 'تعذّر إرسال العرض. حاول مرة أخرى.'))
    } catch { setErr(L('The offer could not be sent. Please try again.', 'تعذّر إرسال العرض. حاول مرة أخرى.')) }
    finally { setSending(false) }
  }

  const inp = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100'
  const lab = 'block text-xs font-semibold text-gray-600 mb-1'
  const box = 'bg-white border border-gray-200 rounded-2xl p-4 sm:p-6'
  const h = 'text-base font-semibold text-gray-900 mb-3'

  if (done) {
    const wa = `https://wa.me/971543000415?text=${encodeURIComponent(L(`Hello Crate, I submitted offer ${done}. Sending the documents here.`, `مرحباً Crate، أرسلت العرض ${done}. أرسل المستندات هنا.`))}`
    return (
      <div className={`${box} text-center`} dir={isAr ? 'rtl' : 'ltr'}>
        <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-3"><CheckCircle2 className="w-7 h-7" /></div>
        <h2 className="text-lg font-bold text-gray-900">{L('Offer received', 'استلمنا عرضك')}</h2>
        <p className="text-sm text-gray-600 mt-1">{L('Reference', 'المرجع')}: <b dir="ltr">{done}</b></p>
        <ol className="text-sm text-gray-600 mt-4 max-w-md mx-auto text-start space-y-1.5 list-decimal ps-5">
          <li>{L('We review the offer and may ask for documents.', 'نراجع العرض وقد نطلب المستندات.')}</li>
          <li>{L('Verified offers are shared with UAE importers who request this product.', 'نشارك العروض الموثّقة مع المستوردين في الإمارات الذين يطلبون هذا المنتج.')}</li>
          <li>{L('Interested buyers contact you through Crate.', 'يتواصل المشترون المهتمون معك عبر Crate.')}</li>
        </ol>
        <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center">
          <a href={wa} target="_blank" rel="noopener" className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5">
            <MessageCircle className="w-4 h-4" />{L('Send documents on WhatsApp', 'أرسل المستندات واتساب')}
          </a>
          <button type="button" onClick={() => { setDone(null); setF({ ...f, product: '', grade: '', price: '', moq: '', notes: '' }); setDocs([]) }} className="rounded-xl border border-gray-300 hover:border-orange-300 text-gray-800 text-sm font-semibold px-5 py-2.5">
            {L('Submit another product', 'أرسل منتجاً آخر')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" dir={isAr ? 'rtl' : 'ltr'} noValidate>
      {/* Product */}
      <section className={box}>
        <h2 className={h}>{L('1. Your product', '١. منتجك')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className={lab}>{L('Product *', 'المنتج *')}</label><input required value={f.product} onChange={set('product')} placeholder={L('e.g. Pistachio, Akbari', 'مثال: فستق أكبري')} className={inp} /></div>
          <div><label className={lab}>{L('Category *', 'الفئة *')}</label>
            <select required value={f.category} onChange={set('category')} className={inp}>
              <option value="">{L('Choose…', 'اختر…')}</option>
              {CATEGORIES.map(c => <option key={c.key} value={c.key}>{t(c.label)}</option>)}
            </select>
          </div>
          <div><label className={lab}>{L('Country of origin *', 'بلد المنشأ *')}</label><input required value={f.origin} onChange={set('origin')} placeholder={L('e.g. Iran, Turkey, India', 'مثال: إيران، تركيا، الهند')} className={inp} /></div>
          <div><label className={lab}>{L('Grade / specification', 'الدرجة / المواصفات')}</label><input value={f.grade} onChange={set('grade')} placeholder={L('e.g. in-shell, 28–30 count', 'مثال: بالقشر، حجم 28–30')} className={inp} /></div>
          <div className="sm:col-span-2"><label className={lab}>{L('Packaging', 'التعبئة')}</label><input value={f.packaging} onChange={set('packaging')} placeholder={L('e.g. 10 kg cartons, 500 g retail packs', 'مثال: كراتين 10 كغ، عبوات 500 غ')} className={inp} /></div>
        </div>
      </section>

      {/* Offer */}
      <section className={box}>
        <h2 className={h}>{L('2. Your offer', '٢. عرضك')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={lab}>{L('Price', 'السعر')}</label>
            <div className="flex gap-2">
              <input inputMode="decimal" value={f.price} onChange={set('price')} placeholder="0.00" className={`${inp} min-w-0`} dir="ltr" />
              <select value={f.currency} onChange={set('currency')} className={`${inp} !w-24`}>{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select>
              <select value={f.price_unit} onChange={set('price_unit')} className={`${inp} !w-32`}>{PRICE_UNITS.map(u => <option key={u.key} value={u.key}>{t(u.label)}</option>)}</select>
            </div>
          </div>
          <div><label className={lab}>{L('Price basis (Incoterm)', 'أساس السعر (Incoterm)')}</label>
            <select value={f.incoterm} onChange={set('incoterm')} className={inp}>{INCOTERMS.map(i => <option key={i.key} value={i.key}>{t(i.label)}</option>)}</select>
          </div>
          <div>
            <label className={lab}>{L('Minimum order', 'الحد الأدنى للطلب')}</label>
            <div className="flex gap-2">
              <input inputMode="decimal" value={f.moq} onChange={set('moq')} className={`${inp} min-w-0`} dir="ltr" />
              <select value={f.moq_unit} onChange={set('moq_unit')} className={`${inp} !w-32`}>{PRICE_UNITS.map(u => <option key={u.key} value={u.key}>{u.key}</option>)}</select>
            </div>
          </div>
          <div><label className={lab}>{L('Lead time (days)', 'مدة التجهيز (أيام)')}</label><input inputMode="numeric" value={f.lead_time_days} onChange={set('lead_time_days')} className={inp} dir="ltr" /></div>
          <div><label className={lab}>{L('Payment terms', 'شروط الدفع')}</label>
            <select value={f.payment_terms} onChange={set('payment_terms')} className={inp}>
              <option value="">{L('Choose…', 'اختر…')}</option>
              {PAYMENT_TERMS.map(p => <option key={p.key} value={p.key}>{t(p.label)}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer sm:mt-6">
            <input type="checkbox" checked={f.private_label} onChange={e => setF({ ...f, private_label: e.target.checked })} className="accent-orange-500" />
            {L('Private label available', 'التعبئة بعلامة المشتري متاحة')}
          </label>
        </div>
      </section>

      {/* Documents */}
      <section className={box}>
        <h2 className={h}>{L('3. Documents you can provide', '٣. المستندات المتوفرة لديك')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DOCUMENTS.map(d => (
            <label key={d.key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={docs.includes(d.key)} onChange={e => setDocs(e.target.checked ? [...docs, d.key] : docs.filter(x => x !== d.key))} className="accent-orange-500" />
              {t(d.label)}
            </label>
          ))}
        </div>
        <p className="text-[12px] text-gray-500 mt-3">{L('Offers with documents are verified first.', 'العروض المرفقة بالمستندات تُوثَّق أولاً.')}</p>
      </section>

      {/* Contact */}
      <section className={box}>
        <h2 className={h}>{L('4. Your contact', '٤. بيانات التواصل')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className={lab}>{L('Company *', 'الشركة *')}</label><input required value={f.company} onChange={set('company')} className={inp} autoComplete="organization" /></div>
          <div><label className={lab}>{L('Contact name', 'اسم المسؤول')}</label><input value={f.name} onChange={set('name')} className={inp} autoComplete="name" /></div>
          <div><label className={lab}>{L('WhatsApp (with country code) *', 'واتساب (مع رمز الدولة) *')}</label><input required value={f.phone} onChange={set('phone')} placeholder="+971 50 000 0000" className={inp} dir="ltr" inputMode="tel" autoComplete="tel" /></div>
          <div><label className={lab}>{L('Email', 'البريد الإلكتروني')}</label><input type="email" value={f.email} onChange={set('email')} className={inp} dir="ltr" autoComplete="email" /></div>
          <div className="sm:col-span-2"><label className={lab}>{L('Website or product page', 'الموقع أو صفحة المنتج')}</label><input value={f.website} onChange={set('website')} className={inp} dir="ltr" inputMode="url" /></div>
          <div className="sm:col-span-2"><label className={lab}>{L('Notes', 'ملاحظات')}</label><textarea value={f.notes} onChange={set('notes')} rows={3} className={`${inp} resize-none`} /></div>
          <input value={hp} onChange={e => setHp(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" name="website_hp" />
        </div>
      </section>

      <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer px-1">
        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-1 accent-orange-500" />
        <span>
          {L('Crate may share this offer with UAE importers who request this product. I agree to the ', 'أوافق على أن تشارك Crate هذا العرض مع المستوردين في الإمارات الذين يطلبون هذا المنتج، وعلى ')}
          <a href={`/${locale}/privacy`} target="_blank" rel="noopener" className="text-orange-600 hover:underline">{L('Privacy Policy', 'سياسة الخصوصية')}</a>
          {L(' and ', ' و')}
          <a href={`/${locale}/terms`} target="_blank" rel="noopener" className="text-orange-600 hover:underline">{L('Terms', 'الشروط والأحكام')}</a>.
        </span>
      </label>

      {err && <p className="text-sm text-red-600 px-1">{err}</p>}
      <button type="submit" disabled={sending} className="w-full sm:w-auto sm:self-start rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-semibold px-8 py-3 inline-flex items-center justify-center gap-2 shadow-sm shadow-orange-500/30">
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}{sending ? L('Sending…', 'جارٍ الإرسال…') : L('Submit offer — free', 'أرسل العرض — مجاناً')}
      </button>
    </form>
  )
}
