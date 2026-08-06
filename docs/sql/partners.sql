-- ═══════════════════════════════════════════════════════════════════════════
-- Crate · partners — curated business partners (distinct from the 47k `providers`
-- directory). A partner is a formal relationship: full KYC, a detail page, a
-- (future) login account, a public page, and — for fulfillment partners like Art
-- for Printing — dropship orders + commission.
-- Run on the CRATE project ONLY: ffaqjittonurtiggwxml. Idempotent.
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  provider_id uuid,                                 -- origin provider (if converted); null if created directly
  name_en text not null,
  name_ar text,
  slug text,                                        -- public page slug
  -- KYC / legal
  trade_license_no text,
  trade_license_type text,
  trade_license_expiry date,
  trade_license_url text,                           -- uploaded document (future)
  trn text,                                         -- tax registration number
  -- contact
  phone text,
  email text,
  website text,
  emirate text,
  address text,
  -- offering
  services text,
  materials text,
  description text,
  logo_url text,
  -- relationship
  is_fulfillment boolean not null default false,    -- true = dropship/print partner (Art for Printing)
  commission_pct numeric(5,2) default 15,
  status text not null default 'active',            -- active | pending | paused
  public_published boolean not null default false,  -- is the public partner page live?
  account_email text,                               -- login identity (self-service, future phase)
  notes text
);
create unique index if not exists uq_partners_slug on public.partners(slug) where slug is not null;
create index if not exists idx_partners_provider on public.partners(provider_id);
create index if not exists idx_partners_status on public.partners(status);

create or replace function public.partners_touch() returns trigger as $$
begin new.updated_at = now(); return new; end $$ language plpgsql;
drop trigger if exists trg_partners_touch on public.partners;
create trigger trg_partners_touch before update on public.partners
  for each row execute function public.partners_touch();

alter table public.partners enable row level security;

-- Link dropship orders to a partner (nullable; AFP is the only fulfiller today).
alter table public.partner_orders add column if not exists partner_id uuid;

-- Seed Art for Printing as the fulfillment partner.
insert into public.partners (name_en, name_ar, slug, website, is_fulfillment, commission_pct, status, public_published, description, services)
select 'Art for Printing', 'آرت للطباعة', 'art-for-printing', 'https://www.artforprinting.ae',
       true, 15, 'active', false,
       'Label & short-run digital printing partner (dropship).',
       'Self-adhesive labels, stickers, shrink sleeves, short-run digital label printing'
where not exists (select 1 from public.partners where slug = 'art-for-printing');
