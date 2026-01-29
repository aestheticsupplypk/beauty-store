'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import AffiliateDetailDrawer from './AffiliateDetailDrawer';

type Affiliate = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  parlour_name: string | null;
  city: string | null;
  code: string;
  active: boolean;
  created_at: string;
  payout_method: string | null;
  payout_account: string | null;
  payout_ready: boolean;
  payout_missing: 'method' | 'details' | null;
  stats: {
    total_orders: number;
    total_sales: number;
    total_commission: number;
    last_order_date: string | null;
    delivered_count_30d: number;
    payable_amount: number;
  };
  tier: {
    name: string;
    multiplier_percent: number;
  };
};

type TierOption = { name: string; min_orders: number };

export default function AffiliatesClient() {
  const [loading, setLoading] = useState(true);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [tiers, setTiers] = useState<TierOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedAffiliateId, setSelectedAffiliateId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [cityFilter, setCityFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [hasPayableFilter, setHasPayableFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [payoutReadyFilter, setPayoutReadyFilter] = useState<'all' | 'complete' | 'incomplete'>('all');
  const [last30DaysFilter, setLast30DaysFilter] = useState(false);

  // Debounce timer for search
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);

  // Memoized fetch function to avoid stale closures
  const loadAffiliates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (cityFilter) params.set('city', cityFilter);
      if (tierFilter) params.set('tier', tierFilter);
      if (hasPayableFilter === 'yes') params.set('hasPayable', 'true');
      if (hasPayableFilter === 'no') params.set('hasPayable', 'false');
      if (payoutReadyFilter !== 'all') params.set('payoutReady', payoutReadyFilter);
      if (last30DaysFilter) params.set('last30Days', 'true');

      const res = await fetch(`/api/admin/affiliate/list?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || 'Failed to load affiliates');
      }

      setAffiliates(json.affiliates || []);
      setCities(json.cities || []);
      setTiers(json.tiers || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load affiliates');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, cityFilter, tierFilter, hasPayableFilter, payoutReadyFilter, last30DaysFilter]);

  // Load affiliates when filters change
  useEffect(() => {
    loadAffiliates();
  }, [loadAffiliates]);

  // Auto-search with debounce (separate effect for search input)
  useEffect(() => {
    if (searchTimer) clearTimeout(searchTimer);
    const timer = setTimeout(() => {
      // loadAffiliates is already called by the main effect when search changes
    }, 300);
    setSearchTimer(timer);
    return () => clearTimeout(timer);
  }, [search]);

  function clearFilters() {
    setSearch('');
    setStatusFilter('all');
    setCityFilter('');
    setTierFilter('');
    setHasPayableFilter('all');
    setPayoutReadyFilter('all');
    setLast30DaysFilter(false);
  }

  // Sort affiliates: Payable desc, then Last Order desc
  const sortedAffiliates = [...affiliates].sort((a, b) => {
    // First by payable amount desc
    if (b.stats.payable_amount !== a.stats.payable_amount) {
      return b.stats.payable_amount - a.stats.payable_amount;
    }
    // Then by last order date desc
    const aDate = a.stats.last_order_date ? new Date(a.stats.last_order_date).getTime() : 0;
    const bDate = b.stats.last_order_date ? new Date(b.stats.last_order_date).getTime() : 0;
    return bDate - aDate;
  });

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function getTierBadge(tierName: string) {
    switch (tierName.toLowerCase()) {
      case 'gold':
        return <span className="px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-800 font-medium">Gold</span>;
      case 'silver':
        return <span className="px-2 py-0.5 text-xs rounded bg-gray-200 text-gray-700 font-medium">Silver</span>;
      default:
        return <span className="px-2 py-0.5 text-xs rounded bg-amber-100 text-amber-700 font-medium">Bronze</span>;
    }
  }

  const hasActiveFilters = search || statusFilter !== 'all' || cityFilter || tierFilter || hasPayableFilter !== 'all' || payoutReadyFilter !== 'all' || last30DaysFilter;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Affiliates</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/affiliates/payouts"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            Payouts
          </Link>
          <Link
            href="/admin/affiliates/tiers"
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
          >
            Commission Tiers
          </Link>
        </div>
      </div>

      <p className="text-sm text-gray-600 max-w-2xl">
        Overview of all parlours and beauticians with referral codes. This table shows their basic
        profile plus total online orders, sales, and commission earned through their code.
      </p>

      {/* Search and Filters */}
      <div className="border rounded-lg bg-white p-4 space-y-4">
        {/* Search Row */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search by name, email, phone, or code... (auto-filters as you type)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Quick Filter Chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setHasPayableFilter(hasPayableFilter === 'yes' ? 'all' : 'yes')}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              hasPayableFilter === 'yes'
                ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            💰 Payable &gt; 0
          </button>
          <button
            onClick={() => setPayoutReadyFilter(payoutReadyFilter === 'incomplete' ? 'all' : 'incomplete')}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              payoutReadyFilter === 'incomplete'
                ? 'bg-red-100 border-red-300 text-red-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            ⚠️ Not Ready
          </button>
          <button
            onClick={() => setLast30DaysFilter(!last30DaysFilter)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              last30DaysFilter
                ? 'bg-blue-100 border-blue-300 text-blue-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            📅 Order in 30 days
          </button>
        </div>

        {/* Filter Row */}
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as any); setTimeout(loadAffiliates, 0); }}
            className="px-3 py-1.5 border rounded text-sm bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={cityFilter}
            onChange={(e) => { setCityFilter(e.target.value); setTimeout(loadAffiliates, 0); }}
            className="px-3 py-1.5 border rounded text-sm bg-white"
          >
            <option value="">All Cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={tierFilter}
            onChange={(e) => { setTierFilter(e.target.value); setTimeout(loadAffiliates, 0); }}
            className="px-3 py-1.5 border rounded text-sm bg-white"
          >
            <option value="">All Tiers</option>
            {tiers.map((t) => (
              <option key={t.name} value={t.name}>{t.name}</option>
            ))}
          </select>

          <select
            value={hasPayableFilter}
            onChange={(e) => { setHasPayableFilter(e.target.value as any); setTimeout(loadAffiliates, 0); }}
            className="px-3 py-1.5 border rounded text-sm bg-white"
          >
            <option value="all">Payable: All</option>
            <option value="yes">Has Payable (&gt;0)</option>
            <option value="no">No Payable</option>
          </select>

          <select
            value={payoutReadyFilter}
            onChange={(e) => { setPayoutReadyFilter(e.target.value as any); setTimeout(loadAffiliates, 0); }}
            className="px-3 py-1.5 border rounded text-sm bg-white"
          >
            <option value="all">Payout Ready: All</option>
            <option value="complete">Ready</option>
            <option value="incomplete">Not Ready</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-8 text-gray-500">Loading affiliates...</div>
      )}

      {/* Table */}
      {!loading && (
        <div className="border rounded bg-white overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
                <th className="py-2 px-3">Name</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Parlour</th>
                <th className="py-2 px-3">City</th>
                <th className="py-2 px-3">Phone</th>
                <th className="py-2 px-3">Code</th>
                <th className="py-2 px-3">Tier</th>
                <th className="py-2 px-3 text-right">Orders</th>
                <th className="py-2 px-3 text-right">Sales (PKR)</th>
                <th className="py-2 px-3 text-right">Commission</th>
                <th className="py-2 px-3 text-right">Payable</th>
                <th className="py-2 px-3">Last Order</th>
                <th className="py-2 px-3">Payout Ready</th>
              </tr>
            </thead>
            <tbody>
              {sortedAffiliates.length === 0 ? (
                <tr>
                  <td className="py-4 px-3 text-sm text-gray-500" colSpan={13}>
                    {hasActiveFilters ? 'No affiliates match your filters.' : 'No affiliates created yet.'}
                  </td>
                </tr>
              ) : (
                sortedAffiliates.map((a) => (
                  <tr 
                    key={a.id} 
                    className={`border-b last:border-0 cursor-pointer ${a.active ? 'hover:bg-gray-50' : 'bg-red-50 hover:bg-red-100'}`}
                    onClick={() => setSelectedAffiliateId(a.id)}
                  >
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div className="font-medium">{a.name}</div>
                      {a.email && <div className="text-xs text-gray-500">{a.email}</div>}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {a.active ? (
                        <span className="px-2 py-0.5 text-xs rounded bg-emerald-100 text-emerald-700">Active</span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs rounded bg-red-100 text-red-700">Inactive</span>
                      )}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">{a.parlour_name || '—'}</td>
                    <td className="py-2 px-3 whitespace-nowrap">{a.city || '—'}</td>
                    <td className="py-2 px-3 whitespace-nowrap text-xs">{a.phone}</td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="font-mono text-sm tracking-widest">{a.code}</span>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {getTierBadge(a.tier.name)}
                    </td>
                    <td className="py-2 px-3 text-right">{a.stats.total_orders}</td>
                    <td className="py-2 px-3 text-right">{Number(a.stats.total_sales || 0).toLocaleString()}</td>
                    <td className="py-2 px-3 text-right">{Number(a.stats.total_commission || 0).toLocaleString()}</td>
                    <td className="py-2 px-3 text-right">
                      {a.stats.payable_amount > 0 ? (
                        <span className="text-emerald-600 font-medium">{a.stats.payable_amount.toLocaleString()}</span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-xs text-gray-500">
                      {formatDate(a.stats.last_order_date)}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {a.payout_ready ? (
                        <span className="px-2 py-0.5 text-xs rounded bg-emerald-100 text-emerald-700">Ready</span>
                      ) : (
                        <span 
                          className="px-2 py-0.5 text-xs rounded bg-amber-100 text-amber-700 cursor-help"
                          title={a.payout_missing === 'method' ? 'Payout method not selected' : 'Account details missing'}
                        >
                          Not Ready
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {!loading && sortedAffiliates.length > 0 && (
        <div className="text-sm text-gray-500">
          Showing {sortedAffiliates.length} affiliate{sortedAffiliates.length !== 1 ? 's' : ''}
          {hasActiveFilters && ' (filtered)'} • Sorted by Payable, then Last Order
        </div>
      )}

      {/* Detail Drawer */}
      {selectedAffiliateId && (
        <AffiliateDetailDrawer
          affiliateId={selectedAffiliateId}
          onClose={() => setSelectedAffiliateId(null)}
          onStatusChange={loadAffiliates}
        />
      )}
    </div>
  );
}
