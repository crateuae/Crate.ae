'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  Inbox, Store, Package, Repeat2, ShoppingBasket, Loader2, X, Plus,
  Mail, Phone, Building2, FileText, Send, CheckCircle2, MessageSquare,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type Source = 'trader' | 'packaging' | 'repack' | 'basket'
type Status = 'new' | 'contacted' | 'quoted' | 'won' | 'lost'
const STATUSES: Status[] = ['new', 'contacted', 'quoted', 'won', 'lost']

interface Req {
  id: string; source: Source; title: string
  contact_name: string | null; email: string | null; phone: string | null
  company: string | null; notes: string | null
  status: string; admin_notes: string | null; created_at: string
  detail: Record<string, unknown>
}

const SECTIONS: { key: Source; ar: string; Icon: typeof Store; color: string }[] = [
  { key: 'trader',    ar: 'تواصل مع التجار (RFQ)',     Icon: Store,          color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { key: 'packaging', ar: 'تغليف المنتجات',            Icon: Package,        color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { key: 'basket',    ar: 'السلال الغذائية المختلطة',  Icon: ShoppingBasket, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { key: 'repack',    ar: 'إعادة التعبئة',             Icon: Repeat2,        color: 'text-purple-600 bg-purple-50 border-purple-200' },
]

const STATUS_STYLE: Record<string, string> = {
  new: 'bg-sky-50 text-sky-700 border-sky-200',
  contacted: 'bg-amber-50 text-amber-700 border-amber-200',
  quoted: 'bg-violet-50 text-violet-700 border-violet-200',
  won: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  lost: 'bg-red-50 text-red-600 border-red-200',
}
const STATUS_AR: Record<string, string> = {
  new: 'جديد', contacted: 'تم التواصل', quoted: 'عرض أُرسل', won: 'مكسوب', lost: 'مفقود',
}
const sectionMeta = (s: Source) => SECTIONS.find(x => x.key === s)!

export default function UnifiedRequestsPage() {
  const { locale } = useParams()
  const isAr = locale === 'ar'
  const [tab, setTab] = useState<Source | 'all'>('all')
  const [items, setItems] = useState<Req[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [sel, setSel] = useState<Req | null>(null)
  const [creating, setCreating] = useState(false)

  const load = useCallback(async (section: Source | 'all') => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/requests?section=${section}`, { cache: 'no-store' })
      const d = await res.json()
      setItems(d.items ?? [])
      setCounts(d.counts ?? {})
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load(tab) }, [tab, load])

  async function patch(r: Req, body: { status?: string; admin_notes?: string }) {
    await fetch('/api/admin/requests', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: r.id, source: r.source, ...body }),
    })
    setItems(prev => prev.map(x => x.id === r.id ? { ...x, ...body } : x))
    if (sel?.id === r.id) setSel(s => s ? { ...s, ...body } : s)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Inbox className="w-6 h-6 text-slate-700" />
          <div>
            <h1 className="text-xl font-black text-slate-900">{isAr ? 'صندوق الطلبات الموحّد' : 'Unified Requests'}</h1>
            <p className="text-xs text-slate-500">{(counts.all ?? 0)} {isAr ? 'طلب — كل الأنواع في مكان واحد' : 'requests — all types in one place'}</p>
          </div>
        </div>
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors">
          <Plus className="w-4 h-4" />{isAr ? 'طلب جديد' : 'New request'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <button onClick={() => setTab('all')}
          className={`px-3 py-2 rounded-xl text-sm font-bold border transition-all ${tab === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
          {isAr ? 'الكل' : 'All'} <span className="text-xs opacity-70">{counts.all ?? 0}</span>
        </button>
        {SECTIONS.map(s => (
          <button key={s.key} onClick={() => setTab(s.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold border transition-all ${tab === s.key ? s.color : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
            <s.Icon className="w-4 h-4" />{s.ar} <span className="text-xs opacity-70">{counts[s.key] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        {/* List */}
        <div className="flex-1 space-y-2">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 text-slate-400 text-sm">{isAr ? 'لا طلبات في هذا القسم' : 'No requests here'}</div>
          ) : items.map(r => {
            const m = sectionMeta(r.source)
            return (
              <div key={r.id} onClick={() => setSel(r)}
                className={`bg-white border rounded-2xl p-4 cursor-pointer hover:shadow-sm transition-all ${sel?.id === r.id ? 'border-slate-400 ring-1 ring-slate-200' : 'border-slate-200'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <m.Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${m.color.split(' ')[0]}`} />
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 truncate">{r.title}</div>
                      <div className="text-xs text-slate-500 truncate">
                        {r.contact_name}{r.company ? ` · ${r.company}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium ${STATUS_STYLE[r.status] ?? STATUS_STYLE.new}`}>
                      {STATUS_AR[r.status] ?? r.status}
                    </span>
                    <span className="text-[10px] text-slate-400">{new Date(r.created_at).toLocaleDateString('ar-AE')}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Detail */}
        {sel && <DetailPanel r={sel} isAr={isAr} onClose={() => setSel(null)} onPatch={patch} />}
      </div>

      {creating && <CreateModal isAr={isAr} onClose={() => setCreating(false)} onDone={() => { setCreating(false); load(tab) }} />}
    </div>
  )
}

// ─── Detail panel ────────────────────────────────────────────────────────────

function DetailPanel({ r, isAr, onClose, onPatch }: {
  r: Req; isAr: boolean; onClose: () => void; onPatch: (r: Req, b: { status?: string; admin_notes?: string }) => Promise<void>
}) {
  const [notes, setNotes] = useState(r.admin_notes ?? '')
  const [reply, setReply] = useState('')
  const [subject, setSubject] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [saving, setSaving] = useState(false)
  const m = sectionMeta(r.source)

  useEffect(() => { setNotes(r.admin_notes ?? ''); setReply(''); setSubject(''); setSent(false) }, [r.id, r.admin_notes])

  async function sendReply() {
    if (!r.email || !reply.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/admin/requests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: r.id, source: r.source, to: r.email, subject, message: reply }),
      })
      if (res.ok) { setSent(true); onPatch(r, { status: 'contacted' }) }
    } finally { setSending(false) }
  }

  return (
    <div className="w-80 flex-shrink-0 bg-white border border-slate-200 rounded-2xl p-5 self-start sticky top-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <m.Icon className={`w-4 h-4 ${m.color.split(' ')[0]}`} />
          <h2 className="font-black text-slate-900 text-sm leading-tight">{r.title}</h2>
        </div>
        <button onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>
      </div>
      <span className={`inline-block text-[10px] px-2 py-0.5 rounded-lg border font-medium mb-3 ${m.color}`}>{m.ar}</span>

      {/* Contact */}
      <div className="space-y-1.5 text-xs text-slate-600 mb-4">
        {r.contact_name && <div className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-slate-400" />{r.contact_name}</div>}
        {r.company && <div className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-slate-400" />{r.company}</div>}
        {r.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400" />{r.email}</div>}
        {r.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400" />{r.phone}</div>}
        {r.notes && <div className="flex items-start gap-2"><MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5" /><span>{r.notes}</span></div>}
      </div>

      {/* Status */}
      <p className="text-[10px] text-slate-400 mb-1.5 font-bold">{isAr ? 'مرحلة الطلب' : 'Stage'}</p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {STATUSES.map(s => (
          <button key={s} onClick={() => onPatch(r, { status: s })}
            className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium transition-all ${r.status === s ? STATUS_STYLE[s] + ' ring-1 ring-offset-1 ring-slate-300' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
            {STATUS_AR[s]}
          </button>
        ))}
      </div>

      {/* Admin notes */}
      <p className="text-[10px] text-slate-400 mb-1 font-bold">{isAr ? 'ملاحظات داخلية' : 'Internal notes'}</p>
      <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none" />
      <button disabled={saving} onClick={async () => { setSaving(true); await onPatch(r, { admin_notes: notes }); setSaving(false) }}
        className="mt-2 w-full py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 flex items-center justify-center gap-1">
        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}{isAr ? 'حفظ الملاحظة' : 'Save note'}
      </button>

      {/* Reply by email */}
      {r.email && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 mb-1.5 font-bold">{isAr ? `ردّ على ${r.email}` : `Reply to ${r.email}`}</p>
          {sent ? (
            <div className="text-xs text-emerald-600 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" />{isAr ? 'أُرسل الرد' : 'Reply sent'}</div>
          ) : (
            <>
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder={isAr ? 'الموضوع' : 'Subject'}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs mb-2 focus:outline-none focus:ring-2 focus:ring-slate-300" />
              <textarea value={reply} onChange={e => setReply(e.target.value)} rows={3} placeholder={isAr ? 'اكتب ردّك…' : 'Write your reply…'}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none" />
              <button disabled={sending || !reply.trim()} onClick={sendReply}
                className="mt-2 w-full py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-1.5">
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}{isAr ? 'إرسال عبر Resend' : 'Send via Resend'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Create modal ────────────────────────────────────────────────────────────

function CreateModal({ isAr, onClose, onDone }: { isAr: boolean; onClose: () => void; onDone: () => void }) {
  const [source, setSource] = useState<Source>('trader')
  const [f, setF] = useState({ title: '', contact_name: '', email: '', phone: '', company: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!f.contact_name.trim()) return
    setSaving(true)
    try {
      await fetch('/api/admin/requests', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, ...f }),
      })
      onDone()
    } finally { setSaving(false) }
  }
  const inp = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto" dir={isAr ? 'rtl' : 'ltr'}>
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-xl w-full max-w-md my-8 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-slate-900 text-sm">{isAr ? 'إنشاء طلب يدوي' : 'New request'}</h2>
          <button type="button" onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 mb-1.5 font-bold">{isAr ? 'القسم' : 'Section'}</p>
          <div className="grid grid-cols-2 gap-1.5">
            {SECTIONS.map(s => (
              <button key={s.key} type="button" onClick={() => setSource(s.key)}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[11px] font-bold border transition-all ${source === s.key ? s.color : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                <s.Icon className="w-3.5 h-3.5" />{s.ar}
              </button>
            ))}
          </div>
        </div>
        <input value={f.title} onChange={e => set('title', e.target.value)} placeholder={isAr ? 'المنتج / عنوان الطلب' : 'Product / title'} className={inp} />
        <div className="grid grid-cols-2 gap-2">
          <input required value={f.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder={isAr ? 'اسم العميل *' : 'Contact name *'} className={inp} />
          <input value={f.company} onChange={e => set('company', e.target.value)} placeholder={isAr ? 'الشركة' : 'Company'} className={inp} />
          <input type="email" value={f.email} onChange={e => set('email', e.target.value)} placeholder={isAr ? 'البريد' : 'Email'} className={inp} />
          <input value={f.phone} onChange={e => set('phone', e.target.value)} placeholder={isAr ? 'الهاتف' : 'Phone'} className={inp} />
        </div>
        <textarea value={f.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder={isAr ? 'ملاحظات' : 'Notes'} className={inp + ' resize-none'} />
        <button type="submit" disabled={saving} className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-60 flex items-center justify-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}{isAr ? 'إنشاء' : 'Create'}
        </button>
      </form>
    </div>
  )
}
