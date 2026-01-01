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
  // Legacy is_admin is ignored for permission checks now
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
