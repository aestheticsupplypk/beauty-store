-- ============================================
-- COMMISSION SNAPSHOT FIELDS
-- Run this in Supabase SQL Editor
-- ============================================
-- Adds snapshot fields to orders table to store the commission type/value
-- at the time of order creation for audit and dispute prevention.

-- Add commission snapshot fields to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS affiliate_commission_type_snapshot TEXT CHECK (affiliate_commission_type_snapshot IN ('percent', 'fixed')),
ADD COLUMN IF NOT EXISTS affiliate_commission_value_snapshot NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS affiliate_base_price_snapshot NUMERIC(10,2);

-- Comment explaining the fields
COMMENT ON COLUMN orders.affiliate_commission_type_snapshot IS 'Commission type at order time: percent or fixed';
COMMENT ON COLUMN orders.affiliate_commission_value_snapshot IS 'Commission value at order time: percentage (0-100) or fixed PKR amount';
COMMENT ON COLUMN orders.affiliate_base_price_snapshot IS 'Total base price (before discount) used for percent commission calculation';
