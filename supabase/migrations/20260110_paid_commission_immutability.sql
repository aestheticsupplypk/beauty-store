-- ============================================
-- PAID COMMISSION IMMUTABILITY CONSTRAINT
-- Run this in Supabase SQL Editor
-- ============================================
-- This trigger prevents any updates to commissions that are already paid.
-- If you need to correct a mistake, void the commission and create a new one.

-- Create function to prevent updates to paid commissions
CREATE OR REPLACE FUNCTION prevent_paid_commission_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If the commission was already paid, block the update
  IF OLD.status = 'paid' THEN
    -- Allow only specific fields to be updated (for admin corrections if needed)
    -- But block changes to financial fields
    IF OLD.commission_amount != NEW.commission_amount 
       OR OLD.order_id != NEW.order_id 
       OR OLD.affiliate_id != NEW.affiliate_id
       OR OLD.payout_batch_id != NEW.payout_batch_id THEN
      RAISE EXCEPTION 'Cannot modify paid commission. Void it and create a new one if correction needed.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_prevent_paid_commission_update ON affiliate_commissions;
CREATE TRIGGER trigger_prevent_paid_commission_update
BEFORE UPDATE ON affiliate_commissions
FOR EACH ROW
EXECUTE FUNCTION prevent_paid_commission_update();

-- Also prevent deletion of paid commissions
CREATE OR REPLACE FUNCTION prevent_paid_commission_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'paid' THEN
    RAISE EXCEPTION 'Cannot delete paid commission. This is an audit record.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_paid_commission_delete ON affiliate_commissions;
CREATE TRIGGER trigger_prevent_paid_commission_delete
BEFORE DELETE ON affiliate_commissions
FOR EACH ROW
EXECUTE FUNCTION prevent_paid_commission_delete();

-- Add index for better query performance on payout operations
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status_batch 
ON affiliate_commissions(status, payout_batch_id);

CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_payable 
ON affiliate_commissions(affiliate_id, status, payable_at) 
WHERE status = 'payable' AND payout_batch_id IS NULL;
