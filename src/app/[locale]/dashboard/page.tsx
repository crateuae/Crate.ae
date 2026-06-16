import Link from 'next/link'
import { Boxes, FolderTree, Package, ShieldCheck, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { PRODUCTS_CATALOG, PRODUCT_CATEGORIES } from '@/lib/data/products-catalog'

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const isAr = locale === 'ar'

  const stats = {
    products: PRODUCTS_CATALOG.length,
    categories: PRODUCT_CATEGORIES.length,
    shortage: PRODUCTS_CATALOG.filter(p => p.market_signal === 'shortage').length,
    rising: PRODUCTS_CATALOG.filter(p => p.market_signal === 'rising').length,
    arbitrage: PRODUCTS_CATALOG.filter(p => p.market_signal === 'arbitrage').length,
  }

  const topOpportunities = PRODUCTS_CATALOG
    .filter(p => p.market_signal !== 'stable')
    .sort((a, b) => b.gap_score - a.gap_score)
    .slice(0, 5)

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          {isAr ? 'نظرة عامة' : 'Dashboard Overview'}
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {isAr ? 'إدارة منصة Crate — المنتجات والتصنيفات والاشتراطات' : 'Manage Crate platform — products, categories, and requirements'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label_ar: 'المنتجات', label_en: 'Products', value: stats.products, icon: Boxes, color: 'text-orange-500', bg: 'bg-orange-50', href: '/dashboard/products' },
          { label_ar: 'التصنيفات', label_en: 'Categories', value: stats.categories, icon: FolderTree, color: 'text-blue-500', bg: 'bg-blue-50', href: '/dashboard/products-categories' },
          { label_ar: 'نقص عرض', label_en: 'Shortages', value: stats.shortage, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', href: '/dashboard/products' },
          { label_ar: 'طلب صاعد', label_en: 'Rising', value: stats.rising, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', href: '/dashboard/products' },
        ].map((s, i) => (
          <Link key={i} href={`/${locale}${s.href}`}
            className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{isAr ? s.label_ar : s.label_en}</div>
          </Link>
        ))}
      </div>

      {/* Quick Access */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-gray-700 mb-4">{isAr ? 'إدارة سريعة' : 'Quick Management'}</h2>
          <div className="space-y-2">
            {[
              { href: '/dashboard/products', icon: Boxes, label_ar: 'إدارة المنتجات', label_en: 'Manage Products', desc_ar: 'إضافة وتعديل وتفعيل المنتجات', desc_en: 'Add, edit and activate products' },
              { href: '/dashboard/products-categories', icon: FolderTree, label_ar: 'إدارة التصنيفات', label_en: 'Manage Categories', desc_ar: 'التصنيفات الرئيسية والفرعية', desc_en: 'Main and sub-categories' },
              { href: '/dashboard/packaging', icon: Package, label_ar: 'مواصفات التعبئة', label_en: 'Packaging Specs', desc_ar: 'معايير الكراتين والأحجام', desc_en: 'Carton sizes and standards' },
              { href: '/dashboard/compliance-rules', icon: ShieldCheck, label_ar: 'اشتراطات التسجيل', label_en: 'Compliance Rules', desc_ar: 'قواعد UAE.S وESMA', desc_en: 'UAE.S and ESMA rules' },
            ].map((item, i) => (
              <Link key={i} href={`/${locale}${item.href}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200 group">
                <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800">{isAr ? item.label_ar : item.label_en}</div>
                  <div className="text-xs text-gray-400">{isAr ? item.desc_ar : item.desc_en}</div>
                </div>
                <span className="text-gray-300 group-hover:text-orange-500 transition-colors text-lg">←</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Top opportunities */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-gray-700 mb-4">{isAr ? 'أعلى الفرص حالياً' : 'Top Opportunities Now'}</h2>
          <div className="space-y-2">
            {topOpportunities.map((p, i) => {
              const sigColors = {
                shortage: 'text-red-600 bg-red-50',
                rising: 'text-green-600 bg-green-50',
                arbitrage: 'text-amber-600 bg-amber-50',
                stable: 'text-gray-500 bg-gray-100',
              }
              const sigLabels = {
                shortage: isAr ? 'نقص' : 'Shortage',
                rising: isAr ? 'صاعد' : 'Rising',
                arbitrage: isAr ? 'مراجحة' : 'Arbitrage',
                stable: isAr ? 'مستقر' : 'Stable',
              }
              return (
                <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <span className="text-xl">{p.image_emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-800 truncate">{isAr ? p.name_ar : p.name_en}</div>
                    <div className="text-xs text-gray-400">{p.brand}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-orange-500">{p.gap_score}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sigColors[p.market_signal]}`}>
                      {sigLabels[p.market_signal]}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          <Link href={`/${locale}/market`}
            className="mt-4 block text-center text-sm font-semibold text-orange-500 hover:underline">
            {isAr ? 'عرض كل الفرص ←' : 'View All Opportunities →'}
          </Link>
        </div>
      </div>
    </div>
  )
}
