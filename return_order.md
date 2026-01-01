# Return & Inventory Handling – Admin Orders

This document explains how returns and inventory adjustments are implemented in the **AestheticPK** admin. Use this as a reference when applying the same pattern in other projects.

## Core Goals

- Manual and online orders **reserve stock** when created.
- Cancelling or shipping orders **updates inventory correctly**.
- Returns are tracked **per line item**, not just per order.
- Admins can mark returns as:
  - Returned to inventory (good)
  - Damaged
  - Lost
- Orders with any returns are clearly visible in the **Orders list** and can be filtered.

---

## Database Changes (Supabase)

All tables are in the `public` schema.

### 1. `order_lines`

Added columns:

```sql
ALTER TABLE public.order_lines
ADD COLUMN IF NOT EXISTS returned_qty integer NOT NULL DEFAULT 0;

ALTER TABLE public.order_lines
ADD COLUMN IF NOT EXISTS return_status text NOT NULL DEFAULT 'none';

ALTER TABLE public.order_lines
ADD CONSTRAINT order_lines_return_status_chk
CHECK (return_status IN ('none','returned_good','returned_damaged','returned_lost'));
```

Semantics:

- `returned_qty` – total quantity for this line that has been processed as a return/write-off.
- `return_status` – overall return state for the line:
  - `none` – no return recorded.
  - `returned_good` – items returned in sellable condition (stock is added back).
  - `returned_damaged` – items written off as damaged (no stock added back).
  - `returned_lost` – items written off as lost (e.g. courier loss; no stock added back).

> Note: If you need more complex behaviour later (mixed reasons per line), use a separate `order_line_returns` table instead.

### 2. Inventory (existing design)

- `inventory` table with at least:
  - `variant_id`
  - `stock_on_hand` (actual units in warehouse)
  - `reserved` (units allocated to open orders)
- `inventory_overview` view used by admin for:
  - `stock_on_hand`
  - `reserved`
  - `available` (computed, usually `stock_on_hand - reserved`).
- RPC `adjust_stock(p_sku text, p_delta integer, p_reason text)`:
  - Used for manual adjustments and good returns.
  - Logs adjustments server-side for auditing.

---

## Manual Order Creation

### Files

- `src/app/admin/orders/new2/page.tsx`
- `src/app/admin/orders/manual-create/route.ts`

### Behaviour

1. **New Manual Order UI** (`new2/page.tsx`)

   - For each of up to 5 items, form fields include:
     - `items[i][product_id]` – optional product selection.
     - `items[i][variant_id]` – optional variant/SKU selection.
     - `items[i][qty]` – quantity.
     - `items[i][price]` – price per piece.
   - A `Variant / SKU` dropdown is populated from `variants` joined with `products`.
   - Only lines with a `variant_id` affect inventory.

2. **Manual order handler** (`manual-create/route.ts`)

   - Validates customer + basic order data.
   - Builds `items[]` array with:

     ```ts
     { qty, price, product_id: string | null, variant_id: string | null }
     ```

   - If a `product_id` is present but `variant_id` is missing:
     - If that product has **exactly one** variant, auto-attach it.
     - If it has **multiple** variants, **block** order creation (redirect back; avoid ambiguous stock deduction).
     - If it has **no** variants, leave `variant_id` as `null` (no inventory effect).

   - Inserts into `orders` with:

     ```ts
     source: 'manual',
     status: 'pending',
     payment_status: 'unpaid' | 'partial' | 'paid' (based on upfront amount),
     ```

   - Inserts into `order_items` (for backwards compatibility/reporting).

   - For lines with a `variant_id`, also inserts into `order_lines`:

     ```ts
     { order_id, variant_id, qty, unit_price: price, line_total: qty * price }
     ```

   - **Inventory reservation at creation**:
     - For each such line:
       - Fetch current `stock_on_hand` and `reserved` from `inventory` for that `variant_id`.
       - Upsert `inventory` row with:

         ```ts
         stock_on_hand: currentOnHand,
         reserved: currentReserved + qty,
         ```

     - Effect: `reserved` increases, `available` decreases; `stock_on_hand` stays the same until shipment.

---

## Online Order Creation (Checkout API)

### File

- `src/app/api/orders/create/route.ts`

### Behaviour (summary)

- Creates `orders` with `source: 'online'`, `status: 'pending'`.
- Builds `order_lines` with correct `variant_id`, `qty`, `unit_price`, `line_total`.
- Inventory reservation is handled (or should be aligned) similar to manual orders:
  - On create, increase `reserved` per variant.

When copying to another project, ensure:

- Both **manual** and **online** order creation paths create `order_lines` and reserve inventory the same way.

---

## Status Changes & Inventory

### File

- `src/app/admin/orders/[id]/page.tsx`

### Fetching orders

- `fetchOrder(id)` loads:
  - `orders` row.
  - `order_lines` with `qty`, `unit_price`, `line_total`, `returned_qty`, `return_status`, and variant `sku`.

### Status updates

- A server action (e.g. `updateStatusAction`) handles status transitions:
  - `pending -> cancelled`:
    - Decrease `reserved` for each line by `qty`.
    - `stock_on_hand` unchanged.
  - `pending/packed -> shipped`:
    - Decrease `reserved` by `qty`.
    - Decrease `stock_on_hand` by `qty`.

This logic is **per order**, based on existing `order_lines`.

---

## Returns & Write-offs (Per Line Item)

### File

- `src/app/admin/orders/[id]/page.tsx` (Order detail page)

### UI

- "Items" table shows columns:
  - SKU, Qty, Unit Price, Line Total, Returns.
- For each `order_lines` row:
  - Displays existing return info if `returned_qty > 0` and `return_status != 'none'`.
  - If there is remaining quantity (`qty - returned_qty > 0`), shows a small inline form:

    - **Action** (select):
      - `Return to inventory`
      - `Write off as damaged`
      - `Write off as lost`
    - **Qty (max N)** – default is remaining qty.
    - **Apply** button.

### Server action: `returnLineAction`

- Signature: `async function returnLineAction(formData: FormData)`
- Steps:

  1. Require admin auth.
  2. Read `order_id`, `line_id`, `action`, `qty`.
  3. Load target `order_lines` row (optionally join `orders` to ensure status is appropriate).
  4. Compute:

     ```ts
     const totalQty = qty;
     const prevReturned = returned_qty;
     const remaining = totalQty - prevReturned;
     const applyQty = min(remaining, requestedQty);
     ```

  5. If `applyQty <= 0`, do nothing.
  6. Update `order_lines`:

     ```ts
     returned_qty = prevReturned + applyQty;
     return_status =
       action === 'good'    -> 'returned_good'
       action === 'damaged' -> 'returned_damaged'
       action === 'lost'    -> 'returned_lost';
     ```

  7. Inventory adjustment:

     - For **good returns** (`action === 'good'`):
       - Look up `variants.sku` by `variant_id`.
       - Call `adjust_stock`:

         ```ts
         await supabase.rpc('adjust_stock', {
           p_sku: sku,
           p_delta: applyQty,        // positive number
           p_reason: 'return_good',
         });
         ```

       - Effect: `stock_on_hand` increases; items are back in sellable inventory.

     - For **damaged/lost**:
       - No automatic stock increase.
       - Optionally, call `adjust_stock` with a negative delta and reason `damaged` or `lost` if you want to track write-offs in stock logs.

  8. Revalidate paths:

     - Revalidate `/admin/orders/[id]` and `/admin/inventory` so UI reflects new values.

> Note: Returns do **not** change the main `orders.status` (it stays `shipped`). We only track returns at line level.

---

## Visual Indicators & Filters in Orders List

### File

- `src/app/admin/orders/page.tsx`

### Data enrichment

- After loading `orders`, we load `order_lines` for those order IDs:

  ```ts
  const { data: lines } = await supabase
    .from('order_lines')
    .select('order_id, line_total, returned_qty, return_status')
    .in('order_id', ids);

  const hasReturnsMap: Record<string, boolean> = {};
  for (const ln of lines ?? []) {
    const key = String(ln.order_id);
    const returnedQty = Number(ln.returned_qty || 0);
    const status = String(ln.return_status || 'none');
    if (returnedQty > 0 && status !== 'none') {
      hasReturnsMap[key] = true;
    }
  }

  // Attach flag to each order
  const result = data.map((o) => ({
    ...o,
    total,             // computed
    amount_paid,
    amount_due,
    has_returns: !!hasReturnsMap[o.id],
  }));
  ```

### Returns filter

- Extend `Search` type with `returns?: 'all' | 'with' | 'without'`.
- In-memory filter:

  ```ts
  if (search.returns === 'with') {
    result = result.filter((o: any) => o.has_returns);
  } else if (search.returns === 'without') {
    result = result.filter((o: any) => !o.has_returns);
  }
  ```

- Filter UI:

  ```tsx
  <label className="block text-sm">Returns</label>
  <select name="returns" defaultValue={currentReturns} className="border rounded px-3 py-2">
    <option value="all">All</option>
    <option value="with">With returns</option>
    <option value="without">Without returns</option>
  </select>
  ```

### Status badge styling

- In the Orders table, status is rendered as a pill:

  - **With returns** (`has_returns = true`):

    ```tsx
    const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize border ';
    const hasReturns = !!o.has_returns;
    const cls = hasReturns
      ? base + 'bg-red-50 text-red-700 border-red-200'
      : base + 'bg-gray-100 text-gray-800 border-gray-200';
    <span className={cls}>{o.status}</span>
    ```

- This makes returned orders visually stand out in **red**.

---

## How to Reuse in Another Project

When applying this pattern to another Next.js + Supabase storefront:

1. **Replicate DB structure**
   - Add `returned_qty` and `return_status` to `order_lines`.
   - Ensure you have `inventory` + `inventory_overview` + `adjust_stock` RPC.

2. **Ensure order creation paths** (online + manual):
   - Always create `order_lines` with `variant_id`, `qty`, `unit_price`, `line_total`.
   - Reserve inventory (`reserved`++) at order creation for `pending` orders.

3. **Status change logic**
   - On `pending -> cancelled`: reduce `reserved`.
   - On `pending/packed -> shipped`: reduce `reserved` and `stock_on_hand`.

4. **Return UI & logic**
   - Implement a per-line return form on the order detail page.
   - Use `returned_qty` / `return_status` and `adjust_stock` as in this project.

5. **Reporting & UX**
   - Add `has_returns` flag in the Orders list.
   - Add a Returns filter and red status badge styling.
   - Optionally build a dedicated report for damaged/lost inventory based on stock adjustment logs.

With this file in place, you can quickly re-implement consistent, safe return + inventory behaviour in any cloned storefront.
