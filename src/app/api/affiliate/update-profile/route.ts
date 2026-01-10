import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

// POST /api/affiliate/update-profile
// Updates affiliate profile info (phone, address, payout details)
export async function POST(req: Request) {
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
      .select('id')
      .ilike('email', email)
      .maybeSingle();

    if (affErr || !affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
    }

    const affiliateId = String((affiliate as any).id);
    const body = await req.json().catch(() => ({}));

    // Build update object with only provided fields
    const updates: Record<string, any> = {};

    // Phone numbers
    if (body.phone !== undefined) {
      updates.phone = String(body.phone || '').trim() || null;
    }
    if (body.whatsapp_number !== undefined) {
      updates.whatsapp_number = String(body.whatsapp_number || '').trim() || null;
    }
    if (body.alternate_phone !== undefined) {
      updates.alternate_phone = String(body.alternate_phone || '').trim() || null;
    }

    // Address
    if (body.address !== undefined) {
      updates.address = String(body.address || '').trim() || null;
    }
    if (body.city !== undefined) {
      updates.city = String(body.city || '').trim() || null;
    }

    // Payout method
    if (body.payout_method !== undefined) {
      const method = String(body.payout_method || '').trim();
      if (method && !['easypaisa', 'bank_transfer'].includes(method)) {
        return NextResponse.json({ error: 'Invalid payout method' }, { status: 400 });
      }
      updates.payout_method = method || null;
    }

    // EasyPaisa
    if (body.easypaisa_number !== undefined) {
      updates.easypaisa_number = String(body.easypaisa_number || '').trim() || null;
    }

    // Bank details
    if (body.bank_name !== undefined) {
      updates.bank_name = String(body.bank_name || '').trim() || null;
    }
    if (body.bank_account_name !== undefined) {
      updates.bank_account_name = String(body.bank_account_name || '').trim() || null;
    }
    if (body.bank_account_number !== undefined) {
      updates.bank_account_number = String(body.bank_account_number || '').trim() || null;
    }
    if (body.bank_iban !== undefined) {
      updates.bank_iban = String(body.bank_iban || '').trim() || null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Add timestamp
    updates.profile_updated_at = new Date().toISOString();

    const { error: updateErr } = await supabase
      .from('affiliates')
      .update(updates)
      .eq('id', affiliateId);

    if (updateErr) {
      console.error('[affiliate/update-profile] update error', updateErr.message);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[affiliate/update-profile] exception', e);
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
