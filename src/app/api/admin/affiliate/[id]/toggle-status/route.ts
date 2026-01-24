import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

// POST /api/admin/affiliate/[id]/toggle-status
// Toggles affiliate active status with optional reason for deactivation
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServerClient();
    const affiliateId = params.id;

    // Parse body for deactivation reason/notes
    let reason: string | undefined;
    let notes: string | undefined;
    try {
      const body = await request.json();
      reason = body.reason;
      notes = body.notes;
    } catch {
      // No body provided, that's fine for activation
    }

    // Get current status
    const { data: affiliate, error: getErr } = await supabase
      .from('affiliates')
      .select('active, name')
      .eq('id', affiliateId)
      .single();

    if (getErr || !affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
    }

    // Toggle status
    const newStatus = !affiliate.active;
    const { error: updateErr } = await supabase
      .from('affiliates')
      .update({ active: newStatus })
      .eq('id', affiliateId);

    if (updateErr) {
      console.error('[toggle-status] update error', updateErr.message);
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }

    // Log the action (if deactivating with reason)
    if (!newStatus && reason) {
      // Try to insert into audit log if table exists
      try {
        await supabase.from('admin_audit_log').insert({
          action: 'affiliate_deactivated',
          entity_type: 'affiliate',
          entity_id: affiliateId,
          details: {
            affiliate_name: affiliate.name,
            reason,
            notes: notes || null,
          },
        });
      } catch {
        // Audit table may not exist yet, that's okay
        console.log('[toggle-status] audit log skipped (table may not exist)');
      }
    }

    return NextResponse.json({
      ok: true,
      active: newStatus,
    });
  } catch (e: any) {
    console.error('[toggle-status] exception', e);
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
