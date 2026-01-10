'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Commission = {
  id: string;
  order_id: string;
  commission_amount: number;
  payable_at: string;
};

type Candidate = {
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

type Totals = {
  total_amount: number;
  total_commissions: number;
  total_affiliates: number;
};

export default function NewPayoutBatchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [expandedAffiliate, setExpandedAffiliate] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadCandidates();
  }, []);

  async function loadCandidates() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/admin/affiliate/payouts/candidates');
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || 'Failed to load candidates');
      }

      setCandidates(json.candidates || []);
      setTotals(json.totals || null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load candidates');
    } finally {
      setLoading(false);
    }
  }

  async function createBatch() {
    if (candidates.length === 0) return;

    try {
      setCreating(true);
      setError(null);

      const res = await fetch('/api/admin/affiliate/payouts/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: notes || null,
          batch_date: new Date().toISOString(),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || 'Failed to create batch');
      }

      // Redirect to batch details
      router.push(`/admin/affiliates/payouts/${json.batch.id}`);
    } catch (e: any) {
      setError(e?.message || 'Failed to create batch');
      setCreating(false);
    }
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
        <p className="text-gray-500">Loading payable commissions...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/affiliates/payouts" className="text-emerald-600 hover:text-emerald-700 text-sm">
            ← Back to Payouts
          </Link>
          <h1 className="text-2xl font-semibold mt-2">Create Payout Batch</h1>
          <p className="text-sm text-gray-600 mt-1">Review and confirm payable commissions</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* No candidates */}
      {candidates.length === 0 && (
        <div className="border rounded-lg p-8 bg-white text-center">
          <p className="text-gray-600 font-medium">No payable commissions found</p>
          <p className="text-sm text-gray-500 mt-1">
            Commissions become payable 10 days after delivery.
          </p>
          <Link
            href="/admin/affiliates/payouts"
            className="inline-block mt-4 text-emerald-600 hover:text-emerald-700 text-sm"
          >
            ← Back to Payouts
          </Link>
        </div>
      )}

      {/* Totals Summary */}
      {totals && candidates.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="border rounded-lg p-4 bg-emerald-50 border-emerald-200">
            <div className="text-sm text-emerald-700">Total Payout</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">
              {totals.total_amount.toLocaleString()} PKR
            </div>
          </div>
          <div className="border rounded-lg p-4 bg-white">
            <div className="text-sm text-gray-500">Commissions</div>
            <div className="text-2xl font-bold mt-1">{totals.total_commissions}</div>
          </div>
          <div className="border rounded-lg p-4 bg-white">
            <div className="text-sm text-gray-500">Affiliates</div>
            <div className="text-2xl font-bold mt-1">{totals.total_affiliates}</div>
          </div>
        </div>
      )}

      {/* Candidates List */}
      {candidates.length > 0 && (
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h2 className="font-medium">Affiliates to Pay ({candidates.length})</h2>
          </div>
          <div className="divide-y">
            {candidates.map((c) => (
              <div key={c.affiliate_id}>
                <div
                  className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedAffiliate(expandedAffiliate === c.affiliate_id ? null : c.affiliate_id)}
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-gray-500">{c.code} • {c.email}</div>
                    </div>
                    {getPayoutMethodBadge(c.payout_method)}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-emerald-600">
                      {c.total_amount.toLocaleString()} PKR
                    </div>
                    <div className="text-xs text-gray-500">{c.commission_count} commissions</div>
                  </div>
                </div>
                {expandedAffiliate === c.affiliate_id && (
                  <div className="px-4 py-3 bg-gray-50 border-t">
                    <div className="text-xs text-gray-500 mb-2">
                      <strong>Payout to:</strong> {c.payout_account || 'Not configured'}
                    </div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-500">
                          <th className="text-left py-1">Order ID</th>
                          <th className="text-left py-1">Payable Since</th>
                          <th className="text-right py-1">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {c.commissions.map((comm) => (
                          <tr key={comm.id} className="border-t border-gray-200">
                            <td className="py-1 font-mono">#{String(comm.order_id).slice(-6)}</td>
                            <td className="py-1">{formatDate(comm.payable_at)}</td>
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
        </div>
      )}

      {/* Notes & Create Button */}
      {candidates.length > 0 && (
        <div className="border rounded-lg p-4 bg-white space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="border rounded px-3 py-2 w-full text-sm"
              rows={2}
              placeholder="e.g., January 2026 payout"
            />
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-sm text-gray-500">
              This will create a batch and lock these commissions for payment.
            </div>
            <button
              onClick={createBatch}
              disabled={creating}
              className={`px-6 py-2.5 rounded-lg text-white font-medium ${
                creating ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {creating ? 'Creating...' : `Create Batch (${totals?.total_amount.toLocaleString()} PKR)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
