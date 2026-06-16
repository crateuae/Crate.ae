import Link from 'next/link'
import { Package } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white mt-16 px-6 py-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
            <Package className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-gray-900">Crate</span>
          <span className="text-gray-400 text-sm">— استخبارات سلسلة الإمداد</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-400">
          <Link href="/ar/privacy" className="hover:text-gray-600 transition-colors">الخصوصية</Link>
          <Link href="/ar/terms" className="hover:text-gray-600 transition-colors">الشروط</Link>
          <span>© 2026 Crate</span>
        </div>
      </div>
    </footer>
  )
}
