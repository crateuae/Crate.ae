'use client'
import { useEffect, useMemo, useState } from 'react'
import { Compass, Printer, ScanLine, Mail, Check, AlertTriangle, ExternalLink } from 'lucide-react'
import { CATEGORIES, EMIRATES, routeProduct, parseAnswers, answersToQuery, type Answers, type Bi } from '@/lib/portal-router/rules'
import { useLeadGate } from '@/components/leadgate/LeadGateProvider'

const DEFAULT: Answers = { category: 'food', emirate: 'dubai', imported: true, animal: false, ecasWatch: false, claims: false }

export default function PortalRouterClient({ locale, faq }: { locale: 'ar' | 'en'; faq: string[][] }) {
  const isAr = locale === 'ar'
  const t = (b: Bi) => (isAr ? b.ar : b.en)
  const [a, setA] = useState<Answers>(DEFAULT)
  const [hydrated, setHydrated] = useState(false)
  const { gate } = useLeadGate()

  // Shareable state: read on load, write on change (no reload, no history spam).
  useEffect(() => {
    const parsed = parseAnswers(new URLSearchParams(window.location.search))
    if (parsed) setA(parsed)
    setHydrated(true)
  }, [])
  useEffect(() => {
    if (!hydrated) return
    window.history.replaceState(null, '', `${window.location.pathname}?${answersToQuery(a)}`)
  }, [a, hydrated])

  const result = useMemo(() => routeProduct(a), [a])
  const set = (patch: Partial<Answers>) => setA(prev => {
    const next = { ...prev, ...patch }
    if (next.category !== 'food') { next.animal = false; next.ecasWatch = false }
    if (next.category !== 'supplement') next.claims = false
    return next
  })

  const T = {
    eyebrow: isAr ? 'أداة مجانية · نتيجة فورية' : 'Free tool · instant result',
    title: isAr ? 'أين أسجّل منتجي في الإمارات؟' : 'Which UAE portal registers my product?',
    sub: isAr
      ? 'اختر نوع المنتج والإمارة، وتحصل على الجهة والبوابة والرسوم الرسمية والمستندات والمدة، بالترتيب الصحيح. منتاجي، FIRS/زاد، مؤسسة الإمارات للدواء، ADAFSA، MoIAT.'
      : 'Pick the product type and emirate → the authority, portal, official fees, documents and timeline, in the right order. Montaji, FIRS/ZAD, EDE, ADAFSA, MoIAT.',
    q1: isAr ? '١. ما نوع المنتج؟' : '1. What is the product?',
    q2: isAr ? '٢. أين ستبيعه أو تستورده؟' : '2. Where will you import or sell it?',
    q3: isAr ? '٣. تفاصيل تغيّر المسار' : '3. Details that change the route',
    imported: isAr ? 'مستورد من الخارج' : 'Imported',
    local: isAr ? 'مصنّع محلياً' : 'Made in the UAE',
    animal: isAr ? 'يحتوي لحوماً/دواجن أو مكوّنات حيوانية (جيلاتين، إنزيمات)' : 'Contains meat/poultry or animal-derived ingredients (gelatin, enzymes)',
    ecas: isAr ? 'مياه معبأة، مشروب طاقة، عسل، عصير، أو منتج ألبان' : 'Bottled water, energy drink, honey, juice, or dairy',
    claims: isAr ? 'الملصق أو التسويق يذكر علاجاً أو وقاية من مرض، أو يحوي مادة فعّالة دوائية' : 'Label or marketing claims to treat/prevent a disease, or contains a pharmaceutical active',
    steps: isAr ? 'الخطوات بالترتيب' : 'Steps, in order',
    fees: isAr ? 'الرسوم' : 'Fees',
    time: isAr ? 'المدة' : 'Timeline',
    docs: isAr ? 'قائمة المستندات' : 'Document checklist',
    rej: isAr ? 'أكثر أسباب الرفض' : 'Most common rejection reasons',
    warn: isAr ? 'انتبه' : 'Watch out',
    sources: isAr ? 'المصادر (مراجعة 2026-09-24)' : 'Sources (reviewed 2026-09-24)',
    print: isAr ? 'طباعة / حفظ PDF' : 'Print / save as PDF',
    scan: isAr ? 'افحص ملصقي مجاناً' : 'Pre-check my label (free)',
    emailTitle: isAr ? 'أرسل لي هذه القائمة بالبريد' : 'Email me this checklist',
    emailSub: isAr ? 'نفس النتيجة كمستند جاهز للطباعة، مع روابط الجهات.' : 'The same result as a print-ready document, with authority links.',
    email: isAr ? 'البريد الإلكتروني *' : 'Email *',
    name: isAr ? 'الاسم' : 'Name',
    company: isAr ? 'الشركة' : 'Company',
    phone: isAr ? 'واتساب' : 'WhatsApp',
    consent: isAr ? 'أوافق على تلقي تحديثات الامتثال في الإمارات من Crate (اختياري، يمكن الإلغاء في أي وقت)' : 'Send me UAE compliance updates from Crate (optional, unsubscribe any time)',
    send: isAr ? 'أرسل القائمة' : 'Send the checklist',
    sending: isAr ? 'جارٍ الإرسال…' : 'Sending…',
    sent: isAr ? 'أُرسلت. تفقّد بريدك (وصندوق الرسائل غير المرغوبة).' : 'Sent. Check your inbox (and spam folder).',
    fail: isAr ? 'تعذّر الإرسال، حاول مرة أخرى.' : 'Could not send — please try again.',
    disclaimer: isAr
      ? 'دليل إرشادي مبني على المصادر الرسمية والأرقام المنقولة عن الاستشاريين حيث أُشير إلى ذلك. الجهة المختصة هي المرجع النهائي، والرسوم تتغير.'
      : 'Guidance built from official sources and consultant-reported figures where marked. The competent authority is the final reference; fees change.',
    faq: isAr ? 'أسئلة شائعة' : 'Frequently asked',
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 print:bg-white print:py-0" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 text-center print:text-start">
          <div className="text-xs text-orange-600 tracking-wide mb-2 print:hidden">{T.eyebrow}</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2 print:justify-start print:text-2xl">
            <Compass className="w-7 h-7 text-orange-500 print:hidden" />{T.title}
          </h1>
          <p className="text-gray-500 text-sm max-w-2xl mx-auto print:hidden">{T.sub}</p>
        </div>

        {/* Inputs */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 print:hidden">
          <div className="text-sm font-semibold text-gray-800 mb-2">{T.q1}</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
            {CATEGORIES.map(c => (
              <button key={c.key} type="button" onClick={() => set({ category: c.key })}
                className={`text-start rounded-xl border px-3 py-2.5 transition ${a.category === c.key ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-200'}`}>
                <div className="text-sm text-gray-900">{t(c.label)}</div>
                <div className="text-[11px] text-gray-400 leading-snug">{t(c.hint)}</div>
              </button>
            ))}
          </div>

          <div className="text-sm font-semibold text-gray-800 mb-2">{T.q2}</div>
          <div className="flex flex-wrap gap-2 mb-5">
            {EMIRATES.map(e => (
              <button key={e.key} type="button" onClick={() => set({ emirate: e.key })}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${a.emirate === e.key ? 'border-orange-400 bg-orange-50 text-gray-900' : 'border-gray-200 text-gray-600 hover:border-orange-200'}`}>
                {t(e.label)}
              </button>
            ))}
          </div>

          <div className="text-sm font-semibold text-gray-800 mb-2">{T.q3}</div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              {[true, false].map(v => (
                <button key={String(v)} type="button" onClick={() => set({ imported: v })}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${a.imported === v ? 'border-orange-400 bg-orange-50 text-gray-900' : 'border-gray-200 text-gray-600 hover:border-orange-200'}`}>
                  {v ? T.imported : T.local}
                </button>
              ))}
            </div>
            {a.category === 'food' && (
              <>
                <Toggle checked={a.animal} onChange={v => set({ animal: v })} label={T.animal} />
                <Toggle checked={a.ecasWatch} onChange={v => set({ ecasWatch: v })} label={T.ecas} />
              </>
            )}
            {a.category === 'supplement' && <Toggle checked={a.claims} onChange={v => set({ claims: v })} label={T.claims} />}
          </div>
        </div>

        {/* Result */}
        <div className="bg-white border-2 border-orange-100 rounded-2xl p-5 mb-4 print:border-0 print:p-0">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">{t(result.headline)}</h2>
          <div className="text-xs text-gray-400 mb-4">{t(CATEGORIES.find(c => c.key === a.category)!.label)} · {t(EMIRATES.find(e => e.key === a.emirate)!.label)} · {a.imported ? T.imported : T.local}</div>

          <div className="text-sm font-semibold text-gray-800 mb-2">{T.steps}</div>
          <ol className="flex flex-col gap-3 mb-5">
            {result.steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-500 text-white text-sm flex items-center justify-center tabular-nums">{i + 1}</span>
                <div className="min-w-0">
                  <div className="text-sm text-gray-900"><span className="font-semibold">{t(s.portal)}</span> <span className="text-gray-400">— {t(s.authority)}</span></div>
                  <div className="text-sm text-gray-600 mt-0.5">{t(s.purpose)}</div>
                  {s.fee && <div className="text-xs text-gray-500 mt-1">{T.fees}: {t(s.fee)}</div>}
                  {s.time && <div className="text-xs text-gray-500">{T.time}: {t(s.time)}</div>}
                  <a href={s.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-xs text-orange-600 mt-1 print:text-gray-500">{s.url}<ExternalLink className="w-3 h-3 print:hidden" /></a>
                </div>
              </li>
            ))}
          </ol>

          {result.warnings.length > 0 && (
            <div className="rounded-xl bg-orange-50 border border-orange-100 p-3 mb-5">
              <div className="text-sm font-semibold text-gray-800 flex items-center gap-1.5 mb-1"><AlertTriangle className="w-4 h-4 text-orange-500" />{T.warn}</div>
              <ul className="list-disc ps-5 text-sm text-gray-700 flex flex-col gap-1">{result.warnings.map((w, i) => <li key={i}>{t(w)}</li>)}</ul>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-5 mb-5">
            <div>
              <div className="text-sm font-semibold text-gray-800 mb-2">{T.docs}</div>
              <ul className="flex flex-col gap-1.5 text-sm text-gray-700">
                {result.documents.map((d, i) => <li key={i} className="flex gap-2"><Check className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" /><span>{t(d)}</span></li>)}
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-800 mb-2">{T.rej}</div>
              <ul className="list-disc ps-5 text-sm text-gray-700 flex flex-col gap-1.5">{result.rejections.map((r, i) => <li key={i}>{t(r)}</li>)}</ul>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 print:hidden">
            <button type="button" onClick={() => gate({
              kind: 'pdf',
              title: `مسار التسجيل: ${CATEGORIES.find(c => c.key === a.category)!.label.ar} — ${EMIRATES.find(e => e.key === a.emirate)!.label.ar}`,
              category: `موجّه البوابات · ${CATEGORIES.find(c => c.key === a.category)!.label.ar} · ${EMIRATES.find(e => e.key === a.emirate)!.label.ar}`,
              run: () => window.print(),
            })} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:border-orange-300"><Printer className="w-4 h-4" />{T.print}</button>
            <a href={`/${locale}/compliance`} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:border-orange-300"><ScanLine className="w-4 h-4" />{T.scan}</a>
          </div>

          <div className="text-[11px] text-gray-400 mt-4">{T.disclaimer}</div>
          <div className="text-[11px] text-gray-400 mt-2">
            <span className="font-semibold">{T.sources}:</span>{' '}
            {result.sources.map((s, i) => <span key={s.url}>{i > 0 && ' · '}<a href={s.url} target="_blank" rel="noopener" className="hover:text-orange-600">{s.label}</a></span>)}
          </div>
        </div>

        <EmailCapture answers={a} locale={locale} T={T} />

        <div className="bg-white border border-gray-200 rounded-2xl p-5 mt-4 print:hidden">
          <h2 className="text-base font-semibold text-gray-900 mb-3">{T.faq}</h2>
          <div className="flex flex-col gap-3">
            {faq.map(([q, ans]) => (
              <div key={q}>
                <div className="text-sm font-semibold text-gray-800">{q}</div>
                <div className="text-sm text-gray-600 mt-0.5">{ans}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-start gap-2 cursor-pointer text-sm text-gray-700">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="mt-1 accent-orange-500" />
      <span>{label}</span>
    </label>
  )
}

function EmailCapture({ answers, locale, T }: { answers: Answers; locale: 'ar' | 'en'; T: Record<string, string> }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [consent, setConsent] = useState(false)
  const [website, setWebsite] = useState('') // honeypot
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'fail'>('idle')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (state === 'sending') return
    setState('sending')
    try {
      const r = await fetch('/api/tools/portal-router', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, name, company, phone, consent, website, locale, answers, source_page: window.location.pathname + window.location.search }),
      })
      const j = await r.json().catch(() => ({}))
      setState(r.ok && j.ok ? 'sent' : 'fail')
    } catch { setState('fail') }
  }

  const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400'
  return (
    <form onSubmit={submit} className="bg-white border border-gray-200 rounded-2xl p-5 print:hidden">
      <div className="flex items-center gap-2 mb-1"><Mail className="w-5 h-5 text-orange-500" /><h2 className="text-base font-semibold text-gray-900">{T.emailTitle}</h2></div>
      <p className="text-sm text-gray-500 mb-4">{T.emailSub}</p>
      {state === 'sent' ? (
        <div className="rounded-xl bg-orange-50 border border-orange-100 p-3 text-sm text-gray-800 flex items-center gap-2"><Check className="w-4 h-4 text-orange-500" />{T.sent}</div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder={T.email} className={inp} autoComplete="email" />
            <input value={name} onChange={e => setName(e.target.value)} placeholder={T.name} className={inp} autoComplete="name" />
            <input value={company} onChange={e => setCompany(e.target.value)} placeholder={T.company} className={inp} autoComplete="organization" />
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder={T.phone} className={inp} autoComplete="tel" inputMode="tel" />
            <input value={website} onChange={e => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          </div>
          <label className="flex items-start gap-2 text-xs text-gray-600 mb-4 cursor-pointer">
            <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5 accent-orange-500" />
            <span>{T.consent}</span>
          </label>
          <button type="submit" disabled={state === 'sending'} className="rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm px-5 py-2.5">
            {state === 'sending' ? T.sending : T.send}
          </button>
          {state === 'fail' && <div className="text-sm text-red-600 mt-2">{T.fail}</div>}
        </>
      )}
    </form>
  )
}
