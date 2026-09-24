/**
 * CERTIFICATE CHECKER — deterministic "which UAE conformity certificates does my
 * product need (ECAS / EQM / Halal / organic…) and what do they cost?"
 *
 * Pure data + pure function; same answers → same result. Fees split into OFFICIAL
 * (MoIAT published) and REPORTED (consultants/certification bodies) and labelled.
 * Review date 2026-09-24. Sources at the bottom.
 */
export type Bi = { en: string; ar: string }
export type Family =
  | 'water' | 'energy' | 'soft_drink' | 'juice' | 'dairy' | 'honey' | 'meat' | 'processed_food'
  | 'confectionery_snack' | 'oils_grains' | 'supplement' | 'cosmetic' | 'perfume' | 'detergent' | 'petfood' | 'packaging'

export interface Answers {
  family: Family
  imported: boolean
  animal: boolean        // animal-derived ingredients (gelatin, enzymes, whey, collagen, alcohol-based flavour)
  organic: boolean       // "organic" claim on pack
  halalMark: boolean     // wants to print the Halal National Mark / halal logo
}

export type Status = 'mandatory' | 'conditional' | 'voluntary' | 'not_required'

export interface CertItem {
  key: string
  name: Bi
  status: Status
  why: Bi
  issuer: Bi
  standard?: string
  officialFee?: Bi     // published government fees
  reportedFee?: Bi     // consultant / body-reported ranges — flagged as such
  time?: Bi
  url: string
}

export interface CertResult {
  key: string
  headline: Bi
  items: CertItem[]
  officialTotalAed: number   // sum of MoIAT published fees for mandatory MoIAT items (indicative)
  notes: Bi[]
  sources: { label: string; url: string }[]
}

export const FAMILIES: { key: Family; label: Bi; hint: Bi; food: boolean }[] = [
  { key: 'water',        food: true,  label: { en: 'Bottled drinking / mineral water', ar: 'مياه شرب معبأة / معدنية' }, hint: { en: 'still, sparkling, natural mineral', ar: 'عادية، غازية، معدنية طبيعية' } },
  { key: 'energy',       food: true,  label: { en: 'Energy drink', ar: 'مشروب طاقة' }, hint: { en: 'caffeine/taurine beverages', ar: 'مشروبات الكافيين/التورين' } },
  { key: 'soft_drink',   food: true,  label: { en: 'Soft / sweetened drink', ar: 'مشروب غازي / محلّى' }, hint: { en: 'carbonated, flavoured water, iced tea', ar: 'غازي، مياه منكّهة، شاي مثلج' } },
  { key: 'juice',        food: true,  label: { en: 'Juice & nectar', ar: 'عصير ونكتار' }, hint: { en: '100% juice, nectars, concentrates', ar: 'عصير 100%، نكتار، مركّزات' } },
  { key: 'dairy',        food: true,  label: { en: 'Milk & dairy', ar: 'حليب ومنتجات ألبان' }, hint: { en: 'milk, laban, yoghurt, cheese, butter', ar: 'حليب، لبن، زبادي، جبن، زبدة' } },
  { key: 'honey',        food: true,  label: { en: 'Honey', ar: 'عسل' }, hint: { en: 'natural honey, honey blends', ar: 'عسل طبيعي، خلطات عسل' } },
  { key: 'meat',         food: true,  label: { en: 'Meat, poultry & seafood', ar: 'لحوم ودواجن وأسماك' }, hint: { en: 'fresh, chilled, frozen, processed', ar: 'طازجة، مبردة، مجمدة، مصنّعة' } },
  { key: 'processed_food', food: true, label: { en: 'Packaged / processed food', ar: 'أغذية معبأة / مصنّعة' }, hint: { en: 'sauces, ready meals, canned, pasta', ar: 'صلصات، وجبات جاهزة، معلبات، معكرونة' } },
  { key: 'confectionery_snack', food: true, label: { en: 'Confectionery & snacks', ar: 'حلويات ووجبات خفيفة' }, hint: { en: 'chocolate, sweets, chips, biscuits', ar: 'شوكولاتة، سكاكر، شيبس، بسكويت' } },
  { key: 'oils_grains',  food: true,  label: { en: 'Oils, grains, rice, flour, sugar', ar: 'زيوت وحبوب وأرز وطحين وسكر' }, hint: { en: 'staples', ar: 'سلع أساسية' } },
  { key: 'supplement',   food: false, label: { en: 'Health / dietary supplement', ar: 'مكمّل غذائي / صحي' }, hint: { en: 'vitamins, protein, herbal', ar: 'فيتامينات، بروتين، أعشاب' } },
  { key: 'cosmetic',     food: false, label: { en: 'Cosmetics & personal care', ar: 'مستحضرات تجميل وعناية شخصية' }, hint: { en: 'skincare, haircare, make-up, oral care', ar: 'بشرة، شعر، مكياج، عناية بالفم' } },
  { key: 'perfume',      food: false, label: { en: 'Perfume & fragrance', ar: 'عطور' }, hint: { en: 'EDP/EDT, oud, body mist', ar: 'عطور، عود، رذاذ الجسم' } },
  { key: 'detergent',    food: false, label: { en: 'Detergent / disinfectant', ar: 'منظّف / مطهّر' }, hint: { en: 'household & industrial', ar: 'منزلي وصناعي' } },
  { key: 'petfood',      food: false, label: { en: 'Pet food', ar: 'أغذية حيوانات أليفة' }, hint: { en: 'cat, dog, bird', ar: 'قطط، كلاب، طيور' } },
  { key: 'packaging',    food: false, label: { en: 'Food-contact packaging', ar: 'تغليف ملامس للغذاء' }, hint: { en: 'containers, films, bottles, cups', ar: 'عبوات، أغشية، زجاجات، أكواب' } },
]

// ── Fee facts (published) ─────────────────────────────────────────────────────
const MOIAT_OFFICIAL_AED = 600 + 620 + 500 // registration request + technical review + certificate issuance
const MOIAT_FEE: Bi = {
  en: 'MoIAT published fees: AED 600 registration request + AED 620 technical review per certificate + AED 500 certificate issuance (≈ AED 1,720), plus AED 2,500 per assessor-day if a site assessment is required. Notified-body testing/audit fees are quoted separately.',
  ar: 'رسوم وزارة الصناعة المنشورة: 600 درهم طلب تسجيل + 620 درهماً مراجعة فنية لكل شهادة + 500 درهم إصدار الشهادة (≈ 1,720 درهماً)، إضافةً إلى 2,500 درهم لكل يوم مقيّم إن لزم تقييم الموقع. رسوم الفحص/التدقيق لدى الجهة المعتمدة تُسعَّر على حدة.',
}
const YEARLY: Bi = { en: 'Certificate valid 1 year; renew annually. MoIAT lists 1.5 working days for its own service step — the real timeline is driven by laboratory tests and the notified-body review.', ar: 'الشهادة صالحة سنة وتُجدَّد سنوياً. تذكر الوزارة يوم عمل ونصفاً لخطوتها هي — أما المدة الفعلية فتحكمها الفحوص المخبرية ومراجعة الجهة المعتمدة.' }

// ── Certificate catalogue ─────────────────────────────────────────────────────
const ECAS = (why: Bi, standard: string | undefined, status: Status): CertItem => ({
  key: 'ecas', status, why, standard,
  name: { en: 'ECAS — Emirates Conformity Assessment Scheme certificate', ar: 'شهادة مطابقة ECAS (نظام تقييم المطابقة الإماراتي)' },
  issuer: { en: 'MoIAT (formerly ESMA) via an MoIAT-notified body', ar: 'وزارة الصناعة والتكنولوجيا المتقدمة (هيئة المواصفات سابقاً) عبر جهة معتمدة' },
  officialFee: MOIAT_FEE, time: YEARLY, url: 'https://moiat.gov.ae/en/services/issue-conformity-certificates-for-regulated-products',
})
const EQM = (why: Bi, standard: string | undefined, status: Status): CertItem => ({
  key: 'eqm', status, why, standard,
  name: { en: 'EQM — Emirates Quality Mark', ar: 'علامة الجودة الإماراتية (EQM)' },
  issuer: { en: 'MoIAT-approved notified body (product tests + factory QMS audit)', ar: 'جهة معتمدة من وزارة الصناعة (فحص المنتج + تدقيق نظام الجودة في المصنع)' },
  officialFee: MOIAT_FEE,
  reportedFee: { en: 'Notified-body fees (product tests + factory audit + travel) are quoted per product line — request quotes from MoIAT-notified bodies.', ar: 'رسوم الجهة المعتمدة (فحص المنتج + تدقيق المصنع + السفر) تُسعَّر لكل خط إنتاج — اطلب عروض أسعار من الجهات المعتمدة لدى الوزارة.' },
  time: YEARLY, url: 'https://moiat.gov.ae/',
})
const HALAL_CERT = (status: Status, why: Bi): CertItem => ({
  key: 'halal_cert', status, why, standard: 'UAE.S 2055-1 · UAE.S 993 (slaughter) · Cabinet Decree 10/2014',
  name: { en: 'Halal certificate from an MoIAT-registered certification body', ar: 'شهادة حلال من جهة مسجّلة لدى وزارة الصناعة' },
  issuer: { en: 'A halal certification body on the MoIAT register (in the exporting country for imports)', ar: 'جهة إصدار شهادات حلال مدرجة في سجل الوزارة (في بلد التصدير للمنتجات المستوردة)' },
  reportedFee: { en: 'Set by the certification body. Initial certification for a small or mid-size business is reported at AED 5,000–15,000 by consultants; ask the body for its fee schedule.', ar: 'تحدده جهة الإصدار. الاعتماد الأولي لشركة صغيرة/متوسطة يُنقل عن الاستشاريين بين 5,000 و15,000 درهم؛ اطلب من الجهة جدول رسومها.' },
  time: { en: 'Audit-based — depends on the body and the audit schedule.', ar: 'قائم على التدقيق — يعتمد على الجهة وجدول التدقيق.' },
  url: 'https://moiat.gov.ae/en/programs/halal',
})
const HALAL_MARK: CertItem = {
  key: 'halal_mark', status: 'voluntary', standard: 'UAE.S 2055-1 (food) · UAE.S 2055-4 (cosmetics)',
  name: { en: 'Halal National Mark (logo on pack)', ar: 'علامة الحلال الوطنية (الشعار على العبوة)' },
  why: { en: 'Optional for most products — a marketing/trust mark. Requires a valid halal certificate for the final product and its raw materials from a registered body.', ar: 'اختيارية لمعظم المنتجات — علامة ثقة تسويقية. تتطلب شهادة حلال سارية للمنتج النهائي ومواده الخام من جهة مسجّلة.' },
  issuer: { en: 'MoIAT halal programme via registered bodies', ar: 'برنامج الحلال في وزارة الصناعة عبر الجهات المسجّلة' },
  reportedFee: { en: 'Body fees as above; mark licensing handled through the body.', ar: 'رسوم الجهة كما أعلاه؛ ترخيص العلامة يتم عبر الجهة.' },
  url: 'https://moiat.gov.ae/en/programs/halal',
}
const ORGANIC: CertItem = {
  key: 'organic', status: 'conditional',
  name: { en: 'Organic certification (accredited body)', ar: 'شهادة عضوي من جهة معتمدة' },
  why: { en: 'Only because the pack says "organic": the claim must be backed by an accredited organic certificate under the UAE organic scheme before the word or logo is used. Confirm the current registration steps with MoIAT.', ar: 'فقط لأن العبوة تقول «عضوي»: يجب أن يدعم الادعاءَ اعتمادٌ عضوي معتمد ضمن النظام الإماراتي للمنتجات العضوية قبل استخدام الكلمة أو الشعار. أكّد خطوات التسجيل الحالية مع الوزارة.' },
  issuer: { en: 'Accredited organic certifier + MoIAT', ar: 'جهة اعتماد عضوي معتمدة + وزارة الصناعة' },
  reportedFee: { en: 'Certifier fees vary by farm/processor; MoIAT service fees apply.', ar: 'رسوم جهة الاعتماد تختلف بحسب المزرعة/المصنع؛ وتُطبَّق رسوم خدمة الوزارة.' },
  url: 'https://moiat.gov.ae/',
}
const HEALTH_CERT: CertItem = {
  key: 'health_cert', status: 'mandatory',
  name: { en: 'Health certificate from the country of origin', ar: 'شهادة صحية من بلد المنشأ' },
  why: { en: 'Required for imported food consignments at port clearance (issued or endorsed by the exporting country\'s competent authority).', ar: 'مطلوبة لإرساليات الأغذية المستوردة عند التخليص في المنفذ (تصدرها أو تعتمدها الجهة المختصة في بلد التصدير).' },
  issuer: { en: 'Competent food authority in the exporting country', ar: 'الجهة الغذائية المختصة في بلد التصدير' },
  reportedFee: { en: 'Set by the exporting authority (usually nominal).', ar: 'تحدده جهة التصدير (رمزية عادةً).' },
  url: 'https://www.adafsa.gov.ae/',
}
const NONE_ECAS: CertItem = {
  key: 'ecas_none', status: 'not_required',
  name: { en: 'ECAS / EQM conformity certificate', ar: 'شهادة مطابقة ECAS / علامة الجودة EQM' },
  why: { en: 'Not on the mandatory list for this family as of the review date — product registration + Arabic label are the gate, not a conformity certificate. Re-check MoIAT if the formulation is unusual.', ar: 'ليست على القائمة الإلزامية لهذه العائلة حتى تاريخ المراجعة — البوابة هي تسجيل المنتج والملصق العربي لا شهادة المطابقة. راجع الوزارة إن كانت التركيبة غير معتادة.' },
  issuer: { en: '—', ar: '—' }, url: 'https://moiat.gov.ae/',
}
const REG_ONLY = (what: Bi): CertItem => ({
  key: 'registration', status: 'mandatory',
  name: { en: 'Product registration (not a certificate)', ar: 'تسجيل المنتج (ليس شهادة)' },
  why: what,
  issuer: { en: 'See the Portal Router for the exact authority', ar: 'انظر موجّه البوابات للجهة الدقيقة' },
  url: '/tools/product-registration-uae',
})
const FCM: CertItem = {
  key: 'fcm', status: 'mandatory',
  name: { en: 'Food Contact Materials certificate (Dubai Municipality)', ar: 'شهادة المواد الملامسة للغذاء (بلدية دبي)' },
  why: { en: 'Packaging that touches food needs test reports and Dubai Municipality approval before it is used or sold for food use in Dubai (Montaji lists Food Contact Materials certificates).', ar: 'التغليف الملامس للغذاء يحتاج تقارير فحص وموافقة بلدية دبي قبل استخدامه أو بيعه للاستخدام الغذائي في دبي (منتاجي يدرج شهادات المواد الملامسة للغذاء).' },
  issuer: { en: 'Dubai Municipality (Montaji) + accredited lab', ar: 'بلدية دبي (منتاجي) + مختبر معتمد' },
  officialFee: { en: 'DM: AED 10 application + AED 220 certificate (per product)', ar: 'البلدية: 10 دراهم طلب + 220 درهماً شهادة (لكل منتج)' },
  reportedFee: { en: 'Migration-test fees are quoted by the accredited laboratory per material.', ar: 'رسوم فحص الانتقال يحددها المختبر المعتمد لكل مادة.' },
  url: 'https://montaji.dm.gov.ae/',
}

export const SOURCES = [
  { label: 'MoIAT — conformity certificates for regulated products (fees)', url: 'https://moiat.gov.ae/en/services/issue-conformity-certificates-for-regulated-products' },
  { label: 'MoIAT — Halal programme (Cabinet Decree 10/2014; UAE.S 2055 series)', url: 'https://moiat.gov.ae/en/programs/halal' },
  { label: 'Intertek — ECAS/EQM for cosmetics & perfumery', url: 'https://www.intertek.com/government/product-conformity/ecas-perfumes-cosmetics/' },
  { label: 'Cotecna — EQM mandatory for bottled drinking water', url: 'https://www.cotecna.com/en/media/news/significance-of-the-emirates-quality-mark-eqm-for-drinking-water' },
  { label: 'ADAFSA — importer guide (health & halal certificates)', url: 'https://www.adafsa.gov.ae/' },
  { label: 'Halal certification cost ranges (consultant-reported)', url: 'https://ninesconsultancy.com/halal-certification-in-uae-complete-process-requirements-and-cost/' },
]

export function checkCertificates(a: Answers): CertResult {
  const items: CertItem[] = []
  const notes: Bi[] = []
  const fam = FAMILIES.find(f => f.key === a.family)!

  switch (a.family) {
    case 'water':
      items.push(EQM({ en: 'Bottled drinking water and natural mineral water must carry the Emirates Quality Mark — for local producers and importers alike — before sale.', ar: 'مياه الشرب المعبأة والمياه المعدنية الطبيعية يجب أن تحمل علامة الجودة الإماراتية — للمنتجين المحليين والمستوردين — قبل البيع.' }, undefined, 'mandatory'))
      break
    case 'energy':
      items.push(ECAS({ en: 'Energy drinks are a regulated product under the UAE energy-drink technical regulation (mandatory health-warning labelling and caffeine declaration); a conformity certificate is required before registration.', ar: 'مشروبات الطاقة منتج خاضع للائحة الفنية الإماراتية لمشروبات الطاقة (تحذيرات صحية إلزامية على الملصق وبيان الكافيين)؛ وشهادة المطابقة مطلوبة قبل التسجيل.' }, 'UAE.S 1926', 'mandatory'))
      notes.push({ en: 'Excise tax: 100% on energy drinks (Cabinet Decision 197/2025). Use the landed-cost calculator.', ar: 'ضريبة انتقائية: 100% على مشروبات الطاقة (قرار مجلس الوزراء 197/2025). استخدم حاسبة التكلفة الواصلة.' })
      break
    case 'soft_drink':
      items.push(EQM({ en: 'Voluntary for most soft drinks; check the MoIAT list if the product is marketed as "water" or a health beverage.', ar: 'اختيارية لمعظم المشروبات الغازية؛ تحقق من قائمة الوزارة إذا سُوِّق المنتج كـ«مياه» أو مشروب صحي.' }, undefined, 'voluntary'))
      notes.push({ en: 'Excise tax since 1 Jan 2026 is by sugar content: <5 g/100 ml = 0; 5–<8 g = AED 0.79/L; ≥8 g = AED 1.09/L. Carbonated drinks are no longer a separate 50% category.', ar: 'الضريبة الانتقائية منذ 1 يناير 2026 بحسب السكر: أقل من 5 غ/100 مل = 0؛ 5–أقل من 8 غ = 0.79 درهم/لتر؛ 8 غ فأكثر = 1.09 درهم/لتر. المشروبات الغازية لم تعد فئة مستقلة بنسبة 50%.' })
      break
    case 'juice':
      items.push(EQM({ en: 'EQM is voluntary for most juices and nectars today; some beverage sub-categories sit under technical regulations — confirm the family with MoIAT before printing the mark.', ar: 'علامة الجودة اختيارية لمعظم العصائر والنكتار حالياً؛ بعض الفئات الفرعية تخضع للوائح فنية — أكّد العائلة مع الوزارة قبل طباعة العلامة.' }, undefined, 'voluntary'))
      notes.push({ en: 'Sweetened juice drinks fall under the 2026 sugar-tier excise; 100% juice with no added sugar is generally outside it — verify with the FTA definition.', ar: 'مشروبات العصير المحلّاة تخضع لشرائح ضريبة السكر 2026؛ العصير 100% دون سكر مضاف خارجها عموماً — تحقق من تعريف الهيئة الاتحادية للضرائب.' })
      break
    case 'dairy':
      items.push(EQM({ en: 'Certain milk and dairy products are covered by UAE technical regulations and may require EQM/ECAS; not every dairy SKU is in scope — check the product family (fresh milk, laban, cheese, butter).', ar: 'بعض منتجات الحليب والألبان مشمولة بلوائح فنية إماراتية وقد تتطلب EQM/ECAS؛ ليس كل صنف ألبان ضمن النطاق — تحقق من عائلة المنتج (حليب طازج، لبن، جبن، زبدة).' }, undefined, 'conditional'))
      break
    case 'honey':
      items.push(ECAS({ en: 'Honey has a UAE/GSO standard (composition, adulteration limits); conformity evidence is commonly requested at registration. Verify whether a certificate or only a test report is required for your origin.', ar: 'للعسل مواصفة إماراتية/خليجية (التركيب، حدود الغش)؛ ويُطلب إثبات المطابقة عادةً عند التسجيل. تحقق مما إذا كانت شهادة أم تقرير فحص فقط هو المطلوب لمنشئك.' }, undefined, 'conditional'))
      break
    case 'meat':
      items.push(HALAL_CERT('mandatory', { en: 'Meat, poultry and seafood-with-animal-derivatives imports must be halal-certified by a body on the MoIAT register (slaughter per UAE.S 993), matched to each consignment.', ar: 'واردات اللحوم والدواجن (والمأكولات البحرية ذات المشتقات الحيوانية) يجب أن تكون معتمدة حلالاً من جهة في سجل الوزارة (ذبح وفق UAE.S 993) ومطابقة لكل إرسالية.' }))
      break
    case 'processed_food':
    case 'confectionery_snack':
    case 'oils_grains':
      items.push(NONE_ECAS)
      break
    case 'supplement':
      items.push(NONE_ECAS)
      items.push(REG_ONLY({ en: 'Supplements are gated by registration (Montaji in Dubai, or EDE federally when claims/actives are involved), not by a conformity certificate.', ar: 'المكمّلات تُضبط بالتسجيل (منتاجي في دبي، أو مؤسسة الإمارات للدواء اتحادياً عند وجود ادعاءات/مواد فعّالة) لا بشهادة مطابقة.' }))
      break
    case 'cosmetic':
      items.push(ECAS({ en: 'Cosmetics and personal-care products are a regulated ECAS product family: a Certificate of Conformity to UAE.S GSO 1943 through a notified body, in addition to municipal registration.', ar: 'مستحضرات التجميل والعناية الشخصية عائلة منظَّمة ضمن ECAS: شهادة مطابقة للمواصفة UAE.S GSO 1943 عبر جهة معتمدة، إضافةً إلى التسجيل البلدي.' }, 'UAE.S GSO 1943', 'mandatory'))
      break
    case 'perfume':
      items.push(ECAS({ en: 'Perfumery falls under the same regulated cosmetics family (UAE.S GSO 1943); alcohol content and allergen labelling are checked in the conformity file.', ar: 'العطور ضمن عائلة مستحضرات التجميل المنظَّمة نفسها (UAE.S GSO 1943)؛ ويُفحص محتوى الكحول ووسم مسببات الحساسية في ملف المطابقة.' }, 'UAE.S GSO 1943', 'mandatory'))
      break
    case 'detergent':
      items.push(ECAS({ en: 'Household detergents and disinfectants have UAE technical regulations; conformity is commonly required alongside municipal registration — confirm your formulation type (liquid, powder, biocide).', ar: 'المنظفات المنزلية والمطهرات لها لوائح فنية إماراتية؛ وتُطلب المطابقة عادةً مع التسجيل البلدي — أكّد نوع تركيبتك (سائل، مسحوق، مبيد حيوي).' }, undefined, 'conditional'))
      break
    case 'petfood':
      items.push(NONE_ECAS)
      items.push(REG_ONLY({ en: 'Pet food is controlled by the MOCCAE import permit (per consignment, with a lab analysis) and Montaji registration in Dubai.', ar: 'أغذية الحيوانات الأليفة تُضبط بإذن الاستيراد من وزارة التغير المناخي (لكل إرسالية مع تحليل مخبري) وتسجيل منتاجي في دبي.' }))
      break
    case 'packaging':
      items.push(FCM)
      break
  }

  // Cross-cutting rules
  if (fam.food && a.family !== 'meat' && a.animal) {
    items.push(HALAL_CERT('conditional', { en: 'Because the product contains animal-derived ingredients (gelatin, enzymes, whey, collagen, alcohol-based flavours), halal evidence for those inputs is requested at registration/clearance.', ar: 'لأن المنتج يحتوي مكوّنات حيوانية (جيلاتين، إنزيمات، مصل الحليب، كولاجين، نكهات كحولية)، يُطلب إثبات حلال لتلك المدخلات عند التسجيل/التخليص.' }))
  }
  if (a.family === 'cosmetic' || a.family === 'perfume') {
    if (a.animal) items.push(HALAL_CERT('conditional', { en: 'Animal-derived ingredients in cosmetics need halal evidence only if you claim halal; otherwise declare them on the INCI list.', ar: 'المكوّنات الحيوانية في مستحضرات التجميل تحتاج إثبات حلال فقط إذا ادّعيت الحلال؛ وإلا فأعلنها في قائمة INCI.' }))
  }
  if (a.halalMark && !items.some(i => i.key === 'halal_mark')) items.push(HALAL_MARK)
  if (a.organic) items.push(ORGANIC)
  if (fam.food && a.imported && a.family !== 'water') items.push(HEALTH_CERT)

  // Order: mandatory → conditional → voluntary → not required
  const rank: Record<Status, number> = { mandatory: 0, conditional: 1, voluntary: 2, not_required: 3 }
  items.sort((x, y) => rank[x.status] - rank[y.status])

  const officialTotalAed = items.filter(i => i.status === 'mandatory' && (i.key === 'ecas' || i.key === 'eqm')).length * MOIAT_OFFICIAL_AED
    + (items.some(i => i.key === 'fcm') ? 230 : 0)

  notes.push({ en: 'ESMA was merged into MoIAT; "ESMA certificate" and "ECAS certificate" refer to the same MoIAT scheme.', ar: 'أُدمجت هيئة المواصفات (ESMA) في وزارة الصناعة؛ «شهادة ESMA» و«شهادة ECAS» تشيران إلى نظام الوزارة نفسه.' })
  if (!fam.food) notes.push({ en: 'Registration (Montaji / EDE / MOCCAE) is separate from conformity — use the Portal Router for that step.', ar: 'التسجيل (منتاجي / مؤسسة الدواء / وزارة التغير المناخي) منفصل عن المطابقة — استخدم موجّه البوابات لتلك الخطوة.' })

  const mandatory = items.filter(i => i.status === 'mandatory').length
  const key = [a.family, a.imported ? 'imp' : 'loc', a.animal ? 'animal' : '', a.organic ? 'organic' : '', a.halalMark ? 'mark' : ''].filter(Boolean).join('-')
  const headline: Bi = {
    en: `${fam.label.en}: ${mandatory} mandatory certificate${mandatory === 1 ? '' : 's'}${officialTotalAed ? ` — official MoIAT fees ≈ AED ${officialTotalAed.toLocaleString('en-US')}` : ''}`,
    ar: `${fam.label.ar}: ${mandatory} ${mandatory === 1 ? 'شهادة إلزامية' : 'شهادات إلزامية'}${officialTotalAed ? ` — الرسوم الرسمية للوزارة ≈ ${officialTotalAed.toLocaleString('en-US')} درهم` : ''}`,
  }
  return { key, headline, items, officialTotalAed, notes, sources: SOURCES }
}

export function parseCertAnswers(raw: Record<string, unknown> | URLSearchParams | null | undefined): Answers | null {
  const get = (k: string) => raw instanceof URLSearchParams ? raw.get(k) : (raw?.[k] as unknown)
  const family = String(get('family') ?? get('f') ?? '') as Family
  if (!FAMILIES.some(f => f.key === family)) return null
  const bool = (v: unknown, d: boolean) => v == null || v === '' ? d : (v === true || v === 'true' || v === '1')
  return { family, imported: bool(get('imported') ?? get('i'), true), animal: bool(get('animal') ?? get('a'), false), organic: bool(get('organic') ?? get('o'), false), halalMark: bool(get('halalMark') ?? get('h'), false) }
}
export function certAnswersToQuery(a: Answers): string {
  const p = new URLSearchParams({ f: a.family, i: a.imported ? '1' : '0' })
  if (a.animal) p.set('a', '1'); if (a.organic) p.set('o', '1'); if (a.halalMark) p.set('h', '1')
  return p.toString()
}
