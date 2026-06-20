-- ════════════════════════════════════════════════════════════════════════════
--  CRATE ORGANISM — NERVOUS SYSTEM (Phase 1: The Spine)
--  Autonomous Growth Organism · الجهاز العصبي للكائن ذاتي النمو
--
--  PURPOSE: One central entity ("opportunity") that flows through a pipeline,
--  connecting the radar (trend_discoveries, gap_alerts) → scoring → publish →
--  capture → conversion → learning. Every existing dashboard becomes a window
--  onto this one spine instead of an isolated island.
--
--  SAFETY: 100% ADDITIVE. No existing table is touched. All references are
--  nullable FKs (ON DELETE SET NULL / CASCADE only on this system's own rows).
--  RLS enabled on every new table (service-role-only access by default).
--  Run this whole file once in the Supabase SQL Editor.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1. opportunities — THE SPINE (central entity) ──────────────────────────
create table if not exists public.opportunities (
  id                  uuid primary key default gen_random_uuid(),

  -- identity
  title               text not null,                 -- keyword / product name (EN)
  title_ar            text,
  dedup_hash          text not null unique,          -- IMMUNE: blocks duplicates

  -- source linkage (additive — connects to existing entities, all nullable)
  source              text not null
                        check (source in ('radar_discovery','gap_alert','product_trend','manual')),
  source_ref_id       uuid,                          -- trend_discoveries.id / gap_alerts.id
  product_id          uuid references public.products(id) on delete set null,
  category_guess      text,
  is_registered       boolean default false,         -- registered (gap) vs unregistered (discovery)

  -- pipeline stage — the blood flow through the spine
  stage               text not null default 'sensed'
                        check (stage in ('sensed','scored','approved','published',
                                         'capturing','converting','won','lost','dismissed')),
  stage_changed_at    timestamptz default now(),

  -- brain — scoring breakdown (0-100 each)
  trend_score         int default 0,
  registrability_score int default 0,
  arbitrage_score     int default 0,
  gap_score           int default 0,
  composite_score     int default 0,
  score_weights       jsonb,                         -- snapshot of weights used (learning audit)

  -- market context
  is_available_uae    boolean,
  avg_price_aed       numeric,
  trend_direction     text,

  -- hands — publish output
  published_url       text,
  published_at        timestamptz,

  -- immune system
  quality_score       int default 0,
  blocked_reason      text,

  -- capture + outcome (learning loop writes these from real data)
  views               int default 0,
  rfq_count           int default 0,
  deals_count         int default 0,
  last_outcome_at     timestamptz,

  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create index if not exists opportunities_stage_idx     on public.opportunities(stage, composite_score desc);
create index if not exists opportunities_source_idx     on public.opportunities(source);
create index if not exists opportunities_product_idx    on public.opportunities(product_id);
create index if not exists opportunities_created_idx    on public.opportunities(created_at desc);

-- ─── 2. opportunity_events — THE MEMORY (audit trail / nerve signals) ────────
create table if not exists public.opportunity_events (
  id              uuid primary key default gen_random_uuid(),
  opportunity_id  uuid references public.opportunities(id) on delete cascade,
  event_type      text not null,        -- sensed|scored|stage_change|published|capture|conversion|learning|blocked
  from_stage      text,
  to_stage        text,
  payload         jsonb default '{}',
  created_at      timestamptz default now()
);

create index if not exists opportunity_events_opp_idx  on public.opportunity_events(opportunity_id, created_at desc);
create index if not exists opportunity_events_type_idx on public.opportunity_events(event_type, created_at desc);

-- ─── 3. scoring_weights — THE TUNABLE MIND (learning loop adjusts this) ──────
create table if not exists public.scoring_weights (
  id                  uuid primary key default gen_random_uuid(),
  version             int not null,
  weights             jsonb not null,        -- {"trend":0.40,"registrability":0.20,"arbitrage":0.25,"gap":0.15}
  approve_threshold   int not null default 60,
  quality_threshold   int not null default 50,
  daily_publish_cap   int not null default 10, -- IMMUNE: rate governor (anti scaled-content)
  is_active           boolean default true,
  prediction_accuracy numeric,                -- set by learning loop from real outcomes
  notes               text,
  created_at          timestamptz default now()
);

-- Seed the initial brain (v1). The learning loop will insert v2, v3... over time.
insert into public.scoring_weights (version, weights, approve_threshold, quality_threshold, daily_publish_cap, is_active, notes)
select 1,
       '{"trend":0.40,"registrability":0.20,"arbitrage":0.25,"gap":0.15}'::jsonb,
       60, 50, 10, true,
       'Genesis weights — balanced. Learning loop re-weights from real traffic/RFQ/deals.'
where not exists (select 1 from public.scoring_weights);

-- ─── 4. Row Level Security (locked to service role by default) ───────────────
-- Service role bypasses RLS; with no public policy these tables are admin-only,
-- matching the platform's security-advisor posture. Dashboard reads go through
-- API routes that use the service-role key.
alter table public.opportunities      enable row level security;
alter table public.opportunity_events enable row level security;
alter table public.scoring_weights    enable row level security;

-- ─── 5. updated_at trigger for opportunities ────────────────────────────────
create or replace function public.touch_opportunity_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_opportunity on public.opportunities;
create trigger trg_touch_opportunity
  before update on public.opportunities
  for each row execute function public.touch_opportunity_updated_at();

-- ════════════════════════════════════════════════════════════════════════════
--  Done. The spine exists. Next: the heartbeat cron feeds it (SENSE + SCORE).
-- ════════════════════════════════════════════════════════════════════════════
