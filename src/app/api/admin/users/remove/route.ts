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
      return NextResponse.json({ error: 'Only full admins can remove admin access' }, { status: 403 });
    }

    // Step 3: Parse request body
    const { targetUserId } = await req.json();

    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 });
    }

    // Step 4: Prevent self-removal
    if (targetUserId === user.id) {
      return NextResponse.json({ error: 'You cannot remove your own admin access' }, { status: 400 });
    }

    // Step 5: Check if this would leave zero full admins
    const { data: fullAdmins } = await serviceClient
      .from('admin_users')
      .select('id')
      .eq('is_admin_full', true);

    const targetAdmin = await serviceClient
      .from('admin_users')
      .select('is_admin_full, email')
      .eq('id', targetUserId)
      .single();

    if (targetAdmin.data?.is_admin_full && fullAdmins && fullAdmins.length <= 1) {
      return NextResponse.json({ 
        error: 'Cannot remove the last full admin. At least one full admin must exist.' 
      }, { status: 400 });
    }

    // Step 6: Remove from admin_users (NOT from auth.users)
    const { error: deleteError } = await serviceClient
      .from('admin_users')
      .delete()
      .eq('id', targetUserId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Step 7: Log to audit trail
    await serviceClient
      .from('admin_audit_log')
      .insert({
        actor_admin_id: user.id,
        target_user_id: targetUserId,
        action: 'admin.revoke',
        metadata: {
          target_email: targetAdmin.data?.email,
          was_full_admin: targetAdmin.data?.is_admin_full,
        },
      });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Error removing admin access:', e);
    return NextResponse.json({ error: e.message || 'Failed to remove admin access' }, { status: 500 });
  }
}
