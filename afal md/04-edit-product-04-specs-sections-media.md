# Afal Admin – Edit Product (04: Specifications, Bottom Sections, Media – Top Gallery)

This file documents the remaining content-building parts of the Edit Product page:
- Specifications (structured spec list, EN/UR).
- Bottom Sections (extra LP content blocks).
- Media – Top Gallery (hero gallery images/videos).

Together these sections control most of what appears on the **LP body** for a product.

---

## 1. Specifications

### Purpose
Let admins define a **typed list of specs / highlights** per product, in **English and Urdu**, which will be rendered on the LP as a structured spec list.

### Data model – `product_specs` table
From code and your Supabase screenshot, columns are:
- `id : uuid`
- `product_id : uuid`
- `group : text | null` – optional grouping label (e.g., "Battery").
- `label : text` – left column, e.g., "Battery" / "Operating System".
- `value : text` – right column, e.g., "Android".
- `lang : 'en' | 'ur'`
- `sort : integer` – ordering within language.

### Loading

```ts
const { data: sp } = await supabaseBrowser
  .from('product_specs')
  .select('id, product_id, group, label, value, lang, sort')
  .eq('product_id', params.id)
  .order('group', { ascending: true })
  .order('sort', { ascending: true });
setSpecs(sp || []);
```

### UI layout
- Section title: **Specifications** with HelpTip.
- Buttons:
  - `+ Add (EN)` → `addSpec('en')`.
  - `+ Add (UR)` → `addSpec('ur')`.
- Page shows two columns **EN** and **UR** each listing spec rows for that language.
- Each row has:
  - Up (`↑`) and Down (`↓`) buttons.
  - `Group` text input (optional).
  - `Label` text input.
  - `Value` text input.
  - `Remove` button.

### Behavior

#### Add spec

```ts
const addSpec = async (lang: 'en' | 'ur') => {
  const { data } = await supabaseBrowser
    .from('product_specs')
    .insert({ product_id: params.id, group: null, label: 'Label', value: 'Value', lang, sort: specs.length })
    .select('*')
    .single();
  setSpecs(prev => [...prev, data]);
};
```

#### Update spec

```ts
const updateSpec = async (id: string, patch: Partial<SpecRow>) => {
  await supabaseBrowser.from('product_specs').update(patch).eq('id', id);
  setSpecs(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
};
```

#### Delete spec

```ts
await supabaseBrowser.from('product_specs').delete().eq('id', id);
setSpecs(prev => prev.filter(s => s.id !== id));
```

#### Reorder spec

```ts
const moveSpec = async (id: string, dir: 'up' | 'down') => {
  const idx = specs.findIndex(s => s.id === id);
  const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
  const a = specs[idx];
  const b = specs[swapIdx];
  await supabaseBrowser.from('product_specs').update({ sort: b.sort }).eq('id', a.id);
  await supabaseBrowser.from('product_specs').update({ sort: a.sort }).eq('id', b.id);
  // swap in local state
};
```

### LP usage concept
- LP groups specs by `lang` and `group` and renders them as structured spec tables in each language.

---

## 2. Bottom Sections

### Purpose
Allow admins to define **additional content blocks** that appear **below the main description/specs** on the LP:
- Single image section.
- Gallery section.
- Video section.
- Rich text section.

### Data model – `product_sections` table
Columns (from code + screenshot):
- `id : uuid`
- `product_id : uuid`
- `type : 'image' | 'gallery' | 'video' | 'rich_text'`
- `title : text | null`
- `body : text | null`
- `media_refs : jsonb` – array of media URLs/ids used by the section.
- `sort : integer` – order of sections on the LP.

### Loading

```ts
const { data: sec } = await supabaseBrowser
  .from('product_sections')
  .select('id, product_id, type, title, body, media_refs, sort')
  .eq('product_id', params.id)
  .order('sort', { ascending: true });
setSections(sec || []);
```

### UI layout
- Section title: **Bottom Sections**.
- Buttons:
  - `+ Add image` → `addSection('image')`.
  - `+ Add gallery` → `addSection('gallery')`.
  - `+ Add video` → `addSection('video')`.
  - `+ Add rich_text` → `addSection('rich_text')`.
- For each section row:
  - Type label (`image` / `gallery` / `video` / `rich_text`).
  - Title input (optional).
  - Depending on type:
    - `image` – single URL or picker, plus preview.
    - `gallery` – list of referenced media items.
    - `video` – video URL + optional upload / poster.
    - `rich_text` – rich text editor.
  - Up/Down arrows and `Remove` button.

(Exact visual details can be matched from Afal, but the data model above is what matters for beauty-store.)

### Behavior

#### Add section

```ts
const addSection = async (type: SectionRow['type']) => {
  const { data } = await supabaseBrowser
    .from('product_sections')
    .insert({ product_id: params.id, type, title: null, body: null, media_refs: [], sort: sections.length })
    .select('*')
    .single();
  setSections(prev => [...prev, data]);
};
```

#### Update section

```ts
const updateSection = async (id: string, patch: Partial<SectionRow>) => {
  await supabaseBrowser.from('product_sections').update(patch).eq('id', id);
  setSections(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
};
```

#### Delete section

```ts
await supabaseBrowser.from('product_sections').delete().eq('id', id);
setSections(prev => prev.filter(s => s.id !== id));
```

#### Reorder sections

```ts
const moveSection = async (id: string, dir: 'up' | 'down') => {
  const idx = sections.findIndex(s => s.id === id);
  const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
  const a = sections[idx];
  const b = sections[swapIdx];
  await supabaseBrowser.from('product_sections').update({ sort: b.sort }).eq('id', a.id);
  await supabaseBrowser.from('product_sections').update({ sort: a.sort }).eq('id', b.id);
  // swap locally
};
```

#### Attaching media to sections
There is a helper to push media URLs into `media_refs`:

```ts
const appendSectionMedia = async (sectionId: string, urls: string[]) => {
  const current = sections.find(s => s.id === sectionId);
  const arr = Array.isArray(current?.media_refs) ? current!.media_refs : [];
  await updateSection(sectionId, { media_refs: [...arr, ...urls] });
};
```

### LP usage concept
- LP loops over `product_sections` ordered by `sort` and renders them as flexible bottom-of-page blocks, using `type` + `media_refs` + `title` + `body`.

---

## 3. Media – Top Gallery

### Purpose
Manage the **hero gallery** for the product LP:
- First item is main hero image/video.
- Remaining items appear in gallery thumbnails.
- Supports images and videos with optional thumbnail and poster.

### Data model – `product_media` table
From code and Supabase screenshot:
- `id : uuid`
- `product_id : uuid`
- `type : 'image' | 'video'`
- `url : text` – main media URL.
- `thumb_url : text | null` – optional thumbnail (image).
- `poster_url : text | null` – optional static poster image for video.
- `alt : text | null` – alt text / caption.
- `sort : integer` – display order.

### Loading

```ts
const { data: m } = await supabaseBrowser
  .from('product_media')
  .select('id, product_id, type, url, thumb_url, poster_url, alt, sort')
  .eq('product_id', params.id)
  .order('sort', { ascending: true });
setMedia(m || []);
```

### Upload helper – Storage bucket
- Bucket name: `'product-media'`.

```ts
const uploadToBucket = async (file: File): Promise<string> => {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const path = `${params.id}/${Date.now()}-${slugify(file.name)}.${ext}`;
  const { data } = await supabaseBrowser.storage.from(BUCKET).upload(path, file, { upsert: false });
  const { data: pub } = supabaseBrowser.storage.from(BUCKET).getPublicUrl(data.path);
  return pub.publicUrl;
};
```

### Adding media

#### Add image

```ts
const addImage = async (file: File) => {
  const url = await uploadToBucket(file);
  const { data } = await supabaseBrowser
    .from('product_media')
    .insert({ product_id: params.id, type: 'image', url, sort: nextSort })
    .select('*')
    .single();
  setMedia(prev => [...prev, data].sort((a, b) => a.sort - b.sort));
};
```

#### Add video

```ts
// size guard
if (sizeMB > MAX_VIDEO_MB) { /* show error */ }

const url = await uploadToBucket(file);
let posterUrl: string | undefined;
if (poster) posterUrl = await uploadToBucket(poster);

const { data } = await supabaseBrowser
  .from('product_media')
  .insert({ product_id: params.id, type: 'video', url, poster_url: posterUrl ?? null, sort: nextSort })
  .select('*')
  .single();
```

### Editing media
- `setAlt(id, alt)` → updates `alt` field.
- `updateMediaField(id, field, file)` → uploads file and sets `thumb_url` or `poster_url`.
- `move(id, dir)` → swaps `sort` with neighbor to reorder gallery.
- `removeMedia(id)` → deletes row from `product_media` and removes from state.

### Auto-generate video poster
- `captureVideoFrame(src, atSec)` uses `<video>` + `<canvas>` on client to capture a frame and produce a JPEG `Blob`.
- `generatePosterFromVideo(mediaRow)`:
  - Calls `captureVideoFrame`, wraps into `File`, uploads via `uploadToBucket`.
  - Updates `product_media.poster_url` with generated image URL.

### LP usage concept
- LP uses `product_media` sorted by `sort`:
  - First item: main hero (image or video with optional poster).
  - Remaining items: gallery thumbnails.
- `thumb_url`/`poster_url` let LP show optimized thumbnails/posters while still loading full media.

---

## Key behaviors to replicate in Beauty Store

- **Specifications**
  - Store specs in a dedicated table with `lang`, `group`, `label`, `value`, `sort`.
  - Provide separate EN/UR (or chosen languages) lists with reordering.

- **Bottom Sections**
  - Use `product_sections` to define flexible bottom-of-page blocks.
  - Support at least image, gallery, video, and rich text types.

- **Media / Top Gallery**
  - Use `product_media` with `type`, `url`, `thumb_url`, `poster_url`, `alt`, `sort`.
  - Implement upload, reorder, and poster generation similar to Afal.

These three areas ensure that almost all visible LP content is **data-driven**, so new products or changes only require admin edits, not new code.
