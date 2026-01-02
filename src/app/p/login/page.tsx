'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function ParlourLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

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
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border rounded px-3 py-2"
                placeholder="••••••••"
              />
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
    </div>
  );
}
