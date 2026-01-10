import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

// GET /api/admin/affiliate/payouts/summary
// Returns: payable now total, count of affiliates with payable, last batch info
export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    // Get total payable amount (status='payable' and not yet in a batch)
    const { data: payableData, error: payableErr } = await supabase
      .from('affiliate_commissions')
      .select('commission_amount, affiliate_id')
      .eq('status', 'payable')
      .is('payout_batch_id', null);

    if (payableErr) {
      console.error('[payouts/summary] payable query error', payableErr.message);
      return NextResponse.json({ error: 'Failed to load payable data' }, { status: 500 });
    }

    const payableRows = (payableData || []) as any[];
    const totalPayable = payableRows.reduce((s, r) => s + Number(r.commission_amount || 0), 0);
    const uniqueAffiliates = new Set(payableRows.map(r => r.affiliate_id));
    const affiliatesPayable = uniqueAffiliates.size;

    // Get last completed batch
    const { data: lastBatch, error: batchErr } = await supabase
      .from('affiliate_payout_batches')
      .select('id, batch_date, total_commissions, total_affiliates, status, processed_at')
      .in('status', ['completed', 'paid'])
      .order('batch_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (batchErr) {
      console.error('[payouts/summary] batch query error', batchErr.message);
    }

    // Get recent batches (last 10)
    const { data: recentBatches, error: recentErr } = await supabase
      .from('affiliate_payout_batches')
      .select('id, batch_date, total_commissions, total_affiliates, status, created_at, processed_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentErr) {
      console.error('[payouts/summary] recent batches error', recentErr.message);
    }

    // Calculate next payout date (10th of current or next month)
    const now = new Date();
    let nextPayoutDate: Date;
    if (now.getDate() < 10) {
      nextPayoutDate = new Date(now.getFullYear(), now.getMonth(), 10);
    } else {
      nextPayoutDate = new Date(now.getFullYear(), now.getMonth() + 1, 10);
    }

    return NextResponse.json({
      ok: true,
      summary: {
        total_payable: totalPayable,
        affiliates_payable: affiliatesPayable,
        next_payout_date: nextPayoutDate.toISOString().split('T')[0],
      },
      last_batch: lastBatch ? {
        id: lastBatch.id,
        batch_date: lastBatch.batch_date,
        total_commissions: Number(lastBatch.total_commissions || 0),
        total_affiliates: lastBatch.total_affiliates,
        status: lastBatch.status,
        processed_at: lastBatch.processed_at,
      } : null,
      recent_batches: (recentBatches || []).map((b: any) => ({
        id: b.id,
        batch_date: b.batch_date,
        total_commissions: Number(b.total_commissions || 0),
        total_affiliates: b.total_affiliates,
        status: b.status,
        created_at: b.created_at,
        processed_at: b.processed_at,
      })),
    });
  } catch (e: any) {
    console.error('[payouts/summary] exception', e);
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
