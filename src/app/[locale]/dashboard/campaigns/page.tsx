'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  Megaphone, Loader2, Sparkles, Users, Send, FlaskConical, Plus,
  CheckCircle2, Mail, Store, Package, Pencil, Trash2,
} from 'lucide-react'

type Src = 'requesters' | 'providers' | 'manual'
const REQ_SECTIONS = [
  { k: 'trader', ar: 'تواصل تجار' }, { k: 'packaging', ar: 'تغليف' },
  { k: 'basket', ar: 'سلال' }, { k: 'repack', ar: 'إعادة تعبئة' },
]
const CATS = ['Foodstuff Trading','Restaurant','Café & Coffee','Catering','Beverages & Juices','Oils & Fats','Bakery & Pastry','Supermarket']

interface Campaign {
  id: string; name: string; subject: string; body_html: string; status: string
  audience: AudienceSpec; total_recipients: number; sent_count: number; created_at: string
}
interface AudienceSpec {
  source?: Src; request_sources?: string[]; provider_type?: string; category?: string; manual_emails?: string[]
}

export default function CampaignsPage() {
  const { locale } = useParams()
  const isAr = locale === 'ar'
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingId, setSendingId] = useState<string | null>(null)

  // builder state
  const [src, setSrc] = useState<Src>('requesters')
  const [reqSecs, setReqSecs] = useState<string[]>(['trader', 'packaging', 'basket', 'repack'])
  const [provType, setProvType] = useState('')
  const [category, setCategory] = useState('')
  const [manualEmails, setManualEmails] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [brief, setBrief] = useState('')
  const [gen, setGen] = useState(false)
  const [audience, setAudience] = useState<{ count: number; sample: { email: string }[] } | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [creating, setCreating] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await (await fetch('/api/admin/campaigns', { cache: 'no-store' })).json()
      setCampaigns(d.campaigns ?? [])
    } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  function parseEmails(s: string): string[] {
    return s.split(/[\s,;\n]+/).map(e => e.trim().toLowerCase()).filter(e => e.includes('@'))
  }
  function audienceSpec(): AudienceSpec {
    const manual_emails = parseEmails(manualEmails)
    if (src === 'manual') return { source: 'manual', manual_emails }
    if (src === 'requesters') return { source: 'requesters', request_sources: reqSecs, manual_emails }
    return { source: 'providers', provider_type: provType || undefined, category: category || undefined, manual_emails }
  }

  function resetForm() {
    setEditingId(null); setName(''); setSubject(''); setBody(''); setBrief('')
    setManualEmails(''); setAudience(null); setSrc('requesters'); setReqSecs(['trader', 'packaging', 'basket', 'repack'])
    setProvType(''); setCategory('')
  }

  function loadForEdit(c: Campaign) {
    const a = c.audience ?? {}
    setEditingId(c.id); setName(c.name); setSubject(c.subject); setBody(c.body_html); setBrief('')
    setSrc(a.source ?? 'requesters')
    setReqSecs(a.request_sources ?? ['trader', 'packaging', 'basket', 'repack'])
    setProvType(a.provider_type ?? ''); setCategory(a.category ?? '')
    setManualEmails((a.manual_emails ?? []).join('\n'))
    setAudience(null); setMsg(isAr ? `تحرير: ${c.name}` : `Editing: ${c.name}`)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function preview() {
    setPreviewing(true); setAudience(null)
    try {
      const d = await (await fetch('/api/admin/campaigns/audience', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(audienceSpec()),
      })).json()
      setAudience(d)
    } finally { setPreviewing(false) }
  }

  async function generate() {
    if (!brief.trim()) return
    setGen(true); setMsg(null)
    try {
      const res = await fetch('/api/admin/campaigns/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief, audience_hint: src === 'providers' ? 'UAE food companies' : 'past requesters', lang: isAr ? 'ar' : 'en' }),
      })
      const d = await res.json()
      if (!res.ok) { setMsg((isAr ? 'فشل التوليد: ' : 'Generate failed: ') + (d.error ?? res.status)); return }
      if (d.subject) setSubject(d.subject)
      if (d.body_html) setBody(d.body_html)
      setMsg(isAr ? '✓ تم توليد الموضوع والنص بالأسفل — راجِعهما ثم أنشئ مسودّة' : '✓ Subject & body filled below')
    } catch (e) {
      setMsg((isAr ? 'خطأ: ' : 'Error: ') + (e instanceof Error ? e.message : 'failed'))
    } finally { setGen(false) }
  }

  async function createCampaign() {
    if (!name.trim() || !subject.trim() || !body.trim()) { setMsg(isAr ? 'الاسم والموضوع والنص مطلوبة' : 'name, subject, body required'); return }
    setCreating(true); setMsg(null)
    try {
      const payload = { name, subject, body_html: body, audience: audienceSpec() }
      const r = editingId
        ? await fetch('/api/admin/campaigns', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingId, ...payload }) })
        : await fetch('/api/admin/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const d = await r.json().catch(() => ({}))
      if (r.ok) {
        const was = editingId
        resetForm()
        setMsg(was ? (isAr ? '✓ حُفظت التعديلات' : '✓ Saved') : (isAr ? '✓ أُنشئت الحملة — تجدها في قائمة «الحملات» بالأسفل لتجربتها وإرسالها' : '✓ Created — see it in the list below'))
        await load()
      } else {
        setMsg((isAr ? 'فشل الحفظ: ' : 'Save failed: ') + (d.error ?? r.status))
      }
    } finally { setCreating(false) }
  }

  async function deleteCampaign(id: string) {
    if (!confirm(isAr ? 'حذف هذه الحملة؟' : 'Delete this campaign?')) return
    await fetch('/api/admin/campaigns', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    if (editingId === id) resetForm()
    await load()
  }

  async function testSend(id: string) {
    await fetch('/api/admin/campaigns/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign_id: id, test_email: 'crateuae@gmail.com' }),
    })
    setMsg(isAr ? 'أُرسلت رسالة تجريبية إلى بريدك' : 'Test email sent to your inbox')
  }

  async function sendCampaign(id: string) {
    if (!confirm(isAr ? 'إرسال الحملة لكل الجمهور؟' : 'Send to the whole audience?')) return
    setSendingId(id)
    try {
      const d = await (await fetch('/api/admin/campaigns/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campaign_id: id }),
      })).json()
      setMsg(d.ok ? (isAr ? `أُرسلت ${d.sent} رسالة` : `Sent ${d.sent}`) : (d.error ?? 'error'))
      await load()
    } finally { setSendingId(null) }
  }

  const inp = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"

  return (
    <div className="p-6 max-w-6xl mx-auto" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-3 mb-5">
        <Megaphone className="w-6 h-6 text-violet-600" />
        <div>
          <h1 className="text-xl font-black text-slate-900">{isAr ? 'محرّك الحملات' : 'Campaign Engine'}</h1>
          <p className="text-xs text-slate-500">{isAr ? 'استهدف عملاءك وشركاتك، ولّد إيميلات بالذكاء، وأرسل عبر Resend' : 'Target audiences, AI-generate emails, send via Resend'}</p>
        </div>
      </div>

      {msg && <div className="mb-4 text-xs bg-violet-50 text-violet-700 border border-violet-200 rounded-lg px-3 py-2">{msg}</div>}

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Builder */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-black text-slate-800 flex items-center gap-2"><Users className="w-4 h-4 text-violet-500" />{isAr ? '١. الجمهور المستهدف' : '1. Audience'}</h2>
          <div className="grid grid-cols-3 gap-2">
            {([['requesters', isAr ? 'عملاء سابقون' : 'Requesters', Mail], ['providers', isAr ? 'شركات الدليل' : 'Companies', Store], ['manual', isAr ? 'يدوي' : 'Manual', Plus]] as const).map(([k, lbl, Icon]) => (
              <button key={k} onClick={() => { setSrc(k as Src); setAudience(null) }}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold border transition-all ${src === k ? 'bg-violet-600 text-white border-violet-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                <Icon className="w-3.5 h-3.5" />{lbl}
              </button>
            ))}
          </div>

          {src === 'requesters' && (
            <div className="flex flex-wrap gap-1.5">
              {REQ_SECTIONS.map(s => {
                const on = reqSecs.includes(s.k)
                return <button key={s.k} onClick={() => setReqSecs(p => on ? p.filter(x => x !== s.k) : [...p, s.k])}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold ${on ? 'bg-violet-100 text-violet-700 border-violet-300' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>{s.ar}</button>
              })}
            </div>
          )}
          {src === 'providers' && (
            <div className="grid grid-cols-2 gap-2">
              <select value={provType} onChange={e => setProvType(e.target.value)} className={inp}>
                <option value="">{isAr ? 'كل الأنواع' : 'All types'}</option>
                <option value="trader">{isAr ? 'تجار' : 'Traders'}</option>
                <option value="repackager">{isAr ? 'معبّئون' : 'Repackagers'}</option>
              </select>
              <select value={category} onChange={e => setCategory(e.target.value)} className={inp}>
                <option value="">{isAr ? 'كل التصنيفات' : 'All categories'}</option>
                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {/* Manual emails — merged on top of any source */}
          <div>
            <p className="text-[10px] text-slate-400 mb-1 font-bold">
              {src === 'manual' ? (isAr ? 'إيميلات الجمهور (سطر/فاصلة لكل إيميل)' : 'Audience emails') : (isAr ? 'إضافة إيميلات يدوية (اختياري)' : 'Add manual emails (optional)')}
            </p>
            <textarea value={manualEmails} onChange={e => { setManualEmails(e.target.value); setAudience(null) }} rows={src === 'manual' ? 4 : 2}
              placeholder={'a@x.com, b@y.com'} className={inp + ' resize-none font-mono text-[11px]'} dir="ltr" />
          </div>

          <button onClick={preview} disabled={previewing}
            className="w-full py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 flex items-center justify-center gap-1.5">
            {previewing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}{isAr ? 'احسب الجمهور' : 'Preview audience'}
          </button>
          {audience && (
            <div className="text-xs bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-700">
              <b>{audience.count.toLocaleString()}</b> {isAr ? 'مستلِم بإيميل' : 'recipients'}
              {audience.sample.length > 0 && <div className="text-[10px] text-emerald-600/70 mt-1 truncate">{audience.sample.map(s => s.email).join(' · ')}</div>}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-black text-slate-800 flex items-center gap-2"><Package className="w-4 h-4 text-violet-500" />{isAr ? '٢. محتوى الإيميل' : '2. Email content'}</h2>
          <div className="flex gap-2">
            <input value={brief} onChange={e => setBrief(e.target.value)} placeholder={isAr ? 'فكرة الحملة (لِيولّدها الذكاء)…' : 'Campaign brief for AI…'} className={inp} />
            <button onClick={generate} disabled={gen || !brief.trim()}
              className="px-3 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap">
              {gen ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}{isAr ? 'ولّد' : 'Generate'}
            </button>
          </div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder={isAr ? 'اسم الحملة (داخلي)' : 'Campaign name'} className={inp} />
          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder={isAr ? 'موضوع الإيميل' : 'Subject'} className={inp} />
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={6} placeholder={isAr ? 'نص الإيميل (HTML). الرموز: {{name}} {{company}}' : 'Email body (HTML). Tokens: {{name}} {{company}}'} className={inp + ' resize-none font-mono text-[11px]'} />
          <div className="flex gap-2">
            <button onClick={createCampaign} disabled={creating}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-60 flex items-center justify-center gap-2">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {editingId ? (isAr ? 'حفظ التعديلات' : 'Save changes') : (isAr ? 'إنشاء كمسودّة' : 'Create draft')}
            </button>
            {editingId && (
              <button onClick={resetForm} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Campaigns list */}
      <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-5">
        <h2 className="text-sm font-black text-slate-800 mb-3">{isAr ? 'الحملات' : 'Campaigns'}</h2>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>
        ) : campaigns.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">{isAr ? 'لا حملات بعد' : 'No campaigns yet'}</p>
        ) : (
          <div className="space-y-2">
            {campaigns.map(c => (
              <div key={c.id} className="flex items-center justify-between gap-3 border-b border-slate-50 last:border-0 py-2">
                <div className="min-w-0">
                  <div className="font-bold text-sm text-slate-900 truncate">{c.name}</div>
                  <div className="text-[11px] text-slate-400 truncate">{c.subject}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium ${
                    c.status === 'sent' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : c.status === 'sending' ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : c.status === 'failed' ? 'bg-red-50 text-red-600 border-red-200'
                    : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    {c.status === 'sent' ? `${isAr ? 'أُرسل' : 'sent'} ${c.sent_count}/${c.total_recipients}` : c.status}
                  </span>
                  <button onClick={() => testSend(c.id)} title={isAr ? 'تجربة لبريدك' : 'Test'} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
                    <FlaskConical className="w-3.5 h-3.5" />
                  </button>
                  {c.status === 'draft' && (
                    <>
                      <button onClick={() => loadForEdit(c)} title={isAr ? 'تحرير' : 'Edit'} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteCampaign(c.id)} title={isAr ? 'حذف' : 'Delete'} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => sendCampaign(c.id)} disabled={sendingId === c.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 disabled:opacity-60">
                        {sendingId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}{isAr ? 'إرسال' : 'Send'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
