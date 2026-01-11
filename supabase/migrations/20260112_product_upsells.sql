-- ============================================
-- PRODUCT UPSELLS TABLE
-- Stores admin-curated upsell/cross-sell relationships
-- ============================================

-- Create product_upsells table
CREATE TABLE IF NOT EXISTS product_upsells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  upsell_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  upsell_type TEXT DEFAULT 'recommended' CHECK (upsell_type IN ('recommended', 'bundle', 'complete_routine', 'best_with')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate relationships
  UNIQUE(product_id, upsell_product_id),
  -- Prevent self-referencing
  CHECK (product_id != upsell_product_id)
);

-- Index for fast lookup by product
CREATE INDEX IF NOT EXISTS idx_product_upsells_product_id ON product_upsells(product_id);
CREATE INDEX IF NOT EXISTS idx_product_upsells_sort ON product_upsells(product_id, sort_order);

-- Comments
COMMENT ON TABLE product_upsells IS 'Admin-curated upsell/cross-sell relationships between products';
COMMENT ON COLUMN product_upsells.product_id IS 'The main product being viewed';
COMMENT ON COLUMN product_upsells.upsell_product_id IS 'The product to suggest as an upsell';
COMMENT ON COLUMN product_upsells.sort_order IS 'Display order (lower = first)';
COMMENT ON COLUMN product_upsells.upsell_type IS 'Type of upsell: recommended, bundle, complete_routine, best_with';

-- RLS policies
ALTER TABLE product_upsells ENABLE ROW LEVEL SECURITY;

-- Public read access (for cart drawer to fetch upsells)
CREATE POLICY "Public can read product upsells"
  ON product_upsells FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin write access (service role bypasses RLS)
-- No explicit policy needed for service role

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_product_upsells_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_product_upsells_updated_at
BEFORE UPDATE ON product_upsells
FOR EACH ROW
EXECUTE FUNCTION update_product_upsells_updated_at();

-- ============================================
-- PUBLIC VIEW FOR UPSELLS WITH PRODUCT INFO
-- ============================================

CREATE OR REPLACE VIEW public_product_upsells AS
SELECT 
  pu.id,
  pu.product_id,
  pu.upsell_product_id,
  pu.sort_order,
  pu.upsell_type,
  p.name AS upsell_product_name,
  p.slug AS upsell_product_slug,
  p.logo_url AS upsell_product_logo,
  (
    SELECT MIN(v.price) 
    FROM variants v 
    WHERE v.product_id = p.id AND v.active = true
  ) AS upsell_min_price
FROM product_upsells pu
JOIN products p ON p.id = pu.upsell_product_id
WHERE p.active = true
ORDER BY pu.product_id, pu.sort_order;

GRANT SELECT ON public_product_upsells TO anon, authenticated;

COMMENT ON VIEW public_product_upsells IS 'Public view of product upsells with basic product info for cart drawer';
