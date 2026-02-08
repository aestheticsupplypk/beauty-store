-- ============================================================================
-- Migration: Payment Mode System
-- Date: 2026-02-07
-- Purpose: Add payment_mode, cod_due_amount columns with backfill
-- ============================================================================

-- ============================================================================
-- STEP 1: Add new columns
-- ============================================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_mode TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cod_due_amount NUMERIC(10,2);

-- ============================================================================
-- STEP 2: Backfill existing orders
-- Logic:
--   1. Parlour orders with payment_preference='advance' → 'prepaid'
--   2. Parlour orders with payment_preference='cod' → 'cod'
--   3. Orders with amount_paid > 0 AND amount_due > 0 → 'installment'
--   4. Orders with amount_paid >= grand_total (fully paid) → 'prepaid'
--   5. Everything else → 'cod'
-- ============================================================================

-- Parlour advance → prepaid
UPDATE orders
SET payment_mode = 'prepaid'
WHERE payment_mode IS NULL
  AND payment_preference = 'advance';

-- Parlour cod → cod
UPDATE orders
SET payment_mode = 'cod'
WHERE payment_mode IS NULL
  AND payment_preference = 'cod';

-- Installment cases: partial payment in progress
UPDATE orders
SET payment_mode = 'installment'
WHERE payment_mode IS NULL
  AND COALESCE(amount_paid, 0) > 0
  AND COALESCE(amount_due, 0) > 0;

-- Fully prepaid (amount_paid >= grand_total)
UPDATE orders
SET payment_mode = 'prepaid'
WHERE payment_mode IS NULL
  AND COALESCE(amount_paid, 0) > 0
  AND COALESCE(amount_due, 0) <= 0
  AND COALESCE(grand_total, 0) > 0;

-- Default everything else to COD
UPDATE orders
SET payment_mode = 'cod'
WHERE payment_mode IS NULL;

-- ============================================================================
-- STEP 3: Add constraints
-- ============================================================================

-- Set default and NOT NULL
ALTER TABLE orders
ALTER COLUMN payment_mode SET DEFAULT 'cod';

ALTER TABLE orders
ALTER COLUMN payment_mode SET NOT NULL;

-- Restrict allowed values
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_payment_mode_allowed'
  ) THEN
    ALTER TABLE orders
    ADD CONSTRAINT orders_payment_mode_allowed
    CHECK (payment_mode IN ('cod', 'prepaid', 'installment', 'split'));
  END IF;
END $$;

-- Split requires cod_due_amount
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_split_requires_cod_due'
  ) THEN
    ALTER TABLE orders
    ADD CONSTRAINT orders_split_requires_cod_due
    CHECK (payment_mode <> 'split' OR cod_due_amount IS NOT NULL);
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Update delivery trigger to NOT auto-insert payment
-- (We want admin-confirmed delivery with COD prompt, not auto-insert)
-- The existing sync_delivery_status_to_order_status trigger only syncs status,
-- which is correct. Payment insertion will be handled by admin UI action.
-- ============================================================================

-- No changes needed to existing trigger - it correctly only syncs status.

-- ============================================================================
-- Summary:
-- 1. Added payment_mode column with backfill:
--    - parlour advance → prepaid
--    - parlour cod → cod  
--    - partial payments → installment
--    - fully paid → prepaid
--    - default → cod
-- 2. Added cod_due_amount column for split payments
-- 3. Added constraints for allowed values and split validation
-- ============================================================================
