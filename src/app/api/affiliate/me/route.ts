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
      .select('id, name, parlour_name, city, code, active, email, status, strike_count, commission_rate')
      .ilike('email', email)
      .maybeSingle();

    if (affErr) {
      console.error('[affiliate/me] affiliate error', affErr.message);
      return NextResponse.json({ error: 'Failed to load affiliate' }, { status: 500 });
    }
    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate profile not found for this account' }, { status: 404 });
    }
    const affiliateStatus = (affiliate as any).status || 'active';
    
    // Check if affiliate can access dashboard based on status
    if (affiliateStatus === 'revoked') {
      return NextResponse.json({ error: 'Affiliate account has been permanently revoked' }, { status: 403 });
    }
    if (affiliateStatus === 'suspended') {
      return NextResponse.json({ error: 'Affiliate account is suspended due to too many failed deliveries' }, { status: 403 });
    }
    if (!(affiliate as any).active && affiliateStatus !== 'warning') {
      return NextResponse.json({ error: 'Affiliate account is not active' }, { status: 403 });
    }

    const affiliateId = String((affiliate as any).id);

    // ============================================================================
    // FETCH FROM affiliate_commissions (SINGLE SOURCE OF TRUTH)
    // ============================================================================
    const { data: commissions, error: commissionsErr } = await supabase
      .from('affiliate_commissions')
      .select(`
        id,
        order_id,
        commission_amount,
        status,
        payable_at,
        void_reason,
        created_at,
        orders!inner (
          id,
          created_at,
          customer_name,
          phone,
          city,
          total_amount,
          grand_total,
          status,
          delivery_status
        )
      `)
      .eq('affiliate_id', affiliateId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (commissionsErr) {
      console.error('[affiliate/me] commissions error', commissionsErr.message);
      return NextResponse.json({ error: 'Failed to load commissions' }, { status: 500 });
    }

    const rows = (commissions || []) as any[];
    
    // ============================================================================
    // CALCULATE STATS FROM affiliate_commissions
    // ============================================================================
    // Total orders = all orders (including void) so affiliate sees their activity
    const totalOrders = rows.length;
    // Active orders = excluding void (for sales/commission calculations)
    const activeRows = rows.filter(r => r.status !== 'void');
    const activeOrders = activeRows.length;
    
    const totalSales = activeRows.reduce((s, r) => s + Number(r.orders?.total_amount || 0), 0);
    const totalCommission = activeRows.reduce((s, r) => s + Number(r.commission_amount || 0), 0);
    
    // Stats based purely on commission_status (single source of truth)
    const pendingCommission = rows
      .filter(r => r.status === 'pending')
      .reduce((s, r) => s + Number(r.commission_amount || 0), 0);
    
    const payableCommission = rows
      .filter(r => r.status === 'payable')
      .reduce((s, r) => s + Number(r.commission_amount || 0), 0);
    
    const paidCommission = rows
      .filter(r => r.status === 'paid')
      .reduce((s, r) => s + Number(r.commission_amount || 0), 0);
    
    const voidCommission = rows
      .filter(r => r.status === 'void')
      .reduce((s, r) => s + Number(r.commission_amount || 0), 0);
    
    // Find next payable date (earliest payable_at among pending commissions)
    const pendingWithPayableAt = rows
      .filter(r => r.status === 'pending' && r.payable_at)
      .map(r => new Date(r.payable_at))
      .sort((a, b) => a.getTime() - b.getTime());
    const nextPayableDate = pendingWithPayableAt.length > 0 ? pendingWithPayableAt[0].toISOString() : null;

    // Get affiliate's current tier
    let tierInfo = { tier_name: 'Bronze', delivered_count_30d: 0, next_tier_name: 'Silver', next_tier_threshold: 10 };
    try {
      const { data: tierData } = await supabase.rpc('get_affiliate_tier', { p_affiliate_id: affiliateId });
      if (tierData && tierData.length > 0) {
        const t = tierData[0];
        tierInfo.tier_name = t.tier_name || 'Bronze';
        tierInfo.delivered_count_30d = t.delivered_count_30d || 0;
        
        // Get next tier info
        const { data: allTiers } = await supabase
          .from('affiliate_tiers')
          .select('name, min_delivered_orders_30d')
          .eq('active', true)
          .gt('min_delivered_orders_30d', tierInfo.delivered_count_30d)
          .order('min_delivered_orders_30d', { ascending: true })
          .limit(1);
        
        if (allTiers && allTiers.length > 0) {
          tierInfo.next_tier_name = (allTiers[0] as any).name;
          tierInfo.next_tier_threshold = (allTiers[0] as any).min_delivered_orders_30d;
        } else {
          tierInfo.next_tier_name = null as any;
          tierInfo.next_tier_threshold = null as any;
        }
      }
    } catch (tierErr) {
      console.error('[affiliate/me] tier lookup error', tierErr);
    }

    return NextResponse.json({
      ok: true,
      affiliate: {
        id: affiliateId,
        name: (affiliate as any).name,
        parlour_name: (affiliate as any).parlour_name,
        city: (affiliate as any).city,
        code: (affiliate as any).code,
        status: affiliateStatus,
        strike_count: (affiliate as any).strike_count || 0,
        commission_rate: (affiliate as any).commission_rate || 0.10,
      },
      stats: {
        total_orders: totalOrders,
        active_orders: activeOrders,
        total_sales: totalSales,
        total_commission: totalCommission,
        pending_commission: pendingCommission,
        payable_commission: payableCommission,
        paid_commission: paidCommission,
        void_commission: voidCommission,
        next_payable_date: nextPayableDate,
      },
      tier: tierInfo,
      orders: rows.map((r) => {
        const o = r.orders;
        // Show both order status and commission status
        const orderStatus = (o?.status || '').toLowerCase();
        const deliveryStatus = o?.delivery_status || null;
        const commissionStatus = r.status; // From affiliate_commissions (source of truth)
        
        return {
          id: r.order_id,
          created_at: o?.created_at || r.created_at,
          total_amount: Number(o?.total_amount || 0),
          grand_total: Number(o?.grand_total || 0),
          affiliate_commission_amount: Number(r.commission_amount || 0),
          customer_name: o?.customer_name || null,
          phone: o?.phone || null,
          city: o?.city || null,
          // Order status (pending/packed/shipped/delivered/cancelled)
          order_status: orderStatus,
          delivery_status: deliveryStatus,
          // Commission status (pending/payable/paid/void) - from affiliate_commissions
          commission_status: commissionStatus,
          // Payable date (when commission becomes payable)
          payable_at: r.payable_at || null,
          // Void reason (if voided)
          void_reason: r.void_reason || null,
        };
      }),
    });
  } catch (e: any) {
    console.error('[affiliate/me] exception', e);
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
