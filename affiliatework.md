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

## Additional Completed Work

### 3. Checkout page – referral code field & live discount preview

**File:** `src/app/checkout/page.tsx`

- Added `Referral / Beautician code (optional)` input (`name="ref_code"`).
- On submit, the value is sent to `/api/orders/create` via `ref_code` in the JSON payload.
- Added `Apply` button that:
  - Validates the code via `/api/affiliate/validate`.
  - Reads product-level affiliate settings and computes a per-cart referral discount.
  - Updates the Order Summary to show:
    - Original items subtotal.
    - Referral discount amount.
    - Subtotal after discount.
    - Updated total.
- Success state (thank-you panel) now reflects the **discounted** subtotal and total.

### 4. `/api/orders/create` – validate code, apply discount & commission

**File:** `src/app/api/orders/create/route.ts`

- Reads `ref_code` from the request body and normalizes it.
- Looks up the affiliate in `affiliates` (only accepts active codes).
- Loads product-level affiliate settings for all products in the order.
- For each line:
  - Computes customer discount per unit (percent or fixed).
  - Computes affiliate commission per unit (percent or fixed) based on the **listed** price.
  - Applies discount to derive the customer unit price and line total.
- Uses the **discounted** subtotal (plus shipping) for the order grand total.
- Writes affiliate attribution on the order:
  - `affiliate_id`
  - `affiliate_ref_code`
  - `affiliate_commission_amount` (sum of per-line commissions).
- Handles invalid/inactive codes gracefully (no discount, no commission, affiliate fields null).

### 5. Admin order page – affiliate info

**File:** `src/app/admin/orders/[id]/page.tsx`

- Shows affiliate details for orders that have an attached affiliate:
  - Code / name (where available).
  - Commission amount for that order.
- Confirms end-to-end that referral, discount, and commission logic worked for a given order.

### 6. Affiliate-facing pages & admin list

- Public `/affiliate` landing page with bilingual copy and clear CTAs.
- `/affiliate/signup` flow with email + password auth and automatic code generation.
- `/affiliate/dashboard` showing:
  - Code, name, and basic stats (orders, sales, commission).
- `/admin/affiliates` list view with key metrics per affiliate.

---

## Remaining / Future Work

These are **not** implemented yet and are candidates for future phases:

- **Payout tracking**
  - `affiliate_payouts` table.
  - Admin UI to record payouts and mark commission as paid.
  - Basic payout history on the affiliate dashboard.

- **Better affiliate reporting**
  - Time-filtered stats (this month, last 30 days, etc.).
  - Top products per affiliate.
  - CSV export for accounting.

- **Communication & assets**
  - Email/SMS templates to send codes and performance summaries to affiliates.
  - Downloadable social media creatives / copy snippets for affiliates.

This file should now reflect the current state; add new bullets here as we identify more future enhancements.
