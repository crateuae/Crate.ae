import Link from 'next/link'
import { Package } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white mt-16 px-6 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-gray-900 text-lg">Crate</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              منصة استيراد وتجارة عامة وإعادة تعبئة للسوق الإماراتي — تكشف فجوات الطلب، تفحص اشتراطات ESMA، وتبني خطط التوريد.
            </p>
            <p className="text-[10px] text-gray-300 mt-2">
              Import · General Trading · Repackaging — UAE
            </p>
          </div>

          {/* Pages */}
          <div>
            <div className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">المنصة</div>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/ar/market"     className="hover:text-orange-500 transition-colors">فرص السوق</Link></li>
              <li><Link href="/ar/products"   className="hover:text-orange-500 transition-colors">المنتجات</Link></li>
              <li><Link href="/ar/providers"  className="hover:text-orange-500 transition-colors">الموردون</Link></li>
              <li><Link href="/ar/compliance" className="hover:text-orange-500 transition-colors">اشتراطات الاستيراد</Link></li>
              <li><Link href="/ar/packaging"  className="hover:text-orange-500 transition-colors">إعادة التعبئة</Link></li>
            </ul>
          </div>

          {/* Standards */}
          <div>
            <div className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">المعايير</div>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>UAE.S 9:2019 — الليبل الغذائي</li>
              <li>UAE.S 1926:2015 — النقاء</li>
              <li>ESMA — اشتراطات التسجيل</li>
              <li>ADAFSA — أبوظبي الغذاء والدواء</li>
              <li>Halal — متطلبات الحلال</li>
            </ul>
          </div>

          {/* Market focus */}
          <div>
            <div className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">التغطية</div>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>🇦🇪 الإمارات العربية المتحدة</li>
              <li>📦 استيراد من أوروبا وآسيا</li>
              <li>🏷️ إعادة تعبئة للسوق المحلي</li>
              <li>🛒 توزيع HORECA والتجزئة</li>
              <li>📊 30+ منتج FMCG مرصود</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <Link href="/ar/privacy" className="hover:text-gray-600 transition-colors">الخصوصية</Link>
            <Link href="/ar/terms"   className="hover:text-gray-600 transition-colors">الشروط</Link>
          </div>
          <span className="text-xs text-gray-300">© 2026 Crate — منصة الاستيراد والتوريد في الإمارات</span>
        </div>
      </div>
    </footer>
  )
}
