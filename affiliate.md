# Affiliate / Referral Program Blueprint

This document describes the v1 design for the affiliate / referral system for AestheticSupplyPK, focused on parlours and individual beauticians.

The goal is to let invited girls/parlours create profiles, get a unique referral code, and earn commission when customers buy through their code, while customers get a discount on website orders. Wholesale/manual orders remain separate.

---

## 1. Roles & Concepts

- **Merchant**: AestheticSupplyPK (existing store).
- **Affiliate**: invited parlour or individual beautician/student.
- **Customer**: end buyer purchasing via LP / checkout or manual order.
- **Referral code**: short code like `SANA01` tied to an affiliate.
- **Affiliate dashboard**: separate login area where affiliates see orders and commissions.
- **Admin**: existing admin users.

Two distinct sales modes:

1. **Wholesale / Manual orders (parlours stocking inventory)**
   - Price per bottle (example for Hair Loss Serum):
     - 1–5 bottles: 2,500 PKR
     - 6–11 bottles: 2,150 PKR
     - 12+ bottles: 2,000 PKR
   - Created via existing **manual orders** UI.
   - No customer discount / affiliate commission logic here (unless explicitly later).

2. **Affiliate / Referral orders (end customers on website)**
   - Public listed price on LP: e.g. 3,500 PKR per bottle.
   - Customer can optionally enter a **referral code**:
     - Customer gets a **discount**.
     - Affiliate earns a **commission**.
   - Discount and commission are configured **per product**, always based on the **listed price**, not wholesale or manual pricing.

---

## 2. Database Design

### 2.1. `affiliates` table (new)

Purpose: store parlour/beautician partners and their codes.

Suggested columns:

- `id uuid primary key default gen_random_uuid()`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`
- `active boolean default true`
- `type text` – e.g. `'parlour' | 'individual'`
- `name text` – affiliate display name (person name)
- `parlour_name text` – optional, for parlours
- `phone text`
- `email text`
- `city text`
- `code text unique not null` – referral code, e.g. `SANA01`
- `notes text` – internal notes
- Payout info:
  - `payout_method text` – e.g. `'bank' | 'easypaisa' | 'cash'`
  - `payout_details text` – account number, etc.

Auth for affiliate dashboard can later be:
- Separate `auth.users` with mapping to `affiliates.id`, or
- Use existing Supabase auth with a `profile` row referencing `affiliate_id`.

### 2.2. `orders` table (changes)

Add fields for tracking affiliate attribution and commission:

- `affiliate_id uuid references affiliates(id)` – nullable.
- `affiliate_ref_code text` – code used at checkout, for audit.
- `affiliate_commission_amount numeric(12,2) default 0` – total commission due for this order.

These are set when an order is created (online or manual) if a valid referral code or affiliate is attached.

### 2.3. `products` table (changes)

Per-product discount and commission settings, based on **listed online price**.

Add columns:

- `affiliate_enabled boolean default false`

- **Customer discount**
  - `affiliate_discount_type text` – enum-like: `'none' | 'percent' | 'fixed'`
  - `affiliate_discount_value numeric(12,2)` –
    - if `percent`: percentage, e.g. `10` for 10%
    - if `fixed`: absolute PKR amount per unit, e.g. `350`

- **Affiliate commission**
  - `affiliate_commission_type text` – `'percent' | 'fixed'`
  - `affiliate_commission_value numeric(12,2)` –
    - if `percent`: percentage of listed price, e.g. `15`
    - if `fixed`: absolute PKR per unit, e.g. `500`

Optional later: global defaults table (e.g. `settings`) to avoid filling these on every product.

### 2.4. `affiliate_payouts` table (later)

For v1 we can skip this and track payments manually, but a future table might be:

- `id uuid pk`
- `affiliate_id uuid references affiliates(id)`
- `period_start timestamptz`
- `period_end timestamptz`
- `amount numeric(12,2)` – total commission paid
- `notes text`
- `created_at timestamptz default now()`

---

## 3. Referral Signup & Codes

### 3.1. Hidden signup page

- Route: `/affiliate/signup` (not linked from public nav).
- Form fields:
  - Name, phone, email, city.
  - Parlour name (optional).
  - How did you hear about us? (optional).
- On submit:
  - Create `affiliate` row.
  - Generate unique `code`:
    - For example: first 3–4 letters of name + random digits, uppercased.
    - Ensure uniqueness (`select ... where code = ...`).
  - Show a “success + your code” screen.

Optionally enforce **invite-only** by requiring an invite token or manual approval.

### 3.2. Affiliate login & dashboard (v1)

- Simple login (can use Supabase auth) mapped to `affiliates.id`.
- Dashboard route: `/affiliate/dashboard`.
- Views:
  - Summary:
    - Total orders
    - Total sales via their code
    - Total commission earned
    - Total commission marked as paid (later)
  - Table of orders:
    - Date, product, quantity, order total, commission from that order.

For v1 we do **read-only** (no withdrawals/requests inside the app). You pay manually (Easypaisa / bank) and later we can add payout tracking.

---

## 4. Checkout / LP Integration

### 4.1. Referral field in checkout

On the existing checkout page:

- Add input:
  - Label: `Referral / Beautician code (optional)`
  - `name="ref_code"`
- Behavior:
  - If URL has `?ref=SANA01`, pre-fill this field with that value.

### 4.2. Server-side validation in `/api/orders/create`

When placing an order:

1. Read `ref_code` from request body.
2. Normalize: `code = ref_code.trim().toUpperCase()`.
3. Lookup affiliate:
   ```sql
   select id, code from affiliates where upper(code) = $code and active = true
   ```
4. If no match:
   - Treat as **no affiliate** (no discount, no commission).
   - Optionally return a warning message to client.
5. If match:
   - Attach `affiliate_id` and `affiliate_ref_code` to order payload.
   - For each product line, apply discount/commission rules.

### 4.3. Discount & commission calculation

Per product line with listed price `P`, quantity `Q`:

- Read product settings:
  - `affiliate_enabled`
  - `affiliate_discount_type`, `affiliate_discount_value`
  - `affiliate_commission_type`, `affiliate_commission_value`

- If `affiliate_enabled` is false → skip discount & commission for that product.

**Customer discount per unit**:

- If `discount_type = 'percent'`:
  - `discount_per_unit = P * (discount_value / 100)`
- If `discount_type = 'fixed'`:
  - `discount_per_unit = discount_value`
- If `discount_type = 'none'` or no affiliate → `discount_per_unit = 0`.

**Affiliate commission per unit** (always on listed price):

- If `commission_type = 'percent'`:
  - `commission_per_unit = P * (commission_value / 100)`
- If `commission_type = 'fixed'`:
  - `commission_per_unit = commission_value`

**Totals**:

- Customer pays (excluding shipping):
  - `line_total_customer = Q * (P - discount_per_unit)`
- Affiliate earns:
  - `line_commission = Q * commission_per_unit`

Sum across items:

- `order_subtotal_customer = sum(line_total_customer)`
- `order_commission_total = sum(line_commission)`

On the created `orders` row:

- Use `order_subtotal_customer` as the base for totals (plus shipping).
- Set `affiliate_commission_amount = order_commission_total`.
- Set `affiliate_id`, `affiliate_ref_code`.

Shipping is unchanged; commission is independent of shipping.

---

## 5. Manual Orders & Referral Codes

For orders created by your team (WhatsApp / phone):

- Extend manual order form (`/admin/orders/new2`) with:
  - Optional `Referral / Beautician code` input, or dropdown of affiliates.
- On submit:
  - Validate code just like in checkout.
  - Attach `affiliate_id`, `affiliate_ref_code` to order.
  - Compute `affiliate_commission_amount` using the same per-product settings.

This allows you to credit affiliates even when the sale happens via WhatsApp or call.

Wholesale bulk orders with parlour pricing (2,000–2,500 range) can be kept **separate**, with no referral code, or use different logic if desired later.

---

## 6. Admin UX

### 6.1. Product edit page additions

On `/admin/products/[id]`:

Add a new section **"Affiliate & Discount Settings"**:

- [ ] Enable affiliate referrals for this product
- Customer discount:
  - Type: `None / Percentage / Fixed amount`
  - Value: number input (interpreted based on type)
- Affiliate commission:
  - Type: `Percentage / Fixed amount`
  - Value: number input

Show helper text:

- "All percentages and amounts apply to the listed online price (e.g. 3,500 PKR)."
- "Leave type as None to disable discounts for this product."

### 6.2. Orders admin

On order detail and orders list:

- Show affiliate info when present:
  - `Affiliate: SANA01 – Sana (Glow Studio)`
  - `Affiliate commission: 525 PKR` (order-level total).

Later, add filters:

- Filter orders by affiliate.
- Export affiliate performance.

### 6.3. Affiliates admin page (later)

New route, e.g. `/admin/affiliates`:

- List of affiliates:
  - Name, code, type, city, active/inactive.
  - Total orders, total sales, total commission.
- Detail view:
  - Orders attributed to that affiliate.
  - Commission totals.
  - Notes, payout history (if/when we add payouts).

---

## 7. Phased Implementation Plan (High-level)

### Phase 1 – Data & product settings

1. Create `affiliates` table.
2. Add affiliate fields to `orders` and `products` tables.
3. Update product edit page to manage affiliate/discount settings per product.

### Phase 2 – Referral codes & checkout

4. Build hidden signup page to create affiliates + codes.
5. Add referral code field to checkout; send `ref_code` in `/api/orders/create` payload.
6. Implement server-side validation and discount/commission calculation when placing orders.

### Phase 3 – Manual order integration

7. Add optional referral code input to manual order form.
8. Extend manual order creation route to attach affiliates and compute commission.

### Phase 4 – Dashboards

9. Create minimal affiliate dashboard (read-only): orders + commissions.
10. Enhance admin orders/affiliates views to show affiliate attribution and totals.

### Phase 5 – Payout tracking (optional)

11. Add `affiliate_payouts` table and admin UI to record payments to affiliates.
12. Show paid vs unpaid commission in affiliate and admin views.

---

This file is the blueprint. As we implement, we can keep it updated with any schema or flow changes so the system remains understandable for future work.
