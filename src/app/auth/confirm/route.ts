import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') || '/';

  if (token_hash && type) {
    const cookieStore = cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );
    
    // Verify the OTP token - this creates a proper server-side session
    const { data, error } = await supabase.auth.verifyOtp({
      type: type as 'recovery' | 'signup' | 'invite' | 'magiclink' | 'email_change',
      token_hash,
    });

    console.log('verifyOtp result:', { data, error });

    if (error) {
      console.error('OTP verification error:', error);
      return NextResponse.redirect(new URL('/?error=invalid_token&message=' + encodeURIComponent(error.message), requestUrl.origin));
    }

    // If it's a recovery (password reset), redirect to reset password page
    if (type === 'recovery') {
      return NextResponse.redirect(new URL('/auth/reset-password', requestUrl.origin));
    }

    // Otherwise redirect to the next URL
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  // Default redirect to home
  return NextResponse.redirect(new URL('/', requestUrl.origin));
}
