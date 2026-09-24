-- Crate (Supabase ffaqjittonurtiggwxml) — leads captured by free tools (Portal Router first).
-- Service-role only: the API route writes with the service key; no anon policy on purpose.
create table if not exists public.tool_leads (
  id          uuid primary key default gen_random_uuid(),
  tool        text not null,                        -- 'portal_router' | future tools
  email       text not null,
  name        text,
  company     text,
  phone       text,
  locale      text not null default 'ar',
  answers     jsonb not null default '{}'::jsonb,   -- the exact inputs → reproducible result
  result_key  text,                                 -- deterministic route key
  consent     boolean not null default false,       -- explicit marketing opt-in (TDRA); the report itself is transactional
  source_page text,
  email_sent  boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists idx_tool_leads_tool_created on public.tool_leads(tool, created_at desc);
create index if not exists idx_tool_leads_email on public.tool_leads(lower(email));
alter table public.tool_leads enable row level security;
drop policy if exists "tool_leads_service_all" on public.tool_leads;
create policy "tool_leads_service_all" on public.tool_leads for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
