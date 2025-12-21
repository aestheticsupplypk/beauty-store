import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

// GET /api/affiliate/me
// Uses the logged-in Supabase auth user (via cookies) to resolve their affiliate row
// and returns the same structure as /api/affiliate/summary, but without needing a code.
export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    const {
      data: { user },
      error: userErr,
    } = await (supabase as any).auth.getUser();

    if (userErr) {
      console.error('[affiliate/me] getUser error', userErr.message);
      return NextResponse.json({ error: 'Failed to read session' }, { status: 500 });
    }
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    }

    const email = String(user.email).toLowerCase();

    const { data: affiliate, error: affErr } = await supabase
      .from('affiliates')
      .select('id, name, parlour_name, city, code, active, email')
      .ilike('email', email)
      .maybeSingle();

    if (affErr) {
      console.error('[affiliate/me] affiliate error', affErr.message);
      return NextResponse.json({ error: 'Failed to load affiliate' }, { status: 500 });
    }
    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate profile not found for this account' }, { status: 404 });
    }
    if (!(affiliate as any).active) {
      return NextResponse.json({ error: 'Affiliate account is not active' }, { status: 403 });
    }

    const affiliateId = String((affiliate as any).id);

    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select('id, created_at, total_amount, grand_total, affiliate_commission_amount, customer_name')
      .eq('affiliate_id', affiliateId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (ordersErr) {
      console.error('[affiliate/me] orders error', ordersErr.message);
      return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 });
    }

    const rows = (orders || []) as any[];
    const totalOrders = rows.length;
    const totalSales = rows.reduce((s, r) => s + Number(r.total_amount || 0), 0);
    const totalCommission = rows.reduce((s, r) => s + Number(r.affiliate_commission_amount || 0), 0);

    return NextResponse.json({
      ok: true,
      affiliate: {
        id: affiliateId,
        name: (affiliate as any).name,
        parlour_name: (affiliate as any).parlour_name,
        city: (affiliate as any).city,
        code: (affiliate as any).code,
      },
      stats: {
        total_orders: totalOrders,
        total_sales: totalSales,
        total_commission: totalCommission,
      },
      orders: rows.map((r) => ({
        id: r.id,
        created_at: r.created_at,
        total_amount: Number(r.total_amount || 0),
        grand_total: Number(r.grand_total || 0),
        affiliate_commission_amount: Number(r.affiliate_commission_amount || 0),
        customer_name: r.customer_name || null,
      })),
    });
  } catch (e: any) {
    console.error('[affiliate/me] exception', e);
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
