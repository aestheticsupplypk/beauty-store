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
      return NextResponse.json({ error: 'Only full admins can send password reset links' }, { status: 403 });
    }

    // Step 3: Parse request body
    const { targetUserId } = await req.json();

    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 });
    }

    // Step 4: Get target user's email
    const { data: targetAdmin } = await serviceClient
      .from('admin_users')
      .select('email')
      .eq('id', targetUserId)
      .single();

    if (!targetAdmin?.email) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    // Step 5: Send password reset email
    const { error: resetError } = await serviceClient.auth.resetPasswordForEmail(
      targetAdmin.email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/login`,
      }
    );

    if (resetError) {
      return NextResponse.json({ error: resetError.message }, { status: 500 });
    }

    // Step 6: Log to audit trail
    await serviceClient
      .from('admin_audit_log')
      .insert({
        actor_admin_id: user.id,
        target_user_id: targetUserId,
        action: 'admin.send_reset',
        metadata: {
          target_email: targetAdmin.email,
        },
      });

    return NextResponse.json({ success: true, email: targetAdmin.email });
  } catch (e: any) {
    console.error('Error sending password reset:', e);
    return NextResponse.json({ error: e.message || 'Failed to send password reset' }, { status: 500 });
  }
}
