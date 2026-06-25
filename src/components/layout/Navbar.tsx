'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Package, BarChart2, ShieldCheck, Boxes, Users, LayoutDashboard, Menu, X, LogIn, LogOut, ChevronDown, Bell, BookOpen } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'

const NAV_ITEMS = [
  { href: '/market',      icon: BarChart2,   label_ar: 'فرص السوق',          label_en: 'Market Opportunities' },
  { href: '/compliance',  icon: ShieldCheck,  label_ar: 'اشتراطات الاستيراد', label_en: 'Import Requirements' },
  { href: '/packaging',   icon: Package,      label_ar: 'إعادة التعبئة',      label_en: 'Repackaging' },
  { href: '/products',    icon: Boxes,        label_ar: 'المنتجات',           label_en: 'Products' },
  { href: '/providers',   icon: Users,        label_ar: 'الموردون',           label_en: 'Suppliers' },
  { href: '/guides/carton-specs', icon: BookOpen, label_ar: 'دليل الكراتين', label_en: 'Carton Guide' },
]

// ── Notification type ──────────────────────────────────────────────────────
interface RfqNotif {
  id: string
  created_at: string
  input_data: {
    contact_name?: string
    contact_company?: string
    basket_count?: number
    _status?: string
  }
}

function NotificationBell({ locale, isAr }: { locale: string; isAr: boolean }) {
  const [open, setOpen]       = useState(false)
  const [items, setItems]     = useState<RfqNotif[]>([])
  const [unread, setUnread]   = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch('/api/admin/basket-rfqs?limit=10')
        if (!r.ok) return
        const d = await r.json()
        const list: RfqNotif[] = d.requests ?? []
        setItems(list.slice(0, 10))
        // count items with no _status (new/unseen)
        setUnread(list.filter(i => !i.input_data?._status || i.input_data._status === 'new').length)
      } catch { /* ignore */ }
    }
    load()
    const t = setInterval(load, 60_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const statusColor: Record<string, string> = {
    new:       'bg-orange-100 text-orange-700',
    contacted: 'bg-blue-100 text-blue-700',
    quoted:    'bg-purple-100 text-purple-700',
    completed: 'bg-emerald-100 text-emerald-700',
    lost:      'bg-slate-100 text-slate-400',
  }
  const statusLabel: Record<string, string> = {
    new: isAr ? 'جديد' : 'New',
    contacted: isAr ? 'تم التواصل' : 'Contacted',
    quoted: isAr ? 'عرض سعر أُرسل' : 'Quoted',
    completed: isAr ? 'مكتمل' : 'Completed',
    lost: isAr ? 'ملغى' : 'Lost',
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(p => !p)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors">
        <Bell className="w-4 h-4 text-gray-500" />
        {unread > 0 && (
          <span className="absolute -top-1 -end-1 w-4 h-4 bg-orange-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl shadow-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-black text-gray-800">{isAr ? 'طلبات السلة الغذائية' : 'Food Basket Requests'}</p>
            <span className="text-[10px] bg-orange-100 text-orange-600 font-bold px-2 py-0.5 rounded-full">
              {items.length} {isAr ? 'طلب' : 'requests'}
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">{isAr ? 'لا توجد طلبات بعد' : 'No requests yet'}</p>
            ) : items.slice(0, 3).map(item => {
              const st = item.input_data?._status || 'new'
              const name = item.input_data?.contact_name || (isAr ? 'زائر' : 'Visitor')
              const co   = item.input_data?.contact_company
              const cnt  = item.input_data?.basket_count
              const date = new Date(item.created_at).toLocaleDateString(isAr ? 'ar-AE' : 'en-AE', { month:'short', day:'numeric' })
              return (
                <div key={item.id} className="px-4 py-3 border-b border-gray-50 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{name}{co ? ` — ${co}` : ''}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{cnt ? `${cnt.toLocaleString('en-US')} ${isAr ? 'سلة' : 'baskets'} · ` : ''}{date}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${statusColor[st] || statusColor.new}`}>
                      {statusLabel[st] || st}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <Link href={`/${locale}/dashboard/basket-requests`} onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors">
              {isAr ? 'عرض جميع الطلبات ←' : 'View all requests →'}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

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
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false)
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
            className="text-sm text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
            {isAr ? 'EN' : 'AR'}
          </Link>

          {/* Admin notification bell */}
          {!loading && isAdmin && <NotificationBell locale={locale} isAr={isAr} />}

          {!loading && (
            user ? (
              <div className="relative" ref={userMenuRef}>
                <button onClick={() => setUserMenuOpen(!userMenuOpen)}
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
                      <Link href={`/${locale}/dashboard`} onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors font-medium">
                        <LayoutDashboard className="w-4 h-4" />
                        {isAr ? 'لوحة التحكم' : 'Dashboard'}
                      </Link>
                    )}
                    {isAdmin && (
                      <Link href={`/${locale}/dashboard/basket-requests`} onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors font-medium">
                        <Bell className="w-4 h-4" />
                        {isAr ? 'طلبات التسعير' : 'Quote Requests'}
                      </Link>
                    )}
                    <button onClick={() => { setUserMenuOpen(false); signOut() }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors">
                      <LogOut className="w-4 h-4" />
                      {isAr ? 'تسجيل الخروج' : 'Sign Out'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
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
                {isAdmin && (
                  <Link href={`/${locale}/dashboard/basket-requests`} onClick={() => setOpen(false)}
                    className="flex items-center gap-2 border border-orange-200 text-orange-600 rounded-lg px-3 py-2.5 text-sm font-bold">
                    <Bell className="w-4 h-4" />
                    {isAr ? 'طلبات التسعير' : 'Quote Requests'}
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
