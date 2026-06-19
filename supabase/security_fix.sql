-- ============================================================
-- CRATE — Security Advisor Fix + Packaging Weights Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- ─── 1. Fix handle_new_user: add SET search_path ─────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    CASE
      WHEN NEW.email = ANY(
        string_to_array(current_setting('app.admin_emails', true), ',')
      ) THEN 'admin'
      ELSE 'user'
    END
  );
  RETURN NEW;
END;
$$;

-- ─── 2. Create is_admin() helper ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ─── 3. Replace all recursive/repeated admin policies ────────────────────────

DROP POLICY IF EXISTS "admin all products"     ON products;
CREATE POLICY "admin all products"     ON products       FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "admin all signals"      ON market_signals;
CREATE POLICY "admin all signals"      ON market_signals FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "admin all alerts"       ON gap_alerts;
CREATE POLICY "admin all alerts"       ON gap_alerts     FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "admin read compliance"  ON compliance_checks;
CREATE POLICY "admin read compliance"  ON compliance_checks FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "admin all packaging"    ON packaging_plans;
CREATE POLICY "admin all packaging"    ON packaging_plans FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "admin all providers"    ON providers;
CREATE POLICY "admin all providers"    ON providers      FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "admin all articles"     ON articles;
CREATE POLICY "admin all articles"     ON articles       FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "admin all companies"    ON companies;
CREATE POLICY "admin all companies"    ON companies      FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "admin all campaigns"    ON email_campaigns;
CREATE POLICY "admin all campaigns"    ON email_campaigns FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "admin all steps"        ON campaign_steps;
CREATE POLICY "admin all steps"        ON campaign_steps FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "admin all threads"      ON email_threads;
CREATE POLICY "admin all threads"      ON email_threads  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "admin all messages"     ON email_messages;
CREATE POLICY "admin all messages"     ON email_messages FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "admin read quotes"      ON quote_requests;
CREATE POLICY "admin read quotes"      ON quote_requests FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "admin read profiles"    ON profiles;
CREATE POLICY "admin read profiles"    ON profiles       FOR SELECT USING (public.is_admin());

-- ─── 4. Add new columns (safe re-run) ────────────────────────────────────────
ALTER TABLE packaging_master_cartons
  ADD COLUMN IF NOT EXISTS empty_weight_kg numeric DEFAULT 0;

ALTER TABLE packaging_primary_packs
  ADD COLUMN IF NOT EXISTS weight_kg  numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS image_url  text    DEFAULT '';

-- ─── 5. Seed empty_weight_kg for existing master cartons ─────────────────────
-- Weights based on UAE market standard corrugated carton specs
UPDATE packaging_master_cartons SET empty_weight_kg = 0.35 WHERE name_en = 'Small Carton';
UPDATE packaging_master_cartons SET empty_weight_kg = 0.55 WHERE name_en = 'Medium Carton';
UPDATE packaging_master_cartons SET empty_weight_kg = 0.90 WHERE name_en = 'Large Carton';
UPDATE packaging_master_cartons SET empty_weight_kg = 1.15 WHERE name_en = 'XL Carton';
UPDATE packaging_master_cartons SET empty_weight_kg = 1.30 WHERE name_en = 'Moving Box S';
UPDATE packaging_master_cartons SET empty_weight_kg = 1.60 WHERE name_en = 'Moving Box M';
UPDATE packaging_master_cartons SET empty_weight_kg = 1.95 WHERE name_en = 'Moving Box L';

-- ─── 6. Seed weight_kg for existing primary packs ────────────────────────────
-- Empty pack weight per unit (tare weight of the packaging itself)
UPDATE packaging_primary_packs SET weight_kg = 0.005 WHERE size_label = '100g'  AND type = 'bag';
UPDATE packaging_primary_packs SET weight_kg = 0.008 WHERE size_label = '250g'  AND type = 'bag';
UPDATE packaging_primary_packs SET weight_kg = 0.015 WHERE size_label = '500g'  AND type = 'bag';
UPDATE packaging_primary_packs SET weight_kg = 0.025 WHERE size_label = '1kg'   AND type = 'bag';
UPDATE packaging_primary_packs SET weight_kg = 0.040 WHERE size_label = '2kg'   AND type = 'bag';
UPDATE packaging_primary_packs SET weight_kg = 0.080 WHERE size_label = '5kg'   AND type = 'bag';
UPDATE packaging_primary_packs SET weight_kg = 0.150 WHERE size_label = '10kg'  AND type = 'bag';
UPDATE packaging_primary_packs SET weight_kg = 0.025 WHERE size_label = '500ml' AND type = 'bottle';
UPDATE packaging_primary_packs SET weight_kg = 0.035 WHERE size_label = '1L'    AND type = 'bottle';
UPDATE packaging_primary_packs SET weight_kg = 0.075 WHERE size_label = '500g'  AND type = 'jar';
UPDATE packaging_primary_packs SET weight_kg = 0.060 WHERE size_label = '1kg'   AND type = 'box';

-- ─── Done ────────────────────────────────────────────────────────────────────
-- After running, verify with:
-- SELECT name_en, empty_weight_kg FROM packaging_master_cartons ORDER BY sort_order;
-- SELECT size_label, type, weight_kg FROM packaging_primary_packs ORDER BY sort_order;
