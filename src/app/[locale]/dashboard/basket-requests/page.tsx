'use client'
import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import {
  Bell, Users, CheckCircle2, Clock, XCircle, TrendingUp,
  Send, ChevronDown, ChevronUp, Loader2, MailOpen, AlertCircle,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
type Status = 'new' | 'contacted' | 'quoted' | 'completed' | 'lost'

interface RfqItem {
  name: string; brand: string; weightKg: number; qty: number
}
interface InputData {
  contact_name?: string; contact_company?: string
  contact_email?: string; contact_phone?: string
  basket_count?: number; total_weight_kg?: number; price_known?: boolean
  carton_name?: string; carton_dims?: string; carton_cost_aed?: number
  items?: RfqItem[]
  _status?: Status; _admin_notes?: string
  _contacted_at?: string; _last_reply?: string
}
interface RfqRecord {
  id: string; created_at: string
  input_data: InputData
  output_data: { pals?: number; flr?: number; ton?: number; cost?: number } | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_META: Record<Status, { label_ar: string; label_en: string; color: string; bg: string; icon: React.FC<{className?:string}> }> = {
  new:       { label_ar:'جديد',           label_en:'New',       color:'text-orange-700', bg:'bg-orange-100',  icon: Bell },
  contacted: { label_ar:'تم التواصل',     label_en:'Contacted', color:'text-blue-700',   bg:'bg-blue-100',    icon: MailOpen },
  quoted:    { label_ar:'عرض سعر أُرسل', label_en:'Quoted',    color:'text-purple-700', bg:'bg-purple-100',  icon: Send },
  completed: { label_ar:'مكتمل',          label_en:'Completed', color:'text-emerald-700',bg:'bg-emerald-100', icon: CheckCircle2 },
  lost:      { label_ar:'ملغى',           label_en:'Lost',      color:'text-slate-500',  bg:'bg-slate-100',   icon: XCircle },
}
const STAGES: Status[] = ['new','contacted','quoted','completed','lost']
const fmt = (n: number) => n.toLocaleString('en-US')

// ─── Reply modal ──────────────────────────────────────────────────────────────
function ReplyModal({
  rfq, isAr, onClose, onSent,
}: { rfq: RfqRecord; isAr: boolean; onClose: ()=>void; onSent: ()=>void }) {
  const d = rfq.input_data
  const [subject, setSubject] = useState(isAr ? 'متابعة طلب عرض سعر الكراتين' : 'Follow-up: Carton Quote Request')
  const [body, setBody]       = useState('')
  const [status, setStatus]   = useState<Status>('contacted')
  const [sending, setSending] = useState(false)
  const [err, setErr]         = useState<string|null>(null)

  async function send() {
    if (!body.trim()) { setErr(isAr ? 'الرسالة فارغة' : 'Message is empty'); return }
    setSending(true); setErr(null)
    const res = await fetch('/api/admin/basket-rfqs', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        id: rfq.id, to_email: d.contact_email, to_name: d.contact_name,
        subject, body, update_status: status,
      }),
    })
    setSending(false)
    if (!res.ok) { setErr(isAr ? 'فشل الإرسال' : 'Send failed'); return }
    onSent()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-900">
          <div>
            <p className="text-white font-black text-sm">{isAr ? 'إرسال رد' : 'Send Reply'}</p>
            <p className="text-slate-400 text-[11px]">{isAr ? 'إلى' : 'To'}: {d.contact_name} · {d.contact_email}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl font-bold">×</button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 mb-1 block">{isAr ? 'الموضوع' : 'Subject'}</label>
            <input value={subject} onChange={e=>setSubject(e.target.value)}
              className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"/>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 mb-1 block">{isAr ? 'نص الرسالة' : 'Message'}</label>
            <textarea value={body} onChange={e=>setBody(e.target.value)} rows={6}
              placeholder={isAr ? 'اكتب ردك هنا...' : 'Type your reply here...'}
              className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 resize-none"/>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 mb-1 block">{isAr ? 'تحديث الحالة بعد الإرسال' : 'Update status after send'}</label>
            <div className="flex gap-1.5 flex-wrap">
              {STAGES.filter(s=>s!=='new').map(s => {
                const m = STATUS_META[s]
                return (
                  <button key={s} onClick={()=>setStatus(s)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-colors ${status===s ? `border-current ${m.color} ${m.bg}` : 'border-slate-200 text-slate-400'}`}>
                    {isAr ? m.label_ar : m.label_en}
                  </button>
                )
              })}
            </div>
          </div>
          {err && <p className="text-xs text-red-500">{err}</p>}
          {!d.contact_email && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0"/>
              <p className="text-xs text-amber-700">{isAr ? 'لا يوجد بريد إلكتروني لهذا العميل' : 'No email address for this client'}</p>
            </div>
          )}
          <button onClick={send} disabled={sending || !d.contact_email}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black py-3 rounded-xl text-sm transition-colors">
            {sending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
            {isAr ? 'إرسال الرد' : 'Send Reply'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Request card ─────────────────────────────────────────────────────────────
function RequestCard({ rfq, isAr, onRefresh }: { rfq: RfqRecord; isAr: boolean; onRefresh: ()=>void }) {
  const d = rfq.input_data
  const out = rfq.output_data
  const curStatus: Status = (d._status as Status) || 'new'
  const [expanded, setExpanded] = useState(false)
  const [replyOpen, setReplyOpen] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [notes, setNotes]   = useState(d._admin_notes || '')
  const [savingNotes, setSavingNotes] = useState(false)

  async function updateStatus(s: Status) {
    setStatusUpdating(true)
    await fetch('/api/admin/basket-rfqs', {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ id: rfq.id, status: s, admin_notes: notes }),
    })
    setStatusUpdating(false)
    onRefresh()
  }

  async function saveNotes() {
    setSavingNotes(true)
    await fetch('/api/admin/basket-rfqs', {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ id: rfq.id, status: curStatus, admin_notes: notes }),
    })
    setSavingNotes(false)
  }

  const m = STATUS_META[curStatus]
  const hasContact = !!(d.contact_name || d.contact_email || d.contact_phone)
  const date = new Date(rfq.created_at).toLocaleDateString(isAr ? 'ar-AE' : 'en-AE', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })

  return (
    <>
      {replyOpen && <ReplyModal rfq={rfq} isAr={isAr} onClose={()=>setReplyOpen(false)} onSent={()=>{ setReplyOpen(false); onRefresh() }}/>}

      <div className={`bg-white border-2 rounded-2xl shadow-sm overflow-hidden transition-all ${curStatus==='new'?'border-orange-200':'border-slate-200'}`}>
        {/* Card header */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${m.bg}`}>
            <m.icon className={`w-4 h-4 ${m.color}`}/>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-black text-slate-900 text-sm">
                {d.contact_name || (isAr ? 'زائر مجهول' : 'Anonymous visitor')}
              </p>
              {d.contact_company && <span className="text-[10px] text-slate-400">{d.contact_company}</span>}
              {!hasContact && (
                <span className="text-[9px] bg-slate-100 text-slate-400 font-bold px-2 py-0.5 rounded-full">
                  {isAr ? 'بدون بيانات تواصل' : 'No contact info'}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">{date}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {d.basket_count && (
              <span className="text-xs font-black text-orange-600 tabular-nums">{fmt(d.basket_count)} {isAr?'سلة':'baskets'}</span>
            )}
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${m.bg} ${m.color}`}>
              {isAr ? m.label_ar : m.label_en}
            </span>
            <button onClick={()=>setExpanded(p=>!p)} className="text-slate-400 hover:text-slate-600 transition-colors">
              {expanded ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
            </button>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-4 border-t border-slate-100 divide-x divide-slate-100 rtl:divide-x-reverse">
          {[
            {v: d.total_weight_kg ? `${Number(d.total_weight_kg).toFixed(1)} kg` : '—', la:'وزن السلة', en:'Weight/basket'},
            {v: out?.pals ? fmt(out.pals) : '—', la:'باليت', en:'Pallets'},
            {v: out?.flr  ? `${out.flr} m²` : '—', la:'مساحة', en:'Floor'},
            {v: d.price_known && out?.cost ? `${fmt(out.cost)} AED` : (isAr?'مطلوب سعر':'Price TBD'), la:'التكلفة', en:'Cost'},
          ].map((s,i)=>(
            <div key={i} className="py-2 text-center">
              <div className="text-xs font-black text-slate-700 tabular-nums" dir="ltr">{s.v}</div>
              <div className="text-[9px] text-slate-400">{isAr?s.la:s.en}</div>
            </div>
          ))}
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="border-t border-slate-100 p-4 space-y-4">
            {/* Contact info */}
            {hasContact && (
              <div className="bg-blue-50 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs">
                {d.contact_name  && <div><span className="text-slate-400">{isAr?'الاسم:':'Name:'}</span> <span className="font-bold">{d.contact_name}</span></div>}
                {d.contact_company && <div><span className="text-slate-400">{isAr?'الشركة:':'Company:'}</span> <span className="font-bold">{d.contact_company}</span></div>}
                {d.contact_email && <div><span className="text-slate-400">{isAr?'البريد:':'Email:'}</span> <a href={`mailto:${d.contact_email}`} className="font-bold text-blue-600">{d.contact_email}</a></div>}
                {d.contact_phone && <div><span className="text-slate-400">{isAr?'الهاتف:':'Phone:'}</span> <span className="font-bold">{d.contact_phone}</span></div>}
              </div>
            )}

            {/* Items table */}
            {d.items && d.items.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-wider">{isAr?'محتويات السلة':'Basket Contents'}</p>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-right py-1.5 px-2 text-slate-500 font-bold">{isAr?'المنتج':'Product'}</th>
                      <th className="text-right py-1.5 px-2 text-slate-500 font-bold">{isAr?'البراند':'Brand'}</th>
                      <th className="text-center py-1.5 px-2 text-slate-500 font-bold">{isAr?'الوزن':'Weight'}</th>
                      <th className="text-center py-1.5 px-2 text-slate-500 font-bold">{isAr?'العدد':'Qty'}</th>
                      <th className="text-center py-1.5 px-2 text-slate-500 font-bold">{isAr?'الإجمالي':'Total'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.items.map((item,i)=>(
                      <tr key={i} className="border-t border-slate-100">
                        <td className="py-1.5 px-2 font-medium">{item.name||'—'}</td>
                        <td className="py-1.5 px-2 text-slate-400">{item.brand||'—'}</td>
                        <td className="py-1.5 px-2 text-center tabular-nums" dir="ltr">{item.weightKg} kg</td>
                        <td className="py-1.5 px-2 text-center tabular-nums">{item.qty}</td>
                        <td className="py-1.5 px-2 text-center font-bold tabular-nums" dir="ltr">{(item.weightKg*item.qty).toFixed(2)} kg</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Carton specs */}
            {d.carton_name && (
              <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1">
                <p className="font-black text-slate-500 mb-1.5">{isAr?'مواصفات الكرتون':'Carton Specs'}</p>
                <div className="grid grid-cols-2 gap-1">
                  <span className="text-slate-400">{isAr?'الاسم:':'Name:'}</span><span className="font-bold">{d.carton_name}</span>
                  <span className="text-slate-400">{isAr?'الأبعاد:':'Dims:'}</span><span className="font-bold" dir="ltr">{d.carton_dims}</span>
                  {d.price_known && d.carton_cost_aed ? (
                    <><span className="text-slate-400">{isAr?'سعر الكرتون:':'Unit cost:'}</span><span className="font-bold" dir="ltr">{Number(d.carton_cost_aed).toFixed(2)} AED</span></>
                  ) : (
                    <><span className="text-slate-400">{isAr?'السعر:':'Price:'}</span><span className="text-orange-500 font-bold">{isAr?'مطلوب عرض سعر':'Quote required'}</span></>
                  )}
                </div>
              </div>
            )}

            {/* Pipeline stages */}
            <div>
              <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-wider">{isAr?'مرحلة الطلب':'Pipeline Stage'}</p>
              <div className="flex gap-1.5 flex-wrap">
                {STAGES.map(s=>{
                  const sm = STATUS_META[s]
                  const active = curStatus === s
                  return (
                    <button key={s} onClick={()=>updateStatus(s)} disabled={statusUpdating}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition-all ${active ? `border-current ${sm.color} ${sm.bg}` : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                      <sm.icon className="w-3 h-3"/>
                      {isAr ? sm.label_ar : sm.label_en}
                    </button>
                  )
                })}
                {statusUpdating && <Loader2 className="w-4 h-4 text-slate-400 animate-spin self-center"/>}
              </div>
            </div>

            {/* Admin notes */}
            <div>
              <p className="text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-wider">{isAr?'ملاحظات الأدمن (داخلية)':'Admin Notes (internal)'}</p>
              <div className="flex gap-2">
                <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2}
                  placeholder={isAr?'أضف ملاحظات...':'Add notes...'}
                  className="flex-1 border-2 border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-400 resize-none"/>
                <button onClick={saveNotes} disabled={savingNotes}
                  className="px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-700 disabled:opacity-40 transition-colors flex-shrink-0">
                  {savingNotes ? <Loader2 className="w-3 h-3 animate-spin"/> : (isAr?'حفظ':'Save')}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              {d.contact_email && (
                <button onClick={()=>setReplyOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition-colors">
                  <Send className="w-3.5 h-3.5"/>
                  {isAr?'إرسال رد':'Send Reply'}
                </button>
              )}
              {d.contact_phone && (
                <a href={`https://wa.me/${d.contact_phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-colors">
                  <span>💬</span>
                  {isAr?'واتساب':'WhatsApp'}
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BasketRequestsPage() {
  const params = useParams()
  const locale = (params.locale as string) || 'ar'
  const isAr = locale === 'ar'

  const [requests, setRequests] = useState<RfqRecord[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState<Status | 'all'>('all')

  async function load() {
    setLoading(true)
    const r = await fetch('/api/admin/basket-rfqs?limit=100')
    const d = await r.json()
    setRequests(d.requests ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Stats
  const stats = useMemo(() => {
    const total     = requests.length
    const withInfo  = requests.filter(r => r.input_data.contact_email || r.input_data.contact_phone).length
    const byStatus  = STAGES.reduce((acc, s) => ({ ...acc, [s]: requests.filter(r => (r.input_data._status || 'new') === s).length }), {} as Record<Status, number>)
    const totalBaskets = requests.reduce((s, r) => s + (r.input_data.basket_count || 0), 0)
    return { total, withInfo, byStatus, totalBaskets }
  }, [requests])

  const filtered = useMemo(() =>
    filter === 'all' ? requests : requests.filter(r => (r.input_data._status || 'new') === filter)
  , [requests, filter])

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold text-orange-500 tracking-wider uppercase">Crate Admin</p>
            <h1 className="text-2xl font-black text-slate-900">{isAr ? 'طلبات تسعير الكراتين' : 'Carton Quote Requests'}</h1>
            <p className="text-sm text-slate-400 mt-0.5">{isAr ? 'السلة الغذائية المختلطة — متابعة ومراسلة' : 'Food basket requests — tracking & replies'}</p>
          </div>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-100 transition-colors">
            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <TrendingUp className="w-4 h-4"/>}
            {isAr ? 'تحديث' : 'Refresh'}
          </button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { v: fmt(stats.total),           la:'إجمالي الطلبات',      en:'Total Requests',   c:'text-slate-900',   bg:'bg-white' },
            { v: fmt(stats.withInfo),         la:'مع بيانات تواصل',     en:'With Contact',     c:'text-blue-700',    bg:'bg-blue-50' },
            { v: fmt(stats.total-stats.withInfo), la:'بدون بيانات',    en:'Anonymous',        c:'text-slate-500',   bg:'bg-slate-100' },
            { v: fmt(stats.totalBaskets),     la:'إجمالي السلال',       en:'Total Baskets',    c:'text-orange-600',  bg:'bg-orange-50' },
          ].map((s,i)=>(
            <div key={i} className={`${s.bg} border border-slate-200 rounded-2xl p-4 text-center shadow-sm`}>
              <div className={`text-2xl font-black tabular-nums ${s.c}`}>{s.v}</div>
              <div className="text-[11px] text-slate-400 mt-1">{isAr?s.la:s.en}</div>
            </div>
          ))}
        </div>

        {/* Pipeline funnel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-black text-slate-400 mb-3 uppercase tracking-wider">{isAr?'مراحل الطلبات':'Pipeline'}</p>
          <div className="flex gap-2 flex-wrap">
            {([{v:'all',la:'الكل',en:'All',cnt:stats.total,bg:'bg-slate-900',tc:'text-white'},...STAGES.map(s=>({
              v:s, la:STATUS_META[s].label_ar, en:STATUS_META[s].label_en,
              cnt:stats.byStatus[s], bg:STATUS_META[s].bg, tc:STATUS_META[s].color,
            }))] as const).map((s: {v: string; la: string; en: string; cnt: number; bg: string; tc: string})=>(
              <button key={s.v} onClick={()=>setFilter(s.v as Status|'all')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all ${filter===s.v?'border-orange-500 shadow-sm':('border-slate-200 hover:border-slate-300')}`}>
                <span className={`min-w-[22px] h-5 rounded-full flex items-center justify-center text-[10px] font-black px-1.5 ${filter===s.v?'bg-orange-500 text-white':s.bg+' '+s.tc}`}>{s.cnt}</span>
                {isAr?s.la:s.en}
              </button>
            ))}
          </div>
        </div>

        {/* Request list */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-orange-400 animate-spin"/>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
              <Bell className="w-10 h-10 text-slate-200 mx-auto mb-3"/>
              <p className="text-slate-400 text-sm">{isAr ? 'لا توجد طلبات بعد' : 'No requests yet'}</p>
            </div>
          ) : filtered.map(rfq => (
            <RequestCard key={rfq.id} rfq={rfq} isAr={isAr} onRefresh={load}/>
          ))}
        </div>
      </div>
    </div>
  )
}
