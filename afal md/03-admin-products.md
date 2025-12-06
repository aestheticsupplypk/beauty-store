# Afal Admin – Products List & Create

## Purpose
- Central place for admins to:
  - View all products in the system.
  - See basic status (active/inactive, descriptions present or not).
  - Navigate to **Edit Product** (full LP configuration) or **View LP**.
  - Create new products with minimal required fields.

---

## Data source – `products` table
- Listing page queries Supabase server-side:

```ts
const { data: products } = await supabase
  .from('products')
  .select('id, name, slug, active, description_en, description_ur')
  .order('created_at', { ascending: false });
```

- Required columns (at least):
  - `id` – primary key.
  - `name` – product name shown in admin + LP.
  - `slug` – URL slug used for `/lp/[slug]`.
  - `active` – boolean, controls publish status.
  - `description_en` – optional long text.
  - `description_ur` – optional long text.
  - `created_at` – timestamp used for sorting.

> Note: More columns exist in `products`, but the **list page** only needs these.

---

## Route: Products list – `/admin/products`
- Implemented as an **async server component** (`src/app/admin/products/page.tsx`).
- Marked `export const dynamic = 'force-dynamic';` to ensure fresh data on each load.

### Layout
- Page title row:
  - Left: `Products` (text-xl, font-semibold).
  - Right: `Add product` button linking to `/admin/products/new`.

### Table columns
- Columns (in order):
  - **Name** – product name.
  - **Slug** – product slug (mono font for clarity).
  - **Active** – text `Yes` or `No` based on boolean.
  - **Descriptions** – language badges.
  - **Actions** – edit / view LP links.

### Description language badges
- For each product row:
  - **EN badge**:
    - Text: `EN`.
    - Style:
      - Green pill (`bg-green-100 text-green-800`) when `description_en` is non-empty.
      - Gray pill (`bg-gray-100 text-gray-600`) when empty.
  - **UR badge**:
    - Text: `UR`.
    - Same green/gray styling logic using `description_ur`.

### Actions
- **Edit**
  - Link: `/admin/products/{id}`.
  - Opens the **Edit Product** page (full LP/editor)
- **View LP**
  - Link: `/lp/{slug}`.
  - Opens in a **new tab** (`target="_blank"`).
  - Allows admins to quickly see the public landing page for a product.

### Empty state
- If no products:
  - Show one table row with message `No products found.` spanning all columns.

---

## Route: Add Product – `/admin/products/new`
- Client component (`"use client"`).
- Used to create a **minimal product record** before configuring detailed LP in `/admin/products/[id]`.

### Form fields
- **Name** (required)
  - Text input.
  - Help: *Customer-facing name shown on the landing page.*

- **Slug** (required)
  - Text input + `Auto` button.
  - Uses `slugify` helper on change and when clicking `Auto`.
  - Help: *Short name used in the URL, e.g. air-tag. Must be unique.*
  - Info text: *URL will be `/lp/{slug}`*.

- **Active** (checkbox)
  - Controls whether the product is considered published.
  - Help: *Controls whether the product is published and visible on its landing page.*

- **Description (English)**
  - Optional textarea.
  - Stored in `description_en` (or `null` when empty).

- **Description (Urdu)**
  - Optional textarea.
  - Stored in `description_ur` (or `null` when empty).

### Submit behavior
- On submit:

```ts
const { data, error } = await supabaseBrowser
  .from('products')
  .insert({
    name,
    slug,
    active,
    description_en: descriptionEn || null,
    description_ur: descriptionUr || null,
  })
  .select('id, slug')
  .single();
```

- If success:
  - Redirect to `/admin/products/{id}` (Edit Product page) to continue configuring LP.
- If error:
  - Show error message `Failed to create product` or Supabase error text.
- Submit button text:
  - `Save & Continue`, disabled and changed to `Saving...` while request is in progress.

### Cancel behavior
- `Cancel` button simply calls `history.back()` to return to previous page.

---

## Key behaviors to replicate in Beauty Store
- A **products index** under `/admin/products` that:
  - Lists all products with name, slug, active status, language badges.
  - Links to edit page and public LP page.
  - Has an `Add product` button.
- A **minimal create form** under `/admin/products/new` that:
  - Only captures base fields: name, slug, active, descriptions.
  - Auto-generates slug using a shared `slugify` helper.
  - Inserts into the `products` table and then routes to the detailed editor.
- Keep the same principle: **create first**, then configure all advanced LP details in `/admin/products/[id]`.
