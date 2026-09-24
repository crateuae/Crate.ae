'use client'
import { useEffect, useMemo, useState } from 'react'
import { BadgeCheck, Printer, Compass, ExternalLink, AlertTriangle, Calculator } from 'lucide-react'
import { FAMILIES, checkCertificates, parseCertAnswers, certAnswersToQuery, type Answers, type Bi, type Status } from '@/lib/certificates/rules'
import { useLeadGate } from '@/components/leadgate/LeadGateProvider'

const DEFAULT: Answers = { family: 'processed_food', imported: true, animal: false, organic: false, halalMark: false }

export default function CertificatesClient({ locale, faq }: { locale: 'ar' | 'en'; faq: string[][] }) {
  const isAr = locale === 'ar'
  const t = (b: Bi) => (isAr ? b.ar : b.en)
  const [a, setA] = useState<Answers>(DEFAULT)
  const [hydrated, setHydrated] = useState(false)
  const { gate } = useLeadGate()

  useEffect(() => { const p = parseCertAnswers(new URLSearchParams(window.location.search)); if (p) setA(p); setHydrated(true) }, [])
  useEffect(() => { if (hydrated) window.history.replaceState(null, '', `${window.location.pathname}?${certAnswersToQuery(a)}`) }, [a, hydrated])

  const r = useMemo(() => checkCertificates(a), [a])
  const fam = FAMILIES.find(f => f.key === a.family)!

  const STATUS: Record<Status, { label: Bi; cls: string }> = {
    mandatory:    { label: { en: 'Mandatory', ar: 'إلزامية' }, cls: 'bg-orange-500 text-white' },
    conditional:  { label: { en: 'Conditional', ar: 'مشروطة' }, cls: 'bg-amber-100 text-amber-800' },
    voluntary:    { label: { en: 'Voluntary', ar: 'اختيارية' }, cls: 'bg-gray-100 text-gray-700' },
    not_required: { label: { en: 'Not required', ar: 'غير مطلوبة' }, cls: 'bg-emerald-50 text-emerald-700' },
  }
  const T = {
    eyebrow: isAr ? 'أداة مجانية · نتيجة فورية' : 'Free tool · instant result',
    title: isAr ? 'هل أحتاج شهادة ESMA / ECAS / EQM / حلال؟ وكم تكلّف؟' : 'Do I need ESMA / ECAS / EQM / Halal? And what does it cost?',
    sub: isAr ? 'اختر عائلة المنتج وبعض التفاصيل → الشهادات الإلزامية والمشروطة والاختيارية، الجهة المصدرة، الرسوم الرسمية والمنقولة، والمدة.' : 'Pick the product family and a few details → mandatory, conditional and voluntary certificates, issuing body, official vs reported fees, and timelines.',
    q1: isAr ? '١. عائلة المنتج' : '1. Product family',
    q2: isAr ? '٢. تفاصيل تغيّر النتيجة' : '2. Details that change the answer',
    imported: isAr ? 'مستورد' : 'Imported', local: isAr ? 'مصنّع محلياً' : 'Made in the UAE',
    animal: isAr ? 'يحتوي مكوّنات حيوانية (جيلاتين، إنزيمات، مصل حليب، كولاجين، نكهة كحولية)' : 'Contains animal-derived ingredients (gelatin, enzymes, whey, collagen, alcohol-based flavour)',
    organic: isAr ? 'العبوة تحمل كلمة «عضوي» أو شعاراً عضوياً' : 'The pack says "organic" or carries an organic logo',
    halal: isAr ? 'أريد طباعة شعار الحلال على العبوة' : 'I want to print a halal logo on the pack',
    issuer: isAr ? 'الجهة' : 'Issuer', std: isAr ? 'المواصفة' : 'Standard', official: isAr ? 'الرسوم الرسمية' : 'Official fees', reported: isAr ? 'رسوم منقولة' : 'Reported fees', time: isAr ? 'المدة' : 'Timeline',
    notes: isAr ? 'ملاحظات' : 'Notes', sources: isAr ? 'المصادر (مراجعة 2026-09-24)' : 'Sources (reviewed 2026-09-24)',
    print: isAr ? 'طباعة / حفظ PDF' : 'Print / save as PDF', router: isAr ? 'أين أسجّل منتجي؟' : 'Where do I register?', cost: isAr ? 'حاسبة التكلفة الواصلة' : 'Landed-cost calculator',
    disclaimer: isAr ? 'دليل إرشادي: الرسوم الرسمية من صفحات وزارة الصناعة المنشورة؛ النطاقات «المنقولة» من الاستشاريين وجهات الإصدار وليست رسمية. القوائم الإلزامية تتغير — الجهة المختصة هي المرجع النهائي.' : 'Guidance: official fees from MoIAT\'s published pages; "reported" ranges come from consultants and certification bodies and are not official. Mandatory lists change — the competent authority is the final reference.',
    faq: isAr ? 'أسئلة شائعة' : 'Frequently asked',
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 print:bg-white print:py-0" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 text-center print:text-start">
          <div className="text-xs text-orange-600 tracking-wide mb-2 print:hidden">{T.eyebrow}</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2 print:justify-start print:text-2xl"><BadgeCheck className="w-7 h-7 text-orange-500 print:hidden" />{T.title}</h1>
          <p className="text-gray-500 text-sm max-w-2xl mx-auto print:hidden">{T.sub}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 print:hidden">
          <div className="text-sm font-semibold text-gray-800 mb-2">{T.q1}</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
            {FAMILIES.map(f => (
              <button key={f.key} type="button" onClick={() => setA(p => ({ ...p, family: f.key }))}
                className={`text-start rounded-xl border px-3 py-2 transition ${a.family === f.key ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-200'}`}>
                <div className="text-sm text-gray-900 leading-snug">{t(f.label)}</div>
                <div className="text-[11px] text-gray-400 leading-snug">{t(f.hint)}</div>
              </button>
            ))}
          </div>
          <div className="text-sm font-semibold text-gray-800 mb-2">{T.q2}</div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              {[true, false].map(v => (
                <button key={String(v)} type="button" onClick={() => setA(p => ({ ...p, imported: v }))}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${a.imported === v ? 'border-orange-400 bg-orange-50 text-gray-900' : 'border-gray-200 text-gray-600 hover:border-orange-200'}`}>{v ? T.imported : T.local}</button>
              ))}
            </div>
            <Toggle checked={a.animal} onChange={v => setA(p => ({ ...p, animal: v }))} label={T.animal} />
            {fam.food && <Toggle checked={a.organic} onChange={v => setA(p => ({ ...p, organic: v }))} label={T.organic} />}
            <Toggle checked={a.halalMark} onChange={v => setA(p => ({ ...p, halalMark: v }))} label={T.halal} />
          </div>
        </div>

        <div className="bg-white border-2 border-orange-100 rounded-2xl p-5 mb-4 print:border-0 print:p-0">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">{t(r.headline)}</h2>
          <div className="text-xs text-gray-400 mb-4">{t(fam.label)} · {a.imported ? T.imported : T.local}</div>

          <div className="flex flex-col gap-3 mb-5">
            {r.items.map((c, i) => (
              <div key={c.key + i} className="rounded-xl border border-gray-100 p-4">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${STATUS[c.status].cls}`}>{t(STATUS[c.status].label)}</span>
                  <span className="text-sm font-semibold text-gray-900">{t(c.name)}</span>
                </div>
                <div className="text-sm text-gray-600">{t(c.why)}</div>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 mt-2 text-xs text-gray-500">
                  <div><span className="text-gray-400">{T.issuer}:</span> {t(c.issuer)}</div>
                  {c.standard && <div><span className="text-gray-400">{T.std}:</span> {c.standard}</div>}
                  {c.officialFee && <div className="sm:col-span-2"><span className="text-gray-400">{T.official}:</span> {t(c.officialFee)}</div>}
                  {c.reportedFee && <div className="sm:col-span-2"><span className="text-gray-400">{T.reported}:</span> {t(c.reportedFee)}</div>}
                  {c.time && <div className="sm:col-span-2"><span className="text-gray-400">{T.time}:</span> {t(c.time)}</div>}
                </div>
                <a href={c.url.startsWith('/') ? `/${locale}${c.url}` : c.url} target={c.url.startsWith('/') ? undefined : '_blank'} rel="noopener" className="inline-flex items-center gap-1 text-xs text-orange-600 mt-2 print:text-gray-500">{c.url.startsWith('/') ? `crate.ae${c.url}` : c.url}<ExternalLink className="w-3 h-3 print:hidden" /></a>
              </div>
            ))}
          </div>

          {r.notes.length > 0 && (
            <div className="rounded-xl bg-orange-50 border border-orange-100 p-3 mb-5">
              <div className="text-sm font-semibold text-gray-800 flex items-center gap-1.5 mb-1"><AlertTriangle className="w-4 h-4 text-orange-500" />{T.notes}</div>
              <ul className="list-disc ps-5 text-sm text-gray-700 flex flex-col gap-1">{r.notes.map((n, i) => <li key={i}>{t(n)}</li>)}</ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2 print:hidden">
            <button type="button" onClick={() => gate({ kind: 'pdf', title: `شهادات المطابقة: ${fam.label.ar}`, category: `فاحص الشهادات · ${fam.label.ar}`, run: () => window.print() })}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:border-orange-300"><Printer className="w-4 h-4" />{T.print}</button>
            <a href={`/${locale}/tools/product-registration-uae`} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:border-orange-300"><Compass className="w-4 h-4" />{T.router}</a>
            <a href={`/${locale}/tools/landed-cost-uae`} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:border-orange-300"><Calculator className="w-4 h-4" />{T.cost}</a>
          </div>
          <div className="text-[11px] text-gray-400 mt-4">{T.disclaimer}</div>
          <div className="text-[11px] text-gray-400 mt-2"><span className="font-semibold">{T.sources}:</span> {r.sources.map((s, i) => <span key={s.url}>{i > 0 && ' · '}<a href={s.url} target="_blank" rel="noopener" className="hover:text-orange-600">{s.label}</a></span>)}</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 print:hidden">
          <h2 className="text-base font-semibold text-gray-900 mb-3">{T.faq}</h2>
          <div className="flex flex-col gap-3">{faq.map(([q, ans]) => <div key={q}><div className="text-sm font-semibold text-gray-800">{q}</div><div className="text-sm text-gray-600 mt-0.5">{ans}</div></div>)}</div>
        </div>
      </div>
    </div>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-start gap-2 cursor-pointer text-sm text-gray-700">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="mt-1 accent-orange-500" /><span>{label}</span>
    </label>
  )
}
