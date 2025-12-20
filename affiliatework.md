# Affiliate Implementation Work Log

This file tracks what has been implemented so far for the affiliate/referral system and what remains.

---

## Completed

### 1. Database schema

- **`affiliates` table**
  - Created via SQL (per `affiliate.md` blueprint):
    - `id`, `created_at`, `updated_at`, `active`
    - `type` (`parlour` / `individual`)
    - `name`, `parlour_name`, `phone`, `email`, `city`
    - `code` (unique referral code)
    - `notes`, `payout_method`, `payout_details`

- **`orders` table** additions
  - `affiliate_id uuid references affiliates(id)`
  - `affiliate_ref_code text`
  - `affiliate_commission_amount numeric(12,2) default 0`

- **`products` table** additions
  - `affiliate_enabled boolean default false`
  - `affiliate_discount_type text check in ('none','percent','fixed') default 'none'`
  - `affiliate_discount_value numeric(12,2)`
  - `affiliate_commission_type text check in ('percent','fixed') default 'percent'`
  - `affiliate_commission_value numeric(12,2)`

These columns are now available for use in the app and in Supabase.

---

### 2. Admin: Product edit page (`src/app/admin/products/[id]/page.tsx`)

- **Product type & state**
  - Extended `Product` type with:
    - `affiliate_enabled?: boolean | null`
    - `affiliate_discount_type?: 'none' | 'percent' | 'fixed' | null`
    - `affiliate_discount_value?: number | null`
    - `affiliate_commission_type?: 'percent' | 'fixed' | null`
    - `affiliate_commission_value?: number | null`
  - Added React state:
    - `affiliateEnabled`
    - `affiliateDiscountType`
    - `affiliateDiscountValue`
    - `affiliateCommissionType`
    - `affiliateCommissionValue`
  - Included these in `initialBasics` snapshot + dirty tracking.

- **Data loading**
  - `supabaseBrowser.from('products')` select now includes the affiliate columns.
  - On load, the component:
    - Sets `affiliateEnabled` from `affiliate_enabled`.
    - Maps `affiliate_discount_type` to a local `'none' | 'percent' | 'fixed'` value.
    - Loads numeric values into string state for inputs.

- **Saving**
  - Both `saveBasics` and `saveAllEdits` update the affiliate fields on `products`:
    - `affiliate_enabled`
    - `affiliate_discount_type`
    - `affiliate_discount_value`
    - `affiliate_commission_type`
    - `affiliate_commission_value`
  - Logic:
    - If `affiliateEnabled` is false:
      - `affiliate_discount_type` forced to `'none'` and value set to `null`.
      - `affiliate_commission_type` defaults to `'percent'`, `affiliate_commission_value` set to `null`.
    - If enabled:
      - Discount value only saved when type is not `'none'` and the input is non-empty.
      - Commission value saved when the input is non-empty.

- **Visible UI section**
  - New **"Affiliate & Discount Settings"** section between Basics and Promotions:
    - Checkbox: *Enable referrals for this product*.
    - **Customer discount** block:
      - Select: `No discount / Percentage (%) / Fixed amount (PKR)`.
      - Numeric input for value.
      - Helper text: `'% of listed price'` or `'PKR per unit'`.
    - **Affiliate commission** block:
      - Select: `Percentage (%) / Fixed amount (PKR)`.
      - Numeric input for value.
      - Helper text: `'% of listed price'` or `'PKR per unit'`.
  - These controls are disabled when referrals are not enabled.

Result: you can now configure, per product, whether referrals are enabled and what customer discount + affiliate commission should be, using either percent or fixed PKR, all based on the listed online price.

---

## In Progress / Next Steps

### 3. Checkout page – referral code field

**File:** `src/app/checkout/page.tsx`

Planned work (not yet implemented):

- Add an input inside the main checkout form:
  - Label: `Referral / Beautician code (optional)`.
  - `name="ref_code"`.
  - Placed near the contact fields (likely under Email).
- On submit (`handlePlaceOrder`):
  - Read from `FormData`:
    - `const refCode0 = String(fd0.get('ref_code') || '').trim().toUpperCase();`
  - Add to `payload` sent to `/api/orders/create`:
    - `ref_code: refCode0 || undefined`.
- Optionally, later:
  - Add client-side feedback (code applied / invalid), but v1 can rely purely on server-side validation.

### 4. `/api/orders/create` – validate code, apply discount & commission

**File:** `src/app/api/orders/create/route.ts`

Current behavior:
- Creates orders with `source='online'`, `payment_status='unpaid'`.
- Uses variant `price` values for `order_lines`.
- Computes `itemsSubtotal` = sum of `unit_price * qty`.
- `grandTotal = itemsSubtotal + shippingAmount`.
- Does **not** yet know about `ref_code`, affiliates, or per-product affiliate settings.

Planned enhancements:

1. **Read referral code from body**
   - After `const body = await req.json();`:
     - `const rawRef = String(body?.ref_code || '').trim().toUpperCase();`

2. **Look up affiliate**
   - If `rawRef` is non-empty:
     - Query `affiliates` table:
       ```ts
       const { data: aff } = await supabase
         .from('affiliates')
         .select('id, code, active')
         .eq('code', rawRef)
         .maybeSingle();
       ```
     - Only treat as valid if `aff && aff.active`.
     - Store `affiliateId` and `affiliateRefCode` variables for later.

3. **Fetch product-level affiliate settings**
   - We already fetch variants with `id, sku, price, product_id`.
   - Collect all `product_id`s from `variantRows` into a Set.
   - Query `products`:
     ```ts
     const { data: productRows } = await supabase
       .from('products')
       .select('id, affiliate_enabled, affiliate_discount_type, affiliate_discount_value, affiliate_commission_type, affiliate_commission_value')
       .in('id', productIds);
     ```
   - Build a `productAffMap` keyed by `product_id` for quick lookup.

4. **Calculate discounts and commissions per line**
   - Modify the order-lines loop to compute:
     - `customerDiscountPerUnit` (0 if no valid affiliate or product has affiliate disabled).
     - `commissionPerUnit` (0 if no valid affiliate). Always based on **listed unit price** from `variants.price`.
   - For each line:
     - Base price per unit `P = v.price`.
     - From `productAffMap[product_id]`:
       - Discount:
         - If `discount_type === 'percent'`: `discUnit = P * (discount_value / 100)`.
         - If `discount_type === 'fixed'`: `discUnit = discount_value`.
         - Else: `discUnit = 0`.
       - Commission:
         - If `commission_type === 'percent'`: `commUnit = P * (commission_value / 100)`.
         - If `commission_type === 'fixed'`: `commUnit = commission_value`.
         - Else: `commUnit = 0`.
     - Clamp discount so `discUnit` never exceeds `P`.
     - Compute:
       - `customerUnitPrice = P - discUnit`.
       - `lineCustomerTotal = customerUnitPrice * qty`.
       - `lineCommission = commUnit * qty`.
   - Keep two running totals:
     - `itemsSubtotalCustomer` (what the customer pays before shipping).
     - `totalCommission` (sum of `lineCommission`).

5. **Use discounted subtotal for order totals**
   - Replace existing `itemsSubtotal` / `grandTotal` with the new discounted values when there is a valid affiliate and affiliate is enabled for those products.
   - `grandTotal = itemsSubtotalCustomer + shippingAmount`.

6. **Set affiliate fields on `orders` row**
   - When inserting into `orders`:
     - Add:
       - `affiliate_id: affiliateId || null`
       - `affiliate_ref_code: affiliateRefCode || null`
       - `affiliate_commission_amount: affiliateId ? totalCommission : 0`

7. **Order lines storage**
   - Decide what to store as `unit_price` / `line_total` in `order_lines`:
     - For v1, we can either:
       - Store **discounted** unit price (what the customer pays), **or**
       - Store original price but rely on `orders.total_amount` for customer subtotal.
   - Recommended: store **discounted** `unit_price` and `line_total` so order_lines reflect customer pricing; list price remains in `variants.price` and in product settings.

8. **Edge cases**
   - If `ref_code` is invalid or inactive:
     - Treat as normal (no discount, no commission, affiliate fields left null).
   - If some products have `affiliate_enabled=false`:
     - No discount or commission is applied for those lines, even if a valid code is used.

### 5. Basic affiliate info on order admin page

**File:** `src/app/admin/orders/[id]/page.tsx`

Planned additions:

- When fetching the order, also select:
  - `affiliate_id`, `affiliate_ref_code`, `affiliate_commission_amount`.
- Display in the order header or in a small box on the right:
  - `Affiliate: CODE` (and later name once we join to `affiliates`).
  - `Affiliate commission: PKR X`.

This will confirm that affiliate attribution and commission calculation is working for each order.

---

## Future Phases (not started here)

- Hidden affiliate signup page (`/affiliate/signup`).
- Affiliate login + dashboard (`/affiliate/dashboard`).
- `/admin/affiliates` list + detail views.
- Payout tracking (`affiliate_payouts` table) and marking commission as paid.

These are described in more detail in `affiliate.md` and will be implemented after the core tracking (checkout + orders) is verified.
