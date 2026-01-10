import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

// GET /api/admin/affiliate/payouts/batches/[id]
// Returns batch details with affiliates and commissions
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServerClient();
    const batchId = params.id;

    // Get batch info
    const { data: batch, error: batchErr } = await supabase
      .from('affiliate_payout_batches')
      .select('*')
      .eq('id', batchId)
      .single();

    if (batchErr || !batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Get commissions in this batch with affiliate info
    const { data: commissions, error: commErr } = await supabase
      .from('affiliate_commissions')
      .select(`
        id,
        order_id,
        affiliate_id,
        commission_amount,
        status,
        payable_at,
        paid_at,
        affiliates!inner (
          id,
          name,
          code,
          email,
          payout_method,
          easypaisa_number,
          bank_name,
          bank_account_number
        )
      `)
      .eq('payout_batch_id', batchId)
      .order('affiliate_id');

    if (commErr) {
      console.error('[payouts/batches/id] commissions error', commErr.message);
      return NextResponse.json({ error: 'Failed to load commissions' }, { status: 500 });
    }

    const rows = (commissions || []) as any[];

    // Group by affiliate
    const affiliateMap = new Map<string, {
      affiliate: any;
      commissions: any[];
      total_amount: number;
    }>();

    for (const c of rows) {
      const affId = c.affiliate_id;
      if (!affiliateMap.has(affId)) {
        affiliateMap.set(affId, {
          affiliate: c.affiliates,
          commissions: [],
          total_amount: 0,
        });
      }
      const entry = affiliateMap.get(affId)!;
      entry.commissions.push({
        id: c.id,
        order_id: c.order_id,
        commission_amount: Number(c.commission_amount || 0),
        status: c.status,
        payable_at: c.payable_at,
        paid_at: c.paid_at,
      });
      entry.total_amount += Number(c.commission_amount || 0);
    }

    // Convert to array
    const affiliates = Array.from(affiliateMap.entries()).map(([affId, data]) => ({
      affiliate_id: affId,
      name: data.affiliate.name,
      code: data.affiliate.code,
      email: data.affiliate.email,
      payout_method: data.affiliate.payout_method || 'not_set',
      payout_account: data.affiliate.payout_method === 'easypaisa' 
        ? data.affiliate.easypaisa_number 
        : data.affiliate.payout_method === 'bank_transfer'
        ? `${data.affiliate.bank_name} - ${data.affiliate.bank_account_number}`
        : null,
      commission_count: data.commissions.length,
      total_amount: data.total_amount,
      commissions: data.commissions,
    }));

    // Sort by total amount descending
    affiliates.sort((a, b) => b.total_amount - a.total_amount);

    return NextResponse.json({
      ok: true,
      batch: {
        id: (batch as any).id,
        batch_date: (batch as any).batch_date,
        period_start: (batch as any).period_start,
        period_end: (batch as any).period_end,
        total_commissions: Number((batch as any).total_commissions || 0),
        total_affiliates: (batch as any).total_affiliates,
        status: (batch as any).status,
        created_at: (batch as any).created_at,
        processed_at: (batch as any).processed_at,
        notes: (batch as any).notes,
      },
      affiliates,
      totals: {
        commission_count: rows.length,
        total_amount: affiliates.reduce((s, a) => s + a.total_amount, 0),
      },
    });
  } catch (e: any) {
    console.error('[payouts/batches/id] exception', e);
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
