'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import {
  FileText, Phone, Mail, Package, MapPin, DollarSign,
  CheckCircle2, XCircle, Clock, MessageCircle, Loader2, TrendingUp,
} from 'lucide-react'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

const STATUS_OPTIONS = ['new', 'contacted', 'quoted', 'won', 'lost'] as const
type RfqStatus = typeof STATUS_OPTIONS[number]

interface Rfq {
  id: string
  product_name: string
  product_name_ar: string | null
  contact_name: string
  contact_email: string | null
  contact_phone: string | null
  company_name: string | null
  quantity: string | null
  destination: string | null
  budget_aed: number | null
  notes: string | null
  status: RfqStatus
  admin_notes: string | null
  source_page: string | null
  locale: string
  created_at: string
}

const STATUS_STYLE: Record<RfqStatus, string> = {
  new:       'bg-sky-50 text-sky-700 border-sky-200',
  contacted: 'bg-amber-50 text-amber-700 border-amber-200',
  quoted:    'bg-violet-50 text-violet-700 border-violet-200',
  won:       'bg-emerald-50 text-emerald-700 border-emerald-200',
  lost:      'bg-red-50 text-red-600 border-red-200',
}

const STATUS_AR: Record<RfqStatus, string> = {
  new: 'جديد', contacted: 'تم التواصل', quoted: 'عرض أُرسل', won: 'مكسوب ✓', lost: 'مفقود',
}

export default function RfqDashboard() {
  const { locale } = useParams()
  const isAr = locale === 'ar'
  const [rfqs, setRfqs] = useState<Rfq[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<RfqStatus | 'all'>('all')
  const [selected, setSelected] = useState<Rfq | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const supabase = db()
    const q = supabase
      .from('rfq_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    const { data } = await q
    setRfqs((data as Rfq[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const visible = filter === 'all' ? rfqs : rfqs.filter(r => r.status === filter)

  const counts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = rfqs.filter(r => r.status === s).length
    return acc
  }, {} as Record<RfqStatus, number>)

  async function updateStatus(id: string, status: RfqStatus) {
    setSaving(true)
    await db().from('rfq_requests').update({ status }).eq('id', id)
    setRfqs(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    if (selected?.id === id) setSelected(s => s ? { ...s, status } : s)
    setSaving(false)
  }

  async function saveNotes(id: string) {
    setSaving(true)
    await db().from('rfq_requests').update({ admin_notes: adminNotes }).eq('id', id)
    setRfqs(prev => prev.map(r => r.id === id ? { ...r, admin_notes: adminNotes } : r))
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6 text-orange-600" />
        <div>
          <h1 className="text-xl font-black text-gray-900">{isAr ? 'طلبات عروض الأسعار' : 'Quote Requests'}</h1>
          <p className="text-xs text-gray-500">{rfqs.length} {isAr ? 'طلب إجمالي' : 'total requests'}</p>
        </div>
      </div>

      {/* Funnel stats */}
      <div className="grid grid-cols-5 gap-2 mb-6">
        {STATUS_OPTIONS.map(s => (
          <button key={s} onClick={() => setFilter(f => f === s ? 'all' : s)}
            className={`rounded-2xl p-3 border text-center cursor-pointer transition-all ${
              STATUS_STYLE[s]} ${filter === s ? 'ring-2 ring-offset-1 ring-orange-400' : ''}`}>
            <div className="text-2xl font-black">{counts[s]}</div>
            <div className="text-[10px] font-medium">{isAr ? STATUS_AR[s] : s}</div>
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        {/* List */}
        <div className="flex-1 space-y-2">
          {visible.length === 0 && (
            <div className="text-center py-16 text-gray-400 text-sm">
              {isAr ? 'لا طلبات بعد' : 'No requests yet'}
            </div>
          )}
          {visible.map(r => (
            <div key={r.id}
              onClick={() => { setSelected(r); setAdminNotes(r.admin_notes ?? '') }}
              className={`bg-white border rounded-2xl p-4 cursor-pointer hover:shadow-sm transition-all ${
                selected?.id === r.id ? 'border-orange-400 ring-1 ring-orange-200' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-gray-900">
                      {isAr ? (r.product_name_ar || r.product_name) : r.product_name}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium ${STATUS_STYLE[r.status]}`}>
                      {isAr ? STATUS_AR[r.status] : r.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{r.contact_name}</span>
                    {r.company_name && <span>{r.company_name}</span>}
                    {r.quantity && <span className="flex items-center gap-1"><Package className="w-3 h-3" />{r.quantity}</span>}
                  </div>
                </div>
                <div className="text-[10px] text-gray-400 flex-shrink-0">
                  {new Date(r.created_at).toLocaleDateString(isAr ? 'ar-AE' : 'en-AE')}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-80 flex-shrink-0 bg-white border border-gray-200 rounded-2xl p-5 self-start sticky top-4">
            <h2 className="font-black text-gray-900 text-sm mb-4">
              {isAr ? (selected.product_name_ar || selected.product_name) : selected.product_name}
            </h2>

            <div className="space-y-2 text-xs text-gray-600 mb-4">
              <div className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-gray-400" />{selected.contact_name}</div>
              {selected.company_name && <div className="flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5 text-gray-400" />{selected.company_name}</div>}
              {selected.contact_email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-gray-400" />{selected.contact_email}</div>}
              {selected.contact_phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400" />{selected.contact_phone}</div>}
              {selected.quantity && <div className="flex items-center gap-2"><Package className="w-3.5 h-3.5 text-gray-400" />{selected.quantity}</div>}
              {selected.destination && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-gray-400" />{selected.destination}</div>}
              {selected.budget_aed && <div className="flex items-center gap-2"><DollarSign className="w-3.5 h-3.5 text-gray-400" />{selected.budget_aed} AED</div>}
              {selected.notes && <div className="flex items-start gap-2"><MessageCircle className="w-3.5 h-3.5 text-gray-400 mt-0.5" /><span>{selected.notes}</span></div>}
              {selected.source_page && <div className="text-[10px] text-gray-400">{selected.source_page}</div>}
            </div>

            {/* Status changer */}
            <div className="mb-4">
              <p className="text-[10px] text-gray-400 mb-1.5">{isAr ? 'تغيير الحالة' : 'Change status'}</p>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map(s => (
                  <button key={s} disabled={saving} onClick={() => updateStatus(selected.id, s)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium transition-all disabled:opacity-50 ${
                      selected.status === s ? STATUS_STYLE[s] + ' ring-1 ring-offset-1 ring-orange-400' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}>
                    {isAr ? STATUS_AR[s] : s}
                  </button>
                ))}
              </div>
            </div>

            {/* Admin notes */}
            <div>
              <p className="text-[10px] text-gray-400 mb-1">{isAr ? 'ملاحظاتك الداخلية' : 'Internal notes'}</p>
              <textarea
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
              />
              <button disabled={saving} onClick={() => saveNotes(selected.id)}
                className="mt-2 w-full py-1.5 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-1">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                {isAr ? 'حفظ' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
