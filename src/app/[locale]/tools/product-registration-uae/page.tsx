import type { Metadata } from 'next'
import PortalRouterClient from './PortalRouterClient'
import { pageAlternates } from '@/lib/seo/alternates'

const FAQ = {
  en: [
    ['Which portal registers food products in Dubai?', 'Packaged food and beverages go through Dubai Municipality\'s FIRS (Food Import & Re-export System) after federal registration in ZAD. Food submitted through Montaji is rejected — Montaji is for cosmetics, supplements, detergents and pet food.'],
    ['How much does Dubai Municipality product registration cost?', 'Official Dubai Municipality fees are AED 10 per application plus AED 100–220 for the certificate, i.e. roughly AED 110–240 per product variant. Lab testing, translation and consultants are extra.'],
    ['When does a supplement need EDE (formerly MoHAP) instead of Montaji?', 'When the label or marketing makes therapeutic or disease claims, or the product contains pharmaceutical actives. Vitamins and minerals with wellness positioning only register as consumer products (Montaji in Dubai).'],
    ['Do I need ESMA (MoIAT) ECAS certification as well?', 'ESMA became part of MoIAT. Some families — cosmetics, and foods such as bottled water, energy drinks, honey, juices and dairy — sit under UAE technical regulations and may need an ECAS Certificate of Conformity or the Emirates Quality Mark in addition to municipal registration.'],
  ],
  ar: [
    ['أي بوابة تسجّل المنتجات الغذائية في دبي؟', 'الأغذية والمشروبات المعبأة تمر عبر نظام FIRS في بلدية دبي بعد التسجيل الاتحادي في زاد. الأغذية المقدَّمة عبر منتاجي تُرفض — فمنتاجي لمستحضرات التجميل والمكمّلات والمنظفات وأغذية الحيوانات.'],
    ['كم تكلفة تسجيل منتج في بلدية دبي؟', 'الرسوم الرسمية لبلدية دبي 10 دراهم للطلب و100–220 درهماً للشهادة، أي نحو 110–240 درهماً لكل صنف. الفحص المخبري والترجمة والاستشاريون تكاليف إضافية.'],
    ['متى يحتاج المكمّل الغذائي إلى مؤسسة الإمارات للدواء بدل منتاجي؟', 'عندما يحمل الملصق أو التسويق ادعاءات علاجية أو مرضية، أو يحتوي المنتج مواد فعّالة دوائية. الفيتامينات والمعادن ذات التموضع الصحي العام تُسجَّل كمنتجات استهلاكية (منتاجي في دبي).'],
    ['هل أحتاج أيضاً شهادة ECAS من هيئة المواصفات (وزارة الصناعة)؟', 'أُدمجت هيئة المواصفات في وزارة الصناعة والتكنولوجيا المتقدمة. بعض العائلات — مستحضرات التجميل، وأغذية مثل المياه المعبأة ومشروبات الطاقة والعسل والعصائر والألبان — تخضع للوائح فنية إماراتية وقد تحتاج شهادة مطابقة ECAS أو علامة الجودة الإماراتية إضافةً إلى التسجيل البلدي.'],
  ],
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'
  return {
    title: isAr
      ? 'أين أسجّل منتجي في الإمارات؟ منتاجي، FIRS/زاد، مؤسسة الدواء، ADAFSA — Crate'
      : 'Which UAE portal registers my product? Montaji, FIRS/ZAD, EDE, ADAFSA — Crate',
    description: isAr
      ? 'أداة مجانية تحدد الجهة والبوابة والرسوم الرسمية والمستندات ومدة التسجيل لمنتجك (أغذية، مكمّلات، تجميل، منظفات، أغذية حيوانات) بحسب الإمارة. نتيجة فورية وقائمة تحقق بالبريد.'
      : 'Free tool: the exact authority, portal, official fees, documents and timeline to register your product in the UAE (food, supplements, cosmetics, detergents, pet food) by emirate. Instant result + emailed checklist.',
    alternates: pageAlternates(locale, '/tools/product-registration-uae'),
  }
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const faq = locale === 'ar' ? FAQ.ar : FAQ.en
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebApplication', name: locale === 'ar' ? 'موجّه بوابات تسجيل المنتجات في الإمارات' : 'UAE Product Registration Portal Router', applicationCategory: 'BusinessApplication', operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'AED' }, url: `https://www.crate.ae/${locale}/tools/product-registration-uae`, dateModified: '2026-09-24' },
      { '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    ],
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PortalRouterClient locale={locale === 'en' ? 'en' : 'ar'} faq={faq} />
    </>
  )
}
