import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabaseService';

// POST /api/affiliate/summary
// Body: { code: string }
// Looks up affiliate by code and returns aggregate stats and recent orders.
export async function POST(req: Request) {
  try {
    const supabase = getSupabaseServiceClient();
    const body = await req.json().catch(() => ({}));

    const rawCode = String(body?.code || '').trim().toUpperCase();
    if (!rawCode) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const { data: affiliate, error: affErr } = await supabase
      .from('affiliates')
      .select('id, name, parlour_name, city, code, active')
      .eq('code', rawCode)
      .maybeSingle();

    if (affErr) {
      console.error('[affiliate/summary] affiliate error', affErr.message);
      return NextResponse.json({ error: 'Failed to load affiliate' }, { status: 500 });
    }
    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate code not found' }, { status: 404 });
    }
    if (!(affiliate as any).active) {
      return NextResponse.json({ error: 'This affiliate code is not active anymore' }, { status: 403 });
    }

    const affiliateId = String((affiliate as any).id);

    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select('id, created_at, total_amount, grand_total, affiliate_commission_amount')
      .eq('affiliate_id', affiliateId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (ordersErr) {
      console.error('[affiliate/summary] orders error', ordersErr.message);
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
      })),
    });
  } catch (e: any) {
    console.error('[affiliate/summary] exception', e);
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
