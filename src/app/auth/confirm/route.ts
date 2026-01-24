import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  const next = url.searchParams.get('next') ?? '/auth/reset-password';

  if (!token_hash || !type) {
    return NextResponse.redirect(new URL('/', url.origin));
  }

  // Create the redirect response FIRST
  // For recovery, use the next param if provided, otherwise default to /auth/reset-password
  const redirectUrl = type === 'recovery' ? (next || '/auth/reset-password') : next;
  const response = NextResponse.redirect(new URL(redirectUrl, url.origin));

  // Create Supabase client that writes cookies to the RESPONSE object
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          // Write cookies to the RESPONSE, not just cookieStore
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Verify the OTP token
  const { error } = await supabase.auth.verifyOtp({
    type: type as 'recovery' | 'signup' | 'invite' | 'magiclink' | 'email_change',
    token_hash,
  });

  if (error) {
    console.error('OTP verification error:', error);
    return NextResponse.redirect(
      new URL(`/?error=invalid_token&message=${encodeURIComponent(error.message)}`, url.origin)
    );
  }

  // Return the response WITH the cookies attached
  return response;
}
