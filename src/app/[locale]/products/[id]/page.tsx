import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  Globe, Tag, Clock, Award, ArrowRight, CheckCircle2, AlertTriangle,
  ShoppingCart, Plane, FileText, TrendingUp, TrendingDown, Minus,
  Package, Building2, ChevronLeft, BarChart3, Info,
} from 'lucide-react'
import { PRODUCTS_CATALOG, getProductSlug } from '@/lib/data/products-catalog'
import { getProductSignals } from '@/lib/supabase/actions'

const SIGNAL_CONFIG = {
  shortage:  { label_ar: 'نقص عرض',      label_en: 'Supply Shortage', cls: 'bg-red-100 text-red-700 border-red-200',    Icon: TrendingDown },
  rising:    { label_ar: 'طلب صاعد',      label_en: 'Rising Demand',   cls: 'bg-green-100 text-green-700 border-green-200', Icon: TrendingUp },
  arbitrage: { label_ar: 'مراجحة سعرية',  label_en: 'Price Arbitrage', cls: 'bg-amber-100 text-amber-700 border-amber-200', Icon: BarChart3 },
  stable:    { label_ar: 'مستقر',         label_en: 'Stable',          cls: 'bg-gray-100 text-gray-500 border-gray-200',   Icon: Minus },
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const isAr = locale === 'ar'
  const product = PRODUCTS_CATALOG.find(p => getProductSlug(p) === id || p.id === id)
  if (!product) notFound()

  const slug = getProductSlug(product)
  const signals = await getProductSignals(slug).catch(() => null)

  const sig = SIGNAL_CONFIG[product.market_signal]
  const SigIcon = sig.Icon
  const isRegistered = product.registration_status === 'registered_uae'
  const canTradeLocally = product.acquisition_type === 'local_trade' || product.acquisition_type === 'both'
  const canImport = product.acquisition_type === 'direct_import' || product.acquisition_type === 'both'

  const retailMarginPct = product.price_retail_aed > 0 && product.price_wholesale_aed > 0
    ? Math.round(((product.price_retail_aed * product.units_per_carton - product.price_wholesale_aed) / product.price_wholesale_aed) * 100)
    : null
  const importMarginPct = product.price_import_aed && product.price_wholesale_aed > 0
    ? Math.round(((product.price_wholesale_aed - product.price_import_aed) / product.price_import_aed) * 100)
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-2 text-sm text-gray-400">
          <Link href={`/${locale}`} className="hover:text-gray-700 transition-colors">{isAr ? 'الرئيسية' : 'Home'}</Link>
          <ChevronLeft className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
          <Link href={`/${locale}/products`} className="hover:text-gray-700 transition-colors">{isAr ? 'المنتجات' : 'Products'}</Link>
          <ChevronLeft className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
          <span className="text-gray-700 font-medium truncate max-w-xs">{isAr ? product.name_ar : product.name_en}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="flex flex-col md:flex-row">
            {/* Emoji panel */}
            <div className="md:w-52 flex-shrink-0 h-48 md:h-auto bg-gradient-to-br from-orange-50 via-amber-50 to-white flex items-center justify-center text-7xl border-b md:border-b-0 md:border-e border-gray-100">
              {product.image_emoji}
            </div>
            {/* Info */}
            <div className="flex-1 p-6 md:p-8">
              <div className="flex flex-wrap gap-2 mb-3">
                {/* Registration badge */}
                {isRegistered ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isAr ? 'مسجّل في الإمارات' : 'Registered in UAE'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {isAr ? 'غير مسجّل — فرصة استيراد' : 'Unregistered — Import Opportunity'}
                  </span>
                )}
                {/* Signal badge */}
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${sig.cls}`}>
                  <SigIcon className="w-3.5 h-3.5" />
                  {isAr ? sig.label_ar : sig.label_en}
                </span>
                {/* Category */}
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-500">
                  {isAr ? product.subcategory_ar : product.subcategory_en}
                </span>
              </div>

              <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-1">
                {isAr ? product.name_ar : product.name_en}
              </h1>
              <p className="text-gray-400 text-sm mb-1">{product.brand}</p>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
                <Globe className="w-4 h-4" />
                {isAr ? product.country_origin_ar : product.country_origin}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                {isAr ? product.description_ar : product.description_en}
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* ── Business Paths ──────────────────────────────────────────── */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-gray-500 uppercase tracking-widest">
              {isAr ? 'مسارات الاستفادة' : 'Business Paths'}
            </h2>

            {/* Local Trade */}
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

            {/* Direct Import */}
            {canImport && (
              <div className={`bg-white border-2 rounded-2xl p-5 transition-colors ${isRegistered ? 'border-purple-100 hover:border-purple-200' : 'border-orange-200 hover:border-orange-300'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isRegistered ? 'bg-purple-50' : 'bg-orange-50'}`}>
                    <Plane className={`w-5 h-5 ${isRegistered ? 'text-purple-600' : 'text-orange-600'}`} />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">
                      {isAr
                        ? (isRegistered ? 'استيراد مباشر' : 'استيراد وتسجيل')
                        : (isRegistered ? 'Direct Import' : 'Import & Register')}
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
                        ? 'الاستيراد المباشر من المصنع أو الموزع الإقليمي بتكلفة أقل من الشراء المحلي. العلامة مسجّلة في الإمارات — لا تحتاج تسجيلاً جديداً.'
                        : 'Import directly from manufacturer or regional distributor at lower cost. Brand is already UAE-registered — no new registration needed.'}
                    </p>
                    <div className="space-y-1.5 text-xs">
                      {[
                        isAr ? 'الحصول على تفويض بيع من صاحب العلامة' : 'Get reseller authorization from brand owner',
                        isAr ? 'التخليص الجمركي وفق رمز HS' : 'Customs clearance using HS code',
                        isAr ? `رمز HS: ${product.hs_code}` : `HS Code: ${product.hs_code}`,
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
                        ? 'هذه العلامة لم تُسجَّل في الإمارات بعد — أنت ستكون المستورد الأول وتحصل على ميزة السبق في السوق.'
                        : 'This brand is not yet registered in UAE — you will be the first importer with first-mover market advantage.'}
                    </p>
                    <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                      <div className="bg-orange-50 rounded-xl p-2.5 text-center">
                        <div className="font-black text-orange-600 text-base">{product.registration_months} {isAr ? 'أشهر' : 'months'}</div>
                        <div className="text-orange-400">{isAr ? 'وقت التسجيل' : 'Registration time'}</div>
                      </div>
                      <div className="bg-orange-50 rounded-xl p-2.5 text-center">
                        <div className="font-black text-orange-600 text-base">{(product.registration_cost_aed ?? 0).toLocaleString()} AED</div>
                        <div className="text-orange-400">{isAr ? 'تكلفة تقديرية' : 'Estimated cost'}</div>
                      </div>
                    </div>
                    <Link href={`/${locale}/compliance?product=${encodeURIComponent(product.name_en)}&status=unregistered`}
                      className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2.5 rounded-xl transition-colors">
                      <FileText className="w-4 h-4" />
                      {isAr ? 'عرض خطة التسجيل الكاملة' : 'View Full Registration Plan'}
                      <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
                    </Link>
                  </>
                )}
              </div>
            )}

            {/* Repackaging note */}
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-4">
              <div className="flex items-start gap-2.5">
                <Package className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-gray-600 mb-1">{isAr ? 'هل تفكر في إعادة التعبئة؟' : 'Thinking about repackaging?'}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {isAr
                      ? 'إذا كنت تريد استيراد المادة الخام (الأرز، الزيت، البهارات...) بالجملة وإعادة تعبئتها تحت علامتك الخاصة، استخدم حاسبة إعادة التعبئة.'
                      : 'If you want to import the raw material in bulk and repackage under your own brand, use the Repackaging Calculator.'}
                  </p>
                  <Link href={`/${locale}/packaging`}
                    className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors">
                    {isAr ? 'حاسبة إعادة التعبئة' : 'Repackaging Calculator'}
                    <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* ── Market + Specs ──────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Market Analysis */}
            <h2 className="text-sm font-black text-gray-500 uppercase tracking-widest">
              {isAr ? 'تحليل السوق' : 'Market Analysis'}
            </h2>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs text-gray-400 mb-1">{isAr ? 'مستوى الفرصة' : 'Opportunity Score'}</div>
                  <div className="text-3xl font-black text-gray-900">{product.gap_score}<span className="text-sm font-normal text-gray-400">/100</span></div>
                </div>
                <span className={`text-sm font-bold px-4 py-2 rounded-xl border ${sig.cls}`}>
                  {isAr ? sig.label_ar : sig.label_en}
                </span>
              </div>
              {/* Score bar */}
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-4">
                <div
                  className={`h-full rounded-full transition-all ${product.gap_score >= 70 ? 'bg-red-400' : product.gap_score >= 40 ? 'bg-amber-400' : 'bg-green-400'}`}
                  style={{ width: `${product.gap_score}%` }}
                />
              </div>
              <div className="space-y-2 text-xs">
                {[
                  { label: isAr ? 'الهامش الإجمالي (جملة←تجزئة)' : 'Gross margin (wholesale→retail)', value: retailMarginPct ? `+${retailMarginPct}%` : '—', positive: true },
                  { label: isAr ? 'وفر الاستيراد المباشر' : 'Direct import savings', value: importMarginPct ? `+${importMarginPct}%` : isRegistered ? '—' : isAr ? 'أول مستورد' : 'First importer', positive: true },
                  { label: isAr ? 'سعر الجملة/الكرتون' : 'Wholesale price/carton', value: product.price_wholesale_aed > 0 ? `${product.price_wholesale_aed} AED` : isAr ? 'يُحدَّد بعد التسجيل' : 'TBD after registration', positive: null },
                  { label: isAr ? 'سعر التجزئة/وحدة' : 'Retail price/unit', value: product.price_retail_aed > 0 ? `${product.price_retail_aed} AED` : isAr ? 'مقدّر ~9-12 AED' : 'Est. ~9-12 AED', positive: null },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-gray-400">{row.label}</span>
                    <span className={`font-bold ${row.positive === true ? 'text-green-600' : 'text-gray-900'}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Specs */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
                {isAr ? 'مواصفات المنتج' : 'Product Specifications'}
              </h3>
              <div className="space-y-2 text-xs">
                {[
                  { label: isAr ? 'رمز النظام المنسق (HS)' : 'HS Code', value: product.hs_code },
                  { label: isAr ? 'حجم الوحدة / الكرتون' : 'Unit Size / Carton', value: product.unit_size },
                  { label: isAr ? 'عدد وحدات الكرتون' : 'Units per Carton', value: `${product.units_per_carton} ${isAr ? 'وحدة' : 'units'}` },
                  { label: isAr ? 'مدة الصلاحية' : 'Shelf Life', value: `${product.shelf_life_months} ${isAr ? 'شهر' : 'months'}` },
                  { label: isAr ? 'ظروف التخزين' : 'Storage Conditions', value: product.storage_temp },
                  { label: isAr ? 'نوع الباركود' : 'Barcode Type', value: product.barcode_type },
                ].map((row, i) => (
                  <div key={i} className="flex items-start justify-between py-1.5 border-b border-gray-50 last:border-0 gap-4">
                    <span className="text-gray-400 flex-shrink-0">{row.label}</span>
                    <span className="font-semibold text-gray-800 text-end">{row.value}</span>
                  </div>
                ))}
              </div>
              {/* Certifications */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-2">{isAr ? 'الشهادات والاعتمادات' : 'Certifications'}</p>
                <div className="flex flex-wrap gap-1.5">
                  {product.certifications.map(cert => (
                    <span key={cert} className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2.5 py-1 font-semibold">
                      <Award className="w-3 h-3" />{cert}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Registration Requirements (unregistered only) ──────────────── */}
        {!isRegistered && product.required_docs && (
          <div className="bg-white border-2 border-orange-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="font-black text-gray-900">
                  {isAr ? 'متطلبات التسجيل والاستيراد في الإمارات' : 'UAE Registration & Import Requirements'}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isAr
                    ? 'هذه الوثائق مطلوبة لتسجيل العلامة التجارية واستيرادها للمرة الأولى في الإمارات'
                    : 'Required to register this brand and import it for the first time into UAE'}
                </p>
              </div>
            </div>

            {/* Regulatory bodies */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { name: 'ESMA', desc_ar: 'الهيئة الاتحادية للمواصفات', desc_en: 'Federal Standards Authority' },
                { name: 'ADAFSA', desc_ar: 'سلطة أبوظبي للزراعة', desc_en: 'Abu Dhabi Agriculture Authority' },
                { name: 'Dubai Municipality', desc_ar: 'بلدية دبي — الأغذية', desc_en: 'Dubai Municipality — Food' },
              ].map(body => (
                <div key={body.name} className="bg-orange-50 rounded-xl p-3 text-center">
                  <div className="text-xs font-black text-orange-700">{body.name}</div>
                  <div className="text-[10px] text-orange-400 mt-0.5">{isAr ? body.desc_ar : body.desc_en}</div>
                </div>
              ))}
            </div>

            {/* Required docs */}
            <div className="space-y-2">
              {product.required_docs.map((doc, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <div className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">{i + 1}</div>
                  {doc}
                </div>
              ))}
            </div>

            <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-700">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {isAr
                ? 'التكلفة والمدة تقديرية وتتفاوت حسب صنف المنتج ومعقد الملف. يُنصح باستشارة وكيل تخليص جمركي معتمد في الإمارات.'
                : 'Cost and timeline are estimates and vary by product class and file complexity. We recommend consulting a licensed UAE customs clearance agent.'}
            </div>

            <div className="mt-4">
              <Link href={`/${locale}/compliance?product=${encodeURIComponent(product.name_en)}&status=unregistered`}
                className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-2xl transition-colors text-sm">
                <FileText className="w-4 h-4" />
                {isAr ? 'فتح فاحص الاشتراطات الكامل' : 'Open Full Compliance Checker'}
                <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
              </Link>
            </div>
          </div>
        )}

        {/* ── Market Signals ──────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-orange-500" />
              </div>
              <h2 className="font-black text-gray-900">
                {isAr ? 'إشارات السوق' : 'Market Signals'}
              </h2>
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
                { label_ar: 'الطلب', label_en: 'Demand', value: signals.demand_score, color: 'text-green-600', bg: 'bg-green-50', bar: 'bg-green-400' },
                { label_ar: 'العرض', label_en: 'Supply', value: signals.supply_score, color: 'text-blue-600', bg: 'bg-blue-50', bar: 'bg-blue-400' },
                { label_ar: 'فجوة السوق', label_en: 'Market Gap', value: signals.gap_score, color: 'text-orange-600', bg: 'bg-orange-50', bar: 'bg-orange-400' },
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
              {signals.details_ar && (
                <div className="col-span-3 bg-gray-50 rounded-xl p-3 text-xs text-gray-600">
                  {isAr ? signals.details_ar : signals.details_en}
                </div>
              )}
              {signals.recommended_action_ar && (
                <div className="col-span-3 flex items-start gap-2 bg-orange-50 border border-orange-100 rounded-xl p-3 text-xs text-orange-700">
                  <TrendingUp className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>{isAr ? signals.recommended_action_ar : signals.recommended_action_en}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label_ar: 'الطلب', label_en: 'Demand', value: product.gap_score > 60 ? Math.min(product.gap_score + 15, 100) : product.gap_score, color: 'text-green-600', bg: 'bg-green-50', bar: 'bg-green-400' },
                { label_ar: 'العرض', label_en: 'Supply', value: product.market_signal === 'shortage' ? Math.max(100 - product.gap_score, 10) : 55, color: 'text-blue-600', bg: 'bg-blue-50', bar: 'bg-blue-400' },
                { label_ar: 'فجوة السوق', label_en: 'Market Gap', value: product.gap_score, color: 'text-orange-600', bg: 'bg-orange-50', bar: 'bg-orange-400' },
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

        {/* ── Back button ─────────────────────────────────────────────────── */}
        <div className="flex justify-start">
          <Link href={`/${locale}/products`}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-orange-500 transition-colors font-medium">
            <ChevronLeft className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
            {isAr ? 'العودة إلى قائمة المنتجات' : 'Back to Products'}
          </Link>
        </div>
      </div>
    </div>
  )
}
