/**
 * UAE FMCG KEYWORD BANK — the discovery organism's food supply.
 *
 * The old seed list was ~32 static terms; discovery re-scanned the same terms
 * every run and filtered out catalog matches, so it starved after a few beats.
 *
 * This bank is:
 *   1. CATEGORY-PARTITIONED — ~240 real "<product> UAE" search terms that FMCG
 *      importers/retailers actually type, grouped by commercial category.
 *   2. BILINGUAL — every term carries a native Arabic gloss so sense() can
 *      backfill `keyword_ar` / `title_ar` (platform bilingual rule + a real
 *      quality-gate signal, since estimateQuality() rewards title_ar).
 *   3. ROTATABLE — see `rotatingWindow()` in engine.ts: each daily beat scans a
 *      different deterministic slice (by day-of-year), so the organism keeps
 *      sensing NEW terms instead of the same 32 forever.
 *   4. EXPANDABLE — `adjacentTermsForCategory()` lets the learning loop grow the
 *      pool from the categories of won/converting opportunities.
 *
 * NOTE ON LANGUAGE: these are INTERNAL commercial keywords. Nothing here is a
 * banned PUBLIC term. Category labels mirror `guessFMCGCategory()` in engine.ts.
 */

export interface SeedTerm {
  /** English search term, always suffixed " UAE" for geo intent. */
  en: string
  /** Native Arabic gloss (no " UAE" suffix — used for title_ar backfill). */
  ar: string
  /** Commercial category — must align with guessFMCGCategory() buckets. */
  category: string
}

/**
 * The bank, partitioned by category. Real brands + generics that importers
 * search for UAE sourcing. Kept as one flat array of typed rows so the rotation
 * window and category filters stay simple.
 */
export const FMCG_KEYWORD_BANK: SeedTerm[] = [
  // ─── Beverages: energy / functional ─────────────────────────────────────────
  { en: 'energy drink UAE', ar: 'مشروب طاقة', category: 'Beverages' },
  { en: 'red bull sugarfree UAE', ar: 'ريد بول خالي السكر', category: 'Beverages' },
  { en: 'monster energy UAE', ar: 'مونستر للطاقة', category: 'Beverages' },
  { en: 'celsius energy drink UAE', ar: 'مشروب سيلسيوس للطاقة', category: 'Beverages' },
  { en: 'prime hydration UAE', ar: 'برايم للترطيب', category: 'Beverages' },
  { en: 'gatorade UAE', ar: 'جاتوريد', category: 'Beverages' },
  { en: 'electrolyte drink UAE', ar: 'مشروب الإلكتروليت', category: 'Beverages' },
  { en: 'protein shake UAE', ar: 'مخفوق البروتين', category: 'Beverages' },
  { en: 'protein water UAE', ar: 'ماء البروتين', category: 'Beverages' },
  { en: 'kombucha UAE', ar: 'كمبوتشا', category: 'Beverages' },
  // ─── Beverages: soft / carbonated / juice ────────────────────────────────────
  { en: 'sparkling water UAE', ar: 'مياه فوارة', category: 'Beverages' },
  { en: 'san pellegrino UAE', ar: 'سان بيليجرينو', category: 'Beverages' },
  { en: 'grape drink UAE', ar: 'مشروب العنب', category: 'Beverages' },
  { en: 'vimto UAE', ar: 'فيمتو', category: 'Beverages' },
  { en: 'coconut water UAE', ar: 'ماء جوز الهند', category: 'Beverages' },
  { en: 'aloe vera drink UAE', ar: 'مشروب الصبار', category: 'Beverages' },
  { en: 'iced tea UAE', ar: 'شاي مثلج', category: 'Beverages' },
  { en: 'lemonade UAE', ar: 'عصير الليمون', category: 'Beverages' },
  { en: 'pomegranate juice UAE', ar: 'عصير الرمان', category: 'Beverages' },
  { en: 'cranberry juice UAE', ar: 'عصير التوت البري', category: 'Beverages' },
  { en: 'tamarind drink UAE', ar: 'مشروب التمر هندي', category: 'Beverages' },
  { en: 'ginger shot UAE', ar: 'جرعة الزنجبيل', category: 'Beverages' },
  { en: 'sports drink UAE', ar: 'مشروب رياضي', category: 'Beverages' },
  { en: 'non alcoholic beer UAE', ar: 'بيرة خالية من الكحول', category: 'Beverages' },
  { en: 'flavored water UAE', ar: 'مياه بنكهة', category: 'Beverages' },

  // ─── Coffee ─────────────────────────────────────────────────────────────────
  { en: 'cold brew coffee UAE', ar: 'قهوة كولد برو', category: 'Beverages' },
  { en: 'nescafe gold UAE', ar: 'نسكافيه جولد', category: 'Beverages' },
  { en: 'instant coffee UAE', ar: 'قهوة سريعة التحضير', category: 'Beverages' },
  { en: 'coffee capsules UAE', ar: 'كبسولات قهوة', category: 'Beverages' },
  { en: 'nespresso pods UAE', ar: 'كبسولات نسبريسو', category: 'Beverages' },
  { en: 'lavazza coffee UAE', ar: 'قهوة لافازا', category: 'Beverages' },
  { en: 'arabic coffee UAE', ar: 'قهوة عربية', category: 'Beverages' },
  { en: 'turkish coffee UAE', ar: 'قهوة تركية', category: 'Beverages' },
  { en: 'espresso beans UAE', ar: 'حبوب اسبريسو', category: 'Beverages' },
  { en: 'decaf coffee UAE', ar: 'قهوة منزوعة الكافيين', category: 'Beverages' },
  { en: 'matcha powder UAE', ar: 'مسحوق الماتشا', category: 'Beverages' },
  { en: 'green tea UAE', ar: 'شاي أخضر', category: 'Beverages' },
  { en: 'herbal tea UAE', ar: 'شاي أعشاب', category: 'Beverages' },
  { en: 'chamomile tea UAE', ar: 'شاي البابونج', category: 'Beverages' },

  // ─── Dairy & plant-based alternatives ────────────────────────────────────────
  { en: 'oat milk UAE', ar: 'حليب الشوفان', category: 'Dairy Products' },
  { en: 'almond milk UAE', ar: 'حليب اللوز', category: 'Dairy Products' },
  { en: 'soy milk UAE', ar: 'حليب الصويا', category: 'Dairy Products' },
  { en: 'coconut milk UAE', ar: 'حليب جوز الهند', category: 'Dairy Products' },
  { en: 'lactose free milk UAE', ar: 'حليب خالي اللاكتوز', category: 'Dairy Products' },
  { en: 'a2 milk UAE', ar: 'حليب A2', category: 'Dairy Products' },
  { en: 'greek yogurt UAE', ar: 'زبادي يوناني', category: 'Dairy Products' },
  { en: 'plant based yogurt UAE', ar: 'زبادي نباتي', category: 'Dairy Products' },
  { en: 'skyr yogurt UAE', ar: 'زبادي سكير', category: 'Dairy Products' },
  { en: 'labneh UAE', ar: 'لبنة', category: 'Dairy Products' },
  { en: 'vegan cheese UAE', ar: 'جبن نباتي', category: 'Dairy Products' },
  { en: 'mozzarella cheese UAE', ar: 'جبن موزاريلا', category: 'Dairy Products' },
  { en: 'feta cheese UAE', ar: 'جبن فيتا', category: 'Dairy Products' },
  { en: 'cheddar cheese UAE', ar: 'جبن شيدر', category: 'Dairy Products' },
  { en: 'cream cheese UAE', ar: 'جبن كريمي', category: 'Dairy Products' },
  { en: 'ghee UAE', ar: 'سمن', category: 'Dairy Products' },
  { en: 'butter UAE', ar: 'زبدة', category: 'Dairy Products' },
  { en: 'whipping cream UAE', ar: 'كريمة الخفق', category: 'Dairy Products' },
  { en: 'condensed milk UAE', ar: 'حليب مكثف', category: 'Dairy Products' },
  { en: 'evaporated milk UAE', ar: 'حليب مبخر', category: 'Dairy Products' },

  // ─── Snacks & confectionery ──────────────────────────────────────────────────
  { en: 'protein bar UAE', ar: 'لوح البروتين', category: 'Snacks & Confectionery' },
  { en: 'granola bar UAE', ar: 'لوح الجرانولا', category: 'Snacks & Confectionery' },
  { en: 'rice cake UAE', ar: 'كعك الأرز', category: 'Snacks & Confectionery' },
  { en: 'seaweed snack UAE', ar: 'وجبة أعشاب بحرية', category: 'Snacks & Confectionery' },
  { en: 'dark chocolate UAE', ar: 'شوكولاتة داكنة', category: 'Snacks & Confectionery' },
  { en: 'sugar free chocolate UAE', ar: 'شوكولاتة خالية من السكر', category: 'Snacks & Confectionery' },
  { en: 'lindt chocolate UAE', ar: 'شوكولاتة ليندت', category: 'Snacks & Confectionery' },
  { en: 'ferrero rocher UAE', ar: 'فيريرو روشيه', category: 'Snacks & Confectionery' },
  { en: 'trail mix UAE', ar: 'خليط المكسرات', category: 'Snacks & Confectionery' },
  { en: 'popcorn UAE', ar: 'فشار', category: 'Snacks & Confectionery' },
  { en: 'beef jerky UAE', ar: 'لحم مجفف', category: 'Snacks & Confectionery' },
  { en: 'potato chips UAE', ar: 'رقائق البطاطس', category: 'Snacks & Confectionery' },
  { en: 'pringles UAE', ar: 'برينجلز', category: 'Snacks & Confectionery' },
  { en: 'tortilla chips UAE', ar: 'رقائق التورتيلا', category: 'Snacks & Confectionery' },
  { en: 'pretzels UAE', ar: 'بريتزل', category: 'Snacks & Confectionery' },
  { en: 'crackers UAE', ar: 'مقرمشات', category: 'Snacks & Confectionery' },
  { en: 'digestive biscuits UAE', ar: 'بسكويت دايجستف', category: 'Snacks & Confectionery' },
  { en: 'oreo UAE', ar: 'أوريو', category: 'Snacks & Confectionery' },
  { en: 'wafer biscuits UAE', ar: 'بسكويت ويفر', category: 'Snacks & Confectionery' },
  { en: 'gummy candy UAE', ar: 'حلوى الجيلي', category: 'Snacks & Confectionery' },
  { en: 'haribo UAE', ar: 'هاريبو', category: 'Snacks & Confectionery' },
  { en: 'dates snack UAE', ar: 'وجبة التمر', category: 'Snacks & Confectionery' },
  { en: 'dried mango UAE', ar: 'مانجو مجفف', category: 'Snacks & Confectionery' },
  { en: 'roasted chickpeas UAE', ar: 'حمص محمص', category: 'Snacks & Confectionery' },
  { en: 'cashews UAE', ar: 'كاجو', category: 'Snacks & Confectionery' },
  { en: 'pistachios UAE', ar: 'فستق', category: 'Snacks & Confectionery' },
  { en: 'macadamia nuts UAE', ar: 'مكاديميا', category: 'Snacks & Confectionery' },

  // ─── Oils & fats ─────────────────────────────────────────────────────────────
  { en: 'extra virgin olive oil UAE', ar: 'زيت زيتون بكر ممتاز', category: 'Oils & Fats' },
  { en: 'avocado oil UAE', ar: 'زيت الأفوكادو', category: 'Oils & Fats' },
  { en: 'coconut oil UAE', ar: 'زيت جوز الهند', category: 'Oils & Fats' },
  { en: 'sunflower oil UAE', ar: 'زيت عباد الشمس', category: 'Oils & Fats' },
  { en: 'canola oil UAE', ar: 'زيت الكانولا', category: 'Oils & Fats' },
  { en: 'sesame oil UAE', ar: 'زيت السمسم', category: 'Oils & Fats' },
  { en: 'truffle oil UAE', ar: 'زيت الكمأة', category: 'Oils & Fats' },
  { en: 'mct oil UAE', ar: 'زيت MCT', category: 'Oils & Fats' },
  { en: 'ghee clarified butter UAE', ar: 'سمن مصفى', category: 'Oils & Fats' },
  { en: 'palm oil UAE', ar: 'زيت النخيل', category: 'Oils & Fats' },
  { en: 'corn oil UAE', ar: 'زيت الذرة', category: 'Oils & Fats' },
  { en: 'vegetable ghee UAE', ar: 'سمن نباتي', category: 'Oils & Fats' },

  // ─── Condiments, spices & sauces ─────────────────────────────────────────────
  { en: 'hot sauce UAE', ar: 'صلصة حارة', category: 'Spices & Sauces' },
  { en: 'sriracha UAE', ar: 'سريراتشا', category: 'Spices & Sauces' },
  { en: 'tahini UAE', ar: 'طحينة', category: 'Spices & Sauces' },
  { en: 'soy sauce UAE', ar: 'صلصة الصويا', category: 'Spices & Sauces' },
  { en: 'oyster sauce UAE', ar: 'صلصة المحار', category: 'Spices & Sauces' },
  { en: 'teriyaki sauce UAE', ar: 'صلصة الترياكي', category: 'Spices & Sauces' },
  { en: 'fish sauce UAE', ar: 'صلصة السمك', category: 'Spices & Sauces' },
  { en: 'gochujang UAE', ar: 'جوجوجانج', category: 'Spices & Sauces' },
  { en: 'pesto sauce UAE', ar: 'صلصة البيستو', category: 'Spices & Sauces' },
  { en: 'salsa UAE', ar: 'صلصة السالسا', category: 'Spices & Sauces' },
  { en: 'bbq sauce UAE', ar: 'صلصة الباربكيو', category: 'Spices & Sauces' },
  { en: 'mayonnaise UAE', ar: 'مايونيز', category: 'Spices & Sauces' },
  { en: 'mustard UAE', ar: 'خردل', category: 'Spices & Sauces' },
  { en: 'ketchup UAE', ar: 'كاتشب', category: 'Spices & Sauces' },
  { en: 'tomato paste UAE', ar: 'معجون الطماطم', category: 'Spices & Sauces' },
  { en: 'balsamic vinegar UAE', ar: 'خل البلسميك', category: 'Spices & Sauces' },
  { en: 'apple cider vinegar UAE', ar: 'خل التفاح', category: 'Spices & Sauces' },
  { en: 'curry paste UAE', ar: 'معجون الكاري', category: 'Spices & Sauces' },
  { en: 'harissa UAE', ar: 'هريسة', category: 'Spices & Sauces' },
  { en: 'zaatar UAE', ar: 'زعتر', category: 'Spices & Sauces' },
  { en: 'sumac UAE', ar: 'سماق', category: 'Spices & Sauces' },
  { en: 'saffron UAE', ar: 'زعفران', category: 'Spices & Sauces' },
  { en: 'paprika UAE', ar: 'بابريكا', category: 'Spices & Sauces' },
  { en: 'himalayan salt UAE', ar: 'ملح الهيمالايا', category: 'Spices & Sauces' },
  { en: 'black garlic UAE', ar: 'ثوم أسود', category: 'Spices & Sauces' },

  // ─── Cereals, grains & pasta ─────────────────────────────────────────────────
  { en: 'italian pasta UAE', ar: 'معكرونة إيطالية', category: 'Cereals & Products' },
  { en: 'penne pasta UAE', ar: 'معكرونة بيني', category: 'Cereals & Products' },
  { en: 'lasagna sheets UAE', ar: 'شرائح اللازانيا', category: 'Cereals & Products' },
  { en: 'basmati rice UAE', ar: 'أرز بسمتي', category: 'Cereals & Products' },
  { en: 'jasmine rice UAE', ar: 'أرز الياسمين', category: 'Cereals & Products' },
  { en: 'brown rice UAE', ar: 'أرز بني', category: 'Cereals & Products' },
  { en: 'sushi rice UAE', ar: 'أرز السوشي', category: 'Cereals & Products' },
  { en: 'quinoa UAE', ar: 'كينوا', category: 'Cereals & Products' },
  { en: 'couscous UAE', ar: 'كسكس', category: 'Cereals & Products' },
  { en: 'bulgur UAE', ar: 'برغل', category: 'Cereals & Products' },
  { en: 'oats UAE', ar: 'شوفان', category: 'Cereals & Products' },
  { en: 'rolled oats UAE', ar: 'شوفان ملفوف', category: 'Cereals & Products' },
  { en: 'granola UAE', ar: 'جرانولا', category: 'Cereals & Products' },
  { en: 'muesli UAE', ar: 'موسلي', category: 'Cereals & Products' },
  { en: 'cornflakes UAE', ar: 'رقائق الذرة', category: 'Cereals & Products' },
  { en: 'ramen noodles UAE', ar: 'نودلز رامن', category: 'Cereals & Products' },
  { en: 'rice noodles UAE', ar: 'نودلز الأرز', category: 'Cereals & Products' },
  { en: 'vermicelli UAE', ar: 'شعيرية', category: 'Cereals & Products' },
  { en: 'all purpose flour UAE', ar: 'دقيق متعدد الاستخدامات', category: 'Cereals & Products' },
  { en: 'almond flour UAE', ar: 'دقيق اللوز', category: 'Cereals & Products' },
  { en: 'chickpea flour UAE', ar: 'دقيق الحمص', category: 'Cereals & Products' },
  { en: 'semolina UAE', ar: 'سميد', category: 'Cereals & Products' },

  // ─── Health, organic & specialty ─────────────────────────────────────────────
  { en: 'chia seeds UAE', ar: 'بذور الشيا', category: 'Health & Organic' },
  { en: 'flaxseed UAE', ar: 'بذور الكتان', category: 'Health & Organic' },
  { en: 'hemp seeds UAE', ar: 'بذور القنب', category: 'Health & Organic' },
  { en: 'pumpkin seeds UAE', ar: 'بذور اليقطين', category: 'Health & Organic' },
  { en: 'nut butter UAE', ar: 'زبدة المكسرات', category: 'Health & Organic' },
  { en: 'peanut butter UAE', ar: 'زبدة الفول السوداني', category: 'Health & Organic' },
  { en: 'almond butter UAE', ar: 'زبدة اللوز', category: 'Health & Organic' },
  { en: 'whey protein UAE', ar: 'بروتين مصل اللبن', category: 'Health & Organic' },
  { en: 'plant protein powder UAE', ar: 'مسحوق البروتين النباتي', category: 'Health & Organic' },
  { en: 'collagen powder UAE', ar: 'مسحوق الكولاجين', category: 'Health & Organic' },
  { en: 'spirulina UAE', ar: 'سبيرولينا', category: 'Health & Organic' },
  { en: 'moringa powder UAE', ar: 'مسحوق المورينجا', category: 'Health & Organic' },
  { en: 'manuka honey UAE', ar: 'عسل المانوكا', category: 'Health & Organic' },
  { en: 'raw honey UAE', ar: 'عسل خام', category: 'Health & Organic' },
  { en: 'maple syrup UAE', ar: 'شراب القيقب', category: 'Health & Organic' },
  { en: 'agave syrup UAE', ar: 'شراب الأغاف', category: 'Health & Organic' },
  { en: 'stevia UAE', ar: 'ستيفيا', category: 'Health & Organic' },
  { en: 'monk fruit sweetener UAE', ar: 'محلي فاكهة الراهب', category: 'Health & Organic' },
  { en: 'apple cider vinegar gummies UAE', ar: 'حلوى خل التفاح', category: 'Health & Organic' },
  { en: 'gluten free bread UAE', ar: 'خبز خالي الغلوتين', category: 'Health & Organic' },
  { en: 'keto snacks UAE', ar: 'وجبات كيتو', category: 'Health & Organic' },
  { en: 'vegan protein bar UAE', ar: 'لوح بروتين نباتي', category: 'Health & Organic' },
  { en: 'organic baby food UAE', ar: 'طعام أطفال عضوي', category: 'Health & Organic' },
  { en: 'electrolyte powder UAE', ar: 'مسحوق الإلكتروليت', category: 'Health & Organic' },
  { en: 'psyllium husk UAE', ar: 'قشور السيلليوم', category: 'Health & Organic' },
  { en: 'coconut sugar UAE', ar: 'سكر جوز الهند', category: 'Health & Organic' },
  { en: 'nutritional yeast UAE', ar: 'خميرة غذائية', category: 'Health & Organic' },
  { en: 'bone broth UAE', ar: 'مرق العظام', category: 'Health & Organic' },

  // ─── World / ethnic foods (importer high-intent) ─────────────────────────────
  { en: 'korean food UAE', ar: 'طعام كوري', category: 'General FMCG' },
  { en: 'japanese snacks UAE', ar: 'وجبات يابانية', category: 'General FMCG' },
  { en: 'kimchi UAE', ar: 'كيمتشي', category: 'General FMCG' },
  { en: 'miso paste UAE', ar: 'معجون الميسو', category: 'General FMCG' },
  { en: 'nori sheets UAE', ar: 'أوراق النوري', category: 'General FMCG' },
  { en: 'wasabi UAE', ar: 'واسابي', category: 'General FMCG' },
  { en: 'mexican sauce UAE', ar: 'صلصة مكسيكية', category: 'General FMCG' },
  { en: 'taco shells UAE', ar: 'قشور التاكو', category: 'General FMCG' },
  { en: 'indian spices UAE', ar: 'بهارات هندية', category: 'General FMCG' },
  { en: 'thai curry UAE', ar: 'كاري تايلاندي', category: 'General FMCG' },
  { en: 'coconut cream UAE', ar: 'كريمة جوز الهند', category: 'General FMCG' },
  { en: 'canned tuna UAE', ar: 'تونة معلبة', category: 'General FMCG' },
  { en: 'canned chickpeas UAE', ar: 'حمص معلب', category: 'General FMCG' },
  { en: 'canned beans UAE', ar: 'فاصوليا معلبة', category: 'General FMCG' },
  { en: 'olives jar UAE', ar: 'زيتون معلب', category: 'General FMCG' },
  { en: 'sun dried tomatoes UAE', ar: 'طماطم مجففة', category: 'General FMCG' },
  { en: 'pickles UAE', ar: 'مخللات', category: 'General FMCG' },
  { en: 'jam spread UAE', ar: 'مربى', category: 'General FMCG' },
  { en: 'baking cocoa powder UAE', ar: 'مسحوق الكاكاو', category: 'General FMCG' },
  { en: 'vanilla extract UAE', ar: 'خلاصة الفانيليا', category: 'General FMCG' },
]

/**
 * Adjacency map: for a winning category, generate NEW same-category search terms
 * the bank may not already contain. Used by the learning loop to bias discovery
 * toward categories that convert. Kept generic so it never emits a banned term.
 */
const CATEGORY_ADJACENTS: Record<string, string[]> = {
  'Beverages': [
    'functional drink UAE', 'prebiotic soda UAE', 'yerba mate UAE', 'hibiscus drink UAE',
    'barley water UAE', 'cold pressed juice UAE', 'oat latte UAE', 'chai latte UAE',
  ],
  'Dairy Products': [
    'kefir UAE', 'quark cheese UAE', 'burrata UAE', 'mascarpone UAE',
    'clotted cream UAE', 'goat cheese UAE', 'ricotta UAE', 'halloumi UAE',
  ],
  'Snacks & Confectionery': [
    'protein cookies UAE', 'freeze dried fruit UAE', 'veggie chips UAE', 'lentil chips UAE',
    'dark chocolate almonds UAE', 'turkish delight UAE', 'baklava UAE', 'energy bites UAE',
  ],
  'Oils & Fats': [
    'walnut oil UAE', 'flaxseed oil UAE', 'grapeseed oil UAE', 'red palm oil UAE',
    'cold pressed coconut oil UAE', 'infused olive oil UAE',
  ],
  'Spices & Sauces': [
    'chili crisp UAE', 'peri peri sauce UAE', 'chimichurri UAE', 'aioli UAE',
    'dukkah UAE', 'ras el hanout UAE', 'garam masala UAE', 'ponzu sauce UAE',
  ],
  'Cereals & Products': [
    'buckwheat UAE', 'freekeh UAE', 'spelt pasta UAE', 'red lentil pasta UAE',
    'overnight oats UAE', 'protein granola UAE', 'gnocchi UAE',
  ],
  'Health & Organic': [
    'acai powder UAE', 'maca powder UAE', 'cacao nibs UAE', 'goji berries UAE',
    'tart cherry juice UAE', 'sea moss gel UAE', 'greens powder UAE', 'lions mane UAE',
  ],
  'General FMCG': [
    'ramen kit UAE', 'dumpling wrappers UAE', 'panko breadcrumbs UAE', 'rice paper UAE',
    'jackfruit canned UAE', 'palm hearts UAE', 'capers UAE',
  ],
}

/** All English seed terms (with " UAE") — the flat pool for rotation windows. */
export function allSeedTerms(): SeedTerm[] {
  return FMCG_KEYWORD_BANK
}

/**
 * Arabic gloss for an English seed term (case/space tolerant). Returns null when
 * the term is not in the bank (e.g. a learning-loop adjacent term), so callers
 * can still store the row with keyword_ar = null.
 */
export function arabicGlossFor(termEn: string): string | null {
  const key = termEn.trim().toLowerCase()
  const hit = FMCG_KEYWORD_BANK.find(t => t.en.toLowerCase() === key)
  return hit?.ar ?? null
}

/**
 * Same-category adjacent terms for seed-expansion from won/converting categories.
 * Returns [] for an unknown category. Never emits a term already in the bank.
 */
export function adjacentTermsForCategory(category: string | null): string[] {
  if (!category) return []
  const pool = CATEGORY_ADJACENTS[category] ?? []
  if (pool.length === 0) return []
  const existing = new Set(FMCG_KEYWORD_BANK.map(t => t.en.toLowerCase()))
  return pool.filter(t => !existing.has(t.toLowerCase()))
}
