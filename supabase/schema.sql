-- ============================================================
-- CRATE — Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ─── Product Categories ─────────────────────────────────────
create table product_categories (
  id uuid primary key default uuid_generate_v4(),
  name_ar text not null,
  name_en text not null,
  slug text not null unique,
  created_at timestamptz default now()
);

-- ─── Product Brands ─────────────────────────────────────────
create table product_brands (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  logo_url text,
  country text,
  created_at timestamptz default now()
);

-- ─── Products ───────────────────────────────────────────────
create table products (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  category_id uuid references product_categories(id),
  brand_id uuid references product_brands(id),
  name_ar text not null,
  name_en text not null,
  type_ar text not null,
  type_en text not null,
  size_ar text,
  size_en text,
  description_ar text,
  description_en text,
  price_aed numeric(10,2),
  price_on_request boolean default false,
  images text[] default '{}',
  barcode text,
  hs_code text,
  country_origin text,
  product_class text, -- food_general, beverage_energy, etc.
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index on products using gin(to_tsvector('arabic', name_ar));
create index on products using gin(to_tsvector('english', name_en));

-- ─── Market Signals ─────────────────────────────────────────
create table market_signals (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade,
  signal_type text not null check (signal_type in ('demand', 'supply')),
  source text not null,
  value numeric(10,2) not null,
  metadata jsonb default '{}',
  recorded_at timestamptz default now()
);

create index on market_signals(product_id, signal_type, recorded_at desc);

-- ─── Gap Alerts ─────────────────────────────────────────────
create table gap_alerts (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade,
  alert_type text not null check (alert_type in ('shortage', 'arbitrage', 'trend_rising', 'trend_falling', 'balanced')),
  demand_score numeric(5,2),
  supply_score numeric(5,2),
  gap_score numeric(5,2),
  urgency text check (urgency in ('high', 'medium', 'low')),
  details_ar text,
  details_en text,
  recommended_action_ar text,
  recommended_action_en text,
  is_active boolean default true,
  detected_at timestamptz default now()
);

create index on gap_alerts(product_id, is_active, detected_at desc);

-- ─── Compliance Rules ────────────────────────────────────────
create table compliance_rules (
  id uuid primary key default uuid_generate_v4(),
  product_class text not null,
  standard_ref text not null,
  clause text not null,
  requirement_ar text not null,
  requirement_en text not null,
  field_to_check text,
  is_mandatory boolean default true,
  created_at timestamptz default now()
);

-- ─── Compliance Checks (history) ────────────────────────────
create table compliance_checks (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  product_class text not null,
  input_data jsonb,
  result jsonb not null,
  verdict text check (verdict in ('registerable', 'not_registerable', 'needs_review')),
  missing_count int default 0,
  checked_at timestamptz default now()
);

-- ─── Packaging Plans ────────────────────────────────────────
create table packaging_plans (
  id uuid primary key default uuid_generate_v4(),
  mode text not null check (mode in ('repack', 'basket_single', 'basket_mix')),
  input_data jsonb not null,
  output_data jsonb not null,
  brand_name text,
  label_generated boolean default false,
  created_at timestamptz default now()
);

-- ─── Providers ──────────────────────────────────────────────
create table providers (
  id uuid primary key default uuid_generate_v4(),
  name_ar text not null,
  name_en text not null,
  license_no text,
  category text not null,
  subcategory text,
  phone text,
  email text,
  website text,
  city text,
  is_verified boolean default false,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ─── Articles ───────────────────────────────────────────────
create table articles (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  title_ar text not null,
  title_en text not null,
  body_ar text not null,
  body_en text not null,
  image_url text,
  tags text[] default '{}',
  is_published boolean default false,
  published_at timestamptz,
  created_at timestamptz default now()
);

-- ─── Companies ──────────────────────────────────────────────
create table companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text,
  phone text,
  industry text,
  city text,
  country text default 'AE',
  notes text,
  created_at timestamptz default now()
);

-- ─── Email Campaigns ────────────────────────────────────────
create table email_campaigns (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  content_mode text not null default 'ai_draft' check (content_mode in ('ai_auto', 'ai_draft', 'manual')),
  daily_cap int default 50,
  throttle_minutes int default 5,
  sent_today int default 0,
  recipient_emails jsonb default '[]',
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ─── Campaign Steps ─────────────────────────────────────────
create table campaign_steps (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references email_campaigns(id) on delete cascade,
  step_index int not null,
  subject_ar text not null,
  subject_en text not null,
  prompt_ar text not null,
  prompt_en text not null,
  body_ar text,
  body_en text,
  delay_days int default 0,
  created_at timestamptz default now(),
  unique(campaign_id, step_index)
);

-- ─── Email Threads ──────────────────────────────────────────
create table email_threads (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references email_campaigns(id) on delete cascade,
  company_id uuid references companies(id) on delete set null,
  email text not null,
  status text not null default 'pending' check (status in ('pending','draft','sent','replied','converted','bounced','unsubscribed')),
  sequence_step int default 0,
  last_sent_at timestamptz,
  created_at timestamptz default now()
);

-- ─── Email Messages ─────────────────────────────────────────
create table email_messages (
  id uuid primary key default uuid_generate_v4(),
  thread_id uuid references email_threads(id) on delete cascade,
  direction text not null check (direction in ('outbound','inbound','draft')),
  subject text not null,
  body_text text not null,
  body_html text,
  message_id text unique,
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- ─── Quote Requests ─────────────────────────────────────────
create table quote_requests (
  id uuid primary key default uuid_generate_v4(),
  items jsonb not null default '[]',
  company_name text not null,
  email text not null,
  phone text,
  notes text,
  status text default 'new' check (status in ('new','reviewing','quoted','closed')),
  created_at timestamptz default now()
);

-- ─── Page Views ─────────────────────────────────────────────
create table page_views (
  id uuid primary key default uuid_generate_v4(),
  path text not null,
  visitor_id text not null,
  lang text default 'en',
  referrer text,
  created_at timestamptz default now()
);

create index on page_views(visitor_id, created_at desc);
create index on page_views(path, created_at desc);

-- ─── Profiles ───────────────────────────────────────────────
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text default 'user' check (role in ('user','admin')),
  created_at timestamptz default now()
);

-- ─── RLS Policies ───────────────────────────────────────────

-- Products: public read, admin write
alter table products enable row level security;
create policy "public read products" on products for select using (is_active = true);
create policy "admin all products" on products for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Categories/Brands: public read
alter table product_categories enable row level security;
create policy "public read categories" on product_categories for select using (true);

alter table product_brands enable row level security;
create policy "public read brands" on product_brands for select using (true);

-- Market signals: admin only
alter table market_signals enable row level security;
create policy "admin all signals" on market_signals for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Gap alerts: admin only
alter table gap_alerts enable row level security;
create policy "admin all alerts" on gap_alerts for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Compliance: public check (insert), admin read all
alter table compliance_checks enable row level security;
create policy "public insert compliance" on compliance_checks for insert with check (true);
create policy "admin read compliance" on compliance_checks for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Compliance rules: public read
alter table compliance_rules enable row level security;
create policy "public read rules" on compliance_rules for select using (true);

-- Packaging plans: admin only
alter table packaging_plans enable row level security;
create policy "admin all packaging" on packaging_plans for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Providers: public read
alter table providers enable row level security;
create policy "public read providers" on providers for select using (is_active = true);
create policy "admin all providers" on providers for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Articles: public read published
alter table articles enable row level security;
create policy "public read articles" on articles for select using (is_published = true);
create policy "admin all articles" on articles for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Companies: admin only
alter table companies enable row level security;
create policy "admin all companies" on companies for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Campaigns, Steps, Threads, Messages: admin only
alter table email_campaigns enable row level security;
create policy "admin all campaigns" on email_campaigns for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
alter table campaign_steps enable row level security;
create policy "admin all steps" on campaign_steps for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
alter table email_threads enable row level security;
create policy "admin all threads" on email_threads for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
alter table email_messages enable row level security;
create policy "admin all messages" on email_messages for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Quote requests: public insert, admin read
alter table quote_requests enable row level security;
create policy "public insert quotes" on quote_requests for insert with check (true);
create policy "admin read quotes" on quote_requests for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Page views: deny all public, service role writes
alter table page_views enable row level security;
create policy "service role only" on page_views for all using (false);

-- Profiles: self read
alter table profiles enable row level security;
create policy "self read profile" on profiles for select using (auth.uid() = id);
create policy "admin read profiles" on profiles for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- ─── Trigger: auto-create profile ───────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case when new.email = any(string_to_array(current_setting('app.admin_emails', true), ','))
      then 'admin' else 'user' end
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Seed: UAE Compliance Rules ─────────────────────────────
insert into compliance_rules (product_class, standard_ref, clause, requirement_en, requirement_ar, field_to_check, is_mandatory) values
-- General food labeling (UAE.S 9:2019)
('food_general','UAE.S 9:2019','7.2.1','Product name must appear on label','يجب أن يظهر اسم المنتج على البطاقة','label_product_name',true),
('food_general','UAE.S 9:2019','7.2.1','Production and expiry dates must be in Arabic','يجب أن تكون تواريخ الإنتاج والانتهاء باللغة العربية','dates_in_arabic',true),
('food_general','UAE.S 9:2019','7.2.1','Storage conditions must be in Arabic','يجب أن تكون ظروف التخزين باللغة العربية','storage_in_arabic',true),
('food_general','UAE.S 9:2019','7.2.1','Nutrition facts must be in Arabic','يجب أن تكون الحقائق الغذائية باللغة العربية','nutrition_in_arabic',true),
('food_general','UAE.S 9:2019','5.2.4','E-number of sulfites must be declared if present','يجب الإعلان عن رقم E للسلفايت إذا كان موجوداً','sulfites_declared',true),
('food_general','UAE.S 9:2019','7.1','Country of origin must be stated','يجب ذكر بلد المنشأ','country_of_origin',true),
('food_general','UAE.S 9:2019','7.2.1','Net weight must be stated in metric units','يجب ذكر الوزن الصافي بالوحدات المترية','net_weight',true),
('food_general','UAE.S 9:2019','5.1','Ingredients list must be in Arabic','يجب أن تكون قائمة المكونات باللغة العربية','ingredients_in_arabic',true),
-- Energy drinks (UAE.S 1926:2015)
('beverage_energy','UAE.S 1926:2015','3.1','Product name on label must be "مشروب طاقة" (Energy Drink)','يجب أن يكون اسم المنتج على البطاقة "مشروب طاقة"','label_product_name',true),
('beverage_energy','UAE.S 1926:2015','8.1','All warnings must be preceded by "تحذير صحي"','يجب أن تسبق جميع التحذيرات عبارة "تحذير صحي"','health_warning_prefix',true),
('beverage_energy','UAE.S 1926:2015','8.1.1','Must include health warning for pregnant women, nursing mothers, under-16s, caffeine-sensitive, heart conditions','يجب إضافة التحذير الصحي للحوامل والمرضعات والأشخاص دون 16 سنة وذوي الحساسية للكافيين وأمراض القلب','health_warnings_groups',true),
('beverage_energy','UAE.S 1926:2015','8.1.2','Must warn that excessive consumption may reduce sleep ability','يجب إضافة تحذير بأن الاستهلاك المفرط قد يقلل القدرة على النوم','sleep_warning',true),
('beverage_energy','UAE.S 1926:2015','8.1.3','If caffeine > 150mg/L: must state "محتوى كافيين مرتفع"','إذا كان الكافيين أكثر من 150mg/L يجب إضافة "محتوى كافيين مرتفع"','high_caffeine_label',true),
('beverage_energy','UAE.S 1926:2015','8.1.4','Must state maximum daily consumption in cans or ml','يجب توضيح الحد الأقصى للاستهلاك اليومي بالعلب أو بالملليلتر','max_daily_consumption',true),
-- General beverages
('beverage_general','UAE.S 9:2019','7.2.1','Production and expiry dates must be in Arabic','تواريخ الإنتاج والانتهاء بالعربية','dates_in_arabic',true),
('beverage_general','UAE.S 9:2019','7.2.1','Nutrition facts must be in Arabic','الحقائق الغذائية بالعربية','nutrition_in_arabic',true),
-- Dairy
('dairy','UAE.S 9:2019','7.2.1','Fat content percentage must be declared','يجب الإعلان عن نسبة الدهون','fat_content',true),
('dairy','UAE.S 9:2019','7.2.1','Storage temperature must be specified in Arabic','يجب تحديد درجة حرارة التخزين بالعربية','storage_temp_arabic',true);

-- ─── Seed: Product Categories ────────────────────────────────
insert into product_categories (name_ar, name_en, slug) values
('مشروبات','Beverages','beverages'),
('حبوب وبقوليات','Grains & Legumes','grains-legumes'),
('زيوت ودهون','Oils & Fats','oils-fats'),
('منتجات الألبان','Dairy Products','dairy'),
('وجبات خفيفة وحلويات','Snacks & Confectionery','snacks-confectionery'),
('منتجات مجمدة','Frozen Products','frozen'),
('توابل وصلصات','Spices & Sauces','spices-sauces');
