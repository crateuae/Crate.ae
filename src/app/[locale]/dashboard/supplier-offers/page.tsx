'use client'
/**
 * Supplier offers — the review list for /sell-to-uae submissions and for offers that arrived on
 * WhatsApp or by email (added here by hand). Each offer: status pipeline, internal notes and
 * one-tap WhatsApp replies with the message already written (src/lib/supplier-offers/templates).
 */
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, RefreshCw, ChevronDown, ChevronUp, MessageCircle, Copy, Check, Plus, AlertTriangle, Search, FileText } from 'lucide-react'
import {
  CATEGORIES, STATUSES, PAYMENT_TERMS, DOCUMENTS, INCOTERMS, PRICE_UNITS, CURRENCIES,
  labelOf, priceLine, offerRef, type OfferAnswers,
} from '@/lib/supplier-offers/model'
import { REPLIES, fillReply, waLink, type ReplyTemplate } from '@/lib/supplier-offers/templates'

interface Offer {
  id: string; email: string; name: string | null; company: string | null; phone: string | null
  locale: string; answers: OfferAnswers; consent: boolean; source_page: string | null; created_at: string
}

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500) } catch {} }}
      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:border-orange-300">
      {ok ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}{label}
    </button>
  )
}

/** The reply library, for leads that are not in the list yet (a raw WhatsApp message). */
function ReplyLibrary({ isAr }: { isAr: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-slate-800">
        <span className="inline-flex items-center gap-2"><FileText className="w-4 h-4 text-orange-500" />{isAr ? 'ردود واتساب الجاهزة' : 'Ready WhatsApp replies'}</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="border-t border-slate-100 p-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
          {REPLIES.map(r => (
            <div key={r.key} className="border border-slate-200 rounded-xl p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-slate-700">{isAr ? r.title.ar : r.title.en}</span>
                <span className="flex gap-1.5"><CopyBtn text={fillReply(r, 'ar')} label="AR" /><CopyBtn text={fillReply(r, 'en')} label="EN" /></span>
              </div>
              <pre dir={isAr ? 'rtl' : 'ltr'} className="whitespace-pre-wrap text-[12px] text-slate-600 font-sans leading-relaxed bg-slate-50 rounded-lg p-2 max-h-40 overflow-y-auto">{fillReply(r, isAr ? 'ar' : 'en')}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** Add an offer that came in on WhatsApp or by email. */
function AddOffer({ isAr, onAdded }: { isAr: boolean; onAdded: () => void }) {
  const [open, setOpen] = useState(false)
  const blank = { product: '', category: 'nuts', origin: '', company: '', name: '', phone: '', email: '', price: '', currency: 'USD', price_unit: 'kg', incoterm: '', moq: '', moq_unit: 'kg', lead_time_days: '', payment_terms: '', notes: '', channel: 'whatsapp' }
  const [f, setF] = useState(blank)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value })
  const inp = 'w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-orange-400'
  const save = async () => {
    setBusy(true); setErr('')
    const r = await fetch('/api/admin/supplier-offers', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(f) })
    const d = await r.json().catch(() => ({}))
    setBusy(false)
    if (!r.ok) { setErr((isAr ? 'حقل ناقص: ' : 'Missing: ') + (d.field ?? d.error ?? r.status)); return }
    setF(blank); setOpen(false); onAdded()
  }
  if (!open) return (
    <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-700">
      <Plus className="w-4 h-4" />{isAr ? 'إضافة عرض من واتساب/إيميل' : 'Add offer from WhatsApp/email'}
    </button>
  )
  return (
    <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input value={f.product} onChange={set('product')} placeholder={isAr ? 'المنتج *' : 'Product *'} className={inp} />
        <select value={f.category} onChange={set('category')} className={inp}>{CATEGORIES.map(c => <option key={c.key} value={c.key}>{isAr ? c.label.ar : c.label.en}</option>)}</select>
        <input value={f.origin} onChange={set('origin')} placeholder={isAr ? 'المنشأ *' : 'Origin *'} className={inp} />
        <input value={f.company} onChange={set('company')} placeholder={isAr ? 'الشركة / التوقيع *' : 'Company / signature *'} className={inp} />
        <input value={f.name} onChange={set('name')} placeholder={isAr ? 'اسم المسؤول' : 'Contact name'} className={inp} />
        <input value={f.phone} onChange={set('phone')} placeholder={isAr ? 'واتساب *' : 'WhatsApp *'} className={inp} dir="ltr" />
        <div className="flex gap-1.5">
          <input value={f.price} onChange={set('price')} placeholder={isAr ? 'السعر' : 'Price'} className={`${inp} min-w-0`} dir="ltr" />
          <select value={f.currency} onChange={set('currency')} className={`${inp} !w-20`}>{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select>
          <select value={f.price_unit} onChange={set('price_unit')} className={`${inp} !w-20`}>{PRICE_UNITS.map(u => <option key={u.key} value={u.key}>{u.key}</option>)}</select>
        </div>
        <div className="flex gap-1.5">
          <input value={f.moq} onChange={set('moq')} placeholder={isAr ? 'الحد الأدنى' : 'MOQ'} className={`${inp} min-w-0`} dir="ltr" />
          <select value={f.moq_unit} onChange={set('moq_unit')} className={`${inp} !w-20`}>{PRICE_UNITS.map(u => <option key={u.key} value={u.key}>{u.key}</option>)}</select>
        </div>
        <select value={f.payment_terms} onChange={set('payment_terms')} className={inp}>
          <option value="">{isAr ? 'شروط الدفع' : 'Payment terms'}</option>
          {PAYMENT_TERMS.map(p => <option key={p.key} value={p.key}>{isAr ? p.label.ar : p.label.en}</option>)}
        </select>
        <select value={f.incoterm} onChange={set('incoterm')} className={inp}>
          <option value="">Incoterm</option>
          {INCOTERMS.map(i => <option key={i.key} value={i.key}>{i.key}</option>)}
        </select>
        <input value={f.lead_time_days} onChange={set('lead_time_days')} placeholder={isAr ? 'مدة التجهيز (أيام)' : 'Lead time (days)'} className={inp} dir="ltr" />
        <select value={f.channel} onChange={set('channel')} className={inp}>
          <option value="whatsapp">WhatsApp</option><option value="email">Email</option>
        </select>
        <textarea value={f.notes} onChange={set('notes')} rows={2} placeholder={isAr ? 'ملاحظات (نص الرسالة الأصلية مثلاً)' : 'Notes (e.g. the original message)'} className={`${inp} sm:col-span-3 resize-none`} />
      </div>
      {err && <p className="text-xs text-red-600">{err}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={save} disabled={busy} className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 disabled:opacity-50 inline-flex items-center gap-1.5">{busy && <Loader2 className="w-4 h-4 animate-spin" />}{isAr ? 'حفظ العرض' : 'Save offer'}</button>
        <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600">{isAr ? 'إلغاء' : 'Cancel'}</button>
      </div>
    </div>
  )
}

function OfferCard({ o, isAr, onChanged }: { o: Offer; isAr: boolean; onChanged: (id: string, answers: OfferAnswers) => void }) {
  const a = o.answers
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState(a._admin_notes ?? '')
  const [busy, setBusy] = useState(false)
  const ref = offerRef(o.id)
  const risky = PAYMENT_TERMS.find(p => p.key === a.payment_terms)?.risky
  const status = STATUSES.find(s => s.key === (a._status || 'new')) ?? STATUSES[0]
  const lang: 'ar' | 'en' = o.locale === 'ar' ? 'ar' : 'en'
  const supplierReplies = REPLIES.filter(r => r.audience === 'supplier')

  const patch = async (body: Record<string, unknown>) => {
    setBusy(true)
    const r = await fetch('/api/admin/supplier-offers', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: o.id, ...body }) })
    const d = await r.json().catch(() => ({}))
    setBusy(false)
    if (r.ok && d.answers) onChanged(o.id, d.answers)
  }
  // Sending a reply moves the offer along the pipeline it belongs to.
  const NEXT: Partial<Record<string, string>> = { supplier_first: 'new', supplier_docs: 'docs_requested', supplier_verified: 'verified' }
  const reply = (r: ReplyTemplate, l: 'ar' | 'en') => {
    if (!o.phone) return
    window.open(waLink(o.phone, fillReply(r, l, { ref, product: a.product })), '_blank', 'noopener')
    const next = NEXT[r.key]
    if (next && next !== a._status && next !== 'new') patch({ status: next })
  }

  return (
    <div className={`bg-white border-2 rounded-2xl shadow-sm ${a._status === 'new' || !a._status ? 'border-orange-200' : 'border-slate-200'}`}>
      <button type="button" onClick={() => setOpen(v => !v)} className="w-full text-start px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="font-black text-slate-900 text-sm">{a.product}</span>
        <span className="text-xs text-slate-500">{a.origin} · {labelOf(CATEGORIES, a.category, isAr)}</span>
        {a.price ? <span className="text-xs font-bold text-orange-600 tabular-nums" dir="ltr">{priceLine(a)}</span> : <span className="text-[11px] text-slate-400">{isAr ? 'بدون سعر' : 'no price'}</span>}
        {a.moq ? <span className="text-[11px] text-slate-500" dir="ltr">MOQ {a.moq.toLocaleString('en-US')} {a.moq_unit}</span> : null}
        {risky && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5"><AlertTriangle className="w-3 h-3" />{isAr ? 'دفع مقدم 100%' : '100% advance'}</span>}
        <span className="text-[10px] text-slate-400">{(a.documents?.length ?? 0)}/{DOCUMENTS.length} {isAr ? 'مستندات' : 'docs'}</span>
        <span className="ms-auto flex items-center gap-2">
          <span className="text-[10px] text-slate-400 uppercase">{a.channel}</span>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${status.tone}`}>{isAr ? status.label.ar : status.label.en}</span>
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </span>
      </button>
      {open && (
        <div className="border-t border-slate-100 p-4 space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            <div><span className="text-slate-400">{isAr ? 'المرجع:' : 'Ref:'}</span> <b dir="ltr">{ref}</b> · <span className="text-slate-400">{new Date(o.created_at).toLocaleString(isAr ? 'ar-AE' : 'en-AE', { dateStyle: 'medium', timeStyle: 'short' })}</span></div>
            <div><span className="text-slate-400">{isAr ? 'الشركة:' : 'Company:'}</span> <b>{o.company}</b>{o.name ? ` — ${o.name}` : ''}</div>
            <div><span className="text-slate-400">{isAr ? 'واتساب:' : 'WhatsApp:'}</span> <span dir="ltr">{o.phone}</span>{o.email ? <> · <a href={`mailto:${o.email}`} className="text-blue-600" dir="ltr">{o.email}</a></> : null}</div>
            {a.grade && <div><span className="text-slate-400">{isAr ? 'المواصفات:' : 'Grade:'}</span> {a.grade}</div>}
            {a.packaging && <div><span className="text-slate-400">{isAr ? 'التعبئة:' : 'Packaging:'}</span> {a.packaging}</div>}
            {a.lead_time_days ? <div><span className="text-slate-400">{isAr ? 'التجهيز:' : 'Lead time:'}</span> {a.lead_time_days} {isAr ? 'يوماً' : 'days'}</div> : null}
            {a.payment_terms && <div><span className="text-slate-400">{isAr ? 'الدفع:' : 'Payment:'}</span> {labelOf(PAYMENT_TERMS, a.payment_terms, isAr)}</div>}
            {a.private_label && <div>{isAr ? 'التعبئة بعلامة المشتري متاحة' : 'Private label available'}</div>}
            {a.website && <div className="sm:col-span-2 truncate"><span className="text-slate-400">{isAr ? 'الرابط:' : 'Link:'}</span> <a href={a.website} target="_blank" rel="noopener noreferrer nofollow" className="text-blue-600" dir="ltr">{a.website}</a></div>}
            <div className="sm:col-span-2"><span className="text-slate-400">{isAr ? 'المستندات:' : 'Documents:'}</span> {(a.documents ?? []).length ? (a.documents ?? []).map(d => labelOf(DOCUMENTS, d, isAr)).join(' · ') : (isAr ? 'لا شيء بعد' : 'none yet')}</div>
            {a.notes && <div className="sm:col-span-2 whitespace-pre-wrap text-slate-600 bg-slate-50 rounded-lg p-2">{a.notes}</div>}
            <div className="sm:col-span-2 text-[11px] text-slate-400">{o.consent ? (isAr ? 'وافق المورّد على مشاركة العرض.' : 'Supplier agreed to sharing.') : (isAr ? 'أُضيف يدوياً — اطلب موافقته قبل المشاركة.' : 'Added by hand — get consent before sharing.')}</div>
          </div>

          <div>
            <p className="text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-wider">{isAr ? 'الحالة' : 'Status'}</p>
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map(s => (
                <button key={s.key} type="button" disabled={busy} onClick={() => patch({ status: s.key })}
                  className={`px-3 py-1.5 rounded-xl border-2 text-xs font-bold ${(a._status || 'new') === s.key ? `border-current ${s.tone}` : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                  {isAr ? s.label.ar : s.label.en}
                </button>
              ))}
              {busy && <Loader2 className="w-4 h-4 animate-spin text-slate-400 self-center" />}
            </div>
          </div>

          {o.phone && (
            <div>
              <p className="text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-wider">{isAr ? 'رد واتساب (يُفتح جاهزاً)' : 'WhatsApp reply (opens pre-written)'}</p>
              <div className="flex flex-wrap gap-1.5">
                {supplierReplies.map(r => (
                  <span key={r.key} className="inline-flex rounded-xl overflow-hidden border border-emerald-200">
                    <span className="px-2.5 py-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 inline-flex items-center gap-1"><MessageCircle className="w-3 h-3" />{isAr ? r.title.ar.replace('مورّد · ', '') : r.title.en.replace('Supplier · ', '')}</span>
                    <button type="button" onClick={() => reply(r, 'ar')} className="px-2 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 border-s border-emerald-200">AR</button>
                    <button type="button" onClick={() => reply(r, 'en')} className="px-2 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 border-s border-emerald-200">EN</button>
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">{isAr ? `لغة المورّد على الموقع: ${lang === 'ar' ? 'العربية' : 'الإنجليزية'}. طلب المستندات والتوثيق يحدّثان الحالة تلقائياً.` : `Supplier's site language: ${lang}. "Request documents" and "Verified" update the status.`}</p>
            </div>
          )}

          <div>
            <p className="text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-wider">{isAr ? 'ملاحظات داخلية' : 'Internal notes'}</p>
            <div className="flex gap-2">
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="flex-1 border-2 border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-400 resize-none" />
              <button type="button" onClick={() => patch({ admin_notes: notes })} disabled={busy} className="px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-700 disabled:opacity-40">{isAr ? 'حفظ' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SupplierOffersPage() {
  const params = useParams()
  const isAr = ((params.locale as string) || 'ar') === 'ar'
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [cat, setCat] = useState('all')
  const [q, setQ] = useState('')

  const load = async () => {
    setLoading(true)
    const r = await fetch('/api/admin/supplier-offers', { cache: 'no-store' })
    const d = await r.json().catch(() => ({}))
    setOffers(d.offers ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const counts = useMemo(() => Object.fromEntries(STATUSES.map(s => [s.key, offers.filter(o => (o.answers._status || 'new') === s.key).length])), [offers])
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return offers.filter(o =>
      (status === 'all' || (o.answers._status || 'new') === status) &&
      (cat === 'all' || o.answers.category === cat) &&
      (!needle || [o.answers.product, o.answers.origin, o.company, o.name, o.phone].join(' ').toLowerCase().includes(needle)))
  }, [offers, status, cat, q])

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold text-orange-500 tracking-wider uppercase">Crate Admin</p>
            <h1 className="text-2xl font-black text-slate-900">{isAr ? 'عروض الموردين' : 'Supplier offers'}</h1>
            <p className="text-sm text-slate-400 mt-0.5">{isAr ? 'من نموذج «بِع للمستوردين» ومن واتساب والإيميل — راجع، وثّق، ثم شارك مع المستوردين.' : 'From the "Sell to UAE importers" form, WhatsApp and email — review, verify, then share with importers.'}</p>
          </div>
          <div className="flex gap-2">
            <a href={`/${isAr ? 'ar' : 'en'}/sell-to-uae`} target="_blank" rel="noopener" className="px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-white">{isAr ? 'فتح النموذج' : 'Open the form'}</a>
            <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-white">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}{isAr ? 'تحديث' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {STATUSES.map(s => (
            <button key={s.key} type="button" onClick={() => setStatus(status === s.key ? 'all' : s.key)}
              className={`rounded-2xl border-2 p-3 text-center bg-white ${status === s.key ? 'border-orange-400' : 'border-slate-200'}`}>
              <div className="text-xl font-black text-slate-900 tabular-nums">{counts[s.key] ?? 0}</div>
              <div className="text-[11px] text-slate-500">{isAr ? s.label.ar : s.label.en}</div>
            </button>
          ))}
        </div>

        <ReplyLibrary isAr={isAr} />

        <div className="flex flex-wrap items-center gap-2">
          <AddOffer isAr={isAr} onAdded={load} />
          <div className="ms-auto flex flex-wrap gap-2">
            <select value={cat} onChange={e => setCat(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white">
              <option value="all">{isAr ? 'كل الفئات' : 'All categories'}</option>
              {CATEGORIES.map(c => <option key={c.key} value={c.key}>{isAr ? c.label.ar : c.label.en}</option>)}
            </select>
            <label className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute top-2.5 start-2.5" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder={isAr ? 'بحث: منتج، شركة، رقم' : 'Search: product, company, number'} className="border border-slate-200 rounded-xl ps-8 pe-3 py-2 text-sm bg-white w-56" />
            </label>
          </div>
        </div>

        <div className="space-y-2.5">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-orange-400 animate-spin" /></div>
          ) : list.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-400">{isAr ? 'لا توجد عروض بهذا التصفية.' : 'No offers match this filter.'}</div>
          ) : list.map(o => (
            <OfferCard key={o.id} o={o} isAr={isAr} onChanged={(id, answers) => setOffers(prev => prev.map(x => (x.id === id ? { ...x, answers } : x)))} />
          ))}
        </div>
      </div>
    </div>
  )
}
