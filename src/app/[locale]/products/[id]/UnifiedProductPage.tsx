/**
 * UnifiedProductPage — same rich layout for ALL product sources
 * (manual catalog, organism_discovery).
 * Reads directly from Supabase row.
 */
import Link from 'next/link'
import {
  Globe, Tag, ArrowRight, CheckCircle2, AlertTriangle,
  ShoppingCart, Plane, FileText, TrendingUp, TrendingDown, Minus,
  Package, Building2, ChevronLeft, BarChart3, Info, Pencil, Sparkles, ShieldCheck,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DBProduct {
  id: string
  slug: string
  name_ar: string
  name_en: string
  brand?: string | null
  country_origin?: string | null
  country_origin_ar?: string | null
  category_ar?: string | null
  category_en?: string | null
  subcategory_ar?: string | null
  subcategory_en?: string | null
  unit_size?: string | null
  price_retail_aed?: number | null
  price_wholesale_aed?: number | null
  price_import_aed?: number | null
  units_per_carton?: number | null
  barcode_type?: string | null
  shelf_life_months?: number | null
  storage_temp?: string | null
  certifications?: string[] | null
  hs_code?: string | null
  market_signal?: 'shortage' | 'rising' | 'arbitrage' | 'stable' | null
  gap_score?: number | null
  image_emoji?: string | null
  image_url?: string | null
  description_ar?: string | null
  description_en?: string | null
  content_ar?: string | null
  content_en?: string | null
  registration_status?: 'registered_uae' | 'unregistered' | null
  acquisition_type?: 'local_trade' | 'direct_import' | 'both' | null
  local_distributor_note?: string | null
  registration_cost_aed?: number | null
  registration_months?: number | null
  required_docs?: string[] | null
  tags?: string[] | null
  source: 'manual' | 'organism_discovery'
  page_views?: number | null
  rfq_count?: number | null
  organism_opportunity_id?: string | null
}

interface Signals {
  demand_score?: number
  supply_score?: number
  gap_score?: number
  details_ar?: string
  details_en?: string
  recommended_action_ar?: string
  recommended_action_en?: string
  updated_at?: string
}

const SIGNAL_CONFIG = {
  shortage:  { label_ar: 'نقص عرض',      label_en: 'Supply Shortage', cls: 'bg-red-100 text-red-700 border-red-200',    Icon: TrendingDown },
  rising:    { label_ar: 'طلب صاعد',      label_en: 'Rising Demand',   cls: 'bg-green-100 text-green-700 border-green-200', Icon: TrendingUp },
  arbitrage: { label_ar: 'مراجحة سعرية',  label_en: 'Price Arbitrage', cls: 'bg-amber-100 text-amber-700 border-amber-200', Icon: BarChart3 },
  stable:    { label_ar: 'مستقر',         label_en: 'Stable',          cls: 'bg-gray-100 text-gray-500 border-gray-200',   Icon: Minus },
}

// FMCG data is currently static; in future it can come from a DB table
const FMCG_DATA: Record<string, { class: 'A'|'B'|'C'; fmcg_score: number; turnover_days: number; weekly_units_per_store: number; market_penetration_pct: number; note_ar: string; note_en: string }> = {}

function tierBadge(source: string) {
  if (source === 'organism_discovery') return {
    ar: 'فرصة مكتشفة', en: 'Discovered Opportunity',
    cls: 'bg-purple-100 text-purple-700 border-purple-200', Icon: Sparkles,
  }
  return null
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function UnifiedProductPage({
  product,
  locale,
  signals,
  isAdmin = false,
}: {
  product: DBProduct
  locale: string
  signals?: Signals | null
  isAdmin?: boolean
}) {
  const isAr = locale === 'ar'
  const name = isAr ? product.name_ar : product.name_en
  const desc = isAr ? (product.description_ar || product.content_ar) : (product.description_en || product.content_en)

  const sig = product.market_signal ? SIGNAL_CONFIG[product.market_signal] : SIGNAL_CONFIG.stable
  const SigIcon = sig.Icon
  const isRegistered = product.registration_status === 'registered_uae'
  const canTradeLocally = !product.acquisition_type || product.acquisition_type === 'local_trade' || product.acquisition_type === 'both'
  const canImport = product.acquisition_type === 'direct_import' || product.acquisition_type === 'both'
  const gapScore = product.gap_score ?? 0
  const priceRetail = product.price_retail_aed
  const priceWholesale = product.price_wholesale_aed
  const priceImport = product.price_import_aed
  const unitsPerCarton = product.units_per_carton ?? 1

  const retailMarginPct = priceRetail && priceWholesale && priceRetail > 0 && priceWholesale > 0
    ? Math.round(((priceRetail * unitsPerCarton - priceWholesale) / priceWholesale) * 100)
    : null
  const importMarginPct = priceImport && priceWholesale && priceWholesale > 0
    ? Math.round(((priceWholesale - priceImport) / priceImport) * 100)
    : null

  const fmcg = FMCG_DATA[product.id] ?? null
  const orgBadge = tierBadge(product.source)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Link href={`/${locale}`} className="hover:text-gray-700 transition-colors">{isAr ? 'الرئيسية' : 'Home'}</Link>
            <ChevronLeft className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
            <Link href={`/${locale}/products`} className="hover:text-gray-700 transition-colors">{isAr ? 'المنتجات' : 'Products'}</Link>
            <ChevronLeft className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
            <span className="text-gray-700 font-medium truncate max-w-xs">{name}</span>
          </div>
          {/* Admin edit button */}
          {isAdmin && (
            <Link
              href={`/${locale}/dashboard/products?edit=${product.id}`}
              className="flex items-center gap-1.5 text-xs font-bold text-orange-500 hover:text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-full transition-colors border border-orange-200"
            >
              <Pencil className="w-3.5 h-3.5" />
              {isAr ? 'تعديل المنتج' : 'Edit Product'}
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="flex flex-col md:flex-row">
            {/* Image / emoji panel */}
            <div className="md:w-52 flex-shrink-0 h-48 md:h-auto bg-gradient-to-br from-orange-50 via-amber-50 to-white flex items-center justify-center border-b md:border-b-0 md:border-e border-gray-100">
              {product.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.image_url} alt={name} className="w-28 h-28 object-contain" />
              ) : (
                <span className="text-7xl">{product.image_emoji || '📦'}</span>
              )}
            </div>
            {/* Info */}
            <div className="flex-1 p-6 md:p-8">
              <div className="flex flex-wrap gap-2 mb-3">
                {/* Organism badge */}
                {orgBadge && (
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${orgBadge.cls}`}>
                    <orgBadge.Icon className="w-3.5 h-3.5" />
                    {isAr ? orgBadge.ar : orgBadge.en}
                  </span>
                )}
                {/* Registration badge */}
                {product.registration_status && (
                  isRegistered ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isAr ? 'مسجّل في الإمارات' : 'Registered in UAE'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {isAr ? 'غير مسجّل — فرصة استيراد' : 'Unregistered — Import Opportunity'}
                    </span>
                  )
                )}
                {/* Signal badge */}
                {product.market_signal && (
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${sig.cls}`}>
                    <SigIcon className="w-3.5 h-3.5" />
                    {isAr ? sig.label_ar : sig.label_en}
                  </span>
                )}
                {/* Subcategory */}
                {(product.subcategory_ar || product.subcategory_en) && (
                  <span className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-500">
                    {isAr ? product.subcategory_ar : product.subcategory_en}
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-1">{name}</h1>
              {product.brand && <p className="text-gray-400 text-sm mb-1">{product.brand}</p>}
              {(product.country_origin || product.country_origin_ar) && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
                  <Globe className="w-4 h-4" />
                  {isAr ? (product.country_origin_ar || product.country_origin) : product.country_origin}
                </div>
              )}
              {desc && <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>}

              {/* Organism tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {product.tags.slice(0, 8).map(t => (
                    <span key={t} className="text-[10px] bg-orange-50 text-orange-600 border border-orange-100 rounded-full px-2.5 py-0.5 font-semibold">#{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* ── Business Paths ──────────────────────────────────────────────── */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-gray-500 uppercase tracking-widest">
              {isAr ? 'مسارات الاستفادة' : 'Business Paths'}
            </h2>

            {canTradeLocally && (
              <div className="bg-white border-2 border-blue-100 rounded-2xl p-5 hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{isAr ? 'تجارة محلية' : 'Local Trade'}</div>
                    <div className="text-xs text-blue-600 font-medium">{isAr ? 'بدون اشتراطات استيراد' : 'No import compliance needed'}</div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">
                  {isAr
                    ? 'الشراء من موزع أو مستودع جملة محلي داخل الإمارات وإعادة بيعه للمحلات أو المؤسسات.'
                    : 'Buy from a local UAE distributor or wholesaler and resell to shops or institutions.'}
                </p>
                {product.local_distributor_note && (
                  <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
                    <span className="font-bold">{isAr ? 'الموزعون: ' : 'Distributors: '}</span>
                    {product.local_distributor_note}
                  </div>
                )}
                {retailMarginPct !== null && (
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <span className="text-gray-400">{isAr ? 'هامش الجملة←تجزئة:' : 'Wholesale→Retail margin:'}</span>
                    <span className="font-black text-green-600">+{retailMarginPct}%</span>
                  </div>
                )}
              </div>
            )}

            {canImport && (
              <div className={`bg-white border-2 rounded-2xl p-5 transition-colors ${isRegistered ? 'border-purple-100 hover:border-purple-200' : 'border-orange-200 hover:border-orange-300'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isRegistered ? 'bg-purple-50' : 'bg-orange-50'}`}>
                    <Plane className={`w-5 h-5 ${isRegistered ? 'text-purple-600' : 'text-orange-600'}`} />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">
                      {isAr ? (isRegistered ? 'استيراد مباشر' : 'استيراد وتسجيل') : (isRegistered ? 'Direct Import' : 'Import & Register')}
                    </div>
                    <div className={`text-xs font-medium ${isRegistered ? 'text-purple-600' : 'text-orange-600'}`}>
                      {isAr
                        ? (isRegistered ? 'العلامة مسجّلة — إجراءات مبسّطة' : 'علامة جديدة — تحتاج تسجيل ESMA')
                        : (isRegistered ? 'Brand registered — simplified process' : 'New brand — ESMA registration required')}
                    </div>
                  </div>
                </div>
                {isRegistered ? (
                  <>
                    <p className="text-xs text-gray-500 leading-relaxed mb-3">
                      {isAr
                        ? 'الاستيراد المباشر من المصنع أو الموزع الإقليمي. العلامة مسجّلة في الإمارات — لا تحتاج تسجيلاً جديداً.'
                        : 'Import directly from manufacturer or regional distributor. Brand is UAE-registered — no new registration needed.'}
                    </p>
                    <div className="space-y-1.5 text-xs">
                      {[
                        isAr ? 'الحصول على تفويض بيع من صاحب العلامة' : 'Get reseller authorization from brand owner',
                        isAr ? 'التخليص الجمركي وفق رمز HS' : 'Customs clearance using HS code',
                        ...(product.hs_code ? [isAr ? `رمز HS: ${product.hs_code}` : `HS Code: ${product.hs_code}`] : []),
                      ].map((step, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-gray-600">
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 flex-shrink-0 mt-0.5" />
                          {step}
                        </div>
                      ))}
                    </div>
                    {importMarginPct !== null && (
                      <div className="mt-3 bg-purple-50 rounded-xl p-2.5 text-xs flex items-center justify-between">
                        <span className="text-purple-700">{isAr ? 'وفر مقارنة بالجملة المحلي:' : 'Savings vs local wholesale:'}</span>
                        <span className="font-black text-purple-700">+{importMarginPct}%</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 leading-relaxed mb-3">
                      {isAr
                        ? 'هذه العلامة لم تُسجَّل في الإمارات بعد — أنت ستكون المستورد الأول وتحصل على ميزة السبق.'
                        : 'This brand is not yet registered in UAE — you will be the first importer with first-mover advantage.'}
                    </p>
                    {(product.registration_months || product.registration_cost_aed) && (
                      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                        {product.registration_months && (
                          <div className="bg-orange-50 rounded-xl p-2.5 text-center">
                            <div className="font-black text-orange-600 text-base">{product.registration_months} {isAr ? 'أشهر' : 'months'}</div>
                            <div className="text-orange-400">{isAr ? 'وقت التسجيل' : 'Registration time'}</div>
                          </div>
                        )}
                        {product.registration_cost_aed && (
                          <div className="bg-orange-50 rounded-xl p-2.5 text-center">
                            <div className="font-black text-orange-600 text-base">{product.registration_cost_aed.toLocaleString()} AED</div>
                            <div className="text-orange-400">{isAr ? 'تكلفة تقديرية' : 'Estimated cost'}</div>
                          </div>
                        )}
                      </div>
                    )}
                    <Link href={`/${locale}/compliance?product=${encodeURIComponent(product.name_en || '')}&status=unregistered`}
                      className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2.5 rounded-xl transition-colors">
                      <FileText className="w-4 h-4" />
                      {isAr ? 'عرض خطة التسجيل الكاملة' : 'View Full Registration Plan'}
                      <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
                    </Link>
                  </>
                )}
              </div>
            )}

            {/* Repackaging */}
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-4">
              <div className="flex items-start gap-2.5">
                <Package className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-gray-600 mb-1">{isAr ? 'هل تفكر في إعادة التعبئة؟' : 'Thinking about repackaging?'}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {isAr
                      ? 'إذا كنت تريد استيراد المادة الخام بالجملة وإعادة تعبئتها تحت علامتك الخاصة، استخدم حاسبة إعادة التعبئة.'
                      : 'If you want to import the raw material in bulk and repackage under your own brand, use the Repackaging Calculator.'}
                  </p>
                  <Link href={`/${locale}/packaging`}
                    className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-orange-500 hover:text-orange-600">
                    {isAr ? 'حاسبة إعادة التعبئة' : 'Repackaging Calculator'}
                    <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* ── Market Analysis ──────────────────────────────────────────────── */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-gray-500 uppercase tracking-widest">
              {isAr ? 'تحليل السوق' : 'Market Analysis'}
            </h2>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs text-gray-400 mb-1">{isAr ? 'مستوى الفرصة' : 'Opportunity Score'}</div>
                  <div className="text-3xl font-black text-gray-900">{gapScore}<span className="text-sm font-normal text-gray-400">/100</span></div>
                </div>
                {product.market_signal && (
                  <span className={`text-sm font-bold px-4 py-2 rounded-xl border ${sig.cls}`}>
                    {isAr ? sig.label_ar : sig.label_en}
                  </span>
                )}
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-4">
                <div
                  className={`h-full rounded-full ${gapScore >= 70 ? 'bg-red-400' : gapScore >= 40 ? 'bg-amber-400' : 'bg-green-400'}`}
                  style={{ width: `${gapScore}%` }}
                />
              </div>
              <div className="space-y-2 text-xs">
                {[
                  { label: isAr ? 'الهامش الإجمالي (جملة←تجزئة)' : 'Gross margin (wholesale→retail)', value: retailMarginPct ? `+${retailMarginPct}%` : '—', positive: true },
                  { label: isAr ? 'وفر الاستيراد المباشر' : 'Direct import savings', value: importMarginPct ? `+${importMarginPct}%` : isRegistered ? '—' : isAr ? 'أول مستورد' : 'First importer', positive: true },
                  { label: isAr ? 'سعر الجملة/الكرتون' : 'Wholesale price/carton', value: priceWholesale ? `${priceWholesale} AED` : '—', positive: null },
                  { label: isAr ? 'سعر التجزئة/وحدة' : 'Retail price/unit', value: priceRetail ? `${priceRetail} AED` : '—', positive: null },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-gray-400">{row.label}</span>
                    <span className={`font-bold ${row.positive === true ? 'text-green-600' : 'text-gray-900'}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Specs */}
            {(product.hs_code || product.unit_size || product.units_per_carton || product.shelf_life_months || product.storage_temp || product.barcode_type) && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
                  {isAr ? 'مواصفات المنتج' : 'Product Specifications'}
                </h3>
                <div className="space-y-2 text-xs">
                  {[
                    { label: isAr ? 'رمز النظام المنسق (HS)' : 'HS Code', value: product.hs_code },
                    { label: isAr ? 'حجم الوحدة / الكرتون' : 'Unit Size / Carton', value: product.unit_size },
                    { label: isAr ? 'عدد وحدات الكرتون' : 'Units per Carton', value: product.units_per_carton ? `${product.units_per_carton} ${isAr ? 'وحدة' : 'units'}` : null },
                    { label: isAr ? 'مدة الصلاحية' : 'Shelf Life', value: product.shelf_life_months ? `${product.shelf_life_months} ${isAr ? 'شهر' : 'months'}` : null },
                    { label: isAr ? 'ظروف التخزين' : 'Storage Conditions', value: product.storage_temp },
                    { label: isAr ? 'نوع الباركود' : 'Barcode Type', value: product.barcode_type },
                  ].filter(r => r.value).map((row, i) => (
                    <div key={i} className="flex items-start justify-between py-1.5 border-b border-gray-50 last:border-0 gap-4">
                      <span className="text-gray-400 flex-shrink-0">{row.label}</span>
                      <span className="font-semibold text-gray-800 text-end">{row.value}</span>
                    </div>
                  ))}
                </div>
                {product.certifications && product.certifications.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-2">{isAr ? 'الشهادات والاعتمادات' : 'Certifications'}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {product.certifications.map(cert => (
                        <span key={cert} className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2.5 py-1 font-semibold">
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Registration Requirements ──────────────────────────────────────── */}
        {!isRegistered && product.required_docs && product.required_docs.length > 0 && (
          <div className="bg-white border-2 border-orange-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="font-black text-gray-900">{isAr ? 'متطلبات التسجيل والاستيراد في الإمارات' : 'UAE Registration & Import Requirements'}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isAr ? 'هذه الوثائق مطلوبة لتسجيل العلامة التجارية واستيرادها للمرة الأولى' : 'Required to register this brand and import it for the first time into UAE'}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {product.required_docs.map((doc, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <div className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">{i + 1}</div>
                  {doc}
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href={`/${locale}/compliance?product=${encodeURIComponent(product.name_en || '')}&status=unregistered`}
                className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-2xl text-sm">
                <FileText className="w-4 h-4" />
                {isAr ? 'فتح فاحص الاشتراطات الكامل' : 'Open Full Compliance Checker'}
                <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
              </Link>
            </div>
          </div>
        )}

        {/* ── Market Signals ──────────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-orange-500" />
              </div>
              <h2 className="font-black text-gray-900">{isAr ? 'إشارات السوق' : 'Market Signals'}</h2>
            </div>
            {signals?.updated_at && (
              <span className="text-[10px] text-gray-400">
                {isAr ? 'آخر تحديث:' : 'Updated:'} {new Date(signals.updated_at).toLocaleDateString(isAr ? 'ar-AE' : 'en-AE')}
              </span>
            )}
          </div>
          {signals ? (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label_ar: 'الطلب', label_en: 'Demand', value: signals.demand_score ?? 0, color: 'text-green-600', bg: 'bg-green-50', bar: 'bg-green-400' },
                { label_ar: 'العرض', label_en: 'Supply', value: signals.supply_score ?? 0, color: 'text-blue-600', bg: 'bg-blue-50', bar: 'bg-blue-400' },
                { label_ar: 'فجوة السوق', label_en: 'Market Gap', value: signals.gap_score ?? 0, color: 'text-orange-600', bg: 'bg-orange-50', bar: 'bg-orange-400' },
              ].map((s, i) => (
                <div key={i} className={`${s.bg} rounded-2xl p-4 text-center`}>
                  <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-gray-400 mb-2">/100</div>
                  <div className="w-full h-1.5 bg-white/60 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${s.value}%` }} />
                  </div>
                  <div className={`text-xs font-bold mt-2 ${s.color}`}>{isAr ? s.label_ar : s.label_en}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label_ar: 'الطلب', label_en: 'Demand', value: gapScore > 60 ? Math.min(gapScore + 15, 100) : gapScore, color: 'text-green-600', bg: 'bg-green-50', bar: 'bg-green-400' },
                { label_ar: 'العرض', label_en: 'Supply', value: product.market_signal === 'shortage' ? Math.max(100 - gapScore, 10) : 55, color: 'text-blue-600', bg: 'bg-blue-50', bar: 'bg-blue-400' },
                { label_ar: 'فجوة السوق', label_en: 'Market Gap', value: gapScore, color: 'text-orange-600', bg: 'bg-orange-50', bar: 'bg-orange-400' },
              ].map((s, i) => (
                <div key={i} className={`${s.bg} rounded-2xl p-4 text-center`}>
                  <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-gray-400 mb-2">/100</div>
                  <div className="w-full h-1.5 bg-white/60 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${s.value}%` }} />
                  </div>
                  <div className={`text-xs font-bold mt-2 ${s.color}`}>{isAr ? s.label_ar : s.label_en}</div>
                </div>
              ))}
              <div className="col-span-3 text-center text-xs text-gray-400 py-1">
                {isAr ? 'بيانات تقديرية — يمكن تحديثها من لوحة التحكم' : 'Estimated data — can be refreshed from dashboard'}
              </div>
            </div>
          )}
        </div>

        {/* ── FMCG Velocity ────────────────────────────────────────────────────── */}
        {fmcg && (
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h2 className="font-black text-gray-900 text-sm">{isAr ? 'معيار FMCG — سرعة تداول السوق' : 'FMCG Velocity Standard'}</h2>
                  <p className="text-[10px] text-gray-400">{isAr ? 'تصنيف ABC للبضائع سريعة التداول — السوق الإماراتي' : 'ABC velocity classification — UAE market'}</p>
                </div>
              </div>
              <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black text-xl border-2 ${
                fmcg.class === 'A' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : fmcg.class === 'B' ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                {fmcg.class}
                <span className="text-[8px] font-bold mt-0.5 opacity-70">CLASS</span>
              </div>
            </div>
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-400">{isAr ? 'نقاط سرعة التداول' : 'Velocity Score'}</span>
                <span className="text-sm font-black text-gray-900">{fmcg.fmcg_score}<span className="text-xs font-normal text-gray-400">/100</span></span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden relative">
                <div className={`h-full rounded-full ${fmcg.fmcg_score >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : fmcg.fmcg_score >= 50 ? 'bg-gradient-to-r from-blue-400 to-blue-500' : 'bg-gradient-to-r from-gray-300 to-gray-400'}`} style={{ width: `${fmcg.fmcg_score}%` }} />
                <div className="absolute top-0 bottom-0 left-[50%] w-px bg-white/60" />
                <div className="absolute top-0 bottom-0 left-[80%] w-px bg-white/60" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { icon: '📅', label_ar: 'أيام الدوران', label_en: 'Turnover Days', value: `${fmcg.turnover_days} ${isAr ? 'يوم' : 'days'}`, color: 'bg-orange-50 border-orange-100' },
                { icon: '🏪', label_ar: 'وحدة/أسبوع/متجر', label_en: 'Units/Week/Store', value: fmcg.weekly_units_per_store, color: 'bg-blue-50 border-blue-100' },
                { icon: '🗺️', label_ar: 'انتشار في السوق', label_en: 'Market Penetration', value: `${fmcg.market_penetration_pct}%`, color: 'bg-purple-50 border-purple-100' },
                { icon: '🔄', label_ar: 'دورات/السنة', label_en: 'Cycles/Year', value: Math.round(365 / fmcg.turnover_days), color: 'bg-emerald-50 border-emerald-100' },
              ].map((m, i) => (
                <div key={i} className={`${m.color} border rounded-2xl p-3`}>
                  <div className="text-lg mb-1">{m.icon}</div>
                  <div className="text-xl font-black text-gray-900">{m.value}</div>
                  <div className="text-[10px] font-bold text-gray-500 mt-0.5">{isAr ? m.label_ar : m.label_en}</div>
                </div>
              ))}
            </div>
            <div className={`rounded-2xl p-4 flex items-start gap-3 ${fmcg.class === 'A' ? 'bg-emerald-50 border border-emerald-100' : fmcg.class === 'B' ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50 border border-gray-100'}`}>
              <span className="text-2xl">{fmcg.class === 'A' ? '🚀' : fmcg.class === 'B' ? '📊' : '🐢'}</span>
              <div>
                <p className={`text-sm font-bold mb-0.5 ${fmcg.class === 'A' ? 'text-emerald-700' : fmcg.class === 'B' ? 'text-blue-700' : 'text-gray-600'}`}>
                  {isAr ? (fmcg.class === 'A' ? 'فئة A — بضاعة سريعة التداول' : fmcg.class === 'B' ? 'فئة B — متوسطة التداول' : 'فئة C — بطيئة التداول') : (fmcg.class === 'A' ? 'Class A — Fast Mover' : fmcg.class === 'B' ? 'Class B — Medium Velocity' : 'Class C — Slow Mover')}
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">{isAr ? fmcg.note_ar : fmcg.note_en}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── RFQ CTA ──────────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-3xl p-6 md:p-8 text-white shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-lg">{isAr ? 'مهتم بهذا المنتج؟' : 'Interested in this product?'}</h2>
              <p className="text-white/80 text-sm mt-0.5">
                {isAr ? 'اطلب عرض سعر أو استشارة استيراد — سنتواصل معك خلال 24 ساعة.' : 'Request a quote or import consultation — we will reach out within 24 hours.'}
              </p>
            </div>
          </div>
          <Link href={`/${locale}/rfq?product=${encodeURIComponent(product.name_en || '')}`}
            className="inline-flex items-center justify-center gap-2 bg-white text-orange-600 font-bold py-2.5 px-5 rounded-xl text-sm hover:bg-orange-50 transition-colors">
            {isAr ? 'اطلب عرض سعر' : 'Request a Quote'}
            <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
          </Link>
        </div>

        {/* Back */}
        <div className="flex justify-start">
          <Link href={`/${locale}/products`} className="flex items-center gap-2 text-sm text-gray-400 hover:text-orange-500 transition-colors font-medium">
            <ChevronLeft className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
            {isAr ? 'العودة إلى قائمة المنتجات' : 'Back to Products'}
          </Link>
        </div>
      </div>
    </div>
  )
}
