'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Search, Loader2, MapPin, Tag, Package, ShieldCheck, Sparkles, ArrowUpRight } from 'lucide-react'

interface Provider { name_en: string | null; name_ar: string | null; slug: string | null; category: string | null; emirate: string | null; is_verified: boolean; rfq_received_count: number | null }
interface Parsed { emirate: string | null; category: string | null; keywords: string[]; quantity: { amount: number; unit: string } | null; incoterm: string | null }

export default function SearchPage() {
  const isAr = !usePathname()?.startsWith('/en')
  const locale = isAr ? 'ar' : 'en'
  const sp = useSearchParams()
  const [q, setQ] = useState('')
  const [parsed, setParsed] = useState<Parsed | null>(null)
  const [results, setResults] = useState<Provider[] | null>(null)
  const [loading, setLoading] = useState(false)

  const run = useCallback(async (query: string) => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { cache: 'no-store' })
      const d = await res.json()
      setParsed(d.parsed || null); setResults(d.results || [])
    } catch { setResults([]) } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    const initial = sp.get('q') || ''
    if (initial) { setQ(initial); run(initial) }
  }, [sp, run])

  const T = isAr ? {
    title: 'بحث ذكي عن الموردين', sub: 'اكتب طلبك بلغتك الطبيعية — نفهم المنتج والفئة والإمارة والكمية.',
    ph: 'مثال: 500 كرتون عصير مانجو موردين في دبي', btn: 'ابحث',
    examples: ['موردو ألبان في أبوظبي', '500 كرتون عصير مانجو دبي', 'شوكولاتة بالجملة', 'زيت زيتون الشارقة'],
    understood: 'فهمنا', emirate: 'الإمارة', category: 'الفئة', qty: 'الكمية', incoterm: 'التسليم', kw: 'كلمات',
    results: 'الموردون المطابقون', none: 'لا نتائج مطابقة — جرّب كلمات أعم', verified: 'موثّق',
    hint: 'نتائج من دليل موردي Crate — اضغط أي مورد لعرض ملفه وطلب عرض سعر.',
  } : {
    title: 'Smart supplier search', sub: 'Type your request in plain language — we read product, category, emirate and quantity.',
    ph: 'e.g. 500 cartons mango juice suppliers in Dubai', btn: 'Search',
    examples: ['dairy suppliers in Abu Dhabi', '500 cartons mango juice Dubai', 'chocolate wholesale', 'olive oil Sharjah'],
    understood: 'Understood', emirate: 'Emirate', category: 'Category', qty: 'Quantity', incoterm: 'Incoterm', kw: 'Keywords',
    results: 'Matching suppliers', none: 'No matches — try broader terms', verified: 'Verified',
    hint: "Results from Crate's supplier directory — open any supplier to view their profile and request a quote.",
  }

  const chips = parsed ? [
    parsed.emirate && { icon: MapPin, label: T.emirate, val: parsed.emirate },
    parsed.category && { icon: Tag, label: T.category, val: parsed.category },
    parsed.quantity && { icon: Package, label: T.qty, val: `${parsed.quantity.amount} ${parsed.quantity.unit}` },
    parsed.incoterm && { icon: Tag, label: T.incoterm, val: parsed.incoterm },
    parsed.keywords?.length && { icon: Search, label: T.kw, val: parsed.keywords.join('، ') },
  ].filter(Boolean) as { icon: any; label: string; val: string }[] : []

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/40 to-white" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-3xl mx-auto px-5 py-12">
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-orange-600 bg-orange-100 rounded-full px-3 py-1"><Sparkles className="w-3 h-3" />{isAr ? 'مدعوم بفهم اللغة' : 'Language-aware'}</span>
          <h1 className="text-3xl font-black text-stone-900 mt-3">{T.title}</h1>
          <p className="text-sm text-stone-500 mt-2">{T.sub}</p>
        </div>

        <form onSubmit={e => { e.preventDefault(); run(q) }} className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-white border border-stone-200 rounded-2xl px-4 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100">
            <Search className="w-4 h-4 text-stone-400 flex-shrink-0" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder={T.ph} className="flex-1 py-3.5 text-sm bg-transparent focus:outline-none" />
          </div>
          <button type="submit" disabled={loading} className="rounded-2xl bg-orange-500 text-white text-sm font-semibold px-6 hover:bg-orange-600 disabled:opacity-60 inline-flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}{T.btn}
          </button>
        </form>

        {!results && (
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {T.examples.map(ex => (
              <button key={ex} onClick={() => { setQ(ex); run(ex) }} className="text-xs bg-white border border-stone-200 rounded-full px-3 py-1.5 text-stone-500 hover:border-orange-300 hover:text-orange-600">{ex}</button>
            ))}
          </div>
        )}

        {chips.length > 0 && (
          <div className="mt-6 bg-white border border-orange-100 rounded-2xl p-4">
            <div className="text-[11px] font-bold text-stone-400 uppercase mb-2">{T.understood}</div>
            <div className="flex flex-wrap gap-2">
              {chips.map((c, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 text-xs bg-orange-50 text-orange-700 rounded-full px-3 py-1">
                  <c.icon className="w-3 h-3" /><span className="text-orange-400">{c.label}:</span> {c.val}
                </span>
              ))}
            </div>
          </div>
        )}

        {results && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-stone-700">{T.results} <span className="text-stone-400 font-normal">({results.length})</span></h2>
            </div>
            {results.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-8">{T.none}</p>
            ) : (
              <div className="space-y-2">
                {results.map((p, i) => (
                  <Link key={i} href={p.slug ? `/${locale}/providers/${p.slug}` : '#'}
                    className="group flex items-center gap-3 bg-white border border-stone-200 rounded-2xl p-4 hover:border-orange-200 hover:shadow-sm transition-all">
                    <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-500 flex items-center justify-center flex-shrink-0"><Package className="w-5 h-5" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-stone-800 truncate flex items-center gap-1.5">
                        {(isAr && p.name_ar) ? p.name_ar : (p.name_en || '—')}
                        {p.is_verified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
                      </div>
                      <div className="text-xs text-stone-500 truncate">{[p.category, p.emirate].filter(Boolean).join(' · ') || '—'}</div>
                    </div>
                    <ArrowUpRight className={`w-4 h-4 text-stone-300 group-hover:text-orange-400 flex-shrink-0 ${isAr ? 'rotate-[270deg]' : ''}`} />
                  </Link>
                ))}
              </div>
            )}
            <p className="text-[11px] text-stone-400 text-center mt-4">{T.hint}</p>
          </div>
        )}
      </div>
    </div>
  )
}
