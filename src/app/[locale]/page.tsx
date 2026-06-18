import Link from 'next/link'
import { BarChart2, ShieldCheck, Package, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'

async function getStats() {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const [{ count: products }, { count: alerts }] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('gap_alerts').select('*', { count: 'exact', head: true }).eq('is_active', true),
    ])
    return { products: products || 25, alerts: alerts || 18, rules: 47, categories: 15 }
  } catch {
    return { products: 25, alerts: 18, rules: 47, categories: 15 }
  }
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const stats = await getStats()
  const isAr = locale === 'ar'
  const Arrow = isAr ? ArrowLeft : ArrowRight

  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-orange-50 via-white to-white border-b border-gray-100 px-6 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-4 py-2 text-orange-600 text-sm font-semibold mb-8">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            {isAr ? 'يرصد السوق الإماراتي ويحدّث الفرص يومياً' : 'Monitors the UAE market and updates opportunities daily'}
          </div>

          <h1 className="text-5xl md:text-6xl font-black text-gray-900 leading-tight tracking-tight mb-4">
            {isAr ? (
              <>استورد بذكاء.<br />وزّع بثقة.</>
            ) : (
              <>Import Smart.<br />Supply with Confidence.</>
            )}
          </h1>

          <p className="text-lg text-gray-500 mb-3 max-w-2xl mx-auto leading-relaxed">
            {isAr
              ? 'Crate منصة متكاملة لتجار الاستيراد والتوريد في الإمارات — تكشف فجوات السوق الغذائي، تفحص اشتراطات تسجيل المنتجات، وتبني خطط التعبئة الاحترافية'
              : 'Crate is an all-in-one platform for UAE import and supply traders — revealing food market gaps, checking product registration requirements, and building professional packaging plans'}
          </p>
          <p className="text-sm text-orange-500 font-semibold mb-10">
            {isAr ? 'مرخّص للتجارة في الإمارات | يغطي معايير ESMA, UAE.S, ADAFSA' : 'Licensed for UAE trade | Covers ESMA, UAE.S, ADAFSA standards'}
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <Link href={`/${locale}/market`}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-7 py-3.5 rounded-xl transition-all shadow-sm hover:shadow-orange-200 hover:shadow-md hover:-translate-y-0.5">
              <BarChart2 className="w-5 h-5" />
              {isAr ? 'اكتشف فرص السوق' : 'Discover Market Opportunities'}
              <Arrow className="w-4 h-4" />
            </Link>
            <Link href={`/${locale}/compliance`}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold px-6 py-3.5 rounded-xl border border-gray-200 hover:border-gray-300 transition-all">
              <ShieldCheck className="w-5 h-5" />
              {isAr ? 'اشتراطات التسجيل' : 'Registration Requirements'}
            </Link>
            <Link href={`/${locale}/packaging`}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold px-6 py-3.5 rounded-xl border border-gray-200 hover:border-gray-300 transition-all">
              <Package className="w-5 h-5" />
              {isAr ? 'تخطيط التوريد' : 'Supply Planning'}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-b border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100 rtl:divide-x-reverse">
          {[
            { value: stats.products + '+', label_ar: 'منتج مرصود', label_en: 'Monitored Products' },
            { value: stats.alerts, label_ar: 'فرصة سوقية نشطة', label_en: 'Active Market Opportunities' },
            { value: stats.rules, label_ar: 'اشتراط تسجيل', label_en: 'Registration Requirements' },
            { value: stats.categories, label_ar: 'تصنيف غذائي', label_en: 'Food Categories' },
          ].map((s, i) => (
            <div key={i} className="py-6 px-8 text-center">
              <div className="text-3xl font-black text-orange-500">{s.value}</div>
              <div className="text-gray-400 text-xs mt-1">{isAr ? s.label_ar : s.label_en}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-6 py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">
              {isAr ? 'ثلاث أدوات. منفعة واحدة.' : 'Three Tools. One Profit.'}
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              {isAr
                ? 'صُمّمت لتاجر الاستيراد الذي يريد رؤية الفرصة قبل المنافس، وإنجاز الإجراءات في أسرع وقت'
                : 'Built for the import trader who wants to see the opportunity before the competition and complete procedures in the shortest time'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: BarChart2,
                bg: 'bg-orange-50',
                iconColor: 'text-orange-500',
                border: 'hover:border-orange-200',
                badge: isAr ? 'يُحدَّث يومياً' : 'Updated Daily',
                badgeColor: 'bg-orange-100 text-orange-600',
                title_ar: 'فرص السوق',
                title_en: 'Market Opportunities',
                desc_ar: 'يرصد يومياً نون، أمازون.ae، كارفور، لولو وGoogle Trends — يحسب فجوات العرض والطلب ويصنّف الفرص حسب الأولوية والعائد المتوقع',
                desc_en: 'Monitors daily Noon, Amazon.ae, Carrefour, Lulu & Google Trends — calculates supply/demand gaps and ranks opportunities by priority and expected return',
                points_ar: ['نقص المخزون فرصة شراء فورية', 'مراجحة الأسعار بين المنافذ', 'صعود الطلب قبل رفع السعر'],
                points_en: ['Stock shortage = immediate buy opportunity', 'Price arbitrage between outlets', 'Demand surge before price rise'],
                href: '/market',
                cta_ar: 'اكتشف الفرص الآن',
                cta_en: 'Discover Opportunities',
              },
              {
                icon: ShieldCheck,
                bg: 'bg-blue-50',
                iconColor: 'text-blue-500',
                border: 'hover:border-blue-200',
                badge: isAr ? 'UAE.S · ESMA · ADAFSA' : 'UAE.S · ESMA · ADAFSA',
                badgeColor: 'bg-blue-100 text-blue-600',
                title_ar: 'اشتراطات التسجيل',
                title_en: 'Registration Requirements',
                desc_ar: 'أدخل مكونات منتجك — يفحص ضد معايير ESMA ومعايير UAE.S ويعطيك كل النواقص دفعة واحدة. لا مزيد من الاكتشاف التدريجي الذي يكلّف شهراً',
                desc_en: 'Enter your product ingredients — checks against ESMA and UAE.S standards and gives you all gaps at once. No more gradual discovery costing a month',
                points_ar: ['قائمة النواقص كاملة مرة واحدة', 'تحديد البنود والمواد بدقة', 'اشتراطات التبويب والتعبئة'],
                points_en: ['Complete gap list in one shot', 'Exact clause and article identification', 'Labeling and packaging requirements'],
                href: '/compliance',
                cta_ar: 'افحص منتجك مجاناً',
                cta_en: 'Check Your Product Free',
              },
              {
                icon: Package,
                bg: 'bg-green-50',
                iconColor: 'text-green-600',
                border: 'hover:border-green-200',
                badge: isAr ? 'بيان + تكلفة + ليبل' : 'Plan + Cost + Label',
                badgeColor: 'bg-green-100 text-green-700',
                title_ar: 'تخطيط التوريد',
                title_en: 'Supply Planning',
                desc_ar: 'أدخل الطلب: 2000 كيس رز 1.5كجم → يخرج: 3 طن + مصادر الشراء + توزيع الكراتين + الباليتات + تكلفة كاملة + سعر مقترح + ليبل جاهز للطباعة',
                desc_en: 'Enter order: 2000 bags rice 1.5kg → Output: 3 tons + sourcing + carton distribution + pallets + full cost + suggested price + print-ready label',
                points_ar: ['حساب الوزن والكميات تلقائياً', 'توزيع الكراتين والباليتات', 'ليبل احترافي وفق UAE.S 9:2019'],
                points_en: ['Auto weight and quantity calculation', 'Carton and pallet distribution', 'Professional label per UAE.S 9:2019'],
                href: '/packaging',
                cta_ar: 'ابدأ التخطيط',
                cta_en: 'Start Planning',
              },
            ].map((item, i) => (
              <Link key={i} href={`/${locale}${item.href}`}
                className={`group bg-white border border-gray-200 ${item.border} hover:shadow-lg rounded-2xl p-6 transition-all hover:-translate-y-1 flex flex-col`}>
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-11 h-11 ${item.bg} rounded-xl flex items-center justify-center`}>
                    <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${item.badgeColor}`}>{item.badge}</span>
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2">{isAr ? item.title_ar : item.title_en}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-5 flex-1">{isAr ? item.desc_ar : item.desc_en}</p>
                <ul className="space-y-2 mb-5">
                  {(isAr ? item.points_ar : item.points_en).map((p, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className={`w-3.5 h-3.5 flex-shrink-0 ${item.iconColor}`} />
                      {p}
                    </li>
                  ))}
                </ul>
                <span className="text-orange-500 text-sm font-bold group-hover:underline">
                  {isAr ? item.cta_ar : item.cta_en} →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Crate ── */}
      <section className="px-6 py-16 bg-white border-t border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-black text-gray-900 mb-3">
            {isAr ? 'لماذا Crate للمستورد الإماراتي؟' : 'Why Crate for the UAE Importer?'}
          </h2>
          <p className="text-gray-400 text-sm mb-10">
            {isAr
              ? 'بدلاً من شهر كامل لاكتشاف اشتراطات منتج واحد — Crate يعطيك كل شيء في دقائق'
              : 'Instead of a whole month discovering requirements for one product — Crate gives you everything in minutes'}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { n: '< 5 دقائق', e: '< 5 min', desc_ar: 'لفحص اشتراطات منتج كامل', desc_en: 'to check full product requirements' },
              { n: '25+', e: '25+', desc_ar: 'منتج مرصود بشكل تلقائي', desc_en: 'products auto-monitored' },
              { n: 'UAE.S', e: 'UAE.S', desc_ar: '9:2019 و 1926:2015', desc_en: '9:2019 & 1926:2015' },
              { n: '100%', e: '100%', desc_ar: 'ثنائي اللغة AR/EN', desc_en: 'Bilingual AR/EN' },
            ].map((s, i) => (
              <div key={i} className="bg-gray-50 rounded-xl py-5 px-3 border border-gray-100">
                <div className="text-2xl font-black text-orange-500 mb-1">{isAr ? s.n : s.e}</div>
                <div className="text-xs text-gray-400 leading-snug">{isAr ? s.desc_ar : s.desc_en}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
