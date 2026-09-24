/**
 * PORTAL ROUTER — deterministic "which UAE authority/portal registers my product?"
 *
 * Pure data + pure function. Same answers → same route, every time. No AI.
 * Facts are dated and sourced (see SOURCES); anything consultant-reported rather
 * than official is flagged in the copy as "reported" so the reader knows.
 * Review date: 2026-09-24.
 */

export type Category = 'food' | 'supplement' | 'cosmetic' | 'detergent' | 'petfood'
export type Emirate = 'dubai' | 'abudhabi' | 'sharjah' | 'other' | 'multi'

export interface Answers {
  category: Category
  emirate: Emirate
  imported: boolean      // imported vs locally manufactured
  animal: boolean        // food: meat/poultry or animal-derived ingredients (gelatin, enzymes…)
  ecasWatch: boolean     // food: bottled water / energy drink / honey / juice / dairy
  claims: boolean        // supplement: therapeutic or disease claims, or pharmaceutical actives
}

export type Bi = { en: string; ar: string }

export interface Step {
  authority: Bi
  portal: Bi
  url: string
  purpose: Bi
  fee?: Bi
  time?: Bi
  note?: Bi
}

export interface RouteResult {
  key: string
  headline: Bi
  steps: Step[]
  documents: Bi[]
  rejections: Bi[]
  warnings: Bi[]
  sources: { label: string; url: string }[]
}

export const CATEGORIES: { key: Category; label: Bi; hint: Bi }[] = [
  { key: 'food',       label: { en: 'Packaged food & beverages', ar: 'أغذية ومشروبات معبأة' }, hint: { en: 'snacks, juices, water, dairy, honey, energy drinks…', ar: 'وجبات خفيفة، عصائر، مياه، ألبان، عسل، مشروبات طاقة…' } },
  { key: 'supplement', label: { en: 'Health / dietary supplement', ar: 'مكمّل غذائي / صحي' }, hint: { en: 'vitamins, minerals, herbal, protein', ar: 'فيتامينات، معادن، أعشاب، بروتين' } },
  { key: 'cosmetic',   label: { en: 'Cosmetics & personal care', ar: 'مستحضرات تجميل وعناية شخصية' }, hint: { en: 'skincare, haircare, perfume, make-up', ar: 'عناية بالبشرة والشعر، عطور، مكياج' } },
  { key: 'detergent',  label: { en: 'Detergent / disinfectant', ar: 'منظّفات / مطهّرات' }, hint: { en: 'household & industrial cleaners, sanitisers', ar: 'منظفات منزلية وصناعية، معقّمات' } },
  { key: 'petfood',    label: { en: 'Pet food', ar: 'أغذية حيوانات أليفة' }, hint: { en: 'cat, dog, bird food & treats', ar: 'أغذية القطط والكلاب والطيور' } },
]

export const EMIRATES: { key: Emirate; label: Bi }[] = [
  { key: 'dubai',    label: { en: 'Dubai', ar: 'دبي' } },
  { key: 'abudhabi', label: { en: 'Abu Dhabi', ar: 'أبوظبي' } },
  { key: 'sharjah',  label: { en: 'Sharjah', ar: 'الشارقة' } },
  { key: 'other',    label: { en: 'Ajman / RAK / Fujairah / UAQ', ar: 'عجمان / رأس الخيمة / الفجيرة / أم القيوين' } },
  { key: 'multi',    label: { en: 'Whole UAE (several emirates)', ar: 'كل الإمارات (أكثر من إمارة)' } },
]

// ── Authorities & portals (single place for names/URLs) ────────────────────────
const ZAD: Step = {
  authority: { en: 'Ministry of Climate Change & Environment (MOCCAE)', ar: 'وزارة التغير المناخي والبيئة' },
  portal: { en: 'ZAD — national food product registration', ar: 'زاد — النظام الوطني لتسجيل المنتجات الغذائية' },
  url: 'https://www.moccae.gov.ae/',
  purpose: { en: 'Register every food SKU (brand × product × size × barcode) once, federally, before it is handled in the UAE. Local authorities read this record.', ar: 'تسجيل كل صنف غذائي (علامة × منتج × حجم × باركود) مرة واحدة اتحادياً قبل تداوله في الدولة. الجهات المحلية تقرأ هذا السجل.' },
}
const DM_FIRS: Step = {
  authority: { en: 'Dubai Municipality — Food Safety Department', ar: 'بلدية دبي — إدارة سلامة الغذاء' },
  portal: { en: 'FIRS — Food Import & Re-export System', ar: 'FIRS — نظام استيراد وإعادة تصدير الأغذية' },
  url: 'https://www.dm.gov.ae/',
  purpose: { en: 'Register your establishment, get the label assessed, register each food item, then file an import application before the shipment lands. Food does NOT go through Montaji — that is an outright rejection.', ar: 'تسجيل المنشأة، تقييم الملصق، تسجيل كل صنف، ثم طلب استيراد قبل وصول الشحنة. الأغذية لا تُقدَّم عبر منتاجي — يُرفض الطلب فوراً.' },
  fee: { en: 'Official DM fees reported at AED 10 application + AED 100–220 certificate (≈ AED 110–240 per product variant)', ar: 'رسوم البلدية الرسمية المنقولة: 10 دراهم للطلب + 100–220 درهماً للشهادة (نحو 110–240 درهماً لكل صنف)' },
  time: { en: 'Consultants report 2–4 weeks; 22 working days is the commonly quoted standard', ar: 'يذكر الاستشاريون 2–4 أسابيع؛ و22 يوم عمل هو المعيار المتداول' },
}
const DM_MONTAJI: Step = {
  authority: { en: 'Dubai Municipality — Consumer Products Safety', ar: 'بلدية دبي — سلامة المنتجات الاستهلاكية' },
  portal: { en: 'Montaji', ar: 'منتاجي' },
  url: 'https://montaji.dm.gov.ae/',
  purpose: { en: 'Register cosmetics, personal care, health supplements, detergents/disinfectants and pet food sold in Dubai. One application per product variant.', ar: 'تسجيل مستحضرات التجميل والعناية الشخصية والمكمّلات والمنظفات/المطهرات وأغذية الحيوانات الأليفة المباعة في دبي. طلب لكل صنف.' },
  fee: { en: 'AED 10 application + AED 220 certificate issuance (official DM fees; per variant)', ar: '10 دراهم للطلب + 220 درهماً لإصدار الشهادة (رسوم البلدية الرسمية؛ لكل صنف)' },
  time: { en: 'Consultants report 2–6 weeks by category (skincare 2–4, fragrances 3–6)', ar: 'يذكر الاستشاريون 2–6 أسابيع بحسب الفئة (عناية بالبشرة 2–4، عطور 3–6)' },
}
const ADAFSA: Step = {
  authority: { en: 'Abu Dhabi Agriculture & Food Safety Authority (ADAFSA)', ar: 'هيئة أبوظبي للزراعة والسلامة الغذائية' },
  portal: { en: 'ADAFSA importer registration + consignment clearance (with ZAD)', ar: 'تسجيل المستورد لدى الهيئة + تخليص الإرساليات (مع زاد)' },
  url: 'https://www.adafsa.gov.ae/',
  purpose: { en: 'Register as a food importer, keep each product in ZAD, and clear consignments through Abu Dhabi ports under a risk-based regime (document review → inspection → sampling/lab). Guide No. 1 of 2024 is the importer handbook.', ar: 'التسجيل كمستورد أغذية، إبقاء كل منتج مسجلاً في زاد، وتخليص الإرساليات عبر منافذ أبوظبي بنظام قائم على المخاطر (مراجعة مستندات ← تفتيش ← عينات/مختبر). الدليل رقم 1 لسنة 2024 هو دليل المستوردين.' },
}
const LOCAL_FOOD = (name: Bi): Step => ({
  authority: name,
  portal: { en: 'Local food control section of the municipality', ar: 'قسم الرقابة الغذائية في البلدية' },
  url: 'https://u.ae/en/information-and-services/business/food-safety',
  purpose: { en: 'Federal ZAD registration still applies; the emirate of entry/sale runs its own establishment registration, label acceptance and port clearance. Confirm the exact portal with the municipality before shipping.', ar: 'التسجيل الاتحادي في زاد ما زال مطلوباً؛ وإمارة الدخول/البيع تدير تسجيل المنشأة وقبول الملصق والتخليص في المنفذ. أكّد البوابة الدقيقة مع البلدية قبل الشحن.' },
})
const LOCAL_CONSUMER = (name: Bi): Step => ({
  authority: name,
  portal: { en: 'Local consumer-products registration', ar: 'تسجيل المنتجات الاستهلاكية محلياً' },
  url: 'https://u.ae/en/information-and-services/business',
  purpose: { en: 'Outside Dubai, consumer-product registration is handled by the local municipality / quality authority. Montaji covers Dubai only — confirm with the local authority for the emirate where you sell.', ar: 'خارج دبي، تسجيل المنتجات الاستهلاكية تديره البلدية/جهة الجودة المحلية. منتاجي يغطي دبي فقط — أكّد مع الجهة المحلية في إمارة البيع.' },
})
const EDE: Step = {
  authority: { en: 'Emirates Drug Establishment (EDE) — formerly MoHAP services', ar: 'مؤسسة الإمارات للدواء — خدمات وزارة الصحة سابقاً' },
  portal: { en: 'EDE health-product registration', ar: 'تسجيل منتج صحي لدى مؤسسة الإمارات للدواء' },
  url: 'https://www.ede.gov.ae/',
  purpose: { en: 'Products with therapeutic/disease claims or pharmaceutical actives are regulated federally as health products, not consumer goods. EDE took over MoHAP drug & supplement services in late 2025; the supplement import permit is an EDE service.', ar: 'المنتجات التي تحمل ادعاءات علاجية/مرضية أو مواد فعّالة دوائية تُنظَّم اتحادياً كمنتجات صحية لا سلعاً استهلاكية. تولّت المؤسسة خدمات الأدوية والمكمّلات من وزارة الصحة أواخر 2025؛ وإذن استيراد المكمّلات خدمة لديها.' },
  fee: { en: 'Consultant-reported AED 2,000–6,000 per product (verify on EDE fee schedule)', ar: 'المنقول عن الاستشاريين 2,000–6,000 درهم للمنتج (تحقق من جدول رسوم المؤسسة)' },
  time: { en: '30–60 days reported', ar: '30–60 يوماً حسب المنقول' },
}
const MOIAT_ECAS: Step = {
  authority: { en: 'Ministry of Industry & Advanced Technology (MoIAT) — formerly ESMA', ar: 'وزارة الصناعة والتكنولوجيا المتقدمة — هيئة المواصفات (ESMA) سابقاً' },
  portal: { en: 'ECAS / EQM conformity assessment', ar: 'ECAS / علامة الجودة الإماراتية (EQM)' },
  url: 'https://www.moiat.gov.ae/',
  purpose: { en: 'Some product families sit under a UAE technical regulation and need a Certificate of Conformity (ECAS) or the Emirates Quality Mark before market access — check whether yours is on the current mandatory list.', ar: 'بعض عائلات المنتجات تخضع للائحة فنية إماراتية وتحتاج شهادة مطابقة (ECAS) أو علامة الجودة الإماراتية قبل دخول السوق — تحقق مما إذا كان منتجك على القائمة الإلزامية الحالية.' },
}
const HALAL: Step = {
  authority: { en: 'MoIAT-registered halal certification body', ar: 'جهة إصدار شهادات حلال مسجّلة لدى وزارة الصناعة' },
  portal: { en: 'Halal certificate + health certificate from the country of origin', ar: 'شهادة حلال + شهادة صحية من بلد المنشأ' },
  url: 'https://www.moiat.gov.ae/',
  purpose: { en: 'Meat, poultry and products with animal-derived ingredients (gelatin, enzymes, emulsifiers) need halal evidence from a body on the MoIAT register, matching the shipment batch by batch.', ar: 'اللحوم والدواجن والمنتجات ذات المكوّنات الحيوانية (جيلاتين، إنزيمات، مستحلبات) تحتاج إثبات حلال من جهة مسجّلة لدى الوزارة، مطابقاً للشحنة دفعةً بدفعة.' },
}
const MOCCAE_FEED: Step = {
  authority: { en: 'Ministry of Climate Change & Environment (MOCCAE)', ar: 'وزارة التغير المناخي والبيئة' },
  portal: { en: 'Import permit for animal feed & pet food', ar: 'إذن استيراد الأعلاف وأغذية الحيوانات' },
  url: 'https://www.moccae.gov.ae/',
  purpose: { en: 'Each consignment of pet food needs a federal import permit: certificate of origin, customs declaration / bill of lading, purchase invoice and a lab analysis certificate per product.', ar: 'كل إرسالية أغذية حيوانات تحتاج إذن استيراد اتحادياً: شهادة منشأ، بيان جمركي/بوليصة شحن، فاتورة شراء، وشهادة تحليل مخبري لكل منتج.' },
}

const EMIRATE_NAME: Record<Emirate, Bi> = {
  dubai: { en: 'Dubai Municipality', ar: 'بلدية دبي' },
  abudhabi: { en: 'Abu Dhabi', ar: 'أبوظبي' },
  sharjah: { en: 'Sharjah City Municipality', ar: 'بلدية مدينة الشارقة' },
  other: { en: 'Your emirate\'s municipality', ar: 'بلدية إمارتك' },
  multi: { en: 'Each emirate where you sell', ar: 'كل إمارة تبيع فيها' },
}

// ── Documents ──────────────────────────────────────────────────────────────────
const D = {
  license:   { en: 'Valid UAE trade licence with a matching activity (e.g. foodstuff trading, general trading, cosmetics trading)', ar: 'رخصة تجارية إماراتية سارية بنشاط مطابق (تجارة مواد غذائية، تجارة عامة، تجارة مستحضرات تجميل…)' },
  label:     { en: 'Final label artwork — Arabic mandatory (not smaller than the English), all panels', ar: 'تصميم الملصق النهائي — العربية إلزامية (لا تقل حجماً عن الإنجليزية)، كل الأوجه' },
  photos:    { en: 'Clear photos of the finished product (front, back, sides)', ar: 'صور واضحة للمنتج النهائي (أمام، خلف، جوانب)' },
  ingredients: { en: 'Full ingredient / composition list in descending order, with additives by name or E-number', ar: 'قائمة المكوّنات/التركيبة كاملة بترتيب تنازلي، مع المضافات بالاسم أو رقم E' },
  coa:       { en: 'Certificate of Analysis or lab test report from an accredited laboratory', ar: 'شهادة تحليل أو تقرير فحص من مختبر معتمد' },
  barcode:   { en: 'Product barcode (GS1)', ar: 'باركود المنتج (GS1)' },
  shelf:     { en: 'Shelf life and storage conditions', ar: 'مدة الصلاحية وظروف التخزين' },
  manufacturer: { en: 'Manufacturer details and authorisation / appointment letter naming you as importer or distributor', ar: 'بيانات المصنّع وخطاب تفويض/تعيين يسمّيك مستورداً أو موزعاً' },
  health:    { en: 'Health certificate issued or endorsed by the competent authority in the country of origin (imported food)', ar: 'شهادة صحية صادرة أو معتمدة من الجهة المختصة في بلد المنشأ (للأغذية المستوردة)' },
  halal:     { en: 'Halal certificate from a MoIAT-registered body (meat, poultry, animal-derived ingredients)', ar: 'شهادة حلال من جهة مسجّلة لدى وزارة الصناعة (لحوم، دواجن، مكوّنات حيوانية)' },
  freesale:  { en: 'Free Sale Certificate from the country of origin', ar: 'شهادة بيع حر من بلد المنشأ' },
  gmp:       { en: 'GMP / ISO certificate of the manufacturing site', ar: 'شهادة GMP / ISO لموقع التصنيع' },
  msds:      { en: 'Safety Data Sheet (SDS/MSDS) for the formulation', ar: 'نشرة بيانات السلامة (SDS/MSDS) للتركيبة' },
  claims:    { en: 'Evidence for every claim on the pack (nutrition, health, organic, halal)', ar: 'إثبات لكل ادعاء على العبوة (تغذوي، صحي، عضوي، حلال)' },
  shipment:  { en: 'For each shipment: commercial invoice, packing list, certificate of origin, bill of lading / airway bill', ar: 'لكل شحنة: فاتورة تجارية، قائمة تعبئة، شهادة منشأ، بوليصة شحن/جوية' },
  stability: { en: 'Stability study supporting the declared shelf life', ar: 'دراسة ثبات تدعم مدة الصلاحية المعلنة' },
  feedlab:   { en: 'Lab analysis certificate per product (MOCCAE feed permit)', ar: 'شهادة تحليل مخبري لكل منتج (إذن الأعلاف من الوزارة)' },
}

// ── Rejection reasons (seen across DM/ADAFSA guidance and consultant write-ups) ──
const REJ = {
  arabic:    { en: 'Arabic text missing, machine-translated, or smaller than the English', ar: 'النص العربي ناقص أو مترجم آلياً أو أصغر من الإنجليزي' },
  dates:     { en: 'Production/expiry dates not printed on the original label or in the wrong format', ar: 'تواريخ الإنتاج/الانتهاء غير مطبوعة على الملصق الأصلي أو بصيغة خاطئة' },
  importer:  { en: 'Importer name and address missing from the label', ar: 'اسم المستورد وعنوانه غائبان عن الملصق' },
  claimsFood:{ en: 'Health or therapeutic claims on a food or supplement without evidence (or that push it into the EDE route)', ar: 'ادعاءات صحية أو علاجية على غذاء أو مكمّل دون إثبات (أو تنقله إلى مسار مؤسسة الدواء)' },
  mismatch:  { en: 'Shipped label differs from the registered artwork', ar: 'الملصق المشحون يختلف عن التصميم المسجّل' },
  additive:  { en: 'An ingredient or additive not permitted, or not declared with its E-number', ar: 'مكوّن أو مضاف غير مسموح، أو غير مُعلن برقم E' },
  animal:    { en: 'Undeclared animal-derived ingredient (gelatin, alcohol-based flavour) without halal evidence', ar: 'مكوّن حيواني غير مُعلن (جيلاتين، نكهة كحولية) بلا إثبات حلال' },
  portal:    { en: 'Wrong portal — food submitted through Montaji is rejected outright', ar: 'بوابة خاطئة — الأغذية المقدَّمة عبر منتاجي تُرفض فوراً' },
  activity:  { en: 'Trade licence activity does not cover the product', ar: 'نشاط الرخصة التجارية لا يغطي المنتج' },
  netqty:    { en: 'Net quantity not in metric units, or country of origin missing', ar: 'الكمية الصافية ليست بالوحدات المترية، أو بلد المنشأ غائب' },
}

export const SOURCES: { label: string; url: string }[] = [
  { label: 'Dubai Municipality — Montaji portal', url: 'https://montaji.dm.gov.ae/' },
  { label: 'Dubai Municipality — food safety & FIRS', url: 'https://www.dm.gov.ae/' },
  { label: 'ADAFSA — Guide No. 1 (2024) for food importers & exporters', url: 'https://www.adafsa.gov.ae/' },
  { label: 'MOCCAE — ZAD national food registration; feed import permits', url: 'https://www.moccae.gov.ae/' },
  { label: 'MoIAT — ECAS/EQM schemes; halal certification bodies register', url: 'https://www.moiat.gov.ae/' },
  { label: 'Emirates Drug Establishment — supplement import permit', url: 'https://www.ede.gov.ae/' },
  { label: 'UAE Government portal — food safety', url: 'https://u.ae/en/information-and-services/business/food-safety' },
  { label: 'Fee figures as reported in Shuraa\'s 2026 product-registration guide', url: 'https://www.shuraa.com/product-registration-in-dubai/' },
  { label: 'Supplement MoHAP-vs-DM criteria as reported by Nextmove (2026)', url: 'https://nextmoveservices.ae/health-supplement-registration-in-uae-2026/' },
]

// ── The router ─────────────────────────────────────────────────────────────────
export function routeProduct(a: Answers): RouteResult {
  const steps: Step[] = []
  const docs: Bi[] = [D.license, D.label, D.photos, D.ingredients, D.barcode, D.shelf, D.manufacturer]
  const rej: Bi[] = [REJ.arabic, REJ.activity, REJ.mismatch]
  const warnings: Bi[] = []
  const local = EMIRATE_NAME[a.emirate]

  if (a.category === 'food') {
    steps.push(ZAD)
    if (a.emirate === 'dubai') steps.push(DM_FIRS)
    else if (a.emirate === 'abudhabi') steps.push(ADAFSA)
    else if (a.emirate === 'multi') { steps.push(DM_FIRS, ADAFSA); warnings.push({ en: 'ZAD is registered once; label acceptance and port clearance happen in each emirate of entry. Plan Dubai (FIRS) and Abu Dhabi (ADAFSA) as two parallel tracks.', ar: 'زاد يُسجَّل مرة واحدة؛ أما قبول الملصق والتخليص فيتمان في كل إمارة دخول. خطّط لدبي (FIRS) وأبوظبي (ADAFSA) كمسارين متوازيين.' }) }
    else steps.push(LOCAL_FOOD(local))
    if (a.animal) { steps.push(HALAL); docs.push(D.halal); rej.push(REJ.animal) }
    if (a.ecasWatch) { steps.push(MOIAT_ECAS); warnings.push({ en: 'Bottled water, energy drinks, honey, juices and dairy each have UAE technical regulations; some require ECAS/EQM certification on top of food registration. Verify the current MoIAT list before ordering labels.', ar: 'المياه المعبأة ومشروبات الطاقة والعسل والعصائر والألبان لكلٍّ لائحة فنية إماراتية؛ وبعضها يتطلب شهادة ECAS/EQM فوق تسجيل الغذاء. تحقق من قائمة الوزارة الحالية قبل طباعة الملصقات.' }) }
    if (a.imported) docs.push(D.health, D.shipment)
    docs.push(D.coa, D.claims)
    rej.push(REJ.dates, REJ.importer, REJ.portal, REJ.additive, REJ.netqty, REJ.claimsFood)
  }

  if (a.category === 'supplement') {
    if (a.claims) {
      steps.push(EDE)
      warnings.push({ en: 'Remove or substantiate every disease/therapeutic claim before filing: a claim is what moves a supplement from consumer-product registration into the health-product regime.', ar: 'احذف أو أثبت كل ادعاء علاجي/مرضي قبل التقديم: الادعاء هو ما ينقل المكمّل من تسجيل المنتجات الاستهلاكية إلى نظام المنتجات الصحية.' })
    } else {
      if (a.emirate === 'dubai' || a.emirate === 'multi') steps.push(DM_MONTAJI)
      else steps.push(LOCAL_CONSUMER(local))
      warnings.push({ en: 'Consumer-route supplements are vitamins/minerals/dietary products with wellness positioning only. Any "treats / prevents / cures" wording, or a pharmaceutical active, switches the route to EDE (federal).', ar: 'مسار المنتجات الاستهلاكية للمكمّلات يخص الفيتامينات/المعادن/المنتجات الغذائية ذات التموضع الصحي العام فقط. أي عبارة «يعالج/يقي/يشفي» أو مادة فعّالة دوائية تحوّل المسار إلى مؤسسة الإمارات للدواء (اتحادي).' })
    }
    if (a.imported) { steps.push({ ...EDE, portal: { en: 'Supplement import permit (per consignment)', ar: 'إذن استيراد المكمّلات (لكل إرسالية)' }, fee: undefined, time: undefined, purpose: { en: 'Imported supplements need an EDE import permit for release at the port, in addition to product registration.', ar: 'المكمّلات المستوردة تحتاج إذن استيراد من مؤسسة الإمارات للدواء للإفراج في المنفذ، إضافةً إلى تسجيل المنتج.' } }) }
    docs.push(D.coa, D.freesale, D.gmp, D.stability, D.claims)
    if (a.imported) docs.push(D.shipment)
    rej.push(REJ.claimsFood, REJ.dates, REJ.importer, REJ.additive)
  }

  if (a.category === 'cosmetic') {
    if (a.emirate === 'dubai' || a.emirate === 'multi') steps.push(DM_MONTAJI)
    else steps.push(LOCAL_CONSUMER(local))
    steps.push({ ...MOIAT_ECAS, purpose: { en: 'Cosmetics and personal-care products fall under UAE.S GSO 1943; most need an ECAS Certificate of Conformity issued through a notified body. Confirm the scope for your product family (perfume, hair, skin, oral care).', ar: 'مستحضرات التجميل والعناية الشخصية تخضع للمواصفة UAE.S GSO 1943؛ ومعظمها يحتاج شهادة مطابقة ECAS عبر جهة معتمدة. أكّد النطاق لعائلة منتجك (عطور، شعر، بشرة، عناية بالفم).' } })
    docs.push(D.coa, D.freesale, D.gmp, D.msds, D.claims)
    if (a.imported) docs.push(D.shipment)
    rej.push(REJ.claimsFood, REJ.importer, REJ.additive)
  }

  if (a.category === 'detergent') {
    if (a.emirate === 'dubai' || a.emirate === 'multi') steps.push(DM_MONTAJI)
    else steps.push(LOCAL_CONSUMER(local))
    steps.push({ ...MOIAT_ECAS, purpose: { en: 'Detergents and disinfectants have UAE technical regulations; check whether your formulation type needs ECAS conformity in addition to municipal registration.', ar: 'المنظفات والمطهرات لها لوائح فنية إماراتية؛ تحقق مما إذا كان نوع تركيبتك يحتاج مطابقة ECAS إضافةً إلى التسجيل البلدي.' } })
    docs.push(D.msds, D.coa, D.freesale, D.gmp)
    if (a.imported) docs.push(D.shipment)
    rej.push(REJ.importer, REJ.additive, REJ.claimsFood)
  }

  if (a.category === 'petfood') {
    if (a.emirate === 'dubai' || a.emirate === 'multi') steps.push(DM_MONTAJI)
    else steps.push(LOCAL_CONSUMER(local))
    if (a.imported) steps.push(MOCCAE_FEED)
    docs.push(D.coa, D.freesale, D.feedlab)
    if (a.imported) docs.push(D.shipment)
    rej.push(REJ.importer, REJ.additive, REJ.dates)
  }

  if (!a.imported) warnings.push({ en: 'Locally manufactured products register through the same portals, but the factory itself must hold the relevant municipal/industrial licence first.', ar: 'المنتجات المصنّعة محلياً تُسجَّل عبر البوابات نفسها، لكن يجب أن يحمل المصنع الترخيص البلدي/الصناعي المناسب أولاً.' })

  // stable key so the same answers always map to the same email/report id
  const key = [a.category, a.emirate, a.imported ? 'imp' : 'loc', a.animal ? 'animal' : '', a.ecasWatch ? 'ecas' : '', a.claims ? 'claims' : ''].filter(Boolean).join('-')
  const cat = CATEGORIES.find(c => c.key === a.category)!.label
  const em = EMIRATES.find(e => e.key === a.emirate)!.label
  const main = steps[0]
  const headline: Bi = {
    en: `${cat.en} · ${em.en}: ${steps.length} authority step${steps.length > 1 ? 's' : ''} — start with ${main.portal.en}`,
    ar: `${cat.ar} · ${em.ar}: ${steps.length} ${steps.length > 1 ? 'خطوات' : 'خطوة'} لدى الجهات — ابدأ بـ ${main.portal.ar}`,
  }
  // de-dup documents (same object may be pushed twice)
  const seen = new Set<string>()
  const documents = docs.filter(d => (seen.has(d.en) ? false : (seen.add(d.en), true)))
  return { key, headline, steps, documents, rejections: rej, warnings, sources: SOURCES }
}

/** Parse loosely-typed input (query string / JSON) into safe Answers. */
export function parseAnswers(raw: Record<string, unknown> | URLSearchParams | null | undefined): Answers | null {
  const get = (k: string) => raw instanceof URLSearchParams ? raw.get(k) : (raw?.[k] as unknown)
  const category = String(get('category') ?? get('c') ?? '') as Category
  const emirate = String(get('emirate') ?? get('e') ?? '') as Emirate
  if (!CATEGORIES.some(c => c.key === category) || !EMIRATES.some(e => e.key === emirate)) return null
  const bool = (v: unknown, dflt: boolean) => v == null || v === '' ? dflt : (v === true || v === 'true' || v === '1')
  return {
    category, emirate,
    imported: bool(get('imported') ?? get('i'), true),
    animal: category === 'food' && bool(get('animal') ?? get('a'), false),
    ecasWatch: category === 'food' && bool(get('ecasWatch') ?? get('w'), false),
    claims: category === 'supplement' && bool(get('claims') ?? get('k'), false),
  }
}

export function answersToQuery(a: Answers): string {
  const p = new URLSearchParams({ c: a.category, e: a.emirate, i: a.imported ? '1' : '0' })
  if (a.animal) p.set('a', '1')
  if (a.ecasWatch) p.set('w', '1')
  if (a.claims) p.set('k', '1')
  return p.toString()
}
