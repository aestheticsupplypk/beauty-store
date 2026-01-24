import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000';

// Rate limit constants
const IP_LIMIT = 5;
const IP_WINDOW_MINUTES = 10;
const EMAIL_LIMIT = 3;
const EMAIL_WINDOW_MINUTES = 15;
const COOLDOWN_SECONDS = 60;

// Generic success message (never reveal if email exists)
const SUCCESS_MESSAGE = "If an account exists for this email, we've sent a reset link.";

function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  return '127.0.0.1';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email format
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const emailHash = hashEmail(email);
    const ip = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create service role client for rate limiting checks and logging
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check rate limits
    const now = new Date();
    const ipWindowStart = new Date(now.getTime() - IP_WINDOW_MINUTES * 60 * 1000);
    const emailWindowStart = new Date(now.getTime() - EMAIL_WINDOW_MINUTES * 60 * 1000);
    const cooldownStart = new Date(now.getTime() - COOLDOWN_SECONDS * 1000);

    // Check IP rate limit
    const { count: ipCount } = await supabaseAdmin
      .from('password_reset_log')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .gte('created_at', ipWindowStart.toISOString());

    if ((ipCount || 0) >= IP_LIMIT) {
      // Log throttled attempt
      await supabaseAdmin.from('password_reset_log').insert({
        ip_address: ip,
        email_hash: emailHash,
        user_agent: userAgent,
        outcome: 'throttled',
      });

      // Return same success message to prevent enumeration
      return NextResponse.json({ ok: true, message: SUCCESS_MESSAGE });
    }

    // Check email rate limit
    const { count: emailCount } = await supabaseAdmin
      .from('password_reset_log')
      .select('*', { count: 'exact', head: true })
      .eq('email_hash', emailHash)
      .gte('created_at', emailWindowStart.toISOString());

    if ((emailCount || 0) >= EMAIL_LIMIT) {
      // Log throttled attempt
      await supabaseAdmin.from('password_reset_log').insert({
        ip_address: ip,
        email_hash: emailHash,
        user_agent: userAgent,
        outcome: 'throttled',
      });

      // Return same success message to prevent enumeration
      return NextResponse.json({ ok: true, message: SUCCESS_MESSAGE });
    }

    // Check cooldown (last request for this email)
    const { data: recentRequest } = await supabaseAdmin
      .from('password_reset_log')
      .select('created_at')
      .eq('email_hash', emailHash)
      .eq('outcome', 'sent')
      .gte('created_at', cooldownStart.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentRequest) {
      // Log throttled attempt
      await supabaseAdmin.from('password_reset_log').insert({
        ip_address: ip,
        email_hash: emailHash,
        user_agent: userAgent,
        outcome: 'throttled',
      });

      // Return same success message to prevent enumeration
      return NextResponse.json({ ok: true, message: SUCCESS_MESSAGE });
    }

    // Send password reset email via Supabase Auth
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
      email.toLowerCase().trim(),
      {
        redirectTo: `${SITE_URL}/auth/confirm?next=/affiliate/reset-password`,
      }
    );

    if (resetError) {
      console.error('Password reset error:', resetError);
      // Log error but still return success message
      await supabaseAdmin.from('password_reset_log').insert({
        ip_address: ip,
        email_hash: emailHash,
        user_agent: userAgent,
        outcome: 'error',
      });
    } else {
      // Log successful send
      await supabaseAdmin.from('password_reset_log').insert({
        ip_address: ip,
        email_hash: emailHash,
        user_agent: userAgent,
        outcome: 'sent',
      });
    }

    // Always return success to prevent account enumeration
    return NextResponse.json({ ok: true, message: SUCCESS_MESSAGE });
  } catch (error) {
    console.error('Forgot password error:', error);
    // Return generic error
    return NextResponse.json(
      { ok: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
