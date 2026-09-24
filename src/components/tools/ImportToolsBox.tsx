import Link from 'next/link'
import { BookOpen, Compass, BadgeCheck, Calculator, ScanLine } from 'lucide-react'
import type { ToolLinks } from '@/lib/import-guides/link'

/**
 * "Before you import this" — static links (no state) from any content page to the free tools,
 * with deep links preset for the product. Server-renderable; also works inside client trees.
 * Lands visitors on pages whose downloads/prints are already lead-gated.
 */
export default function ImportToolsBox({ links, locale, productName }: { links: ToolLinks; locale: string; productName?: string }) {
  const isAr = locale === 'ar'
  const L = (p: string) => `/${locale}${p}`
  const card = 'flex items-start gap-3 rounded-xl border border-orange-100 bg-white px-3.5 py-3 hover:border-orange-300 hover:bg-orange-50/50 transition-colors'
  const items: { href: string; icon: typeof Compass; t: string; d: string }[] = []
  if (links.guide) items.push({
    href: L(`/import/${links.guide.slug}`), icon: BookOpen,
    t: isAr ? `دليل استيراد ${links.guide.name.ar}` : `Guide: importing ${links.guide.name.en}`,
    d: isAr ? 'رمز HS، الرسوم، الخطوات، الشهادات، ومثال تكلفة' : 'HS code, duty, steps, certificates and a cost example',
  })
  if (links.routerQuery) items.push({
    href: L(`/tools/product-registration-uae?${links.routerQuery}`), icon: Compass,
    t: isAr ? 'أين أسجّل هذا المنتج؟' : 'Where do I register it?',
    d: isAr ? 'منتاجي أم FIRS/زاد؟ الرسوم والمستندات' : 'Montaji or FIRS/ZAD? Fees and documents',
  })
  items.push({
    href: L(`/tools/certificates-uae?${links.certQuery}`), icon: BadgeCheck,
    t: isAr ? 'هل يحتاج شهادات؟' : 'Does it need certificates?',
    d: isAr ? 'ECAS · EQM · حلال — وكم تكلّف' : 'ECAS · EQM · Halal — and what they cost',
  })
  items.push({
    href: L(`/tools/landed-cost-uae${links.hsCode ? `?hs=${encodeURIComponent(links.hsCode)}` : ''}`), icon: Calculator,
    t: isAr ? 'احسب التكلفة الواصلة' : 'Calculate the landed cost',
    d: isAr ? 'جمارك + ضريبة انتقائية + VAT وسعر بيع مقترح' : 'Duty + excise + VAT and a suggested price',
  })
  if (links.routerQuery) items.push({
    href: L('/compliance'), icon: ScanLine,
    t: isAr ? 'افحص ملصقك قبل التقديم' : 'Pre-check your label',
    d: isAr ? 'وفق UAE.S 9 — مجاناً، بالكاميرا أو يدوياً' : 'Per UAE.S 9 — free, by camera or manually',
  })

  return (
    <section className="my-8 rounded-2xl border border-orange-200 bg-orange-50/40 p-4 sm:p-5 print:hidden" aria-label={isAr ? 'أدوات الاستيراد' : 'Import tools'}>
      <h2 className="text-base font-semibold text-gray-900">{isAr ? 'قبل أن تستورد هذا المنتج' : 'Before you import this product'}</h2>
      <p className="text-xs text-gray-500 mt-0.5 mb-3">
        {productName ? `${productName} — ` : ''}{isAr ? 'أدوات مجانية بنتيجة فورية، مضبوطة على هذا المنتج' : 'Free tools with instant results, preset for this product'}
      </p>
      <div className="grid sm:grid-cols-2 gap-2">
        {items.map(i => (
          <Link key={i.href} href={i.href} className={card}>
            <i.icon className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
            <span><span className="block text-sm text-gray-900">{i.t}</span><span className="block text-[11px] text-gray-500 leading-snug">{i.d}</span></span>
          </Link>
        ))}
      </div>
    </section>
  )
}
