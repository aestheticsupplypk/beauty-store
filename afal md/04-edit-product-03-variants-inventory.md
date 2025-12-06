# Afal Admin – Edit Product (03: Danger Zone, Variation Types, Variants & Inventory)

This file documents the **lower part** of the Edit Product page containing:
- Danger Zone (deactivate / delete).
- Variation Types (Color, Size, Model, Package toggles).
- Variants & Inventory (option values, Add Variant form, variants grid, inventory editing, LP probe tools).

---

## 1. Danger Zone

### Purpose
Provide safe controls to:
- **Deactivate (soft delete)** a product (unpublish but keep all data).
- **Delete permanently (hard delete)** a product and related data, with protection against deleting products that have orders.

### UI
Section labeled **Danger Zone** with two buttons:
- `Deactivate (soft delete)` → `softDelete()`.
- `Delete permanently` → `hardDelete()`.

### Soft delete logic

```ts
const softDelete = async () => {
  if (!confirm('Deactivate this product? It will be unpublished but not removed.')) return;
  await supabaseBrowser
    .from('products')
    .update({ active: false })
    .eq('id', params.id);
  // Shows alert and refreshes
};
```

- Sets `products.active = false`.
- LP for this product will no longer show it (since LP requires `active = true`).
- All related rows (variants, media, specs, sections, inventory, promotions) remain intact.

### Hard delete logic

```ts
const hardDelete = async () => {
  if (!confirm('Permanently delete this product and related variants, specs, sections, and media? This cannot be undone.')) return;

  // 1) Find all variant ids for the product
  const { data: vIds } = await supabaseBrowser
    .from('variants')
    .select('id')
    .eq('product_id', params.id);
  const ids = (vIds || []).map((r: any) => r.id);

  // 2) Safety: block if *any* order_items reference these variants
  if (ids.length) {
    const { data: oi } = await supabaseBrowser
      .from('order_items')
      .select('order_id')
      .in('variant_id', ids)
      .limit(1);
    if ((oi || []).length > 0) throw new Error('Cannot delete: one or more variants have orders. Deactivate instead.');
  }

  // 3) Delete dependent records
  await supabaseBrowser.from('product_sections').delete().eq('product_id', params.id);
  await supabaseBrowser.from('product_specs').delete().eq('product_id', params.id);
  await supabaseBrowser.from('product_media').delete().eq('product_id', params.id);

  if (ids.length) {
    await supabaseBrowser.from('variant_option_values').delete().in('variant_id', ids);
    await supabaseBrowser.from('inventory').delete().in('variant_id', ids);
    await supabaseBrowser.from('variants').delete().in('id', ids);
  }

  // 4) Finally delete the product row
  await supabaseBrowser.from('products').delete().eq('id', params.id);
};
```

### Supabase tables involved
- `products`, `variants`, `inventory`, `variant_option_values`, `product_sections`, `product_specs`, `product_media`, `order_items`.

### Key behavior to copy
- Never allow hard delete if **any order_items exist for its variants**.
- Ensure all dependent rows are deleted to avoid orphan data.

---

## 2. Variation Types

### Purpose
Toggle which dimension(s) of variation this product uses, and manage the **option values** for each dimension.

### Data model
- `option_types` – master list of possible dimensions (Color, Size, Model, Package).
- `option_values` – per product, per option_type values.
  - Columns: `id`, `product_id`, `option_type_id`, `value`.
- `product_options` – join table declaring which option_types are enabled for a product.
  - Columns: `product_id`, `option_type_id`.

### Loading
On load, the page:

1. Looks up the IDs of standard option types:

```ts
const { data: ot } = await supabaseBrowser
  .from('option_types')
  .select('id')
  .eq('name', 'Color')
  .maybeSingle();
setColorTypeId(ot?.id ?? null);
// Same for 'Size', 'Model', 'Package'
```

2. Loads existing option values for this product and each type:

```ts
const { data: ov } = await supabaseBrowser
  .from('option_values')
  .select('id, value')
  .eq('product_id', params.id)
  .eq('option_type_id', colorTypeId);
setColors(ov.map(r => ({ id: r.id, value: r.value })));
// Same for sizes, models, packages
```

3. Loads `product_options` to determine which types are enabled for this product:

```ts
const { data: po } = await supabaseBrowser
  .from('product_options')
  .select('option_type_id')
  .eq('product_id', params.id);

const typeIds = new Set(po.map(r => String(r.option_type_id)));
setEnableColor(typeIds.has(colorTypeId));
// etc.
```

### UI behavior
- Section **Variation types** with checkboxes:
  - `Color`, `Size`, `Model`, `Package`.
- Checking/unchecking calls `setOptionEnabled('color'|'size'|'model'|'package', enabled)`.

### setOptionEnabled logic

```ts
if (enabled) {
  // Insert into product_options if not already there
  const { data: exists } = await supabaseBrowser
    .from('product_options')
    .select('product_id, option_type_id')
    .eq('product_id', params.id)
    .eq('option_type_id', typeId)
    .maybeSingle();
  if (!exists) {
    await supabaseBrowser.from('product_options').insert({ product_id: params.id, option_type_id: typeId });
  }
} else {
  await supabaseBrowser
    .from('product_options')
    .delete()
    .eq('product_id', params.id)
    .eq('option_type_id', typeId);
}

// Local state toggles enableColor/enableSize/enableModel/enablePackage
```

### Adding option values
For each dimension there is an `Add <Color|Size|Model|Package>` control which calls helpers like:

```ts
const addColor = async (value: string) => {
  const { data } = await supabaseBrowser
    .from('option_values')
    .insert({ product_id: params.id, option_type_id: colorTypeId, value })
    .select('id, value')
    .single();
  setColors(prev => [...prev, { id: data.id, value: data.value }]);
};
```

Same pattern applies to **Size**, **Model**, **Package**.

### Beauty-store implications
- Standardize on the same dimensions for beauty products (e.g. Shade/Size/Pack size).
- Use this model so variation logic stays generic: LP and checkout just read `variants` + `option_values`.

---

## 3. Variants & Inventory

### Purpose
Manage the individual sellable SKUs for a product:
- Each variant has SKU, base price, active flag, and linked option values.
- Inventory is tracked **per variant**.
- Admin can add variants, edit fields inline, and adjust stock.

### Data model
- `variants`
  - `id : uuid`
  - `product_id : uuid`
  - `sku : text`
  - `price : numeric`
  - `active : bool`
  - `thumb_url : text | null` (optional thumbnail).
- `inventory`
  - `variant_id : uuid`
  - `stock_on_hand : integer`
  - `reserved : integer`.
- `variant_option_values`
  - `variant_id : uuid`
  - `option_value_id : integer` (FK to `option_values`).
- `option_values` + `option_types` as above.

### Local type

```ts
type VariantRow = {
  id: string;
  sku: string;
  price: number;
  active: boolean;
  thumb_url?: string | null;
  color_value_id?: number | null;
  size_value_id?: number | null;
  model_value_id?: number | null;
  package_value_id?: number | null;
  on_hand?: number;
};
```

### Loading variants (`loadVariants`)

```ts
const { data: v } = await supabaseBrowser
  .from('variants')
  .select('id, sku, price, active, thumb_url')
  .eq('product_id', params.id)
  .order('price', { ascending: true });

// 1) Attach inventory `on_hand`
const { data: inv } = await supabaseBrowser
  .from('inventory')
  .select('variant_id, stock_on_hand')
  .in('variant_id', ids);

// 2) Attach color/size/model/package option_value ids via variant_option_values + option_values join
const { data: links } = await supabaseBrowser
  .from('variant_option_values')
  .select('variant_id, option_value_id, option_values!variant_option_values_option_value_id_fkey(option_type_id)')
  .in('variant_id', ids);
```

This populates `variants` state with:
- `on_hand` from inventory.
- `color_value_id`, `size_value_id`, `model_value_id`, `package_value_id` based on option type.

### Add Variant form
At top of the Variants section there is an **Add Variant** row with fields:
- `sku` (text).
- `price` (number).
- `active` checkbox.
- Dropdowns for Color / Size / Model / Package using current option values.

The form is read directly from DOM (`readVariantForm`) and staged until save.

#### Saving Add Variant (part of `saveAllEdits`)

```ts
const vf = readVariantForm();
if (vf.sku && vf.price) {
  await addVariant({
    sku: vf.sku,
    price: Number(vf.price),
    active: isActiveCheckbox,
    color_value_id: vf.color ? Number(vf.color) : null,
    size_value_id: vf.size ? Number(vf.size) : null,
    model_value_id: vf.model ? Number(vf.model) : null,
    package_value_id: vf.pack ? Number(vf.pack) : null,
  });
}
```

##### `addVariant` behavior
- Inserts into `variants` and returns new id.
- Inserts rows to `variant_option_values` for provided option_value ids.
- Adds the variant to local `variants` state with `on_hand = 0`.

### Variants table (grid)
For each variant row:
- Editable fields:
  - `SKU` text input.
  - `Price` number input.
  - `Color`, `Size`, `Model`, `Package` dropdowns (when those variation types are enabled).
  - `On hand` inventory input with +/- quick adjust.
  - `Active` checkbox.
- `Remove` button triggers `removeVariant`.

#### Updating variants (`updateVariant`)
- Builds patch for `variants` table: `sku`, `price`, `active`, `thumb_url`.
- If any of the `*_value_id` fields change, it:
  - Fetches current `variant_option_values` for that variant.
  - For each option type (Color/Size/Model/Package), **replaces** existing link(s) with new one or deletes if null, guaranteeing **max one row per type per variant**.

#### Inventory helpers
- `setOnHand(variantId, onHand)`:
  - Upserts a row into `inventory` with new `stock_on_hand` (keeping `reserved`).
- `adjustOnHandDelta(variantId, delta)`:
  - Reads current `stock_on_hand` and `reserved`.
  - Ensures `nextOn >= reserved` before updating.
  - Prevents reducing inventory below reserved units.

### Remove variant (`removeVariant`)

```ts
// Confirm
// Safety: block delete if any order_items reference this variant
const { data: oi } = await supabaseBrowser
  .from('order_items')
  .select('order_id')
  .eq('variant_id', id)
  .limit(1);
if ((oi || []).length > 0) throw new Error('Cannot delete: this variant has orders. Set Active off instead.');

await supabaseBrowser.from('variant_option_values').delete().eq('variant_id', id);
await supabaseBrowser.from('inventory').delete().eq('variant_id', id);
await supabaseBrowser.from('variants').delete().eq('id', id);
```

### LP Probe & Resync tools (advanced debugging)

- `runLpProbe()`
  - Simulates LP queries to see what colors and variant keys LP would see.
  - Reads active product, active variants, inventory, and option links.
  - Produces a summary `{ colors: string[]; keys: string[] }` to help debug availability combinations.

- `resyncOptionLinks()`
  - Reads the current select values in the variants grid and re-writes `variant_option_values` to match them, even when the main UI is in a locked mode.

These tools are primarily for admin diagnostics and are optional but helpful.

---

## Key behaviors to replicate in Beauty Store

1. **Safe deletion**
   - Use a Danger Zone with both soft and hard delete.
   - Block hard delete and variant delete when any orders exist.

2. **Flexible variation model**
   - Use `option_types`, `option_values`, and `product_options` to describe variation dimensions per product.
   - Allow toggling which dimensions apply without changing schema.

3. **Variant + inventory coupling**
   - Keep price/active at `variants` level.
   - Keep stock quantities in `inventory` with `reserved` field.
   - Always prevent inventory going below reserved.

4. **LP alignment**
   - Ensure LP reads the same variants and option mappings so what admin sees in this grid exactly matches selectable options and stock on the landing page.
