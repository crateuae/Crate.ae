'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Boxes, FolderTree, Package, ShieldCheck, LayoutDashboard, ArrowRight, LogOut, BarChart3, TrendingUp, Sparkles } from 'lucide-react'

const SIDEBAR_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label_ar: 'نظرة عامة', label_en: 'Overview', exact: true },
  { href: '/dashboard/products', icon: Boxes, label_ar: 'المنتجات', label_en: 'Products' },
  { href: '/dashboard/products-categories', icon: FolderTree, label_ar: 'تصنيفات المنتجات', label_en: 'Product Categories' },
  { href: '/dashboard/market-signals', icon: BarChart3, label_ar: 'إشارات السوق', label_en: 'Market Signals' },
  { href: '/dashboard/trends', icon: TrendingUp, label_ar: 'Google Trends', label_en: 'Google Trends' },
  { href: '/dashboard/discover', icon: Sparkles, label_ar: 'اكتشاف منتجات', label_en: 'Discover Products' },
  { href: '/dashboard/packaging', icon: Package, label_ar: 'مواصفات التعبئة', label_en: 'Packaging Specs' },
  { href: '/dashboard/compliance-rules', icon: ShieldCheck, label_ar: 'اشتراطات التسجيل', label_en: 'Compliance Rules' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const locale = pathname.split('/')[1] || 'ar'
  const isAr = locale === 'ar'

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-e border-gray-200 flex flex-col fixed top-[58px] bottom-0 z-40 start-0">
        <div className="px-4 py-5 border-b border-gray-100">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">
            {isAr ? 'لوحة الإدارة' : 'Admin Panel'}
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {SIDEBAR_ITEMS.map(item => {
            const path = `/${locale}${item.href}`
            const active = item.exact ? pathname === path : pathname.startsWith(path)
            return (
              <Link key={item.href} href={path}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  active
                    ? 'bg-orange-50 text-orange-600 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}>
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {isAr ? item.label_ar : item.label_en}
                {active && <ArrowRight className={`w-3.5 h-3.5 ms-auto ${isAr ? 'rotate-180' : ''}`} />}
              </Link>
            )
          })}
        </nav>
        <div className="px-3 py-4 border-t border-gray-100">
          <Link href={`/${locale}`}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            <LogOut className="w-4 h-4" />
            {isAr ? 'الخروج من اللوحة' : 'Exit Dashboard'}
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-h-screen overflow-hidden" style={{ marginInlineStart: '240px' }}>
        {children}
      </main>
    </div>
  )
}
