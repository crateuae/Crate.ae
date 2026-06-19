-- ============================================================
-- CRATE — Security Advisor Fix v2
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/ffaqjittonurtiggwxml/sql/new
-- ============================================================

-- ─── 1. Fix get_providers: add SET search_path ───────────────────────────────
CREATE OR REPLACE FUNCTION public.get_providers(
  p_type    text    DEFAULT NULL,
  p_emirate text    DEFAULT NULL,
  p_query   text    DEFAULT NULL,
  p_from    int     DEFAULT 0,
  p_to      int     DEFAULT 23
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_rows    json;
  v_total   bigint;
  v_traders bigint;
  v_repack  bigint;
BEGIN
  SELECT json_agg(row_to_json(t))
  INTO v_rows
  FROM (
    SELECT id, slug, name_ar, name_en, type, category,
           emirate, license_no, issue_date, is_verified
    FROM providers
    WHERE is_active = true
      AND (p_type    IS NULL OR type    = p_type)
      AND (p_emirate IS NULL OR emirate = p_emirate)
      AND (p_query   IS NULL OR fts @@ websearch_to_tsquery('simple', p_query))
    ORDER BY is_verified DESC, name_en ASC
    LIMIT  (p_to - p_from + 1)
    OFFSET p_from
  ) t;

  SELECT count(*) INTO v_total
  FROM providers
  WHERE is_active = true
    AND (p_type    IS NULL OR type    = p_type)
    AND (p_emirate IS NULL OR emirate = p_emirate)
    AND (p_query   IS NULL OR fts @@ websearch_to_tsquery('simple', p_query));

  SELECT count(*) INTO v_traders FROM providers WHERE is_active = true AND type = 'trader';
  SELECT count(*) INTO v_repack  FROM providers WHERE is_active = true AND type = 'repackager';

  RETURN json_build_object(
    'rows',    coalesce(v_rows, '[]'::json),
    'total',   v_total,
    'traders', v_traders,
    'repack',  v_repack
  );
END;
$$;

-- ─── 2. Revoke EXECUTE on SECURITY DEFINER functions from public ─────────────
-- handle_new_user & is_admin are internal (trigger / RLS) — no external callers
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin()        FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin()        FROM authenticated;

-- get_providers IS called by anon/authenticated via RPC — keep those grants
-- but revoke the broad PUBLIC default and re-grant explicitly
REVOKE EXECUTE ON FUNCTION public.get_providers(text,text,text,int,int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_providers(text,text,text,int,int) TO anon, authenticated;

-- ─── 3. Fix "RLS Policy Always True" on compliance_checks ────────────────────
-- Replace WITH CHECK (true) with a meaningful guard: name must not be empty
DROP POLICY IF EXISTS "public insert compliance" ON compliance_checks;
CREATE POLICY "public insert compliance" ON compliance_checks
  FOR INSERT WITH CHECK (
    product_name IS NOT NULL AND product_name <> ''
    AND product_class IS NOT NULL AND product_class <> ''
  );

-- ─── 4. Fix "RLS Policy Always True" on quote_requests ───────────────────────
-- Replace WITH CHECK (true) with: email must not be empty
DROP POLICY IF EXISTS "public insert quotes" ON quote_requests;
CREATE POLICY "public insert quotes" ON quote_requests
  FOR INSERT WITH CHECK (
    email IS NOT NULL AND email <> ''
  );

-- ─── 5. Move pg_trgm to extensions schema (best practice) ────────────────────
-- Note: this is a WARNING only and will not break anything if left as-is.
-- Supabase recommends creating extensions in a dedicated schema.
-- Only run the lines below if you have no active trgm-based indexes.
-- (Check first: SELECT * FROM pg_indexes WHERE indexdef ILIKE '%gin%trgm%')
-- CREATE SCHEMA IF NOT EXISTS extensions;
-- DROP EXTENSION IF EXISTS pg_trgm;
-- CREATE EXTENSION pg_trgm SCHEMA extensions;
-- The above is commented out intentionally — pg_trgm move can break FTS indexes.
-- This warning is safe to leave as-is.

-- ─── 6. Leaked Password Protection ───────────────────────────────────────────
-- This CANNOT be fixed via SQL. Enable it in:
-- Dashboard → Authentication → Settings → Password Protection → Enable "Check for leaked passwords"
-- URL: https://supabase.com/dashboard/project/ffaqjittonurtiggwxml/auth/settings

-- ─── Done ────────────────────────────────────────────────────────────────────
-- Verify with:
-- SELECT proname, prosecdef, proconfig FROM pg_proc WHERE proname IN ('get_providers','handle_new_user','is_admin');
