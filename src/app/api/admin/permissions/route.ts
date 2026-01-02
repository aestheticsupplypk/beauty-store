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

    // Update each profile
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
          can_admin_parlours: Boolean(p.can_admin_parlours),
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
