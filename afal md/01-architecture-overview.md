# Afal Store – Architecture Overview

## High-level concept
- Admin user can create and manage products, inventory, orders, shipping, reviews.
- For each product, admin defines all Landing Page (LP) content (text, media, variants, pricing, tracking, etc.).
- Viewer side automatically renders a product detail / landing page based on data from Supabase, without new coding per product.

## Main technologies
- Next.js (App Router) with TypeScript and React components.
- Tailwind CSS for styling.
- Supabase for Postgres database and storage.
- Deployed on Vercel, domain via Cloudflare.

## Main app areas (Afal)
- **Admin app** under routes like `/admin/...`.
- **Landing page / product viewer** under routes like `/lp/[slug]` or product slug routes.
- **Shared infrastructure**: Supabase client, types, helpers.

## Code structure (Afal project)
- `src/app` – Next.js routes.
- `src/app/admin` – admin dashboard, products, inventory, orders, reviews, shipping.
- `src/app/lp/[slug]` – landing page for a specific product.
- `src/components` – shared UI components used by admin and viewer.
- `types/` – TypeScript types for database and domain models.
- `public/` – static assets.

## Data flow summary
- Admin creates/edits product records in Supabase via admin UI forms.
- LP route fetches product, variants, media, and configuration from Supabase using the product `slug`.
- The LP page composes sections (gallery, description, highlights, variants, buy panel, reviews, shipping info, social links, etc.) based only on DB content and configuration flags.

## What to replicate in Beauty Store
- Keep the same separation: **Admin** vs **Viewer/LP**.
- Preserve the “no-code per product” principle: adding a new product is 100% through admin UI and Supabase, not through code.
- Reuse the same pattern of: DB schema → admin forms → LP rendering components.

(Details for each area will be described in separate markdown files, e.g. admin-products, lp-layout, supabase-schema.)
