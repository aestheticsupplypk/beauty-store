import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

// GET /api/admin/affiliate/payouts/candidates
// Returns list of affiliates with payable commissions (not yet in a batch)
export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    // Get all payable commissions not yet assigned to a batch
    const { data: commissions, error: commErr } = await supabase
      .from('affiliate_commissions')
      .select(`
        id,
        affiliate_id,
        order_id,
        commission_amount,
        payable_at,
        created_at,
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
      .eq('status', 'payable')
      .is('payout_batch_id', null)
      .order('affiliate_id')
      .order('payable_at', { ascending: true });

    if (commErr) {
      console.error('[payouts/candidates] query error', commErr.message);
      return NextResponse.json({ error: 'Failed to load candidates' }, { status: 500 });
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
        payable_at: c.payable_at,
      });
      entry.total_amount += Number(c.commission_amount || 0);
    }

    // Convert to array
    const candidates = Array.from(affiliateMap.entries()).map(([affId, data]) => ({
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
    candidates.sort((a, b) => b.total_amount - a.total_amount);

    // Calculate totals
    const totalAmount = candidates.reduce((s, c) => s + c.total_amount, 0);
    const totalCommissions = rows.length;

    return NextResponse.json({
      ok: true,
      candidates,
      totals: {
        total_amount: totalAmount,
        total_commissions: totalCommissions,
        total_affiliates: candidates.length,
      },
    });
  } catch (e: any) {
    console.error('[payouts/candidates] exception', e);
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
