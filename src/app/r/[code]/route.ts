import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// CONFIGURATION
// ============================================================================
// Default redirect destination - change this to a specific LP for better conversion
// e.g., '/lp/afal-tag' when you have a hero product
const DEFAULT_AFFILIATE_REDIRECT_PATH = '/';

const COOKIE_NAME = 'aff_ref';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// ============================================================================
// HELPERS
// ============================================================================

// Validate affiliate code format: 4-12 alphanumeric characters
function isValidCodeFormat(code: string): boolean {
  return /^[A-Z0-9]{4,12}$/i.test(code);
}

// ============================================================================
// ROUTE HANDLER
// ============================================================================
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = params;
  const url = new URL(request.url);
  
  // SECURITY: Only allow internal redirects - no open redirect vulnerability
  // We only redirect to DEFAULT_AFFILIATE_REDIRECT_PATH, never to user-supplied URLs
  const redirectUrl = new URL(DEFAULT_AFFILIATE_REDIRECT_PATH, url.origin);
  const response = NextResponse.redirect(redirectUrl);

  // Validate code format
  if (!code || !isValidCodeFormat(code)) {
    // Invalid format - redirect without setting cookie
    return response;
  }

  const normalizedCode = code.toUpperCase();

  // FIRST-TOUCH POLICY: Don't overwrite existing attribution
  // If user already has an aff_ref cookie, keep the original (first-touch wins)
  const existingCookie = request.cookies.get(COOKIE_NAME)?.value;
  if (existingCookie && isValidCodeFormat(existingCookie)) {
    // User already has valid attribution - don't overwrite, just redirect
    return response;
  }

  // Verify affiliate exists and is active before setting cookie
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
