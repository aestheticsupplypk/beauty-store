'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

type Order = {
  id: string;
  order_code: string;
  date: string;
  delivery_status: string;
  order_total: number;
  commission_amount: number;
  commission_status: 'pending' | 'payable' | 'paid' | 'void';
  customer: string;
  paid_in: string | null;
};

type OrdersResponse = {
  ok: boolean;
  range: string;
  orders: Order[];
  summary: {
    total_orders: number;
    total_commission: number;
    pending_commission: number;
    payable_commission: number;
    void_commission: number;
  };
};

export default function AffiliateOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<'this_month' | 'last_month' | 'last_2_months'>('this_month');
  const [data, setData] = useState<OrdersResponse | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadOrders();
    }
  }, [range]);

  async function checkAuth() {
    const { data: { user } } = await supabaseBrowser.auth.getUser();
    if (!user) {
      setError('Please log in to view orders');
      setLoading(false);
      return;
    }
    await loadOrders();
  }

  async function loadOrders() {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch(`/api/affiliate/orders?range=${range}`);
      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to load orders');
      }
      
      setData(json as OrdersResponse);
    } catch (e: any) {
      setError(e?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-0.5 text-xs rounded bg-amber-100 text-amber-700">Pending</span>;
      case 'payable':
        return <span className="px-2 py-0.5 text-xs rounded bg-emerald-100 text-emerald-700">Payable</span>;
      case 'paid':
        return <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700">Paid</span>;
      case 'void':
        return <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-500">Void</span>;
      default:
        return <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600">{status}</span>;
    }
  }

  function getDeliveryBadge(status: string) {
    switch (status) {
      case 'delivered':
        return <span className="px-2 py-0.5 text-xs rounded bg-emerald-100 text-emerald-700">Delivered</span>;
      case 'failed':
        return <span className="px-2 py-0.5 text-xs rounded bg-red-100 text-red-700">Failed</span>;
      case 'returned':
        return <span className="px-2 py-0.5 text-xs rounded bg-orange-100 text-orange-700">Returned</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-500">Cancelled</span>;
      case 'dispatched':
      case 'in_transit':
        return <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700">In Transit</span>;
      default:
        return <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600">Pending</span>;
    }
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function getRangeLabel(r: string) {
    switch (r) {
      case 'this_month': return 'This Month';
      case 'last_month': return 'Last Month';
      case 'last_2_months': return 'Last 2 Months';
      default: return r;
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/affiliate/dashboard" className="text-emerald-600 hover:text-emerald-700 text-sm">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-semibold mt-2">Order History</h1>
          <p className="text-sm text-gray-600 mt-1">View your orders and commission status</p>
        </div>
      </div>

      {/* Range Tabs */}
      <div className="flex gap-2">
        {(['this_month', 'last_month', 'last_2_months'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
              range === r
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {getRangeLabel(r)}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-8 text-gray-500">Loading orders...</div>
      )}

      {/* Summary Stats */}
      {data && !loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="border rounded p-3 bg-white">
            <div className="text-xs text-gray-500 uppercase">Orders</div>
            <div className="text-xl font-semibold mt-1">{data.summary.total_orders}</div>
          </div>
          <div className="border rounded p-3 bg-white">
            <div className="text-xs text-amber-600 uppercase">Pending</div>
            <div className="text-xl font-semibold mt-1 text-amber-600">
              {data.summary.pending_commission.toLocaleString()} PKR
            </div>
          </div>
          <div className="border rounded p-3 bg-white">
            <div className="text-xs text-emerald-600 uppercase">Payable</div>
            <div className="text-xl font-semibold mt-1 text-emerald-600">
              {data.summary.payable_commission.toLocaleString()} PKR
            </div>
          </div>
          <div className="border rounded p-3 bg-white">
            <div className="text-xs text-gray-500 uppercase">Void</div>
            <div className="text-xl font-semibold mt-1 text-gray-400">
              {data.summary.void_commission.toLocaleString()} PKR
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      {data && !loading && (
        <div className="border rounded-lg bg-white overflow-hidden">
          {data.orders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="font-medium">No orders found for {getRangeLabel(range).toLowerCase()}</p>
              <p className="text-sm mt-1">Orders will appear here when customers use your referral code.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Order</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Delivery</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Commission</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Paid In</th>
                  </tr>
                </thead>
                <tbody>
                  {data.orders.map((order) => (
                    <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-gray-700">{order.order_code}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(order.date)}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{order.customer}</td>
                      <td className="px-4 py-3">{getDeliveryBadge(order.delivery_status)}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {order.commission_amount.toLocaleString()} PKR
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(order.commission_status)}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {order.paid_in || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Help text */}
      <div className="text-xs text-gray-500 space-y-1">
        <p><strong>Pending:</strong> Order delivered, waiting for 10-day hold period</p>
        <p><strong>Payable:</strong> Ready for next payout (usually ~10th of month)</p>
        <p><strong>Paid:</strong> Included in a completed payout</p>
        <p><strong>Void:</strong> Not payable due to return, refund, or failed delivery</p>
      </div>
    </div>
  );
}
