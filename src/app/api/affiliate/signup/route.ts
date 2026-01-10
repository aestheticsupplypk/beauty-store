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

    // Simple validation: minimum 6 characters
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Check if email already exists in affiliates table
    const { data: existingAffiliate } = await supabase
      .from('affiliates')
      .select('id, code')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existingAffiliate) {
      return NextResponse.json(
        { error: 'An affiliate account with this email already exists. Please log in instead.' },
        { status: 400 }
      );
    }

    // Check if user exists in Auth but not in affiliates (orphaned auth user)
    const { data: authUsers } = await (supabase as any).auth.admin.listUsers();
    const existingAuthUser = authUsers?.users?.find(
      (u: any) => u.email?.toLowerCase() === email.toLowerCase()
    );

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

    // If user exists in Auth but not in affiliates, reuse that auth user
    let authUserId: string | null = null;
    
    if (existingAuthUser) {
      // User exists in Auth but not in affiliates - update their password and reuse
      authUserId = existingAuthUser.id;
      console.log(`Reusing existing auth user ${authUserId} for affiliate signup`);
      
      // Update the password for the existing auth user
      const { error: updateErr } = await (supabase as any).auth.admin.updateUserById(authUserId, {
        password,
      });
      if (updateErr) {
        console.error("Error updating auth user password", updateErr.message);
      }
    } else {
      // Create new Supabase auth user for this affiliate
      const { data: userRes, error: userErr } = await (supabase as any).auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      
      if (userErr) {
        console.error("Error creating auth user", userErr.message);

        const msg = String(userErr.message || "").toLowerCase();
        
        // Handle case where email is already registered in Supabase auth
        if (msg.includes("user already registered") || msg.includes("already exists")) {
          return NextResponse.json(
            { error: "An account with this email already exists. Please log in instead." },
            { status: 400 }
          );
        }

        // Handle invalid email format
        if (msg.includes("invalid") && msg.includes("email")) {
          return NextResponse.json(
            { error: "Please enter a valid email address." },
            { status: 400 }
          );
        }

        // Handle weak password
        if (msg.includes("password")) {
          return NextResponse.json(
            { error: "Password is too weak. Please use at least 6 characters." },
            { status: 400 }
          );
        }

        // Handle rate limiting
        if (msg.includes("rate") || msg.includes("limit") || msg.includes("too many")) {
          return NextResponse.json(
            { error: "Too many signup attempts. Please wait a few minutes and try again." },
            { status: 429 }
          );
        }

        // Generic error with more context
        return NextResponse.json(
          { error: `Unable to create account: ${userErr.message || "Please check your details and try again."}` },
          { status: 400 }
        );
      }
      
      authUserId = userRes?.user?.id;
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
        active: false, // Requires admin approval
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
