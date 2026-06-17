-- ============================================================
-- Providers Migration — Extend table for UAE company import
-- Run in Supabase SQL Editor (project ffaqjittonurtiggwxml)
-- ============================================================

-- 1. Add new columns to existing providers table
alter table providers
  add column if not exists slug          text unique,
  add column if not exists type          text default 'trader'
                             check (type in ('trader','repackager')),
  add column if not exists emirate       text,
  add column if not exists license_status text,
  add column if not exists license_type  text,
  add column if not exists issue_date    date,
  add column if not exists expiry_date   date,
  add column if not exists source_dataset text,
  add column if not exists source_url    text;

-- 2. Indexes for fast filtering + search
create index if not exists providers_slug_idx     on providers(slug);
create index if not exists providers_emirate_idx  on providers(emirate);
create index if not exists providers_type_idx     on providers(type);
create index if not exists providers_category_idx on providers(category);
create index if not exists providers_status_idx   on providers(license_status);

-- 3. Full-text search column (Arabic + English combined)
alter table providers
  add column if not exists fts tsvector
    generated always as (
      setweight(to_tsvector('simple', coalesce(name_en, '')), 'A') ||
      setweight(to_tsvector('simple', coalesce(name_ar, '')), 'A') ||
      setweight(to_tsvector('simple', coalesce(category, '')), 'B') ||
      setweight(to_tsvector('simple', coalesce(emirate,  '')), 'C')
    ) stored;

create index if not exists providers_fts_idx on providers using gin(fts);

-- 4. RLS — allow public read (same as products)
alter table providers enable row level security;

drop policy if exists "providers_public_read" on providers;
create policy "providers_public_read" on providers
  for select using (is_active = true);

-- 5. Update existing 10 static providers to have slugs & type
update providers set
  type    = 'repackager',
  emirate = 'Dubai',
  slug    = 'gulf-pack-solutions'
where name_en = 'Gulf Pack Solutions' and slug is null;

update providers set
  type    = 'repackager',
  emirate = 'Sharjah',
  slug    = 'emirates-repack-co'
where name_en = 'Emirates Repack Co.' and slug is null;

-- (remaining static records will be handled on import)
