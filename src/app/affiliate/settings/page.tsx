'use client';

import React, { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import Link from 'next/link';

type AffiliateProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string | null;
  whatsapp_number: string | null;
  alternate_phone: string | null;
  payout_method: 'easypaisa' | 'bank_transfer' | null;
  easypaisa_number: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_iban: string | null;
};

export default function AffiliateSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState<AffiliateProfile | null>(null);

  // Form state
  const [phone, setPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'easypaisa' | 'bank_transfer' | ''>('');
  const [easypaisaNumber, setEasypaisaNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIban, setBankIban] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      const { data: { user } } = await supabaseBrowser.auth.getUser();
      
      if (!user?.email) {
        setError('Please log in to access settings');
        setLoading(false);
        return;
      }

      const { data, error: fetchErr } = await supabaseBrowser
        .from('affiliates')
        .select('id, name, email, phone, city, address, whatsapp_number, alternate_phone, payout_method, easypaisa_number, bank_name, bank_account_name, bank_account_number, bank_iban')
        .ilike('email', user.email)
        .maybeSingle();

      if (fetchErr || !data) {
        setError('Could not load profile');
        setLoading(false);
        return;
      }

      const p = data as AffiliateProfile;
      setProfile(p);
      
      // Populate form
      setPhone(p.phone || '');
      setWhatsappNumber(p.whatsapp_number || '');
      setAlternatePhone(p.alternate_phone || '');
      setCity(p.city || '');
      setAddress(p.address || '');
      setPayoutMethod(p.payout_method || '');
      setEasypaisaNumber(p.easypaisa_number || '');
      setBankName(p.bank_name || '');
      setBankAccountName(p.bank_account_name || '');
      setBankAccountNumber(p.bank_account_number || '');
      setBankIban(p.bank_iban || '');
    } catch (e: any) {
      setError(e?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const res = await fetch('/api/affiliate/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          whatsapp_number: whatsappNumber,
          alternate_phone: alternatePhone,
          city,
          address,
          payout_method: payoutMethod || null,
          easypaisa_number: easypaisaNumber,
          bank_name: bankName,
          bank_account_name: bankAccountName,
          bank_account_number: bankAccountNumber,
          bank_iban: bankIban,
        }),
      });

      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to save');
      }

      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-red-600">{error || 'Profile not found'}</p>
        <Link href="/affiliate/dashboard" className="text-emerald-600 hover:underline text-sm mt-4 inline-block">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/affiliate/dashboard" className="text-emerald-600 hover:text-emerald-700 text-sm">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-semibold mt-2">Account Settings</h1>
          <p className="text-sm text-gray-600 mt-1">Update your contact info and payout details</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Contact Information */}
        <div className="border rounded-lg p-4 bg-white space-y-4">
          <h2 className="font-medium text-gray-900">Contact Information</h2>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border rounded px-3 py-2 w-full text-sm"
                placeholder="03001234567"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                WhatsApp Number
                <span className="text-gray-400 text-xs ml-1">(if different)</span>
              </label>
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="border rounded px-3 py-2 w-full text-sm"
                placeholder="03001234567"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Alternate Phone
              <span className="text-gray-400 text-xs ml-1">(optional)</span>
            </label>
            <input
              type="tel"
              value={alternatePhone}
              onChange={(e) => setAlternatePhone(e.target.value)}
              className="border rounded px-3 py-2 w-full sm:w-1/2 text-sm"
              placeholder="03001234567"
            />
          </div>
        </div>

        {/* Address */}
        <div className="border rounded-lg p-4 bg-white space-y-4">
          <h2 className="font-medium text-gray-900">Address</h2>
          
          <div>
            <label className="block text-sm text-gray-700 mb-1">City *</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="border rounded px-3 py-2 w-full sm:w-1/2 text-sm"
              placeholder="Islamabad"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Full Address
              <span className="text-gray-400 text-xs ml-1">(optional, for records)</span>
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="border rounded px-3 py-2 w-full text-sm"
              rows={2}
              placeholder="House #, Street, Area, City"
            />
          </div>
        </div>

        {/* Payout Information */}
        <div className="border rounded-lg p-4 bg-white space-y-4">
          <div>
            <h2 className="font-medium text-gray-900">Payout Information</h2>
            <p className="text-xs text-gray-500 mt-1">
              Choose how you'd like to receive your commission payouts
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Payout Method</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="payout_method"
                  value="easypaisa"
                  checked={payoutMethod === 'easypaisa'}
                  onChange={(e) => setPayoutMethod(e.target.value as 'easypaisa')}
                  className="text-emerald-600"
                />
                <span className="text-sm">EasyPaisa / JazzCash</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="payout_method"
                  value="bank_transfer"
                  checked={payoutMethod === 'bank_transfer'}
                  onChange={(e) => setPayoutMethod(e.target.value as 'bank_transfer')}
                  className="text-emerald-600"
                />
                <span className="text-sm">Bank Transfer</span>
              </label>
            </div>
          </div>

          {/* EasyPaisa Fields */}
          {payoutMethod === 'easypaisa' && (
            <div className="bg-gray-50 rounded p-3 space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">EasyPaisa / JazzCash Number *</label>
                <input
                  type="tel"
                  value={easypaisaNumber}
                  onChange={(e) => setEasypaisaNumber(e.target.value)}
                  className="border rounded px-3 py-2 w-full sm:w-1/2 text-sm"
                  placeholder="03001234567"
                  required={payoutMethod === 'easypaisa'}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the mobile number registered with EasyPaisa or JazzCash
                </p>
              </div>
            </div>
          )}

          {/* Bank Transfer Fields */}
          {payoutMethod === 'bank_transfer' && (
            <div className="bg-gray-50 rounded p-3 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Bank Name *</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="border rounded px-3 py-2 w-full text-sm"
                    placeholder="HBL, UBL, Meezan, etc."
                    required={payoutMethod === 'bank_transfer'}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Account Holder Name *</label>
                  <input
                    type="text"
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value)}
                    className="border rounded px-3 py-2 w-full text-sm"
                    placeholder="As shown on bank account"
                    required={payoutMethod === 'bank_transfer'}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Account Number *</label>
                <input
                  type="text"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  className="border rounded px-3 py-2 w-full sm:w-2/3 text-sm"
                  placeholder="1234567890123"
                  required={payoutMethod === 'bank_transfer'}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  IBAN
                  <span className="text-gray-400 text-xs ml-1">(optional but recommended)</span>
                </label>
                <input
                  type="text"
                  value={bankIban}
                  onChange={(e) => setBankIban(e.target.value.toUpperCase())}
                  className="border rounded px-3 py-2 w-full text-sm font-mono"
                  placeholder="PK00XXXX0000000000000000"
                />
              </div>
            </div>
          )}

          {!payoutMethod && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded px-3 py-2">
              Please select a payout method to receive your commission payments.
            </p>
          )}
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className={`px-6 py-2.5 rounded-lg text-white font-medium ${
              saving ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link
            href="/affiliate/dashboard"
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </Link>
        </div>
      </form>

      {/* Info */}
      <div className="text-xs text-gray-500 space-y-1 pt-4 border-t">
        <p>Your payout information is kept secure and only used for commission payments.</p>
        <p>Payouts are processed monthly, usually around the 10th.</p>
      </div>
    </div>
  );
}
