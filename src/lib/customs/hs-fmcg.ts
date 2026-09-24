/**
 * Curated FMCG slice of the GCC unified tariff (HS 2022 headings), for the landed-cost
 * calculator. Not the full tariff: ~100 headings importers actually meet. Duty follows
 * the GCC standard (5% of CIF) with the commonly published food-security exemptions
 * (live animals, meat, seafood, vegetables, fruits, coffee, grains, seeds = 0%);
 * headings whose exemption varies by tariff line are flagged `verify`.
 * Alcohol 50%, tobacco 100%. Excise class drives the 2026 excise rules.
 * Review date 2026-09-24 — confirm the exact 8-digit line on the Dubai Customs tariff.
 */
export type Duty = 0 | 5 | 50 | 100 | 'verify'
export type Excise = 'none' | 'sweet' | 'energy' | 'tobacco'
export interface HsEntry { code: string; en: string; ar: string; duty: Duty; excise?: Excise; note?: string }

export const HS_FMCG: HsEntry[] = [
  // Ch 02 meat
  { code: '0201', en: 'Beef, fresh or chilled', ar: 'لحم بقر طازج أو مبرد', duty: 0 },
  { code: '0202', en: 'Beef, frozen', ar: 'لحم بقر مجمد', duty: 0 },
  { code: '0204', en: 'Lamb & goat meat', ar: 'لحم ضأن وماعز', duty: 0 },
  { code: '0207', en: 'Poultry meat & offal (chicken, turkey)', ar: 'لحوم دواجن وأحشاؤها (دجاج، ديك رومي)', duty: 0 },
  { code: '0210', en: 'Meat, salted, dried or smoked', ar: 'لحوم مملحة أو مجففة أو مدخنة', duty: 0 },
  // Ch 03 fish
  { code: '0302', en: 'Fish, fresh or chilled', ar: 'أسماك طازجة أو مبردة', duty: 0 },
  { code: '0303', en: 'Fish, frozen', ar: 'أسماك مجمدة', duty: 0 },
  { code: '0304', en: 'Fish fillets & fish meat', ar: 'شرائح أسماك ولحم سمك', duty: 0 },
  { code: '0305', en: 'Fish, dried, salted or smoked', ar: 'أسماك مجففة أو مملحة أو مدخنة', duty: 0 },
  { code: '0306', en: 'Crustaceans (shrimp, crab, lobster)', ar: 'قشريات (روبيان، سلطعون، كركند)', duty: 0 },
  { code: '0307', en: 'Molluscs (squid, octopus, clams)', ar: 'رخويات (حبار، أخطبوط، محار)', duty: 0 },
  // Ch 04 dairy & eggs & honey
  { code: '0401', en: 'Milk & cream, not concentrated', ar: 'حليب وقشدة غير مركزة', duty: 'verify', note: 'Confirm the exemption status of this exact tariff line' },
  { code: '0402', en: 'Milk powder / condensed milk', ar: 'حليب مجفف / مكثف', duty: 'verify' },
  { code: '0403', en: 'Yoghurt, laban, buttermilk', ar: 'زبادي، لبن، لبن رائب', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  { code: '0404', en: 'Whey & milk constituents', ar: 'مصل الحليب ومكوناته', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  { code: '0405', en: 'Butter & dairy spreads', ar: 'زبدة ودهون ألبان', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  { code: '0406', en: 'Cheese & curd', ar: 'جبن', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  { code: '0407', en: 'Eggs in shell', ar: 'بيض بقشره', duty: 'verify' },
  { code: '0409', en: 'Natural honey', ar: 'عسل طبيعي', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  // Ch 07 vegetables
  { code: '0701', en: 'Potatoes, fresh', ar: 'بطاطس طازجة', duty: 0 },
  { code: '0702', en: 'Tomatoes, fresh', ar: 'طماطم طازجة', duty: 0 },
  { code: '0703', en: 'Onions, garlic, leeks', ar: 'بصل، ثوم، كراث', duty: 0 },
  { code: '0709', en: 'Other fresh vegetables', ar: 'خضروات طازجة أخرى', duty: 0 },
  { code: '0710', en: 'Vegetables, frozen', ar: 'خضروات مجمدة', duty: 'verify' },
  { code: '0712', en: 'Vegetables, dried', ar: 'خضروات مجففة', duty: 'verify' },
  { code: '0713', en: 'Dried legumes (lentils, chickpeas, beans)', ar: 'بقوليات مجففة (عدس، حمص، فاصوليا)', duty: 'verify' },
  // Ch 08 fruit & nuts
  { code: '0801', en: 'Coconuts, Brazil nuts, cashews', ar: 'جوز الهند، جوز برازيلي، كاجو', duty: 'verify' },
  { code: '0802', en: 'Other nuts (almonds, pistachios, walnuts)', ar: 'مكسرات أخرى (لوز، فستق، جوز)', duty: 'verify' },
  { code: '0803', en: 'Bananas', ar: 'موز', duty: 0 },
  { code: '0804', en: 'Dates, figs, pineapples, avocados, mangoes', ar: 'تمور، تين، أناناس، أفوكادو، مانجو', duty: 0 },
  { code: '0805', en: 'Citrus fruit', ar: 'حمضيات', duty: 0 },
  { code: '0806', en: 'Grapes', ar: 'عنب', duty: 0 },
  { code: '0808', en: 'Apples, pears, quinces', ar: 'تفاح، كمثرى، سفرجل', duty: 0 },
  { code: '0810', en: 'Other fresh fruit (berries, kiwi, pomegranate)', ar: 'فواكه طازجة أخرى (توت، كيوي، رمان)', duty: 0 },
  { code: '0811', en: 'Fruit, frozen', ar: 'فواكه مجمدة', duty: 'verify' },
  { code: '0813', en: 'Fruit, dried', ar: 'فواكه مجففة', duty: 'verify' },
  // Ch 09 coffee, tea, spices
  { code: '0901', en: 'Coffee (green or roasted)', ar: 'قهوة (خضراء أو محمصة)', duty: 0 },
  { code: '0902', en: 'Tea', ar: 'شاي', duty: 'verify', note: 'Confirm the exemption status of this exact tariff line' },
  { code: '0904', en: 'Pepper, chilli, paprika', ar: 'فلفل، شطة، بابريكا', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  { code: '0906', en: 'Cinnamon', ar: 'قرفة', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  { code: '0908', en: 'Nutmeg, cardamom', ar: 'جوزة الطيب، هيل', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  { code: '0909', en: 'Cumin, anise, coriander seeds', ar: 'كمون، يانسون، كزبرة', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  { code: '0910', en: 'Ginger, saffron, turmeric, spice mixes', ar: 'زنجبيل، زعفران، كركم، خلطات بهارات', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  // Ch 10–11 cereals & milling
  { code: '1001', en: 'Wheat', ar: 'قمح', duty: 0 },
  { code: '1005', en: 'Maize (corn)', ar: 'ذرة', duty: 0 },
  { code: '1006', en: 'Rice', ar: 'أرز', duty: 0 },
  { code: '1101', en: 'Wheat flour', ar: 'دقيق قمح', duty: 'verify', note: 'Confirm the exemption status of this exact tariff line' },
  { code: '1102', en: 'Other cereal flours', ar: 'دقيق حبوب أخرى', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  { code: '1104', en: 'Rolled oats & worked grains', ar: 'شوفان مجروش وحبوب معالجة', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  { code: '1108', en: 'Starches', ar: 'نشاء', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  // Ch 12 seeds
  { code: '1202', en: 'Groundnuts (peanuts)', ar: 'فول سوداني', duty: 0 },
  { code: '1207', en: 'Sesame, sunflower & other oil seeds', ar: 'سمسم، بذور دوار الشمس وبذور زيتية أخرى', duty: 0 },
  { code: '1211', en: 'Herbs for infusions / pharmacy', ar: 'أعشاب للمشروبات / الصيدلة', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  // Ch 15 oils
  { code: '1507', en: 'Soybean oil', ar: 'زيت فول الصويا', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  { code: '1509', en: 'Olive oil', ar: 'زيت زيتون', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  { code: '1511', en: 'Palm oil', ar: 'زيت نخيل', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  { code: '1512', en: 'Sunflower / safflower oil', ar: 'زيت دوار الشمس / القرطم', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  { code: '1514', en: 'Rapeseed / canola oil', ar: 'زيت الكانولا', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  { code: '1517', en: 'Margarine & blended fats', ar: 'مارجرين ودهون مخلوطة', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  // Ch 16 prepared meat/fish
  { code: '1601', en: 'Sausages', ar: 'سجق ونقانق', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  { code: '1602', en: 'Prepared / preserved meat (luncheon, corned beef)', ar: 'لحوم محضرة أو محفوظة (لانشون، كورنيد بيف)', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  { code: '1604', en: 'Prepared / canned fish (tuna, sardines)', ar: 'أسماك محضرة أو معلبة (تونة، سردين)', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  { code: '1605', en: 'Prepared crustaceans & molluscs', ar: 'قشريات ورخويات محضرة', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  // Ch 17–18 sugar, cocoa
  { code: '1701', en: 'Cane / beet sugar', ar: 'سكر قصب / بنجر', duty: 'verify', note: 'GCC tariff guidance lists sugar among duty-free staples — confirm the exact line' },
  { code: '1702', en: 'Other sugars, glucose, syrups', ar: 'سكريات أخرى، جلوكوز، شراب', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  { code: '1704', en: 'Sugar confectionery (no cocoa)', ar: 'حلويات سكرية (بدون كاكاو)', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  { code: '1801', en: 'Cocoa beans', ar: 'حبوب كاكاو', duty: 'verify' },
  { code: '1806', en: 'Chocolate & cocoa preparations', ar: 'شوكولاتة ومحضرات كاكاو', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  // Ch 19 cereal preparations
  { code: '1901.10', en: 'Infant formula & baby food (retail)', ar: 'حليب أطفال وأغذية رضّع (تجزئة)', duty: 'verify', note: 'Confirm the exemption status of this exact tariff line' },
  { code: '1901', en: 'Malt extract; flour/milk preparations', ar: 'خلاصة شعير؛ محضرات دقيق/حليب', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  { code: '1902', en: 'Pasta & noodles', ar: 'معكرونة ونودلز', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  { code: '1904', en: 'Breakfast cereals & puffed grains', ar: 'حبوب إفطار وحبوب منفوشة', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  { code: '1905', en: 'Bread, biscuits, pastry, wafers', ar: 'خبز، بسكويت، معجنات، ويفر', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  // Ch 20 prepared veg/fruit
  { code: '2001', en: 'Pickles (in vinegar)', ar: 'مخللات (بالخل)', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  { code: '2002', en: 'Tomatoes prepared (paste, canned)', ar: 'طماطم محضرة (معجون، معلبة)', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  { code: '2005', en: 'Other prepared vegetables (olives, beans, hummus)', ar: 'خضروات محضرة أخرى (زيتون، فول، حمص)', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  { code: '2007', en: 'Jams, jellies, fruit purées', ar: 'مربيات، جيلي، هريس فواكه', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  { code: '2008', en: 'Fruit & nuts prepared (canned fruit, roasted nuts)', ar: 'فواكه ومكسرات محضرة (فواكه معلبة، مكسرات محمصة)', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  { code: '2009', en: 'Fruit & vegetable juices', ar: 'عصائر فواكه وخضروات', duty: 'verify', excise: 'sweet', note: 'Sweetened juice drinks fall under the 2026 sugar tiers'  },
  // Ch 21 misc preparations
  { code: '2101', en: 'Coffee & tea extracts (instant coffee)', ar: 'خلاصات قهوة وشاي (قهوة سريعة الذوبان)', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  { code: '2102', en: 'Yeasts & baking powders', ar: 'خمائر ومساحيق خبز', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  { code: '2103', en: 'Sauces, ketchup, mayonnaise, mustard, seasonings', ar: 'صلصات، كاتشب، مايونيز، خردل، توابل', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  { code: '2104', en: 'Soups & broths', ar: 'شوربات ومرق', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  { code: '2105', en: 'Ice cream', ar: 'آيس كريم', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  { code: '2106', en: 'Food preparations n.e.s. (supplements, syrups, protein powders)', ar: 'محضرات غذائية غير مذكورة (مكملات، شراب، مساحيق بروتين)', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  // Ch 22 beverages
  { code: '2201', en: 'Water incl. mineral & sparkling, no sugar', ar: 'مياه معدنية وغازية بدون سكر', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  { code: '2202.10', en: 'Sweetened / flavoured water & carbonated drinks', ar: 'مياه محلّاة/منكّهة ومشروبات غازية', duty: 'verify', excise: 'sweet' , note: '5% standard rate unless this exact line is on the GCC exemption list' },
  { code: '2202.99', en: 'Other non-alcoholic beverages (energy drinks, iced tea, plant milks)', ar: 'مشروبات غير كحولية أخرى (مشروبات طاقة، شاي مثلج، حليب نباتي)', duty: 'verify', excise: 'sweet', note: 'Energy drinks: choose the energy excise (100%)'  },
  { code: '2203', en: 'Beer', ar: 'بيرة', duty: 50 },
  { code: '2204', en: 'Wine', ar: 'نبيذ', duty: 50 },
  { code: '2208', en: 'Spirits & liqueurs', ar: 'مشروبات روحية', duty: 50 },
  // Ch 23 feed
  { code: '2309.10', en: 'Dog & cat food, retail', ar: 'أغذية كلاب وقطط (تجزئة)', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  { code: '2309.90', en: 'Other animal feed preparations', ar: 'محضرات أعلاف أخرى', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  // Ch 24 tobacco
  { code: '2402', en: 'Cigarettes & cigars', ar: 'سجائر وسيجار', duty: 100, excise: 'tobacco' },
  { code: '2403', en: 'Other tobacco (shisha/molasses)', ar: 'تبغ آخر (معسّل)', duty: 100, excise: 'tobacco' },
  // Ch 25 salt
  { code: '2501', en: 'Salt', ar: 'ملح', duty: 'verify', note: '5% standard rate unless this exact line is on the GCC exemption list' },
  // Ch 30 medicaments (info only)
  { code: '3004', en: 'Medicaments (retail) — EDE controlled', ar: 'أدوية (تجزئة) — تحت رقابة مؤسسة الدواء', duty: 'verify', note: 'Registered and permitted by the Emirates Drug Establishment — confirm duty on the exact line' },
  // Ch 33 cosmetics & perfumery
  { code: '3301', en: 'Essential oils', ar: 'زيوت عطرية', duty: 5 },
  { code: '3303', en: 'Perfumes & toilet waters', ar: 'عطور ومياه تواليت', duty: 5 },
  { code: '3304', en: 'Beauty, make-up & skincare preparations', ar: 'مستحضرات تجميل ومكياج وعناية بالبشرة', duty: 5 },
  { code: '3305', en: 'Hair preparations (shampoo, dyes)', ar: 'مستحضرات الشعر (شامبو، صبغات)', duty: 5 },
  { code: '3306', en: 'Oral care (toothpaste, floss)', ar: 'عناية بالفم (معجون أسنان، خيط)', duty: 5 },
  { code: '3307', en: 'Shaving, deodorants, bath preparations', ar: 'مستحضرات حلاقة، مزيلات عرق، استحمام', duty: 5 },
  // Ch 34 soap & detergents
  { code: '3401', en: 'Soap & organic surface-active bars/liquids', ar: 'صابون ومنظفات سطحية', duty: 5 },
  { code: '3402', en: 'Detergents & washing preparations', ar: 'منظفات ومحضرات غسيل', duty: 5 },
  { code: '3808', en: 'Disinfectants, insecticides', ar: 'مطهرات ومبيدات حشرية', duty: 5 },
  // Packaging & consumables
  { code: '3923', en: 'Plastic packaging (bottles, caps, bags)', ar: 'عبوات بلاستيكية (زجاجات، أغطية، أكياس)', duty: 5 },
  { code: '3924', en: 'Plastic tableware & household articles', ar: 'أدوات مائدة ومنزلية بلاستيكية', duty: 5 },
  { code: '4818', en: 'Tissues, napkins, diapers (paper)', ar: 'مناديل، محارم، حفاضات (ورقية)', duty: 5 },
  { code: '4819', en: 'Cartons, boxes, cases of paper/board', ar: 'كراتين وصناديق ورقية', duty: 5 },
  { code: '4821', en: 'Paper labels', ar: 'ملصقات ورقية', duty: 5 },
  { code: '7010', en: 'Glass bottles & jars', ar: 'زجاجات وبرطمانات زجاجية', duty: 5 },
  { code: '9619', en: 'Sanitary towels, diapers (any material)', ar: 'فوط صحية وحفاضات (أي مادة)', duty: 5 },
]

export function searchHs(q: string): HsEntry[] {
  const s = q.trim().toLowerCase()
  if (!s) return HS_FMCG.slice(0, 12)
  const tokens = s.split(/[\s,،]+/).filter(Boolean)
  return HS_FMCG.filter(e => tokens.every(tk => e.code.startsWith(tk) || e.en.toLowerCase().includes(tk) || e.ar.includes(tk))).slice(0, 12)
}
