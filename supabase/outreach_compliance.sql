-- ============================================================
-- CRATE — Outreach compliance + contact infrastructure
-- Run in Supabase SQL Editor (project ffaqjittonurtiggwxml)
-- Legal prerequisite for ANY registry outreach (UAE TDRA / anti-spam).
-- ============================================================

-- ─── 1. Suppression list (unsubscribes + hard bounces + complaints) ──────────
-- Every send MUST anti-join against this. Once here, an address is never emailed again.
CREATE TABLE IF NOT EXISTS public.email_suppressions (
  email       text PRIMARY KEY,
  reason      text NOT NULL DEFAULT 'unsubscribe',  -- unsubscribe | bounce | complaint | manual
  source      text,                                  -- campaign id / route that suppressed it
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.email_suppressions ENABLE ROW LEVEL SECURITY;
-- service_role (server) does everything; no public read/write.
DROP POLICY IF EXISTS "supp_service_all" ON public.email_suppressions;
CREATE POLICY "supp_service_all" ON public.email_suppressions FOR ALL
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ─── 2. Verified/consented provider contacts ─────────────────────────────────
-- The 47K providers row has null email/phone. Outreach may ONLY use contacts here
-- with status='verified' — sourced from provider self-claim (consented) or an
-- admin-imported verified list. Never from unverified scraping/guessing.
CREATE TABLE IF NOT EXISTS public.provider_contacts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id  uuid REFERENCES public.providers(id) ON DELETE CASCADE,
  email        text,
  phone        text,
  contact_name text,
  source       text NOT NULL DEFAULT 'self_claimed', -- self_claimed | admin_import | verified_list
  confidence   int  NOT NULL DEFAULT 100,            -- 0-100
  status       text NOT NULL DEFAULT 'pending',      -- pending | verified | rejected
  consent      boolean NOT NULL DEFAULT false,       -- explicit opt-in captured
  verified_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_id, email)
);
CREATE INDEX IF NOT EXISTS idx_provider_contacts_status ON public.provider_contacts(status);
CREATE INDEX IF NOT EXISTS idx_provider_contacts_email  ON public.provider_contacts(lower(email));
ALTER TABLE public.provider_contacts ENABLE ROW LEVEL SECURITY;
-- Public may INSERT a self-claim (consented); only service_role reads/updates.
DROP POLICY IF EXISTS "pc_self_claim_insert" ON public.provider_contacts;
DROP POLICY IF EXISTS "pc_service_all"       ON public.provider_contacts;
CREATE POLICY "pc_self_claim_insert" ON public.provider_contacts FOR INSERT
  TO anon, authenticated WITH CHECK (source = 'self_claimed');
CREATE POLICY "pc_service_all" ON public.provider_contacts FOR ALL
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ─── 3. Verify ───────────────────────────────────────────────────────────────
SELECT 'email_suppressions' AS table, count(*) FROM public.email_suppressions
UNION ALL
SELECT 'provider_contacts', count(*) FROM public.provider_contacts;
