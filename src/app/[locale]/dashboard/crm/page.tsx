'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Users, ShieldCheck, MailCheck, Ban, Activity, Loader2, ArrowUpRight } from 'lucide-react'

interface Crm {
  contacts: { total: number; consented: number; marketable: number; bySource: Record<string, number>; byStatus: Record<string, number> }
  suppressions: number
  recent: { email: string; source: string; status: string; consent: boolean; created_at: string; providers: { name_en: string | null; slug: string | null } | null }[]
  topProviders: { name_en: string | null; slug: string | null; views_count: number | null; rfq_received_count: number | null; emails_count: number | null }[]
}

export default function CrmOverviewPage() {
  const isAr = !usePathname()?.startsWith('/en')
  const [d, setD] = useState<Crm | null>(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    fetch('/api/admin/crm', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(setD).catch(() => setErr(isAr ? 'تعذّر تحميل البيانات' : 'Failed to load'))
  }, [isAr])

  const T = {
    title: isAr ? 'نظرة CRM الموحّدة' : 'Unified CRM Overview',
    sub: isAr ? 'كل جهات الاتصال والإشارات في مكان واحد — الحملات وجهات الاتصال والموردون يغذّي بعضها' : 'Every contact & signal in one place — campaigns, contacts and providers feeding each other',
    total: isAr ? 'إجمالي جهات الاتصال' : 'Total contacts',
    marketable: isAr ? 'قابل للتسويق (متحقّق + موافقة)' : 'Marketable (verified + consent)',
    consented: isAr ? 'وافق على التواصل' : 'Consented',
    suppressed: isAr ? 'قائمة الحظر (إلغاء/ارتداد)' : 'Suppressed (unsub/bounce)',
    bySource: isAr ? 'حسب المصدر' : 'By source',
    byStatus: isAr ? 'حسب الحالة' : 'By status',
    recent: isAr ? 'أحدث جهات الاتصال' : 'Recent contacts',
    topProviders: isAr ? 'أنشط الموردين' : 'Most active providers',
    provider: isAr ? 'المورد' : 'Provider',
    views: isAr ? 'مشاهدات' : 'Views',
    rfqs: isAr ? 'طلبات' : 'RFQs',
    emails: isAr ? 'مراسلات' : 'Emails',
    none: isAr ? 'لا يوجد بعد' : 'None yet',
    standalone: isAr ? 'مستقل' : 'Standalone',
  }
  const SOURCE_LABEL: Record<string, string> = isAr
    ? { self_claimed: 'مطالبة ذاتية', admin_import: 'استيراد الأدمن', places_api: 'إثراء آلي', rfq_requester: 'مشترٍ (RFQ)', provider_profile: 'بريد مورد' }
    : { self_claimed: 'Self-claim', admin_import: 'Admin import', places_api: 'Auto-enrich', rfq_requester: 'Buyer (RFQ)', provider_profile: 'Provider email' }
  const STATUS_LABEL: Record<string, string> = isAr
    ? { pending: 'قيد المراجعة', verified: 'متحقّق', rejected: 'مرفوض' }
    : { pending: 'Pending', verified: 'Verified', rejected: 'Rejected' }
  const STATUS_COLOR: Record<string, string> = { pending: 'bg-amber-100 text-amber-700', verified: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-600' }

  if (err) return <div className="p-10 text-center text-red-500">{err}</div>
  if (!d) return <div className="p-20 flex justify-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>

  const cards = [
    { icon: Users, label: T.total, value: d.contacts.total, color: 'text-slate-700' },
    { icon: MailCheck, label: T.marketable, value: d.contacts.marketable, color: 'text-emerald-600' },
    { icon: ShieldCheck, label: T.consented, value: d.contacts.consented, color: 'text-orange-500' },
    { icon: Ban, label: T.suppressed, value: d.suppressions, color: 'text-red-500' },
  ]
  const sourceMax = Math.max(1, ...Object.values(d.contacts.bySource))

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2"><Activity className="w-6 h-6 text-orange-500" />{T.title}</h1>
        <p className="text-sm text-slate-400 mt-1">{T.sub}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4">
            <c.icon className={`w-5 h-5 ${c.color}`} />
            <div className="text-2xl font-black text-slate-900 mt-2 tabular-nums">{c.value.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5 leading-tight">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* By source */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h3 className="font-bold text-slate-700 text-sm mb-4">{T.bySource}</h3>
          <div className="space-y-2.5">
            {Object.entries(d.contacts.bySource).map(([src, n]) => (
              <div key={src}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-semibold">{SOURCE_LABEL[src] ?? src}</span>
                  <span className="text-slate-400 tabular-nums">{n.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-400 rounded-full" style={{ width: `${(n / sourceMax) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2 flex-wrap">
            {Object.entries(d.contacts.byStatus).map(([st, n]) => (
              <span key={st} className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_COLOR[st] ?? 'bg-slate-100 text-slate-600'}`}>
                {STATUS_LABEL[st] ?? st}: {n.toLocaleString()}
              </span>
            ))}
          </div>
        </div>

        {/* Top providers */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h3 className="font-bold text-slate-700 text-sm mb-4">{T.topProviders}</h3>
          {d.topProviders.length === 0 ? <p className="text-xs text-slate-400">{T.none}</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="text-slate-400 text-[10px] uppercase">
                  <th className="text-start pb-2 font-bold">{T.provider}</th>
                  <th className="text-center pb-2 font-bold">{T.views}</th>
                  <th className="text-center pb-2 font-bold">{T.rfqs}</th>
                  <th className="text-center pb-2 font-bold">{T.emails}</th>
                </tr></thead>
                <tbody>
                  {d.topProviders.map((p, i) => (
                    <tr key={i} className="border-t border-slate-50">
                      <td className="py-1.5 text-slate-700 font-semibold truncate max-w-[160px]">{p.name_en ?? '—'}</td>
                      <td className="py-1.5 text-center tabular-nums text-slate-500">{(p.views_count ?? 0).toLocaleString()}</td>
                      <td className="py-1.5 text-center tabular-nums text-slate-500">{(p.rfq_received_count ?? 0).toLocaleString()}</td>
                      <td className="py-1.5 text-center tabular-nums text-slate-500">{(p.emails_count ?? 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recent contacts */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h3 className="font-bold text-slate-700 text-sm mb-4">{T.recent}</h3>
        {d.recent.length === 0 ? <p className="text-xs text-slate-400">{T.none}</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <tbody>
                {d.recent.map((c, i) => (
                  <tr key={i} className="border-t border-slate-50 first:border-0">
                    <td className="py-2 text-slate-700 font-medium truncate max-w-[200px]">{c.email}</td>
                    <td className="py-2"><span className="text-[10px] bg-slate-100 text-slate-600 rounded-full px-2 py-0.5 font-semibold whitespace-nowrap">{SOURCE_LABEL[c.source] ?? c.source}</span></td>
                    <td className="py-2"><span className={`text-[10px] rounded-full px-2 py-0.5 font-bold whitespace-nowrap ${STATUS_COLOR[c.status] ?? 'bg-slate-100 text-slate-600'}`}>{STATUS_LABEL[c.status] ?? c.status}</span></td>
                    <td className="py-2 text-slate-400 truncate max-w-[140px]">
                      {c.providers?.name_en
                        ? <a href={`/${isAr ? 'ar' : 'en'}/providers/${c.providers.slug}`} className="hover:text-orange-500 inline-flex items-center gap-0.5">{c.providers.name_en}<ArrowUpRight className="w-3 h-3" /></a>
                        : <span className="italic">{T.standalone}</span>}
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
