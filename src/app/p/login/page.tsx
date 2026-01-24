'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function ParlourLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!forgotEmail || !emailRegex.test(forgotEmail)) {
      setForgotError('Please enter a valid email address.');
      return;
    }

    setForgotLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, source: 'parlour' }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setForgotSuccess(true);
    } catch (err: any) {
      setForgotError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotEmail('');
    setForgotError(null);
    setForgotSuccess(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError('Login failed');
        setLoading(false);
        return;
      }

      // Check if user is assigned to a parlour
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('parlour_id')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError || !profile?.parlour_id) {
        await supabase.auth.signOut();
        setError('Your account is not authorized for the Parlour Portal. Please contact support.');
        setLoading(false);
        return;
      }

      // Check if parlour is approved and active
      const { data: parlour, error: parlourError } = await supabase
        .from('parlours')
        .select('active, approved')
        .eq('id', profile.parlour_id)
        .maybeSingle();

      if (parlourError || !parlour) {
        await supabase.auth.signOut();
        setError('Your parlour account was not found. Please contact support.');
        setLoading(false);
        return;
      }

      if (!parlour.approved) {
        await supabase.auth.signOut();
        setError('Your parlour registration is pending approval. You will receive an email once approved.');
        setLoading(false);
        return;
      }

      if (!parlour.active) {
        await supabase.auth.signOut();
        setError('Your parlour account has been deactivated. Please contact support.');
        setLoading(false);
        return;
      }

      router.push('/p/order');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">Parlour Portal</h1>
            <p className="text-gray-600 mt-2">Sign in to place wholesale orders</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border rounded px-3 py-2"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full border rounded px-3 py-2 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-blue-600 hover:underline"
                >
                  Forgot your password?
                </button>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white rounded py-2 font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Not registered yet?{' '}
            <a href="/p/signup" className="text-blue-600 hover:underline">
              Register your parlour
            </a>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Reset Password</h2>
              <button
                type="button"
                onClick={closeForgotModal}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>

            {forgotSuccess ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded text-center">
                  <div className="text-emerald-600 text-3xl mb-2">✓</div>
                  <p className="text-sm text-gray-700">
                    If an account exists for this email, we've sent a reset link.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Please check your email inbox (and spam folder).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeForgotModal}
                  className="w-full bg-black text-white rounded py-2 hover:bg-gray-800"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-sm text-gray-600">
                  Enter your email address and we'll send you a link to reset your password.
                </p>

                {forgotError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                    {forgotError}
                  </div>
                )}

                <div>
                  <label className="block text-sm mb-1">Email</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="border rounded px-3 py-2 w-full"
                    placeholder="your@email.com"
                    required
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeForgotModal}
                    className="flex-1 border border-gray-300 rounded py-2 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 bg-black text-white rounded py-2 hover:bg-gray-800 disabled:opacity-50"
                  >
                    {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
