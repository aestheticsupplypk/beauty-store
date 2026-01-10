-- ============================================
-- AFFILIATE PROGRAM ACCOUNTING MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- A) ENUMS (using TEXT with CHECK for simplicity)
-- ============================================

-- 1. Add status and strike_count to affiliates table
ALTER TABLE affiliates 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'warning', 'suspended', 'revoked')),
ADD COLUMN IF NOT EXISTS strike_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_strike_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS revoked_reason TEXT;

-- Update existing affiliates: set status based on active field
UPDATE affiliates SET status = CASE WHEN active = true THEN 'active' ELSE 'suspended' END WHERE status IS NULL;

-- ============================================
-- B) ORDERS TABLE: delivery metadata + guardrail
-- ============================================

-- 2. Add delivery tracking fields to orders table
-- Using expanded failed_delivery_reason that separates strike-eligible vs non-strike-eligible
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_status TEXT CHECK (delivery_status IN ('pending', 'dispatched', 'in_transit', 'delivered', 'failed', 'returned', 'cancelled')),
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_failed_delivery BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS failed_delivery_reason TEXT CHECK (failed_delivery_reason IN (
  -- Strike-eligible (customer/recipient driven)
  'wrong_or_incomplete_address',
  'unreachable_phone',
  'customer_refused',
  'not_available_after_attempts',
  'cod_refused',
  -- NOT strike-eligible (courier/ops/merchant driven)
  'courier_operational_issue',
  'weather_or_road_closure',
  'shipment_damaged_in_transit',
  'lost_by_courier',
  'late_sla_by_courier',
  'merchant_cancelled',
  'out_of_stock',
  'other_not_strike_eligible',
  -- Fallback
  'other'
)),
ADD COLUMN IF NOT EXISTS courier_status TEXT,
ADD COLUMN IF NOT EXISTS courier_rider_notes TEXT;

-- 3. Add constraint: order cannot be both parlour AND affiliate
-- First check if constraint exists, then add
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_channel_exclusivity'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT orders_channel_exclusivity 
    CHECK (NOT (parlour_id IS NOT NULL AND affiliate_id IS NOT NULL));
  END IF;
END $$;

-- 4. Create affiliate_commissions table
CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  
  -- Commission amounts
  order_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  commission_rate NUMERIC(5,4) NOT NULL DEFAULT 0.10, -- 10% = 0.10
  commission_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'payable', 'paid', 'void')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  payable_at TIMESTAMPTZ, -- When commission becomes payable (delivered_at + 10 days)
  paid_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,
  void_reason TEXT,
  
  -- Payout tracking
  payout_batch_id UUID,
  
  UNIQUE(order_id) -- One commission per order
);

-- 5. Create payout_batches table for monthly payouts
CREATE TABLE IF NOT EXISTS affiliate_payout_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Batch info
  batch_date DATE NOT NULL, -- The payout date (e.g., 10th of month)
  period_start DATE NOT NULL, -- Start of period covered
  period_end DATE NOT NULL, -- End of period covered
  
  -- Totals
  total_commissions NUMERIC(10,2) DEFAULT 0,
  total_affiliates INTEGER DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  
  -- Notes
  notes TEXT
);

-- 6. Add foreign key for payout_batch_id
ALTER TABLE affiliate_commissions
ADD CONSTRAINT fk_payout_batch
FOREIGN KEY (payout_batch_id) REFERENCES affiliate_payout_batches(id);

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_id ON affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON affiliate_commissions(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_payable_at ON affiliate_commissions(payable_at);
CREATE INDEX IF NOT EXISTS idx_orders_affiliate_id ON orders(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON orders(delivery_status);

-- 8. Create function to calculate affiliate strikes (rolling 30 days)
CREATE OR REPLACE FUNCTION calculate_affiliate_strikes(p_affiliate_id UUID)
RETURNS INTEGER AS $$
DECLARE
  strike_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO strike_count
  FROM orders
  WHERE affiliate_id = p_affiliate_id
    AND is_failed_delivery = true
    AND created_at >= NOW() - INTERVAL '30 days';
  
  RETURN strike_count;
END;
$$ LANGUAGE plpgsql;

-- 9. Create function to update affiliate status based on strikes
CREATE OR REPLACE FUNCTION update_affiliate_status_from_strikes()
RETURNS TRIGGER AS $$
DECLARE
  current_strikes INTEGER;
  current_status TEXT;
BEGIN
  -- Only process if this is a failed delivery
  IF NEW.is_failed_delivery = true AND NEW.affiliate_id IS NOT NULL THEN
    -- Calculate current strikes
    current_strikes := calculate_affiliate_strikes(NEW.affiliate_id);
    
    -- Get current status
    SELECT status INTO current_status FROM affiliates WHERE id = NEW.affiliate_id;
    
    -- Don't change if already revoked (permanent)
    IF current_status = 'revoked' THEN
      RETURN NEW;
    END IF;
    
    -- Update affiliate based on strike count
    IF current_strikes >= 5 THEN
      UPDATE affiliates 
      SET strike_count = current_strikes, 
          status = 'suspended',
          active = false
      WHERE id = NEW.affiliate_id;
    ELSIF current_strikes >= 3 THEN
      UPDATE affiliates 
      SET strike_count = current_strikes, 
          status = 'warning'
      WHERE id = NEW.affiliate_id;
    ELSE
      UPDATE affiliates 
      SET strike_count = current_strikes
      WHERE id = NEW.affiliate_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger for strike updates
DROP TRIGGER IF EXISTS trigger_update_affiliate_strikes ON orders;
CREATE TRIGGER trigger_update_affiliate_strikes
AFTER INSERT OR UPDATE OF is_failed_delivery ON orders
FOR EACH ROW
EXECUTE FUNCTION update_affiliate_status_from_strikes();

-- 11. Create function to create commission when order is delivered
CREATE OR REPLACE FUNCTION create_affiliate_commission_on_delivery()
RETURNS TRIGGER AS $$
DECLARE
  aff_commission_rate NUMERIC(5,4);
  calc_commission NUMERIC(10,2);
BEGIN
  -- Only process if order has affiliate and is now delivered
  IF NEW.affiliate_id IS NOT NULL 
     AND NEW.delivery_status = 'delivered' 
     AND (OLD.delivery_status IS NULL OR OLD.delivery_status != 'delivered') THEN
    
    -- Get affiliate commission rate (default 10%)
    SELECT COALESCE(commission_rate, 0.10) INTO aff_commission_rate
    FROM affiliates WHERE id = NEW.affiliate_id;
    
    -- Calculate commission
    calc_commission := ROUND(NEW.total_amount * aff_commission_rate, 2);
    
    -- Insert or update commission record
    INSERT INTO affiliate_commissions (
      order_id,
      affiliate_id,
      order_total,
      commission_rate,
      commission_amount,
      status,
      payable_at
    ) VALUES (
      NEW.id,
      NEW.affiliate_id,
      NEW.total_amount,
      aff_commission_rate,
      calc_commission,
      'pending',
      COALESCE(NEW.delivered_at, NOW()) + INTERVAL '10 days'
    )
    ON CONFLICT (order_id) DO UPDATE SET
      order_total = EXCLUDED.order_total,
      commission_amount = EXCLUDED.commission_amount,
      payable_at = EXCLUDED.payable_at;
    
    -- Also update the order's commission amount field
    NEW.affiliate_commission_amount := calc_commission;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Create trigger for commission creation
DROP TRIGGER IF EXISTS trigger_create_affiliate_commission ON orders;
CREATE TRIGGER trigger_create_affiliate_commission
BEFORE UPDATE OF delivery_status ON orders
FOR EACH ROW
EXECUTE FUNCTION create_affiliate_commission_on_delivery();

-- 13. Create function to void commission on failed delivery
CREATE OR REPLACE FUNCTION void_commission_on_failed_delivery()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_failed_delivery = true AND NEW.affiliate_id IS NOT NULL THEN
    UPDATE affiliate_commissions
    SET status = 'void',
        voided_at = NOW(),
        void_reason = NEW.failed_delivery_reason
    WHERE order_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 14. Create trigger for voiding commissions
DROP TRIGGER IF EXISTS trigger_void_commission_on_failure ON orders;
CREATE TRIGGER trigger_void_commission_on_failure
AFTER UPDATE OF is_failed_delivery ON orders
FOR EACH ROW
WHEN (NEW.is_failed_delivery = true)
EXECUTE FUNCTION void_commission_on_failed_delivery();

-- 15. Create view for commission status (real-time calculation)
CREATE OR REPLACE VIEW affiliate_commissions_with_status AS
SELECT 
  ac.*,
  CASE 
    WHEN ac.status = 'void' THEN 'void'
    WHEN ac.status = 'paid' THEN 'paid'
    WHEN ac.status = 'payable' THEN 'payable'
    WHEN ac.payable_at <= NOW() THEN 'payable'
    ELSE 'pending'
  END AS calculated_status
FROM affiliate_commissions ac;

-- 16. Add commission_rate to affiliates if not exists
ALTER TABLE affiliates
ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,4) DEFAULT 0.10;

-- ============================================
-- C3) STRIKE EVENTS LOG TABLE (for audit trail)
-- ============================================

CREATE TABLE IF NOT EXISTS affiliate_strike_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  reason TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_strikes_affiliate_time ON affiliate_strike_events(affiliate_id, occurred_at DESC);

-- ============================================
-- D) STRIKE ELIGIBILITY FUNCTION
-- Determines if a failed_delivery_reason counts as a strike
-- ============================================

CREATE OR REPLACE FUNCTION is_strike_eligible_failed_delivery(reason TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT reason IN (
    'wrong_or_incomplete_address',
    'unreachable_phone',
    'customer_refused',
    'not_available_after_attempts',
    'cod_refused'
  );
$$;

-- ============================================
-- E) IMPROVED COMMISSION + STRIKE TRIGGER
-- Handles: delivery → commission, failed → void + strike
-- ============================================

CREATE OR REPLACE FUNCTION handle_affiliate_on_order_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_payable_at TIMESTAMPTZ;
  v_is_strike BOOLEAN;
  v_window_start TIMESTAMPTZ;
  v_strikes_30d INTEGER;
BEGIN
  -- Only relevant if order is affiliate-attributed
  IF NEW.affiliate_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- 1) DELIVERED: create/update commission row -> pending
  IF NEW.delivery_status = 'delivered' AND (OLD.delivery_status IS DISTINCT FROM NEW.delivery_status) THEN
    IF NEW.delivered_at IS NULL THEN
      NEW.delivered_at := NOW();
    END IF;

    v_payable_at := NEW.delivered_at + INTERVAL '10 days';

    -- Use the pre-calculated commission from order (set at checkout based on product settings)
    INSERT INTO affiliate_commissions (
      order_id, affiliate_id, commission_amount, status, payable_at
    )
    VALUES (
      NEW.id, NEW.affiliate_id,
      COALESCE(NEW.affiliate_commission_amount, 0),
      'pending',
      v_payable_at
    )
    ON CONFLICT (order_id) DO UPDATE SET
      affiliate_id = EXCLUDED.affiliate_id,
      commission_amount = EXCLUDED.commission_amount,
      status = CASE
        WHEN affiliate_commissions.status = 'paid' THEN affiliate_commissions.status
        ELSE 'pending'
      END,
      payable_at = EXCLUDED.payable_at;
  END IF;

  -- 2) FAILED/RETURNED/CANCELLED -> commission void (if any)
  IF NEW.delivery_status IN ('failed', 'returned', 'cancelled')
     AND (OLD.delivery_status IS DISTINCT FROM NEW.delivery_status) THEN

    IF NEW.delivery_status = 'failed' THEN
      NEW.is_failed_delivery := TRUE;
      IF NEW.failed_at IS NULL THEN NEW.failed_at := NOW(); END IF;
    END IF;

    UPDATE affiliate_commissions
      SET status = 'void',
          voided_at = NOW(),
          void_reason = CONCAT('Order ', NEW.delivery_status::TEXT,
                               COALESCE(CONCAT(' (', NEW.failed_delivery_reason::TEXT, ')'), ''))
    WHERE order_id = NEW.id
      AND status <> 'paid'; -- do not rewrite paid history

    -- Strike logic only for failed deliveries with strike-eligible reasons
    IF NEW.delivery_status = 'failed' AND NEW.failed_delivery_reason IS NOT NULL THEN
      v_is_strike := is_strike_eligible_failed_delivery(NEW.failed_delivery_reason);

      IF v_is_strike THEN
        -- Log the strike event
        INSERT INTO affiliate_strike_events(affiliate_id, order_id, reason, notes)
        VALUES (NEW.affiliate_id, NEW.id, NEW.failed_delivery_reason, NEW.courier_rider_notes);

        -- Rolling 30 days strikes
        v_window_start := NOW() - INTERVAL '30 days';

        SELECT COUNT(*) INTO v_strikes_30d
        FROM affiliate_strike_events
        WHERE affiliate_id = NEW.affiliate_id
          AND occurred_at >= v_window_start;

        -- Update affiliate status thresholds
        UPDATE affiliates
        SET strike_count = v_strikes_30d,
            last_strike_at = NOW(),
            status = CASE
              WHEN v_strikes_30d >= 5 THEN 'suspended'
              WHEN v_strikes_30d >= 3 THEN 'warning'
              ELSE status -- keep current if < 3
            END,
            active = CASE WHEN v_strikes_30d >= 5 THEN FALSE ELSE active END
        WHERE id = NEW.affiliate_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END $$;

-- Drop old triggers and create new unified one
DROP TRIGGER IF EXISTS trigger_update_affiliate_strikes ON orders;
DROP TRIGGER IF EXISTS trigger_create_affiliate_commission ON orders;
DROP TRIGGER IF EXISTS trigger_void_commission_on_failure ON orders;

CREATE TRIGGER trg_order_affiliate_update
BEFORE UPDATE OF delivery_status, affiliate_id, affiliate_commission_amount, failed_delivery_reason ON orders
FOR EACH ROW
EXECUTE FUNCTION handle_affiliate_on_order_update();

-- ============================================
-- F) PROMOTE PENDING → PAYABLE (run daily)
-- ============================================

CREATE OR REPLACE FUNCTION promote_pending_commissions_to_payable()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE affiliate_commissions
  SET status = 'payable'
  WHERE status = 'pending'
    AND payable_at IS NOT NULL
    AND NOW() >= payable_at;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END $$;

-- ============================================
-- G) MONTHLY PAYOUT BATCH (run on 10th)
-- ============================================

CREATE OR REPLACE FUNCTION run_monthly_affiliate_payout(p_paid_on DATE DEFAULT CURRENT_DATE)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_period_start DATE;
  v_period_end DATE;
  v_batch_id UUID;
  v_total_amount NUMERIC(10,2);
  v_total_affiliates INTEGER;
BEGIN
  -- Previous month window
  v_period_start := (DATE_TRUNC('month', p_paid_on)::DATE - INTERVAL '1 month')::DATE;
  v_period_end   := (DATE_TRUNC('month', p_paid_on)::DATE - INTERVAL '1 day')::DATE;

  -- Calculate totals before creating batch
  SELECT COALESCE(SUM(commission_amount), 0), COUNT(DISTINCT affiliate_id)
  INTO v_total_amount, v_total_affiliates
  FROM affiliate_commissions
  WHERE status = 'payable'
    AND payable_at::DATE BETWEEN v_period_start AND v_period_end;

  -- Create payout batch
  INSERT INTO affiliate_payout_batches(period_start, period_end, batch_date, total_commissions, total_affiliates, notes)
  VALUES (v_period_start, v_period_end, p_paid_on, v_total_amount, v_total_affiliates, 'Monthly payout batch')
  RETURNING id INTO v_batch_id;

  -- Mark commissions as paid
  UPDATE affiliate_commissions
  SET status = 'paid',
      paid_at = NOW(),
      payout_batch_id = v_batch_id
  WHERE status = 'payable'
    AND payable_at::DATE BETWEEN v_period_start AND v_period_end;

  RETURN v_batch_id;
END $$;

-- ============================================
-- H) DASHBOARD VIEWS
-- ============================================

-- 1) Summary per affiliate
CREATE OR REPLACE VIEW v_affiliate_dashboard_summary AS
SELECT
  a.id AS affiliate_id,
  a.code AS affiliate_code,
  a.name AS affiliate_name,
  a.status AS affiliate_status,
  a.strike_count,
  a.active,

  -- Orders count
  COUNT(DISTINCT o.id) AS total_orders,
  COALESCE(SUM(o.total_amount), 0) AS total_sales,

  -- Commissions by status
  COALESCE(SUM(ac.commission_amount), 0) AS total_commission_all_time,
  COALESCE(SUM(ac.commission_amount) FILTER (WHERE ac.status = 'pending'), 0) AS commission_pending,
  COALESCE(SUM(ac.commission_amount) FILTER (WHERE ac.status = 'payable'), 0) AS commission_payable,
  COALESCE(SUM(ac.commission_amount) FILTER (WHERE ac.status = 'paid'), 0) AS commission_paid

FROM affiliates a
LEFT JOIN orders o ON o.affiliate_id = a.id
LEFT JOIN affiliate_commissions ac ON ac.affiliate_id = a.id
GROUP BY a.id, a.code, a.name, a.status, a.strike_count, a.active;

-- 2) Orders list for affiliate dashboard
CREATE OR REPLACE VIEW v_affiliate_orders AS
SELECT
  o.id,
  o.created_at,
  o.order_code,
  o.total_amount,
  o.delivery_status,
  o.delivered_at,
  o.is_failed_delivery,
  o.failed_delivery_reason,
  o.affiliate_id,
  o.affiliate_ref_code,
  o.customer_name,
  COALESCE(ac.status, 'pending') AS commission_status,
  COALESCE(ac.commission_amount, o.affiliate_commission_amount, 0) AS commission_amount,
  ac.payable_at,
  ac.paid_at
FROM orders o
LEFT JOIN affiliate_commissions ac ON ac.order_id = o.id
WHERE o.affiliate_id IS NOT NULL;

-- ============================================
-- HELPER: Touch updated_at on commission changes
-- ============================================

ALTER TABLE affiliate_commissions
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_aff_comm_touch ON affiliate_commissions;
CREATE TRIGGER trg_aff_comm_touch
BEFORE UPDATE ON affiliate_commissions
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ============================================
-- DONE!
-- 
-- SCHEDULED JOBS TO RUN:
-- 1. Daily: SELECT promote_pending_commissions_to_payable();
-- 2. Monthly (10th): SELECT run_monthly_affiliate_payout(CURRENT_DATE);
-- ============================================
