# Afal Admin – Dashboard

## Route and purpose
- Route: `/admin` (App Router page at `src/app/admin/page.tsx`).
- Purpose: Simple home screen for authenticated admins, confirming sign‑in and providing navigation to core admin sections.

## Authentication behavior
- The page is **server-side protected** using `requireAdmin()` from `@/lib/auth`.
- On every request to `/admin`, the server:
  - Validates the current session as an admin user.
  - Loads the admin `profile` (at least `email`).
  - If not authenticated / not admin: redirects or throws (handled inside `requireAdmin`).

```ts
// Afal reference (simplified)
import { requireAdmin } from '@/lib/auth';

export default async function AdminDashboardPage() {
  const { profile } = await requireAdmin();
  // ... render UI with profile.email
}
```

## Layout and navigation shell
- Shared layout component: `src/app/admin/layout.tsx`.
- Layout wraps **all** `/admin/*` routes with:
  - Left sidebar (`<aside>`) with app title and menu.
  - Right content area (`<main>`) for the current admin page.

### Sidebar
- Title: `Afal Admin`.
- Menu links (using `next/link`):
  - `/admin` – Dashboard
  - `/admin/inventory` – Inventory
  - `/admin/orders` – Orders
  - `/admin/reviews` – Reviews
  - `/admin/shipping` – Shipping
  - `/admin/products` – Products
- Desktop layout: 12‑column grid.
  - Sidebar uses `md:col-span-3 lg:col-span-2`.
  - Main content uses `md:col-span-9 lg:col-span-10`.

### SEO / robots
- Admin layout sets metadata:
  - `robots: { index: false, follow: false }`
- Ensures admin pages are **not indexed** by search engines.

## Dashboard page content
- Heading: `Dashboard` (text‑2xl, font‑semibold).
- Subtext: `Signed in as {profile.email}` (small, gray text).

### Quick Links card
- Card styled with border, rounded corners, padding.
- Title: `Quick Links`.
- Bulleted list of links:
  - `Manage Inventory` → `/admin/inventory`
  - `View Orders` → `/admin/orders`
  - `Products` → `/admin/products`

### Admin Capabilities card
- Second card describing what admins can do from the admin area.
- Static bulleted text (no dynamic data):
  - Navigate using Quick Links.
  - Review signed‑in account / verify admin access.
  - Access Inventory to edit **Price** and **On Hand**, or use **Quick Adjust**.
  - Open Orders to process statuses (pending → packed → shipped) and print packing slips (coming next).
  - Manage Products and Variants configuration.

## Data dependencies
- Only depends on the authenticated `profile` object from `requireAdmin()` (email shown on the page).
- **No direct Supabase queries** on this page besides what `requireAdmin()` may do internally.

## Key behaviors to replicate in Beauty Store
- Use an `/admin` route as the **entry point** for admins.
- Protect all admin pages via a shared `requireAdmin()`-like mechanism.
- Implement a shared admin layout with:
  - Non-indexed `robots` metadata.
  - Left navigation sidebar and right content area.
  - Menu items for the admin sections that exist in Beauty Store (inventory, orders, reviews, shipping, products—names can be adjusted but pattern stays).
- Dashboard should:
  - Show who is signed in (email or name from profile).
  - Provide quick links to the most-used admin sections.
  - Briefly describe admin capabilities so new admins understand what the panel controls.
