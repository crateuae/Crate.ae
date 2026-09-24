'use client'
import { Printer, Compass, BadgeCheck, Calculator, FileText } from 'lucide-react'
import { useLeadGate } from '@/components/leadgate/LeadGateProvider'

export default function GuideActions({ locale, titleAr, categoryAr, routerHref, certHref, calcHref, rfqHref }: {
  locale: 'ar' | 'en'; titleAr: string; categoryAr: string; routerHref: string; certHref: string; calcHref: string; rfqHref: string
}) {
  const isAr = locale === 'ar'
  const { gate } = useLeadGate()
  const cls = 'inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:border-orange-300 bg-white'
  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <button type="button" className={cls} onClick={() => gate({ kind: 'pdf', title: titleAr, category: categoryAr, run: () => window.print() })}>
        <Printer className="w-4 h-4" />{isAr ? 'طباعة / حفظ PDF' : 'Print / save as PDF'}
      </button>
      <a href={routerHref} className={cls}><Compass className="w-4 h-4" />{isAr ? 'أين أسجّل منتجي؟' : 'Where do I register?'}</a>
      <a href={certHref} className={cls}><BadgeCheck className="w-4 h-4" />{isAr ? 'فاحص الشهادات' : 'Certificate checker'}</a>
      <a href={calcHref} className={cls}><Calculator className="w-4 h-4" />{isAr ? 'احسب بأرقامك' : 'Calculate with your numbers'}</a>
      <a href={rfqHref} className={`${cls} border-orange-300 bg-orange-50 text-gray-900`}><FileText className="w-4 h-4" />{isAr ? 'اطلب عرض سعر' : 'Request a quote'}</a>
    </div>
  )
}
