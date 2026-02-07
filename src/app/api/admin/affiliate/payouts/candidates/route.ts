import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

// GET /api/admin/affiliate/payouts/candidates
// Returns list of affiliates with payable commissions (not yet in a batch)
export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    // ============================================================================
    // CANONICAL ELIGIBILITY RULE:
    // A commission is payout-eligible when:
    //   status = 'payable' OR (status = 'pending' AND payable_at <= now())
    // Exclude: paid, void, already in a batch
    // ============================================================================
    const { data: commissions, error: commErr } = await supabase
      .from('affiliate_commissions')
      .select(`
        id,
        affiliate_id,
        order_id,
        commission_amount,
        status,
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
      .in('status', ['pending', 'payable'])
      .is('payout_batch_id', null)
      .order('affiliate_id')
      .order('payable_at', { ascending: true });

    if (commErr) {
      console.error('[payouts/candidates] query error', commErr.message);
      return NextResponse.json({ error: 'Failed to load candidates' }, { status: 500 });
    }

    const now = new Date();
    
    // Apply canonical eligibility rule
    const rows = ((commissions || []) as any[]).filter(r => {
      if (r.status === 'payable') return true;
      if (r.status === 'pending' && r.payable_at && new Date(r.payable_at) <= now) return true;
      return false;
    });

    // ============================================================================
    // COMMISSION ADJUSTMENTS:
    // Include unpaid adjustments in candidate totals (can be negative for clawbacks)
    // ============================================================================
    const { data: adjustmentsData, error: adjErr } = await supabase
      .from('commission_adjustments')
      .select(`
        id,
        affiliate_id,
        amount,
        reason,
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
      .is('payout_batch_id', null)
      .is('paid_at', null);

    if (adjErr) {
      console.error('[payouts/candidates] adjustments query error', adjErr.message);
    }

    const adjustments = (adjustmentsData || []) as any[];

    // Group by affiliate
    const affiliateMap = new Map<string, {
      affiliate: any;
      commissions: any[];
      adjustments: any[];
      commission_total: number;
      adjustment_total: number;
    }>();

    for (const c of rows) {
      const affId = c.affiliate_id;
      if (!affiliateMap.has(affId)) {
        affiliateMap.set(affId, {
          affiliate: c.affiliates,
          commissions: [],
          adjustments: [],
          commission_total: 0,
          adjustment_total: 0,
        });
      }
      const entry = affiliateMap.get(affId)!;
      entry.commissions.push({
        id: c.id,
        order_id: c.order_id,
        commission_amount: Number(c.commission_amount || 0),
        payable_at: c.payable_at,
      });
      entry.commission_total += Number(c.commission_amount || 0);
    }

    // Add adjustments to affiliate map
    for (const adj of adjustments) {
      const affId = adj.affiliate_id;
      if (!affiliateMap.has(affId)) {
        affiliateMap.set(affId, {
          affiliate: adj.affiliates,
          commissions: [],
          adjustments: [],
          commission_total: 0,
          adjustment_total: 0,
        });
      }
      const entry = affiliateMap.get(affId)!;
      entry.adjustments.push({
        id: adj.id,
        amount: Number(adj.amount || 0),
        reason: adj.reason,
        created_at: adj.created_at,
      });
      entry.adjustment_total += Number(adj.amount || 0);
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
      commission_total: data.commission_total,
      adjustment_count: data.adjustments.length,
      adjustment_total: data.adjustment_total,
      net_payable: data.commission_total + data.adjustment_total,
      commissions: data.commissions,
      adjustments: data.adjustments,
    }));

    // Sort by net payable descending
    candidates.sort((a, b) => b.net_payable - a.net_payable);

    // Calculate totals
    const totalCommissionAmount = candidates.reduce((s, c) => s + c.commission_total, 0);
    const totalAdjustmentAmount = candidates.reduce((s, c) => s + c.adjustment_total, 0);
    const totalNetPayable = totalCommissionAmount + totalAdjustmentAmount;

    return NextResponse.json({
      ok: true,
      candidates,
      totals: {
        total_commissions: rows.length,
        total_commission_amount: totalCommissionAmount,
        total_adjustments: adjustments.length,
        total_adjustment_amount: totalAdjustmentAmount,
        net_payable: totalNetPayable,
        total_affiliates: candidates.length,
      },
    });
  } catch (e: any) {
    console.error('[payouts/candidates] exception', e);
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
