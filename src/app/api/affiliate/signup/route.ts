import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabaseService';

// POST /api/affiliate/signup
// Creates a new affiliate row and returns a generated referral code.
export async function POST(req: Request) {
  try {
    const supabase = getSupabaseServiceClient();
    const body = await req.json().catch(() => ({}));

    const name = String(body?.name || '').trim();
    const phone = String(body?.phone || '').trim();
    const email = String(body?.email || '').trim();
    const city = String(body?.city || '').trim();
    const parlour_name = String(body?.parlour_name || '').trim() || null;
    const how_hear = String(body?.how_hear || '').trim() || null;
    const type = String(body?.type || 'individual').trim() || 'individual';
    const password = String(body?.password || '');

    if (!name || !phone || !city || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,20}$/;
    if (!strongRegex.test(password)) {
      return NextResponse.json({ error: 'Password does not meet strength requirements' }, { status: 400 });
    }

    const makeBaseFromName = (full: string) => {
      const firstPart = full.split(/\s+/).filter(Boolean)[0] || full;
      const lettersOnly = firstPart.replace(/[^A-Za-z]/g, '').toUpperCase();
      if (!lettersOnly) return 'AFF';
      return lettersOnly.slice(0, 4).padEnd(3, 'X');
    };

    const base = makeBaseFromName(name);

    const generateUniqueCode = async () => {
      for (let i = 0; i < 10; i++) {
        const suffix = String(Math.floor(100 + Math.random() * 900));
        const code = `${base}${suffix}`.slice(0, 8).toUpperCase();
        const { data: existing, error: lookupErr } = await supabase
          .from('affiliates')
          .select('id')
          .eq('code', code)
          .maybeSingle();
        if (lookupErr) {
          console.error('[affiliate/signup] code lookup error', lookupErr.message);
          continue;
        }
        if (!existing) return code;
      }
      return `${base}${Date.now().toString().slice(-3)}`.toUpperCase();
    };

    const code = await generateUniqueCode();

    // Create Supabase auth user for this affiliate
    const { data: userRes, error: userErr } = await (supabase as any).auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (userErr) {
      console.error("Error creating auth user", userErr.message);

      // Handle case where email is already registered in Supabase auth
      const msg = String(userErr.message || "").toLowerCase();
      if (msg.includes("user already registered") || msg.includes("already exists")) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please log in instead." },
          { status: 400 }
        );
      }

      return NextResponse.json({ error: "Failed to create user" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('affiliates')
      .insert({
        type,
        name,
        parlour_name,
        phone,
        email,
        city,
        code,
        notes: how_hear,
        active: true,
      } as any)
      .select('id, code')
      .maybeSingle();

    if (error || !data) {
      console.error('[affiliate/signup] insert error', error?.message);
      return NextResponse.json({ error: 'Failed to create affiliate profile' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, code: data.code, affiliate_id: data.id });
  } catch (e: any) {
    console.error('[affiliate/signup] exception', e);
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
