'use client'
/**
 * LEAD GATE — one behaviour for every "download / print / save / scan" action on the site.
 *
 *   signed in            → run the action, toast "done".
 *   anonymous, known     → (email remembered from an earlier gate) record silently, run, toast.
 *   anonymous, unknown   → modal: name (optional) + email (required) + optional mailing-list
 *                          opt-in → record → run → toast. "Download without an account" — no signup.
 *
 * Every anonymous capture lands in the unified requests inbox (/dashboard/rfq) under the
 * "downloads" section, classified by kind + category. Mailing-list consent is stored only
 * when ticked (TDRA). The remembered email lives in localStorage; wrapped in try/catch.
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Download, Mail, X, CheckCircle2, Loader2 } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'

export type GateKind = 'pdf' | 'download' | 'print' | 'scan'
export interface GateAction {
  kind: GateKind
  /** Arabic title shown in the admin inbox, e.g. "ملصق مطابق (Mango Juice)" */
  title: string
  /** Arabic classification, e.g. "موجّه البوابات · أغذية · دبي" */
  category: string
  run: () => void | Promise<void>
}

const LS_KEY = 'crate_lead'
type Remembered = { email: string; name?: string }
const readRemembered = (): Remembered | null => { try { const v = localStorage.getItem(LS_KEY); return v ? JSON.parse(v) : null } catch { return null } }
const writeRemembered = (r: Remembered) => { try { localStorage.setItem(LS_KEY, JSON.stringify(r)) } catch {} }

const Ctx = createContext<{ gate: (a: GateAction) => Promise<void> }>({ gate: async a => { await a.run() } })
export const useLeadGate = () => useContext(Ctx)

export function LeadGateProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/ar'
  const isAr = !pathname.startsWith('/en')
  const locale = isAr ? 'ar' : 'en'
  const { user, loading } = useAuth()
  const loadingRef = useRef(loading)
  useEffect(() => { loadingRef.current = loading }, [loading])

  const [pending, setPending] = useState<GateAction | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const showToast = useCallback((msg: string) => { setToast(msg); window.setTimeout(() => setToast(null), 3500) }, [])

  const doneMsg = (k: GateKind) => isAr
    ? ({ pdf: 'فُتحت نافذة الطباعة — اختر «حفظ كـ PDF»', print: 'فُتحت نافذة الطباعة', download: 'تم التحميل بنجاح', scan: 'بدأ الفحص' }[k])
    : ({ pdf: 'Print dialog opened — choose "Save as PDF"', print: 'Print dialog opened', download: 'Downloaded successfully', scan: 'Scan started' }[k])

  const record = useCallback(async (a: GateAction, who: Remembered, subscribe: boolean) => {
    try {
      await fetch('/api/leads/gate', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: who.email, name: who.name ?? '', subscribe, kind: a.kind, title: a.title, category: a.category, locale, source_page: window.location.pathname + window.location.search }),
      })
    } catch { /* never block the download on analytics */ }
  }, [locale])

  const finish = useCallback(async (a: GateAction) => { await a.run(); showToast(doneMsg(a.kind)) }, [showToast]) // eslint-disable-line react-hooks/exhaustive-deps

  const gate = useCallback(async (a: GateAction) => {
    // Auth state may still be resolving on a fresh page load — give it a moment.
    for (let i = 0; i < 20 && loadingRef.current; i++) await new Promise(r => setTimeout(r, 100))
    if (user) { await finish(a); return }
    const known = readRemembered()
    if (known?.email) { record(a, known, false); await finish(a); return }
    setPending(a)
  }, [user, finish, record])

  const submit = async (who: Remembered, subscribe: boolean) => {
    const a = pending!
    writeRemembered(who)
    await record(a, who, subscribe)
    setPending(null)
    await finish(a)
  }

  return (
    <Ctx.Provider value={{ gate }}>
      {children}
      {pending && <GateModal isAr={isAr} locale={locale} action={pending} onClose={() => setPending(null)} onSubmit={submit} />}
      {toast && (
        <div className="fixed bottom-5 inset-x-0 z-[300] flex justify-center px-4 pointer-events-none" dir={isAr ? 'rtl' : 'ltr'}>
          <div className="bg-white border border-orange-200 shadow-lg rounded-2xl px-4 py-2.5 text-sm text-gray-800 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-orange-500" />{toast}</div>
        </div>
      )}
    </Ctx.Provider>
  )
}

function GateModal({ isAr, locale, action, onClose, onSubmit }: { isAr: boolean; locale: string; action: GateAction; onClose: () => void; onSubmit: (who: Remembered, subscribe: boolean) => Promise<void> }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [subscribe, setSubscribe] = useState(false)
  const [busy, setBusy] = useState(false)
  const verb = isAr
    ? ({ pdf: 'حفظ PDF', print: 'الطباعة', download: 'التحميل', scan: 'الفحص' }[action.kind])
    : ({ pdf: 'save the PDF', print: 'print', download: 'download', scan: 'scan' }[action.kind])
  const T = {
    title: isAr ? `أدخل بريدك لـ${verb}` : `Enter your email to ${verb}`,
    sub: isAr ? 'بدون إنشاء حساب. نرسل لك التحديثات فقط إذا اخترت ذلك.' : 'No account needed. We only email you updates if you opt in.',
    name: isAr ? 'الاسم (اختياري)' : 'Name (optional)',
    email: isAr ? 'البريد الإلكتروني *' : 'Email *',
    subscribe: isAr ? 'اشتركني في القائمة البريدية لتحديثات الاستيراد والامتثال في الإمارات' : 'Subscribe me to UAE import & compliance updates',
    go: isAr ? `${verb} بدون إنشاء حساب` : `${verb.charAt(0).toUpperCase() + verb.slice(1)} without an account`,
    or: isAr ? 'أو' : 'or',
    login: isAr ? 'تسجيل الدخول' : 'Sign in',
  }
  const next = typeof window !== 'undefined' ? encodeURIComponent(window.location.pathname + window.location.search) : ''
  const go = async (e: React.FormEvent) => {
    e.preventDefault(); if (busy) return
    setBusy(true)
    try { await onSubmit({ email: email.trim(), name: name.trim() || undefined }, subscribe) } finally { setBusy(false) }
  }
  const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400'
  return (
    <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" dir={isAr ? 'rtl' : 'ltr'} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <form onSubmit={go} className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-xl p-5">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex items-center gap-2"><span className="w-9 h-9 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">{action.kind === 'scan' ? <Mail className="w-5 h-5" /> : <Download className="w-5 h-5" />}</span><h2 className="text-base font-semibold text-gray-900">{T.title}</h2></div>
          <button type="button" onClick={onClose} aria-label="close" className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-xs text-gray-500 mb-4">{T.sub}</p>
        <div className="flex flex-col gap-2.5 mb-3">
          <input type="email" required autoFocus value={email} onChange={e => setEmail(e.target.value)} placeholder={T.email} className={inp} autoComplete="email" />
          <input value={name} onChange={e => setName(e.target.value)} placeholder={T.name} className={inp} autoComplete="name" />
        </div>
        <label className="flex items-start gap-2 text-xs text-gray-600 mb-4 cursor-pointer">
          <input type="checkbox" checked={subscribe} onChange={e => setSubscribe(e.target.checked)} className="mt-0.5 accent-orange-500" />
          <span>{T.subscribe}</span>
        </label>
        <button type="submit" disabled={busy} className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm py-2.5 flex items-center justify-center gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}{T.go}
        </button>
        <div className="text-center text-xs text-gray-400 mt-3">{T.or} <a href={`/${locale}/login?next=${next}`} className="text-orange-600 hover:underline">{T.login}</a></div>
      </form>
    </div>
  )
}
