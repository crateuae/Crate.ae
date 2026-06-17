import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  MapPin, BadgeCheck, ArrowLeft, ArrowRight, Repeat2, Store,
  Hash, Calendar, ShieldCheck, ExternalLink, Package,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase  = await createClient()
  const { data }  = await supabase
    .from('providers')
    .select('name_en, name_ar, emirate, category')
    .eq('slug', slug)
    .single()

  if (!data) return { title: 'Supplier — Crate' }

  return {
    title: `${data.name_en} — Crate`,
    description: `${data.category} company in ${data.emirate}, UAE | Crate supplier directory`,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProviderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const isAr  = locale === 'ar'
  const Arrow = isAr ? ArrowLeft : ArrowRight

  const supabase = await createClient()
  const { data: p } = await supabase
    .from('providers')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!p) notFound()

  const isRepack  = p.type === 'repackager'
  const accentCls = isRepack ? 'indigo' : 'indigo'

  const EMIRATES_LABELS_AR: Record<string, string> = {
    'Dubai': 'دبي', 'Abu Dhabi': 'أبوظبي', 'Sharjah': 'الشارقة',
    'Ras Al Khaimah': 'رأس الخيمة', 'Ajman': 'عجمان',
  }

  const emLabel = isAr ? (EMIRATES_LABELS_AR[p.emirate ?? ''] ?? p.emirate) : p.emirate

  function fmtDate(d: string | null) {
    if (!d) return null
    try { return new Date(d).toLocaleDateString(isAr ? 'ar-AE' : 'en-AE', { year: 'numeric', month: 'short', day: 'numeric' }) }
    catch { return d }
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Breadcrumb ── */}
      <div className="bg-white border-b border-gray-100 px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-2 text-xs text-gray-400">
          <Link href={`/${locale}/providers`} className="hover:text-gray-700 flex items-center gap-1">
            {isAr ? <ArrowRight className="w-3 h-3" /> : <ArrowLeft className="w-3 h-3" />}
            {isAr ? 'دليل الموردين' : 'Suppliers Directory'}
          </Link>
          <span>/</span>
          <span className="text-gray-600 font-medium truncate max-w-xs">
            {isAr ? (p.name_ar || p.name_en) : (p.name_en || p.name_ar)}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-3 gap-6">

          {/* ── Main card ── */}
          <div className="md:col-span-2 space-y-5">

            {/* Header */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${isRepack ? 'bg-orange-50' : 'bg-indigo-50'}`}>
                  {isRepack
                    ? <Repeat2 className="w-7 h-7 text-orange-500" />
                    : <Store className="w-7 h-7 text-indigo-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-black text-gray-900 leading-tight mb-1">
                    {isAr ? (p.name_ar || p.name_en) : (p.name_en || p.name_ar)}
                  </h1>
                  <p className="text-sm text-gray-400">
                    {isAr ? (p.name_en) : (p.name_ar)}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      isRepack ? 'text-orange-600 bg-orange-50 border-orange-200' : 'text-indigo-600 bg-indigo-50 border-indigo-200'
                    }`}>
                      {isRepack ? (isAr ? 'إعادة تعبئة وتغليف' : 'Repackaging') : (isAr ? 'تجارة عامة' : 'General Trading')}
                    </span>
                    {p.is_verified && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                        <BadgeCheck className="w-3.5 h-3.5" />
                        {isAr ? 'موثّق' : 'Verified'}
                      </span>
                    )}
                    {p.license_status && (
                      <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${
                        p.license_status === 'Active'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {isAr
                          ? (p.license_status === 'Active' ? 'رخصة نشطة' : p.license_status === 'Cancelled' ? 'رخصة ملغاة' : p.license_status)
                          : p.license_status}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Location */}
              {p.emirate && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{emLabel}</span>
                  {p.city && p.city !== p.emirate && <><span className="text-gray-300">·</span><span className="text-gray-400">{p.city}</span></>}
                </div>
              )}
            </div>

            {/* License Details */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                {isAr ? 'بيانات الرخصة التجارية' : 'Trade License Details'}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    label_ar: 'رقم الرخصة', label_en: 'License Number',
                    value: p.license_no,
                    icon: Hash,
                  },
                  {
                    label_ar: 'نوع الرخصة', label_en: 'License Type',
                    value: p.license_type,
                    icon: ShieldCheck,
                  },
                  {
                    label_ar: 'تاريخ الإصدار', label_en: 'Issue Date',
                    value: fmtDate(p.issue_date),
                    icon: Calendar,
                  },
                  {
                    label_ar: 'تاريخ الانتهاء', label_en: 'Expiry Date',
                    value: fmtDate(p.expiry_date),
                    icon: Calendar,
                  },
                ].filter(r => r.value).map(r => (
                  <div key={r.label_en} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-1 font-medium">
                      <r.icon className="w-3 h-3" />
                      {isAr ? r.label_ar : r.label_en}
                    </div>
                    <div className="text-sm font-semibold text-gray-800">{r.value}</div>
                  </div>
                ))}
              </div>

              {p.source_url && (
                <a href={p.source_url} target="_blank" rel="noopener noreferrer"
                  className="mt-4 flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700">
                  <ExternalLink className="w-3 h-3" />
                  {isAr ? 'المصدر الرسمي' : 'Official source'}
                  {p.source_dataset && ` — ${p.source_dataset}`}
                </a>
              )}
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-4">

            {/* CTA box */}
            <div className="bg-indigo-600 rounded-2xl p-5 text-white">
              <div className="text-sm font-black mb-2">
                {isAr ? 'هل هذه شركتك؟' : 'Is this your company?'}
              </div>
              <p className="text-indigo-200 text-xs mb-4 leading-relaxed">
                {isAr
                  ? 'أضف تفاصيل الاتصال، خدماتك، وتخصصك لتظهر في نتائج أعلى'
                  : 'Add contact details, services, and specialties to appear in top results'}
              </p>
              <Link href={`/${locale}/login`}
                className="block text-center bg-white text-indigo-700 font-black text-xs px-4 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors">
                {isAr ? 'احتجاز هذه الصفحة' : 'Claim This Page'}
              </Link>
            </div>

            {/* Related links */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
              <div className="text-xs font-black text-gray-900 mb-3">
                {isAr ? 'روابط ذات صلة' : 'Related'}
              </div>
              {isRepack ? (
                <Link href={`/${locale}/packaging`}
                  className="flex items-center gap-2.5 text-xs text-gray-600 hover:text-orange-600 py-1">
                  <Package className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  {isAr ? 'أداة خطة التعبئة' : 'Packaging Plan Tool'}
                </Link>
              ) : (
                <Link href={`/${locale}/market`}
                  className="flex items-center gap-2.5 text-xs text-gray-600 hover:text-indigo-600 py-1">
                  <Store className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  {isAr ? 'فرص السوق الإماراتي' : 'UAE Market Opportunities'}
                </Link>
              )}
              <Link href={`/${locale}/compliance`}
                className="flex items-center gap-2.5 text-xs text-gray-600 hover:text-blue-600 py-1">
                <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0" />
                {isAr ? 'اشتراطات الاستيراد ESMA' : 'ESMA Import Requirements'}
              </Link>
              <Link href={`/${locale}/providers?emirate=${p.emirate ?? ''}&type=${p.type ?? ''}`}
                className="flex items-center gap-2.5 text-xs text-gray-600 hover:text-gray-900 py-1">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                {isAr
                  ? `شركات مشابهة في ${emLabel}`
                  : `Similar companies in ${p.emirate}`}
                <Arrow className="w-3 h-3 ms-auto" />
              </Link>
            </div>

            {/* Category badge */}
            {p.category && (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
                <div className="text-[10px] text-gray-400 mb-1">{isAr ? 'التصنيف' : 'Category'}</div>
                <div className="text-sm font-bold text-gray-700">{p.category}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
