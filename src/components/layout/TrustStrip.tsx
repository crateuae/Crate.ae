import { Building2, ShieldCheck, Clock, Globe2 } from 'lucide-react'

/**
 * Trust strip — bilingual credibility row. Independent-of-domain-authority
 * signals for a new site: real registry size, official standards, human SLA.
 */
export default function TrustStrip({ locale, providers }: { locale: string; providers?: number }) {
  const isAr = locale === 'ar'
  const fmt = (n: number) => n.toLocaleString('en-US')
  const items = [
    { icon: Building2,   ar: `${providers ? fmt(providers) + '+' : '47,000+'} شركة مرخّصة في السجل`, en: `${providers ? fmt(providers) + '+' : '47,000+'} licensed companies on file` },
    { icon: ShieldCheck, ar: 'وفق معايير ESMA · UAE.S · ADAFSA',                                     en: 'Aligned to ESMA · UAE.S · ADAFSA' },
    { icon: Clock,       ar: 'ردّ خلال ٢٤ ساعة — بدون التزام',                                        en: 'Reply within 24h — no obligation' },
    { icon: Globe2,      ar: 'ثنائي اللغة · مقرّه الإمارات',                                           en: 'Bilingual · UAE-based' },
  ]
  return (
    <div className="border-y border-orange-100 bg-orange-50/40" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto px-5 py-3.5 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2 text-[12px] text-stone-600">
            <it.icon className="w-4 h-4 text-orange-500 flex-shrink-0" />
            <span className="leading-tight">{isAr ? it.ar : it.en}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
