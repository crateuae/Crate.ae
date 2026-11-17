-- Crate (Supabase ffaqjittonurtiggwxml) — page_views: keep the browser and the country of each
-- counted visit, so traffic can be told apart (people vs machines, UAE vs elsewhere).
-- Safe to run more than once. /api/track writes these when they exist and works without them.
alter table public.page_views add column if not exists ua text;
alter table public.page_views add column if not exists country text;
create index if not exists idx_page_views_created on public.page_views(created_at desc);
