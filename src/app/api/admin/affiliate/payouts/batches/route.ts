import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

// GET /api/admin/affiliate/payouts/batches
// Returns list of all batches
export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    const { data: batches, error } = await supabase
      .from('affiliate_payout_batches')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[payouts/batches] query error', error.message);
      return NextResponse.json({ error: 'Failed to load batches' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      batches: (batches || []).map((b: any) => ({
        id: b.id,
        batch_date: b.batch_date,
        period_start: b.period_start,
        period_end: b.period_end,
        total_commissions: Number(b.total_commissions || 0),
        total_affiliates: b.total_affiliates,
        status: b.status,
        created_at: b.created_at,
        processed_at: b.processed_at,
        notes: b.notes,
      })),
    });
  } catch (e: any) {
    console.error('[payouts/batches] exception', e);
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}

// POST /api/admin/affiliate/payouts/batches
// Creates a new payout batch and assigns all payable commissions to it
export async function POST(req: Request) {
  try {
    const supabase = getSupabaseServerClient();
    const body = await req.json().catch(() => ({}));

    const notes = String(body?.notes || '').trim() || null;
    const batchDate = body?.batch_date ? new Date(body.batch_date) : new Date();

    // Start transaction by getting payable commissions with lock
    // Note: Supabase doesn't support FOR UPDATE directly, so we use a two-step approach
    
    // Step 1: Get all payable commissions not yet in a batch
    const { data: payableCommissions, error: fetchErr } = await supabase
      .from('affiliate_commissions')
      .select('id, affiliate_id, commission_amount, payable_at')
      .eq('status', 'payable')
      .is('payout_batch_id', null);

    if (fetchErr) {
      console.error('[payouts/batches] fetch error', fetchErr.message);
      return NextResponse.json({ error: 'Failed to fetch payable commissions' }, { status: 500 });
    }

    const commissions = (payableCommissions || []) as any[];

    if (commissions.length === 0) {
      return NextResponse.json({ error: 'No payable commissions found' }, { status: 400 });
    }

    // Calculate totals
    const totalAmount = commissions.reduce((s, c) => s + Number(c.commission_amount || 0), 0);
    const uniqueAffiliates = new Set(commissions.map(c => c.affiliate_id));
    const totalAffiliates = uniqueAffiliates.size;

    // Calculate period (earliest to latest payable_at)
    const payableDates = commissions.map(c => new Date(c.payable_at)).filter(d => !isNaN(d.getTime()));
    const periodStart = payableDates.length > 0 
      ? new Date(Math.min(...payableDates.map(d => d.getTime())))
      : new Date();
    const periodEnd = payableDates.length > 0 
      ? new Date(Math.max(...payableDates.map(d => d.getTime())))
      : new Date();

    // Step 2: Create the batch
    const { data: batch, error: batchErr } = await supabase
      .from('affiliate_payout_batches')
      .insert({
        batch_date: batchDate.toISOString().split('T')[0],
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        total_commissions: totalAmount,
        total_affiliates: totalAffiliates,
        status: 'pending',
        notes,
      })
      .select()
      .single();

    if (batchErr || !batch) {
      console.error('[payouts/batches] insert error', batchErr?.message);
      return NextResponse.json({ error: 'Failed to create batch' }, { status: 500 });
    }

    const batchId = (batch as any).id;

    // Step 3: Assign all payable commissions to this batch
    const commissionIds = commissions.map(c => c.id);
    
    const { error: updateErr } = await supabase
      .from('affiliate_commissions')
      .update({ payout_batch_id: batchId })
      .in('id', commissionIds)
      .eq('status', 'payable')
      .is('payout_batch_id', null); // Safety check

    if (updateErr) {
      console.error('[payouts/batches] update error', updateErr.message);
      // Try to clean up the batch
      await supabase.from('affiliate_payout_batches').delete().eq('id', batchId);
      return NextResponse.json({ error: 'Failed to assign commissions to batch' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      batch: {
        id: batchId,
        batch_date: (batch as any).batch_date,
        period_start: (batch as any).period_start,
        period_end: (batch as any).period_end,
        total_commissions: totalAmount,
        total_affiliates: totalAffiliates,
        commission_count: commissions.length,
        status: 'pending',
      },
    });
  } catch (e: any) {
    console.error('[payouts/batches] exception', e);
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
