-- ============================================================
-- CRATE.AE — PROVIDER NETWORK v2
-- Fixes category filter + admin pagination, and lays the
-- tracking spine (provider_events + counters).
-- Run once in Supabase SQL Editor (project ffaqjittonurtiggwxml).
-- Fully additive / idempotent — safe to re-run.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. get_providers v2 — public listing + category_counts
--    (the public /providers page already calls this signature)
--    Drop any older overload first so the name stays unambiguous.
-- ─────────────────────────────────────────────────────────────
drop function if exists get_providers(text, text, text, int, int);
drop function if exists get_providers(text, text, text, text, int, int);

create or replace function get_providers(
  p_type     text default null,
  p_emirate  text default null,
  p_query    text default null,
  p_category text default null,
  p_from     int  default 0,
  p_to       int  default 23
)
returns json
language plpgsql
security definer
stable
as $$
declare
  v_rows           json;
  v_total          bigint;
  v_traders        bigint;
  v_repack         bigint;
  v_category_counts json;
begin
  -- Paginated rows (honours every active filter)
  select json_agg(row_to_json(t)) into v_rows
  from (
    select id, slug, name_ar, name_en, type, category, categories,
           emirate, license_no, issue_date, is_verified
    from providers
    where is_active = true
      and (p_type     is null or type     = p_type)
      and (p_emirate  is null or emirate  = p_emirate)
      and (p_category is null or category = p_category)
      and (p_query    is null or fts @@ websearch_to_tsquery('simple', p_query))
    order by is_verified desc, name_en asc
    limit  (p_to - p_from + 1)
    offset p_from
  ) t;

  -- Total under the same filters
  select count(*) into v_total
  from providers
  where is_active = true
    and (p_type     is null or type     = p_type)
    and (p_emirate  is null or emirate  = p_emirate)
    and (p_category is null or category = p_category)
    and (p_query    is null or fts @@ websearch_to_tsquery('simple', p_query));

  -- Type badges (independent of type filter)
  select count(*) into v_traders from providers where is_active = true and type = 'trader';
  select count(*) into v_repack  from providers where is_active = true and type = 'repackager';

  -- Category counts within the current type+emirate+query context
  -- (ignores the category filter so chips stay clickable)
  select json_object_agg(category, c) into v_category_counts
  from (
    select category, count(*) c
    from providers
    where is_active = true
      and category is not null
      and (p_type    is null or type    = p_type)
      and (p_emirate is null or emirate = p_emirate)
      and (p_query   is null or fts @@ websearch_to_tsquery('simple', p_query))
    group by category
  ) g;

  return json_build_object(
    'rows',            coalesce(v_rows, '[]'::json),
    'total',           v_total,
    'traders',         v_traders,
    'repack',          v_repack,
    'category_counts', coalesce(v_category_counts, '{}'::json)
  );
end;
$$;
grant execute on function get_providers to anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 2. get_providers_admin — server-side paginated admin listing
--    (replaces the unbounded SELECT * that got capped at 1000)
-- ─────────────────────────────────────────────────────────────
create or replace function get_providers_admin(
  p_type     text default null,   -- 'trader' | 'repackager' | null
  p_status   text default null,   -- 'active' | 'inactive' | 'pending' | null
  p_query    text default null,
  p_category text default null,
  p_from     int  default 0,
  p_to       int  default 49
)
returns json
language plpgsql
security definer
stable
as $$
declare
  v_rows     json;
  v_total    bigint;
  v_active   bigint;
  v_verified bigint;
  v_traders  bigint;
  v_repack   bigint;
  v_pending  bigint;
begin
  select json_agg(row_to_json(t)) into v_rows
  from (
    select id, slug, name_ar, name_en, type, category, categories,
           emirate, city, license_no, license_type, issue_date,
           phone, email, website, is_verified, is_active, created_at,
           coalesce(views_count,0)          as views_count,
           coalesce(rfq_received_count,0)   as rfq_received_count,
           coalesce(rfq_submitted_count,0)  as rfq_submitted_count,
           coalesce(emails_count,0)         as emails_count,
           last_activity_at
    from providers
    where (p_type     is null or type     = p_type)
      and (p_category is null or category = p_category)
      and (p_status is null
           or (p_status = 'active'   and is_active = true)
           or (p_status = 'inactive' and is_active = false)
           or (p_status = 'pending'  and is_active = true and is_verified = false))
      and (p_query is null or fts @@ websearch_to_tsquery('simple', p_query))
    order by created_at desc
    limit  (p_to - p_from + 1)
    offset p_from
  ) t;

  select count(*) into v_total
  from providers
  where (p_type     is null or type     = p_type)
    and (p_category is null or category = p_category)
    and (p_status is null
         or (p_status = 'active'   and is_active = true)
         or (p_status = 'inactive' and is_active = false)
         or (p_status = 'pending'  and is_active = true and is_verified = false))
    and (p_query is null or fts @@ websearch_to_tsquery('simple', p_query));

  -- Global stat tiles (unfiltered)
  select count(*) filter (where is_active = true)                       ,
         count(*) filter (where is_verified = true)                     ,
         count(*) filter (where type = 'trader')                        ,
         count(*) filter (where type = 'repackager')                    ,
         count(*) filter (where is_active = true and is_verified = false)
    into v_active, v_verified, v_traders, v_repack, v_pending
  from providers;

  return json_build_object(
    'rows',     coalesce(v_rows, '[]'::json),
    'total',    v_total,
    'active',   v_active,
    'verified', v_verified,
    'traders',  v_traders,
    'repack',   v_repack,
    'pending',  v_pending
  );
end;
$$;
grant execute on function get_providers_admin to service_role;

-- ─────────────────────────────────────────────────────────────
-- 3. Tracking counters on providers (the fast-read snapshot)
-- ─────────────────────────────────────────────────────────────
alter table providers
  add column if not exists views_count         int default 0,
  add column if not exists rfq_received_count  int default 0,
  add column if not exists rfq_submitted_count int default 0,
  add column if not exists emails_count        int default 0,
  add column if not exists last_activity_at    timestamptz;

-- ─────────────────────────────────────────────────────────────
-- 4. provider_events — the memory (one row per interaction)
-- ─────────────────────────────────────────────────────────────
create table if not exists provider_events (
  id            uuid primary key default gen_random_uuid(),
  provider_id   uuid references providers(id) on delete cascade,
  event_type    text not null,   -- page_view | rfq_received | rfq_submitted | email_sent | email_opened | note | verified
  actor         text,            -- visitor | merchant | admin | system
  rfq_id        uuid,            -- references rfq_requests(id) when relevant
  visitor_id    text,
  payload       jsonb default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists provider_events_provider_idx on provider_events(provider_id, created_at desc);
create index if not exists provider_events_type_idx     on provider_events(event_type);

alter table provider_events enable row level security;
drop policy if exists "service_full_provider_events" on provider_events;
create policy "service_full_provider_events" on provider_events
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────
-- 5. log_provider_event — append event + bump the right counter
-- ─────────────────────────────────────────────────────────────
create or replace function log_provider_event(
  p_provider_id uuid,
  p_event_type  text,
  p_actor       text default 'system',
  p_rfq_id      uuid default null,
  p_visitor_id  text default null,
  p_payload     jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
as $$
begin
  insert into provider_events(provider_id, event_type, actor, rfq_id, visitor_id, payload)
  values (p_provider_id, p_event_type, p_actor, p_rfq_id, p_visitor_id, p_payload);

  update providers set
    views_count         = views_count         + (p_event_type = 'page_view')::int,
    rfq_received_count  = rfq_received_count  + (p_event_type = 'rfq_received')::int,
    rfq_submitted_count = rfq_submitted_count + (p_event_type = 'rfq_submitted')::int,
    emails_count        = emails_count        + (p_event_type = 'email_sent')::int,
    last_activity_at    = now()
  where id = p_provider_id;
end;
$$;
grant execute on function log_provider_event to anon, authenticated, service_role;

-- ─────────────────────────────────────────────────────────────
-- 6. Link RFQs to a routed trader (optional FK)
--    Guarded so this runs whether or not rfq_deal_layer.sql ran first.
-- ─────────────────────────────────────────────────────────────
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'rfq_requests') then
    alter table rfq_requests
      add column if not exists provider_id uuid references providers(id) on delete set null;
    create index if not exists idx_rfq_provider on rfq_requests(provider_id);
  end if;
end $$;
