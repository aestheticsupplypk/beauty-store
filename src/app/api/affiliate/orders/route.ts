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

// GET /api/affiliate/orders?range=this_month|last_month|last_2_months
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

    // Parse range from query params
    const url = new URL(req.url);
    const range = url.searchParams.get('range') || 'this_month';

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

    // Query orders with privacy-safe fields
    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select('id, created_at, customer_name, phone, city, total_amount, grand_total, affiliate_commission_amount, status, delivery_status, delivered_at')
      .eq('affiliate_id', affiliateId)
      .gte('created_at', dateFrom.toISOString())
      .lte('created_at', dateTo.toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    if (ordersErr) {
      console.error('[affiliate/orders] query error', ordersErr.message);
      return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 });
    }

    const rows = (orders || []) as any[];

    // Calculate commission status for each order
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

    const processedOrders = rows.map((o) => {
      // Determine commission status
      let commissionStatus: 'pending' | 'payable' | 'paid' | 'void' = 'pending';
      
      if (o.delivery_status === 'failed' || o.delivery_status === 'returned' || o.delivery_status === 'cancelled') {
        commissionStatus = 'void';
      } else if (o.delivery_status === 'delivered' && o.delivered_at) {
        const deliveredDate = new Date(o.delivered_at);
        if (deliveredDate <= tenDaysAgo) {
          commissionStatus = 'payable'; // Could be 'paid' if we had payout tracking
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
        paid_in: null, // Will show payout batch when implemented
      };
    });

    // Calculate summary stats
    const summary = {
      total_orders: processedOrders.length,
      total_commission: processedOrders.reduce((s, o) => s + o.commission_amount, 0),
      pending_commission: processedOrders.filter(o => o.commission_status === 'pending').reduce((s, o) => s + o.commission_amount, 0),
      payable_commission: processedOrders.filter(o => o.commission_status === 'payable').reduce((s, o) => s + o.commission_amount, 0),
      void_commission: processedOrders.filter(o => o.commission_status === 'void').reduce((s, o) => s + o.commission_amount, 0),
    };

    return NextResponse.json({
      ok: true,
      range,
      orders: processedOrders,
      summary,
    });
  } catch (e: any) {
    console.error('[affiliate/orders] exception', e);
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
