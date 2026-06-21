/**
 * Unified Products Schema — Merge opportunities + products + insights
 *
 * Each product now has:
 * - Commerce data (prices, registration, etc.) — manual entry
 * - SEO content (article body) — from organism OR manual
 * - Source tracking — 'manual' or 'organism_discovery'
 * - Link to opportunity — for metrics tracking
 * - Publish state — draft or live
 */

-- Add new columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS (
  -- Content (from organism or manual)
  content_ar TEXT,
  content_en TEXT,

  -- SEO metadata
  tags TEXT[],
  image_url TEXT,
  meta_description_ar TEXT,
  meta_description_en TEXT,

  -- Publish state
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,

  -- Source tracking: 'manual' | 'organism_discovery'
  source TEXT DEFAULT 'manual',

  -- Link to organism opportunity (if created by organism)
  organism_opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,

  -- Views & RFQ tracking (denormalized for speed)
  page_views INT DEFAULT 0,
  rfq_count INT DEFAULT 0,
  rfq_count_updated_at TIMESTAMP WITH TIME ZONE
);

-- Index for organism linking
CREATE INDEX IF NOT EXISTS idx_products_organism_opportunity_id
  ON products(organism_opportunity_id);

-- Index for source filtering (admin listing)
CREATE INDEX IF NOT EXISTS idx_products_source
  ON products(source, published_at DESC);

-- Index for published products (public page)
CREATE INDEX IF NOT EXISTS idx_products_published
  ON products(is_published, published_at DESC);

-- RLS: Allow anyone to read published products
CREATE POLICY "public_read_published_products"
  ON products FOR SELECT
  USING (is_published = true);

-- RLS: Allow authenticated (admin) to CRUD all
CREATE POLICY "admin_manage_products"
  ON products FOR ALL
  USING (auth.role() = 'authenticated');

-- Function: Update product page_views from articles table
-- (when someone reads /products/[slug], we increment)
CREATE OR REPLACE FUNCTION update_product_views(p_product_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET page_views = page_views + 1
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Link RFQ to product (when RFQ mentions a product)
-- Returns count of active RFQs for this product
CREATE OR REPLACE FUNCTION get_product_rfq_count(p_product_id UUID)
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  -- Count RFQs that mention this product (by name match)
  SELECT COUNT(*) INTO v_count
  FROM rfq_requests
  WHERE (notes ILIKE '%' || (SELECT name_en FROM products WHERE id = p_product_id) || '%'
     OR notes ILIKE '%' || (SELECT name_ar FROM products WHERE id = p_product_id) || '%')
  AND created_at > NOW() - INTERVAL '30 days';

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Update page_views timestamp when modified
CREATE OR REPLACE FUNCTION products_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.page_views != OLD.page_views THEN
    NEW.rfq_count_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_page_views_timestamp ON products;
CREATE TRIGGER products_page_views_timestamp
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION products_update_timestamp();

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.update_product_views TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_product_rfq_count TO anon, authenticated;
