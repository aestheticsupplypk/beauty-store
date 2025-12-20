import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabaseService';

// GET /api/affiliate/validate?code=ABC123
// Returns { ok: true, valid: boolean }
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const raw = String(url.searchParams.get('code') || '').trim().toUpperCase();
    if (!raw) {
      return NextResponse.json({ ok: true, valid: false });
    }
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from('affiliates')
      .select('id, active')
      .eq('code', raw)
      .maybeSingle();
    if (error) {
      console.error('[affiliate/validate] error', error.message);
      return NextResponse.json({ ok: false, valid: false }, { status: 500 });
    }
    const valid = !!data && !!(data as any).active;
    return NextResponse.json({ ok: true, valid });
  } catch (e: any) {
    console.error('[affiliate/validate] exception', e);
    return NextResponse.json({ ok: false, valid: false }, { status: 500 });
  }
}
