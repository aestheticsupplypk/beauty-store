'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Province = {
  code: string;
  name: string;
};

type Parlour = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  province_code: string | null;
};

export default function ParlourProfilePage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parlour, setParlour] = useState<Parlour | null>(null);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form fields
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [provinceCode, setProvinceCode] = useState('');

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/p/login');
        return;
      }

      // Get user's parlour
      const { data: profile } = await supabase
        .from('profiles')
        .select('parlour_id')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!profile?.parlour_id) {
        router.push('/p/login');
        return;
      }

      // Get parlour details
      const { data: parlourData } = await supabase
        .from('parlours')
        .select('id, name, email, phone, address, city, province_code, active')
        .eq('id', profile.parlour_id)
        .maybeSingle();

      if (!parlourData?.active) {
        router.push('/p/login');
        return;
      }

      setParlour(parlourData);
      setPhone(parlourData.phone || '');
      setAddress(parlourData.address || '');
      setCity(parlourData.city || '');
      setProvinceCode(parlourData.province_code || '');

      // Load provinces
      const { data: provincesData } = await supabase
        .from('provinces')
        .select('code, name')
        .order('name');
      setProvinces(provincesData ?? []);

      setLoading(false);
    };

    init();
  }, [supabase, router]);

  const handleSave = async () => {
    if (!parlour) return;

    setError(null);
    setSuccess(null);

    // Validation
    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }
    if (!address.trim()) {
      setError('Address is required');
      return;
    }
    if (!city.trim()) {
      setError('City is required');
      return;
    }

    setSaving(true);

    const { error: updateError } = await supabase
      .from('parlours')
      .update({
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        province_code: provinceCode || null,
      })
      .eq('id', parlour.id);

    if (updateError) {
      setError('Failed to update profile: ' + updateError.message);
    } else {
      setSuccess('Profile updated successfully');
      // Update local state
      setParlour({
        ...parlour,
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        province_code: provinceCode || null,
      });
    }

    setSaving(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/p/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Parlour Portal</h1>
            <p className="text-sm text-gray-500">{parlour?.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/p/order" className="text-sm text-gray-600 hover:text-black">
              Place Order
            </Link>
            <button
              onClick={handleSignOut}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4">
          <nav className="flex gap-6">
            <Link
              href="/p/order"
              className="py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent"
            >
              Order
            </Link>
            <Link
              href="/p/profile"
              className="py-3 text-sm font-medium text-black border-b-2 border-black"
            >
              Profile
            </Link>
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-6">Parlour Profile</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <div className="space-y-4">
            {/* Read-only fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parlour Name
              </label>
              <div className="bg-gray-100 px-3 py-2 rounded text-gray-700">
                {parlour?.name}
              </div>
              <p className="text-xs text-gray-500 mt-1">Contact admin to change parlour name</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="bg-gray-100 px-3 py-2 rounded text-gray-700">
                {parlour?.email || 'Not set'}
              </div>
              <p className="text-xs text-gray-500 mt-1">Contact admin to change email</p>
            </div>

            {/* Editable fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="03001234567"
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address"
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Province
                </label>
                <select
                  value={provinceCode}
                  onChange={(e) => setProvinceCode(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select province</option>
                  {provinces.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
