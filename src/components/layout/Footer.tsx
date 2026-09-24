import Link from 'next/link'
import { Package, Mail, Phone, MapPin, Globe2 } from 'lucide-react'
import { SECTIONS } from '@/lib/sections'

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
                  {isAr ? 'الاستيراد · التجارة · التعبئة · الإمارات' : 'Import · Trade · Packaging · UAE'}
                </div>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-stone-500 mb-5 max-w-xs">
              {isAr
                ? 'منصة الاستيراد والتجارة والتعبئة والتغليف في الإمارات — أدوات التسجيل والامتثال، فرص السوق والموردون، وتخطيط التعبئة وإعادة التعبئة.'
                : 'The UAE platform for import, trade and packaging — registration and compliance tools, market opportunities and suppliers, and packing and repacking planning.'}
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

          {/* The three sections — one column each, from src/lib/sections.ts */}
          {SECTIONS.map(sec => (
            <FooterCol key={sec.key} isAr={isAr} title={isAr ? sec.label.ar : sec.label.en} href={L(sec.hub)}>
              {sec.links.map(l => (
                <FooterLink key={l.href} href={L(l.href)}>{isAr ? l.label.ar : l.label.en}</FooterLink>
              ))}
            </FooterCol>
          ))}

          {/* Standards + data sources */}
          <FooterCol isAr={isAr} title={isAr ? 'المعايير ومصادر البيانات' : 'Standards & Data Sources'}>
            <FooterText>UAE.S 9 (GSO 9) — {isAr ? 'الليبل الغذائي' : 'Food labelling'}</FooterText>
            <FooterText>MoIAT (ESMA) · ECAS · EQM</FooterText>
            <FooterText>{isAr ? 'بلدية دبي' : 'Dubai Municipality'} · ADAFSA</FooterText>
            <FooterText>Halal — {isAr ? 'متطلبات الحلال' : 'Halal requirements'}</FooterText>
            <FooterText>{isAr ? 'سجل دبي التجاري (DED)' : 'Dubai DED Registry'}</FooterText>
            <FooterText>Noon · Amazon.ae · Carrefour · Lulu</FooterText>
            <FooterText>Google Trends</FooterText>
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
            © 2026 Crate — {isAr ? 'الاستيراد والتجارة والتعبئة في الإمارات 🇦🇪' : 'UAE Import, Trade & Packaging 🇦🇪'}
          </span>
        </div>
      </div>
    </footer>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FooterCol({ title, children, isAr, href }: { title: string; children: React.ReactNode; isAr?: boolean; href?: string }) {
  // letter-spacing tears cursive Arabic glyph joins — Latin titles only
  const cls = `text-[10px] font-bold text-stone-400 uppercase mb-4 ${isAr ? '' : 'tracking-[0.18em]'}`
  return (
    <div>
      <div className={cls}>{href ? <Link href={href} className="hover:text-orange-500 transition-colors">{title}</Link> : title}</div>
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
