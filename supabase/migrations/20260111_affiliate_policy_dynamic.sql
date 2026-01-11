-- ============================================
-- DYNAMIC AFFILIATE POLICY PAGE
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. POLICY META TABLE (single row for timestamps)
-- ============================================

CREATE TABLE IF NOT EXISTS affiliate_policy_meta (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  commission_last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  tiers_last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  terms_last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  terms_version INTEGER DEFAULT 1
);

-- Insert the single row if it doesn't exist
INSERT INTO affiliate_policy_meta (id, commission_last_updated_at, tiers_last_updated_at, terms_last_updated_at)
VALUES (1, NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. TRIGGERS TO AUTO-UPDATE TIMESTAMPS
-- ============================================

-- Function to update commission timestamp when product affiliate settings change
CREATE OR REPLACE FUNCTION update_policy_meta_on_product_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if affiliate-related fields changed
  IF (OLD.affiliate_enabled IS DISTINCT FROM NEW.affiliate_enabled) OR
     (OLD.affiliate_commission_type IS DISTINCT FROM NEW.affiliate_commission_type) OR
     (OLD.affiliate_commission_value IS DISTINCT FROM NEW.affiliate_commission_value) THEN
    
    UPDATE affiliate_policy_meta
    SET commission_last_updated_at = NOW(),
        terms_last_updated_at = NOW(),
        terms_version = COALESCE(terms_version, 0) + 1
    WHERE id = 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on products table
DROP TRIGGER IF EXISTS trg_policy_meta_product_change ON products;
CREATE TRIGGER trg_policy_meta_product_change
AFTER UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_policy_meta_on_product_change();

-- Function to update tiers timestamp when tier settings change
CREATE OR REPLACE FUNCTION update_policy_meta_on_tier_change()
RETURNS TRIGGER AS $$
BEGIN
  -- For INSERT/DELETE, always update (tier added/removed affects policy)
  -- For UPDATE, only update if relevant fields changed
  IF (TG_OP = 'INSERT') OR (TG_OP = 'DELETE') THEN
    UPDATE affiliate_policy_meta
    SET tiers_last_updated_at = NOW(),
        terms_last_updated_at = NOW(),
        terms_version = COALESCE(terms_version, 0) + 1
    WHERE id = 1;
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Only update if tier-relevant fields changed
    IF (OLD.name IS DISTINCT FROM NEW.name) OR
       (OLD.min_delivered_orders_30d IS DISTINCT FROM NEW.min_delivered_orders_30d) OR
       (OLD.multiplier_percent IS DISTINCT FROM NEW.multiplier_percent) OR
       (OLD.active IS DISTINCT FROM NEW.active) THEN
      UPDATE affiliate_policy_meta
      SET tiers_last_updated_at = NOW(),
          terms_last_updated_at = NOW(),
          terms_version = COALESCE(terms_version, 0) + 1
      WHERE id = 1;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger on affiliate_tiers table (for INSERT, UPDATE, DELETE)
DROP TRIGGER IF EXISTS trg_policy_meta_tier_change ON affiliate_tiers;
CREATE TRIGGER trg_policy_meta_tier_change
AFTER INSERT OR UPDATE OR DELETE ON affiliate_tiers
FOR EACH ROW
EXECUTE FUNCTION update_policy_meta_on_tier_change();

-- ============================================
-- 3. PUBLIC READ-ONLY VIEWS
-- ============================================

-- View for affiliate-enabled products with commission settings
-- Only shows products that are: affiliate_enabled, active, and have commission value set
CREATE OR REPLACE VIEW public_affiliate_commission_products AS
SELECT 
  p.id,
  p.name,
  p.affiliate_commission_type,
  p.affiliate_commission_value
FROM products p
WHERE p.affiliate_enabled = true
  AND p.active = true
  AND p.affiliate_commission_value IS NOT NULL
  AND p.affiliate_commission_value > 0
ORDER BY p.name;

-- View for active commission tiers
CREATE OR REPLACE VIEW public_affiliate_commission_tiers AS
SELECT 
  t.name,
  t.min_delivered_orders_30d,
  t.multiplier_percent
FROM affiliate_tiers t
WHERE t.active = true
ORDER BY t.min_delivered_orders_30d;

-- View for policy meta (last updated timestamp)
CREATE OR REPLACE VIEW public_affiliate_policy_meta AS
SELECT 
  terms_last_updated_at,
  terms_version
FROM affiliate_policy_meta
WHERE id = 1;

-- ============================================
-- 4. GRANT PUBLIC READ ACCESS (RLS-safe)
-- ============================================

-- Enable RLS on the views' underlying tables if not already
-- The views themselves don't have RLS, but the underlying tables do

-- Grant SELECT on views to anon and authenticated roles
GRANT SELECT ON public_affiliate_commission_products TO anon, authenticated;
GRANT SELECT ON public_affiliate_commission_tiers TO anon, authenticated;
GRANT SELECT ON public_affiliate_policy_meta TO anon, authenticated;

-- ============================================
-- 5. INITIALIZE TIMESTAMPS
-- ============================================

-- Set initial timestamps based on current data
UPDATE affiliate_policy_meta
SET commission_last_updated_at = COALESCE(
      (SELECT MAX(updated_at) FROM products WHERE affiliate_enabled = true),
      NOW()
    ),
    tiers_last_updated_at = COALESCE(
      (SELECT MAX(updated_at) FROM affiliate_tiers WHERE active = true),
      NOW()
    ),
    terms_last_updated_at = NOW()
WHERE id = 1;
