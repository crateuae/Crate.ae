-- ============================================================
-- Providers Performance Optimization
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Partial indexes (only active rows — skips 0 inactive rows but future-proofs)
create index if not exists providers_active_type_idx
  on providers(type) where is_active = true;

create index if not exists providers_active_emirate_idx
  on providers(emirate) where is_active = true;

create index if not exists providers_active_slug_idx
  on providers(slug) where is_active = true;

-- 2. Composite index for the most common filter combo (type + emirate)
create index if not exists providers_type_emirate_idx
  on providers(type, emirate) where is_active = true;

-- 3. Update table stats so planner uses indexes correctly after bulk insert
analyze providers;

-- 4. RPC: get paginated providers + type counts in ONE round trip
create or replace function get_providers(
  p_type    text    default null,
  p_emirate text    default null,
  p_query   text    default null,
  p_from    int     default 0,
  p_to      int     default 23
)
returns json
language plpgsql
security definer
stable
as $$
declare
  v_rows    json;
  v_total   bigint;
  v_traders bigint;
  v_repack  bigint;
begin
  -- Main paginated query
  select json_agg(row_to_json(t))
  into v_rows
  from (
    select id, slug, name_ar, name_en, type, category,
           emirate, license_no, issue_date, is_verified
    from providers
    where is_active = true
      and (p_type    is null or type    = p_type)
      and (p_emirate is null or emirate = p_emirate)
      and (p_query   is null or fts @@ websearch_to_tsquery('simple', p_query))
    order by is_verified desc, name_en asc
    limit  (p_to - p_from + 1)
    offset p_from
  ) t;

  -- Total count with same filters
  select count(*) into v_total
  from providers
  where is_active = true
    and (p_type    is null or type    = p_type)
    and (p_emirate is null or emirate = p_emirate)
    and (p_query   is null or fts @@ websearch_to_tsquery('simple', p_query));

  -- Type counts (unfiltered by current type — for tab badges)
  select count(*) into v_traders from providers where is_active = true and type = 'trader';
  select count(*) into v_repack  from providers where is_active = true and type = 'repackager';

  return json_build_object(
    'rows',    coalesce(v_rows, '[]'::json),
    'total',   v_total,
    'traders', v_traders,
    'repack',  v_repack
  );
end;
$$;

-- Grant public access to the RPC
grant execute on function get_providers to anon, authenticated;
