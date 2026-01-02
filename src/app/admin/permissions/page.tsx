import { requireAdmin } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import PermissionsEditor from './PermissionsEditor';

async function fetchProfiles() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, email, is_admin_full, can_admin_dashboard, can_admin_orders, can_admin_inventory, can_admin_products, can_admin_reviews, can_admin_shipping, can_admin_affiliates, can_admin_parlours'
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
    can_admin_parlours: Boolean(p.can_admin_parlours),
  }));
}

export default async function AdminPermissionsPage() {
  await requireAdmin();
  const profiles = await fetchProfiles();

  return <PermissionsEditor initialProfiles={profiles} />;
}
