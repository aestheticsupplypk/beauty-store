import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') || '/';

  if (token_hash && type) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Verify the OTP token - this creates a proper server-side session
    const { error } = await supabase.auth.verifyOtp({
      type: type as 'recovery' | 'signup' | 'invite' | 'magiclink' | 'email_change',
      token_hash,
    });

    if (error) {
      console.error('OTP verification error:', error);
      return NextResponse.redirect(new URL('/?error=invalid_token', requestUrl.origin));
    }

    // If it's a recovery (password reset), redirect to reset password page
    if (type === 'recovery') {
      return NextResponse.redirect(new URL('/auth/reset-password', requestUrl.origin));
    }

    // Otherwise redirect to the next URL
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  // Handle legacy code-based flow (PKCE)
  const code = requestUrl.searchParams.get('code');
  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    await supabase.auth.exchangeCodeForSession(code);
    
    if (type === 'recovery') {
      return NextResponse.redirect(new URL('/auth/reset-password', requestUrl.origin));
    }
  }

  // Default redirect to home
  return NextResponse.redirect(new URL('/', requestUrl.origin));
}
