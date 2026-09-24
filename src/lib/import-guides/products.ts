/**
 * IMPORT GUIDES — product catalogue. Each guide page is GENERATED from the deterministic
 * engines (Portal Router, Certificate Checker, HS/landed-cost), so a guide can never
 * disagree with the tools. `notes` carry only facts that came from a cited source.
 * Selected from the measured search intents (see docs/demand_and_leadgen_study.md).
 */
import type { Bi, Category } from '@/lib/portal-router/rules'
import type { Family } from '@/lib/certificates/rules'
import type { Excise } from '@/lib/customs/hs-fmcg'

export const REVIEWED = '2026-09-24'

export type Group = 'staples' | 'food' | 'drinks' | 'health'

export interface GuideProduct {
  slug: string
  name: Bi
  group: Group
  hs: string                // must exist in HS_FMCG
  category: Category        // Portal Router category
  family: Family            // Certificate Checker family
  animal?: boolean
  ecasWatch?: boolean       // one of the families MoIAT technical regulations may cover (water/energy/honey/juice/dairy)
  excise?: Excise
  example?: { units?: number; litres?: number; sugar?: number; retail?: number }
  notes: Bi[]
  related: string[]         // slugs
}

export const GROUPS: { key: Group; label: Bi }[] = [
  { key: 'staples', label: { en: 'Staples & commodities', ar: 'سلع أساسية' } },
  { key: 'food', label: { en: 'Packaged & processed food', ar: 'أغذية معبأة ومصنّعة' } },
  { key: 'drinks', label: { en: 'Beverages', ar: 'المشروبات' } },
  { key: 'health', label: { en: 'Cosmetics, health & household', ar: 'التجميل والصحة والمنزل' } },
]

export const GUIDE_PRODUCTS: GuideProduct[] = [
  {
    slug: 'rice', name: { en: 'rice', ar: 'الأرز' }, group: 'staples', hs: '1006', category: 'food', family: 'oils_grains',
    notes: [{ en: 'Guidance on the GCC tariff lists rice, sugar and grains among the duty-free food staples, so the landed cost is driven by freight and compliance rather than duty.', ar: 'توجيهات التعرفة الخليجية تُدرج الأرز والسكر والحبوب ضمن السلع الغذائية المعفاة من الرسوم، فتتحدد التكلفة الواصلة بالشحن والامتثال لا بالجمارك.' }],
    related: ['tea', 'coffee', 'spices'],
  },
  {
    slug: 'coffee', name: { en: 'coffee', ar: 'القهوة' }, group: 'staples', hs: '0901', category: 'food', family: 'processed_food',
    notes: [{ en: 'Coffee is named among the duty-free food items in the GCC tariff guidance; each SKU (brand × size × barcode) is still registered separately.', ar: 'القهوة مذكورة ضمن السلع الغذائية المعفاة في توجيهات التعرفة الخليجية؛ ويبقى كل صنف (علامة × حجم × باركود) مسجَّلاً على حدة.' }],
    related: ['tea', 'chocolate', 'rice'],
  },
  {
    slug: 'dates', name: { en: 'dates', ar: 'التمور' }, group: 'staples', hs: '0804', category: 'food', family: 'processed_food',
    notes: [{ en: 'Dates sit in the fruit heading (HS 0804) that GCC tariff guidance lists as duty-free; packaged dates products and date syrups may fall under different headings.', ar: 'التمور ضمن بند الفواكه (HS 0804) الذي تذكره توجيهات التعرفة الخليجية كمعفى؛ أما منتجات التمور المعبأة وشراب التمر فقد تقع تحت بنود أخرى.' }],
    related: ['honey', 'coffee', 'chocolate'],
  },
  {
    slug: 'tea', name: { en: 'tea', ar: 'الشاي' }, group: 'staples', hs: '0902', category: 'food', family: 'processed_food', notes: [],
    related: ['coffee', 'rice', 'spices'],
  },
  {
    slug: 'spices', name: { en: 'spices', ar: 'البهارات' }, group: 'staples', hs: '0910', category: 'food', family: 'processed_food', notes: [],
    related: ['rice', 'tea', 'olive-oil'],
  },
  {
    slug: 'olive-oil', name: { en: 'olive oil', ar: 'زيت الزيتون' }, group: 'food', hs: '1509', category: 'food', family: 'oils_grains', notes: [],
    related: ['honey', 'spices', 'rice'],
  },
  {
    slug: 'honey', name: { en: 'honey', ar: 'العسل' }, group: 'food', hs: '0409', category: 'food', family: 'honey', ecasWatch: true,
    notes: [{ en: 'Honey appears alongside bottled water, energy drinks, juices and dairy among the food families MoIAT technical regulations can cover — do not assume it is exempt; verify for your origin and pack.', ar: 'يظهر العسل مع المياه المعبأة ومشروبات الطاقة والعصائر والألبان ضمن العائلات الغذائية التي قد تشملها اللوائح الفنية لوزارة الصناعة — لا تفترض إعفاءه؛ تحقق لمنشئك وعبوتك.' }],
    related: ['dates', 'olive-oil', 'chocolate'],
  },
  {
    slug: 'chocolate', name: { en: 'chocolate', ar: 'الشوكولاتة' }, group: 'food', hs: '1806', category: 'food', family: 'confectionery_snack', notes: [],
    related: ['coffee', 'dates', 'cheese'],
  },
  {
    slug: 'cheese', name: { en: 'cheese', ar: 'الجبن' }, group: 'food', hs: '0406', category: 'food', family: 'dairy', ecasWatch: true,
    notes: [{ en: 'For dairy the UAE label check also requires the fat-content percentage to be declared.', ar: 'في منتجات الألبان يشترط فحص الملصق الإماراتي أيضاً إعلان نسبة الدهون.' }],
    related: ['chocolate', 'olive-oil', 'frozen-chicken'],
  },
  {
    slug: 'frozen-chicken', name: { en: 'frozen chicken', ar: 'الدجاج المجمد' }, group: 'food', hs: '0207', category: 'food', family: 'meat', animal: true,
    notes: [
      { en: 'UAE Food Code guidance requires a valid halal certificate from an accredited body in the exporting country for imported meat and poultry.', ar: 'توجيهات كود الغذاء الإماراتي تشترط شهادة حلال سارية من جهة معتمدة في بلد التصدير للحوم والدواجن المستوردة.' },
      { en: 'ADAFSA guidance keeps chilled food below 5 °C and frozen food at −18 °C or colder, with transport temperature records.', ar: 'توجيهات ADAFSA تُبقي الأغذية المبردة تحت 5 °م والمجمدة عند −18 °م أو أقل، مع سجلات درجات الحرارة أثناء النقل.' },
    ],
    related: ['cheese', 'rice', 'spices'],
  },
  {
    slug: 'bottled-water', name: { en: 'bottled water', ar: 'المياه المعبأة' }, group: 'drinks', hs: '2201', category: 'food', family: 'water', ecasWatch: true,
    notes: [{ en: 'Plain sparkling water with no added sugar is outside the 2026 sweetened-drink excise; the Emirates Quality Mark is mandatory for bottled drinking and natural mineral water.', ar: 'المياه الغازية العادية بلا سكر مضاف خارج الضريبة الانتقائية على المشروبات المحلّاة 2026؛ وعلامة الجودة الإماراتية إلزامية لمياه الشرب المعبأة والمعدنية الطبيعية.' }],
    related: ['soft-drinks', 'juice', 'energy-drinks'],
  },
  {
    slug: 'energy-drinks', name: { en: 'energy drinks', ar: 'مشروبات الطاقة' }, group: 'drinks', hs: '2202.99', category: 'food', family: 'energy', ecasWatch: true, excise: 'energy',
    example: { units: 4800, retail: 9 },
    notes: [
      { en: 'Excise is 100% of the excise price on energy drinks (Cabinet Decision 197/2025) — usually the biggest single cost line.', ar: 'الضريبة الانتقائية 100% من سعر الضريبة على مشروبات الطاقة (قرار مجلس الوزراء 197/2025) — وغالباً أكبر بند تكلفة.' },
      { en: 'The label check for energy drinks also tests: a "Warning" prefix, the mandatory health-warning groups (pregnancy, nursing, children, heart), the sleep warning, a "high caffeine content" statement above 150 mg/L, and the maximum daily consumption.', ar: 'فحص الملصق لمشروبات الطاقة يختبر أيضاً: كلمة «تحذير»، وفئات التحذير الصحي الإلزامية (الحمل، الرضاعة، الأطفال، القلب)، وتحذير النوم، وعبارة «محتوى عالٍ من الكافيين» فوق 150 ملغم/لتر، والحد الأقصى للاستهلاك اليومي.' },
    ],
    related: ['soft-drinks', 'bottled-water', 'juice'],
  },
  {
    slug: 'soft-drinks', name: { en: 'soft drinks', ar: 'المشروبات الغازية' }, group: 'drinks', hs: '2202.10', category: 'food', family: 'soft_drink', excise: 'sweet',
    example: { units: 4800, litres: 1584, sugar: 10 },
    notes: [
      { en: 'Since 1 January 2026 carbonated drinks are no longer a separate 50% excise category: sweetened drinks are taxed by sugar content — under 5 g/100 ml AED 0; 5 to under 8 g AED 0.79/L; 8 g and above AED 1.09/L.', ar: 'منذ 1 يناير 2026 لم تعد المشروبات الغازية فئة انتقائية مستقلة بنسبة 50%: تُفرض الضريبة على المشروبات المحلّاة بحسب السكر — أقل من 5 غ/100 مل صفر؛ من 5 إلى أقل من 8 غ 0.79 درهم/لتر؛ 8 غ فأكثر 1.09 درهم/لتر.' },
      { en: 'If the product contains sulphites (E220–E228) they must be declared on the label by E-number.', ar: 'إذا احتوى المنتج على سلفايت (E220–E228) وجب إعلانه على الملصق برقم E.' },
    ],
    related: ['energy-drinks', 'bottled-water', 'juice'],
  },
  {
    slug: 'juice', name: { en: 'juice', ar: 'العصائر' }, group: 'drinks', hs: '2009', category: 'food', family: 'juice', ecasWatch: true, excise: 'sweet',
    example: { units: 4800, litres: 1584, sugar: 10 },
    notes: [{ en: 'The excise example assumes a sweetened juice drink at 10 g sugar/100 ml. 100% juice with no added sugar is generally outside the sugar tiers — confirm the FTA definition for your product.', ar: 'مثال الضريبة الانتقائية يفترض مشروب عصير محلّى بـ10 غ سكر/100 مل. العصير 100% دون سكر مضاف خارج شرائح السكر عموماً — تحقق من تعريف الهيئة الاتحادية للضرائب لمنتجك.' }],
    related: ['soft-drinks', 'bottled-water', 'energy-drinks'],
  },
  {
    slug: 'perfume', name: { en: 'perfume', ar: 'العطور' }, group: 'health', hs: '3303', category: 'cosmetic', family: 'perfume',
    notes: [{ en: 'Perfumery, cosmetics and personal-care products are governed by UAE.S GSO 1943 and need an ECAS Certificate of Conformity through a notified body, which customs clearance relies on.', ar: 'العطور ومستحضرات التجميل والعناية الشخصية تحكمها UAE.S GSO 1943 وتحتاج شهادة مطابقة ECAS عبر جهة معتمدة، ويعتمد عليها التخليص الجمركي.' }],
    related: ['skincare', 'detergents', 'supplements'],
  },
  {
    slug: 'skincare', name: { en: 'skincare & cosmetics', ar: 'مستحضرات العناية بالبشرة والتجميل' }, group: 'health', hs: '3304', category: 'cosmetic', family: 'cosmetic',
    notes: [{ en: 'Consultants report Montaji timelines of roughly 2–4 weeks for a single skincare SKU; the ECAS conformity certificate is separate from Dubai Municipality registration.', ar: 'يذكر الاستشاريون مدة منتاجي نحو 2–4 أسابيع لصنف عناية واحد؛ وشهادة مطابقة ECAS منفصلة عن تسجيل بلدية دبي.' }],
    related: ['perfume', 'supplements', 'detergents'],
  },
  {
    slug: 'supplements', name: { en: 'dietary supplements', ar: 'المكمّلات الغذائية' }, group: 'health', hs: '2106', category: 'supplement', family: 'supplement',
    notes: [{ en: 'What decides the route is the claim: disease/therapeutic claims or pharmaceutical actives move a supplement to the federal EDE regime; wellness-only vitamins and minerals register as consumer products (Montaji in Dubai).', ar: 'ما يحدد المسار هو الادعاء: الادعاءات العلاجية/المرضية أو المواد الفعّالة الدوائية تنقل المكمّل إلى نظام مؤسسة الإمارات للدواء الاتحادي؛ أما الفيتامينات والمعادن ذات التموضع الصحي العام فتُسجَّل كمنتجات استهلاكية (منتاجي في دبي).' }],
    related: ['skincare', 'perfume', 'pet-food'],
  },
  {
    slug: 'pet-food', name: { en: 'pet food', ar: 'أغذية الحيوانات الأليفة' }, group: 'health', hs: '2309.10', category: 'petfood', family: 'petfood',
    notes: [{ en: 'MOCCAE lists these documents for an animal-feed import permit: certificate of origin, customs declaration or bill of lading, purchase invoice, and a lab analysis certificate per product.', ar: 'تُدرج وزارة التغير المناخي هذه المستندات لإذن استيراد الأعلاف: شهادة منشأ، بيان جمركي أو بوليصة شحن، فاتورة شراء، وشهادة تحليل مخبري لكل منتج.' }],
    related: ['supplements', 'detergents', 'skincare'],
  },
  {
    slug: 'detergents', name: { en: 'detergents & disinfectants', ar: 'المنظفات والمطهرات' }, group: 'health', hs: '3402', category: 'detergent', family: 'detergent', notes: [],
    related: ['pet-food', 'skincare', 'perfume'],
  },
  {
    slug: 'maple-syrup', name: { en: 'maple syrup', ar: 'شراب القيقب' }, group: 'food', hs: '1702', category: 'food', family: 'processed_food',
    notes: [{ en: 'ZAD registration is per SKU (brand × product × pack size × barcode), so every bottle size of a maple-syrup brand is a separate registration and label approval.', ar: 'التسجيل في زاد لكل صنف (علامة × منتج × حجم عبوة × باركود)، فكل حجم عبوة من علامة شراب القيقب تسجيل واعتماد ملصق منفصل.' }],
    related: ['honey', 'sugar', 'biscuits'],
  },
  {
    slug: 'nuts', name: { en: 'nuts (cashews, pistachios, almonds)', ar: 'المكسرات (كاجو، فستق، لوز)' }, group: 'food', hs: '0802', category: 'food', family: 'processed_food',
    notes: [{ en: 'Allergen declarations are among the mandatory GSO 9 label elements, so tree nuts and peanut traces must be declared in Arabic on the pack.', ar: 'إعلان مسببات الحساسية من العناصر الإلزامية في GSO 9، فيجب إعلان المكسرات وآثار الفول السوداني بالعربية على العبوة.' }],
    related: ['dates', 'chocolate', 'biscuits'],
  },
  {
    slug: 'breakfast-cereals', name: { en: 'breakfast cereals', ar: 'حبوب الإفطار' }, group: 'food', hs: '1904', category: 'food', family: 'processed_food',
    notes: [{ en: 'Allergen declarations (gluten-containing grains, nuts, milk derivatives) are among the mandatory GSO 9 label elements and must appear in Arabic.', ar: 'إعلان مسببات الحساسية (الحبوب المحتوية على الغلوتين، المكسرات، مشتقات الحليب) من العناصر الإلزامية في GSO 9 ويجب أن يظهر بالعربية.' }],
    related: ['biscuits', 'milk', 'sugar'],
  },
  {
    slug: 'milk', name: { en: 'milk', ar: 'الحليب' }, group: 'food', hs: '0401', category: 'food', family: 'dairy', ecasWatch: true,
    notes: [
      { en: 'For dairy the UAE label check also requires the fat-content percentage to be declared.', ar: 'في منتجات الألبان يشترط فحص الملصق الإماراتي أيضاً إعلان نسبة الدهون.' },
      { en: 'Beverages containing at least 75% milk are excluded from the 2026 sweetened-drinks excise, so plain and most flavoured milk do not carry the sugar-tier tax.', ar: 'المشروبات التي تحتوي 75% حليباً على الأقل مستثناة من الضريبة الانتقائية على المشروبات المحلّاة 2026، فلا يخضع الحليب العادي ومعظم المنكّه لشرائح السكر.' },
    ],
    related: ['cheese', 'breakfast-cereals', 'chocolate'],
  },
  {
    slug: 'sugar', name: { en: 'sugar', ar: 'السكر' }, group: 'staples', hs: '1701', category: 'food', family: 'oils_grains',
    notes: [{ en: 'GCC tariff guidance lists sugar with rice and grains among the duty-free food staples — confirm the exemption for the exact line (raw, refined or specialty sugars) on the Dubai Customs tariff.', ar: 'توجيهات التعرفة الخليجية تُدرج السكر مع الأرز والحبوب ضمن السلع الغذائية المعفاة — أكّد الإعفاء للبند الدقيق (خام، مكرر، أو سكريات خاصة) على تعرفة جمارك دبي.' }],
    related: ['rice', 'coffee', 'maple-syrup'],
  },
  {
    slug: 'frozen-beef', name: { en: 'frozen beef', ar: 'لحم البقر المجمد' }, group: 'staples', hs: '0202', category: 'food', family: 'meat', animal: true,
    notes: [
      { en: 'UAE Food Code guidance requires a valid halal certificate from an accredited body in the exporting country for imported meat and poultry.', ar: 'توجيهات كود الغذاء الإماراتي تشترط شهادة حلال سارية من جهة معتمدة في بلد التصدير للحوم والدواجن المستوردة.' },
      { en: 'ADAFSA guidance keeps chilled food below 5 °C and frozen food at −18 °C or colder, with transport temperature records.', ar: 'توجيهات ADAFSA تُبقي الأغذية المبردة تحت 5 °م والمجمدة عند −18 °م أو أقل، مع سجلات درجات الحرارة أثناء النقل.' },
    ],
    related: ['frozen-chicken', 'cheese', 'spices'],
  },
  {
    slug: 'pasta-noodles', name: { en: 'pasta & noodles', ar: 'المعكرونة والنودلز' }, group: 'food', hs: '1902', category: 'food', family: 'processed_food',
    notes: [{ en: 'Allergen declarations (gluten, egg) are among the mandatory GSO 9 label elements and must appear in Arabic.', ar: 'إعلان مسببات الحساسية (الغلوتين، البيض) من العناصر الإلزامية في GSO 9 ويجب أن يظهر بالعربية.' }],
    related: ['sauces-ketchup', 'rice', 'canned-tuna'],
  },
  {
    slug: 'canned-tuna', name: { en: 'canned tuna', ar: 'التونة المعلبة' }, group: 'food', hs: '1604', category: 'food', family: 'processed_food',
    notes: [{ en: 'Canned fish is registered like any packaged food (ZAD + FIRS); the Arabic label must show production and expiry dates on the original pack, net content in metric units and country of origin.', ar: 'تُسجَّل الأسماك المعلبة كأي غذاء معبأ (زاد + FIRS)؛ ويجب أن يُظهر الملصق العربي تاريخي الإنتاج والانتهاء على العبوة الأصلية، والمحتوى الصافي بوحدات مترية، وبلد المنشأ.' }],
    related: ['pasta-noodles', 'sauces-ketchup', 'olive-oil'],
  },
  {
    slug: 'sauces-ketchup', name: { en: 'sauces & ketchup', ar: 'الصلصات والكاتشب' }, group: 'food', hs: '2103', category: 'food', family: 'processed_food',
    notes: [{ en: 'If a sauce contains sulphites (E220–E228) they must be declared on the label by E-number.', ar: 'إذا احتوت الصلصة على سلفايت (E220–E228) وجب إعلانه على الملصق برقم E.' }],
    related: ['pasta-noodles', 'canned-tuna', 'spices'],
  },
  {
    slug: 'biscuits', name: { en: 'biscuits & cookies', ar: 'البسكويت والكوكيز' }, group: 'food', hs: '1905', category: 'food', family: 'confectionery_snack',
    notes: [{ en: 'Allergen declarations (gluten, milk, egg, nuts) are among the mandatory GSO 9 label elements and must appear in Arabic.', ar: 'إعلان مسببات الحساسية (الغلوتين، الحليب، البيض، المكسرات) من العناصر الإلزامية في GSO 9 ويجب أن يظهر بالعربية.' }],
    related: ['chocolate', 'breakfast-cereals', 'nuts'],
  },
]

export const findGuide = (slug: string) => GUIDE_PRODUCTS.find(p => p.slug === slug)
