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
  const [range, setRange] = useState<'this_month' | 'last_month' | 'last_2_months'>('this_month');
  const [data, setData] = useState<OrdersResponse | null>(null);
  const [page, setPage] = useState(1);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

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
              {(data.summary.pending_commission / 1000).toFixed(1)}k
            </div>
          </div>
          <div className="border rounded p-2 sm:p-3 bg-white">
            <div className="text-[10px] sm:text-xs text-emerald-600 uppercase">Payable</div>
            <div className="text-lg sm:text-xl font-semibold mt-0.5 text-emerald-600">
              {(data.summary.payable_commission / 1000).toFixed(1)}k
            </div>
          </div>
          <div className="border rounded p-2 sm:p-3 bg-white">
            <div className="text-[10px] sm:text-xs text-blue-600 uppercase">Paid</div>
            <div className="text-lg sm:text-xl font-semibold mt-0.5 text-blue-600">
              {(data.summary.paid_commission / 1000).toFixed(1)}k
            </div>
          </div>
        </div>
      )}

      {/* Orders Table - mobile-friendly with expandable rows */}
      {data && !loading && (
        <div className="border rounded-lg bg-white overflow-hidden">
          {allOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="font-medium">No orders found for {getRangeLabel(range).toLowerCase()}</p>
              <p className="text-sm mt-1">Orders will appear here when customers use your referral code.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Order</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Commission</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Paid In</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allOrders.map((order) => (
                      <React.Fragment key={order.id}>
                        <tr 
                          className="border-b hover:bg-gray-50 cursor-pointer"
                          onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                        >
                          <td className="px-4 py-3 font-mono text-gray-700">{order.order_code}</td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(order.date)}</td>
                          <td className="px-4 py-3 text-right font-medium">
                            {order.commission_amount.toLocaleString()} PKR
                          </td>
                          <td className="px-4 py-3">{getStatusBadge(order.commission_status)}</td>
                          <td className="px-4 py-3 text-gray-400 text-xs">
                            {order.paid_in || '—'}
                          </td>
                        </tr>
                        {expandedOrder === order.id && (
                          <tr className="bg-gray-50 border-b">
                            <td colSpan={5} className="px-4 py-2 text-xs text-gray-600">
                              <span className="font-medium">Customer:</span> {order.customer} • 
                              <span className="font-medium ml-2">Delivery:</span> {getDeliveryBadge(order.delivery_status)}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile List */}
              <div className="sm:hidden divide-y">
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
                        <div className="font-medium text-sm">{order.commission_amount.toLocaleString()}</div>
                        {getStatusBadge(order.commission_status)}
                      </div>
                    </div>
                    {expandedOrder === order.id && (
                      <div className="mt-2 pt-2 border-t text-xs text-gray-500">
                        <p>{order.customer}</p>
                        <p className="mt-1">Delivery: {getDeliveryBadge(order.delivery_status)} {order.paid_in && `• Paid: ${order.paid_in}`}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
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

      {/* Collapsible Help */}
      <div className="border-t pt-4">
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <span>{showHelp ? '▼' : '▶'}</span>
          What do these statuses mean?
        </button>
        {showHelp && (
          <div className="mt-2 text-xs text-gray-500 space-y-1 pl-4">
            <p><strong>Pending:</strong> Order delivered, waiting for 10-day hold period</p>
            <p><strong>Payable:</strong> Ready for next payout (usually ~10th of month)</p>
            <p><strong>Paid:</strong> Included in a completed payout</p>
            <p><strong>Void:</strong> Not payable due to return, refund, or failed delivery</p>
          </div>
        )}
      </div>
    </div>
  );
}
