-- ============================================================
-- CRATE — Security Advisor Fix v3 (Final)
-- Run in Supabase SQL Editor
-- ============================================================

-- ─── 1. v_traders & v_repack: enable RLS or drop if unneeded ─────────────────
-- First check if they exist as views or tables:
-- SELECT table_name, table_type FROM information_schema.tables WHERE table_name IN ('v_traders','v_repack');

-- If they are VIEWS → revoke public access (views don't support RLS directly)
REVOKE SELECT ON public.v_traders FROM anon, authenticated, PUBLIC;
REVOKE SELECT ON public.v_repack  FROM anon, authenticated, PUBLIC;

-- If the above errors because they don't exist, they may be tables → enable RLS:
-- ALTER TABLE public.v_traders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.v_repack  ENABLE ROW LEVEL SECURITY;

-- ─── 2. Fix get_providers (5-param version) — switch to SECURITY INVOKER ─────
-- providers table has "public read" RLS, so SECURITY INVOKER works fine
CREATE OR REPLACE FUNCTION public.get_providers(
  p_type    text    DEFAULT NULL,
  p_emirate text    DEFAULT NULL,
  p_query   text    DEFAULT NULL,
  p_from    int     DEFAULT 0,
  p_to      int     DEFAULT 23
)
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
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

-- ─── 3. Fix get_providers (6-param version with p_category) ──────────────────
-- Same fix: SECURITY INVOKER + SET search_path
CREATE OR REPLACE FUNCTION public.get_providers(
  p_type     text    DEFAULT NULL,
  p_emirate  text    DEFAULT NULL,
  p_query    text    DEFAULT NULL,
  p_category text    DEFAULT NULL,
  p_from     int     DEFAULT 0,
  p_to       int     DEFAULT 23
)
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
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
      AND (p_type     IS NULL OR type     = p_type)
      AND (p_emirate  IS NULL OR emirate  = p_emirate)
      AND (p_category IS NULL OR category = p_category)
      AND (p_query    IS NULL OR fts @@ websearch_to_tsquery('simple', p_query))
    ORDER BY is_verified DESC, name_en ASC
    LIMIT  (p_to - p_from + 1)
    OFFSET p_from
  ) t;

  SELECT count(*) INTO v_total
  FROM providers
  WHERE is_active = true
    AND (p_type     IS NULL OR type     = p_type)
    AND (p_emirate  IS NULL OR emirate  = p_emirate)
    AND (p_category IS NULL OR category = p_category)
    AND (p_query    IS NULL OR fts @@ websearch_to_tsquery('simple', p_query));

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

-- ─── 4. Revoke EXECUTE on handle_new_user and is_admin from ALL roles ─────────
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin()        FROM PUBLIC, anon, authenticated;

-- ─── 5. Leaked Password Protection ───────────────────────────────────────────
-- Cannot be fixed via SQL. Go to:
-- https://supabase.com/dashboard/project/ffaqjittonurtiggwxml/auth/settings
-- → Password Security → Enable "Leaked Password Protection"

-- ─── Verify ──────────────────────────────────────────────────────────────────
-- Check function security mode:
-- SELECT proname, prosecdef, proconfig
-- FROM pg_proc
-- WHERE proname IN ('get_providers','handle_new_user','is_admin')
-- ORDER BY proname;
-- prosecdef = false means SECURITY INVOKER ✓
-- proconfig includes 'search_path=public' ✓
