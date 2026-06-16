'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Package, BarChart2, ShieldCheck, Boxes, Users, LayoutDashboard, Menu, X, LogIn, LogOut, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'

const NAV_ITEMS = [
  { href: '/market', icon: BarChart2, label_ar: 'فرص السوق', label_en: 'Market Opportunities' },
  { href: '/compliance', icon: ShieldCheck, label_ar: 'اشتراطات الاستيراد', label_en: 'Import Requirements' },
  { href: '/packaging', icon: Package, label_ar: 'إعادة التعبئة', label_en: 'Repackaging' },
  { href: '/products', icon: Boxes, label_ar: 'المنتجات', label_en: 'Products' },
  { href: '/providers', icon: Users, label_ar: 'الموردون', label_en: 'Suppliers' },
]

export default function Navbar() {
  const pathname = usePathname()
  const locale = pathname.split('/')[1] || 'ar'
  const isAr = locale === 'ar'
  const [open, setOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const { user, isAdmin, loading, signOut } = useAuth()

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const avatarLetter = user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-[58px] flex items-center justify-between">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-9 h-9 bg-orange-500 rounded-[10px] flex items-center justify-center shadow-sm">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xl font-black text-gray-900 leading-none tracking-tight">Crate</div>
            <div className="text-[10px] text-gray-400 font-medium leading-none mt-0.5">
              {isAr ? 'منصة الاستيراد والتوريد' : 'Import & Supply Platform'}
            </div>
          </div>
        </Link>

        {/* Nav links */}
        <div className="hidden lg:flex items-center gap-0.5 mx-4">
          {NAV_ITEMS.map(item => {
            const active = pathname.includes(item.href)
            return (
              <Link key={item.href} href={`/${locale}${item.href}`}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${
                  active ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}>
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {isAr ? item.label_ar : item.label_en}
              </Link>
            )
          })}
        </div>

        {/* Right actions */}
        <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
          {/* Lang toggle */}
          <Link
            href={`/${locale === 'ar' ? 'en' : 'ar'}${pathname.slice(locale.length + 1)}`}
            className="text-sm text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          >
            {isAr ? 'EN' : 'AR'}
          </Link>

          {!loading && (
            user ? (
              /* Logged-in user menu */
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
                  <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center text-white text-xs font-black">
                    {avatarLetter}
                  </div>
                  <span className="text-sm text-gray-700 font-medium max-w-[100px] truncate">
                    {user.email?.split('@')[0]}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute end-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-2xl shadow-xl shadow-gray-100 py-1.5 z-50">
                    <div className="px-4 py-2.5 border-b border-gray-100">
                      <p className="text-xs font-bold text-gray-900 truncate">{user.email}</p>
                      {isAdmin && (
                        <span className="text-[10px] bg-orange-100 text-orange-600 font-bold px-2 py-0.5 rounded-full mt-1 inline-block">
                          {isAr ? 'مدير النظام' : 'Admin'}
                        </span>
                      )}
                    </div>
                    {isAdmin && (
                      <Link
                        href={`/${locale}/dashboard`}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors font-medium">
                        <LayoutDashboard className="w-4 h-4" />
                        {isAr ? 'لوحة التحكم' : 'Dashboard'}
                      </Link>
                    )}
                    <button
                      onClick={() => { setUserMenuOpen(false); signOut() }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors">
                      <LogOut className="w-4 h-4" />
                      {isAr ? 'تسجيل الخروج' : 'Sign Out'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Not logged in */
              <Link href={`/${locale}/login`}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2 rounded-[10px] transition-colors shadow-sm">
                <LogIn className="w-4 h-4" />
                {isAr ? 'تسجيل الدخول' : 'Sign In'}
              </Link>
            )
          )}
        </div>

        {/* Mobile menu toggle */}
        <button onClick={() => setOpen(!open)} className="lg:hidden text-gray-500 hover:text-gray-900">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1 shadow-lg">
          {NAV_ITEMS.map(item => (
            <Link key={item.href} href={`/${locale}${item.href}`} onClick={() => setOpen(false)}
              className="flex items-center gap-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg px-3 py-2.5 transition-colors text-sm">
              <item.icon className="w-4 h-4" />
              {isAr ? item.label_ar : item.label_en}
            </Link>
          ))}
          <div className="pt-2 border-t border-gray-100 mt-2 space-y-1">
            {!loading && user ? (
              <>
                {isAdmin && (
                  <Link href={`/${locale}/dashboard`} onClick={() => setOpen(false)}
                    className="flex items-center gap-2 bg-orange-500 text-white rounded-lg px-3 py-2.5 text-sm font-bold">
                    <LayoutDashboard className="w-4 h-4" />
                    {isAr ? 'لوحة التحكم' : 'Dashboard'}
                  </Link>
                )}
                <button onClick={() => { setOpen(false); signOut() }}
                  className="w-full flex items-center gap-2 text-red-500 hover:bg-red-50 rounded-lg px-3 py-2.5 text-sm font-semibold">
                  <LogOut className="w-4 h-4" />
                  {isAr ? 'تسجيل الخروج' : 'Sign Out'}
                </button>
              </>
            ) : (
              <Link href={`/${locale}/login`} onClick={() => setOpen(false)}
                className="flex items-center gap-2 bg-orange-500 text-white rounded-lg px-3 py-2.5 text-sm font-bold">
                <LogIn className="w-4 h-4" />
                {isAr ? 'تسجيل الدخول' : 'Sign In'}
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
