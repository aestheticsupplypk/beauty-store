import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Default redirect destination (can be changed to a specific LP for better conversion)
const DEFAULT_REDIRECT = '/';
const COOKIE_NAME = 'aff_ref';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Validate affiliate code format: 4-12 alphanumeric characters
function isValidCodeFormat(code: string): boolean {
  return /^[A-Z0-9]{4,12}$/i.test(code);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = params;
  const url = new URL(request.url);
  
  // Create redirect response
  const redirectUrl = new URL(DEFAULT_REDIRECT, url.origin);
  const response = NextResponse.redirect(redirectUrl);

  // Validate code format
  if (!code || !isValidCodeFormat(code)) {
    // Invalid format - redirect without setting cookie
    return response;
  }

  const normalizedCode = code.toUpperCase();

  // Optional: Verify code exists in database
  // This is optional - you can skip this check and let checkout validate
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('id, status')
      .eq('code', normalizedCode)
      .maybeSingle();

    // Only set cookie if affiliate exists and is active
    if (affiliate && affiliate.status === 'active') {
      response.cookies.set(COOKIE_NAME, normalizedCode, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: COOKIE_MAX_AGE,
        path: '/',
      });
    }
    // If affiliate doesn't exist or isn't active, still redirect but don't set cookie
  } catch (error) {
    // On error, still redirect but don't set cookie
    console.error('Error validating affiliate code:', error);
  }

  return response;
}
