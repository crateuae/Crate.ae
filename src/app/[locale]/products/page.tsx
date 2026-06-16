import Link from 'next/link'
import { Boxes, Globe, Tag, Clock, Award, CheckCircle2, AlertTriangle } from 'lucide-react'
import { PRODUCTS_CATALOG, PRODUCT_CATEGORIES, getProductSlug, getProductFMCG } from '@/lib/data/products-catalog'

const SIGNAL_CONFIG = {
  shortage:  { label_ar: 'نقص عرض',     label_en: 'Shortage',  cls: 'bg-red-100 text-red-700' },
  rising:    { label_ar: 'طلب صاعد',     label_en: 'Rising',    cls: 'bg-green-100 text-green-700' },
  arbitrage: { label_ar: 'مراجحة سعرية', label_en: 'Arbitrage', cls: 'bg-amber-100 text-amber-700' },
  stable:    { label_ar: 'مستقر',        label_en: 'Stable',    cls: 'bg-gray-100 text-gray-500' },
}

export default async function ProductsPage({ params, searchParams }: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ cat?: string; q?: string; status?: string }>
}) {
  const { locale } = await params
  const { cat, q, status } = await searchParams
  const isAr = locale === 'ar'

  const filtered = PRODUCTS_CATALOG.filter(p => {
    const matchCat = !cat || p.category_en.toLowerCase().includes(cat.toLowerCase()) || p.category_ar.includes(cat)
    const matchQ = !q || p.name_ar.includes(q) || p.name_en.toLowerCase().includes(q.toLowerCase()) || p.brand.toLowerCase().includes(q.toLowerCase())
    const matchStatus = !status || p.registration_status === status
    return matchCat && matchQ && matchStatus && p.is_active
  })

  const registeredCount = PRODUCTS_CATALOG.filter(p => p.registration_status === 'registered_uae').length
  const unregisteredCount = PRODUCTS_CATALOG.filter(p => p.registration_status === 'unregistered').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-black text-gray-900 mb-1 tracking-tight">
            {isAr ? 'قاعدة المنتجات' : 'Product Database'}
          </h1>
          <p className="text-gray-400 text-sm mb-5">
            {isAr
              ? `${PRODUCTS_CATALOG.length} منتج موثّق من السوق الإماراتي — اضغط على اسم أي منتج للاطلاع على تفاصيله الكاملة`
              : `${PRODUCTS_CATALOG.length} documented UAE market products — click any product name for full details`}
          </p>
          {/* Status filter chips */}
          <div className="flex flex-wrap gap-2">
            <Link href={`/${locale}/products${cat ? `?cat=${cat}` : ''}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                !status ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
              {isAr ? 'الكل' : 'All'} ({PRODUCTS_CATALOG.length})
            </Link>
            <Link href={`/${locale}/products?status=registered_uae${cat ? `&cat=${cat}` : ''}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                status === 'registered_uae' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-green-600 border-green-200 hover:bg-green-50'}`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isAr ? 'مسجّل في الإمارات' : 'Registered in UAE'} ({registeredCount})
            </Link>
            <Link href={`/${locale}/products?status=unregistered${cat ? `&cat=${cat}` : ''}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                status === 'unregistered' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-orange-500 border-orange-200 hover:bg-orange-50'}`}>
              <AlertTriangle className="w-3.5 h-3.5" />
              {isAr ? 'فرص استيراد جديدة' : 'New Import Opportunities'} ({unregisteredCount})
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="space-y-4">
            {/* Search */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <form>
                <input
                  name="q"
                  defaultValue={q}
                  placeholder={isAr ? 'ابحث بالاسم أو البراند...' : 'Search by name or brand...'}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-colors"
                />
                {status && <input type="hidden" name="status" value={status} />}
              </form>
            </div>

            {/* Categories */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
                {isAr ? 'التصنيفات' : 'Categories'}
              </h3>
              <div className="space-y-0.5">
                <Link href={`/${locale}/products${status ? `?status=${status}` : ''}`}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${!cat ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <span>{isAr ? 'الكل' : 'All'}</span>
                  <span className="text-xs text-gray-400">{PRODUCTS_CATALOG.length}</span>
                </Link>
                {PRODUCT_CATEGORIES.map(c => {
                  const count = PRODUCTS_CATALOG.filter(p =>
                    p.category_ar === c.name_ar &&
                    (!status || p.registration_status === status)
                  ).length
                  if (count === 0) return null
                  return (
                    <Link key={c.id}
                      href={`/${locale}/products?cat=${encodeURIComponent(c.name_en)}${status ? `&status=${status}` : ''}`}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                        cat === c.name_en ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                      <span>{c.icon} {isAr ? c.name_ar : c.name_en}</span>
                      <span className="text-xs text-gray-400">{count}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-400">
                {isAr ? `${filtered.length} منتج` : `${filtered.length} products`}
                {status === 'unregistered' && (
                  <span className="ms-2 text-orange-500 font-semibold">
                    {isAr ? '— فرص لم يستوردها أحد بعد' : '— never imported to UAE'}
                  </span>
                )}
              </p>
            </div>

            {filtered.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-12 text-center">
                <Boxes className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">{isAr ? 'لا توجد منتجات' : 'No products found'}</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map(p => {
                  const sig = SIGNAL_CONFIG[p.market_signal]
                  const isUnregistered = p.registration_status === 'unregistered'
                  return (
                    <div key={p.id} className={`bg-white border rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all group ${isUnregistered ? 'border-orange-200' : 'border-gray-200'}`}>
                      {/* Card top */}
                      <div className={`h-28 flex items-center justify-center border-b border-gray-100 text-4xl relative ${isUnregistered ? 'bg-gradient-to-br from-orange-50 to-amber-50' : 'bg-gradient-to-br from-gray-50 to-white'}`}>
                        {p.image_emoji}
                        <span className={`absolute top-2 end-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${sig.cls}`}>
                          {isAr ? sig.label_ar : sig.label_en}
                        </span>
                        {/* Registration badge */}
                        <span className={`absolute top-2 start-2 flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isUnregistered ? 'bg-orange-500 text-white' : 'bg-green-100 text-green-700'}`}>
                          {isUnregistered
                            ? <><AlertTriangle className="w-2.5 h-2.5" />{isAr ? 'غير مسجّل' : 'Unregistered'}</>
                            : <><CheckCircle2 className="w-2.5 h-2.5" />{isAr ? 'مسجّل UAE' : 'UAE Reg.'}</>}
                        </span>
                      </div>

                      {/* Card body */}
                      <div className="p-4">
                        <div className="mb-2">
                          <span className="text-[10px] bg-gray-100 text-gray-500 rounded-md px-2 py-0.5 font-medium">
                            {isAr ? p.subcategory_ar : p.subcategory_en}
                          </span>
                        </div>

                        {/* Clickable product name → detail page */}
                        <Link href={`/${locale}/products/${getProductSlug(p)}`} className="block group/link">
                          <h3 className="font-black text-gray-900 text-[15px] leading-tight mb-0.5 group-hover/link:text-orange-500 transition-colors">
                            {isAr ? p.name_ar : p.name_en}
                          </h3>
                        </Link>
                        <p className="text-xs text-gray-400 mb-3">{p.brand}</p>

                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Globe className="w-3 h-3 flex-shrink-0" />
                            {isAr ? p.country_origin_ar : p.country_origin}
                          </div>
                          {isUnregistered ? (
                            <div className="flex items-center gap-1.5 text-orange-600 font-semibold">
                              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                              {isAr
                                ? `فرصة أول مستورد — ${p.registration_months} أشهر للتسجيل`
                                : `First-mover opportunity — ${p.registration_months}m to register`}
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-1.5 text-gray-500">
                                <Tag className="w-3 h-3 flex-shrink-0" />
                                {isAr ? 'الجملة:' : 'Wholesale:'} <span className="font-bold text-orange-500">{p.price_wholesale_aed} AED</span>
                                {p.price_import_aed && (
                                  <><span className="text-gray-300">|</span>{isAr ? 'استيراد:' : 'Import:'} <span className="font-bold text-purple-500">{p.price_import_aed} AED</span></>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-gray-500">
                                <Clock className="w-3 h-3 flex-shrink-0" />
                                {isAr ? `صلاحية ${p.shelf_life_months} شهر` : `${p.shelf_life_months} months shelf life`}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Certifications */}
                        <div className="flex flex-wrap gap-1 mt-3">
                          {p.certifications.slice(0, 2).map(cert => (
                            <span key={cert} className="text-[9px] bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-2 py-0.5 font-semibold flex items-center gap-0.5">
                              <Award className="w-2.5 h-2.5" />{cert}
                            </span>
                          ))}
                        </div>

                        {/* FMCG badge + CTA */}
                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                          {(() => {
                            const fmcg = getProductFMCG(p)
                            if (!fmcg) return null
                            return (
                              <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                                  fmcg.class === 'A' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : fmcg.class === 'B' ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-gray-100 text-gray-500 border-gray-200'
                                }`}>
                                  FMCG {fmcg.class} · {fmcg.fmcg_score}/100
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {isAr ? `${fmcg.turnover_days}ي دوران` : `${fmcg.turnover_days}d turnover`}
                                </span>
                              </div>
                            )
                          })()}
                          <Link href={`/${locale}/products/${getProductSlug(p)}`}
                            className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 py-2 rounded-xl transition-colors">
                            {isAr ? 'عرض التفاصيل الكاملة' : 'View Full Details'}
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
