'use client';

import { useState, useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import Link from 'next/link';

export default function AffiliateResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user has a valid session (from the recovery link)
    const checkSession = async () => {
      const { data: { user } } = await supabaseBrowser.auth.getUser();
      setHasSession(!!user);
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate password
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabaseBrowser.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Password update error:', err);
      setError('Failed to update password. Please try again or request a new reset link.');
    } finally {
      setLoading(false);
    }
  };

  // Loading state while checking session
  if (hasSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // No session - link expired or invalid
  if (!hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-4 border rounded-lg p-6 shadow-sm text-center">
          <div className="text-amber-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold">Link Expired</h1>
          <p className="text-gray-600">
            This password reset link has expired or is invalid. Please request a new one.
          </p>
          <p className="text-xs text-gray-500">
            Reset links expire after a limited time for security.
          </p>
          <Link
            href="/affiliate/dashboard"
            className="block w-full bg-black text-white rounded py-2 text-center hover:bg-gray-800"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-4 border rounded-lg p-6 shadow-sm text-center">
          <div className="text-green-600 text-5xl mb-4">✓</div>
          <h1 className="text-xl font-semibold">Password Updated!</h1>
          <p className="text-gray-600">Your password has been successfully reset. Please sign in with your new password.</p>
          <Link
            href="/affiliate/dashboard"
            className="block w-full bg-black text-white rounded py-2 text-center hover:bg-gray-800"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 border rounded-lg p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Reset Password</h1>
        <p className="text-sm text-gray-600">Enter your new password below.</p>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm">New Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full border rounded px-3 py-2 pr-10"
              placeholder="At least 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm">Confirm Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full border rounded px-3 py-2"
            placeholder="Confirm your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white rounded py-2 disabled:opacity-50 hover:bg-gray-800"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          <Link href="/affiliate/dashboard" className="text-emerald-600 hover:underline">
            Back to Login
          </Link>
        </p>
      </form>
    </div>
  );
}
