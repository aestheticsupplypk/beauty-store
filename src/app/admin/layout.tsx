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
  const canParlours = isFullAdmin || Boolean(p.can_admin_parlours);

  return (
    <div className="min-h-screen grid grid-cols-12">
      <aside className="col-span-12 md:col-span-3 lg:col-span-2 border-r p-4 space-y-3 flex flex-col">
        <h1 className="text-lg font-semibold">Aestheticsupplypk Admin</h1>
        <nav className="flex flex-col gap-2 text-sm">
          {canDashboard && <Link className="hover:underline" href="/admin">Dashboard</Link>}
          {canInventory && <Link className="hover:underline" href="/admin/inventory">Inventory</Link>}
          {canOrders && <Link className="hover:underline" href="/admin/orders">Orders</Link>}
          {canReviews && <Link className="hover:underline" href="/admin/reviews">Reviews</Link>}
          {canShipping && <Link className="hover:underline" href="/admin/shipping">Shipping</Link>}
          {canProducts && <Link className="hover:underline" href="/admin/products">Products</Link>}
          {canAffiliates && <Link className="hover:underline" href="/admin/affiliates">Affiliates</Link>}
          {canParlours && <Link className="hover:underline" href="/admin/parlours">Parlours</Link>}
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
