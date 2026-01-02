'use client';

import { useState, useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

type ShippingRule = {
  id: string;
  min_qty: number;
  shipping_amount: number;
};

type ShippingRulesEditorProps = {
  initialRules: ShippingRule[];
};

export default function ShippingRulesEditor({ initialRules }: ShippingRulesEditorProps) {
  const [rules, setRules] = useState<ShippingRule[]>(initialRules);
  const [originalRules, setOriginalRules] = useState<ShippingRule[]>(initialRules);
  const [saving, setSaving] = useState(false);
  const [newMinQty, setNewMinQty] = useState<string>('');
  const [newShippingAmount, setNewShippingAmount] = useState<string>('');

  // Check if there are unsaved changes
  const isDirty = JSON.stringify(rules) !== JSON.stringify(originalRules);

  // Sort rules by min_qty for display
  const sortedRules = [...rules].sort((a, b) => a.min_qty - b.min_qty);

  // Update a rule's value
  const updateRule = (id: string, field: 'min_qty' | 'shipping_amount', value: number) => {
    setRules(rules.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  // Delete a rule (mark for deletion by removing from local state)
  const deleteRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  // Add a new rule (local only until save)
  const addRule = () => {
    const minQty = parseInt(newMinQty);
    const shippingAmount = parseInt(newShippingAmount);
    
    if (isNaN(minQty) || minQty < 1 || isNaN(shippingAmount) || shippingAmount < 0) {
      return;
    }

    // Check for duplicate min_qty
    if (rules.some(r => r.min_qty === minQty)) {
      alert('A rule with this minimum quantity already exists');
      return;
    }

    const newRule: ShippingRule = {
      id: `new-${Date.now()}`, // Temporary ID for new rules
      min_qty: minQty,
      shipping_amount: shippingAmount,
    };

    setRules([...rules, newRule]);
    setNewMinQty('');
    setNewShippingAmount('');
  };

  // Discard all changes
  const discard = () => {
    setRules(originalRules);
  };

  // Save all changes
  const save = async () => {
    setSaving(true);
    const supabase = supabaseBrowser;

    try {
      // Find deleted rules
      const deletedIds = originalRules
        .filter(orig => !rules.some(r => r.id === orig.id))
        .map(r => r.id);

      // Find new rules (temporary IDs start with 'new-')
      const newRules = rules.filter(r => r.id.startsWith('new-'));

      // Find updated rules
      const updatedRules = rules.filter(r => {
        if (r.id.startsWith('new-')) return false;
        const orig = originalRules.find(o => o.id === r.id);
        return orig && (orig.min_qty !== r.min_qty || orig.shipping_amount !== r.shipping_amount);
      });

      // Delete removed rules
      for (const id of deletedIds) {
        await supabase.from('parlour_shipping_rules').delete().eq('id', id);
      }

      // Insert new rules
      for (const rule of newRules) {
        await supabase.from('parlour_shipping_rules').insert({
          min_qty: rule.min_qty,
          shipping_amount: rule.shipping_amount,
        });
      }

      // Update changed rules
      for (const rule of updatedRules) {
        await supabase.from('parlour_shipping_rules')
          .update({ min_qty: rule.min_qty, shipping_amount: rule.shipping_amount })
          .eq('id', rule.id);
      }

      // Refresh data from server
      const { data } = await supabase
        .from('parlour_shipping_rules')
        .select('id, min_qty, shipping_amount')
        .order('min_qty');

      const freshRules = data ?? [];
      setRules(freshRules);
      setOriginalRules(freshRules);
    } catch (error) {
      console.error('Error saving shipping rules:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Get description for a rule
  const getDescription = (rule: ShippingRule, index: number) => {
    const nextRule = sortedRules[index + 1];
    return nextRule
      ? `${rule.min_qty} to ${nextRule.min_qty - 1} items`
      : `${rule.min_qty}+ items`;
  };

  // Preview shipping for sample quantities
  const previewQuantities = [1, 2, 3, 5, 10, 20];
  const getShippingForQty = (qty: number) => {
    const applicableRule = [...sortedRules]
      .reverse()
      .find(r => qty >= r.min_qty);
    return applicableRule?.shipping_amount ?? 0;
  };

  return (
    <div className="relative">
      {/* Dirty state overlay and save bar */}
      {isDirty && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 bg-black/20 z-40" />
          
          {/* Save/Discard bar */}
          <div className="fixed top-0 left-0 right-0 bg-amber-100 border-b border-amber-300 px-6 py-3 z-50 flex items-center justify-between shadow-lg">
            <span className="font-medium text-amber-800">
              You have unsaved changes
            </span>
            <div className="flex gap-3">
              <button
                onClick={discard}
                disabled={saving}
                className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
              >
                Discard
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
        <h3 className="font-medium text-blue-800 mb-2">How Shipping Rules Work</h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc pl-5">
          <li>Rules are applied based on <strong>total quantity</strong> in the order</li>
          <li>The system finds the rule with the <strong>highest min_qty</strong> that the order meets</li>
          <li>Example: If you have rules for 1+ items (PKR 300) and 3+ items (PKR 500), an order of 5 items will use the 3+ rule (PKR 500)</li>
        </ul>
      </div>

      {/* Add new rule */}
      <div className="border rounded p-4 mb-6">
        <h2 className="font-medium mb-3">Add Shipping Rule</h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Minimum Quantity</label>
            <input
              type="number"
              value={newMinQty}
              onChange={(e) => setNewMinQty(e.target.value)}
              min="1"
              placeholder="e.g. 1"
              className="border rounded px-3 py-2 w-32"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Shipping Amount (PKR)</label>
            <input
              type="number"
              value={newShippingAmount}
              onChange={(e) => setNewShippingAmount(e.target.value)}
              min="0"
              placeholder="e.g. 300"
              className="border rounded px-3 py-2 w-32"
            />
          </div>
          <button
            onClick={addRule}
            className="bg-black text-white rounded px-4 py-2 hover:bg-gray-800"
          >
            Add Rule
          </button>
        </div>
      </div>

      {/* Current rules */}
      <div className="border rounded p-4 mb-6">
        <h2 className="font-medium mb-3">Current Shipping Rules</h2>
        {sortedRules.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No shipping rules configured. Add a rule above to get started.
            <br />
            <span className="text-amber-600">Without rules, shipping will default to PKR 0.</span>
          </p>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-4 font-medium text-sm border-b pb-2">
              <div>Min Quantity</div>
              <div>Shipping Amount (PKR)</div>
              <div>Description</div>
              <div>Actions</div>
            </div>
            {sortedRules.map((rule, index) => (
              <div key={rule.id} className="grid grid-cols-4 gap-4 items-center border-b pb-2">
                <div>
                  <input
                    type="number"
                    value={rule.min_qty}
                    onChange={(e) => updateRule(rule.id, 'min_qty', parseInt(e.target.value) || 0)}
                    min="1"
                    className="border rounded px-2 py-1 w-20"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    value={rule.shipping_amount}
                    onChange={(e) => updateRule(rule.id, 'shipping_amount', parseInt(e.target.value) || 0)}
                    min="0"
                    className="border rounded px-2 py-1 w-24"
                  />
                </div>
                <div className="text-gray-600 text-sm">{getDescription(rule, index)}</div>
                <div>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview */}
      {sortedRules.length > 0 && (
        <div className="border rounded p-4 bg-gray-50">
          <h2 className="font-medium mb-3">Shipping Rate Preview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {previewQuantities.map((qty) => (
              <div key={qty} className="bg-white border rounded p-3">
                <div className="text-gray-600">{qty} item{qty > 1 ? 's' : ''}</div>
                <div className="font-semibold">PKR {getShippingForQty(qty).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
