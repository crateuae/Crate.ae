-- ─── packaging_primary_packs ────────────────────────────────────────────────
create table if not exists packaging_primary_packs (
  id           uuid primary key default gen_random_uuid(),
  type         text not null,           -- 'bag' | 'bottle' | 'jar' | 'box' | 'pouch' | 'can'
  type_ar      text not null,
  type_en      text not null,
  icon         text not null default '📦',
  size_label   text not null,           -- '1kg', '500ml'
  size_value   numeric not null,        -- numeric size in kg or L
  unit         text not null default 'kg',  -- 'kg' | 'L'
  cost_aed     numeric not null default 0,
  material_ar  text not null default '',
  material_en  text not null default '',
  suitable_for_ar text not null default '',
  suitable_for_en text not null default '',
  is_active    boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

alter table packaging_primary_packs enable row level security;
create policy "public read primary packs" on packaging_primary_packs for select using (true);
create policy "admin all primary packs"   on packaging_primary_packs for all
  using (auth.role() = 'service_role');

-- ─── packaging_master_cartons ────────────────────────────────────────────────
create table if not exists packaging_master_cartons (
  id                 uuid primary key default gen_random_uuid(),
  name_ar            text not null,
  name_en            text not null,
  icon               text not null default '📦',
  l_cm               numeric not null,
  w_cm               numeric not null,
  h_cm               numeric not null,
  max_weight_kg      numeric not null,
  default_units      int not null default 12,
  cartons_per_pallet int not null default 40,
  flute_ar           text not null default '',
  flute_en           text not null default '',
  cost_aed           numeric not null default 0,
  suitable_for_ar    text not null default '',
  suitable_for_en    text not null default '',
  is_active          boolean not null default true,
  sort_order         int not null default 0,
  created_at         timestamptz not null default now()
);

alter table packaging_master_cartons enable row level security;
create policy "public read cartons" on packaging_master_cartons for select using (true);
create policy "admin all cartons"   on packaging_master_cartons for all
  using (auth.role() = 'service_role');

-- ─── packaging_options ───────────────────────────────────────────────────────
create table if not exists packaging_options (
  id           uuid primary key default gen_random_uuid(),
  label_ar     text not null,
  label_en     text not null,
  carton_mult  numeric not null default 1,
  per_unit_add numeric not null default 0,
  setup_aed    numeric not null default 0,
  is_active    boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

alter table packaging_options enable row level security;
create policy "public read options" on packaging_options for select using (true);
create policy "admin all options"   on packaging_options for all
  using (auth.role() = 'service_role');

-- ─── Seed: Primary Packs ─────────────────────────────────────────────────────
insert into packaging_primary_packs (type,type_ar,type_en,icon,size_label,size_value,unit,cost_aed,material_ar,material_en,suitable_for_ar,suitable_for_en,sort_order) values
  ('bag','كيس','Bag','👜','100g',0.1,'kg',0.25,'بولي بروبيلين / لامينيت','PP / Laminate','توابل، قهوة مطحونة','Spices, ground coffee',10),
  ('bag','كيس','Bag','👜','250g',0.25,'kg',0.30,'بولي بروبيلين / لامينيت','PP / Laminate','توابل، شاي، مكسرات','Spices, tea, nuts',20),
  ('bag','كيس','Bag','👜','500g',0.5,'kg',0.40,'بولي بروبيلين منسوج','PP Woven','أرز، سكر، دقيق','Rice, sugar, flour',30),
  ('bag','كيس','Bag','🛍️','1kg',1,'kg',0.55,'بولي بروبيلين منسوج','PP Woven','أرز، سكر، دقيق، بقوليات','Rice, sugar, flour, legumes',40),
  ('bag','كيس','Bag','🛍️','2kg',2,'kg',0.75,'بولي بروبيلين منسوج','PP Woven','أرز، حبوب، دقيق','Rice, grains, flour',50),
  ('bag','كيس','Bag','🛍️','5kg',5,'kg',1.30,'بولي بروبيلين منسوج','PP Woven','أرز، دقيق، حبوب خشنة','Rice, flour, coarse grains',60),
  ('bag','كيس','Bag','🧺','10kg',10,'kg',2.00,'بولي بروبيلين منسوج','PP Woven','أرز، دقيق، أعلاف','Rice, flour, feed',70),
  ('bottle','زجاجة','Bottle','🍶','500ml',0.5,'L',1.00,'PET','PET','زيوت، عصائر، مياه','Oils, juices, water',80),
  ('bottle','زجاجة','Bottle','🍶','1L',1,'L',1.50,'PET','PET','زيوت، عصائر، مياه','Oils, juices, water',90),
  ('jar','برطمان','Jar','🫙','500g',0.5,'kg',1.60,'PET / زجاج','PET / Glass','معجونات، مربى، عسل','Pastes, jam, honey',100),
  ('box','علبة','Box','📦','1kg',1,'kg',2.80,'كرتون مطبوع','Printed carton','حبوب للإفطار، منتجات مصنّعة','Cereal, processed foods',110)
on conflict do nothing;

-- ─── Seed: Master Cartons (UAE market corrected dimensions) ──────────────────
insert into packaging_master_cartons (name_ar,name_en,icon,l_cm,w_cm,h_cm,max_weight_kg,default_units,cartons_per_pallet,flute_ar,flute_en,cost_aed,suitable_for_ar,suitable_for_en,sort_order) values
  ('كرتون صغير','Small Carton','📦',30,20,20,12,12,80,'مموج B (جدار مفرد)','B-flute (single wall)',3.5,'علب معلبة، منتجات خفيفة','Canned goods, lightweight products',10),
  ('كرتون متوسط','Medium Carton','📦',40,30,30,20,24,50,'مموج C (جدار مفرد)','C-flute (single wall)',5.0,'عبوات زجاجية، زجاجات بلاستيك','Glass jars, plastic bottles',20),
  ('كرتون كبير','Large Carton','🗃️',50,40,40,30,36,30,'مموج BC (جدار مزدوج)','BC-flute (double wall)',7.5,'معلبات ثقيلة، زيوت، حبوب','Heavy cans, oils, grains',30),
  ('كرتون كبير جداً XL','XL Carton','🗃️',60,40,40,40,48,24,'مموج BC (جدار مزدوج)','BC-flute (double wall)',10.5,'أجهزة صغيرة، منتجات ثقيلة','Small appliances, heavy products',40),
  ('صندوق عفش صغير','Moving Box S','📫',45,45,45,25,1,20,'مموج BC (جدار مزدوج)','BC-flute (double wall)',12.0,'نقل عفش، أغراض منزلية','Moving, household items',50),
  ('صندوق عفش متوسط','Moving Box M','📫',60,45,45,30,1,16,'مموج BC (جدار مزدوج)','BC-flute (double wall)',15.0,'نقل عفش، أغراض منزلية','Moving, household items',60),
  ('صندوق عفش كبير','Moving Box L','📫',60,60,60,35,1,12,'مموج BC (جدار مزدوج)','BC-flute (double wall)',18.0,'نقل عفش، أغراض كبيرة الحجم','Moving, bulky items',70)
on conflict do nothing;

-- ─── Seed: Packaging Options ─────────────────────────────────────────────────
insert into packaging_options (label_ar,label_en,carton_mult,per_unit_add,setup_aed,sort_order) values
  ('جدار مزدوج (Double Wall)','Double Wall',1.30,0,0,10),
  ('100% قابل لإعادة التدوير','100% Recyclable',1.10,0,0,20),
  ('مبطّن غذائي (Food Grade)','Food-Grade Liner',1.05,0.05,0,30),
  ('مقاوم للرطوبة','Moisture Resistant',1.08,0,0,40),
  ('طباعة مخصصة (لوغو/ليبل)','Custom Print',1.15,0.08,1200,50)
on conflict do nothing;
