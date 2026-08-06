'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Users, ShieldCheck, MailCheck, Ban, Activity, Loader2, ArrowUpRight, Inbox, AlertTriangle, ShieldAlert, ChevronDown } from 'lucide-react'

interface Crm {
  contacts: { total: number; consented: number; marketable: number; bySource: Record<string, number>; byStatus: Record<string, number> }
  suppressions: number
  recent: { email: string; source: string; status: string; consent: boolean; created_at: string; providers: { name_en: string | null; slug: string | null } | null }[]
  topProviders: { name_en: string | null; slug: string | null; views_count: number | null; rfq_received_count: number | null; emails_count: number | null }[]
  inbound?: {
    id: string | null; from_email: string | null; to_email: string | null; subject: string | null
    created_at: string; providers: { name_en: string | null; slug: string | null } | null
    body_preview: string; risk: { level: 'high' | 'medium' | 'low'; reasons: string[] }
  }[]
}

export default function CrmOverviewPage() {
  const isAr = !usePathname()?.startsWith('/en')
  const [d, setD] = useState<Crm | null>(null)
  const [err, setErr] = useState('')
  const [openMail, setOpenMail] = useState<string | null>(null)

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
    inbound: isAr ? 'ردود الموردين الواردة' : 'Inbound supplier replies',
    inboundHint: isAr ? 'الردود على uae@crate.ae تظهر هنا (فعّل استقبال Resend)' : 'Replies to uae@crate.ae appear here (enable Resend receiving)',
  }
  const SOURCE_LABEL: Record<string, string> = isAr
    ? { self_claimed: 'مطالبة ذاتية', admin_import: 'استيراد الأدمن', places_api: 'إثراء آلي', rfq_requester: 'مشترٍ (RFQ)', provider_profile: 'بريد مورد' }
    : { self_claimed: 'Self-claim', admin_import: 'Admin import', places_api: 'Auto-enrich', rfq_requester: 'Buyer (RFQ)', provider_profile: 'Provider email' }
  const STATUS_LABEL: Record<string, string> = isAr
    ? { pending: 'قيد المراجعة', verified: 'متحقّق', rejected: 'مرفوض' }
    : { pending: 'Pending', verified: 'Verified', rejected: 'Rejected' }
  const STATUS_COLOR: Record<string, string> = { pending: 'bg-amber-100 text-amber-700', verified: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-600' }
  const RISK: Record<string, { badge: string; dot: string; label: string }> = {
    high:   { badge: 'bg-red-100 text-red-700',        dot: 'bg-red-500',     label: isAr ? 'مشبوه' : 'Suspicious' },
    medium: { badge: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-500',   label: isAr ? 'انتبه' : 'Caution' },
    low:    { badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400', label: isAr ? 'يبدو سليماً' : 'Looks clean' },
  }
  const REASON: Record<string, string> = isAr ? {
    risky_tld: 'نطاق TLD مشبوه', unusual_domain: 'اسم نطاق غير معتاد', lure_salary: 'طُعم رواتب',
    lure_invoice: 'طُعم فواتير/دفع', lure_verify: 'طلب تحقّق/تحديث بيانات', lure_credentials: 'يذكر كلمة مرور/دخول',
    lure_urgency: 'إلحاح/تهديد', lure_money: 'تحويل مالي/بطاقات', lure_click: 'حثّ على النقر/فتح مرفق',
    ip_url: 'رابط بعنوان IP', short_url: 'رابط مختصر', brand_spoof: 'يستخدم اسم Crate من نطاق خارجي',
  } : {
    risky_tld: 'Suspicious TLD', unusual_domain: 'Unusual domain', lure_salary: 'Salary bait',
    lure_invoice: 'Invoice/payment bait', lure_verify: 'Asks to verify/update details', lure_credentials: 'Mentions password/login',
    lure_urgency: 'Urgency/threat', lure_money: 'Money transfer/gift cards', lure_click: 'Pushes click/open attachment',
    ip_url: 'Raw IP link', short_url: 'Shortened link', brand_spoof: 'Uses "Crate" from external domain',
  }

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

      {/* Inbound supplier replies */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h3 className="font-bold text-slate-700 text-sm mb-1 flex items-center gap-2"><Inbox className="w-4 h-4 text-orange-500" />{T.inbound}</h3>
        <p className="text-[11px] text-slate-400 mb-3">{T.inboundHint}</p>
        {!d.inbound?.length ? <p className="text-xs text-slate-400">{T.none}</p> : (
          <div className="space-y-1.5">
            {d.inbound.map((m, i) => {
              const key = m.id ?? String(i)
              const r = RISK[m.risk?.level ?? 'low'] ?? RISK.low
              const open = openMail === key
              return (
                <div key={key} className="border border-slate-100 rounded-xl overflow-hidden">
                  <button onClick={() => setOpenMail(open ? null : key)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-start hover:bg-slate-50 transition-colors">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${r.dot}`} title={r.label} />
                    <span className="text-xs font-semibold text-slate-700 truncate max-w-[150px]">{m.from_email ?? '—'}</span>
                    <span className="text-xs text-slate-500 truncate flex-1">{m.subject ?? '—'}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${r.badge}`}>{r.label}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-300 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && (
                    <div className="px-3 pb-3 pt-1 border-t border-slate-100 bg-slate-50/50">
                      {m.risk?.level === 'high' && (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 rounded-lg px-3 py-2 mb-2 text-[11px]">
                          <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>{isAr ? 'مؤشّرات تصيّد — لا تفتح أي مرفق أو رابط، ولا تردّ.' : 'Phishing signals — do not open attachments/links, and do not reply.'}</span>
                        </div>
                      )}
                      {!!m.risk?.reasons?.length && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {m.risk.reasons.map(rk => (
                            <span key={rk} className="inline-flex items-center gap-1 text-[10px] bg-white border border-slate-200 text-slate-600 rounded-full px-2 py-0.5">
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-500" />{REASON[rk] ?? rk}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 mb-1">
                        {m.from_email}{m.to_email ? ` → ${m.to_email}` : ''} · {new Date(m.created_at).toLocaleString(isAr ? 'ar-AE' : 'en-AE')}
                        {m.providers?.name_en ? ` · ${m.providers.name_en}` : ''}
                      </div>
                      <pre className="text-[11px] text-slate-600 whitespace-pre-wrap break-words font-sans max-h-64 overflow-y-auto m-0">{m.body_preview || (isAr ? '(لا نص)' : '(no text)')}</pre>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
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
