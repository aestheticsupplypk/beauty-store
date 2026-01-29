import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

// GET /api/admin/affiliate/list
// Returns affiliates with tier info, last order date, payout status, and filters
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const { searchParams } = new URL(request.url);

    // Parse filters
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status'); // 'active' | 'inactive' | null (all)
    const city = searchParams.get('city');
    const tier = searchParams.get('tier');
    const hasPayable = searchParams.get('hasPayable'); // 'true' | 'false' | null
    const payoutReady = searchParams.get('payoutReady'); // 'complete' | 'incomplete' | null
    const last30Days = searchParams.get('last30Days') === 'true';

    // Fetch all affiliates with basic info
    let query = supabase
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
        bank_iban
      `)
      .order('created_at', { ascending: false });

    // Apply status filter
    if (status === 'active') {
      query = query.eq('active', true);
    } else if (status === 'inactive') {
      query = query.eq('active', false);
    }

    // Apply city filter
    if (city) {
      query = query.ilike('city', `%${city}%`);
    }

    const { data: affiliates, error: affErr } = await query;
    if (affErr) {
      console.error('[admin/affiliate/list] affiliates query error', affErr.message);
      return NextResponse.json({ error: 'Failed to load affiliates' }, { status: 500 });
    }

    const ids = (affiliates || []).map((a: any) => a.id).filter(Boolean) as string[];
    if (ids.length === 0) {
      return NextResponse.json({ ok: true, affiliates: [], cities: [], tiers: [] });
    }

    // Fetch orders stats for each affiliate
    const { data: orders, error: ordErr } = await supabase
      .from('orders')
      .select('affiliate_id, total_amount, affiliate_commission_amount, created_at, delivery_status, delivered_at')
      .in('affiliate_id', ids);
    if (ordErr) {
      console.error('[admin/affiliate/list] orders query error', ordErr.message);
    }

    // Fetch payable commissions
    const { data: payableCommissions, error: payErr } = await supabase
      .from('affiliate_commissions')
      .select('affiliate_id, commission_amount')
      .in('affiliate_id', ids)
      .eq('status', 'payable')
      .is('payout_batch_id', null);
    if (payErr) {
      console.error('[admin/affiliate/list] payable query error', payErr.message);
    }

    // Fetch commissions from last 30 days for void rate calculation
    const thirtyDaysAgoForVoid = new Date();
    thirtyDaysAgoForVoid.setDate(thirtyDaysAgoForVoid.getDate() - 30);
    
    const { data: allCommissions, error: commErr } = await supabase
      .from('affiliate_commissions')
      .select('affiliate_id, status, created_at')
      .in('affiliate_id', ids)
      .gte('created_at', thirtyDaysAgoForVoid.toISOString());
    if (commErr) {
      console.error('[admin/affiliate/list] commissions query error', commErr.message);
    }

    // Fetch tiers
    const { data: tiers, error: tierErr } = await supabase
      .from('affiliate_tiers')
      .select('id, name, min_delivered_orders_30d, multiplier_percent')
      .eq('active', true)
      .order('min_delivered_orders_30d', { ascending: true });
    if (tierErr) {
      console.error('[admin/affiliate/list] tiers query error', tierErr.message);
    }

    // Calculate stats per affiliate
    const statsById: Record<string, {
      total_orders: number;
      total_sales: number;
      total_commission: number;
      last_order_date: string | null;
      delivered_count_30d: number;
      payable_amount: number;
      void_count: number;
      commission_count: number;
    }> = {};

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const o of orders || []) {
      const ao = o as any;
      const aid = String(ao.affiliate_id || '');
      if (!aid) continue;
      
      if (!statsById[aid]) {
        statsById[aid] = {
          total_orders: 0,
          total_sales: 0,
          total_commission: 0,
          last_order_date: null,
          delivered_count_30d: 0,
          payable_amount: 0,
          void_count: 0,
          commission_count: 0,
        };
      }
      
      statsById[aid].total_orders += 1;
      statsById[aid].total_sales += Number(ao.total_amount || 0);
      statsById[aid].total_commission += Number(ao.affiliate_commission_amount || 0);
      
      // Track last order date
      const orderDate = ao.created_at;
      const currentLastOrder = statsById[aid].last_order_date;
      if (!currentLastOrder || orderDate > currentLastOrder) {
        statsById[aid].last_order_date = orderDate;
      }
      
      // Count delivered orders in last 30 days
      if (ao.delivery_status === 'delivered' && ao.delivered_at) {
        const deliveredDate = new Date(ao.delivered_at);
        if (deliveredDate >= thirtyDaysAgo) {
          statsById[aid].delivered_count_30d += 1;
        }
      }
    }

    // Add payable amounts
    for (const pc of payableCommissions || []) {
      const aid = String((pc as any).affiliate_id || '');
      if (!aid) continue;
      if (!statsById[aid]) {
        statsById[aid] = {
          total_orders: 0,
          total_sales: 0,
          total_commission: 0,
          last_order_date: null,
          delivered_count_30d: 0,
          payable_amount: 0,
          void_count: 0,
          commission_count: 0,
        };
      }
      statsById[aid].payable_amount += Number((pc as any).commission_amount || 0);
    }

    // Calculate void rates from all commissions
    for (const c of allCommissions || []) {
      const ac = c as any;
      const aid = String(ac.affiliate_id || '');
      if (!aid) continue;
      if (!statsById[aid]) {
        statsById[aid] = {
          total_orders: 0,
          total_sales: 0,
          total_commission: 0,
          last_order_date: null,
          delivered_count_30d: 0,
          payable_amount: 0,
          void_count: 0,
          commission_count: 0,
        };
      }
      statsById[aid].commission_count += 1;
      if (ac.status === 'void') {
        statsById[aid].void_count += 1;
      }
    }

    // Calculate tier for each affiliate
    const tiersList = (tiers || []) as any[];
    const getTierForCount = (count: number) => {
      let currentTier = tiersList[0] || { name: 'Bronze', multiplier_percent: 100 };
      for (const t of tiersList) {
        if (count >= t.min_delivered_orders_30d) {
          currentTier = t;
        }
      }
      return currentTier;
    };

    // Build enriched affiliates list
    let enrichedAffiliates = (affiliates || []).map((a: any) => {
      const stats = statsById[a.id] || {
        total_orders: 0,
        total_sales: 0,
        total_commission: 0,
        last_order_date: null,
        delivered_count_30d: 0,
        payable_amount: 0,
        void_count: 0,
        commission_count: 0,
      };
      
      // Calculate void rate (percentage of voided commissions)
      const voidRate = stats.commission_count > 0 
        ? Math.round((stats.void_count / stats.commission_count) * 100) 
        : 0;
      
      const currentTier = getTierForCount(stats.delivered_count_30d);
      
      // Determine payout readiness
      const hasPayoutMethod = !!a.payout_method;
      const hasPayoutDetails = a.payout_method === 'easypaisa' 
        ? !!a.easypaisa_number
        : a.payout_method === 'bank_transfer'
        ? !!(a.bank_name && a.bank_account_number)
        : false;
      const isPayoutReady = hasPayoutMethod && hasPayoutDetails;
      
      return {
        id: a.id,
        name: a.name,
        email: a.email,
        phone: a.phone,
        parlour_name: a.parlour_name,
        city: a.city,
        code: a.code,
        active: a.active,
        created_at: a.created_at,
        payout_method: a.payout_method,
        payout_account: a.payout_method === 'easypaisa'
          ? a.easypaisa_number
          : a.payout_method === 'bank_transfer'
          ? `${a.bank_name || ''} - ${a.bank_account_number || ''}`
          : null,
        payout_ready: isPayoutReady,
        payout_missing: !hasPayoutMethod 
          ? 'method' 
          : !hasPayoutDetails 
          ? 'details' 
          : null,
        stats: {
          total_orders: stats.total_orders,
          total_sales: stats.total_sales,
          total_commission: stats.total_commission,
          last_order_date: stats.last_order_date,
          delivered_count_30d: stats.delivered_count_30d,
          payable_amount: stats.payable_amount,
          void_count: stats.void_count,
          void_rate: voidRate,
          commission_count_30d: stats.commission_count,
        },
        tier: {
          name: currentTier.name,
          multiplier_percent: currentTier.multiplier_percent,
        },
      };
    });

    // Apply search filter (client-side for flexibility)
    if (search) {
      const searchLower = search.toLowerCase();
      enrichedAffiliates = enrichedAffiliates.filter((a: any) =>
        a.name?.toLowerCase().includes(searchLower) ||
        a.email?.toLowerCase().includes(searchLower) ||
        a.phone?.includes(search) ||
        a.code?.toLowerCase().includes(searchLower)
      );
    }

    // Apply tier filter
    if (tier) {
      enrichedAffiliates = enrichedAffiliates.filter((a: any) => 
        a.tier.name.toLowerCase() === tier.toLowerCase()
      );
    }

    // Apply hasPayable filter
    if (hasPayable === 'true') {
      enrichedAffiliates = enrichedAffiliates.filter((a: any) => a.stats.payable_amount > 0);
    } else if (hasPayable === 'false') {
      enrichedAffiliates = enrichedAffiliates.filter((a: any) => a.stats.payable_amount === 0);
    }

    // Apply payoutReady filter
    if (payoutReady === 'complete') {
      enrichedAffiliates = enrichedAffiliates.filter((a: any) => a.payout_ready);
    } else if (payoutReady === 'incomplete') {
      enrichedAffiliates = enrichedAffiliates.filter((a: any) => !a.payout_ready);
    }

    // Apply last30Days filter (affiliates with orders in last 30 days)
    if (last30Days) {
      const thirtyDaysAgoDate = new Date();
      thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 30);
      enrichedAffiliates = enrichedAffiliates.filter((a: any) => {
        if (!a.stats.last_order_date) return false;
        return new Date(a.stats.last_order_date) >= thirtyDaysAgoDate;
      });
    }

    // Get unique cities for filter dropdown
    const citiesSet = new Set<string>();
    (affiliates || []).forEach((a: any) => {
      if (a.city) citiesSet.add(a.city);
    });
    const cities = Array.from(citiesSet).sort();

    return NextResponse.json({
      ok: true,
      affiliates: enrichedAffiliates,
      cities,
      tiers: tiersList.map((t: any) => ({ name: t.name, min_orders: t.min_delivered_orders_30d })),
    });
  } catch (e: any) {
    console.error('[admin/affiliate/list] exception', e);
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
