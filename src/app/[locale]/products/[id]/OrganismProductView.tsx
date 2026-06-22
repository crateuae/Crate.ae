import Link from 'next/link'
import {
  Sparkles, ChevronLeft, Globe, Tag, TrendingUp, ShieldCheck,
  AlertTriangle, ArrowRight, FileText, Info,
} from 'lucide-react'

export interface OrganismProduct {
  id: string
  slug: string
  name_ar: string
  name_en: string
  type_ar?: string | null
  type_en?: string | null
  content_ar?: string | null
  content_en?: string | null
  tags?: string[] | null
  country_origin?: string | null
  price_aed?: number | null
  price_on_request?: boolean | null
  category_id?: string | null
  organism_opportunity_id?: string | null
  published_at?: string | null
}

/** Opportunity tier badge — verified / high / opportunity */
function tierBadge(type: 'verified' | 'high' | 'opportunity', isAr: boolean) {
  const map = {
    verified: {
      ar: 'فرصة موثّقة', en: 'Verified Opportunity',
      cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', Icon: ShieldCheck,
    },
    high: {
      ar: 'فرصة عالية', en: 'High Opportunity',
      cls: 'bg-amber-100 text-amber-700 border-amber-200', Icon: TrendingUp,
    },
    opportunity: {
      ar: 'فرصة', en: 'Opportunity',
      cls: 'bg-blue-100 text-blue-700 border-blue-200', Icon: Sparkles,
    },
  }
  return map[type]
}

/** Render markdown-ish body content into paragraphs (organism writes plain text + headers). */
function renderBody(body: string) {
  return body.split(/\n{2,}/).map((block, i) => {
    const trimmed = block.trim()
    if (!trimmed) return null
    // Heading: line starting with ## or #
    if (/^#{1,3}\s/.test(trimmed)) {
      const text = trimmed.replace(/^#{1,3}\s/, '')
      return (
        <h2 key={i} className="text-lg font-black text-gray-900 mt-6 mb-2">{text}</h2>
      )
    }
    // Bullet list
    if (/^[-*]\s/m.test(trimmed)) {
      const items = trimmed.split('\n').filter(l => /^[-*]\s/.test(l.trim()))
      return (
        <ul key={i} className="list-disc ps-5 space-y-1.5 text-gray-600 text-sm leading-relaxed my-3">
          {items.map((it, j) => <li key={j}>{it.replace(/^[-*]\s/, '')}</li>)}
        </ul>
      )
    }
    return (
      <p key={i} className="text-gray-600 text-sm leading-relaxed my-3">{trimmed}</p>
    )
  })
}

export default function OrganismProductView({
  product, locale, type,
}: {
  product: OrganismProduct
  locale: string
  type: 'verified' | 'high' | 'opportunity'
}) {
  const isAr = locale === 'ar'
  const badge = tierBadge(type, isAr)
  const BadgeIcon = badge.Icon
  const body = isAr ? product.content_ar : product.content_en
  const name = isAr ? product.name_ar : product.name_en
  const typeLabel = isAr ? product.type_ar : product.type_en

  // Which commerce fields are still missing (filled in later from dashboard)
  const missingPrice = !product.price_aed && !product.price_on_request
  const missingCategory = !product.category_id
  const incomplete = missingPrice || missingCategory

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-2 text-sm text-gray-400">
          <Link href={`/${locale}`} className="hover:text-gray-700 transition-colors">{isAr ? 'الرئيسية' : 'Home'}</Link>
          <ChevronLeft className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
          <Link href={`/${locale}/products`} className="hover:text-gray-700 transition-colors">{isAr ? 'المنتجات' : 'Products'}</Link>
          <ChevronLeft className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
          <span className="text-gray-700 font-medium truncate max-w-xs">{name}</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Hero */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${badge.cls}`}>
              <BadgeIcon className="w-3.5 h-3.5" />
              {isAr ? badge.ar : badge.en}
            </span>
            {typeLabel && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-500">
                <Tag className="w-3.5 h-3.5" />{typeLabel}
              </span>
            )}
            {product.country_origin && product.country_origin !== 'Unknown' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-500">
                <Globe className="w-3.5 h-3.5" />{product.country_origin}
              </span>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight mb-3">{name}</h1>

          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {product.tags.slice(0, 8).map(t => (
                <span key={t} className="text-[10px] bg-orange-50 text-orange-600 border border-orange-100 rounded-full px-2.5 py-0.5 font-semibold">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Incomplete-data notice (data filled in later from dashboard) */}
        {incomplete && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-2.5 text-xs text-amber-700">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              {isAr
                ? 'بيانات التجارة (السعر، الفئة) قيد الاستكمال لهذه الفرصة — تواصل معنا للحصول على عرض سعر محدّث.'
                : 'Commerce data (price, category) is being completed for this opportunity — contact us for an up-to-date quote.'}
            </span>
          </div>
        )}

        {/* SEO content body */}
        {body && (
          <article className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm">
            {renderBody(body)}
          </article>
        )}

        {/* RFQ CTA */}
        <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-3xl p-6 md:p-8 text-white shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-lg">{isAr ? 'مهتم بهذه الفرصة؟' : 'Interested in this opportunity?'}</h2>
              <p className="text-white/80 text-sm mt-0.5">
                {isAr
                  ? 'اطلب عرض سعر أو استشارة استيراد — سنتواصل معك خلال 24 ساعة.'
                  : 'Request a quote or import consultation — we will reach out within 24 hours.'}
              </p>
            </div>
          </div>
          <Link
            href={`/${locale}/rfq?product=${encodeURIComponent(product.name_en)}&type=${type}`}
            className="inline-flex items-center justify-center gap-2 bg-white text-orange-600 font-bold py-2.5 px-5 rounded-xl text-sm hover:bg-orange-50 transition-colors"
          >
            {isAr ? 'اطلب عرض سعر' : 'Request a Quote'}
            <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
          </Link>
        </div>

        {/* Unregistered-import hint */}
        <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-4 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-500 leading-relaxed">
            {isAr
              ? 'هذه فرصة منتج جديدة اكتشفها نظام كريت — قد تحتاج لتسجيل في الإمارات قبل الاستيراد. '
              : 'This is a new product opportunity discovered by the Crate organism — it may require UAE registration before import. '}
            <Link href={`/${locale}/compliance?product=${encodeURIComponent(product.name_en)}`} className="text-orange-500 font-bold hover:text-orange-600">
              {isAr ? 'تحقق من الاشتراطات' : 'Check compliance requirements'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
