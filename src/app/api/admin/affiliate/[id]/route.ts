import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

// GET /api/admin/affiliate/[id]
// Returns detailed affiliate info including payout details and recent orders
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServerClient();
    const affiliateId = params.id;

    // Fetch affiliate with all fields
    const { data: affiliate, error: affErr } = await supabase
      .from('affiliates')
      .select(`
        id,
        name,
        email,
        phone,
        parlour_name,
        city,
        code,
        active,
        created_at,
        payout_method,
        easypaisa_number,
        bank_name,
        bank_account_name,
        bank_account_number,
        bank_iban,
        notes
      `)
      .eq('id', affiliateId)
      .single();

    if (affErr || !affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
    }

    // Fetch recent orders (last 10)
    const { data: orders, error: ordErr } = await supabase
      .from('orders')
      .select('id, order_code, created_at, total_amount, affiliate_commission_amount, delivery_status')
      .eq('affiliate_id', affiliateId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (ordErr) {
      console.error('[admin/affiliate/detail] orders error', ordErr.message);
    }

    // Fetch commission stats
    const { data: commissions, error: commErr } = await supabase
      .from('affiliate_commissions')
      .select('status, commission_amount')
      .eq('affiliate_id', affiliateId);

    if (commErr) {
      console.error('[admin/affiliate/detail] commissions error', commErr.message);
    }

    // Calculate stats
    let totalOrders = 0;
    let totalSales = 0;
    let totalCommission = 0;
    let pendingAmount = 0;
    let payableAmount = 0;

    for (const o of orders || []) {
      totalOrders += 1;
      totalSales += Number((o as any).total_amount || 0);
      totalCommission += Number((o as any).affiliate_commission_amount || 0);
    }

    for (const c of commissions || []) {
      const amt = Number((c as any).commission_amount || 0);
      if ((c as any).status === 'pending') {
        pendingAmount += amt;
      } else if ((c as any).status === 'payable') {
        payableAmount += amt;
      }
    }

    // Format recent orders
    const recentOrders = (orders || []).map((o: any) => ({
      id: o.id,
      order_code: o.order_code || `#${String(o.id).slice(-6)}`,
      created_at: o.created_at,
      total_amount: Number(o.total_amount || 0),
      commission_amount: Number(o.affiliate_commission_amount || 0),
      delivery_status: o.delivery_status || 'pending',
      commission_status: 'pending', // Could be enhanced
    }));

    return NextResponse.json({
      ok: true,
      affiliate: {
        ...affiliate,
        stats: {
          total_orders: totalOrders,
          total_sales: totalSales,
          total_commission: totalCommission,
          pending_amount: pendingAmount,
          payable_amount: payableAmount,
        },
        recent_orders: recentOrders,
      },
    });
  } catch (e: any) {
    console.error('[admin/affiliate/detail] exception', e);
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
