'use client';

import { useState } from 'react';

type Props = {
  affiliateId: string;
  isActive: boolean;
};

export default function AffiliateActions({ affiliateId, isActive }: Props) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'active' | 'inactive'>(isActive ? 'active' : 'inactive');

  const handleToggle = async (newActive: boolean) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/affiliate/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affiliateId, active: newActive }),
      });
      if (res.ok) {
        setStatus(newActive ? 'active' : 'inactive');
      } else {
        const data = await res.json();
        alert(data?.error || 'Failed to update status');
      }
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'active') {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-green-100 text-green-800 px-2 py-0.5 border border-green-200 text-xs">
          Active
        </span>
        <button
          onClick={() => handleToggle(false)}
          disabled={loading}
          className="text-xs text-red-600 hover:text-red-700 underline disabled:opacity-50"
        >
          {loading ? '...' : 'Deactivate'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 border border-amber-200 text-xs">
        Pending
      </span>
      <button
        onClick={() => handleToggle(true)}
        disabled={loading}
        className="text-xs bg-emerald-600 text-white px-2 py-1 rounded hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? '...' : 'Approve'}
      </button>
    </div>
  );
}
