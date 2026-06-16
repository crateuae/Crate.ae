-- ═══════════════════════════════════════════════════════════════
-- Crate.ae Seed Data — Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ─── Schema additions (idempotent) ──────────────────────────────
ALTER TABLE gap_alerts   ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();
ALTER TABLE products     ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE products     ADD COLUMN IF NOT EXISTS image_emoji text;
ALTER TABLE products     ADD COLUMN IF NOT EXISTS category_id text;
-- FMCG velocity columns
ALTER TABLE products     ADD COLUMN IF NOT EXISTS fmcg_class text;             -- A | B | C
ALTER TABLE products     ADD COLUMN IF NOT EXISTS fmcg_score int;              -- 0-100
ALTER TABLE products     ADD COLUMN IF NOT EXISTS fmcg_turnover_days int;      -- days per carton
ALTER TABLE products     ADD COLUMN IF NOT EXISTS fmcg_weekly_units int;       -- units/week/store
ALTER TABLE products     ADD COLUMN IF NOT EXISTS fmcg_penetration_pct int;    -- % UAE stores
ALTER TABLE products     ADD COLUMN IF NOT EXISTS fmcg_note_ar text;
ALTER TABLE products     ADD COLUMN IF NOT EXISTS fmcg_note_en text;
-- Unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_idx ON products(slug);


-- ─── 1. PRODUCT CATEGORIES ──────────────────────────────────────
INSERT INTO product_categories (id, name_ar, name_en, icon, sort_order, is_active, slug) VALUES
  ('cat-bev-0001-0000-000000000001', 'مشروبات',               'Beverages',             '🥤', 1,  true, 'beverages'),
  ('cat-dai-0001-0000-000000000002', 'منتجات الألبان',         'Dairy Products',        '🥛', 2,  true, 'dairy-products'),
  ('cat-cer-0001-0000-000000000003', 'حبوب ومنتجاتها',         'Cereals & Products',    '🌾', 3,  true, 'cereals-products'),
  ('cat-snk-0001-0000-000000000004', 'وجبات خفيفة وحلويات',   'Snacks & Confectionery','🍿', 4,  true, 'snacks-confectionery'),
  ('cat-oil-0001-0000-000000000005', 'زيوت ودهون',             'Oils & Fats',           '🫙', 5,  true, 'oils-fats'),
  ('cat-cof-0001-0000-000000000006', 'قهوة وشاي',              'Coffee & Tea',          '☕', 6,  true, 'coffee-tea'),
  ('cat-sau-0001-0000-000000000007', 'توابل وصلصات',           'Spices & Sauces',       '🍅', 7,  true, 'spices-sauces'),
  ('cat-mea-0001-0000-000000000008', 'لحوم ودواجن وأسماك',     'Meat, Poultry & Fish',  '🍗', 8,  true, 'meat-poultry-fish'),
  ('cat-can-0001-0000-000000000009', 'معلبات ومحفوظات',        'Canned & Preserved',    '🥫', 9,  true, 'canned-preserved'),
  ('cat-frz-0001-0000-000000000010', 'منتجات مجمدة',           'Frozen Products',       '❄️', 10, true, 'frozen-products'),
  ('cat-sug-0001-0000-000000000011', 'سكر وعسل وشيرة',         'Sugar, Honey & Syrup',  '🍯', 11, true, 'sugar-honey-syrup')
ON CONFLICT (id) DO UPDATE SET
  name_ar = EXCLUDED.name_ar, name_en = EXCLUDED.name_en,
  icon = EXCLUDED.icon, sort_order = EXCLUDED.sort_order;

-- ─── 2. SUBCATEGORIES ───────────────────────────────────────────
INSERT INTO product_subcategories (id, category_id, name_ar, name_en, sort_order) VALUES
  -- Beverages
  ('sub-bev-001', 'cat-bev-0001-0000-000000000001', 'مشروبات غازية',   'Carbonated Drinks',    1),
  ('sub-bev-002', 'cat-bev-0001-0000-000000000001', 'مشروبات الطاقة',  'Energy Drinks',        2),
  ('sub-bev-003', 'cat-bev-0001-0000-000000000001', 'مياه معبأة',      'Bottled Water',        3),
  ('sub-bev-004', 'cat-bev-0001-0000-000000000001', 'شاي جاهز',        'Ready-to-Drink Tea',   4),
  -- Dairy
  ('sub-dai-001', 'cat-dai-0001-0000-000000000002', 'حليب طازج',       'Fresh Milk',           1),
  ('sub-dai-002', 'cat-dai-0001-0000-000000000002', 'جبن',             'Cheese',               2),
  ('sub-dai-003', 'cat-dai-0001-0000-000000000002', 'زبادي',           'Yogurt',               3),
  -- Cereals
  ('sub-cer-001', 'cat-cer-0001-0000-000000000003', 'أرز',             'Rice',                 1),
  ('sub-cer-002', 'cat-cer-0001-0000-000000000003', 'معكرونة ونودلز',  'Pasta & Noodles',      2),
  ('sub-cer-003', 'cat-cer-0001-0000-000000000003', 'حبوب الإفطار',    'Breakfast Cereals',    3),
  -- Snacks
  ('sub-snk-001', 'cat-snk-0001-0000-000000000004', 'رقائق وشيبس',     'Chips & Crisps',       1),
  ('sub-snk-002', 'cat-snk-0001-0000-000000000004', 'شوكولاته',        'Chocolate',            2),
  ('sub-snk-003', 'cat-snk-0001-0000-000000000004', 'بسكويت وكعك',     'Biscuits & Cookies',   3),
  ('sub-snk-004', 'cat-snk-0001-0000-000000000004', 'حلوى وكاندي',     'Candy & Sweets',       4),
  -- Oils & Fats
  ('sub-oil-001', 'cat-oil-0001-0000-000000000005', 'زيت نباتي',       'Vegetable Oil',        1),
  ('sub-oil-002', 'cat-oil-0001-0000-000000000005', 'زيت زيتون',       'Olive Oil',            2),
  ('sub-oil-003', 'cat-oil-0001-0000-000000000005', 'سمن وزبدة',       'Ghee & Butter',        3),
  -- Coffee & Tea
  ('sub-cof-001', 'cat-cof-0001-0000-000000000006', 'قهوة فورية',      'Instant Coffee',       1),
  ('sub-cof-002', 'cat-cof-0001-0000-000000000006', 'شاي أكياس وأوراق','Tea Bags & Loose Leaf', 2),
  -- Spices & Sauces
  ('sub-sau-001', 'cat-sau-0001-0000-000000000007', 'كاتشب وخردل',     'Ketchup & Mustard',    1),
  -- Meat
  ('sub-mea-001', 'cat-mea-0001-0000-000000000008', 'دواجن',           'Poultry',              1),
  -- Canned
  ('sub-can-001', 'cat-can-0001-0000-000000000009', 'معلبات خضار وفواكه','Canned Vegetables & Fruits', 1),
  ('sub-can-002', 'cat-can-0001-0000-000000000009', 'معلبات أسماك',    'Canned Fish',          2),
  -- Frozen
  ('sub-frz-001', 'cat-frz-0001-0000-000000000010', 'وجبات جاهزة مجمدة','Frozen Ready Meals',   1),
  -- Sugar / Honey
  ('sub-sug-001', 'cat-sug-0001-0000-000000000011', 'عسل طبيعي',       'Natural Honey',        1)
ON CONFLICT (id) DO UPDATE SET
  name_ar = EXCLUDED.name_ar, name_en = EXCLUDED.name_en;

-- ─── 3. PRODUCTS ────────────────────────────────────────────────
INSERT INTO products (
  id, slug, name_ar, name_en, brand,
  country_origin, country_origin_ar,
  category_id, category_ar, category_en,
  subcategory_ar, subcategory_en,
  unit_size, price_retail_aed, price_wholesale_aed, price_import_aed,
  units_per_carton, barcode_type, shelf_life_months, storage_temp,
  certifications, hs_code, market_signal, gap_score,
  image_emoji, description_ar, description_en,
  registration_status, acquisition_type,
  local_distributor_note, registration_cost_aed, registration_months, required_docs,
  fmcg_class, fmcg_score, fmcg_turnover_days, fmcg_weekly_units, fmcg_penetration_pct,
  fmcg_note_ar, fmcg_note_en,
  is_active
) VALUES

-- p001 Coca-Cola
('prod-p001-0000-0000-000000000001','coca-cola-330ml',
 'كوكاكولا كلاسيك 330ml','Coca-Cola Classic 330ml','The Coca-Cola Company',
 'UAE (Licensed)','الإمارات (مرخّص محلياً)',
 'cat-bev-0001-0000-000000000001','مشروبات','Beverages','مشروبات غازية','Carbonated Drinks',
 '330ml × 24', 2.0, 42, null, 24,'EAN-13', 9,'4–25 °C',
 ARRAY['ESMA','Halal','ISO 22000'],'2202.10','shortage', 75,
 '🥤','مُصنَّع محلياً بترخيص — الأكثر مبيعاً في الإمارات','Locally manufactured under license — top seller in UAE',
 'registered_uae','local_trade',
 'متوفر من خلال موزعي كوكاكولا الإمارات مباشرةً أو من مستودعات الجملة الكبرى', null, null, null,
 'A',97,3,48,98,'الأكثر مبيعاً في الإمارات — موجود في كل نقطة بيع تقريباً','Top UAE seller — present in virtually every point of sale',
 true),

-- p002 Red Bull
('prod-p002-0000-0000-000000000002','red-bull-250ml',
 'ريد بول 250ml','Red Bull 250ml','Red Bull GmbH',
 'Austria','النمسا',
 'cat-bev-0001-0000-000000000001','مشروبات','Beverages','مشروبات الطاقة','Energy Drinks',
 '250ml × 24', 7.5, 85, 58, 24,'EAN-13', 24,'4–25 °C',
 ARRAY['ESMA','UAE.S 1926:2015'],'2202.99','shortage', 92,
 '⚡','مسجّل بالإمارات — نقص مستمر في المناطق الصناعية والمحطات','Registered in UAE — consistent shortage in industrial zones and petrol stations',
 'registered_uae','both',
 'الموزع الرسمي: شركة أبوظبي الوطنية للغازات وعدة وكلاء إقليميين', null, null, null,
 'A',91,5,24,92,'مشروب طاقة رائد — نقص مستمر يؤكد سرعة التداول العالية','Leading energy drink — persistent shortage confirms very high velocity',
 true),

-- p003 Almarai Milk
('prod-p003-0000-0000-000000000003','almarai-milk-1l',
 'حليب المراعي كامل الدسم 1L','Almarai Full Fat Milk 1L','Almarai Company',
 'Saudi Arabia','المملكة العربية السعودية',
 'cat-dai-0001-0000-000000000002','منتجات الألبان','Dairy Products','حليب طازج','Fresh Milk',
 '1L × 12', 4.5, 38, 28, 12,'EAN-13', 1,'2–6 °C',
 ARRAY['ESMA','Halal','ISO 22000'],'0401.10','rising', 30,
 '🥛','منتج خليجي مسجّل — طلب متزايد مع نمو السكان','GCC registered product — growing demand with population growth',
 'registered_uae','both',
 'متوفر من الموزع الرسمي المراعي الإمارات أو من مستودعات دبي', null, null, null,
 'A',96,2,36,95,'منتج أساسي يومي — دوران سريع جداً بسبب قصر الصلاحية','Daily essential — very fast turnover driven by short shelf life',
 true),

-- p004 Uncle Ben's Rice
('prod-p004-0000-0000-000000000004','uncle-bens-basmati-5kg',
 'رز بسمتي Uncle Ben''s 5kg','Uncle Ben''s Basmati Rice 5kg','Mars Food (Uncle Bens)',
 'Thailand','تايلاند',
 'cat-cer-0001-0000-000000000003','حبوب ومنتجاتها','Cereals & Products','أرز','Rice',
 '5kg × 4', 32, 110, 78, 4,'EAN-13', 24,'10–25 °C',
 ARRAY['ESMA','ISO 22000'],'1006.30','rising', 45,
 '🌾','مسجّل ومتوفر — استيراد مباشر يوفر هامش 30% إضافي','Registered and available — direct import saves 30% margin',
 'registered_uae','both',
 'متوفر في مستودعات الجملة في القوز والمفرق', null, null, null,
 'B',55,21,8,75,'أرز متوسط الحركة — ذروة المبيعات في رمضان والمواسم','Medium-velocity rice — peak sales during Ramadan and seasons',
 true),

-- p005 Indomie
('prod-p005-0000-0000-000000000005','indomie-mi-goreng-80g',
 'إندومي مي غورينج 80g','Indomie Mi Goreng 80g','Indofood',
 'Indonesia','إندونيسيا',
 'cat-cer-0001-0000-000000000003','حبوب ومنتجاتها','Cereals & Products','معكرونة ونودلز','Pasta & Noodles',
 '80g × 40', 1.5, 28, 19, 40,'EAN-13', 12,'15–25 °C',
 ARRAY['ESMA','Halal'],'1902.30','rising', 40,
 '🍜','استيراد مباشر من إندونيسيا يوفر هامشاً أعلى بـ 30%','Direct import from Indonesia yields 30% higher margin',
 'registered_uae','both',
 'متوفر من موزعين آسيويين في منطقة بر دبي والقوز', null, null, null,
 'A',82,7,30,88,'من أسرع المعكرونة تداولاً في الإمارات بين المجتمعات الآسيوية','One of fastest-moving noodles in UAE within Asian communities',
 true),

-- p006 Lays
('prod-p006-0000-0000-000000000006','lays-classic-167g',
 'ليز كلاسيك 167g','Lays Classic 167g','PepsiCo / Walkers',
 'UAE (Licensed)','الإمارات (مرخّص محلياً)',
 'cat-snk-0001-0000-000000000004','وجبات خفيفة وحلويات','Snacks & Confectionery','رقائق وشيبس','Chips & Crisps',
 '167g × 24', 6.5, 120, null, 24,'EAN-13', 6,'15–25 °C',
 ARRAY['ESMA','Halal','ISO 22000'],'2008.19','arbitrage', 35,
 '🍟','مُصنَّع محلياً — فارق سعري 40% بين الجملة والتجزئة في البقالات الصغيرة','Locally manufactured — 40% price gap between wholesale and small retail',
 'registered_uae','local_trade',
 'الموزع الرسمي: فريتو لاي الإمارات، توزيع مباشر لمناطق دبي وأبوظبي', null, null, null,
 'A',88,5,36,94,'شيبس رائج في كل المنافذ — مبيعات ثابتة على مدار السنة','Top chips in all outlets — consistent sales year-round',
 true),

-- p007 Sunola Oil
('prod-p007-0000-0000-000000000007','sunola-corn-oil-4l',
 'زيت ذرة سنولا 4L','Sunola Corn Oil 4L','Savola Group',
 'Egypt','مصر',
 'cat-oil-0001-0000-000000000005','زيوت ودهون','Oils & Fats','زيت نباتي','Vegetable Oil',
 '4L × 4', 26, 72, 52, 4,'EAN-13', 18,'15–25 °C',
 ARRAY['ESMA','Halal'],'1512.11','arbitrage', 44,
 '🫙','استيراد مباشر من مصر يوفر 28% عن سعر الجملة المحلي','Direct import from Egypt saves 28% vs local wholesale price',
 'registered_uae','both',
 'متوفر من مستودعات سافولا الإمارات في جبل علي', null, null, null,
 'B',62,14,12,82,'زيت ذرة متوسط الحركة — ارتفاع في موسم الطهي','Medium-velocity corn oil — picks up during cooking seasons',
 true),

-- p008 Puck Cream Cheese
('prod-p008-0000-0000-000000000008','puck-cream-cheese-500g',
 'جبنة كريمية Puck 500g','Puck Cream Cheese 500g','Arla Foods / Savola',
 'Denmark','الدنمارك',
 'cat-dai-0001-0000-000000000002','منتجات الألبان','Dairy Products','جبن','Cheese',
 '500g × 12', 18.5, 160, 120, 12,'EAN-13', 12,'2–6 °C',
 ARRAY['ESMA','Halal','ISO 22000'],'0406.10','rising', 28,
 '🧀','مطلوبة في المطاعم والفنادق — استيراد مباشر بفارق 25%','High demand from restaurants & hotels — direct import 25% cheaper',
 'registered_uae','both',
 'الموزع: أرلا فودز الإمارات، أبوظبي وبعض وكلاء دبي', null, null, null,
 'B',65,10,12,78,'جبنة كريمية عالية الطلب في المطاعم — متوسطة في التجزئة','High restaurant demand cream cheese — medium in retail',
 true),

-- p009 Nescafe
('prod-p009-0000-0000-000000000009','nescafe-classic-200g',
 'نسكافيه كلاسيك 200g','Nescafé Classic 200g','Nestlé',
 'Switzerland','سويسرا',
 'cat-cof-0001-0000-000000000006','قهوة وشاي','Coffee & Tea','قهوة فورية','Instant Coffee',
 '200g × 12', 22, 190, 145, 12,'EAN-13', 24,'15–25 °C',
 ARRAY['ESMA','Halal','ISO 22000'],'2101.11','stable', 10,
 '☕','طلب ثابت طوال العام — مناسب للتجارة المحلية أو الاستيراد','Steady year-round demand — suitable for local trade or import',
 'registered_uae','both',
 'نستله الإمارات: توزيع واسع النطاق عبر شبكة معتمدة', null, null, null,
 'B',60,14,10,86,'قهوة فورية ثابتة المبيعات — ارتفاع ملحوظ في الشتاء ورمضان','Stable instant coffee — notable uptick in winter and Ramadan',
 true),

-- p010 Lipton
('prod-p010-0000-0000-000000000010','lipton-yellow-label-100s',
 'شاي ليبتون 100 كيس','Lipton Yellow Label 100s','Unilever',
 'Sri Lanka / UAE','سريلانكا / الإمارات',
 'cat-cof-0001-0000-000000000006','قهوة وشاي','Coffee & Tea','شاي أكياس وأوراق','Tea Bags & Loose Leaf',
 '100 bags × 24', 14, 240, 175, 24,'EAN-13', 36,'15–25 °C',
 ARRAY['ESMA','Halal','Rainforest Alliance'],'0902.30','rising', 20,
 '🍵','شاي ثابت المبيعات — تكليف الاستيراد المباشر أقل 27% من الجملة المحلية','Stable tea sales — direct import 27% cheaper than local wholesale',
 'registered_uae','both',
 'يونيليفر الإمارات: توزيع مباشر أو عبر موزعين معتمدين', null, null, null,
 'B',57,21,8,84,'شاي ثابت المبيعات — معدل تداول منتظم طوال السنة','Steady tea seller — consistent turnover rate throughout the year',
 true),

-- p011 Kit Kat
('prod-p011-0000-0000-000000000011','kit-kat-4-finger-41g',
 'كيت كات 4 أصابع 41.5g','Kit Kat 4-Finger 41.5g','Nestlé',
 'UAE (Licensed)','الإمارات (مرخّص محلياً)',
 'cat-snk-0001-0000-000000000004','وجبات خفيفة وحلويات','Snacks & Confectionery','شوكولاته','Chocolate',
 '41.5g × 24', 3.5, 55, null, 24,'EAN-13', 12,'15–22 °C',
 ARRAY['ESMA','Halal'],'1806.32','arbitrage', 30,
 '🍫','مُصنَّع محلياً — طلب مستمر في كل نقاط البيع','Locally manufactured — consistent demand at all retail points',
 'registered_uae','local_trade',
 'نستله الإمارات: توزيع مباشر، لا حاجة لاستيراد', null, null, null,
 'A',83,7,24,90,'أعلى حلوى شوكولاته مبيعاً في الإمارات — سريع التداول','Top chocolate bar seller in UAE — fast moving SKU',
 true),

-- p012 Kellogg's
('prod-p012-0000-0000-000000000012','kelloggs-corn-flakes-500g',
 'حبوب كورن فليكس Kellogg''s 500g','Kellogg''s Corn Flakes 500g','Kellogg''s Company',
 'UAE (Licensed)','الإمارات (مرخّص محلياً)',
 'cat-cer-0001-0000-000000000003','حبوب ومنتجاتها','Cereals & Products','حبوب الإفطار','Breakfast Cereals',
 '500g × 6', 16, 72, null, 6,'EAN-13', 12,'15–25 °C',
 ARRAY['ESMA','Halal'],'1904.10','rising', 25,
 '🥣','حبوب إفطار مصنوعة محلياً — ذروة المبيعات سبتمبر-يونيو','Locally manufactured breakfast cereal — peak sales Sep–Jun',
 'registered_uae','local_trade',
 'كيلوغز الخليج: مصنع في دبي، توزيع مباشر', null, null, null,
 'B',59,14,10,82,'حبوب إفطار موسمية — ذروة المبيعات أغسطس–مايو مع موسم الدراسة','Seasonal breakfast cereal — peak sales Aug–May with school season',
 true),

-- p013 Heinz Ketchup
('prod-p013-0000-0000-000000000013','heinz-ketchup-570g',
 'كاتشب هاينز 570g','Heinz Tomato Ketchup 570g','Kraft Heinz',
 'Netherlands','هولندا',
 'cat-sau-0001-0000-000000000007','توابل وصلصات','Spices & Sauces','كاتشب وخردل','Ketchup & Mustard',
 '570g × 12', 14, 120, 88, 12,'EAN-13', 24,'10–25 °C',
 ARRAY['ESMA','Halal','ISO 22000'],'2103.20','stable', 12,
 '🍅','ضروري في المطاعم — طلب ثابت على مدار السنة','Restaurant staple — stable year-round institutional demand',
 'registered_uae','both',
 'كرافت هاينز الخليج: موزعون معتمدون في دبي وأبوظبي', null, null, null,
 'B',54,21,8,80,'كاتشب أساسي في المطاعم — حركة ثابتة وإعادة طلب منتظمة','Restaurant condiment staple — steady movement with regular reorders',
 true),

-- p014 Nutella
('prod-p014-0000-0000-000000000014','nutella-400g',
 'نوتيلا 400g','Nutella 400g','Ferrero',
 'Italy','إيطاليا',
 'cat-snk-0001-0000-000000000004','وجبات خفيفة وحلويات','Snacks & Confectionery','بسكويت وكعك','Biscuits & Cookies',
 '400g × 12', 18, 165, 125, 12,'EAN-13', 12,'15–22 °C',
 ARRAY['ESMA','Halal'],'1806.90','stable', 15,
 '🫙','طلب ثابت — استيراد مباشر يوفر هامشاً أعلى للمستودعات','Steady demand — direct import yields higher margin for wholesalers',
 'registered_uae','both',
 'فيريرو الخليج: موزع رسمي في دبي', null, null, null,
 'B',61,14,10,85,'نوتيلا طلبها ثابت في العائلات — ذروة في رمضان والأعياد','Steady family demand Nutella — peaks in Ramadan and holidays',
 true),

-- p015 Afia Olive Oil
('prod-p015-0000-0000-000000000015','afia-olive-oil-750ml',
 'زيت زيتون عافية 750ml','Afia Olive Oil 750ml','Savola Group',
 'Spain','إسبانيا',
 'cat-oil-0001-0000-000000000005','زيوت ودهون','Oils & Fats','زيت زيتون','Olive Oil',
 '750ml × 12', 28, 250, 185, 12,'EAN-13', 24,'15–22 °C',
 ARRAY['ESMA','Halal','IOC Certified'],'1509.10','rising', 22,
 '🫒','طلب متزايد من الوعي الصحي — استيراد مباشر من إسبانيا بفارق 26%','Growing health-conscious demand — direct Spain import saves 26%',
 'registered_uae','both',
 'سافولا الإمارات: مستودع جبل علي', null, null, null,
 'B',51,21,6,78,'زيت زيتون متوسط الحركة — طلب متنامٍ مع التوجه الصحي','Medium-velocity olive oil — growing demand with health awareness',
 true),

-- p016 San Remo Penne
('prod-p016-0000-0000-000000000016','san-remo-penne-500g',
 'معكرونة سان ريمو 500g','San Remo Penne 500g','San Remo Foods',
 'Australia','أستراليا',
 'cat-cer-0001-0000-000000000003','حبوب ومنتجاتها','Cereals & Products','معكرونة ونودلز','Pasta & Noodles',
 '500g × 20', 6.5, 98, 70, 20,'EAN-13', 24,'15–25 °C',
 ARRAY['ESMA','ISO 22000'],'1902.19','stable', 18,
 '🍝','مطلوبة في المطاعم الإيطالية — استيراد مباشر بفارق 28%','Restaurant staple — direct import saves 28% vs local wholesale',
 'registered_uae','both',
 'موزعون أستراليون في منطقة القوز، دبي', null, null, null,
 'B',49,21,8,72,'معكرونة جيدة المبيعات في مطاعم المأكولات الإيطالية','Good-selling pasta in Italian cuisine restaurants',
 true),

-- p017 Activia
('prod-p017-0000-0000-000000000017','activia-yogurt-4x120g',
 'زبادي أكتيفيا 4×120g','Activia Yogurt 4×120g','Danone',
 'UAE (Licensed)','الإمارات (مرخّص محلياً)',
 'cat-dai-0001-0000-000000000002','منتجات الألبان','Dairy Products','زبادي','Yogurt',
 '4×120g × 6', 9.5, 42, null, 6,'EAN-13', 1,'2–6 °C',
 ARRAY['ESMA','Halal'],'0403.10','rising', 20,
 '🫙','مصنوع محلياً بترخيص — أعلى مبيعاً في قسم الألبان المبردة','Locally made under license — top chilled dairy seller',
 'registered_uae','local_trade',
 'دانون الإمارات: توزيع مباشر مبرد، لا يصلح للاستيراد', null, null, null,
 'A',85,3,18,80,'زبادي مبرد سريع جداً — صلاحية قصيرة تدفع الدوران اليومي','Very fast chilled yogurt — short shelf life drives daily turnover',
 true),

-- p018 President Butter
('prod-p018-0000-0000-000000000018','president-butter-200g',
 'زبدة President 200g','President Butter 200g','Lactalis Group',
 'France','فرنسا',
 'cat-oil-0001-0000-000000000005','زيوت ودهون','Oils & Fats','سمن وزبدة','Ghee & Butter',
 '200g × 24', 12, 220, 160, 24,'EAN-13', 12,'2–6 °C',
 ARRAY['ESMA','Halal'],'0405.10','stable', 14,
 '🧈','زبدة فرنسية فاخرة — مطلوبة في المخابز والمطاعم الراقية','Premium French butter — demanded by bakeries and fine dining',
 'registered_uae','both',
 'لاكتاليس الخليج: مستودع مبرد في دبي', null, null, null,
 'B',52,14,8,70,'زبدة فاخرة — طلب ثابت في المخابز والفنادق','Premium butter — steady demand in bakeries and hotels',
 true),

-- p019 Al Kabeer Chicken
('prod-p019-0000-0000-000000000019','al-kabeer-chicken-1kg',
 'دجاج مجمد Al Kabeer 1kg','Al Kabeer Frozen Chicken 1kg','Al Kabeer Group',
 'UAE','الإمارات العربية المتحدة',
 'cat-mea-0001-0000-000000000008','لحوم ودواجن وأسماك','Meat, Poultry & Fish','دواجن','Poultry',
 '1kg × 10', 22, 185, null, 10,'EAN-13', 12,'≤ −18 °C',
 ARRAY['ESMA','Halal','HACCP'],'0207.14','stable', 10,
 '🍗','إنتاج محلي — توزيع مباشر من المصنع في الإمارات','Local production — direct distribution from UAE factory',
 'registered_uae','local_trade',
 'الكبير فودز: مبيعات مباشرة للجملة من مستودع جبل علي', null, null, null,
 'B',66,7,12,75,'دجاج مجمد متوسط–سريع — مطلوب في المطاعم أسبوعياً','Medium–fast frozen chicken — weekly restaurant demand',
 true),

-- p020 M&M's
('prod-p020-0000-0000-000000000020','mms-peanut-200g',
 'M&M''s فول سوداني 200g','M&M''s Peanut 200g','Mars Inc.',
 'Netherlands','هولندا',
 'cat-snk-0001-0000-000000000004','وجبات خفيفة وحلويات','Snacks & Confectionery','حلوى وكاندي','Candy & Sweets',
 '200g × 18', 12, 155, 112, 18,'EAN-13', 12,'15–22 °C',
 ARRAY['ESMA','Halal'],'1806.90','arbitrage', 28,
 '🍬','فجوة سعرية واضحة — استيراد مباشر بفارق 28%','Clear price gap — direct import at 28% cheaper than local',
 'registered_uae','both',
 'مارس الخليج: وكلاء معتمدون في دبي وأبوظبي', null, null, null,
 'B',56,14,10,76,'حلوى M&M طلبها متوسط مع ارتفاع في المواسم والهدايا','Medium demand candy — spikes in festive and gifting seasons',
 true),

-- p021 Masafi Water
('prod-p021-0000-0000-000000000021','masafi-water-1-5l',
 'مياه مسافي 1.5L','Masafi Water 1.5L','Masafi Company LLC',
 'UAE','الإمارات العربية المتحدة',
 'cat-bev-0001-0000-000000000001','مشروبات','Beverages','مياه معبأة','Bottled Water',
 '1.5L × 12', 1.25, 9, null, 12,'EAN-13', 24,'4–25 °C',
 ARRAY['ESMA','UAE.S 25:2002'],'2201.10','stable', 8,
 '💧','مياه معدنية طبيعية إماراتية — توزيع مباشر من مصنع رأس الخيمة','UAE natural mineral water — direct distribution from RAK factory',
 'registered_uae','local_trade',
 'مسافي: توزيع مباشر لجميع مناطق الإمارات', null, null, null,
 'A',98,2,60,96,'مياه معبأة — الأعلى تداولاً في الإمارات، تُعاد طلبها يومياً','Bottled water — highest velocity in UAE, reordered daily',
 true),

-- p022 Del Monte Tomato Paste
('prod-p022-0000-0000-000000000022','del-monte-tomato-paste-135g',
 'معجون طماطم Del Monte 135g','Del Monte Tomato Paste 135g','Del Monte Pacific',
 'Philippines','الفلبين',
 'cat-can-0001-0000-000000000009','معلبات ومحفوظات','Canned & Preserved','معلبات خضار وفواكه','Canned Vegetables & Fruits',
 '135g × 24', 2.5, 40, 28, 24,'EAN-13', 36,'10–25 °C',
 ARRAY['ESMA','Halal','ISO 22000'],'2002.10','stable', 15,
 '🥫','مادة أساسية في المطابخ العربية — طلب ثابت مؤسسي','Arab kitchen staple — steady institutional demand',
 'registered_uae','both',
 'دل مونتي الخليج: موزعون في دبي وأبوظبي', null, null, null,
 'B',50,21,8,78,'معجون طماطم أساسي في المطابخ — طلب ثابت ومنتظم','Kitchen staple tomato paste — steady consistent demand',
 true),

-- p023 John West Tuna
('prod-p023-0000-0000-000000000023','john-west-tuna-185g',
 'تونة جون ويست 185g','John West Tuna in Brine 185g','John West Foods',
 'Thailand','تايلاند',
 'cat-can-0001-0000-000000000009','معلبات ومحفوظات','Canned & Preserved','معلبات أسماك','Canned Fish',
 '185g × 48', 6, 220, 160, 48,'EAN-13', 60,'10–25 °C',
 ARRAY['ESMA','MSC Certified','Halal'],'1604.14','rising', 30,
 '🐟','طلب متزايد في التجمعات العمالية والمدارس — استيراد مباشر بفارق 27%','Growing demand in labor camps and schools — direct import 27% cheaper',
 'registered_uae','both',
 'جون ويست الخليج: موزعون في منطقة القوز، دبي', null, null, null,
 'B',47,21,6,72,'تونة معلبة جيدة المبيعات في التجمعات العمالية والمدارس','Good-selling canned tuna in labor communities and schools',
 true),

-- p024 Kiri Cream Cheese
('prod-p024-0000-0000-000000000024','kiri-cream-cheese-8-portions',
 'جبنة كيري 8 حصص','Kiri Cream Cheese 8 Portions','Bel Group',
 'France','فرنسا',
 'cat-dai-0001-0000-000000000002','منتجات الألبان','Dairy Products','جبن','Cheese',
 '8 portions × 24', 12, 210, 155, 24,'EAN-13', 6,'2–6 °C',
 ARRAY['ESMA','Halal'],'0406.10','rising', 22,
 '🧀','مطلوبة للإفطار المدرسي — استيراد مباشر بفارق 26%','School breakfast staple — direct import at 26% lower cost',
 'registered_uae','both',
 'مجموعة بيل الشرق الأوسط: موزعون في دبي', null, null, null,
 'B',60,10,10,75,'جبنة كيري ثابتة — إقبال مرتفع في موسم الدراسة والأعياد','Steady Kiri — high uptake in school season and holidays',
 true),

-- p025 Al Kabeer Shawarma
('prod-p025-0000-0000-000000000025','al-kabeer-shawarma-1kg',
 'شاورما دجاج Al Kabeer 1kg','Al Kabeer Chicken Shawarma 1kg','Al Kabeer Group',
 'UAE','الإمارات العربية المتحدة',
 'cat-frz-0001-0000-000000000010','منتجات مجمدة','Frozen Products','وجبات جاهزة مجمدة','Frozen Ready Meals',
 '1kg × 10', 28, 240, null, 10,'EAN-13', 12,'≤ −18 °C',
 ARRAY['ESMA','Halal','HACCP'],'1602.32','rising', 38,
 '🥙','طلب متصاعد في مطاعم الوجبات السريعة والمؤسسات','Rising demand from fast food restaurants and institutions',
 'registered_uae','local_trade',
 'الكبير فودز: مبيعات مباشرة مجمدة من المصنع', null, null, null,
 'B',63,7,8,65,'شاورما مجمدة متنامية — طلب مؤسسي متزايد في المطاعم','Growing frozen shawarma — increasing institutional restaurant demand',
 true),

-- p026 Samyang (UNREGISTERED)
('prod-p026-0000-0000-000000000026','samyang-buldak-ramen-140g',
 'سامي يانغ بلداك رامن 140g','Samyang Buldak Hot Chicken Ramen 140g','Samyang Foods',
 'South Korea','كوريا الجنوبية',
 'cat-cer-0001-0000-000000000003','حبوب ومنتجاتها','Cereals & Products','معكرونة ونودلز','Pasta & Noodles',
 '140g × 40', 9.0, 0, 62, 40,'EAN-13', 12,'15–25 °C',
 ARRAY['BFCA Korea','Halal (pending)'],'1902.30','shortage', 88,
 '🔥','أكثر رامن كوري مبيعاً على مستوى العالم — لا يوجد موزع رسمي في الإمارات حتى الآن','World''s best-selling Korean ramen — no official UAE distributor yet',
 'unregistered','direct_import',
 null, 12000, 4,
 ARRAY['تفويض رسمي من Samyang Foods كوريا','شهادة حلال من جهة إسلامية معترف بها','نتائج اختبارات مختبر ESMA','ملصق عربي وفق UAE.S 9:2019','شهادة المنشأ (COO) من كوريا','شهادة التحليل الغذائي (COA)'],
 'A',72,5,20,15,'سريع التداول عالمياً — محدودية التوزيع في الإمارات تكبح إمكاناته الفعلية','Fast-moving globally — limited UAE distribution caps its actual reach',
 true),

-- p027 Arizona Green Tea (UNREGISTERED)
('prod-p027-0000-0000-000000000027','arizona-green-tea-680ml',
 'أريزونا شاي أخضر بالعسل 680ml','Arizona Green Tea with Honey 680ml','Arizona Beverages USA',
 'USA','الولايات المتحدة الأمريكية',
 'cat-bev-0001-0000-000000000001','مشروبات','Beverages','شاي جاهز','Ready-to-Drink Tea',
 '680ml × 24', 6.0, 0, 75, 24,'EAN-13', 24,'4–25 °C',
 ARRAY['FDA Approved','Halal (pending)'],'2202.99','shortage', 72,
 '🧃','علامة أمريكية مطلوبة جداً من الجيل Z — لا يوجد موزع في الإمارات','High Gen-Z demand brand — zero official UAE distribution',
 'unregistered','direct_import',
 null, 15000, 5,
 ARRAY['تفويض رسمي من Arizona Beverages','شهادة حلال — المشروبات يجب فحص مكونات النكهة','اختبار نسبة الكافيين (إن وجد)','ملصق عربي وفق UAE.S 9:2019','شهادة المنشأ الأمريكية','شهادة تحليل كيميائي وميكروبيولوجي'],
 'A',78,3,24,5,'إقبال ضخم من Gen-Z عالمياً — غياب التوزيع الرسمي يخلق فجوة ضخمة','Massive Gen-Z global demand — absence of official distribution creates huge gap',
 true),

-- p028 Tao Kae Noi (UNREGISTERED)
('prod-p028-0000-0000-000000000028','tao-kae-noi-seaweed-32g',
 'تاو كاي نوي أعشاب بحرية مقرمشة 32g','Tao Kae Noi Crispy Seaweed 32g','Tao Kae Noi Food & Marketing',
 'Thailand','تايلاند',
 'cat-snk-0001-0000-000000000004','وجبات خفيفة وحلويات','Snacks & Confectionery','رقائق وشيبس','Chips & Crisps',
 '32g × 48', 5.0, 0, 90, 48,'EAN-13', 8,'15–25 °C',
 ARRAY['Thai FDA','Halal (Thailand)'],'2008.99','rising', 65,
 '🌿','وجبة خفيفة صحية ترندينغ — طلب متزايد من آسيويي الإمارات ومتاجر الأكل الصحي','Trending healthy snack — growing demand from UAE Asian community and health stores',
 'unregistered','direct_import',
 null, 10000, 3,
 ARRAY['تفويض رسمي من Tao Kae Noi','التحقق من شهادة الحلال التايلاندية (معترف بها في UAE؟)','ملصق عربي وفق UAE.S 9:2019','قائمة مكونات كاملة للفحص','شهادة منشأ تايلاند','شهادة تحليل غذائي'],
 'B',58,10,12,8,'وجبة خفيفة ترندينغ — سريع الحركة في آسيا، يكتسب زخماً في الإمارات','Trending snack — fast-moving in Asia, gaining momentum in UAE',
 true),

-- p029 Yemeni Sidr Honey (UNREGISTERED)
('prod-p029-0000-0000-000000000029','yemeni-sidr-honey-500g',
 'عسل السدر اليمني الأصيل 500g','Authentic Yemeni Sidr Honey 500g','Al-Rawdah Honey',
 'Yemen','اليمن',
 'cat-sug-0001-0000-000000000011','سكر وعسل وشيرة','Sugar, Honey & Syrup','عسل طبيعي','Natural Honey',
 '500g × 12', 180, 0, 900, 12,'EAN-13', 36,'10–25 °C',
 ARRAY['Yemen Authority Certified'],'0409.00','shortage', 95,
 '🍯','عسل سدر يمني أصيل — فجوة ضخمة بين الطلب والعرض، يُباع بأسعار خيالية في الإمارات','Authentic Yemeni Sidr — massive demand-supply gap, sells at premium in UAE',
 'unregistered','direct_import',
 null, 8000, 3,
 ARRAY['شهادة تحليل مختبري (نسبة الرطوبة، السكر، المضادات الحيوية)','شهادة منشأ يمنية موثقة','اختبار ESMA للعسل','ملصق عربي وفق UAE.S 9:2019','شهادة خلو من المضادات الحيوية','تفويض من المنتج'],
 'C',28,45,2,10,'منتج فاخر بطيء الحركة — هامش ربح عالٍ يعوض انخفاض التداول','Premium slow-mover — high profit margin compensates for low velocity',
 true)

ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  name_ar = EXCLUDED.name_ar, name_en = EXCLUDED.name_en,
  brand = EXCLUDED.brand,
  category_ar = EXCLUDED.category_ar, category_en = EXCLUDED.category_en,
  subcategory_ar = EXCLUDED.subcategory_ar, subcategory_en = EXCLUDED.subcategory_en,
  price_retail_aed = EXCLUDED.price_retail_aed,
  price_wholesale_aed = EXCLUDED.price_wholesale_aed,
  price_import_aed = EXCLUDED.price_import_aed,
  market_signal = EXCLUDED.market_signal,
  gap_score = EXCLUDED.gap_score,
  image_emoji = EXCLUDED.image_emoji,
  registration_status = EXCLUDED.registration_status,
  acquisition_type = EXCLUDED.acquisition_type,
  fmcg_class = EXCLUDED.fmcg_class,
  fmcg_score = EXCLUDED.fmcg_score,
  fmcg_turnover_days = EXCLUDED.fmcg_turnover_days,
  fmcg_weekly_units = EXCLUDED.fmcg_weekly_units,
  fmcg_penetration_pct = EXCLUDED.fmcg_penetration_pct,
  fmcg_note_ar = EXCLUDED.fmcg_note_ar,
  fmcg_note_en = EXCLUDED.fmcg_note_en,
  is_active = EXCLUDED.is_active;

-- ─── 4. MARKET SIGNALS (gap_alerts) ────────────────────────────
-- High-priority signals for shortage/rising products
INSERT INTO gap_alerts (
  id, product_id, alert_type, urgency,
  demand_score, supply_score, gap_score,
  details_ar, details_en,
  recommended_action_ar, recommended_action_en,
  detected_at, updated_at
) VALUES

-- Red Bull — highest gap (92)
('alrt-p002-0000-0000-000000000001',
 'prod-p002-0000-0000-000000000002',
 'shortage','high', 92,12,80,
 'نافد في نون وكارفور ٣ أسابيع، بحث Google +42% هذا الشهر، نقص واضح في محطات البنزين',
 'Out of stock on Noon & Carrefour 3 weeks, Google search +42% this month, clear shortage at petrol stations',
 'تواصل مع الموزع الرسمي أبوظبي الوطنية لتأمين كمية قبل الشحنة التالية',
 'Contact official distributor Abu Dhabi National Gas to secure stock before next shipment',
 now(), now()),

-- Yemeni Honey — gap 95
('alrt-p029-0000-0000-000000000002',
 'prod-p029-0000-0000-000000000029',
 'shortage','high', 95,5,90,
 'طلب خليجي ضخم، العرض صفر تقريباً في الإمارات، السعر يصل 2500 AED/kg في السوق الموازية',
 'Massive GCC demand, near-zero supply in UAE, price reaches 2500 AED/kg in grey market',
 'احصل على ترخيص استيراد واتفاق مع منتجي اليمن مباشرةً — فرصة وكيل حصري',
 'Secure import license and direct deal with Yemeni producers — exclusive agent opportunity',
 now(), now()),

-- Samyang Ramen — gap 88
('alrt-p026-0000-0000-000000000003',
 'prod-p026-0000-0000-000000000026',
 'shortage','high', 88,8,80,
 'Keyword Volume 8,200/شهر، غير مسجّل في الإمارات، يُباع في المتاجر الآسيوية بسعر 3× من الإنترنت',
 'Keyword Volume 8,200/month, not registered in UAE, sold in Asian stores at 3× internet price',
 'افحص متطلبات ESMA → قدّم طلب تسجيل كأول وكيل حصري في الإمارات',
 'Review ESMA requirements → apply as first exclusive UAE distributor',
 now(), now()),

-- Coca-Cola — shortage
('alrt-p001-0000-0000-000000000004',
 'prod-p001-0000-0000-000000000001',
 'shortage','high', 87,12,75,
 'نافد في نون وكارفور ٣ أسابيع، بحث Google +42% هذا الشهر',
 'Out of stock on Noon & Carrefour for 3 weeks, Google search +42% this month',
 'تواصل مع موزع إقليمي لتأمين كمية قبل الشحنة التالية',
 'Contact regional distributor to secure stock before next shipment',
 now(), now()),

-- Arizona Green Tea — gap 72
('alrt-p027-0000-0000-000000000005',
 'prod-p027-0000-0000-000000000027',
 'shortage','high', 85,13,72,
 'Keyword Volume 5,400/شهر، طلب Gen-Z ضخم، يُستورد بشكل غير رسمي فقط حالياً',
 'Keyword Volume 5,400/month, massive Gen-Z demand, currently only informally imported',
 'احصل على تفويض رسمي من Arizona Beverages وابدأ مسار التسجيل في ESMA',
 'Get official authorization from Arizona Beverages and start ESMA registration path',
 now(), now()),

-- Tao Kae Noi — gap 65
('alrt-p028-0000-0000-000000000006',
 'prod-p028-0000-0000-000000000028',
 'trend_rising','medium', 68,35,65,
 'مبيعات أمازون.ae +67% هذا الشهر، الجالية الآسيوية تبحث عنه باستمرار، لا يوجد مستودع محلي',
 'Amazon.ae sales +67% this month, Asian community searching constantly, no local stock',
 'استيراد مباشر من تايلاند وبيع للمتاجر الآسيوية أولاً لاختبار السوق',
 'Direct import from Thailand, sell to Asian stores first to test the market',
 now(), now()),

-- Uncle Bens Rice — gap 45
('alrt-p004-0000-0000-000000000007',
 'prod-p004-0000-0000-000000000004',
 'trend_rising','medium', 74,55,19,
 'بحث Google +38% أسبوعين، رمضان قادم، أعلى مبيعاً نون هذا الشهر',
 'Google search +38% for 2 weeks, Ramadan approaching, #1 bestseller on Noon this month',
 'بدء تخزين استراتيجي — السعر سيرتفع خلال ٣ أسابيع',
 'Start strategic stockpiling — price will rise within 3 weeks',
 now(), now()),

-- Al Kabeer Shawarma — gap 38
('alrt-p025-0000-0000-000000000008',
 'prod-p025-0000-0000-000000000025',
 'trend_rising','medium', 68,48,20,
 'مبيعات المطاعم +35% هذا الشهر، مخزون لولو ينخفض بسرعة، موسم المدارس قادم',
 'Restaurant sales +35% this month, Lulu stock dropping fast, school season approaching',
 'زد الطلب الشهري 20% واتفق مع المطاعم على عقد توريد سنوي',
 'Increase monthly order 20% and negotiate annual supply contracts with restaurants',
 now(), now())

ON CONFLICT (id) DO UPDATE SET
  demand_score = EXCLUDED.demand_score,
  supply_score = EXCLUDED.supply_score,
  gap_score = EXCLUDED.gap_score,
  details_ar = EXCLUDED.details_ar,
  details_en = EXCLUDED.details_en,
  recommended_action_ar = EXCLUDED.recommended_action_ar,
  recommended_action_en = EXCLUDED.recommended_action_en,
  updated_at = now();

-- ─── Done ───────────────────────────────────────────────────────
SELECT 'Seed complete: ' || count(*) || ' products' FROM products;
