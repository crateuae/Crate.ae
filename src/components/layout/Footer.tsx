import Link from 'next/link'
import { Package, Mail, Phone, MapPin, Globe2 } from 'lucide-react'

export default function Footer({ locale = 'ar' }: { locale?: string }) {
  const isAr = locale === 'ar'
  const L = (path: string) => `/${locale}${path}`
  const track = (cls: string) => (isAr ? '' : cls)

  return (
    <footer className="bg-gradient-to-b from-white to-orange-50/40 border-t border-orange-100/70 text-stone-600" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Top grid ── */}
      <div className="max-w-6xl mx-auto px-5 pt-14 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr] gap-x-8 gap-y-10">

          {/* Brand + contact */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-orange-500 rounded-2xl flex items-center justify-center shadow-sm shadow-orange-500/30">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-black text-stone-900 text-lg leading-none">Crate</div>
                <div className={`text-[9px] font-semibold text-stone-400 uppercase mt-1 ${track('tracking-[0.18em]')}`}>
                  {isAr ? 'الاستيراد والتوريد · الإمارات' : 'Import & Supply · UAE'}
                </div>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-stone-500 mb-5 max-w-xs">
              {isAr
                ? 'منصة متكاملة تدير دورة الاستيراد — اكتشاف الفرص، فحص الاشتراطات، وتخطيط التوريد والتعبئة للسوق الإماراتي.'
                : 'An all-in-one platform for the full import cycle — opportunity discovery, requirement checks, and supply & packing planning for the UAE market.'}
            </p>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a href="mailto:uae@crate.ae" className="inline-flex items-center gap-2 hover:text-orange-500 transition-colors">
                  <Mail className="w-3.5 h-3.5 text-orange-400" /> uae@crate.ae
                </a>
              </li>
              <li>
                <a href="tel:+971543000415" className="inline-flex items-center gap-2 hover:text-orange-500 transition-colors" dir="ltr">
                  <Phone className="w-3.5 h-3.5 text-orange-400" /> +971 54 300 0415
                </a>
              </li>
              <li className="inline-flex items-center gap-2 text-stone-500">
                <MapPin className="w-3.5 h-3.5 text-orange-400" />
                {isAr ? 'الإمارات العربية المتحدة' : 'United Arab Emirates'}
              </li>
            </ul>
          </div>

          {/* Platform */}
          <FooterCol isAr={isAr} title={isAr ? 'المنصة' : 'Platform'}>
            <FooterLink href={L('/market')}>{isAr ? 'فرص السوق' : 'Market Opportunities'}</FooterLink>
            <FooterLink href={L('/products')}>{isAr ? 'المنتجات' : 'Products'}</FooterLink>
            <FooterLink href={L('/providers')}>{isAr ? 'سجل الموردين' : 'Supplier Registry'}</FooterLink>
            <FooterLink href={L('/compliance')}>{isAr ? 'اشتراطات الاستيراد' : 'Import Requirements'}</FooterLink>
            <FooterLink href={L('/packaging')}>{isAr ? 'تخطيط التوريد والتعبئة' : 'Supply & Repack Planning'}</FooterLink>
          </FooterCol>

          {/* Knowledge */}
          <FooterCol isAr={isAr} title={isAr ? 'المعرفة والأدلة' : 'Knowledge & Guides'}>
            <FooterLink href={L('/guides/carton-specs')}>{isAr ? 'دليل مواصفات الكراتين' : 'Carton Specs Guide'}</FooterLink>
            <FooterLink href={L('/insights')}>{isAr ? 'المدونة والرؤى' : 'Blog & Insights'}</FooterLink>
            <FooterLink href={L('/market')}>{isAr ? 'لوحة الفرص المباشرة' : 'Live Opportunity Board'}</FooterLink>
            <FooterLink href={L('/compliance')}>{isAr ? 'فحص منتج جديد' : 'Check a New Product'}</FooterLink>
          </FooterCol>

          {/* Standards */}
          <FooterCol isAr={isAr} title={isAr ? 'المعايير المعتمدة' : 'Covered Standards'}>
            <FooterText>UAE.S 9:2019 — {isAr ? 'الليبل الغذائي' : 'Food labeling'}</FooterText>
            <FooterText>UAE.S 1926:2015 — {isAr ? 'النقاء' : 'Purity'}</FooterText>
            <FooterText>ESMA — {isAr ? 'اشتراطات التسجيل' : 'Registration'}</FooterText>
            <FooterText>ADAFSA — {isAr ? 'أبوظبي للغذاء' : 'Abu Dhabi Food'}</FooterText>
            <FooterText>Halal — {isAr ? 'متطلبات الحلال' : 'Halal requirements'}</FooterText>
          </FooterCol>

          {/* Data sources */}
          <FooterCol isAr={isAr} title={isAr ? 'مصادر البيانات' : 'Data Sources'}>
            <FooterText>{isAr ? 'سجل دبي التجاري (DED)' : 'Dubai DED Registry'}</FooterText>
            <FooterText>Noon · Amazon.ae</FooterText>
            <FooterText>Carrefour · Lulu</FooterText>
            <FooterText>Google Trends</FooterText>
            <FooterText>{isAr ? 'تحديث تلقائي يومي' : 'Automated daily update'}</FooterText>
          </FooterCol>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-orange-100/70">
        <div className="max-w-6xl mx-auto px-5 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-5 text-[11px]">
            <Link href={L('/privacy')} className="hover:text-orange-500 transition-colors">
              {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
            </Link>
            <Link href={L('/terms')} className="hover:text-orange-500 transition-colors">
              {isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}
            </Link>
            <a href="https://www.crate.ae" className="hover:text-orange-500 transition-colors inline-flex items-center gap-1.5">
              <Globe2 className="w-3 h-3" /> www.crate.ae
            </a>
          </div>
          <span className="text-[11px] text-stone-400">
            © 2026 Crate — {isAr ? 'منصة الاستيراد والتوريد في الإمارات 🇦🇪' : 'UAE Import & Supply Platform 🇦🇪'}
          </span>
        </div>
      </div>
    </footer>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FooterCol({ title, children, isAr }: { title: string; children: React.ReactNode; isAr?: boolean }) {
  // letter-spacing tears cursive Arabic glyph joins — Latin titles only
  return (
    <div>
      <div className={`text-[10px] font-bold text-stone-400 uppercase mb-4 ${isAr ? '' : 'tracking-[0.18em]'}`}>{title}</div>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-xs text-stone-500 hover:text-orange-500 transition-colors">
        {children}
      </Link>
    </li>
  )
}

function FooterText({ children }: { children: React.ReactNode }) {
  return <li className="text-xs text-stone-500">{children}</li>
}
