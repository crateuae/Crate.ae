'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Upload, Loader2, CheckCircle2, XCircle, UserCheck, Mail, Sparkles, ShieldCheck } from 'lucide-react'

interface Pending {
  id: string; email: string; contact_name: string | null; phone: string | null
  source: string; created_at: string; providers?: { name_en: string | null; slug: string | null }
}

export default function ContactsPage() {
  const { locale } = useParams()
  const isAr = locale === 'ar'
  const [raw, setRaw] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ imported: number; standalone: number; total: number } | null>(null)
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

  const [enriching, setEnriching] = useState(false)
  const [enrichMsg, setEnrichMsg] = useState<string | null>(null)
  async function runEnrichment() {
    setEnriching(true); setEnrichMsg(null)
    try {
      const d = await (await fetch('/api/organism/enrich?limit=15', { method: 'POST' })).json()
      if (d.skipped) setEnrichMsg(isAr ? 'الإثراء غير مُفعّل — أضف GOOGLE_PLACES_API_KEY في Vercel لتشغيله' : 'Inactive — add GOOGLE_PLACES_API_KEY in Vercel to enable')
      else setEnrichMsg(isAr ? `عولجت ${d.processed} · إيميلات ${d.emails_found} · هواتف ${d.phones_found}` : `Processed ${d.processed} · emails ${d.emails_found} · phones ${d.phones_found}`)
      await loadPending()
    } finally { setEnriching(false) }
  }

  const [verifying, setVerifying] = useState(false)
  async function verifyAll() {
    setVerifying(true)
    try {
      await fetch('/api/admin/contacts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ verify_all: true }) })
      setPending([])
    } finally { setVerifying(false) }
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
        <p className="text-[11px] text-slate-400 mb-2">
          {isAr
            ? 'سطر لكل جهة اتصال. الإيميل وحده يكفي، أو أضف: '
            : 'One contact per line. A bare email works, or add: '}
          <span className="font-mono">email, provider-slug-or-company, name, phone</span>
        </p>
        <textarea value={raw} onChange={e => setRaw(e.target.value)} rows={6} dir="ltr"
          placeholder={"sales@acme.ae, acme-trading-llc, Ahmed, +9715...\ninfo@foodco.ae, Food Co LLC"}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
        <button onClick={importRows} disabled={busy || !raw.trim()}
          className="mt-3 inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2 rounded-xl disabled:opacity-60">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}{isAr ? 'استيراد' : 'Import'}
        </button>
        {result && (
          <div className="mt-3 text-xs space-y-1">
            <div className="text-emerald-600 font-bold">
              ✓ {isAr ? `تم استيراد ${result.total} جهة اتصال موثّقة` : `Imported ${result.total} verified contacts`}
            </div>
            <div className="text-slate-500">
              {isAr
                ? `${result.imported} مرتبطة بشركة في السجل · ${result.standalone} مستقلة`
                : `${result.imported} linked to a registry company · ${result.standalone} standalone`}
            </div>
          </div>
        )}
      </div>

      {/* Auto-enrichment (Google Places → website → email) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6">
        <h2 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-orange-500" />{isAr ? 'إثراء شركات التغليف تلقائياً' : 'Auto-enrich packaging suppliers'}</h2>
        <p className="text-[11px] text-slate-400 mb-3">
          {isAr ? 'يبحث عن الموقع والإيميل والهاتف لشركات التغليف من Google Places. دفعة ~15 لكل تشغيل، تُخزّن «بانتظار المراجعة».'
                : 'Finds website/email/phone for packaging suppliers via Google Places. ~15 per run, stored as pending review.'}
        </p>
        <button onClick={runEnrichment} disabled={enriching}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-5 py-2 rounded-xl disabled:opacity-60">
          {enriching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}{isAr ? 'شغّل دفعة إثراء' : 'Run enrichment batch'}
        </button>
        {enrichMsg && <div className="mt-3 text-xs text-slate-600">{enrichMsg}</div>}
      </div>

      {/* Pending self-claims */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-orange-500" />
            {isAr ? `جهات اتصال بانتظار المراجعة (${pending.length})` : `Contacts awaiting review (${pending.length})`}
          </h2>
          {pending.length > 0 && (
            <button onClick={verifyAll} disabled={verifying}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-60">
              {verifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}{isAr ? 'اعتماد الكل' : 'Verify all'}
            </button>
          )}
        </div>
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
