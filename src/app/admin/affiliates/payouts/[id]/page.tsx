'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

type Commission = {
  id: string;
  order_id: string;
  commission_amount: number;
  status: string;
  payable_at: string;
  paid_at: string | null;
};

type Affiliate = {
  affiliate_id: string;
  name: string;
  code: string;
  email: string;
  payout_method: string;
  payout_account: string | null;
  commission_count: number;
  total_amount: number;
  commissions: Commission[];
};

type Batch = {
  id: string;
  batch_date: string;
  period_start: string;
  period_end: string;
  total_commissions: number;
  total_affiliates: number;
  status: string;
  created_at: string;
  processed_at: string | null;
  notes: string | null;
};

export default function BatchDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [expandedAffiliate, setExpandedAffiliate] = useState<string | null>(null);

  useEffect(() => {
    if (batchId) {
      loadBatch();
    }
  }, [batchId]);

  async function loadBatch() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/admin/affiliate/payouts/batches/${batchId}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || 'Failed to load batch');
      }

      setBatch(json.batch);
      setAffiliates(json.affiliates || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load batch');
    } finally {
      setLoading(false);
    }
  }

  async function markAsPaid() {
    if (!batch || batch.status === 'completed' || batch.status === 'paid') return;

    if (!confirm('Are you sure you want to mark this batch as paid? This action cannot be undone.')) {
      return;
    }

    try {
      setMarking(true);
      setError(null);

      const res = await fetch(`/api/admin/affiliate/payouts/batches/${batchId}/mark-paid`, {
        method: 'POST',
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || 'Failed to mark as paid');
      }

      // Reload batch data
      await loadBatch();
    } catch (e: any) {
      setError(e?.message || 'Failed to mark as paid');
    } finally {
      setMarking(false);
    }
  }

  function exportCSV() {
    if (!batch || affiliates.length === 0) return;

    const rows = [
      ['Affiliate', 'Code', 'Email', 'Payout Method', 'Payout Account', 'Amount (PKR)', 'Commissions'],
    ];

    for (const a of affiliates) {
      rows.push([
        a.name,
        a.code,
        a.email,
        a.payout_method,
        a.payout_account || '',
        a.total_amount.toString(),
        a.commission_count.toString(),
      ]);
    }

    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payout-batch-${batch.batch_date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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

  function getPayoutMethodBadge(method: string) {
    switch (method) {
      case 'easypaisa':
        return <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">EasyPaisa</span>;
      case 'bank_transfer':
        return <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700">Bank</span>;
      default:
        return <span className="px-2 py-0.5 text-xs rounded bg-red-100 text-red-700">Not Set</span>;
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Loading batch details...</p>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error || 'Batch not found'}</p>
        <Link href="/admin/affiliates/payouts" className="text-emerald-600 hover:text-emerald-700 text-sm mt-4 inline-block">
          ← Back to Payouts
        </Link>
      </div>
    );
  }

  const isPaid = batch.status === 'completed' || batch.status === 'paid';

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/affiliates/payouts" className="text-emerald-600 hover:text-emerald-700 text-sm">
            ← Back to Payouts
          </Link>
          <h1 className="text-2xl font-semibold mt-2">
            Payout Batch: {formatDate(batch.batch_date)}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            {getStatusBadge(batch.status)}
            {batch.notes && <span className="text-sm text-gray-500">• {batch.notes}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Export CSV
          </button>
          {!isPaid && (
            <button
              onClick={markAsPaid}
              disabled={marking}
              className={`px-4 py-2 rounded-lg text-white font-medium ${
                marking ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {marking ? 'Processing...' : 'Mark as Paid'}
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* Batch Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4 bg-white">
          <div className="text-sm text-gray-500">Total Amount</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">
            {batch.total_commissions.toLocaleString()} PKR
          </div>
        </div>
        <div className="border rounded-lg p-4 bg-white">
          <div className="text-sm text-gray-500">Affiliates</div>
          <div className="text-xl font-bold mt-1">{batch.total_affiliates}</div>
        </div>
        <div className="border rounded-lg p-4 bg-white">
          <div className="text-sm text-gray-500">Period</div>
          <div className="text-sm font-medium mt-1">
            {formatDate(batch.period_start)} - {formatDate(batch.period_end)}
          </div>
        </div>
        <div className="border rounded-lg p-4 bg-white">
          <div className="text-sm text-gray-500">{isPaid ? 'Paid On' : 'Created'}</div>
          <div className="text-sm font-medium mt-1">
            {formatDate(isPaid ? batch.processed_at || batch.created_at : batch.created_at)}
          </div>
        </div>
      </div>

      {/* Affiliates List */}
      <div className="border rounded-lg bg-white overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="font-medium">Affiliates ({affiliates.length})</h2>
        </div>
        {affiliates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No affiliates in this batch
          </div>
        ) : (
          <div className="divide-y">
            {affiliates.map((a) => (
              <div key={a.affiliate_id}>
                <div
                  className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedAffiliate(expandedAffiliate === a.affiliate_id ? null : a.affiliate_id)}
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-medium">{a.name}</div>
                      <div className="text-xs text-gray-500">{a.code} • {a.email}</div>
                    </div>
                    {getPayoutMethodBadge(a.payout_method)}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-emerald-600">
                      {a.total_amount.toLocaleString()} PKR
                    </div>
                    <div className="text-xs text-gray-500">{a.commission_count} commissions</div>
                  </div>
                </div>
                {expandedAffiliate === a.affiliate_id && (
                  <div className="px-4 py-3 bg-gray-50 border-t">
                    <div className="text-xs text-gray-500 mb-2">
                      <strong>Payout to:</strong> {a.payout_account || 'Not configured'}
                    </div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-500">
                          <th className="text-left py-1">Order ID</th>
                          <th className="text-left py-1">Status</th>
                          <th className="text-left py-1">Paid At</th>
                          <th className="text-right py-1">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {a.commissions.map((comm) => (
                          <tr key={comm.id} className="border-t border-gray-200">
                            <td className="py-1 font-mono">#{String(comm.order_id).slice(-6)}</td>
                            <td className="py-1">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                comm.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {comm.status}
                              </span>
                            </td>
                            <td className="py-1">{comm.paid_at ? formatDate(comm.paid_at) : '—'}</td>
                            <td className="py-1 text-right">{comm.commission_amount.toLocaleString()} PKR</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit Info */}
      <div className="text-xs text-gray-500 border-t pt-4">
        <p><strong>Batch ID:</strong> {batch.id}</p>
        <p><strong>Created:</strong> {formatDate(batch.created_at)}</p>
        {batch.processed_at && <p><strong>Processed:</strong> {formatDate(batch.processed_at)}</p>}
      </div>
    </div>
  );
}
