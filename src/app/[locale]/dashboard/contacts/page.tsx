'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Upload, Loader2, CheckCircle2, XCircle, UserCheck, Mail } from 'lucide-react'

interface Pending {
  id: string; email: string; contact_name: string | null; phone: string | null
  source: string; created_at: string; providers?: { name_en: string | null; slug: string | null }
}

export default function ContactsPage() {
  const { locale } = useParams()
  const isAr = locale === 'ar'
  const [raw, setRaw] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ imported: number; unmatched_count: number; unmatched: string[] } | null>(null)
  const [pending, setPending] = useState<Pending[]>([])

  const loadPending = useCallback(async () => {
    const d = await (await fetch('/api/admin/contacts', { cache: 'no-store' })).json()
    setPending(d.pending ?? [])
  }, [])
  useEffect(() => { loadPending() }, [loadPending])

  // Parse lines: "email, provider_slug" OR "email, company name"
  function parse(): Array<Record<string, string>> {
    return raw.split('\n').map(line => {
      const [email, ref, name, phone] = line.split(',').map(s => s?.trim())
      if (!email?.includes('@')) return null
      const row: Record<string, string> = { email }
      if (ref) { if (/^[a-z0-9-]+$/.test(ref)) row.provider_slug = ref; else row.company = ref }
      if (name) row.contact_name = name
      if (phone) row.phone = phone
      return row
    }).filter(Boolean) as Array<Record<string, string>>
  }

  async function importRows() {
    const rows = parse()
    if (!rows.length) return
    setBusy(true); setResult(null)
    try {
      const d = await (await fetch('/api/admin/contacts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows }),
      })).json()
      setResult(d)
    } finally { setBusy(false) }
  }

  async function decide(id: string, status: 'verified' | 'rejected') {
    await fetch('/api/admin/contacts', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }),
    })
    setPending(p => p.filter(x => x.id !== id))
  }

  return (
    <div className="p-6 max-w-4xl mx-auto" dir={isAr ? 'rtl' : 'ltr'}>
      <h1 className="text-xl font-black text-slate-900 mb-1">{isAr ? 'جهات اتصال الموردين' : 'Supplier Contacts'}</h1>
      <p className="text-xs text-slate-500 mb-6">
        {isAr ? 'إثراء السجل بجهات اتصال موثّقة تُستخدم في حملات التواصل (الموافقة على الاستقبال مطلوبة قانونياً).'
              : 'Enrich the registry with verified, consented contacts used by outreach campaigns.'}
      </p>

      {/* Import */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6">
        <h2 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-3"><Upload className="w-4 h-4 text-orange-500" />{isAr ? 'استيراد قائمة موثّقة' : 'Import verified list'}</h2>
        <p className="text-[11px] text-slate-400 mb-2 font-mono">email, provider-slug-or-company, name (optional), phone (optional)</p>
        <textarea value={raw} onChange={e => setRaw(e.target.value)} rows={6} dir="ltr"
          placeholder={"sales@acme.ae, acme-trading-llc, Ahmed, +9715...\ninfo@foodco.ae, Food Co LLC"}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
        <button onClick={importRows} disabled={busy || !raw.trim()}
          className="mt-3 inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2 rounded-xl disabled:opacity-60">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}{isAr ? 'استيراد' : 'Import'}
        </button>
        {result && (
          <div className="mt-3 text-xs space-y-1">
            <div className="text-emerald-600 font-bold">✓ {isAr ? `تم استيراد ${result.imported}` : `Imported ${result.imported}`}</div>
            {result.unmatched_count > 0 && (
              <div className="text-amber-600">
                {isAr ? `${result.unmatched_count} بلا تطابق (استخدمها في حملة يدوية): ` : `${result.unmatched_count} unmatched (use a manual campaign): `}
                <span className="font-mono text-[10px] text-slate-500">{result.unmatched.slice(0, 8).join(', ')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pending self-claims */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h2 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-3">
          <UserCheck className="w-4 h-4 text-orange-500" />
          {isAr ? `توثيقات بانتظار المراجعة (${pending.length})` : `Self-claims awaiting review (${pending.length})`}
        </h2>
        {pending.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">{isAr ? 'لا توثيقات معلّقة' : 'No pending claims'}</p>
        ) : (
          <div className="space-y-2">
            {pending.map(c => (
              <div key={c.id} className="flex items-center justify-between gap-3 border border-slate-100 rounded-xl p-3">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate">{c.providers?.name_en ?? '—'}</div>
                  <div className="text-[11px] text-slate-500 font-mono truncate">{c.email}{c.contact_name ? ` · ${c.contact_name}` : ''}{c.phone ? ` · ${c.phone}` : ''}</div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => decide(c.id, 'verified')} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold px-3 py-1.5 rounded-lg"><CheckCircle2 className="w-3.5 h-3.5" />{isAr ? 'اعتماد' : 'Verify'}</button>
                  <button onClick={() => decide(c.id, 'rejected')} className="inline-flex items-center gap-1 bg-red-50 text-red-500 hover:bg-red-100 text-xs font-bold px-3 py-1.5 rounded-lg"><XCircle className="w-3.5 h-3.5" />{isAr ? 'رفض' : 'Reject'}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
