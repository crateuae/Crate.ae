-- Crate (Supabase ffaqjittonurtiggwxml) — security hardening, 2026-11-18.  Idempotent: safe to run twice.
--
-- WHY: every table below is read and written ONLY by server code using the service-role key (API routes,
-- server components). The browser never queries these tables (it only uses Supabase for sign-in). So the
-- public `anon` / `authenticated` roles need no access at all. Earlier scripts (supabase/security_fix_v4.sql)
-- granted anon INSERT on rfq_requests / page_views; that lets anyone bypass the validated API and fill the
-- tables with junk straight through the REST endpoint. This closes it.
--
-- Run in: Supabase dashboard → SQL Editor → paste → Run (project ffaqjittonurtiggwxml, i.e. Crate — NOT artprinting).

-- 1. Audit trail written by src/lib/security/audit.ts (failed admin logins, denied privileged calls, ...).
create table if not exists public.security_events (
  id         bigserial primary key,
  created_at timestamptz not null default now(),
  event      text not null,
  ip         text,
  path       text,
  actor      text,
  detail     text
);
create index if not exists idx_security_events_created on public.security_events (created_at desc);
alter table public.security_events enable row level security;
drop policy if exists "security_events_service_all" on public.security_events;
create policy "security_events_service_all" on public.security_events for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- 2. Remove the anonymous-insert policies (the validated /api routes insert with the service role).
drop policy if exists "rfq_insert_anon" on public.rfq_requests;
drop policy if exists "pv_insert_anon"  on public.page_views;

-- 3. Internal tables: RLS on, and no table privileges for the public roles.
do $$
declare t text;
begin
  foreach t in array array[
    'tool_leads','provider_contacts','provider_events','inbound_emails',
    'email_campaigns','campaign_sends','campaign_steps','email_suppressions','email_messages','email_threads',
    'partner_orders','partners','rfq_requests','packaging_plans','compliance_checks','page_views',
    'security_events','opportunity_events','scoring_weights','trend_discoveries','market_signals','quote_requests'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('revoke all on table public.%I from anon, authenticated', t);
    end if;
  end loop;
end $$;

-- 4. RPC helpers that write counters/events: callable by the server only (anyone could otherwise POST to
--    /rest/v1/rpc/log_provider_event and inflate a provider's numbers).
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('log_provider_event','increment_rfq_count')
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
  end loop;
end $$;

-- 5. VERIFY (read-only). Expect: no row where anon_can_read / anon_can_write is true for the tables above.
select c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       has_table_privilege('anon', c.oid, 'select') as anon_can_read,
       has_table_privilege('anon', c.oid, 'insert') as anon_can_write
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relname;

-- Tables that should stay publicly READABLE by design: compliance_rules, product_categories,
-- product_subcategories, packaging_primary_packs, packaging_master_cartons, packaging_options (planner data).
-- Any table in the list above with anon_can_read = true after this script means the revoke did not apply.
