'use client'
/**
 * Buyer requests — UAE buyers asking for supplier offers (/source). Each request shows the
 * supplier offers that match it, so the reviewer can answer in one step: WhatsApp the buyer
 * the matching offers (text written for them) and move the status.
 */
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, RefreshCw, ChevronDown, ChevronUp, MessageCircle, AlertTriangle, PackageSearch } from 'lucide-react'
import { priceLine, offerRef, labelOf, CATEGORIES, type OfferAnswers } from '@/lib/supplier-offers/model'
import { BR_STATUSES, DELIVERY, SERVICES, requestRef, riskyTerms, type RequestAnswers } from '@/lib/sourcing/model'
import { REPLIES, fillReply, waLink } from '@/lib/supplier-offers/templates'

interface Match { id: string; company: string | null; phone: string | null; email: string; consent: boolean; answers: OfferAnswers; strength: 'product' | 'category' }
interface Req { id: string; email: string; name: string | null; company: string | null; phone: string | null; locale: string; answers: RequestAnswers; source_page: string | null; created_at: string; matches: Match[] }

/** The offers, written for the buyer: no supplier names or numbers — Crate brokers. */
function offersText(r: Req, chosen: Match[], ar: boolean): string {
  const head = ar
    ? `أهلاً${r.name ? ` ${r.name}` : ''} 👋\nبخصوص طلبك *${requestRef(r.id)}* — ${r.answers.product}، هذه العروض المتوفرة لدينا:\n`
    : `Hello${r.name ? ` ${r.name}` : ''} 👋\nFor your request *${requestRef(r.id)}* — ${r.answers.product}, these are the offers we hold:\n`
  const lines = chosen.map((m, i) => {
    const a = m.answers
    const bits = [a.product, a.origin, a.price ? priceLine(a) : (ar ? 'السعر عند الطلب' : 'price on request'), a.moq ? `MOQ ${a.moq.toLocaleString('en-US')} ${a.moq_unit}` : '', a.lead_time_days ? (ar ? `التجهيز ${a.lead_time_days} يوماً` : `${a.lead_time_days} days`) : ''].filter(Boolean)
    return `${i + 1}. ${bits.join(' · ')} (${offerRef(m.id)})`
  })
  const tail = ar
    ? `\nأي عرض يناسبك؟ نرتّب لك العينة والمستندات، ونساعدك في التسجيل والملصق العربي.`
    : `\nWhich one fits? We arrange the sample and documents, and help with registration and the Arabic label.`
  return [head, ...lines, tail].join('\n')
}

function RequestCard({ r, isAr, onChanged }: { r: Req; isAr: boolean; onChanged: (id: string, a: RequestAnswers) => void }) {
  const a = r.answers
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState(a._admin_notes ?? '')
  const [busy, setBusy] = useState(false)
  const shareable = r.matches.filter(m => m.consent && m.answers._status !== 'rejected')
  const [picked, setPicked] = useState<string[]>(shareable.slice(0, 5).map(m => m.id))
  const status = BR_STATUSES.find(s => s.key === (a._status || 'new')) ?? BR_STATUSES[0]
  const lang: 'ar' | 'en' = r.locale === 'en' ? 'en' : 'ar'

  const patch = async (body: Record<string, unknown>) => {
    setBusy(true)
    const res = await fetch('/api/admin/buyer-requests', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: r.id, ...body }) })
    const d = await res.json().catch(() => ({}))
    setBusy(false)
    if (res.ok && d.answers) onChanged(r.id, d.answers)
  }
  const sendOffers = () => {
    if (!r.phone) return
    const chosen = r.matches.filter(m => picked.includes(m.id))
    if (!chosen.length) return
    window.open(waLink(r.phone, offersText(r, chosen, lang === 'ar')), '_blank', 'noopener')
    if ((a._status || 'new') === 'new' || a._status === 'contacted') patch({ status: 'offers_sent' })
  }
  const askDetails = () => {
    if (!r.phone) return
    const t = REPLIES.find(x => x.key === 'uae_buyer')!
    window.open(waLink(r.phone, fillReply(t, lang, { product: a.product })), '_blank', 'noopener')
    if ((a._status || 'new') === 'new') patch({ status: 'contacted' })
  }

  return (
    <div className={`bg-white border-2 rounded-2xl shadow-sm ${(a._status || 'new') === 'new' ? 'border-orange-200' : 'border-slate-200'}`}>
      <button type="button" onClick={() => setOpen(v => !v)} className="w-full text-start px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="font-black text-slate-900 text-sm">{a.product}</span>
        {a.quantity ? <span className="text-xs font-bold text-orange-600 tabular-nums" dir="ltr">{a.quantity.toLocaleString('en-US')} {a.qty_unit}</span> : null}
        <span className="text-xs text-slate-500">{r.company || r.name || '—'}</span>
        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500"><PackageSearch className="w-3 h-3" />{r.matches.length} {isAr ? 'عرض مطابق' : 'matching offers'}</span>
        <span className="ms-auto flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${status.tone}`}>{isAr ? status.label.ar : status.label.en}</span>
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </span>
      </button>
      {open && (
        <div className="border-t border-slate-100 p-4 space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            <div><span className="text-slate-400">{isAr ? 'المرجع:' : 'Ref:'}</span> <b dir="ltr">{requestRef(r.id)}</b> · <span className="text-slate-400">{new Date(r.created_at).toLocaleString(isAr ? 'ar-AE' : 'en-AE', { dateStyle: 'medium', timeStyle: 'short' })}</span></div>
            <div><span className="text-slate-400">{isAr ? 'الفئة:' : 'Category:'}</span> {labelOf(CATEGORIES, a.category, isAr)}</div>
            {a.spec && <div className="sm:col-span-2"><span className="text-slate-400">{isAr ? 'المواصفات:' : 'Spec:'}</span> {a.spec}</div>}
            {a.delivery && <div><span className="text-slate-400">{isAr ? 'التسليم:' : 'Delivery:'}</span> {labelOf(DELIVERY, a.delivery, isAr)}</div>}
            {a.target_price ? <div><span className="text-slate-400">{isAr ? 'السعر المستهدف:' : 'Target price:'}</span> <span dir="ltr">{a.currency} {a.target_price}</span></div> : null}
            {a.needed_by && <div><span className="text-slate-400">{isAr ? 'مطلوب بحلول:' : 'Needed by:'}</span> {a.needed_by}</div>}
            {!!a.services?.length && <div className="sm:col-span-2"><span className="text-slate-400">{isAr ? 'خدمات:' : 'Services:'}</span> {a.services.map(s => labelOf(SERVICES, s, isAr)).join(' · ')}</div>}
            <div className="sm:col-span-2"><span className="text-slate-400">{isAr ? 'التواصل:' : 'Contact:'}</span> {r.name ?? ''} <span dir="ltr">{r.phone}</span>{r.email ? <> · <a href={`mailto:${r.email}`} className="text-blue-600" dir="ltr">{r.email}</a></> : null}</div>
            {a.notes && <div className="sm:col-span-2 whitespace-pre-wrap text-slate-600 bg-slate-50 rounded-lg p-2">{a.notes}</div>}
          </div>

          <div>
            <p className="text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-wider">{isAr ? 'العروض المطابقة' : 'Matching offers'}</p>
            {r.matches.length === 0 ? <p className="text-xs text-slate-400">{isAr ? 'لا عروض مطابقة بعد — اسأل المشتري عن التفاصيل.' : 'No matching offers yet — ask the buyer for details.'}</p> : (
              <div className="space-y-1">
                {r.matches.map(m => (
                  <label key={m.id} className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs rounded-lg px-2 py-1.5 ${m.consent ? 'cursor-pointer hover:bg-slate-50' : 'opacity-60'}`}>
                    <input type="checkbox" disabled={!m.consent} checked={picked.includes(m.id)} onChange={e => setPicked(e.target.checked ? [...picked, m.id] : picked.filter(x => x !== m.id))} className="accent-orange-500" />
                    <b>{m.answers.product}</b><span className="text-slate-500">{m.answers.origin}</span>
                    <span className="text-orange-600 font-bold" dir="ltr">{m.answers.price ? priceLine(m.answers) : (isAr ? 'بدون سعر' : 'no price')}</span>
                    {m.answers.moq ? <span className="text-slate-500" dir="ltr">MOQ {m.answers.moq} {m.answers.moq_unit}</span> : null}
                    <span className="text-[10px] text-slate-400">{offerRef(m.id)} · {m.answers._status}{m.strength === 'category' ? (isAr ? ' · نفس الفئة' : ' · same category') : ''}</span>
                    {riskyTerms(m.answers.payment_terms) && <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700"><AlertTriangle className="w-3 h-3" />100%</span>}
                    {!m.consent && <span className="text-[10px] text-slate-400">{isAr ? '(بلا موافقة المورّد على المشاركة)' : '(supplier has not agreed to sharing)'}</span>}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {r.phone && <button type="button" onClick={sendOffers} disabled={!picked.length} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-40"><MessageCircle className="w-3.5 h-3.5" />{isAr ? `أرسل ${picked.length} عرضاً واتساب` : `WhatsApp ${picked.length} offers`}</button>}
            {r.phone && <button type="button" onClick={askDetails} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-50"><MessageCircle className="w-3.5 h-3.5" />{isAr ? 'اسأل عن التفاصيل' : 'Ask for details'}</button>}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {BR_STATUSES.map(s => (
              <button key={s.key} type="button" disabled={busy} onClick={() => patch({ status: s.key })}
                className={`px-3 py-1.5 rounded-xl border-2 text-xs font-bold ${(a._status || 'new') === s.key ? `border-current ${s.tone}` : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                {isAr ? s.label.ar : s.label.en}
              </button>
            ))}
            {busy && <Loader2 className="w-4 h-4 animate-spin text-slate-400 self-center" />}
          </div>

          <div className="flex gap-2">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder={isAr ? 'ملاحظات داخلية' : 'Internal notes'} className="flex-1 border-2 border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-400 resize-none" />
            <button type="button" onClick={() => patch({ admin_notes: notes })} disabled={busy} className="px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-700 disabled:opacity-40">{isAr ? 'حفظ' : 'Save'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function BuyerRequestsPage() {
  const params = useParams()
  const isAr = ((params.locale as string) || 'ar') === 'ar'
  const [rows, setRows] = useState<Req[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const load = async () => {
    setLoading(true)
    const r = await fetch('/api/admin/buyer-requests', { cache: 'no-store' })
    const d = await r.json().catch(() => ({}))
    setRows(d.requests ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])
  const counts = useMemo(() => Object.fromEntries(BR_STATUSES.map(s => [s.key, rows.filter(r => (r.answers._status || 'new') === s.key).length])), [rows])
  const list = status === 'all' ? rows : rows.filter(r => (r.answers._status || 'new') === status)

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold text-orange-500 tracking-wider uppercase">Crate Admin</p>
            <h1 className="text-2xl font-black text-slate-900">{isAr ? 'طلبات المشترين' : 'Buyer requests'}</h1>
            <p className="text-sm text-slate-400 mt-0.5">{isAr ? 'مشترون في الإمارات يطلبون عروض موردين — كل طلب مع العروض المطابقة له.' : 'UAE buyers asking for supplier offers — each with the offers that match it.'}</p>
          </div>
          <div className="flex gap-2">
            <a href={`/${isAr ? 'ar' : 'en'}/source`} target="_blank" rel="noopener" className="px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-white">{isAr ? 'فتح الصفحة' : 'Open the page'}</a>
            <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-white">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}{isAr ? 'تحديث' : 'Refresh'}</button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {BR_STATUSES.map(s => (
            <button key={s.key} type="button" onClick={() => setStatus(status === s.key ? 'all' : s.key)} className={`rounded-2xl border-2 p-3 text-center bg-white ${status === s.key ? 'border-orange-400' : 'border-slate-200'}`}>
              <div className="text-xl font-black text-slate-900 tabular-nums">{counts[s.key] ?? 0}</div>
              <div className="text-[11px] text-slate-500">{isAr ? s.label.ar : s.label.en}</div>
            </button>
          ))}
        </div>
        <div className="space-y-2.5">
          {loading ? <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-orange-400 animate-spin" /></div>
            : list.length === 0 ? <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-400">{isAr ? 'لا طلبات بعد.' : 'No requests yet.'}</div>
            : list.map(r => <RequestCard key={r.id} r={r} isAr={isAr} onChanged={(id, answers) => setRows(prev => prev.map(x => (x.id === id ? { ...x, answers } : x)))} />)}
        </div>
      </div>
    </div>
  )
}
