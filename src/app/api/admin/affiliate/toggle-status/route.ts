import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseServerClient();
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, is_admin_full')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.is_admin && !profile?.is_admin_full) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await req.json();
    const { affiliateId, active } = body;

    if (!affiliateId) {
      return NextResponse.json({ error: 'Missing affiliateId' }, { status: 400 });
    }

    const { error } = await supabase
      .from('affiliates')
      .update({ active: Boolean(active) })
      .eq('id', affiliateId);

    if (error) {
      console.error('[admin/affiliate/toggle-status] error', error.message);
      return NextResponse.json({ error: 'Failed to update affiliate status' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, active: Boolean(active) });
  } catch (e: any) {
    console.error('[admin/affiliate/toggle-status] exception', e);
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
