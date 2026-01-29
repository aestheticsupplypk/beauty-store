'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import MobileNav from '@/components/affiliate/MobileNav';

type Order = {
  id: string;
  order_code: string;
  date: string;
  order_status: string;
  delivery_status: string;
  order_total: number;
  commission_amount: number;
  commission_status: 'pending' | 'payable' | 'paid' | 'void';
  payable_at: string | null;
  void_reason: string | null;
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
    paid_commission: number;
    void_commission: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};

export default function AffiliateOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<'this_month' | 'last_month' | 'last_2_months' | 'all_time'>('this_month');
  const [data, setData] = useState<OrdersResponse | null>(null);
  const [page, setPage] = useState(1);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await supabaseBrowser.auth.signOut();
    window.location.href = '/affiliate/dashboard';
  }

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    setPage(1);
    setAllOrders([]);
    loadOrders(1, true);
  }, [range]);

  async function checkAuth() {
    const { data: { user } } = await supabaseBrowser.auth.getUser();
    if (!user) {
      setError('Please log in to view orders');
      setLoading(false);
      return;
    }
    await loadOrders(1, true);
  }

  async function loadOrders(pageNum: number, reset: boolean = false) {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      
      const res = await fetch(`/api/affiliate/orders?range=${range}&page=${pageNum}&limit=20`);
      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to load orders');
      }
      
      const response = json as OrdersResponse;
      setData(response);
      
      if (reset) {
        setAllOrders(response.orders);
      } else {
        setAllOrders(prev => [...prev, ...response.orders]);
      }
      setPage(pageNum);
    } catch (e: any) {
      setError(e?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  function loadMore() {
    if (data?.pagination.hasMore && !loadingMore) {
      loadOrders(page + 1, false);
    }
  }

  function getStatusBadge(status: string, voidReason?: string | null) {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-0.5 text-xs rounded bg-amber-100 text-amber-700">Pending</span>;
      case 'payable':
        return <span className="px-2 py-0.5 text-xs rounded bg-emerald-100 text-emerald-700">Payable</span>;
      case 'paid':
        return <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700">Paid</span>;
      case 'void':
        // Neutral gray for void (per senior feedback - less attention than order cancelled)
        const reason = voidReason === 'cancelled' ? 'Cancelled'
          : voidReason === 'returned' ? 'Returned'
          : voidReason === 'failed_delivery' ? 'Failed'
          : 'Void';
        return <span className="px-2 py-0.5 text-xs rounded bg-gray-200 text-gray-600">{reason}</span>;
      default:
        return <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600">{status}</span>;
    }
  }

  function getOrderStatusBadge(status: string) {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return <span className="px-2 py-0.5 text-xs rounded bg-emerald-100 text-emerald-700">Delivered</span>;
      case 'shipped':
        return <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700">Shipped</span>;
      case 'packed':
        return <span className="px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-700">Packed</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 text-xs rounded bg-red-100 text-red-600">Cancelled</span>;
      case 'pending':
      default:
        return <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600">Pending</span>;
    }
  }

  function formatPayableDate(dateStr: string | null) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
      case 'all_time': return 'All Time';
      default: return r;
    }
  }

  function formatAmount(amount: number) {
    // Only abbreviate for amounts >= 10,000 to avoid confusion
    if (amount >= 10000) {
      return `${(amount / 1000).toFixed(1)}k PKR`;
    }
    return `${amount.toLocaleString()} PKR`;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Mobile Navigation */}
      <MobileNav />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/affiliate/dashboard" className="text-emerald-600 hover:text-emerald-700 text-sm">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-semibold mt-2">Order History</h1>
          <p className="text-sm text-gray-600 mt-1">View your orders and commission status</p>
        </div>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="hidden md:block text-sm text-gray-500 hover:text-red-600 disabled:opacity-50"
        >
          {signingOut ? 'Signing out...' : '🚪 Sign Out'}
        </button>
      </div>

      {/* Range Tabs */}
      <div className="flex gap-2">
        {(['this_month', 'last_month', 'last_2_months', 'all_time'] as const).map((r) => (
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

      {/* Next Payout Info */}
      <div className="rounded-md border border-blue-200 bg-blue-50/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-blue-500">📅</span>
          <span className="text-sm text-blue-800">Next payout: <strong>~10th of next month</strong></span>
        </div>
        {data && (
          <span className="text-sm text-blue-700">Payable: <strong>{data.summary.payable_commission.toLocaleString()} PKR</strong></span>
        )}
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

      {/* Summary Stats - compact row with 4 items */}
      {data && !loading && (
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          <div className="border rounded p-2 sm:p-3 bg-white">
            <div className="text-[10px] sm:text-xs text-gray-500 uppercase">Orders</div>
            <div className="text-lg sm:text-xl font-semibold mt-0.5">{data.summary.total_orders}</div>
          </div>
          <div className="border rounded p-2 sm:p-3 bg-white">
            <div className="text-[10px] sm:text-xs text-amber-600 uppercase">Pending</div>
            <div className="text-lg sm:text-xl font-semibold mt-0.5 text-amber-600">
              {formatAmount(data.summary.pending_commission)}
            </div>
          </div>
          <div className="border rounded p-2 sm:p-3 bg-white">
            <div className="text-[10px] sm:text-xs text-emerald-600 uppercase">Payable</div>
            <div className="text-lg sm:text-xl font-semibold mt-0.5 text-emerald-600">
              {formatAmount(data.summary.payable_commission)}
            </div>
          </div>
          <div className="border rounded p-2 sm:p-3 bg-white">
            <div className="text-[10px] sm:text-xs text-blue-600 uppercase">Paid</div>
            <div className="text-lg sm:text-xl font-semibold mt-0.5 text-blue-600">
              {formatAmount(data.summary.paid_commission)}
            </div>
          </div>
        </div>
      )}

      {/* Status Legend - visible 1-line summary */}
      <div className="text-sm text-gray-600 bg-gray-50 rounded px-3 py-2 border">
        💡 <strong>Pending</strong> = delivered but within return window • <strong>Payable</strong> = cleared for payout • <strong>Paid</strong> = included in payout
      </div>

      {/* Orders Table - mobile-friendly with expandable rows */}
      {data && !loading && (
        <div className="border rounded-lg bg-white overflow-hidden">
          {/* Always show table headers */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Order Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Order ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Order Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Order Total</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Commission</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Commission Status</th>
                </tr>
              </thead>
              {allOrders.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      <p className="font-medium">No orders found for {getRangeLabel(range).toLowerCase()}</p>
                      <p className="text-sm mt-1">Orders will appear here when customers use your referral code.</p>
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody>
                  {allOrders.map((order) => (
                    <React.Fragment key={order.id}>
                      <tr 
                        className="border-b hover:bg-gray-50 cursor-pointer"
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      >
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(order.date)}</td>
                        <td className="px-4 py-3 font-mono text-gray-700">{order.order_code}</td>
                        <td className="px-4 py-3 text-gray-700">{order.customer}</td>
                        <td className="px-4 py-3">{getOrderStatusBadge(order.order_status || order.delivery_status)}</td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {order.order_total.toLocaleString()} PKR
                        </td>
                        <td className={`px-4 py-3 text-right font-medium ${order.commission_status === 'void' ? 'text-gray-400 line-through' : ''}`}>
                          {order.commission_amount.toLocaleString()} PKR
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(order.commission_status, order.void_reason)}</td>
                      </tr>
                      {expandedOrder === order.id && (
                        <tr className="bg-gray-50 border-b">
                          <td colSpan={7} className="px-4 py-2 text-xs text-gray-600 space-x-4">
                            {order.commission_status === 'pending' && (
                              <span>
                                <span className="font-medium text-amber-600">Payable:</span>{' '}
                                {order.payable_at ? (
                                  new Date(order.payable_at) <= new Date() 
                                    ? <span className="text-emerald-600 font-medium">Ready for payout</span>
                                    : formatPayableDate(order.payable_at)
                                ) : (
                                  <span className="text-gray-500">After delivery</span>
                                )}
                              </span>
                            )}
                            {order.paid_in && <span><span className="font-medium">Paid in:</span> {order.paid_in}</span>}
                            {order.commission_status === 'void' && order.void_reason && (
                              <span><span className="font-medium text-red-600">Reason:</span> {order.void_reason === 'cancelled' ? 'Order cancelled' : order.void_reason === 'returned' ? 'Order returned' : order.void_reason === 'failed_delivery' ? 'Delivery failed' : order.void_reason}</span>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              )}
            </table>
          </div>

          {/* Mobile view */}
          <div className="sm:hidden">
            {allOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="font-medium">No orders found for {getRangeLabel(range).toLowerCase()}</p>
                <p className="text-sm mt-1">Orders will appear here when customers use your referral code.</p>
              </div>
            ) : (
            <div className="divide-y">
                {allOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className="p-3 hover:bg-gray-50"
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-sm text-gray-700">{order.order_code}</span>
                        <span className="text-xs text-gray-400 ml-2">{formatDate(order.date)}</span>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium text-sm ${order.commission_status === 'void' ? 'text-gray-400 line-through' : ''}`}>
                          {order.commission_amount.toLocaleString()} PKR
                        </div>
                        {getStatusBadge(order.commission_status, order.void_reason)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {getOrderStatusBadge(order.order_status || order.delivery_status)}
                      {order.commission_status === 'pending' && (
                        <span className="text-xs text-amber-600">
                          {order.payable_at ? (
                            new Date(order.payable_at) <= new Date() 
                              ? 'Ready for payout'
                              : `Payable ${formatPayableDate(order.payable_at)}`
                          ) : (
                            'After delivery'
                          )}
                        </span>
                      )}
                    </div>
                    {expandedOrder === order.id && (
                      <div className="mt-2 pt-2 border-t text-xs text-gray-500 space-y-1">
                        <p>{order.customer}</p>
                        {order.paid_in && <p>Paid in: {order.paid_in}</p>}
                        {order.commission_status === 'void' && order.void_reason && (
                          <p className="text-red-500">Reason: {order.void_reason === 'cancelled' ? 'Order cancelled' : order.void_reason === 'returned' ? 'Order returned' : order.void_reason === 'failed_delivery' ? 'Delivery failed' : order.void_reason}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Load More Button */}
      {data?.pagination.hasMore && !loading && (
        <div className="text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2 text-sm font-medium text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : `Load more (${data.pagination.total - allOrders.length} remaining)`}
          </button>
        </div>
      )}

      {/* Status Legend - collapsible detailed help */}
      <div className="border-t pt-4">
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="text-base text-gray-600 hover:text-gray-800 flex items-center gap-2 font-medium"
        >
          <span>{showHelp ? '▼' : '▶'}</span>
          How order status affects commission
        </button>
        {showHelp && (
          <div className="mt-4 text-base text-gray-700 space-y-3 pl-4 border-l-2 border-gray-200">
            <p className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="w-full sm:w-40 font-medium shrink-0">Delivered</span>
              <span className="hidden sm:inline">→</span>
              <span className="px-2.5 py-1 text-sm rounded bg-amber-100 text-amber-700 font-medium">Pending</span>
              <span className="text-gray-500">(10-day hold for returns)</span>
            </p>
            <p className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="w-full sm:w-40 font-medium shrink-0">After 10 days</span>
              <span className="hidden sm:inline">→</span>
              <span className="px-2.5 py-1 text-sm rounded bg-emerald-100 text-emerald-700 font-medium">Payable</span>
              <span className="text-gray-500">(ready for next payout)</span>
            </p>
            <p className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="w-full sm:w-40 font-medium shrink-0">Payout sent</span>
              <span className="hidden sm:inline">→</span>
              <span className="px-2.5 py-1 text-sm rounded bg-blue-100 text-blue-700 font-medium">Paid</span>
              <span className="text-gray-500">(included in payout)</span>
            </p>
            <p className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="w-full sm:w-40 font-medium shrink-0">Cancelled/Returned</span>
              <span className="hidden sm:inline">→</span>
              <span className="px-2.5 py-1 text-sm rounded bg-gray-100 text-gray-600 font-medium">Void</span>
              <span className="text-gray-500">(commission removed)</span>
            </p>
          </div>
        )}
      </div>

      {/* Footer Links */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-500 pt-4 border-t">
        <Link href="/affiliate/orders" className="hover:text-emerald-600">
          View All Orders
        </Link>
        <span>•</span>
        <Link href="/affiliate/settings" className="hover:text-emerald-600">
          Account Settings
        </Link>
        <span>•</span>
        <a href="/affiliate/terms" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600">
          Terms & Conditions
        </a>
        <span>•</span>
        <a href="https://wa.me/923001234567" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600">
          Contact Support
        </a>
      </div>
    </div>
  );
}
