-- ============================================================
-- CRATE.AE — RFQ & DEAL LAYER  (additive, RLS-enabled)
-- Run once in Supabase SQL Editor (project ffaqjittonurtiggwxml)
-- ============================================================

-- ─── rfq_requests ────────────────────────────────────────────
-- One row per quote request submitted by a visitor/buyer.
-- Linked to the organism's opportunity so the learning loop
-- can use rfq_count as a conversion signal.
CREATE TABLE IF NOT EXISTS rfq_requests (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id   uuid REFERENCES opportunities(id) ON DELETE SET NULL,
  product_name     text NOT NULL,
  product_name_ar  text,
  quantity         text,          -- free text: "500 cartons" / "1 pallet"
  destination      text,          -- "Dubai / Abu Dhabi / export"
  budget_aed       numeric,
  notes            text,
  contact_name     text NOT NULL,
  contact_email    text,
  contact_phone    text,
  company_name     text,
  status           text NOT NULL DEFAULT 'new'
                   CHECK (status IN ('new','contacted','quoted','won','lost')),
  admin_notes      text,
  source_page      text,          -- the /insights/[slug] path that triggered it
  locale           text DEFAULT 'ar',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_rfq_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS rfq_updated_at_trigger ON rfq_requests;
CREATE TRIGGER rfq_updated_at_trigger
  BEFORE UPDATE ON rfq_requests
  FOR EACH ROW EXECUTE FUNCTION update_rfq_updated_at();

-- RLS: admins (service role) see all; public can INSERT only their own
ALTER TABLE rfq_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_full_rfq" ON rfq_requests
  USING (auth.role() = 'service_role');
CREATE POLICY "public_insert_rfq" ON rfq_requests
  FOR INSERT WITH CHECK (true);

-- RPC: increment rfq_count atomically on the linked opportunity
CREATE OR REPLACE FUNCTION increment_rfq_count(opp_id uuid)
RETURNS void LANGUAGE sql AS $$
  UPDATE opportunities SET rfq_count = rfq_count + 1, updated_at = now()
  WHERE id = opp_id;
$$;

-- Index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_rfq_opportunity   ON rfq_requests(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_rfq_status        ON rfq_requests(status);
CREATE INDEX IF NOT EXISTS idx_rfq_created       ON rfq_requests(created_at DESC);
