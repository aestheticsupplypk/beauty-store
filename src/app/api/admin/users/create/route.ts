import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { getSupabaseServiceRoleClient } from '@/lib/supabaseServiceRole';

export async function POST(req: Request) {
  try {
    // Step 1: Verify session using normal client
    const supabase = getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Step 2: Verify user is a full admin
    const serviceClient = getSupabaseServiceRoleClient();
    const { data: adminUser } = await serviceClient
      .from('admin_users')
      .select('is_admin_full')
      .eq('id', user.id)
      .single();

    if (!adminUser?.is_admin_full) {
      return NextResponse.json({ error: 'Only full admins can create users' }, { status: 403 });
    }

    // Step 3: Parse request body
    const { email, password, template, permissions } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Step 4: Determine permissions based on template
    let finalPermissions = {
      is_admin_full: false,
      can_admin_dashboard: false,
      can_admin_orders: false,
      can_admin_inventory: false,
      can_admin_products: false,
      can_admin_reviews: false,
      can_admin_shipping: false,
      can_admin_affiliates: false,
      can_admin_parlours: false,
    };

    if (template === 'full_admin') {
      finalPermissions = {
        is_admin_full: true,
        can_admin_dashboard: true,
        can_admin_orders: true,
        can_admin_inventory: true,
        can_admin_products: true,
        can_admin_reviews: true,
        can_admin_shipping: true,
        can_admin_affiliates: true,
        can_admin_parlours: true,
      };
    } else if (template === 'delivery') {
      finalPermissions = {
        ...finalPermissions,
        can_admin_dashboard: true,
        can_admin_orders: true,
      };
    } else if (template === 'custom' && permissions) {
      finalPermissions = {
        is_admin_full: Boolean(permissions.is_admin_full),
        can_admin_dashboard: Boolean(permissions.can_admin_dashboard),
        can_admin_orders: Boolean(permissions.can_admin_orders),
        can_admin_inventory: Boolean(permissions.can_admin_inventory),
        can_admin_products: Boolean(permissions.can_admin_products),
        can_admin_reviews: Boolean(permissions.can_admin_reviews),
        can_admin_shipping: Boolean(permissions.can_admin_shipping),
        can_admin_affiliates: Boolean(permissions.can_admin_affiliates),
        can_admin_parlours: Boolean(permissions.can_admin_parlours),
      };
    }

    // Step 5: Check if user already exists in auth.users
    const { data: existingUsers } = await serviceClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    let newUserId: string;

    if (existingUser) {
      // User exists in auth - just add to admin_users
      newUserId = existingUser.id;
      
      // Check if already an admin
      const { data: existingAdmin } = await serviceClient
        .from('admin_users')
        .select('id')
        .eq('id', existingUser.id)
        .single();

      if (existingAdmin) {
        return NextResponse.json({ error: 'User is already an admin' }, { status: 400 });
      }
    } else {
      // Create new user in auth.users
      const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (createError || !newUser.user) {
        return NextResponse.json({ error: createError?.message || 'Failed to create user' }, { status: 500 });
      }

      newUserId = newUser.user.id;
    }

    // Step 6: Add to admin_users table
    const { error: insertError } = await serviceClient
      .from('admin_users')
      .insert({
        id: newUserId,
        email: email.toLowerCase(),
        ...finalPermissions,
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Step 7: Log to audit trail
    await serviceClient
      .from('admin_audit_log')
      .insert({
        actor_admin_id: user.id,
        target_user_id: newUserId,
        action: 'admin.create',
        metadata: {
          target_email: email,
          template,
          permissions: finalPermissions,
        },
      });

    return NextResponse.json({ success: true, userId: newUserId });
  } catch (e: any) {
    console.error('Error creating admin user:', e);
    return NextResponse.json({ error: e.message || 'Failed to create user' }, { status: 500 });
  }
}
