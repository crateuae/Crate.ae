-- ═══════════════════════════════════════════════════════════════════════════
-- Crate · partner_orders  — the dropship / commission ledger.
-- Run in Supabase SQL Editor for the CRATE project ONLY: ffaqjittonurtiggwxml
-- (do NOT run on Art for Printing / Sensuss / any other project).
-- Idempotent: safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists public.partner_orders (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  partner          text not null default 'art_for_printing',
  crate_request_id text,                       -- idempotency key echoed to AFP
  afp_ref          text not null,              -- AFP order number (AFP-YYYYMMDD-####)
  afp_order_id     text,                       -- AFP orders.id (uuid, as text)
  product_slug     text,
  quantity         int  not null default 1,
  spec             jsonb not null default '{}'::jsonb,
  buyer_name       text,
  buyer_email      text,
  buyer_phone      text,
  buyer_address    text,
  buyer_company    text,
  currency         text not null default 'AED',
  afp_total_aed    numeric(12,2) not null default 0,  -- what the buyer pays AFP
  commission_pct   numeric(5,2)  not null default 15, -- Crate's cut
  commission_aed   numeric(12,2) not null default 0,
  status           text not null default 'pending',   -- mirrors AFP order status
  source_page      text,
  compliance_product text,
  artwork_stored   boolean not null default false
);

create unique index if not exists uq_partner_orders_afp_ref     on public.partner_orders(afp_ref);
create index        if not exists idx_partner_orders_crate_req   on public.partner_orders(crate_request_id);
create index        if not exists idx_partner_orders_status      on public.partner_orders(status);
create index        if not exists idx_partner_orders_created     on public.partner_orders(created_at desc);

-- keep updated_at fresh on status writes (self-contained function; no collision)
create or replace function public.partner_orders_touch() returns trigger as $$
begin new.updated_at = now(); return new; end $$ language plpgsql;
drop trigger if exists trg_partner_orders_touch on public.partner_orders;
create trigger trg_partner_orders_touch before update on public.partner_orders
  for each row execute function public.partner_orders_touch();

-- Server-only: RLS on, no public policy → only the service-role key (our API) can
-- read/write. The dashboard reads through the service-role admin client.
alter table public.partner_orders enable row level security;
