'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

type Summary = {
  total_payable: number;
  affiliates_payable: number;
  next_payout_date: string;
};

type Batch = {
  id: string;
  batch_date: string;
  total_commissions: number;
  total_affiliates: number;
  status: string;
  created_at: string;
  processed_at: string | null;
};

type LastBatch = Batch | null;

export default function AdminPayoutsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [lastBatch, setLastBatch] = useState<LastBatch>(null);
  const [recentBatches, setRecentBatches] = useState<Batch[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/admin/affiliate/payouts/summary');
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || 'Failed to load data');
      }

      setSummary(json.summary);
      setLastBatch(json.last_batch);
      setRecentBatches(json.recent_batches || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-0.5 text-xs rounded bg-amber-100 text-amber-700">Pending</span>;
      case 'processing':
        return <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700">Processing</span>;
      case 'completed':
      case 'paid':
        return <span className="px-2 py-0.5 text-xs rounded bg-emerald-100 text-emerald-700">Paid</span>;
      case 'failed':
      case 'cancelled':
        return <span className="px-2 py-0.5 text-xs rounded bg-red-100 text-red-700">Failed</span>;
      default:
        return <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600">{status}</span>;
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/affiliates" className="text-emerald-600 hover:text-emerald-700 text-sm">
            ← Back to Affiliates
          </Link>
          <h1 className="text-2xl font-semibold mt-2">Affiliate Payouts</h1>
          <p className="text-sm text-gray-600 mt-1">Manage commission payouts to affiliates</p>
        </div>
        {summary && summary.affiliates_payable > 0 && (
          <Link
            href="/admin/affiliates/payouts/new"
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
          >
            Create Payout Batch
          </Link>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4 bg-white">
            <div className="text-sm text-gray-500">Payable Now</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">
              {summary.total_payable.toLocaleString()} PKR
            </div>
            <div className="text-xs text-gray-400 mt-1">Ready for payout</div>
          </div>
          <div className="border rounded-lg p-4 bg-white">
            <div className="text-sm text-gray-500">Affiliates with Payable</div>
            <div className="text-2xl font-bold mt-1">{summary.affiliates_payable}</div>
            <div className="text-xs text-gray-400 mt-1">Waiting for payment</div>
          </div>
          <div className="border rounded-lg p-4 bg-white">
            <div className="text-sm text-gray-500">Next Payout Date</div>
            <div className="text-2xl font-bold mt-1">{formatDate(summary.next_payout_date)}</div>
            <div className="text-xs text-gray-400 mt-1">~10th of month</div>
          </div>
        </div>
      )}

      {/* Last Batch Info */}
      {lastBatch && (
        <div className="border rounded-lg p-4 bg-emerald-50 border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-emerald-800">Last Completed Payout</div>
              <div className="text-lg font-semibold text-emerald-700 mt-1">
                {lastBatch.total_commissions.toLocaleString()} PKR
              </div>
              <div className="text-xs text-emerald-600 mt-1">
                {formatDate(lastBatch.batch_date)} • {lastBatch.total_affiliates} affiliates
              </div>
            </div>
            <Link
              href={`/admin/affiliates/payouts/${lastBatch.id}`}
              className="text-sm text-emerald-600 hover:text-emerald-700"
            >
              View details →
            </Link>
          </div>
        </div>
      )}

      {/* Recent Batches */}
      <div className="border rounded-lg bg-white overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="font-medium">Recent Batches</h2>
        </div>
        {recentBatches.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No payout batches yet</p>
            <p className="text-sm mt-1">Create your first batch when you have payable commissions.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Batch Date</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Affiliates</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600"></th>
              </tr>
            </thead>
            <tbody>
              {recentBatches.map((batch) => (
                <tr key={batch.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{formatDate(batch.batch_date)}</td>
                  <td className="px-4 py-3 text-right">{batch.total_commissions.toLocaleString()} PKR</td>
                  <td className="px-4 py-3 text-right">{batch.total_affiliates}</td>
                  <td className="px-4 py-3">{getStatusBadge(batch.status)}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(batch.created_at)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/affiliates/payouts/${batch.id}`}
                      className="text-emerald-600 hover:text-emerald-700 text-sm"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
