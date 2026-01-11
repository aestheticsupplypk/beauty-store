import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabaseService';

// GET /api/admin/affiliate/tiers - List all tiers
export async function GET() {
  try {
    const supabase = getSupabaseServiceClient();
    
    const { data, error } = await supabase
      .from('affiliate_tiers')
      .select('*')
      .order('min_delivered_orders_30d', { ascending: true });

    if (error) {
      console.error('[tiers] fetch error', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, tiers: data || [] });
  } catch (e: any) {
    console.error('[tiers] exception', e);
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}

// POST /api/admin/affiliate/tiers - Create new tier
export async function POST(req: Request) {
  try {
    const supabase = getSupabaseServiceClient();
    const body = await req.json();

    const { name, min_delivered_orders_30d, multiplier_percent, discount_multiplier_percent, active } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Tier name is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('affiliate_tiers')
      .insert({
        name: name.trim(),
        min_delivered_orders_30d: min_delivered_orders_30d || 0,
        multiplier_percent: multiplier_percent || 100,
        discount_multiplier_percent: discount_multiplier_percent || 100,
        active: active !== false,
      })
      .select()
      .single();

    if (error) {
      console.error('[tiers] insert error', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, tier: data });
  } catch (e: any) {
    console.error('[tiers] exception', e);
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}

// PUT /api/admin/affiliate/tiers - Update tier
export async function PUT(req: Request) {
  try {
    const supabase = getSupabaseServiceClient();
    const body = await req.json();

    const { id, name, min_delivered_orders_30d, multiplier_percent, discount_multiplier_percent, active } = body;

    if (!id) {
      return NextResponse.json({ error: 'Tier ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('affiliate_tiers')
      .update({
        name,
        min_delivered_orders_30d,
        multiplier_percent,
        discount_multiplier_percent,
        active,
      })
      .eq('id', id);

    if (error) {
      console.error('[tiers] update error', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[tiers] exception', e);
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}

// DELETE /api/admin/affiliate/tiers - Delete tier
export async function DELETE(req: Request) {
  try {
    const supabase = getSupabaseServiceClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Tier ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('affiliate_tiers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[tiers] delete error', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[tiers] exception', e);
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
