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

    // Fetch commission stats with batch info
    const { data: commissions, error: commErr } = await supabase
      .from('affiliate_commissions')
      .select('status, commission_amount, payable_at, payout_batch_id')
      .eq('affiliate_id', affiliateId);

    if (commErr) {
      console.error('[admin/affiliate/detail] commissions error', commErr.message);
    }

    // Fetch batch statuses for commissions in batches
    const batchIds = Array.from(new Set(
      ((commissions || []) as any[])
        .map(c => c.payout_batch_id)
        .filter(Boolean)
    ));
    
    let batchStatusMap: Record<string, string> = {};
    let batchInfoMap: Record<string, { batch_date: string; status: string }> = {};
    if (batchIds.length > 0) {
      const { data: batches } = await supabase
        .from('affiliate_payout_batches')
        .select('id, status, batch_date')
        .in('id', batchIds);
      
      for (const b of (batches || []) as any[]) {
        batchStatusMap[b.id] = b.status;
        batchInfoMap[b.id] = { batch_date: b.batch_date, status: b.status };
      }
    }

    // Calculate stats with canonical eligibility rule
    const now = new Date();
    let totalOrders = 0;
    let totalSales = 0;
    let totalCommission = 0;
    let pendingAmount = 0;
    let payableNowAmount = 0;
    let inBatchAmount = 0;
    let paidAmount = 0;

    for (const o of orders || []) {
      totalOrders += 1;
      totalSales += Number((o as any).total_amount || 0);
      totalCommission += Number((o as any).affiliate_commission_amount || 0);
    }

    // Build list of batches this affiliate is in
    const affiliateBatches: { id: string; batch_date: string; status: string; amount: number }[] = [];
    const batchAmounts: Record<string, number> = {};

    for (const c of commissions || []) {
      const amt = Number((c as any).commission_amount || 0);
      const status = (c as any).status;
      const payableAt = (c as any).payable_at ? new Date((c as any).payable_at) : null;
      const batchId = (c as any).payout_batch_id;
      const batchStatus = batchId ? batchStatusMap[batchId] : null;
      
      const isEligible = status === 'payable' || (status === 'pending' && payableAt && payableAt <= now);
      
      if (status === 'paid') {
        paidAmount += amt;
      } else if (isEligible) {
        if (batchId && batchStatus !== 'paid') {
          inBatchAmount += amt;
          batchAmounts[batchId] = (batchAmounts[batchId] || 0) + amt;
        } else if (!batchId) {
          payableNowAmount += amt;
        }
      } else if (status === 'pending' && payableAt && payableAt > now) {
        pendingAmount += amt;
      }
    }

    // Build batch list
    for (const batchId of Object.keys(batchAmounts)) {
      const info = batchInfoMap[batchId];
      if (info) {
        affiliateBatches.push({
          id: batchId,
          batch_date: info.batch_date,
          status: info.status,
          amount: batchAmounts[batchId],
        });
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
          payable_now_amount: payableNowAmount,
          in_batch_amount: inBatchAmount,
          paid_amount: paidAmount,
          // Legacy alias
          payable_amount: payableNowAmount,
        },
        pending_batches: affiliateBatches,
        recent_orders: recentOrders,
      },
    });
  } catch (e: any) {
    console.error('[admin/affiliate/detail] exception', e);
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
