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

    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select('id, created_at, total_amount, grand_total, affiliate_commission_amount, customer_name, status, delivered_at, delivery_status')
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
    
    // Calculate pending commission: orders delivered but within 10 days (not yet payable)
    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const pendingCommission = rows.reduce((s, r) => {
      // If delivered but delivered_at is within last 10 days, it's pending
      if (r.status === 'delivered' && r.delivered_at) {
        const deliveredDate = new Date(r.delivered_at);
        if (deliveredDate > tenDaysAgo) {
          return s + Number(r.affiliate_commission_amount || 0);
        }
      }
      return s;
    }, 0);

    // Calculate payable commission (delivered > 10 days ago, not yet paid)
    const payableCommission = rows.reduce((s, r) => {
      if (r.status === 'delivered' && r.delivered_at) {
        const deliveredDate = new Date(r.delivered_at);
        if (deliveredDate <= tenDaysAgo) {
          return s + Number(r.affiliate_commission_amount || 0);
        }
      }
      return s;
    }, 0);

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
        total_sales: totalSales,
        total_commission: totalCommission,
        pending_commission: pendingCommission,
        payable_commission: payableCommission,
      },
      tier: tierInfo,
      orders: rows.map((r) => ({
        id: r.id,
        created_at: r.created_at,
        total_amount: Number(r.total_amount || 0),
        grand_total: Number(r.grand_total || 0),
        affiliate_commission_amount: Number(r.affiliate_commission_amount || 0),
        customer_name: r.customer_name || null,
        delivery_status: r.delivery_status || null,
      })),
    });
  } catch (e: any) {
    console.error('[affiliate/me] exception', e);
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
