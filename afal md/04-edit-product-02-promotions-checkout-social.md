# Afal Admin – Edit Product (02: Promotions, Checkout Extras, Social & Contact)

This file documents the **middle block** of the Edit Product page that appears right after the Logo:
- Promotions (quantity discounts, Buy X Get Y).
- Checkout Extras (Daraz, Chat, special message, CTA button settings).
- Social & Contact (Facebook, Instagram, WhatsApp, email, phone).

Other sections (media, specs, LP sections, variants, etc.) are documented in their own `04-edit-product-0X-*.md` files.

---

## 1. Promotions

### Purpose
Let admins configure **per-product promotions** that apply on the LP and checkout:
- Percentage discount when buying a minimum quantity.
- Buy X Get Y free style offers.

### Data model – `product_promotions` table
From the code and your screenshot, each row has:
- `id : uuid`
- `product_id : uuid`
- `name : text` – label like `Quaid Month`.
- `active : bool`
- `type : 'percent' | 'bxgy'` – discount type.
- `min_qty : integer` – minimum qty in cart for promotion to apply.
- `discount_pct : numeric | null` – for `percent` type.
- `free_qty : integer | null` – for `bxgy` type (free units).
- `start_at : timestamptz | null` – optional start time.
- `end_at : timestamptz | null` – optional end time.
- `created_at, updated_at` – timestamps (used only for ordering / auditing).

### Loading and state
- On page load, `EditProductPage` fetches rows:

```ts
const { data: promos } = await supabaseBrowser
  .from('product_promotions')
  .select('id, product_id, name, active, type, min_qty, discount_pct, free_qty, start_at, end_at')
  .eq('product_id', params.id)
  .order('created_at', { ascending: true });
```

- Stored in React state `promotions: PromotionRow[]`.

### UI layout
- Table-like section labeled **Promotions** with:
  - **Active** checkbox per row.
  - **Name** text input.
  - **Type** selector (`percent` vs `BxGy`).
  - **Min qty** input.
  - **% off / Free qty** input (depends on type).
  - **Start (PK time)** and **End (PK time)** date-time inputs.
  - `Remove` button per row.
- `Add promotion` button to create a new row (client-only id `local-*`).
- `Save promotions` button persists all rows to Supabase.

### Validation rules (from code)
When saving promotions:

```ts
for (const r of rows) {
  if (!r.name.trim()) throw new Error('Each promotion must have a name.');
  if (!r.min_qty || r.min_qty <= 0) throw new Error('Promotion min quantity must be greater than 0.');
  if (r.type === 'percent') {
    if (!r.discount_pct || r.discount_pct <= 0) throw new Error('Percent promotions require a positive discount %.');
  } else {
    if (!r.free_qty || r.free_qty <= 0) throw new Error('Buy X Get Y promotions require Y (free units) > 0.');
  }
}
```

### Saving behavior
- Builds payload for each row; **new rows** have local ids and are sent **without `id`** so Postgres can assign it.

```ts
const payload = rows.map((r) => {
  const base: any = {
    product_id: product.id,
    name: r.name.trim(),
    active: r.active,
    type: r.type,
    min_qty: r.min_qty,
    discount_pct: r.type === 'percent' ? (r.discount_pct ?? null) : null,
    free_qty: r.type === 'bxgy' ? (r.free_qty ?? null) : null,
    start_at: r.start_at ? new Date(r.start_at) : null,
    end_at: r.end_at ? new Date(r.end_at) : null,
  };
  if (!r.id.startsWith('local-')) base.id = r.id;
  return base;
});

const { data } = await supabaseBrowser
  .from('product_promotions')
  .upsert(payload, { onConflict: 'id' })
  .select('id, product_id, name, active, type, min_qty, discount_pct, free_qty, start_at, end_at');
```

- On success, state is replaced with normalized DB rows.

### Beauty-store replication
- Implement same `product_promotions` structure.
- On LP/checkout, apply **at most one** best-matching promotion (Afal comment implies only single best applies).
- Provide similar UI so marketers can add/edit promos **per product** without code.

---

## 2. Checkout Extras

### Purpose
Control **checkout-specific extras** and call-to-action for this product’s LP:
- Enable/disable external marketplace checkout (Daraz).
- Enable live chat via social channels.
- Configure a product-specific special message.
- Configure CTA button label and size.

### Data model – `products` table fields
Used fields:
- `daraz_enabled : bool`
- `daraz_url : text`
- `daraz_trust_line : bool`
- `chat_enabled : bool`
- `chat_facebook_url : text`
- `chat_instagram_url : text`
- `special_message : text`
- `cta_label : text`
- `cta_size : text` with values `'small' | 'medium' | 'large'`.

### UI layout
Section titled **Checkout Extras** with:
- Checkbox: **Enable Buy on Daraz** (`daraz_enabled`).
  - When checked, `daraz_url` input appears / is required.
  - Optional bool `daraz_trust_line` flag (used on LP as small trust text line).
- Checkbox: **Enable Chat** (`chat_enabled`).
  - When checked, at least one of `chat_facebook_url` or `chat_instagram_url` must be provided.
- **Special message** textarea.
  - Shown near checkout area on LP (e.g., shipping or campaign message).
- **CTA button label** input (`cta_label`).
  - Example: `Order Now`.
- **CTA button size** select (`cta_size`).
  - Options: `Small`, `Medium (default)`, `Large` mapped to `'small' | 'medium' | 'large'`.

### Validation in `saveBasics`

```ts
if (darazEnabled && !(darazUrl || '').trim())
  throw new Error('Daraz URL is required when Buy on Daraz is enabled.');
if (chatEnabled && !((chatFacebookUrl || '').trim() || (chatInstagramUrl || '').trim()))
  throw new Error('Enter at least one Chat URL (Facebook or Instagram) when Chat is enabled.');
```

### Persistence
- Included in the same `products` update used for Basics:

```ts
.update({
  daraz_enabled: darazEnabled,
  daraz_url: darazEnabled ? (darazUrl || null) : null,
  daraz_trust_line: darazEnabled ? darazTrustLine : false,
  chat_enabled: chatEnabled,
  chat_facebook_url: chatEnabled ? (chatFacebookUrl || null) : null,
  chat_instagram_url: chatEnabled ? (chatInstagramUrl || null) : null,
  special_message: specialMessage || null,
  cta_label: ctaLabel || null,
  cta_size: ctaSize || 'medium',
})
```

### Beauty-store replication
- Allow marketers to configure **where checkout happens** (on-site vs marketplace) and chat channels per product.
- LP should read these flags and:
  - Switch CTA behavior if Daraz enabled.
  - Show chat icons/links if enabled.
  - Show special message near checkout block.

---

## 3. Social & Contact

### Purpose
Control which social/contact channels appear on the LP for this product, and what URLs/addresses to use.

### Data model – `products` fields
- `fb_page_url : text`
- `instagram_url : text`
- `whatsapp_url : text`
- `contact_email : text`
- `contact_phone : text`
- `fb_page_enabled : bool`
- `instagram_enabled : bool`
- `whatsapp_enabled : bool`
- `contact_email_enabled : bool`
- `contact_phone_enabled : bool`

### UI layout
Section titled **Social & Contact** with sub-blocks for each channel:

- **Facebook Page**
  - Checkbox: `Show on LP` (`fb_page_enabled`).
  - URL input for `fb_page_url`.

- **Instagram**
  - Checkbox: `Show on LP` (`instagram_enabled`).
  - URL input for `instagram_url`.

- **Whatsapp**
  - Checkbox: `Show on LP` (`whatsapp_enabled`).
  - URL input for `whatsapp_url`.

- **Email**
  - Checkbox: `Show on LP` (`contact_email_enabled`).
  - Input for `contact_email`.

- **Phone**
  - Checkbox: `Show on LP` (`contact_phone_enabled`).
  - Input for `contact_phone`.

### Persistence
- Stored via the same `products` update in `saveBasics` / `saveAllEdits`:

```ts
.update({
  fb_page_url: fbPageUrl || null,
  instagram_url: instagramUrl || null,
  whatsapp_url: whatsappUrl || null,
  contact_email: contactEmail || null,
  contact_phone: contactPhone || null,
  fb_page_enabled: fbPageEnabled,
  instagram_enabled: instagramEnabled,
  whatsapp_enabled: whatsappEnabled,
  contact_email_enabled: contactEmailEnabled,
  contact_phone_enabled: contactPhoneEnabled,
})
```

### LP usage concept
- Viewer LP page reads these fields for the current product and conditionally shows:
  - Social icons (FB page, Instagram, WhatsApp) linking to the configured URLs.
  - Email and phone contact info where appropriate.
- This allows each product to have its **own** social/contact mix without changing code.

---

## Key points to replicate in Beauty Store

- **Promotions**
  - Same `product_promotions` structure and validation.
  - Admin UI to add multiple promos per product.
  - LP/checkout should consider these when showing price/discounts.

- **Checkout Extras**
  - Per-product control over external marketplace checkout and chat.
  - Per-product CTA label/size and special message.

- **Social & Contact**
  - Per-product toggles + URLs for social and contact channels.
  - LP should only render channels where `*_enabled` is true and URL/value is non-empty.

These three blocks together give marketers **full control** over how each product’s LP sells and communicates, without needing a new code deployment.
