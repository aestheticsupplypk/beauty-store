-- ============================================================================
-- Migration: Order Detail Editing System
-- Date: 2026-02-07
-- Purpose: Add alternate_phone, audit log, and RPCs for order editing
-- ============================================================================

-- ============================================================================
-- STEP 1: Add alternate_phone column
-- ============================================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS alternate_phone text;

-- ============================================================================
-- STEP 2: Create order_audit_log table
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_audit_log (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  change_type      text NOT NULL CHECK (change_type IN ('customer_edit','pricing_edit','status_change')),
  actor_user_id    uuid NOT NULL,
  actor_role       text NULL,
  reason           text NULL,
  changes          jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_audit_log_order_id_created
ON order_audit_log(order_id, created_at DESC);

-- ============================================================================
-- STEP 3: Helper function - Get order channel (canonical badge logic)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_order_channel(p_order_id uuid)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT
    CASE
      WHEN o.source = 'parlour' THEN 'parlour'
      WHEN o.source = 'manual' THEN 'manual'
      WHEN o.affiliate_id IS NOT NULL THEN 'affiliate'
      ELSE 'web'
    END
  FROM orders o
  WHERE o.id = p_order_id;
$$;

-- ============================================================================
-- STEP 4: Helper function - Recalculate order totals
-- ============================================================================
CREATE OR REPLACE FUNCTION recalc_order_totals(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_items_subtotal numeric := 0;
  v_shipping numeric := 0;
  v_paid numeric := 0;
  v_total numeric := 0;
  v_due numeric := 0;
BEGIN
  -- Sum line totals
  SELECT COALESCE(SUM(ol.qty * ol.unit_price), 0)
    INTO v_items_subtotal
  FROM order_lines ol
  WHERE ol.order_id = p_order_id;

  -- Get shipping and paid amounts
  SELECT COALESCE(o.shipping_amount, 0),
         COALESCE(o.amount_paid, 0)
    INTO v_shipping, v_paid
  FROM orders o
  WHERE o.id = p_order_id;

  v_total := v_items_subtotal + v_shipping;
  IF v_total < 0 THEN v_total := 0; END IF;

  v_due := v_total - v_paid;

  UPDATE orders
  SET total_amount = v_items_subtotal,
      grand_total = v_total,
      amount_due = v_due
  WHERE id = p_order_id;
END;
$$;

-- ============================================================================
-- STEP 5: RPC - Update customer info (allowed for all orders, any status)
-- ============================================================================
CREATE OR REPLACE FUNCTION admin_update_order_customer_info(
  p_order_id uuid,
  p_customer_name text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_alternate_phone text DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_city text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_before jsonb;
  v_after jsonb;
  v_changes jsonb := '{}'::jsonb;
  v_user_id uuid;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get before state
  SELECT jsonb_build_object(
    'customer_name', customer_name,
    'phone', phone,
    'alternate_phone', alternate_phone,
    'address', address,
    'city', city
  ) INTO v_before
  FROM orders WHERE id = p_order_id;

  IF v_before IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Update only provided fields
  UPDATE orders
  SET customer_name = COALESCE(p_customer_name, customer_name),
      phone = COALESCE(p_phone, phone),
      alternate_phone = COALESCE(p_alternate_phone, alternate_phone),
      address = COALESCE(p_address, address),
      city = COALESCE(p_city, city)
  WHERE id = p_order_id;

  -- Get after state
  SELECT jsonb_build_object(
    'customer_name', customer_name,
    'phone', phone,
    'alternate_phone', alternate_phone,
    'address', address,
    'city', city
  ) INTO v_after
  FROM orders WHERE id = p_order_id;

  -- Build changes diff (only changed fields)
  IF v_before->>'customer_name' IS DISTINCT FROM v_after->>'customer_name' THEN
    v_changes := v_changes || jsonb_build_object('customer_name', jsonb_build_object('from', v_before->>'customer_name', 'to', v_after->>'customer_name'));
  END IF;
  IF v_before->>'phone' IS DISTINCT FROM v_after->>'phone' THEN
    v_changes := v_changes || jsonb_build_object('phone', jsonb_build_object('from', v_before->>'phone', 'to', v_after->>'phone'));
  END IF;
  IF v_before->>'alternate_phone' IS DISTINCT FROM v_after->>'alternate_phone' THEN
    v_changes := v_changes || jsonb_build_object('alternate_phone', jsonb_build_object('from', v_before->>'alternate_phone', 'to', v_after->>'alternate_phone'));
  END IF;
  IF v_before->>'address' IS DISTINCT FROM v_after->>'address' THEN
    v_changes := v_changes || jsonb_build_object('address', jsonb_build_object('from', v_before->>'address', 'to', v_after->>'address'));
  END IF;
  IF v_before->>'city' IS DISTINCT FROM v_after->>'city' THEN
    v_changes := v_changes || jsonb_build_object('city', jsonb_build_object('from', v_before->>'city', 'to', v_after->>'city'));
  END IF;

  -- Only log if something changed
  IF v_changes != '{}'::jsonb THEN
    INSERT INTO order_audit_log(order_id, change_type, actor_user_id, reason, changes)
    VALUES (p_order_id, 'customer_edit', v_user_id, NULL, v_changes);
  END IF;

  RETURN jsonb_build_object('ok', true, 'changes', v_changes);
END;
$$;

-- ============================================================================
-- STEP 6: RPC - Update order pricing (Web + Parlour only, Pending only)
-- ============================================================================
CREATE OR REPLACE FUNCTION admin_update_order_pricing(
  p_order_id uuid,
  p_shipping_amount numeric DEFAULT NULL,
  p_lines jsonb DEFAULT NULL,  -- [{"line_id":"uuid-or-null", "variant_id":"uuid", "qty":2, "unit_price":3000}, ...]
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_channel text;
  v_status text;
  v_user_id uuid;
  v_before_lines jsonb;
  v_after_lines jsonb;
  v_before_shipping numeric;
  v_changes jsonb := '{}'::jsonb;
  v_line record;
  v_existing_ids uuid[];
  v_new_ids uuid[];
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get order channel and status
  SELECT get_order_channel(p_order_id), o.status, o.shipping_amount
  INTO v_channel, v_status, v_before_shipping
  FROM orders o
  WHERE o.id = p_order_id;

  IF v_channel IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Enforce: only Web or Parlour can edit pricing
  IF v_channel NOT IN ('web', 'parlour') THEN
    RAISE EXCEPTION 'Pricing edits not allowed for % orders', v_channel;
  END IF;

  -- Enforce: only Pending status can edit pricing
  IF v_status != 'pending' THEN
    RAISE EXCEPTION 'Pricing edits only allowed when status is Pending (current: %)', v_status;
  END IF;

  -- Require reason for pricing changes
  IF p_reason IS NULL OR p_reason = '' THEN
    RAISE EXCEPTION 'Reason is required for pricing edits';
  END IF;

  -- Get before state of lines
  SELECT jsonb_agg(jsonb_build_object(
    'line_id', ol.id,
    'variant_id', ol.variant_id,
    'qty', ol.qty,
    'unit_price', ol.unit_price
  ) ORDER BY ol.id)
  INTO v_before_lines
  FROM order_lines ol
  WHERE ol.order_id = p_order_id;

  -- Update shipping if provided
  IF p_shipping_amount IS NOT NULL THEN
    UPDATE orders SET shipping_amount = p_shipping_amount WHERE id = p_order_id;
    IF v_before_shipping IS DISTINCT FROM p_shipping_amount THEN
      v_changes := v_changes || jsonb_build_object('shipping_amount', jsonb_build_object('from', v_before_shipping, 'to', p_shipping_amount));
    END IF;
  END IF;

  -- Update lines if provided
  IF p_lines IS NOT NULL AND jsonb_array_length(p_lines) > 0 THEN
    -- Get existing line IDs
    SELECT array_agg(id) INTO v_existing_ids FROM order_lines WHERE order_id = p_order_id;
    v_new_ids := ARRAY[]::uuid[];

    -- Process each line in the input
    FOR v_line IN SELECT * FROM jsonb_to_recordset(p_lines) AS x(line_id uuid, variant_id uuid, qty int, unit_price numeric)
    LOOP
      IF v_line.line_id IS NOT NULL AND v_line.line_id = ANY(v_existing_ids) THEN
        -- Update existing line
        UPDATE order_lines
        SET qty = v_line.qty,
            unit_price = v_line.unit_price,
            line_total = v_line.qty * v_line.unit_price
        WHERE id = v_line.line_id;
        v_new_ids := array_append(v_new_ids, v_line.line_id);
      ELSE
        -- Insert new line
        INSERT INTO order_lines (order_id, variant_id, qty, unit_price, line_total)
        VALUES (p_order_id, v_line.variant_id, v_line.qty, v_line.unit_price, v_line.qty * v_line.unit_price)
        RETURNING id INTO v_line.line_id;
        v_new_ids := array_append(v_new_ids, v_line.line_id);
      END IF;
    END LOOP;

    -- Delete lines not in new list
    DELETE FROM order_lines
    WHERE order_id = p_order_id
      AND id != ALL(v_new_ids);
  END IF;

  -- Recalculate totals
  PERFORM recalc_order_totals(p_order_id);

  -- Get after state of lines
  SELECT jsonb_agg(jsonb_build_object(
    'line_id', ol.id,
    'variant_id', ol.variant_id,
    'qty', ol.qty,
    'unit_price', ol.unit_price
  ) ORDER BY ol.id)
  INTO v_after_lines
  FROM order_lines ol
  WHERE ol.order_id = p_order_id;

  -- Add lines diff if changed
  IF v_before_lines IS DISTINCT FROM v_after_lines THEN
    v_changes := v_changes || jsonb_build_object('order_lines', jsonb_build_object('from', COALESCE(v_before_lines, '[]'::jsonb), 'to', COALESCE(v_after_lines, '[]'::jsonb)));
  END IF;

  -- Log the change
  IF v_changes != '{}'::jsonb THEN
    INSERT INTO order_audit_log(order_id, change_type, actor_user_id, reason, changes)
    VALUES (p_order_id, 'pricing_edit', v_user_id, p_reason, v_changes);
  END IF;

  RETURN jsonb_build_object('ok', true, 'changes', v_changes);
END;
$$;

-- ============================================================================
-- STEP 7: RPC - Update order status with audit logging
-- ============================================================================
CREATE OR REPLACE FUNCTION admin_update_order_status_with_audit(
  p_order_id uuid,
  p_new_status text,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_status text;
  v_user_id uuid;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get current status
  SELECT status INTO v_old_status FROM orders WHERE id = p_order_id;
  
  IF v_old_status IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Update status
  UPDATE orders
  SET status = p_new_status
  WHERE id = p_order_id;

  -- Log the change
  INSERT INTO order_audit_log(order_id, change_type, actor_user_id, reason, changes)
  VALUES (
    p_order_id,
    'status_change',
    v_user_id,
    p_reason,
    jsonb_build_object('status', jsonb_build_object('from', v_old_status, 'to', p_new_status))
  );

  RETURN jsonb_build_object('ok', true, 'from', v_old_status, 'to', p_new_status);
END;
$$;

-- ============================================================================
-- Summary:
-- 1. Added alternate_phone column to orders
-- 2. Created order_audit_log table for tracking changes
-- 3. Created get_order_channel() helper (matches canonical badge logic)
-- 4. Created recalc_order_totals() helper
-- 5. Created admin_update_order_customer_info() RPC - always allowed
-- 6. Created admin_update_order_pricing() RPC - Web/Parlour + Pending only
-- 7. Created admin_update_order_status_with_audit() RPC - with audit logging
-- ============================================================================
