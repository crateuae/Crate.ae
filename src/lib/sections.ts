/**
 * THE THREE SECTIONS OF CRATE — single source of truth for the navbar, footer, homepage
 * and the section hub pages, so they can never drift apart.
 *
 *   Import      — every import tool, product registration and the related guides/articles
 *   Trade       — market opportunities, products and suppliers (trading companies)
 *   Packaging   — packing, repacking, wrapping + packaging suppliers, factories and companies
 *
 * Existing URLs are NOT moved (they rank in Google); only the hubs are new.
 */
export type Bi = { en: string; ar: string }
export type SectionKey = 'import' | 'trade' | 'packaging'

export interface SectionLink { href: string; label: Bi; hint: Bi }
export interface Section {
  key: SectionKey
  hub: string
  label: Bi
  tagline: Bi
  links: SectionLink[]
}

export const SECTIONS: Section[] = [
  {
    key: 'import', hub: '/import',
    label: { en: 'Import', ar: 'الاستيراد' },
    tagline: { en: 'Register your product, check certificates and duty, and know the exact steps to import into the UAE.', ar: 'سجّل منتجك، وتحقق من الشهادات والرسوم، واعرف خطوات الاستيراد إلى الإمارات بالضبط.' },
    links: [
      { href: '/import', label: { en: 'Product import guides', ar: 'أدلة استيراد المنتجات' }, hint: { en: 'HS code, duty, steps and certificates per product', ar: 'رمز HS والرسوم والخطوات والشهادات لكل منتج' } },
      { href: '/compliance', label: { en: 'Label pre-check (Dubai Municipality)', ar: 'فحص الملصق (بلدية دبي)' }, hint: { en: 'Every UAE.S 9 gap at once — free', ar: 'كل نواقص UAE.S 9 دفعة واحدة — مجاناً' } },
      { href: '/arabic-food-label-gso-9', label: { en: 'Arabic food label & GSO 9', ar: 'الملصق الغذائي العربي وGSO 9' }, hint: { en: 'Requirements, checklist and compliant label printing', ar: 'المتطلبات وقائمة التحقق وطباعة ملصق مطابق' } },
      { href: '/tools/product-registration-uae', label: { en: 'Where do I register my product?', ar: 'أين أسجّل منتجي؟' }, hint: { en: 'Montaji, FIRS/ZAD, EDE, ADAFSA — fees and documents', ar: 'منتاجي، FIRS/زاد، مؤسسة الدواء، ADAFSA — الرسوم والمستندات' } },
      { href: '/tools/certificates-uae', label: { en: 'ECAS / EQM / Halal certificates', ar: 'شهادات ECAS / EQM / حلال' }, hint: { en: 'Which you need and what they cost', ar: 'أيها تحتاج وكم تكلّف' } },
      { href: '/tools/landed-cost-uae', label: { en: 'HS code & landed cost', ar: 'رمز HS والتكلفة الواصلة' }, hint: { en: 'Duty + excise + VAT and a suggested price', ar: 'جمارك + انتقائية + VAT وسعر بيع مقترح' } },
      { href: '/tools/nutrition', label: { en: 'Nutrition facts calculator', ar: 'حاسبة الحقائق الغذائية' }, hint: { en: 'A submission-ready table per 100 g and per serving', ar: 'جدول جاهز للتقديم لكل 100 غ ولكل حصة' } },
      { href: '/insights', label: { en: 'Articles & import guides', ar: 'مقالات وأدلة الاستيراد' }, hint: { en: 'Brand-by-brand market and import guides', ar: 'أدلة السوق والاستيراد علامةً بعلامة' } },
    ],
  },
  {
    key: 'trade', hub: '/trade',
    label: { en: 'Trade', ar: 'التجارة' },
    tagline: { en: 'Find market opportunities, browse products and reach licensed trading companies.', ar: 'اكتشف فرص السوق، وتصفّح المنتجات، وتواصل مع شركات التجارة المرخّصة.' },
    links: [
      { href: '/market', label: { en: 'Market opportunities', ar: 'فرص السوق' }, hint: { en: 'Scored daily from Noon, Amazon.ae, Carrefour, Lulu and Google Trends', ar: 'مقيَّمة يومياً من نون وأمازون.ae وكارفور ولولو وGoogle Trends' } },
      { href: '/products', label: { en: 'Products', ar: 'المنتجات' }, hint: { en: 'A signal page for every tracked product', ar: 'صفحة إشارات لكل منتج مُتابَع' } },
      { href: '/providers', label: { en: 'Suppliers (trading companies)', ar: 'الموردون (شركات التجارة)' }, hint: { en: 'Companies licensed in the Dubai commercial registry', ar: 'شركات مرخّصة في السجل التجاري بدبي' } },
      { href: '/search', label: { en: 'Smart supplier search', ar: 'بحث ذكي عن الموردين' }, hint: { en: 'Type what you need in plain words', ar: 'اكتب ما تحتاجه بكلمات عادية' } },
      { href: '/rfq', label: { en: 'Request a quote', ar: 'اطلب عرض سعر' }, hint: { en: 'We reply with the best supplier offer', ar: 'نردّ بأفضل عرض من المورّدين' } },
    ],
  },
  {
    key: 'packaging', hub: '/packaging',
    label: { en: 'Packaging', ar: 'التعبئة والتغليف' },
    tagline: { en: 'Plan packing and repacking, and find packaging suppliers, factories and companies.', ar: 'خطّط للتعبئة وإعادة التعبئة، واعثر على موردي ومصانع وشركات التغليف.' },
    links: [
      { href: '/packaging/planner', label: { en: 'Packaging & repacking calculator', ar: 'حاسبة التعبئة وإعادة التعبئة' }, hint: { en: 'Cartons, private-label repacking and mixed food baskets', ar: 'كراتين، وإعادة تعبئة بعلامتك، وسلال غذائية مختلطة' } },
      { href: '/packaging/suppliers', label: { en: 'Packaging suppliers, factories & companies', ar: 'موردو ومصانع وشركات التغليف' }, hint: { en: 'Materials, manufacturers, packing and repacking services', ar: 'مواد، ومصانع، وخدمات التعبئة وإعادة التعبئة' } },
      { href: '/guides/carton-specs', label: { en: 'Carton specifications guide', ar: 'دليل مواصفات الكراتين' }, hint: { en: 'Flute, plies, paper grades and standard sizes', ar: 'الفلوت والطبقات ودرجات الورق والقياسات' } },
    ],
  },
]

export const sectionOf = (key: SectionKey) => SECTIONS.find(s => s.key === key)!
