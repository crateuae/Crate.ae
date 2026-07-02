import type { Metadata } from 'next'
import RfqPageForm from './RfqPageForm'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'
  return {
    title: isAr ? 'اطلب عرض سعر' : 'Request a Quote',
    description: isAr
      ? 'أرسل طلب عرض سعر لأي منتج ونتواصل معك خلال ٢٤ ساعة بأفضل عرض من مورّد موثّق.'
      : "Request a quote for any product — we'll reply within 24 hours with the best offer from a verified supplier.",
    robots: { index: false }, // form page, not for indexing
  }
}

export default async function RfqPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ product?: string; type?: string }>
}) {
  const { locale } = await params
  const sp = await searchParams
  const isAr = locale === 'ar'
  const product = (sp.product ?? '').toString()
  const type = sp.type ? sp.type.toString() : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-white to-white" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-3xl mx-auto px-5 py-14 lg:py-20">
        <RfqPageForm product={product} type={type} isAr={isAr} locale={locale} />
      </div>
    </div>
  )
}
