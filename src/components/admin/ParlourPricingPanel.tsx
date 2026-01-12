'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

type PricingTier = {
  id: string;
  product_id: string;
  variant_id: string | null;
  min_qty: number;
  unit_price: number | null;
  discount_percent: number | null;
};

type ParlourPricingPanelProps = {
  productId: string;
};

export default function ParlourPricingPanel({ productId }: ParlourPricingPanelProps) {
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Payment method options
  const [allowCod, setAllowCod] = useState<boolean>(true);
  const [allowAdvance, setAllowAdvance] = useState<boolean>(true);

  // MOQ and Max Qty
  const [parlourMinQty, setParlourMinQty] = useState<number>(1);
  const [parlourMaxQty, setParlourMaxQty] = useState<string>('');

  // Special message
  const [parlourMessage, setParlourMessage] = useState<string>('');

  // New tier form state
  const [newMinQty, setNewMinQty] = useState<number>(1);
  const [newUnitPrice, setNewUnitPrice] = useState<string>('');
  const [newDiscountPercent, setNewDiscountPercent] = useState<string>('');
  const [pricingMode, setPricingMode] = useState<'fixed' | 'discount'>('fixed');

  const fetchTiers = useCallback(async () => {
    setLoading(true);
    
    // Fetch product payment method settings, MOQ, and message
    const { data: productData } = await supabaseBrowser
      .from('products')
      .select('parlour_allow_cod, parlour_allow_advance, parlour_message, parlour_min_qty, parlour_max_qty')
      .eq('id', productId)
      .single();
    
    if (productData) {
      setAllowCod(productData.parlour_allow_cod ?? true);
      setAllowAdvance(productData.parlour_allow_advance ?? true);
      setParlourMessage(productData.parlour_message ?? '');
      setParlourMinQty(productData.parlour_min_qty ?? 1);
      setParlourMaxQty(productData.parlour_max_qty?.toString() ?? '');
    }
    
    const { data, error } = await supabaseBrowser
      .from('parlour_pricing_tiers')
      .select('*')
      .eq('product_id', productId)
      .is('variant_id', null) // Product-level tiers only for MVP
      .order('min_qty', { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setTiers(data ?? []);
    }
    setLoading(false);
  }, [productId]);

  useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

  const addTier = async () => {
    if (newMinQty < 1) {
      setError('Minimum quantity must be at least 1');
      return;
    }

    // Check if tier with this min_qty already exists
    if (tiers.some((t) => t.min_qty === newMinQty)) {
      setError(`A tier for ${newMinQty}+ already exists`);
      return;
    }

    const unitPrice = pricingMode === 'fixed' && newUnitPrice ? parseFloat(newUnitPrice) : null;
    const discountPercent = pricingMode === 'discount' && newDiscountPercent ? parseFloat(newDiscountPercent) : null;

    if (pricingMode === 'fixed' && (unitPrice === null || unitPrice <= 0)) {
      setError('Please enter a valid unit price');
      return;
    }

    if (pricingMode === 'discount' && (discountPercent === null || discountPercent < 0 || discountPercent > 100)) {
      setError('Please enter a valid discount percentage (0-100)');
      return;
    }

    setSaving(true);
    setError(null);

    const { error: insertError } = await supabaseBrowser
      .from('parlour_pricing_tiers')
      .insert({
        product_id: productId,
        variant_id: null,
        min_qty: newMinQty,
        unit_price: unitPrice,
        discount_percent: discountPercent,
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setNewMinQty(1);
      setNewUnitPrice('');
      setNewDiscountPercent('');
      await fetchTiers();
    }

    setSaving(false);
  };

  const deleteTier = async (tierId: string) => {
    if (!confirm('Delete this pricing tier?')) return;

    setSaving(true);
    const { error: deleteError } = await supabaseBrowser
      .from('parlour_pricing_tiers')
      .delete()
      .eq('id', tierId);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      await fetchTiers();
    }
    setSaving(false);
  };

  const updateTier = async (tierId: string, field: 'unit_price' | 'discount_percent', value: string) => {
    const numValue = value ? parseFloat(value) : null;

    const updateData: any = {};
    if (field === 'unit_price') {
      updateData.unit_price = numValue;
      updateData.discount_percent = null; // Clear the other field
    } else {
      updateData.discount_percent = numValue;
      updateData.unit_price = null; // Clear the other field
    }

    const { error: updateError } = await supabaseBrowser
      .from('parlour_pricing_tiers')
      .update(updateData)
      .eq('id', tierId);

    if (updateError) {
      setError(updateError.message);
    } else {
      await fetchTiers();
    }
  };

  const updatePaymentMethods = async (cod: boolean, advance: boolean) => {
    // Ensure at least one is selected
    if (!cod && !advance) {
      setError('At least one payment method must be enabled');
      return;
    }

    setAllowCod(cod);
    setAllowAdvance(advance);

    const { error: updateError } = await supabaseBrowser
      .from('products')
      .update({ parlour_allow_cod: cod, parlour_allow_advance: advance })
      .eq('id', productId);

    if (updateError) {
      setError(updateError.message);
    } else {
      setLastSaved(new Date());
    }
  };

  const updateParlourMessage = async (message: string) => {
    const { error: updateError } = await supabaseBrowser
      .from('products')
      .update({ parlour_message: message || null })
      .eq('id', productId);

    if (updateError) {
      setError(updateError.message);
    } else {
      setLastSaved(new Date());
    }
  };

  const updateMoqSettings = async (minQty: number, maxQty: string) => {
    // Validate
    if (minQty < 1) {
      setError('Minimum quantity must be at least 1');
      return;
    }
    const maxQtyNum = maxQty ? parseInt(maxQty) : null;
    if (maxQtyNum !== null && maxQtyNum < minQty) {
      setError('Maximum quantity must be greater than or equal to minimum quantity');
      return;
    }

    setError(null);
    const { error: updateError } = await supabaseBrowser
      .from('products')
      .update({ 
        parlour_min_qty: minQty, 
        parlour_max_qty: maxQtyNum 
      })
      .eq('id', productId);

    if (updateError) {
      setError(updateError.message);
    } else {
      setLastSaved(new Date());
    }
  };

  if (loading) {
    return (
      <section className="border rounded p-4 space-y-4">
        <h2 className="text-lg font-semibold">Parlour Pricing</h2>
        <p className="text-sm text-gray-500">Loading...</p>
      </section>
    );
  }

  return (
    <section className="border rounded p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Parlour Pricing</h2>
        {lastSaved && (
          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
            ✓ Saved {lastSaved.toLocaleTimeString()}
          </span>
        )}
      </div>

      <p className="text-sm text-gray-600">
        Set tiered pricing for parlour wholesale orders. Parlours will see these prices when ordering through the Parlour Portal.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      {/* MOQ and Max Qty */}
      <div className="bg-amber-50 border border-amber-200 rounded p-3 space-y-3">
        <h3 className="text-sm font-medium text-amber-800">Order Quantity Limits</h3>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium mb-1">Min Qty (MOQ)</label>
            <input
              type="number"
              value={parlourMinQty}
              onChange={(e) => setParlourMinQty(parseInt(e.target.value) || 1)}
              onBlur={() => updateMoqSettings(parlourMinQty, parlourMaxQty)}
              min="1"
              className="w-24 border rounded px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Max Qty per Order</label>
            <input
              type="number"
              value={parlourMaxQty}
              onChange={(e) => setParlourMaxQty(e.target.value)}
              onBlur={() => updateMoqSettings(parlourMinQty, parlourMaxQty)}
              placeholder="No limit"
              min="1"
              className="w-24 border rounded px-2 py-1.5 text-sm"
            />
          </div>
        </div>
        <p className="text-xs text-amber-700">
          MOQ: Minimum quantity a parlour must order. Max Qty: Optional cap per order to prevent excessive bulk orders.
        </p>
      </div>

      {/* Payment Method Options */}
      <div className="bg-gray-50 border rounded p-3 space-y-2">
        <h3 className="text-sm font-medium">Allowed Payment Methods</h3>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={allowCod}
              onChange={(e) => updatePaymentMethods(e.target.checked, allowAdvance)}
              className="rounded"
            />
            Cash on Delivery (COD)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={allowAdvance}
              onChange={(e) => updatePaymentMethods(allowCod, e.target.checked)}
              className="rounded"
            />
            Advance Payment
          </label>
        </div>
        <p className="text-xs text-gray-500">
          Select which payment methods parlours can use when ordering this product.
        </p>
      </div>

      {/* Special Message */}
      <div className="bg-gray-50 border rounded p-3 space-y-2">
        <h3 className="text-sm font-medium">Special Message</h3>
        <input
          type="text"
          value={parlourMessage}
          onChange={(e) => setParlourMessage(e.target.value)}
          onBlur={(e) => updateParlourMessage(e.target.value)}
          placeholder="e.g., Limited stock - order soon!"
          className="w-full border rounded px-3 py-2 text-sm"
        />
        <p className="text-xs text-gray-500">
          This message will be displayed to parlours when they select this product in the Parlour Portal.
        </p>
      </div>

      {/* Existing tiers */}
      {tiers.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-3 border-b text-left">Min Qty</th>
                <th className="py-2 px-3 border-b text-left">Unit Price (PKR)</th>
                <th className="py-2 px-3 border-b text-left">Discount %</th>
                <th className="py-2 px-3 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier) => (
                <tr key={tier.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3 font-medium">{tier.min_qty}+</td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      defaultValue={tier.unit_price ?? ''}
                      onBlur={(e) => updateTier(tier.id, 'unit_price', e.target.value)}
                      placeholder="Fixed price"
                      className="w-24 border rounded px-2 py-1 text-sm"
                      min="0"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      defaultValue={tier.discount_percent ?? ''}
                      onBlur={(e) => updateTier(tier.id, 'discount_percent', e.target.value)}
                      placeholder="% off"
                      className="w-20 border rounded px-2 py-1 text-sm"
                      min="0"
                      max="100"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <button
                      onClick={() => deleteTier(tier.id)}
                      disabled={saving}
                      className="text-red-600 hover:underline text-xs disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">
          No parlour pricing tiers configured. Add tiers below to enable parlour ordering for this product.
        </p>
      )}

      {/* Add new tier */}
      <div className="border-t pt-4 space-y-3">
        <h3 className="font-medium text-sm">Add Pricing Tier</h3>

        <div className="flex gap-2 items-center text-sm">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="pricingMode"
              checked={pricingMode === 'fixed'}
              onChange={() => setPricingMode('fixed')}
            />
            Fixed Price
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="pricingMode"
              checked={pricingMode === 'discount'}
              onChange={() => setPricingMode('discount')}
            />
            Discount %
          </label>
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium mb-1">Min Qty</label>
            <input
              type="number"
              value={newMinQty}
              onChange={(e) => setNewMinQty(parseInt(e.target.value) || 1)}
              min="1"
              className="w-20 border rounded px-2 py-1.5 text-sm"
            />
          </div>

          {pricingMode === 'fixed' ? (
            <div>
              <label className="block text-xs font-medium mb-1">Unit Price (PKR)</label>
              <input
                type="number"
                value={newUnitPrice}
                onChange={(e) => setNewUnitPrice(e.target.value)}
                placeholder="e.g., 2500"
                min="0"
                className="w-28 border rounded px-2 py-1.5 text-sm"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium mb-1">Discount %</label>
              <input
                type="number"
                value={newDiscountPercent}
                onChange={(e) => setNewDiscountPercent(e.target.value)}
                placeholder="e.g., 10"
                min="0"
                max="100"
                className="w-20 border rounded px-2 py-1.5 text-sm"
              />
            </div>
          )}

          <button
            onClick={addTier}
            disabled={saving}
            className="bg-black text-white rounded px-4 py-1.5 text-sm hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Adding...' : 'Add Tier'}
          </button>
        </div>

        <p className="text-xs text-gray-500">
          Example: For Hair Serum, you might set 1+ = 2500 PKR, 6+ = 2150 PKR, 12+ = 2000 PKR.
          The system applies the tier with the largest min_qty ≤ order quantity.
        </p>
      </div>
    </section>
  );
}
