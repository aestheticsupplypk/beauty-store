-- Add Parlour MOQ (Minimum Order Quantity) and Max Qty fields to products table
-- These control per-product ordering limits for parlour wholesale orders

-- Add parlour_min_qty: minimum quantity a parlour must order (default 1)
ALTER TABLE products ADD COLUMN IF NOT EXISTS parlour_min_qty INTEGER NOT NULL DEFAULT 1;

-- Add parlour_max_qty: maximum quantity per order (null = no limit)
ALTER TABLE products ADD COLUMN IF NOT EXISTS parlour_max_qty INTEGER NULL;

-- Add constraint to ensure min_qty is at least 1
ALTER TABLE products ADD CONSTRAINT parlour_min_qty_positive CHECK (parlour_min_qty >= 1);

-- Add constraint to ensure max_qty is greater than min_qty if set
ALTER TABLE products ADD CONSTRAINT parlour_max_qty_valid CHECK (parlour_max_qty IS NULL OR parlour_max_qty >= parlour_min_qty);

-- Add comment for documentation
COMMENT ON COLUMN products.parlour_min_qty IS 'Minimum order quantity for parlour wholesale orders (MOQ)';
COMMENT ON COLUMN products.parlour_max_qty IS 'Maximum quantity per order for parlour orders (null = no limit)';

-- Add pricing_context field to order_items for tracking parlour vs retail orders
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS pricing_context TEXT DEFAULT 'retail';
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS applied_tier_min_qty INTEGER NULL;

COMMENT ON COLUMN order_items.pricing_context IS 'Order context: retail or parlour';
COMMENT ON COLUMN order_items.applied_tier_min_qty IS 'The tier min_qty that was applied for parlour pricing';
