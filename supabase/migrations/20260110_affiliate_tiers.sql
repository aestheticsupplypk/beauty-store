-- ============================================
-- AFFILIATE TIERS MIGRATION
-- Run this in Supabase SQL Editor AFTER the accounting migration
-- ============================================

-- ============================================
-- A) AFFILIATE TIERS TABLE
-- ============================================

-- Create affiliate_tiers table for data-driven tier rules
CREATE TABLE IF NOT EXISTS affiliate_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  min_delivered_orders_30d INTEGER NOT NULL DEFAULT 0,
  multiplier_percent INTEGER NOT NULL DEFAULT 100,
  discount_multiplier_percent INTEGER DEFAULT 100,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add unique constraint on min_delivered_orders_30d to prevent duplicate thresholds
CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliate_tiers_min_orders 
ON affiliate_tiers(min_delivered_orders_30d) WHERE active = true;

-- ============================================
-- B) ADD TIER TRACKING TO ORDERS
-- ============================================

-- Add tier snapshot fields to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS affiliate_tier_id UUID REFERENCES affiliate_tiers(id),
ADD COLUMN IF NOT EXISTS affiliate_tier_name TEXT,
ADD COLUMN IF NOT EXISTS affiliate_tier_multiplier INTEGER,
ADD COLUMN IF NOT EXISTS affiliate_base_commission NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS affiliate_commission_rule TEXT;

-- ============================================
-- C) INSERT DEFAULT TIERS
-- ============================================

-- Insert default tiers (Bronze, Silver, Gold)
INSERT INTO affiliate_tiers (name, min_delivered_orders_30d, multiplier_percent, discount_multiplier_percent, active)
VALUES 
  ('Bronze', 0, 100, 100, true),
  ('Silver', 10, 150, 100, true),
  ('Gold', 25, 200, 100, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- D) HELPER FUNCTION: Get affiliate's delivered order count (rolling 30 days)
-- ============================================

CREATE OR REPLACE FUNCTION get_affiliate_delivered_count_30d(p_affiliate_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM orders
  WHERE affiliate_id = p_affiliate_id
    AND delivery_status = 'delivered'
    AND delivered_at >= (now() - INTERVAL '30 days');
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- E) HELPER FUNCTION: Get affiliate's current tier
-- ============================================

CREATE OR REPLACE FUNCTION get_affiliate_tier(p_affiliate_id UUID)
RETURNS TABLE (
  tier_id UUID,
  tier_name TEXT,
  multiplier_percent INTEGER,
  discount_multiplier_percent INTEGER,
  delivered_count_30d INTEGER
) AS $$
DECLARE
  v_delivered_count INTEGER;
BEGIN
  -- Get delivered count
  v_delivered_count := get_affiliate_delivered_count_30d(p_affiliate_id);
  
  -- Return the highest tier where min <= count
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.multiplier_percent,
    t.discount_multiplier_percent,
    v_delivered_count
  FROM affiliate_tiers t
  WHERE t.active = true
    AND t.min_delivered_orders_30d <= v_delivered_count
  ORDER BY t.min_delivered_orders_30d DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- F) UPDATED_AT TRIGGER FOR TIERS
-- ============================================

CREATE OR REPLACE FUNCTION update_affiliate_tiers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_affiliate_tiers_updated_at ON affiliate_tiers;
CREATE TRIGGER trg_affiliate_tiers_updated_at
  BEFORE UPDATE ON affiliate_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_affiliate_tiers_updated_at();

-- ============================================
-- G) RLS POLICIES FOR AFFILIATE_TIERS
-- ============================================

ALTER TABLE affiliate_tiers ENABLE ROW LEVEL SECURITY;

-- Allow public read (affiliates can see tier info)
CREATE POLICY "Allow public read on affiliate_tiers"
  ON affiliate_tiers FOR SELECT
  USING (true);

-- Only service role can modify
CREATE POLICY "Only service role can modify affiliate_tiers"
  ON affiliate_tiers FOR ALL
  USING (auth.role() = 'service_role');
