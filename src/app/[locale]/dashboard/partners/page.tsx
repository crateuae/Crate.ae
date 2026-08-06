'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Handshake, Loader2, Truck, Globe, ChevronRight, ShieldCheck, Store } from 'lucide-react'

interface Partner {
  id: string
  name_en: string; name_ar: string | null; slug: string | null
  emirate: string | null; phone: string | null; email: string | null; website: string | null
  services: string | null
  is_fulfillment: boolean; status: string; public_published: boolean
  commission_pct: number | null
  provider_id: string | null
}

export default function PartnersListPage() {
  const isAr = !usePathname()?.startsWith('/en')
  const locale = isAr ? 'ar' : 'en'
  const [partners, setPartners] = useState<Partner[] | null>(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    fetch('/api/admin/partners', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => setPartners(d.partners ?? [])).catch(() => setErr(isAr ? 'تعذّر التحميل' : 'Failed to load'))
  }, [isAr])

  const T = {
    title: isAr ? 'الشركاء والتنفيذ' : 'Partners & Fulfillment',
    sub: isAr ? 'شركاء منتقَون بسجلّ كامل وصفحة وحساب — منفصلون عن دليل الموردين' : 'Curated partners with a full record, page and account — separate from the providers directory',
    none: isAr ? 'لا شركاء بعد — حوّل مورداً إلى شريك من قسم «الموردون» بزر «تحويل إلى شريك»' : 'No partners yet — promote a provider from the Providers section using "Convert to partner"',
    fulfillment: isAr ? 'شريك تنفيذ (دروبشيب)' : 'Fulfillment (dropship)',
    published: isAr ? 'صفحة عامة' : 'Public page',
    fromProvider: isAr ? 'محوّل من مورد' : 'From a provider',
    open: isAr ? 'فتح الملف' : 'Open profile',
    status: { active: isAr ? 'نشط' : 'Active', pending: isAr ? 'قيد المراجعة' : 'Pending', paused: isAr ? 'موقوف' : 'Paused' } as Record<string, string>,
  }

  if (err) return <div className="p-10 text-center text-red-500">{err}</div>
  if (!partners) return <div className="p-20 flex justify-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2"><Handshake className="w-6 h-6 text-orange-500" />{T.title}</h1>
        <p className="text-sm text-slate-400 mt-1">{T.sub}</p>
      </div>

      {partners.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-400">{T.none}</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {partners.map(p => (
            <Link key={p.id} href={`/${locale}/dashboard/partners/${p.id}`}
              className="group bg-white border border-slate-200 rounded-2xl p-5 hover:border-orange-200 hover:shadow-sm transition-all">
              <div className="flex items-start gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${p.is_fulfillment ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {p.is_fulfillment ? <Truck className="w-5 h-5" /> : <Store className="w-5 h-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-800 truncate">{p.name_en}</div>
                  {p.name_ar && <div className="text-xs text-slate-400 truncate" dir="rtl">{p.name_ar}</div>}
                  <div className="text-xs text-slate-500 mt-1 truncate">{p.services || p.emirate || p.email || '—'}</div>
                </div>
                <ChevronRight className={`w-4 h-4 text-slate-300 group-hover:text-orange-400 flex-shrink-0 ${isAr ? 'rotate-180' : ''}`} />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status === 'active' ? 'bg-emerald-100 text-emerald-700' : p.status === 'paused' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>{T.status[p.status] ?? p.status}</span>
                {p.is_fulfillment && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 inline-flex items-center gap-1"><Truck className="w-2.5 h-2.5" />{T.fulfillment}</span>}
                {p.public_published && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 inline-flex items-center gap-1"><Globe className="w-2.5 h-2.5" />{T.published}</span>}
                {p.provider_id && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 inline-flex items-center gap-1"><ShieldCheck className="w-2.5 h-2.5" />{T.fromProvider}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
