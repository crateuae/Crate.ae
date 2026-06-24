'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowRight, Send, Users, CheckCircle2, XCircle, Clock,
  Loader2, Plus, Mail, ChevronLeft, BarChart3, UserPlus, RefreshCw,
} from 'lucide-react'
import Link from 'next/link'

interface Send {
  id: string; email: string; name: string | null
  status: 'sent' | 'failed'; error: string | null; created_at: string
}
interface Campaign {
  id: string; name: string; subject: string; body_html: string
  status: string; total_recipients: number; sent_count: number
  sent_at: string | null; created_at: string
  audience: { source?: string; manual_emails?: string[]; request_sources?: string[] }
}

export default function CampaignDetailPage() {
  const { locale, id } = useParams() as { locale: string; id: string }
  const router = useRouter()
  const isAr = locale === 'ar'

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [sends, setSends] = useState<Send[]>([])
  const [loading, setLoading] = useState(true)
  const [newEmails, setNewEmails] = useState('')
  const [addingEmails, setAddingEmails] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendMode, setSendMode] = useState<'new' | 'all' | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cRes, sRes] = await Promise.all([
        fetch('/api/admin/campaigns').then(r => r.json()),
        fetch(`/api/admin/campaigns/${id}/sends`).then(r => r.json()),
      ])
      const camp = (cRes.campaigns ?? []).find((c: Campaign) => c.id === id)
      setCampaign(camp ?? null)
      setSends(sRes.sends ?? [])
    } finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])

  async function addRecipients() {
    const emails = newEmails.split(/[\s,;\n]+/).map(e => e.trim().toLowerCase()).filter(e => e.includes('@'))
    if (!emails.length) return
    setAddingEmails(true); setMsg(null)
    try {
      const r = await fetch(`/api/admin/campaigns/${id}/sends`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ add_emails: emails }),
      })
      const d = await r.json()
      if (r.ok) {
        setNewEmails('')
        setMsg(isAr ? `✓ أُضيف ${emails.length} إيميل — المجموع الجديد: ${d.total_recipients}` : `✓ Added ${emails.length} emails — new total: ${d.total_recipients}`)
        await load()
      } else { setMsg(d.error ?? 'Error') }
    } finally { setAddingEmails(false) }
  }

  async function sendCampaign(onlyNew: boolean) {
    if (!campaign) return
    if (!confirm(isAr
      ? (onlyNew ? 'إرسال للمستلمين الجدد فقط؟' : 'إرسال لجميع المستلمين؟')
      : (onlyNew ? 'Send to new recipients only?' : 'Send to all recipients?'))) return
    setSending(true); setSendMode(onlyNew ? 'new' : 'all'); setMsg(null)
    try {
      const r = await fetch('/api/admin/campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: id, only_new: onlyNew }),
      })
      const d = await r.json()
      if (r.ok) {
        setMsg(isAr ? `✓ أُرسل ${d.sent} إيميل` : `✓ Sent ${d.sent} emails`)
        await load()
      } else { setMsg(d.error ?? 'Send failed') }
    } finally { setSending(false); setSendMode(null) }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
    </div>
  )
  if (!campaign) return (
    <div className="p-6 text-center text-slate-400">
      {isAr ? 'الحملة غير موجودة' : 'Campaign not found'}
    </div>
  )

  const sentEmails = new Set(sends.filter(s => s.status === 'sent').map(s => s.email))
  const failedCount = sends.filter(s => s.status === 'failed').length
  const sentCount = sends.filter(s => s.status === 'sent').length
  const pending = campaign.total_recipients - campaign.sent_count
  const isSent = campaign.status === 'sent' || campaign.status === 'sending'

  return (
    <div className="p-6 max-w-5xl mx-auto" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-5 text-sm text-slate-400">
        <Link href={`/${locale}/dashboard/campaigns`} className="hover:text-slate-700 flex items-center gap-1">
          <ChevronLeft className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
          {isAr ? 'الحملات' : 'Campaigns'}
        </Link>
        <span>/</span>
        <span className="text-slate-700 font-medium truncate max-w-xs">{campaign.name}</span>
      </div>

      {msg && (
        <div className="mb-4 text-xs bg-violet-50 text-violet-700 border border-violet-200 rounded-lg px-3 py-2">
          {msg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { icon: Users,        label: isAr ? 'إجمالي المستلمين' : 'Total Recipients', value: campaign.total_recipients, color: 'text-slate-700', bg: 'bg-slate-50' },
          { icon: CheckCircle2, label: isAr ? 'تم الإرسال'        : 'Sent',             value: sentCount,                 color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { icon: Clock,        label: isAr ? 'لم يُرسل بعد'      : 'Pending',          value: Math.max(0, pending),      color: 'text-amber-600',  bg: 'bg-amber-50' },
          { icon: XCircle,      label: isAr ? 'فشل الإرسال'       : 'Failed',           value: failedCount,               color: 'text-red-500',    bg: 'bg-red-50' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-4`}>
            <Icon className={`w-5 h-5 ${color} mb-1`} />
            <div className={`text-2xl font-black ${color}`}>{value.toLocaleString()}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {/* Campaign info */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
          <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-500" />{isAr ? 'معلومات الحملة' : 'Campaign Info'}
          </h2>
          <div className="space-y-2 text-xs">
            {[
              { label: isAr ? 'الاسم'    : 'Name',    value: campaign.name },
              { label: isAr ? 'الموضوع'  : 'Subject', value: campaign.subject },
              { label: isAr ? 'الحالة'   : 'Status',  value: campaign.status },
              { label: isAr ? 'أُنشئت'   : 'Created', value: new Date(campaign.created_at).toLocaleString(isAr ? 'ar-AE' : 'en-AE') },
              { label: isAr ? 'أُرسلت'   : 'Sent at', value: campaign.sent_at ? new Date(campaign.sent_at).toLocaleString(isAr ? 'ar-AE' : 'en-AE') : '—' },
              { label: isAr ? 'المصدر'   : 'Source',  value: campaign.audience?.source ?? '—' },
            ].map(row => (
              <div key={row.label} className="flex items-start justify-between gap-4 py-1 border-b border-slate-50 last:border-0">
                <span className="text-slate-400 shrink-0">{row.label}</span>
                <span className="font-semibold text-slate-700 text-end break-all">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Add recipients + send actions */}
        <div className="space-y-3">
          {/* Add new emails */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
            <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-violet-500" />
              {isAr ? 'إضافة مستلمين جدد' : 'Add New Recipients'}
            </h2>
            <textarea
              value={newEmails}
              onChange={e => setNewEmails(e.target.value)}
              rows={3}
              dir="ltr"
              placeholder="email@example.com, another@x.com"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"
            />
            <p className="text-[10px] text-slate-400">
              {isAr
                ? 'أضف إيميلات مفصولة بفاصلة أو سطر جديد — سيتم دمجها مع القائمة الحالية'
                : 'Comma or newline-separated — will merge with existing list'}
            </p>
            <button onClick={addRecipients} disabled={addingEmails || !newEmails.trim()}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 disabled:opacity-50">
              {addingEmails ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {isAr ? 'إضافة للقائمة' : 'Add to list'}
            </button>
          </div>

          {/* Send actions */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
            <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Send className="w-4 h-4 text-violet-500" />
              {isAr ? 'خيارات الإرسال' : 'Send Options'}
            </h2>

            {/* Send to NEW only */}
            <button onClick={() => sendCampaign(true)}
              disabled={sending || Math.max(0, pending) === 0}
              className="w-full flex items-center justify-between gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-40">
              <span className="flex items-center gap-2">
                {sending && sendMode === 'new' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                {isAr ? 'إرسال للجدد فقط' : 'Send to new only'}
              </span>
              <span className="bg-white/20 text-white rounded-lg px-2 py-0.5 text-[10px] font-black">
                {Math.max(0, pending)} {isAr ? 'مستلم' : 'recipients'}
              </span>
            </button>

            {/* Send to ALL */}
            <button onClick={() => sendCampaign(false)}
              disabled={sending || campaign.total_recipients === 0}
              className="w-full flex items-center justify-between gap-2 py-2.5 px-4 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 disabled:opacity-40">
              <span className="flex items-center gap-2">
                {sending && sendMode === 'all' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                {isAr ? 'إرسال للجميع (إعادة إرسال)' : 'Send to all (resend)'}
              </span>
              <span className="bg-white/20 text-white rounded-lg px-2 py-0.5 text-[10px] font-black">
                {campaign.total_recipients} {isAr ? 'مستلم' : 'recipients'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Sends log */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <Mail className="w-4 h-4 text-violet-500" />
            {isAr ? `سجل الإرسال (${sends.length})` : `Send Log (${sends.length})`}
          </h2>
        </div>
        {sends.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            {isAr ? 'لا سجلات بعد' : 'No sends yet'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-start px-4 py-2.5 font-bold text-slate-500">{isAr ? 'البريد الإلكتروني' : 'Email'}</th>
                  <th className="text-start px-4 py-2.5 font-bold text-slate-500">{isAr ? 'الاسم' : 'Name'}</th>
                  <th className="text-start px-4 py-2.5 font-bold text-slate-500">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="text-start px-4 py-2.5 font-bold text-slate-500">{isAr ? 'وقت الإرسال' : 'Sent At'}</th>
                </tr>
              </thead>
              <tbody>
                {sends.map(s => (
                  <tr key={s.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 font-mono text-slate-700">{s.email}</td>
                    <td className="px-4 py-2.5 text-slate-500">{s.name ?? '—'}</td>
                    <td className="px-4 py-2.5">
                      {s.status === 'sent'
                        ? <span className="inline-flex items-center gap-1 text-emerald-700 font-bold"><CheckCircle2 className="w-3 h-3" />{isAr ? 'تم' : 'Sent'}</span>
                        : <span className="inline-flex items-center gap-1 text-red-500 font-bold"><XCircle className="w-3 h-3" />{isAr ? 'فشل' : 'Failed'}</span>}
                    </td>
                    <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">
                      {new Date(s.created_at).toLocaleString(isAr ? 'ar-AE' : 'en-AE', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
