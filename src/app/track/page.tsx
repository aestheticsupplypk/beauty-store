'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!orderId.trim() && !phone.trim()) {
      setError('Please enter your Order ID or Phone Number');
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (orderId.trim()) params.set('order_id', orderId.trim());
      if (phone.trim()) params.set('phone', phone.trim());

      const response = await fetch(`/api/orders/track?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Order not found');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Could not find order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF7F3]">
      {/* Header */}
      <header className="bg-white border-b border-rose-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-[#7A1E3A] font-bold text-lg">
            Aesthetic PK
          </Link>
          <Link href="/products" className="text-sm text-gray-600 hover:text-[#7A1E3A]">
            Products
          </Link>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-12">

        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-[#2B2B2B] mb-2">Track Your Order</h1>
          <p className="text-gray-600 text-sm mb-6">
            Enter your order ID or phone number to check your order status.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order ID
              </label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g., ORD-12345"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#7A1E3A] focus:border-transparent"
              />
            </div>

            <div className="text-center text-gray-400 text-sm">or</div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="03XX-XXXXXXX"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#7A1E3A] focus:border-transparent"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#7A1E3A] text-white font-medium py-3 rounded-lg hover:bg-[#5A1226] disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Track Order'}
            </button>
          </form>

          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Order Found!</h3>
              <div className="text-sm text-green-700 space-y-1">
                <p><strong>Order ID:</strong> {result.order_id}</p>
                <p><strong>Status:</strong> {result.status}</p>
                {result.tracking_number && (
                  <p><strong>Tracking:</strong> {result.tracking_number}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          Can&apos;t find your order? It may take up to 24 hours after placing for tracking to be available.
        </p>
      </div>
    </div>
  );
}
