-- ============================================================
-- CRATE.AE — Security hardening: pin search_path on all public functions
-- Fixes Supabase advisor "Function Search Path Mutable" warnings.
-- Safe + idempotent — re-runnable.
-- ============================================================
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS func
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind = 'f'
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', r.func);
  END LOOP;
END $$;

-- Non-SQL advisor items are dashboard toggles, not migrations:
--   • Leaked Password Protection  → Authentication → Providers → Password
--   • MFA (TOTP)                  → Authentication → MFA
