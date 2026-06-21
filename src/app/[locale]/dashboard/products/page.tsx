'use client'
import { useParams } from 'next/navigation'
import UnifiedProductEditor from './UnifiedProductEditor'

export default function DashboardProductsPage() {
  const { locale } = useParams()
  const isAr = locale === 'ar'

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">
          {isAr ? 'إدارة المنتجات — موحّدة' : 'Products Management — Unified'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isAr
            ? 'بيانات تجارية + محتوى SEO + أداء. يدوي + من الكائن في مكان واحد.'
            : 'Commerce data + SEO content + analytics. Manual + organism in one place.'}
        </p>
      </div>

      <UnifiedProductEditor isAr={isAr} />
    </div>
  )
}
