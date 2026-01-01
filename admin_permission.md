# Admin Permissions System

This document describes the implementation of granular admin permissions for the admin dashboard. Use this as a reference when implementing the same system in other projects.

---

## Overview

The system allows fine-grained control over which sections of the admin dashboard each user can access. Instead of a simple "is admin or not" check, each user can be granted access to specific sections (Orders, Inventory, Products, etc.).

---

## Database Schema

### Add columns to `profiles` table

Run this SQL in Supabase:

```sql
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin_full boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS can_admin_dashboard boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS can_admin_orders boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS can_admin_inventory boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS can_admin_products boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS can_admin_reviews boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS can_admin_shipping boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS can_admin_affiliates boolean NOT NULL DEFAULT false;
```

### Set initial full admin users

```sql
UPDATE public.profiles
SET is_admin_full = true,
    can_admin_dashboard = true,
    can_admin_orders = true,
    can_admin_inventory = true,
    can_admin_products = true,
    can_admin_reviews = true,
    can_admin_shipping = true,
    can_admin_affiliates = true
WHERE email IN ('your-admin@email.com');
```

---

## Auth Helpers (`src/lib/auth.ts`)

Update the auth helpers to support per-section permissions:

```typescript
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from './supabaseServer';

export type AdminSection =
  | 'dashboard'
  | 'orders'
  | 'inventory'
  | 'products'
  | 'reviews'
  | 'shipping'
  | 'affiliates';

export async function getSessionAndProfile() {
  const supabase = getSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return { session: null, profile: null } as const;

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      [
        'id',
        'email',
        'is_admin',
        'is_admin_full',
        'can_admin_dashboard',
        'can_admin_orders',
        'can_admin_inventory',
        'can_admin_products',
        'can_admin_reviews',
        'can_admin_shipping',
        'can_admin_affiliates',
      ].join(', ')
    )
    .eq('id', session.user.id)
    .maybeSingle();

  return { session, profile } as const;
}

function hasFullAdmin(profile: any | null | undefined): boolean {
  if (!profile) return false;
  // Only check is_admin_full - the new granular permission flag
  return Boolean((profile as any).is_admin_full);
}

export async function requireAdmin() {
  const { session, profile } = await getSessionAndProfile();
  if (!session || !hasFullAdmin(profile)) {
    redirect('/admin/login');
  }
  return { session, profile } as const;
}

export async function requireSectionAccess(section: AdminSection) {
  const { session, profile } = await getSessionAndProfile();
  if (!session || !profile) {
    redirect('/admin/login');
  }

  if (hasFullAdmin(profile)) {
    return { session, profile } as const;
  }

  const p: any = profile;
  const allowed = {
    dashboard: Boolean(p.can_admin_dashboard),
    orders: Boolean(p.can_admin_orders),
    inventory: Boolean(p.can_admin_inventory),
    products: Boolean(p.can_admin_products),
    reviews: Boolean(p.can_admin_reviews),
    shipping: Boolean(p.can_admin_shipping),
    affiliates: Boolean(p.can_admin_affiliates),
  }[section];

  if (!allowed) {
    redirect('/admin/login');
  }

  return { session, profile } as const;
}
```

---

## Admin Layout (`src/app/admin/layout.tsx`)

Update the layout to conditionally show sidebar links based on permissions:

```tsx
import Link from 'next/link';
import { ReactNode } from 'react';
import { getSessionAndProfile } from '@/lib/auth';
import AdminSignOut from './AdminSignOut';

export const metadata = {
  robots: { index: false, follow: false },
} as const;

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { profile } = await getSessionAndProfile();
  const p: any = profile || {};
  const isFullAdmin = Boolean(p.is_admin_full);

  const canDashboard = isFullAdmin || Boolean(p.can_admin_dashboard);
  const canInventory = isFullAdmin || Boolean(p.can_admin_inventory);
  const canOrders = isFullAdmin || Boolean(p.can_admin_orders);
  const canReviews = isFullAdmin || Boolean(p.can_admin_reviews);
  const canShipping = isFullAdmin || Boolean(p.can_admin_shipping);
  const canProducts = isFullAdmin || Boolean(p.can_admin_products);
  const canAffiliates = isFullAdmin || Boolean(p.can_admin_affiliates);

  return (
    <div className="min-h-screen grid grid-cols-12">
      <aside className="col-span-12 md:col-span-3 lg:col-span-2 border-r p-4 space-y-3 flex flex-col">
        <h1 className="text-lg font-semibold">Admin</h1>
        <nav className="flex flex-col gap-2 text-sm">
          {canDashboard && <Link className="hover:underline" href="/admin">Dashboard</Link>}
          {canInventory && <Link className="hover:underline" href="/admin/inventory">Inventory</Link>}
          {canOrders && <Link className="hover:underline" href="/admin/orders">Orders</Link>}
          {canReviews && <Link className="hover:underline" href="/admin/reviews">Reviews</Link>}
          {canShipping && <Link className="hover:underline" href="/admin/shipping">Shipping</Link>}
          {canProducts && <Link className="hover:underline" href="/admin/products">Products</Link>}
          {canAffiliates && <Link className="hover:underline" href="/admin/affiliates">Affiliates</Link>}
          {isFullAdmin && <Link className="hover:underline" href="/admin/permissions">Admin Permissions</Link>}
        </nav>
        <div className="border-t pt-3 mt-auto">
          <AdminSignOut />
        </div>
      </aside>
      <main className="col-span-12 md:col-span-9 lg:col-span-10 p-6">
        {children}
      </main>
    </div>
  );
}
```

---

## Guard Each Admin Page

Replace `requireAdmin()` with `requireSectionAccess('section')` on each admin page:

| Page | Guard |
|------|-------|
| `/admin` (dashboard) | `await requireSectionAccess('dashboard')` |
| `/admin/orders/**` | `await requireSectionAccess('orders')` |
| `/admin/inventory/**` | `await requireSectionAccess('inventory')` |
| `/admin/products/**` | `await requireSectionAccess('products')` |
| `/admin/reviews/**` | `await requireSectionAccess('reviews')` |
| `/admin/shipping/**` | `await requireSectionAccess('shipping')` |
| `/admin/affiliates/**` | `await requireSectionAccess('affiliates')` |
| `/admin/permissions` | `await requireAdmin()` (full admin only) |

Example:

```typescript
// Before
import { requireAdmin } from '@/lib/auth';
export default async function OrdersPage() {
  await requireAdmin();
  // ...
}

// After
import { requireSectionAccess } from '@/lib/auth';
export default async function OrdersPage() {
  await requireSectionAccess('orders');
  // ...
}
```

---

## Admin Sign Out Component (`src/app/admin/AdminSignOut.tsx`)

Client component with sign out button and 15-minute inactivity timeout:

```tsx
'use client';

import { useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export default function AdminSignOut() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }, [supabase, router]);

  // Session timeout - auto logout after 15 minutes of inactivity
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleSignOut();
      }, SESSION_TIMEOUT_MS);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [handleSignOut]);

  return (
    <button
      onClick={handleSignOut}
      className="text-base font-bold text-red-600 hover:text-red-800 hover:underline mt-4"
    >
      Sign Out
    </button>
  );
}
```

---

## Admin Permissions Page

### Server Component (`src/app/admin/permissions/page.tsx`)

```tsx
import { requireAdmin } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import PermissionsEditor from './PermissionsEditor';

async function fetchProfiles() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, email, is_admin_full, can_admin_dashboard, can_admin_orders, can_admin_inventory, can_admin_products, can_admin_reviews, can_admin_shipping, can_admin_affiliates'
    )
    .order('email', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((p: any) => ({
    id: p.id,
    email: p.email,
    is_admin_full: Boolean(p.is_admin_full),
    can_admin_dashboard: Boolean(p.can_admin_dashboard),
    can_admin_orders: Boolean(p.can_admin_orders),
    can_admin_inventory: Boolean(p.can_admin_inventory),
    can_admin_products: Boolean(p.can_admin_products),
    can_admin_reviews: Boolean(p.can_admin_reviews),
    can_admin_shipping: Boolean(p.can_admin_shipping),
    can_admin_affiliates: Boolean(p.can_admin_affiliates),
  }));
}

export default async function AdminPermissionsPage() {
  await requireAdmin();
  const profiles = await fetchProfiles();

  return <PermissionsEditor initialProfiles={profiles} />;
}
```

### Client Component (`src/app/admin/permissions/PermissionsEditor.tsx`)

This component provides:
- Local state for checkbox toggles (no immediate save)
- Notification bar with Save/Discard when changes are made
- Navigation blocking when unsaved changes exist
- Auto-check all sections when Full Admin is turned ON
- Auto-uncheck Full Admin when any section is turned OFF

See the full implementation in the project files.

### API Route (`src/app/api/admin/permissions/route.ts`)

```typescript
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const { profiles } = await req.json();

    if (!Array.isArray(profiles)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    for (const p of profiles) {
      if (!p.id) continue;

      await supabase
        .from('profiles')
        .update({
          is_admin_full: Boolean(p.is_admin_full),
          can_admin_dashboard: Boolean(p.can_admin_dashboard),
          can_admin_orders: Boolean(p.can_admin_orders),
          can_admin_inventory: Boolean(p.can_admin_inventory),
          can_admin_products: Boolean(p.can_admin_products),
          can_admin_reviews: Boolean(p.can_admin_reviews),
          can_admin_shipping: Boolean(p.can_admin_shipping),
          can_admin_affiliates: Boolean(p.can_admin_affiliates),
        })
        .eq('id', p.id);
    }

    revalidatePath('/admin/permissions');

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('Error saving permissions:', e);
    return NextResponse.json({ error: e.message || 'Failed to save' }, { status: 500 });
  }
}
```

---

## Permission Logic Summary

| Flag | Meaning |
|------|---------|
| `is_admin_full` | Full admin - can access ALL sections including Admin Permissions page |
| `can_admin_dashboard` | Can access Dashboard |
| `can_admin_orders` | Can access Orders (list, detail, create, status changes) |
| `can_admin_inventory` | Can access Inventory management |
| `can_admin_products` | Can access Products management |
| `can_admin_reviews` | Can access Reviews moderation |
| `can_admin_shipping` | Can access Shipping settings |
| `can_admin_affiliates` | Can access Affiliates management |

### Rules:
1. **Full Admin ON** → All sections accessible, Admin Permissions page visible
2. **Full Admin OFF** → Only sections with their flag ON are accessible
3. **Turning ON Full Admin** → Automatically turns ON all section flags
4. **Turning OFF any section** → Automatically turns OFF Full Admin

---

## Files to Create/Modify

1. **Database**: Run ALTER TABLE SQL
2. **`src/lib/auth.ts`**: Add `requireSectionAccess()` helper
3. **`src/app/admin/layout.tsx`**: Conditional sidebar links + `dynamic = 'force-dynamic'`
4. **`src/app/admin/AdminSignOut.tsx`**: Sign out button with session timeout
5. **`src/app/admin/permissions/page.tsx`**: Server component
6. **`src/app/admin/permissions/PermissionsEditor.tsx`**: Client component with state
7. **`src/app/api/admin/permissions/route.ts`**: API to save permissions
8. **All admin pages**: Replace `requireAdmin()` with `requireSectionAccess('section')`

---

## Testing Checklist

- [ ] Full admin can access all pages
- [ ] Full admin can see Admin Permissions link
- [ ] Non-full admin only sees permitted sidebar links
- [ ] Non-full admin cannot access restricted pages by URL (redirects to login)
- [ ] Toggling Full Admin ON checks all sections
- [ ] Unchecking any section unchecks Full Admin
- [ ] Save/Discard bar appears when changes are made
- [ ] Cannot navigate away with unsaved changes (browser warning)
- [ ] Sign Out button works
- [ ] 15-minute inactivity timeout works
