/**
 * Arabic food label & GSO 9 — the service/guide landing page copy (EN + AR), one source.
 *
 * Facts policy: only what the standard and the authorities publish. No fees, no turnaround
 * days, no penalties invented. Anything the owner still has to confirm is marked in the
 * page report, not asserted here. Edition years are deliberately omitted (the tool footer
 * says UAE.S 9:2019 — confirm the current edition before adding a year to this page).
 */
export type Bi = { en: string; ar: string }

export const GSO9_PATH = '/arabic-food-label-gso-9'
export const GSO9_UPDATED = '2026-09-27'

export const GSO9 = {
  title: {
    en: 'Arabic Food Label & GSO 9 Requirements in the UAE',
    ar: 'الملصق الغذائي العربي ومتطلبات GSO 9 في الإمارات',
  },
  description: {
    en: 'What GSO 9 requires on an Arabic food label in the UAE: the mandatory items, a compliance checklist, the translation trap, and compliant Arabic label printing for importers.',
    ar: 'ما تشترطه GSO 9 على الملصق الغذائي العربي في الإمارات: البنود الإلزامية، قائمة تحقق، فخ الترجمة، وطباعة ملصقات عربية مطابقة للمستوردين.',
  },
  h1: {
    en: 'Arabic Food Label & GSO 9: Requirements and Compliant Label Printing in the UAE',
    ar: 'الملصق الغذائي العربي وGSO 9: المتطلبات وطباعة الملصق المطابق في الإمارات',
  },
  answer: {
    en: 'A GSO 9 Arabic food label is the label every prepackaged food sold in the UAE must carry: the mandatory particulars — product name, ingredients, allergens, net content, dates, origin and importer — in Arabic, laid out to the Gulf standard GSO 9 as adopted by the UAE (UAE.S GSO 9). Without it, Dubai Municipality will not register the product, and imported consignments can be held.',
    ar: 'الملصق الغذائي العربي وفق GSO 9 هو الملصق الذي يجب أن يحمله كل غذاء معبأ يُباع في الإمارات: البيانات الإلزامية — اسم المنتج، المكوّنات، مسببات الحساسية، المحتوى الصافي، التواريخ، بلد المنشأ والمستورد — باللغة العربية، وفق المواصفة الخليجية GSO 9 كما اعتمدتها الإمارات (UAE.S GSO 9). من دونه لا تسجّل بلدية دبي المنتج، ويمكن حجز الإرساليات المستوردة.',
  },
  cta: {
    quote: { en: 'Get a quote for label printing', ar: 'اطلب عرض سعر لطباعة الملصق' },
    precheck: { en: 'Free label pre-check', ar: 'فحص الملصق مجاناً' },
    whatsapp: { en: 'WhatsApp us', ar: 'راسلنا واتساب' },
  },
  crumb: { en: 'Arabic food label & GSO 9', ar: 'الملصق الغذائي العربي وGSO 9' },

  what: {
    h2: { en: 'What is GSO 9? The law behind every Arabic food label', ar: 'ما هي GSO 9؟ القاعدة وراء كل ملصق غذائي عربي' },
    answer: {
      en: 'GSO 9 is the Gulf Standardization Organization standard for the labelling of prepackaged foodstuffs. The UAE adopts it as a mandatory national standard (UAE.S GSO 9), and every food product registered with Dubai Municipality, ADAFSA or the federal ZAD system is checked against it.',
      ar: 'GSO 9 هي مواصفة هيئة التقييس الخليجية لبطاقات المواد الغذائية المعبأة. تعتمدها الإمارات مواصفةً وطنية إلزامية (UAE.S GSO 9)، ويُفحص على أساسها كل منتج غذائي يُسجَّل لدى بلدية دبي أو هيئة أبوظبي للزراعة والسلامة الغذائية (ADAFSA) أو نظام زاد الاتحادي.',
    },
    lead: { en: 'Every prepackaged food must show, in Arabic:', ar: 'يجب أن يُظهر كل غذاء معبأ، باللغة العربية:' },
    items: [
      { en: 'Product name — the true name of the food, not only the brand', ar: 'اسم المنتج — الاسم الحقيقي للغذاء لا العلامة التجارية وحدها' },
      { en: 'List of ingredients in descending order of weight, with additives named by function and INS/E number', ar: 'قائمة المكوّنات بترتيب تنازلي حسب الوزن، مع تسمية المضافات بوظيفتها ورقم INS/E' },
      { en: 'Allergen declaration (gluten-containing cereals, milk, egg, fish, crustaceans, peanuts, tree nuts, soy, sesame, sulphites)', ar: 'إعلان مسببات الحساسية (الحبوب المحتوية على الغلوتين، الحليب، البيض، الأسماك، القشريات، الفول السوداني، المكسرات، الصويا، السمسم، السلفيت)' },
      { en: 'Net content in metric units (g, kg, ml, L)', ar: 'المحتوى الصافي بالوحدات المترية (غ، كغ، مل، لتر)' },
      { en: 'Country of origin', ar: 'بلد المنشأ' },
      { en: 'Name and address of the manufacturer or packer, and of the importer in the UAE', ar: 'اسم وعنوان المصنّع أو المعبّئ، واسم وعنوان المستورد في الإمارات' },
      { en: 'Production and expiry dates, printed on the pack by the manufacturer', ar: 'تاريخا الإنتاج والانتهاء مطبوعين على العبوة من المصنّع' },
      { en: 'Storage conditions and, where needed, instructions for use', ar: 'ظروف التخزين، وتعليمات الاستعمال عند الحاجة' },
      { en: 'Lot or batch identification', ar: 'رقم التشغيلة أو الدفعة' },
      { en: 'Nutritional declaration per 100 g or 100 ml', ar: 'البيان الغذائي لكل 100 غ أو 100 مل' },
    ],
    note: {
      en: 'Other languages may be added alongside the Arabic, provided they carry the same information.',
      ar: 'يجوز إضافة لغات أخرى إلى جانب العربية بشرط أن تحمل المعلومات نفسها.',
    },
  },

  checklist: {
    h2: { en: 'GSO 9 compliance checklist', ar: 'قائمة التحقق من مطابقة GSO 9' },
    answer: {
      en: 'Use this table to audit an existing label before filing. Each row is one mandatory particular, what the standard expects, and the format the authorities accept.',
      ar: 'استخدم هذا الجدول لتدقيق ملصق قائم قبل التقديم. كل صف بيان إلزامي واحد، وما تتوقعه المواصفة، والصيغة التي تقبلها الجهات.',
    },
    cols: [{ en: 'Item', ar: 'البند' }, { en: 'Requirement', ar: 'المتطلب' }, { en: 'Allowed format', ar: 'الصيغة المقبولة' }] as Bi[],
    rows: [
      { item: { en: 'Language', ar: 'اللغة' }, req: { en: 'All mandatory particulars in Arabic', ar: 'كل البيانات الإلزامية بالعربية' }, fmt: { en: 'Arabic only, or Arabic + English with identical information', ar: 'عربي فقط، أو عربي + إنجليزي بالمعلومات نفسها' } },
      { item: { en: 'Product name', ar: 'اسم المنتج' }, req: { en: 'True descriptive name of the food', ar: 'الاسم الوصفي الحقيقي للغذاء' }, fmt: { en: 'Legal or common name next to the brand, in both languages', ar: 'الاسم القانوني أو الشائع إلى جانب العلامة، باللغتين' } },
      { item: { en: 'Ingredients', ar: 'المكوّنات' }, req: { en: 'Full list, descending by weight; additives by functional class + INS/E number', ar: 'قائمة كاملة تنازلياً حسب الوزن؛ المضافات بالفئة الوظيفية + رقم INS/E' }, fmt: { en: '"Ingredients: sugar, water, acidity regulator (citric acid E330) …"', ar: '«المكوّنات: سكر، ماء، منظم حموضة (حمض الستريك E330) …»' } },
      { item: { en: 'Allergens', ar: 'مسببات الحساسية' }, req: { en: 'Declared in the ingredients list and/or a "Contains" statement', ar: 'تُعلن في قائمة المكوّنات و/أو في عبارة «يحتوي على»' }, fmt: { en: '"Contains: milk, soy" / «يحتوي على: حليب، صويا»', ar: '«يحتوي على: حليب، صويا» / "Contains: milk, soy"' } },
      { item: { en: 'Net content', ar: 'المحتوى الصافي' }, req: { en: 'Metric units', ar: 'وحدات مترية' }, fmt: { en: 'g, kg, ml, L — e.g. 500 g / 500 غ', ar: 'غ، كغ، مل، لتر — مثال: 500 غ / 500 g' } },
      { item: { en: 'Country of origin', ar: 'بلد المنشأ' }, req: { en: 'Country where the food was produced', ar: 'البلد الذي أُنتج فيه الغذاء' }, fmt: { en: '"Product of Turkey" / «منتج تركيا»', ar: '«منتج تركيا» / "Product of Turkey"' } },
      { item: { en: 'Manufacturer & importer', ar: 'المصنّع والمستورد' }, req: { en: 'Name and address of manufacturer or packer; name and address of the UAE importer', ar: 'اسم وعنوان المصنّع أو المعبّئ؛ واسم وعنوان المستورد في الإمارات' }, fmt: { en: 'Text block; the importer line may sit on the over-sticker', ar: 'كتلة نصية؛ يجوز وضع سطر المستورد على الملصق الإضافي' } },
      { item: { en: 'Dates', ar: 'التواريخ' }, req: { en: 'Production and expiry (or best-before) dates', ar: 'تاريخ الإنتاج وتاريخ الانتهاء (أو الصلاحية)' }, fmt: { en: 'Printed or embossed by the manufacturer on the pack, unambiguous day/month/year — not on a sticker', ar: 'مطبوعة أو مختومة من المصنّع على العبوة بصيغة يوم/شهر/سنة واضحة — لا على ملصق' } },
      { item: { en: 'Storage', ar: 'التخزين' }, req: { en: 'Conditions that keep the food safe through its shelf life', ar: 'الظروف التي تحفظ سلامة الغذاء طوال مدة الصلاحية' }, fmt: { en: '"Store in a cool, dry place" / «يُحفظ في مكان بارد وجاف»', ar: '«يُحفظ في مكان بارد وجاف» / "Store in a cool, dry place"' } },
      { item: { en: 'Lot / batch', ar: 'التشغيلة / الدفعة' }, req: { en: 'Identification of the production lot', ar: 'تعريف تشغيلة الإنتاج' }, fmt: { en: 'Code printed on the pack ("Lot", "L", batch no.)', ar: 'رمز مطبوع على العبوة («Lot»، «L»، رقم الدفعة)' } },
      { item: { en: 'Nutrition', ar: 'البيان الغذائي' }, req: { en: 'Nutritional declaration', ar: 'إعلان القيم الغذائية' }, fmt: { en: 'Table per 100 g or 100 ml: energy, fat, saturates, carbohydrate, sugars, protein, salt/sodium', ar: 'جدول لكل 100 غ أو 100 مل: الطاقة، الدهون، المشبعة، الكربوهيدرات، السكريات، البروتين، الملح/الصوديوم' } },
      { item: { en: 'Legibility', ar: 'الوضوح' }, req: { en: 'Clear, indelible, not hidden by other text or graphics', ar: 'واضح، غير قابل للإزالة، غير محجوب بنص أو رسوم' }, fmt: { en: 'Arabic particulars at least as prominent as the same information in any other language', ar: 'البيانات العربية لا تقل بروزاً عن المعلومات نفسها بأي لغة أخرى' } },
    ],
  },

  trap: {
    h2: { en: 'The translation and localization trap', ar: 'فخ الترجمة والتوطين' },
    answer: {
      en: 'A literal or machine translation of an English label is the most common reason a food label fails registration in the UAE. The Arabic text must use the regulatory terminology the authority expects — not a dictionary equivalent.',
      ar: 'الترجمة الحرفية أو الآلية للملصق الإنجليزي هي السبب الأكثر شيوعاً لرفض الملصق الغذائي عند التسجيل في الإمارات. يجب أن يستخدم النص العربي المصطلحات التنظيمية التي تتوقعها الجهة — لا المرادف القاموسي.',
    },
    items: [
      { en: 'Additives: an E number alone is not enough. The functional class (preservative, acidity regulator, emulsifier) is expected in Arabic with the number, using the standard Arabic names.', ar: 'المضافات: رقم E وحده لا يكفي. المطلوب الفئة الوظيفية (مادة حافظة، منظم حموضة، مستحلب) بالعربية مع الرقم، بالأسماء العربية المعيارية.' },
      { en: 'Allergens: the declaration follows a fixed pattern ("Contains …" / "May contain traces of …"). Paraphrases and untranslated English allergen names are rejected.', ar: 'مسببات الحساسية: الإعلان بصيغة ثابتة («يحتوي على …» / «قد يحتوي على آثار …»). الصياغات الحرة وأسماء المسببات بالإنجليزية دون ترجمة تُرفض.' },
      { en: 'Product name: translating the brand slogan instead of the true name of the food leaves the mandatory name missing.', ar: 'اسم المنتج: ترجمة شعار العلامة بدل الاسم الحقيقي للغذاء تترك الاسم الإلزامي ناقصاً.' },
      { en: 'Units and dates: metric abbreviations and unambiguous date wording (production date / expiry date) — not "best by" transliterated.', ar: 'الوحدات والتواريخ: اختصارات مترية وعبارات تاريخ واضحة (تاريخ الإنتاج / تاريخ الانتهاء) — لا نقل حرفي لعبارة "best by".' },
      { en: 'Claims: "natural", "sugar-free", "halal" and "organic" each carry their own conditions. Translating a claim does not authorise it.', ar: 'الادعاءات: «طبيعي»، «خالٍ من السكر»، «حلال»، «عضوي» لكلٍّ منها شروطه. ترجمة الادعاء لا تجيزه.' },
      { en: 'Layout: Arabic reads right-to-left. A label built in a left-to-right template mixes lines and breaks the link between a value and its heading.', ar: 'التنسيق: العربية تُقرأ من اليمين إلى اليسار. الملصق المبني على قالب يساري يخلط الأسطر ويقطع الصلة بين القيمة وعنوانها.' },
    ],
  },

  helps: {
    h2: { en: 'Register first, then print — how Crate helps', ar: 'سجّل أولاً ثم اطبع — كيف تساعدك Crate' },
    answer: {
      en: 'Crate routes your product to the correct UAE registration path and gets the label right before a single sticker is printed — so you print once.',
      ar: 'توجّه Crate منتجك إلى مسار التسجيل الصحيح في الإمارات وتضبط الملصق قبل طباعة أي ملصق — لتطبع مرة واحدة.',
    },
    items: [
      { href: '/tools/product-registration-uae', title: { en: 'Product registration', ar: 'تسجيل المنتج' }, body: { en: 'Dubai Municipality (Montaji for cosmetics and supplements; FIRS for food, with the federal ZAD system) or ADAFSA in Abu Dhabi. Our Portal Router shows the authority, the portal, the official fees and the document list for your product.', ar: 'بلدية دبي (منتاجي لمستحضرات التجميل والمكملات؛ FIRS للأغذية مع نظام زاد الاتحادي) أو ADAFSA في أبوظبي. يُظهر موجّه البوابات الجهة والبوابة والرسوم الرسمية وقائمة المستندات لمنتجك.' }, link: { en: 'Product Registration Service', ar: 'خدمة تسجيل المنتج' } },
      { href: '/import', title: { en: 'Import and trading', ar: 'الاستيراد والتجارة' }, body: { en: 'HS code, customs duty, ECAS / EQM / halal certificates and landed cost per product, plus the trading section for market opportunities and licensed suppliers.', ar: 'رمز HS والرسوم الجمركية وشهادات ECAS / EQM / الحلال والتكلفة الواصلة لكل منتج، إضافة إلى قسم التجارة لفرص السوق والموردين المرخّصين.' }, link: { en: 'Import and Trading', ar: 'الاستيراد والتجارة' } },
      { href: '/compliance', title: { en: 'Free label pre-check', ar: 'فحص الملصق مجاناً' }, body: { en: 'The Dubai Municipality label pre-check reads a photo of your label and lists every UAE.S 9 gap at once — before you file.', ar: 'يقرأ فحص ملصق بلدية دبي صورة ملصقك ويعرض كل نواقص UAE.S 9 دفعة واحدة — قبل التقديم.' }, link: { en: 'Run the pre-check', ar: 'شغّل الفحص' } },
    ],
  },

  printing: {
    eyebrow: { en: 'Core service', ar: 'الخدمة الأساسية' },
    h2: { en: 'Arabic food label printing service', ar: 'خدمة طباعة الملصقات الغذائية العربية' },
    answer: {
      en: 'Crate prints compliant Arabic food labels: over-stickers for imported goods and full labels for local packers, cut to fit your existing packaging, on materials that hold up on the shelf, in the fridge and in the freezer.',
      ar: 'تطبع Crate ملصقات غذائية عربية مطابقة: ملصقات إضافية للبضائع المستوردة وملصقات كاملة للمعبّئين المحليين، مقصوصة على مقاس عبوتك الحالية، على خامات تصمد على الرف وفي الثلاجة والفريزر.',
    },
    cards: [
      { title: { en: 'Over-stickering for imported consignments', ar: 'ملصق إضافي للإرساليات المستوردة' }, body: { en: 'A compliant Arabic sticker applied over or beside the original label. It covers nothing mandatory and leaves the manufacturer’s production and expiry dates visible.', ar: 'ملصق عربي مطابق يُلصق فوق الملصق الأصلي أو بجانبه. لا يغطي أي بيان إلزامي ويُبقي تاريخي الإنتاج والانتهاء من المصنّع ظاهرين.' } },
      { title: { en: 'Materials for real storage conditions', ar: 'خامات لظروف التخزين الحقيقية' }, body: { en: 'Paper (matt or gloss) for dry ambient goods; PVC / vinyl for moisture, oil, chilled and freezer storage. The material is chosen for where the product actually lives.', ar: 'ورق (مطفي أو لامع) للسلع الجافة؛ PVC / فينيل للرطوبة والزيوت والتبريد والتجميد. تُختار الخامة بحسب المكان الذي يعيش فيه المنتج فعلاً.' } },
      { title: { en: 'Compliance-aware artwork', ar: 'تصميم واعٍ بالمطابقة' }, body: { en: 'The mandatory sections laid out in Arabic and English, legible sizes, right-to-left set correctly — generated by the same engine as our free pre-check.', ar: 'الأقسام الإلزامية مرتبة بالعربية والإنجليزية، بمقاسات مقروءة، وباتجاه صحيح من اليمين إلى اليسار — من المحرك نفسه الذي يشغّل فحصنا المجاني.' } },
      { title: { en: 'Custom sizes, short runs', ar: 'مقاسات مخصصة وكميات صغيرة' }, body: { en: 'Cut to size for jars, bottles, pouches and cartons. Short digital runs from 100 labels up to volume orders.', ar: 'قصّ على المقاس للبرطمانات والقوارير والأكياس والكراتين. كميات رقمية صغيرة من 100 ملصق وحتى الطلبات الكبيرة.' } },
      { title: { en: 'Speed when a shipment is waiting', ar: 'سرعة عندما تكون الشحنة بانتظارك' }, body: { en: 'Short-run digital production with rush handling for consignments held at customs. Turnaround is confirmed on your quote.', ar: 'إنتاج رقمي سريع مع معالجة مستعجلة للإرساليات المحجوزة في الجمارك. تُؤكَّد المدة في عرض السعر.' } },
      { title: { en: 'Registration-ready proof', ar: 'بروفة جاهزة للتسجيل' }, body: { en: 'A PDF proof of the label to attach to the FIRS or Montaji submission — so you print only after the label is accepted.', ar: 'بروفة PDF للملصق لإرفاقها بطلب FIRS أو منتاجي — لتطبع فقط بعد قبول الملصق.' } },
    ],
  },

  steps: {
    h2: { en: 'How it works', ar: 'كيف تتم العملية' },
    answer: {
      en: 'Four steps from your current label to compliant printed labels in hand.',
      ar: 'أربع خطوات من ملصقك الحالي إلى ملصقات مطبوعة مطابقة بين يديك.',
    },
    items: [
      { title: { en: 'Send artwork or product details', ar: 'أرسل التصميم أو بيانات المنتج' }, body: { en: 'A photo of the current label, the ingredient list, nutrition data and the importer details.', ar: 'صورة الملصق الحالي، وقائمة المكوّنات، والقيم الغذائية، وبيانات المستورد.' } },
      { title: { en: 'Compliance check and Arabic translation', ar: 'فحص المطابقة والترجمة العربية' }, body: { en: 'We run the UAE.S 9 pre-check, translate with regulatory terminology and return a proof.', ar: 'نجري فحص UAE.S 9، ونترجم بالمصطلحات التنظيمية، ونعيد إليك بروفة.' } },
      { title: { en: 'Register with the proof (optional)', ar: 'سجّل بالبروفة (اختياري)' }, body: { en: 'File with Dubai Municipality, ZAD or ADAFSA using the proof; print only after acceptance.', ar: 'قدّم لدى بلدية دبي أو زاد أو ADAFSA بالبروفة؛ واطبع فقط بعد القبول.' } },
      { title: { en: 'Print production and delivery', ar: 'الطباعة والتسليم' }, body: { en: 'Digital short-run production, cut to size, delivered in the UAE.', ar: 'إنتاج رقمي قصير المدى، مقصوص على المقاس، يُسلَّم داخل الإمارات.' } },
    ],
  },

  faq: {
    h2: { en: 'Frequently asked questions', ar: 'الأسئلة الشائعة' },
    items: [
      { q: { en: 'Can I put an Arabic sticker over the original packaging?', ar: 'هل يمكنني وضع ملصق عربي فوق العبوة الأصلية؟' }, a: { en: 'Yes. An over-sticker is accepted when it is firmly affixed, legible and covers no mandatory information on the original pack. The manufacturer’s production and expiry dates must stay visible; they may not be replaced by a sticker.', ar: 'نعم. يُقبل الملصق الإضافي إذا كان ثابتاً ومقروءاً ولا يغطي أي بيان إلزامي على العبوة الأصلية. ويجب أن يبقى تاريخا الإنتاج والانتهاء من المصنّع ظاهرين؛ ولا يجوز استبدالهما بملصق.' } },
      { q: { en: 'What happens if the allergens are not in Arabic?', ar: 'ماذا يحدث إذا لم تكن مسببات الحساسية بالعربية؟' }, a: { en: 'The label is non-compliant. Allergen declaration is a mandatory GSO 9 particular and must appear in Arabic; the product will not pass registration until it is corrected, and consignments can be held at the port of entry.', ar: 'يكون الملصق غير مطابق. إعلان مسببات الحساسية بيان إلزامي في GSO 9 ويجب أن يظهر بالعربية؛ لن يجتاز المنتج التسجيل حتى يُصحَّح، ويمكن حجز الإرساليات في منفذ الدخول.' } },
      { q: { en: 'Is GSO 9 valid across the GCC?', ar: 'هل GSO 9 سارية في كل دول الخليج؟' }, a: { en: 'GSO 9 is a Gulf standard adopted by the GCC member states, each through its own national adoption (UAE.S GSO 9 in the UAE). Additional national rules can apply in each country, so check the destination market’s adoption as well.', ar: 'GSO 9 مواصفة خليجية تعتمدها دول مجلس التعاون، كل دولة عبر اعتمادها الوطني (UAE.S GSO 9 في الإمارات). وقد تنطبق قواعد وطنية إضافية في كل دولة، فتحقق من اعتماد سوق الوجهة أيضاً.' } },
      { q: { en: 'Does the Arabic text have to be as large as the English?', ar: 'هل يجب أن يكون النص العربي بحجم النص الإنجليزي؟' }, a: { en: 'Arabic is the mandatory language; other languages are optional additions. The Arabic particulars must be clearly legible and not less prominent than the same information in another language.', ar: 'العربية هي اللغة الإلزامية؛ واللغات الأخرى إضافات اختيارية. يجب أن تكون البيانات العربية مقروءة بوضوح ولا تقل بروزاً عن المعلومات نفسها بلغة أخرى.' } },
      { q: { en: 'Is a nutrition table mandatory?', ar: 'هل جدول القيم الغذائية إلزامي؟' }, a: { en: 'Yes. Prepackaged foods sold in the UAE carry a nutritional declaration expressed per 100 g or 100 ml; per-serving values may be added. Our nutrition calculator produces a submission-ready table.', ar: 'نعم. تحمل الأغذية المعبأة في الإمارات بياناً غذائياً لكل 100 غ أو 100 مل؛ ويمكن إضافة القيم لكل حصة. تُنتج حاسبة القيم الغذائية لدينا جدولاً جاهزاً للتقديم.' } },
      { q: { en: 'Should I print the labels before or after registration?', ar: 'هل أطبع الملصقات قبل التسجيل أم بعده؟' }, a: { en: 'After. Registration is assessed on the label artwork, so print once the label is accepted and a correction never costs a reprint.', ar: 'بعده. يُقيَّم التسجيل على تصميم الملصق، فاطبع بعد قبول الملصق حتى لا يكلّفك أي تصحيح إعادة طباعة.' } },
      { q: { en: 'Can Crate translate an existing English label?', ar: 'هل تترجم Crate ملصقاً إنجليزياً قائماً؟' }, a: { en: 'Yes. We translate and re-set the label with regulatory terminology, then run it through the same pre-check that mirrors the authority’s requirements.', ar: 'نعم. نترجم الملصق ونعيد تنسيقه بالمصطلحات التنظيمية، ثم نمرّره في الفحص نفسه الذي يحاكي متطلبات الجهة.' } },
      { q: { en: 'What is the minimum order, and how fast is delivery?', ar: 'ما الحد الأدنى للطلب، وكم تستغرق مدة التسليم؟' }, a: { en: 'Short digital runs with no large minimum — from 100 labels — and a turnaround confirmed on your quote. Rush production is available for consignments waiting at customs.', ar: 'كميات رقمية صغيرة بلا حد أدنى كبير — من 100 ملصق — ومدة تُؤكَّد في عرض السعر. ويتوفر إنتاج مستعجل للإرساليات المنتظرة في الجمارك.' } },
    ],
  },

  final: {
    h2: { en: 'Get your Arabic food label right the first time', ar: 'اضبط ملصقك الغذائي العربي من المرة الأولى' },
    body: {
      en: 'Send us the label you have, or the product data you have, and we return a compliant proof and a printing quote. Registration support is available for products that are not yet filed.',
      ar: 'أرسل لنا الملصق الذي لديك أو بيانات المنتج، ونعيد إليك بروفة مطابقة وعرض سعر للطباعة. ويتوفر دعم التسجيل للمنتجات التي لم تُقدَّم بعد.',
    },
  },

  figure: {
    caption: {
      en: 'Anatomy of a compliant Arabic food label, rendered by the same generator behind our free pre-check (sample data). Dates stay printed on the original pack.',
      ar: 'تشريح ملصق غذائي عربي مطابق، من المولّد نفسه الذي يشغّل فحصنا المجاني (بيانات نموذجية). تبقى التواريخ مطبوعة على العبوة الأصلية.',
    },
    alt: { en: 'Sample bilingual Arabic-English food label laid out to GSO 9 with product name, ingredients, allergens, nutrition table, storage, origin and importer', ar: 'ملصق غذائي نموذجي ثنائي اللغة وفق GSO 9 يعرض اسم المنتج والمكوّنات ومسببات الحساسية وجدول القيم الغذائية والتخزين والمنشأ والمستورد' },
  },

  sourcesLabel: { en: 'Sources and standards', ar: 'المصادر والمواصفات' },
  reviewed: { en: 'Last reviewed', ar: 'آخر مراجعة' },
  sources: [
    { label: 'GSO — Gulf Standardization Organization (GSO 9, labelling of prepackaged foodstuffs)', url: 'https://www.gso.org.sa/' },
    { label: 'MoIAT — Ministry of Industry and Advanced Technology (UAE standards, formerly ESMA)', url: 'https://moiat.gov.ae/' },
    { label: 'Dubai Municipality — food import and registration (FIRS)', url: 'https://www.dm.gov.ae/' },
    { label: 'ADAFSA — Abu Dhabi Agriculture and Food Safety Authority', url: 'https://www.adafsa.gov.ae/' },
    { label: 'MOCCAE — Ministry of Climate Change and Environment (ZAD food registration)', url: 'https://www.moccae.gov.ae/' },
  ],
}

/** Sample data for the rendered label figure — clearly marked as an example on the page. */
export const GSO9_SAMPLE_LABEL = {
  product_name: 'Mango Nectar 1 L',
  product_name_ar: 'نكتار المانجو 1 لتر',
  net_content: '1 L / 1 لتر',
  country_of_origin: 'Product of Turkey',
  origin_ar: 'منتج تركيا / Product of Turkey',
  ingredients_ar: 'المكوّنات: ماء، لب مانجو 25%، سكر، منظم حموضة (حمض الستريك E330)، مضاد أكسدة (حمض الأسكوربيك E300). يحتوي على: لا يوجد من مسببات الحساسية الرئيسية. Ingredients: water, mango pulp 25%, sugar, acidity regulator (citric acid E330), antioxidant (ascorbic acid E300).',
  storage: 'يُحفظ في مكان بارد وجاف · Store in a cool, dry place',
  production_date: 'مطبوع على العبوة · printed on pack',
  expiry_date: 'مطبوع على العبوة · printed on pack',
  importer: 'المستورد: [اسم الشركة] ذ.م.م، دبي، الإمارات · Imported by: [Company] L.L.C, Dubai, UAE',
  nutrition: {
    columns: ['Per 100 ml / لكل 100 مل'],
    rows: [
      { label: 'Energy / الطاقة', values: ['52 kcal / 220 kJ'] },
      { label: 'Fat / الدهون', values: ['0 g'] },
      { label: 'Carbohydrate / الكربوهيدرات', values: ['12.5 g'] },
      { label: 'of which sugars / منها سكريات', values: ['12 g'] },
      { label: 'Protein / البروتين', values: ['0.2 g'] },
      { label: 'Salt / الملح', values: ['0.01 g'] },
    ],
  },
}
