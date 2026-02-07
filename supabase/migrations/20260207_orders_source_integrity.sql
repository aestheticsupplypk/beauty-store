-- ============================================================================
-- Migration: Orders Source Integrity
-- Date: 2026-02-07
-- Purpose: Normalize source field, add constraints to prevent data corruption
-- ============================================================================

-- ============================================================================
-- STEP 1: Backfill NULL sources to 'website'
-- ============================================================================
UPDATE orders
SET source = 'website'
WHERE source IS NULL;

-- ============================================================================
-- STEP 2: Set default and NOT NULL constraint
-- ============================================================================
ALTER TABLE orders
ALTER COLUMN source SET DEFAULT 'website';

ALTER TABLE orders
ALTER COLUMN source SET NOT NULL;

-- ============================================================================
-- STEP 3: Restrict allowed source values
-- ============================================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_source_allowed'
  ) THEN
    ALTER TABLE orders
    ADD CONSTRAINT orders_source_allowed
    CHECK (source IN ('website', 'manual', 'parlour'));
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Channel consistency constraints
-- ============================================================================

-- Manual orders cannot have affiliate_id or parlour_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_manual_no_affiliate_parlour'
  ) THEN
    ALTER TABLE orders
    ADD CONSTRAINT orders_manual_no_affiliate_parlour
    CHECK (
      source <> 'manual'
      OR (affiliate_id IS NULL AND parlour_id IS NULL)
    );
  END IF;
END $$;

-- Parlour orders must have parlour_id and cannot have affiliate_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_parlour_requires_parlour_id'
  ) THEN
    ALTER TABLE orders
    ADD CONSTRAINT orders_parlour_requires_parlour_id
    CHECK (
      source <> 'parlour'
      OR (parlour_id IS NOT NULL AND affiliate_id IS NULL)
    );
  END IF;
END $$;

-- Website orders cannot have parlour_id (affiliate_id is allowed)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_website_no_parlour_id'
  ) THEN
    ALTER TABLE orders
    ADD CONSTRAINT orders_website_no_parlour_id
    CHECK (
      source <> 'website'
      OR parlour_id IS NULL
    );
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Add unique index on order_code (partial - only when not null)
-- ============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS orders_order_code_unique
ON orders(order_code)
WHERE order_code IS NOT NULL;

-- ============================================================================
-- STEP 6: Auto-sync delivery_status to orders.status
-- When courier marks delivered, auto-promote admin status (unless cancelled)
-- ============================================================================
CREATE OR REPLACE FUNCTION sync_delivery_status_to_order_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if delivery_status changed to 'delivered'
  IF NEW.delivery_status = 'delivered' 
     AND (OLD.delivery_status IS NULL OR OLD.delivery_status <> 'delivered')
     AND NEW.status NOT IN ('cancelled', 'delivered') THEN
    
    NEW.status := 'delivered';
    NEW.delivered_at := COALESCE(NEW.delivered_at, NOW());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_delivery_status ON orders;
CREATE TRIGGER trigger_sync_delivery_status
BEFORE UPDATE OF delivery_status ON orders
FOR EACH ROW
EXECUTE FUNCTION sync_delivery_status_to_order_status();

-- ============================================================================
-- Summary of constraints after this migration:
-- 
-- 1. orders_channel_exclusivity: parlour_id and affiliate_id cannot both be set
-- 2. orders_source_allowed: source must be 'website', 'manual', or 'parlour'
-- 3. orders_manual_no_affiliate_parlour: manual orders have no affiliate/parlour
-- 4. orders_parlour_requires_parlour_id: parlour orders must have parlour_id
-- 5. orders_website_no_parlour_id: website orders cannot have parlour_id
-- 6. orders_order_code_unique: order_code must be unique when present
-- 7. trigger_sync_delivery_status: auto-sync delivery_status to status
-- ============================================================================
