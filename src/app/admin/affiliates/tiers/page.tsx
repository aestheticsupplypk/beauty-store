'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Tier {
  id: string;
  name: string;
  min_delivered_orders_30d: number;
  multiplier_percent: number;
  discount_multiplier_percent: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AffiliateTiersPage() {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Tier>>({});

  // New tier state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTier, setNewTier] = useState({
    name: '',
    min_delivered_orders_30d: 0,
    multiplier_percent: 100,
    discount_multiplier_percent: 100,
    active: true,
  });

  useEffect(() => {
    fetchTiers();
  }, []);

  async function fetchTiers() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/affiliate/tiers');
      const json = await res.json();
      if (!res.ok) {
        setError('Failed to load tiers: ' + (json.error || 'Unknown error'));
      } else {
        setTiers(json.tiers || []);
      }
    } catch (e: any) {
      setError('Failed to load tiers: ' + (e?.message || 'Unknown error'));
    }
    setLoading(false);
  }

  async function handleSave(tier: Tier) {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/affiliate/tiers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tier.id,
          name: editForm.name,
          min_delivered_orders_30d: editForm.min_delivered_orders_30d,
          multiplier_percent: editForm.multiplier_percent,
          discount_multiplier_percent: editForm.discount_multiplier_percent,
          active: editForm.active,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError('Failed to save: ' + (json.error || 'Unknown error'));
      } else {
        setSuccess('Tier updated successfully');
        setEditingId(null);
        fetchTiers();
      }
    } catch (e: any) {
      setError('Failed to save: ' + (e?.message || 'Unknown error'));
    }
    setSaving(false);
  }

  async function handleAdd() {
    if (!newTier.name.trim()) {
      setError('Tier name is required');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/affiliate/tiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTier),
      });
      const json = await res.json();
      if (!res.ok) {
        setError('Failed to add tier: ' + (json.error || 'Unknown error'));
      } else {
        setSuccess('Tier added successfully');
        setShowAddForm(false);
        setNewTier({
          name: '',
          min_delivered_orders_30d: 0,
          multiplier_percent: 100,
          discount_multiplier_percent: 100,
          active: true,
        });
        fetchTiers();
      }
    } catch (e: any) {
      setError('Failed to add tier: ' + (e?.message || 'Unknown error'));
    }
    setSaving(false);
  }

  async function handleDelete(tier: Tier) {
    if (!confirm(`Delete tier "${tier.name}"? This cannot be undone.`)) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/affiliate/tiers?id=${tier.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) {
        setError('Failed to delete: ' + (json.error || 'Unknown error'));
      } else {
        setSuccess('Tier deleted');
        fetchTiers();
      }
    } catch (e: any) {
      setError('Failed to delete: ' + (e?.message || 'Unknown error'));
    }
    setSaving(false);
  }

  function startEdit(tier: Tier) {
    setEditingId(tier.id);
    setEditForm({ ...tier });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  // Calculate effective commission example - returns multiplier as "×1.5" format
  function getMultiplierDisplay(multiplier: number) {
    return `×${(multiplier / 100).toFixed(1)}`;
  }

  if (loading) {
    return (
      <div className="p-6">
        <p>Loading tiers...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <Link href="/admin/affiliates" className="text-emerald-600 hover:text-emerald-700 text-sm">
          ← Back to Affiliates
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Commission Tiers</h1>
          <p className="text-sm text-gray-600 mt-1">
            Configure tier-based commission multipliers. Affiliates earn higher commissions as they deliver more orders.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
        >
          Add Tier
        </button>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm">
        <p className="font-medium text-blue-800 mb-2">Tier Multiplier</p>
        <p className="text-blue-700 mb-2">
          Multiplier applies to the product's base commission (<strong>Fixed or %</strong>).
        </p>
        <ul className="text-blue-700 space-y-1 ml-4 list-disc">
          <li>Tier is determined by <strong>delivered orders in rolling 30 days</strong></li>
          <li>Example: Base <strong>500 PKR</strong> + 150% tier = <strong>750 PKR</strong></li>
          <li>Example: Base <strong>10%</strong> + 150% tier = <strong>15%</strong></li>
          <li>Changes affect <strong>new orders only</strong> — existing order snapshots unchanged</li>
        </ul>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Add new tier form */}
      {showAddForm && (
        <div className="bg-gray-50 border rounded-lg p-4 mb-6">
          <h3 className="font-medium mb-4">Add New Tier</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Tier Name</label>
              <input
                type="text"
                value={newTier.name}
                onChange={(e) => setNewTier({ ...newTier, name: e.target.value })}
                className="border rounded px-3 py-2 w-full text-sm"
                placeholder="e.g., Platinum"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Min Delivered Orders (30d)</label>
              <input
                type="number"
                min={0}
                value={newTier.min_delivered_orders_30d}
                onChange={(e) => setNewTier({ ...newTier, min_delivered_orders_30d: parseInt(e.target.value) || 0 })}
                className="border rounded px-3 py-2 w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Commission Multiplier %</label>
              <input
                type="number"
                min={100}
                step={10}
                value={newTier.multiplier_percent}
                onChange={(e) => setNewTier({ ...newTier, multiplier_percent: parseInt(e.target.value) || 100 })}
                className="border rounded px-3 py-2 w-full text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                {getMultiplierDisplay(newTier.multiplier_percent)} base commission
              </p>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Active</label>
              <select
                value={newTier.active ? 'true' : 'false'}
                onChange={(e) => setNewTier({ ...newTier, active: e.target.value === 'true' })}
                className="border rounded px-3 py-2 w-full text-sm"
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="px-4 py-2 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Tier'}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tiers table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Tier</th>
              <th className="text-left px-4 py-3 font-medium">Min Orders (30d)</th>
              <th className="text-left px-4 py-3 font-medium">Multiplier %</th>
              <th className="text-left px-4 py-3 font-medium">Effect</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier) => (
              <tr key={tier.id} className="border-b last:border-b-0 hover:bg-gray-50">
                {editingId === tier.id ? (
                  <>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="border rounded px-2 py-1 w-full text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        value={editForm.min_delivered_orders_30d || 0}
                        onChange={(e) => setEditForm({ ...editForm, min_delivered_orders_30d: parseInt(e.target.value) || 0 })}
                        className="border rounded px-2 py-1 w-24 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={100}
                        step={10}
                        value={editForm.multiplier_percent || 100}
                        onChange={(e) => setEditForm({ ...editForm, multiplier_percent: parseInt(e.target.value) || 100 })}
                        className="border rounded px-2 py-1 w-24 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-medium">
                      {getMultiplierDisplay(editForm.multiplier_percent || 100)}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={editForm.active ? 'true' : 'false'}
                        onChange={(e) => setEditForm({ ...editForm, active: e.target.value === 'true' })}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleSave(tier)}
                        disabled={saving}
                        className="text-emerald-600 hover:text-emerald-700 text-sm mr-3"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-gray-500 hover:text-gray-700 text-sm"
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 font-medium">{tier.name}</td>
                    <td className="px-4 py-3">{tier.min_delivered_orders_30d}</td>
                    <td className="px-4 py-3">{tier.multiplier_percent}%</td>
                    <td className="px-4 py-3 text-gray-500 font-medium">
                      {getMultiplierDisplay(tier.multiplier_percent)}
                    </td>
                    <td className="px-4 py-3">
                      {tier.active ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Active</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Inactive</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => startEdit(tier)}
                        className="text-blue-600 hover:text-blue-700 text-sm mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(tier)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {tiers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No tiers configured. Click "Add Tier" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Help text */}
      <div className="mt-6 text-sm text-gray-600">
        <p className="font-medium mb-2">Tips:</p>
        <ul className="list-disc ml-4 space-y-1">
          <li>The tier with <strong>min_orders = 0</strong> is the default tier for new affiliates</li>
          <li>Multiplier of 100% means no change from base commission</li>
          <li>Multiplier of 150% means 1.5× the base (e.g., 10% becomes 15%)</li>
          <li>Multiplier of 200% means 2× the base (e.g., 10% becomes 20%)</li>
        </ul>
      </div>
    </div>
  );
}
