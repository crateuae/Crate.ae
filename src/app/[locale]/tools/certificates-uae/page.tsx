import type { Metadata } from 'next'
import CertificatesClient from './CertificatesClient'
import { pageAlternates } from '@/lib/seo/alternates'

const FAQ = {
  en: [
    ['What is the difference between ESMA, ECAS and EQM?', 'ESMA (the standards authority) was merged into MoIAT. ECAS is MoIAT\'s mandatory conformity-certificate scheme for regulated products; EQM (Emirates Quality Mark) is the quality mark that requires product tests plus a factory quality-system audit. Both are issued through MoIAT-notified bodies.'],
    ['How much does an ECAS certificate cost?', 'MoIAT\'s published fees are AED 600 for the registration request, AED 620 technical review per certificate and AED 500 issuance (about AED 1,720), plus AED 2,500 per assessor-day if a site assessment is required. Notified-body testing and audit fees are quoted separately. Certificates are valid for one year.'],
    ['Which products need the Emirates Quality Mark?', 'Bottled drinking water and natural mineral water must carry the EQM before sale, for local producers and importers alike. For most juices, soft drinks and many dairy items it is voluntary — check the current MoIAT list for your exact family.'],
    ['Do I need a halal certificate to import food into the UAE?', 'Meat, poultry and products with animal-derived ingredients need halal evidence from a certification body on the MoIAT register (Cabinet Decree 10/2014, UAE.S 2055-1, slaughter per UAE.S 993). The Halal National Mark logo itself is optional for most products.'],
  ],
  ar: [
    ['ما الفرق بين ESMA وECAS وEQM؟', 'أُدمجت هيئة المواصفات (ESMA) في وزارة الصناعة والتكنولوجيا المتقدمة. ECAS هو نظام شهادات المطابقة الإلزامي للمنتجات المنظَّمة؛ وعلامة الجودة الإماراتية (EQM) علامة جودة تتطلب فحص المنتج وتدقيق نظام الجودة في المصنع. كلاهما يصدر عبر جهات معتمدة من الوزارة.'],
    ['كم تكلفة شهادة ECAS؟', 'الرسوم المنشورة للوزارة: 600 درهم لطلب التسجيل، و620 درهماً للمراجعة الفنية لكل شهادة، و500 درهم للإصدار (نحو 1,720 درهماً)، إضافةً إلى 2,500 درهم لكل يوم مقيّم إن لزم تقييم الموقع. رسوم الفحص والتدقيق لدى الجهة المعتمدة تُسعَّر على حدة. الشهادة صالحة لسنة.'],
    ['أي المنتجات تحتاج علامة الجودة الإماراتية؟', 'مياه الشرب المعبأة والمياه المعدنية الطبيعية يجب أن تحمل العلامة قبل البيع، للمنتجين المحليين والمستوردين. أما معظم العصائر والمشروبات الغازية وكثير من الألبان فهي اختيارية — راجع قائمة الوزارة الحالية لعائلتك بالضبط.'],
    ['هل أحتاج شهادة حلال لاستيراد الأغذية إلى الإمارات؟', 'اللحوم والدواجن والمنتجات ذات المكوّنات الحيوانية تحتاج إثبات حلال من جهة إصدار مدرجة في سجل الوزارة (قرار مجلس الوزراء 10/2014، UAE.S 2055-1، الذبح وفق UAE.S 993). أما شعار علامة الحلال الوطنية نفسه فاختياري لمعظم المنتجات.'],
  ],
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'
  return {
    title: isAr
      ? 'هل أحتاج شهادة ESMA / ECAS / EQM / حلال؟ وكم تكلّف — فاحص الشهادات — Crate'
      : 'Do I need ESMA / ECAS / EQM / Halal certification? And what it costs — Crate',
    description: isAr
      ? 'أداة مجانية تحدد شهادات المطابقة المطلوبة لمنتجك في الإمارات (ECAS، علامة الجودة EQM، حلال، عضوي، شهادة صحية) مع الرسوم الرسمية لوزارة الصناعة والمدد والجهة المصدرة.'
      : 'Free tool: which UAE conformity certificates your product needs (ECAS, Emirates Quality Mark, halal, organic, health certificate) with official MoIAT fees, timelines and issuing bodies.',
    alternates: pageAlternates(locale, '/tools/certificates-uae'),
  }
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const faq = locale === 'ar' ? FAQ.ar : FAQ.en
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebApplication', name: locale === 'ar' ? 'فاحص شهادات المطابقة في الإمارات' : 'UAE Certificate Checker (ECAS / EQM / Halal)', applicationCategory: 'BusinessApplication', operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'AED' }, url: `https://www.crate.ae/${locale}/tools/certificates-uae`, dateModified: '2026-09-24' },
      { '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    ],
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CertificatesClient locale={locale === 'en' ? 'en' : 'ar'} faq={faq} />
    </>
  )
}
