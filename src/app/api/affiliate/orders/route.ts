import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

// Helper to mask phone number: 03001234567 -> 03XX-***567
function maskPhone(phone: string | null): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 6) return '***';
  const first2 = cleaned.slice(0, 2);
  const last3 = cleaned.slice(-3);
  return `${first2}XX-***${last3}`;
}

// Helper to get first name only
function getFirstName(fullName: string | null): string {
  if (!fullName) return 'Customer';
  const parts = fullName.trim().split(/\s+/);
  return parts[0] || 'Customer';
}

// Format batch date: "Jan 10, 2026"
function formatBatchDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// GET /api/affiliate/orders?range=this_month|last_month|last_2_months&page=1&limit=20
export async function GET(req: Request) {
  try {
    const supabase = getSupabaseServerClient();

    const {
      data: { user },
      error: userErr,
    } = await (supabase as any).auth.getUser();

    if (userErr || !user?.email) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    }

    const email = String(user.email).toLowerCase();

    // Find affiliate by email
    const { data: affiliate, error: affErr } = await supabase
      .from('affiliates')
      .select('id, status, active')
      .ilike('email', email)
      .maybeSingle();

    if (affErr || !affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
    }

    const affiliateId = String((affiliate as any).id);

    // Parse query params
    const url = new URL(req.url);
    const range = url.searchParams.get('range') || 'this_month';
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(10, parseInt(url.searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    // Calculate date range
    const now = new Date();
    let dateFrom: Date;
    let dateTo: Date = now;

    if (range === 'last_month') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      dateFrom = lastMonth;
      dateTo = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    } else if (range === 'last_2_months') {
      dateFrom = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    } else {
      // this_month (default)
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Query from affiliate_commissions as source of truth, joined with orders for details
    // This ensures we use the canonical commission status, not derived
    const { data: commissions, error: commissionsErr } = await supabase
      .from('affiliate_commissions')
      .select(`
        id,
        order_id,
        commission_amount,
        status,
        payable_at,
        paid_at,
        voided_at,
        void_reason,
        payout_batch_id,
        created_at,
        orders!inner (
          id,
          created_at,
          customer_name,
          phone,
          city,
          total_amount,
          grand_total,
          delivery_status
        )
      `)
      .eq('affiliate_id', affiliateId)
      .gte('created_at', dateFrom.toISOString())
      .lte('created_at', dateTo.toISOString())
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (commissionsErr) {
      console.error('[affiliate/orders] commissions query error', commissionsErr.message);
      // Fallback to orders table if affiliate_commissions doesn't exist yet
      return await fallbackToOrdersQuery(supabase, affiliateId, dateFrom, dateTo, page, limit, offset, range);
    }

    // Also fallback if affiliate_commissions table exists but has no data for this affiliate
    // This handles the case where commissions haven't been migrated yet
    if (!commissions || commissions.length === 0) {
      console.log('[affiliate/orders] No commissions found, falling back to orders table');
      return await fallbackToOrdersQuery(supabase, affiliateId, dateFrom, dateTo, page, limit, offset, range);
    }

    // Get payout batch info for paid commissions
    const batchIds = (commissions || [])
      .filter((c: any) => c.payout_batch_id)
      .map((c: any) => c.payout_batch_id);
    
    let batchMap: Record<string, string> = {};
    if (batchIds.length > 0) {
      const { data: batches } = await supabase
        .from('affiliate_payout_batches')
        .select('id, batch_date')
        .in('id', batchIds);
      
      if (batches) {
        batchMap = Object.fromEntries(
          batches.map((b: any) => [b.id, formatBatchDate(b.batch_date)])
        );
      }
    }

    const rows = (commissions || []) as any[];

    const processedOrders = rows.map((c) => {
      const o = c.orders;
      
      // Use status directly from affiliate_commissions (source of truth)
      const commissionStatus = c.status as 'pending' | 'payable' | 'paid' | 'void';

      // Privacy-safe customer info
      const firstName = getFirstName(o.customer_name);
      const maskedPhone = maskPhone(o.phone);
      const city = o.city || '';
      const customerDisplay = [firstName, city, maskedPhone].filter(Boolean).join(' • ');

      // Get payout batch label if paid
      const paidIn = c.payout_batch_id ? batchMap[c.payout_batch_id] || null : null;

      return {
        id: c.order_id,
        order_code: `#${String(c.order_id).slice(-6).toUpperCase()}`,
        date: o.created_at,
        delivery_status: o.delivery_status || 'pending',
        order_total: Number(o.grand_total || o.total_amount || 0),
        commission_amount: Number(c.commission_amount || 0),
        commission_status: commissionStatus,
        customer: customerDisplay,
        paid_in: paidIn,
      };
    });

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('affiliate_commissions')
      .select('id', { count: 'exact', head: true })
      .eq('affiliate_id', affiliateId)
      .gte('created_at', dateFrom.toISOString())
      .lte('created_at', dateTo.toISOString());

    // Calculate summary stats (from all records in range, not just current page)
    const { data: summaryData } = await supabase
      .from('affiliate_commissions')
      .select('commission_amount, status')
      .eq('affiliate_id', affiliateId)
      .gte('created_at', dateFrom.toISOString())
      .lte('created_at', dateTo.toISOString());

    const allRows = (summaryData || []) as any[];
    const summary = {
      total_orders: allRows.length,
      total_commission: allRows.reduce((s, r) => s + Number(r.commission_amount || 0), 0),
      pending_commission: allRows.filter(r => r.status === 'pending').reduce((s, r) => s + Number(r.commission_amount || 0), 0),
      payable_commission: allRows.filter(r => r.status === 'payable').reduce((s, r) => s + Number(r.commission_amount || 0), 0),
      paid_commission: allRows.filter(r => r.status === 'paid').reduce((s, r) => s + Number(r.commission_amount || 0), 0),
      void_commission: allRows.filter(r => r.status === 'void').reduce((s, r) => s + Number(r.commission_amount || 0), 0),
    };

    return NextResponse.json({
      ok: true,
      range,
      orders: processedOrders,
      summary,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        hasMore: (totalCount || 0) > offset + limit,
      },
    });
  } catch (e: any) {
    console.error('[affiliate/orders] exception', e);
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}

// Fallback function if affiliate_commissions table doesn't exist or has no data
async function fallbackToOrdersQuery(
  supabase: any,
  affiliateId: string,
  dateFrom: Date,
  dateTo: Date,
  page: number,
  limit: number,
  offset: number,
  range: string
) {
  const { data: orders, error: ordersErr } = await supabase
    .from('orders')
    .select('id, created_at, customer_name, phone, city, total_amount, grand_total, affiliate_commission_amount, status, delivery_status, delivered_at')
    .eq('affiliate_id', affiliateId)
    .gte('created_at', dateFrom.toISOString())
    .lte('created_at', dateTo.toISOString())
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (ordersErr) {
    console.error('[affiliate/orders] fallback query error', ordersErr.message);
    return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 });
  }

  const now = new Date();
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
  const rows = (orders || []) as any[];

  const processedOrders = rows.map((o) => {
    // Derive commission status (fallback only)
    let commissionStatus: 'pending' | 'payable' | 'paid' | 'void' = 'pending';
    
    if (o.delivery_status === 'failed' || o.delivery_status === 'returned' || o.delivery_status === 'cancelled') {
      commissionStatus = 'void';
    } else if (o.delivery_status === 'delivered' && o.delivered_at) {
      const deliveredDate = new Date(o.delivered_at);
      if (deliveredDate <= tenDaysAgo) {
        commissionStatus = 'payable';
      } else {
        commissionStatus = 'pending';
      }
    }

    // Privacy-safe customer info
    const firstName = getFirstName(o.customer_name);
    const maskedPhone = maskPhone(o.phone);
    const city = o.city || '';
    const customerDisplay = [firstName, city, maskedPhone].filter(Boolean).join(' • ');

    return {
      id: o.id,
      order_code: `#${String(o.id).slice(-6).toUpperCase()}`,
      date: o.created_at,
      delivery_status: o.delivery_status || 'pending',
      order_total: Number(o.grand_total || o.total_amount || 0),
      commission_amount: Number(o.affiliate_commission_amount || 0),
      commission_status: commissionStatus,
      customer: customerDisplay,
      paid_in: null,
    };
  });

  // Get total count
  const { count: totalCount } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('affiliate_id', affiliateId)
    .gte('created_at', dateFrom.toISOString())
    .lte('created_at', dateTo.toISOString());

  const summary = {
    total_orders: totalCount || 0,
    total_commission: processedOrders.reduce((s, o) => s + o.commission_amount, 0),
    pending_commission: processedOrders.filter(o => o.commission_status === 'pending').reduce((s, o) => s + o.commission_amount, 0),
    payable_commission: processedOrders.filter(o => o.commission_status === 'payable').reduce((s, o) => s + o.commission_amount, 0),
    paid_commission: 0,
    void_commission: processedOrders.filter(o => o.commission_status === 'void').reduce((s, o) => s + o.commission_amount, 0),
  };

  return NextResponse.json({
    ok: true,
    range,
    orders: processedOrders,
    summary,
    pagination: {
      page,
      limit,
      total: totalCount || 0,
      hasMore: (totalCount || 0) > offset + limit,
    },
    _fallback: true, // Indicates we used fallback (for debugging)
  });
}
