import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

// POST /api/admin/affiliate/payouts/batches/[id]/mark-paid
// Marks a batch as paid and updates all included commissions
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServerClient();
    const batchId = params.id;

    // Get batch info
    const { data: batch, error: batchErr } = await supabase
      .from('affiliate_payout_batches')
      .select('id, status')
      .eq('id', batchId)
      .single();

    if (batchErr || !batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    const currentStatus = (batch as any).status;

    // Check if already paid
    if (currentStatus === 'completed' || currentStatus === 'paid') {
      return NextResponse.json({ error: 'Batch is already marked as paid' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Step 1: Update all commissions in this batch to 'paid'
    const { error: commUpdateErr } = await supabase
      .from('affiliate_commissions')
      .update({ 
        status: 'paid',
        paid_at: now,
      })
      .eq('payout_batch_id', batchId);

    if (commUpdateErr) {
      console.error('[mark-paid] commission update error', commUpdateErr.message);
      return NextResponse.json({ error: 'Failed to update commissions' }, { status: 500 });
    }

    // Step 2: Update batch status to 'completed' (or 'paid')
    const { error: batchUpdateErr } = await supabase
      .from('affiliate_payout_batches')
      .update({ 
        status: 'completed',
        processed_at: now,
      })
      .eq('id', batchId);

    if (batchUpdateErr) {
      console.error('[mark-paid] batch update error', batchUpdateErr.message);
      return NextResponse.json({ error: 'Failed to update batch status' }, { status: 500 });
    }

    // Get updated batch info
    const { data: updatedBatch } = await supabase
      .from('affiliate_payout_batches')
      .select('*')
      .eq('id', batchId)
      .single();

    return NextResponse.json({
      ok: true,
      message: 'Batch marked as paid successfully',
      batch: updatedBatch ? {
        id: (updatedBatch as any).id,
        batch_date: (updatedBatch as any).batch_date,
        total_commissions: Number((updatedBatch as any).total_commissions || 0),
        total_affiliates: (updatedBatch as any).total_affiliates,
        status: (updatedBatch as any).status,
        processed_at: (updatedBatch as any).processed_at,
      } : null,
    });
  } catch (e: any) {
    console.error('[mark-paid] exception', e);
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
