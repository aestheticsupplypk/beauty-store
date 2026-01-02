import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role for admin operations (creating users)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      parlour_name,
      owner_name,
      email,
      password,
      phone,
      address,
      city,
      province_code,
    } = body;

    // Validation
    if (!parlour_name || !owner_name || !email || !password || !phone || !address || !city) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUser?.users?.some(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (emailExists) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }

    // Check if parlour name already exists
    const { data: existingParlour } = await supabaseAdmin
      .from('parlours')
      .select('id')
      .ilike('name', parlour_name)
      .maybeSingle();

    if (existingParlour) {
      return NextResponse.json({ error: 'A parlour with this name already exists' }, { status: 400 });
    }

    // Create the parlour (not approved yet)
    const { data: parlour, error: parlourError } = await supabaseAdmin
      .from('parlours')
      .insert({
        name: parlour_name,
        phone,
        email,
        address,
        city,
        province_code: province_code || null,
        active: false, // Not active until approved
        approved: false, // Pending approval
      })
      .select('id')
      .single();

    if (parlourError || !parlour) {
      console.error('Parlour creation error:', parlourError);
      return NextResponse.json({ error: 'Failed to create parlour' }, { status: 500 });
    }

    // Create the user account
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for parlour signups
      user_metadata: {
        full_name: owner_name,
        parlour_id: parlour.id,
      },
    });

    if (authError || !authData.user) {
      // Rollback: delete the parlour
      await supabaseAdmin.from('parlours').delete().eq('id', parlour.id);
      console.error('User creation error:', authError);
      return NextResponse.json({ error: authError?.message || 'Failed to create user account' }, { status: 500 });
    }

    // Wait a moment for the profile trigger to create the profile
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Update the profile to link to parlour (use upsert in case profile doesn't exist yet)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authData.user.id,
        parlour_id: parlour.id,
        email: email,
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('Profile update error:', profileError);
      // Try one more time after another delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await supabaseAdmin
        .from('profiles')
        .upsert({
          id: authData.user.id,
          parlour_id: parlour.id,
          email: email,
        }, { onConflict: 'id' });
    }

    return NextResponse.json({
      ok: true,
      message: 'Registration submitted. Awaiting approval.',
    });
  } catch (e: any) {
    console.error('Parlour signup error:', e);
    return NextResponse.json({ error: e.message || 'Registration failed' }, { status: 500 });
  }
}
