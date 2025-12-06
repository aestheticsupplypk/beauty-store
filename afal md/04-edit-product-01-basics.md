# Afal Admin – Edit Product (01: Basics, Header, Logo)

This file documents only the **top section** of the Edit Product page:
- Page header with `Edit Product`, `View LP`, and `Meta Pixel`.
- Basics block: `name`, `slug`, `active`, descriptions (EN/UR rich text), and logo.

Later sections (media, specs, sections, variants, promotions, checkout extras, social, etc.) will be in `04-edit-product-02-*.md`, `04-edit-product-03-*.md`, etc.

---

## Route
- `/admin/products/[id]` – client component.
- Receives `id` from route params and loads one product row from `products` plus related tables.

---

## Data – `products` table (relevant columns)
From the code in `EditProductPage` and your Supabase screenshot, this section uses at least:

- `id : uuid`
- `name : text`
- `slug : text`
- `active : bool`
- `description_en : text`
- `description_ur : text`
- `logo_url : text`
- CTA / social fields are loaded here but used in later sections:
  - `daraz_enabled : bool`
  - `daraz_url : text`
  - `chat_enabled : bool`
  - `chat_facebook_url, chat_instagram_url : text`
  - `special_message : text`
  - `daraz_trust_line : bool`
  - `fb_page_url, instagram_url, whatsapp_url : text`
  - `contact_email, contact_phone : text`
  - `fb_page_enabled, instagram_enabled, whatsapp_enabled, contact_email_enabled, contact_phone_enabled : bool`
  - `cta_label : text`
  - `cta_size : text ('small' | 'medium' | 'large')`

For **Basics**, only the bolded ones above are actually visible, but all are fetched and stored in React state for the page.

```ts
// Simplified load from products
const { data: p } = await supabaseBrowser
  .from('products')
  .select('id, name, slug, active, description_en, description_ur, logo_url, daraz_enabled, daraz_url, daraz_trust_line, chat_enabled, chat_facebook_url, chat_instagram_url, special_message, fb_page_url, instagram_url, whatsapp_url, contact_email, contact_phone, fb_page_enabled, instagram_enabled, whatsapp_enabled, contact_email_enabled, contact_phone_enabled, cta_label, cta_size')
  .eq('id', params.id)
  .maybeSingle();
```

---

## 1. Page header: Edit Product / View LP / Meta Pixel

### UI
- Top-right of the page shows two actions:
  - **View LP**: button-styled link.
  - **Meta Pixel**: button opens a modal.

```tsx
<h1 className="text-xl font-semibold">Edit Product</h1>
<div className="flex items-center gap-2">
  <a href={`/lp/${slug}`} target="_blank" className="px-3 py-2 rounded border">View LP</a>
  <button type="button" className="px-3 py-2 rounded border" onClick={()=>setPixelOpen(true)}>Meta Pixel</button>
</div>
```

### Behavior
- **View LP**
  - Uses the current `slug` state from the product.
  - Opens `/lp/{slug}` in a **new tab** (`target="_blank"`).
  - Purpose: let admin instantly see the public landing page using current data.

- **Meta Pixel**
  - Opens `<ProductMetaPixelModal productId={params.id} open={pixelOpen} onClose={() => setPixelOpen(false)} />`.
  - Separate component handles per-product pixel configuration (likely backed by `product_pixel` table).
  - This spec only notes that **each product can have independent Meta Pixel settings** managed from this header.

---

## 2. Basics block

Rendered directly under the header inside a bordered section.

```tsx
<section className="space-y-4 border rounded p-4">
  <h2 className="font-medium">Basics</h2>
  {/* Name, Slug, Active, Descriptions, Logo */}
</section>
```

### 2.1 Name
- Text input bound to `name` state.
- HelpTip: *Customer-facing name shown on the landing page.*
- Used on LP as the main product title.

### 2.2 Slug
- Text input + `Auto` button bound to `slug` state.
- Uses `slugify` helper to normalize input.
- Helper text: `URL will be /lp/{slug}`.
- Used as the path segment for the LP route.

### 2.3 Active
- Checkbox bound to `active` boolean.
- HelpTip: *Controls whether the product is published and visible on its landing page.*
- LP page checks `active` to decide whether to show the product.

### 2.4 Descriptions (Rich text)
- Two rich-text editors using `RichTextEditor` component.

Fields:
- **Description (English)** → `description_en`
  - Optional. Shown under gallery on LP when present.
- **Description (Urdu)** → `description_ur`
  - Optional. Shown on LP with RTL (right-to-left) styling when present.

Code (simplified):

```tsx
<RichTextEditor value={descriptionEn} onChange={setDescriptionEn} />
<RichTextEditor value={descriptionUr} onChange={setDescriptionUr} rtl />
```

### 2.5 Logo
- Uses `logo_url` field in `products`.
- UI:
  - Preview square (approx 112x112) showing current logo image or `No logo` text.
  - Text input for a direct URL.
  - `Clear` button to empty the URL.
  - File input (`type="file"`) labeled `Upload` to upload a logo image and store its public URL in `logo_url`.
- Purpose: small square logo displayed near the product title on the LP.

(Upload behavior mirrors media uploads: file is stored in Supabase storage bucket and the public URL is written to `products.logo_url`. Exact implementation continues further down the file and can be mirrored when we implement in beauty-store.)

---

## 3. Save behavior for Basics (overview)

Two main save flows touch these fields:

1. **`saveBasics` function** – saves only basic product fields.
2. **`saveAllEdits` function** – combined save that includes Basics + variants.

Both update the same columns in `products`:

```ts
await supabaseBrowser
  .from('products')
  .update({
    name,
    slug,
    active,
    description_en: descriptionEn || null,
    description_ur: descriptionUr || null,
    logo_url: logoUrl || null,
    // plus many checkout/social fields used in later sections
  })
  .eq('id', params.id);
```

- After a successful save, a local `initialBasics` snapshot is updated so the page can detect **unsaved changes**.
- A top sticky bar `Unsaved changes` + `Save` / `Discard` appears whenever form state differs from `initialBasics`.

---

## Key points to replicate in Beauty Store

- On the Edit Product page, top section should:
  - Show **Edit Product** header.
  - Provide **View LP** (new tab) and **Meta Pixel** buttons.
- Basics form should include:
  - `name`, `slug`, `active` fields equivalent to Afal.
  - Rich-text descriptions in at least two languages (configurable, here EN and UR).
  - A logo preview + URL + upload flow storing a public URL in the product row.
- Save logic should:
  - Write these fields into a `products` table.
  - Track unsaved changes and warn the admin before leaving when there are edits.
