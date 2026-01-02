'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

type Product = {
  id: string;
  name: string;
  active: boolean;
  image?: string;
  parlour_allow_cod?: boolean;
  parlour_allow_advance?: boolean;
  parlour_message?: string;
};

type Variant = {
  id: string;
  product_id: string;
  sku: string;
  price: number;
};

type InventoryItem = {
  variant_id: string;
  stock_on_hand: number;
  reserved: number;
};

type PricingTier = {
  product_id: string;
  min_qty: number;
  unit_price: number | null;
  discount_percent: number | null;
};

type CartItem = {
  product_id: string;
  product_name: string;
  variant_id: string;
  sku: string;
  qty: number;
  retail_price: number;
  parlour_price: number;
  available: number;
  applied_tier_min_qty: number | null;
};

type Parlour = {
  id: string;
  name: string;
  min_order_qty: number | null;
  min_order_value: number | null;
  address: string | null;
  city: string | null;
  phone: string | null;
};

type ShippingRule = {
  min_qty: number;
  shipping_amount: number;
};

export default function ParlourOrderPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [loading, setLoading] = useState(true);
  const [parlour, setParlour] = useState<Parlour | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [shippingRules, setShippingRules] = useState<ShippingRule[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Form state for adding items
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [qtyInput, setQtyInput] = useState<string>('1');
  const qty = parseInt(qtyInput) || 1;

  // Order submission
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'advance'>('cod');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Shipping address (editable)
  const [shippingAddress, setShippingAddress] = useState<string>('');
  const [shippingCity, setShippingCity] = useState<string>('');

  // Check auth and load data
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/p/login');
        return;
      }

      // Get user's parlour
      const { data: profile } = await supabase
        .from('profiles')
        .select('parlour_id')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!profile?.parlour_id) {
        router.push('/p/login');
        return;
      }

      // Get parlour details
      const { data: parlourData } = await supabase
        .from('parlours')
        .select('*')
        .eq('id', profile.parlour_id)
        .maybeSingle();

      if (!parlourData?.active) {
        router.push('/p/login');
        return;
      }

      setParlour(parlourData);

      // Initialize shipping address from parlour data
      setShippingAddress(parlourData.address || '');
      setShippingCity(parlourData.city || '');

      // Load products, variants, inventory, pricing tiers, and shipping rules
      const [productsRes, variantsRes, inventoryRes, tiersRes, shippingRes] = await Promise.all([
        supabase.from('products').select('id, name, active, parlour_allow_cod, parlour_allow_advance, parlour_message').eq('active', true).order('name').then(async (res) => {
          // Fetch first image for each product
          const products = res.data ?? [];
          const productIds = products.map(p => p.id);
          if (productIds.length > 0) {
            const { data: mediaData } = await supabase
              .from('product_media')
              .select('product_id, url, sort')
              .in('product_id', productIds)
              .eq('type', 'image')
              .order('sort', { ascending: true });
            
            // Map first image to each product
            const imageMap: Record<string, string> = {};
            for (const m of mediaData ?? []) {
              if (!imageMap[m.product_id]) {
                imageMap[m.product_id] = m.url;
              }
            }
            return { ...res, data: products.map(p => ({ ...p, image: imageMap[p.id] })) };
          }
          return res;
        }),
        supabase.from('variants').select('id, product_id, sku, price').order('sku'),
        supabase.from('inventory').select('variant_id, stock_on_hand, reserved'),
        supabase.from('parlour_pricing_tiers').select('product_id, min_qty, unit_price, discount_percent').is('variant_id', null).order('min_qty'),
        supabase.from('parlour_shipping_rules').select('min_qty, shipping_amount').order('min_qty'),
      ]);

      setProducts(productsRes.data ?? []);
      setVariants(variantsRes.data ?? []);
      setInventory(inventoryRes.data ?? []);
      setPricingTiers(tiersRes.data ?? []);
      setShippingRules(shippingRes.data ?? []);
      setLoading(false);
    };

    init();
  }, [supabase, router]);

  // Get variants for selected product
  const productVariants = variants.filter((v) => v.product_id === selectedProductId);

  // Auto-select variant if only one
  useEffect(() => {
    if (productVariants.length === 1) {
      setSelectedVariantId(productVariants[0].id);
    } else {
      setSelectedVariantId('');
    }
  }, [selectedProductId, productVariants.length]);

  // Calculate parlour price for a product/qty and return applied tier info
  const getParlourPriceWithTier = useCallback((productId: string, retailPrice: number, quantity: number): { price: number; appliedTierMinQty: number | null } => {
    const productTiers = pricingTiers
      .filter((t) => t.product_id === productId)
      .sort((a, b) => b.min_qty - a.min_qty); // Sort descending to find largest applicable tier

    for (const tier of productTiers) {
      if (quantity >= tier.min_qty) {
        if (tier.unit_price !== null) {
          return { price: tier.unit_price, appliedTierMinQty: tier.min_qty };
        }
        if (tier.discount_percent !== null) {
          return { price: retailPrice * (1 - tier.discount_percent / 100), appliedTierMinQty: tier.min_qty };
        }
      }
    }

    // No tier found, use retail price
    return { price: retailPrice, appliedTierMinQty: null };
  }, [pricingTiers]);

  // Convenience wrapper for just the price
  const getParlourPrice = useCallback((productId: string, retailPrice: number, quantity: number): number => {
    return getParlourPriceWithTier(productId, retailPrice, quantity).price;
  }, [getParlourPriceWithTier]);

  // Get available inventory for a variant (stock_on_hand - reserved)
  const getAvailable = useCallback((variantId: string): number => {
    const inv = inventory.find((i) => i.variant_id === variantId);
    if (!inv) return 0;
    return Math.max(0, (inv.stock_on_hand ?? 0) - (inv.reserved ?? 0));
  }, [inventory]);

  // Add item to cart
  const addToCart = () => {
    if (!selectedProductId || !selectedVariantId || qty < 1) {
      setError('Please select a product, variant, and quantity');
      return;
    }

    const product = products.find((p) => p.id === selectedProductId);
    const variant = variants.find((v) => v.id === selectedVariantId);
    if (!product || !variant) return;

    const available = getAvailable(selectedVariantId);
    if (qty > available) {
      setError(`Only ${available} units available`);
      return;
    }

    // Check if already in cart
    const existingIndex = cart.findIndex((c) => c.variant_id === selectedVariantId);
    if (existingIndex >= 0) {
      // Update quantity
      const newCart = [...cart];
      const newQty = newCart[existingIndex].qty + qty;
      if (newQty > available) {
        setError(`Cannot add more. Only ${available} units available`);
        return;
      }
      newCart[existingIndex].qty = newQty;
      const { price, appliedTierMinQty } = getParlourPriceWithTier(selectedProductId, variant.price, newQty);
      newCart[existingIndex].parlour_price = price;
      newCart[existingIndex].applied_tier_min_qty = appliedTierMinQty;
      setCart(newCart);
    } else {
      // Add new item
      const { price: parlourPrice, appliedTierMinQty } = getParlourPriceWithTier(selectedProductId, variant.price, qty);
      setCart([
        ...cart,
        {
          product_id: selectedProductId,
          product_name: product.name,
          variant_id: selectedVariantId,
          sku: variant.sku,
          qty,
          retail_price: variant.price,
          parlour_price: parlourPrice,
          available,
          applied_tier_min_qty: appliedTierMinQty,
        },
      ]);
    }

    setError(null);
    setSelectedProductId('');
    setSelectedVariantId('');
    setQtyInput('1');
  };

  // Update cart item quantity
  const updateCartQty = (variantId: string, newQty: number) => {
    const item = cart.find((c) => c.variant_id === variantId);
    if (!item) return;

    if (newQty < 1) {
      removeFromCart(variantId);
      return;
    }

    if (newQty > item.available) {
      setError(`Only ${item.available} units available`);
      return;
    }

    const variant = variants.find((v) => v.id === variantId);
    if (!variant) return;

    setCart(
      cart.map((c) => {
        if (c.variant_id === variantId) {
          const { price, appliedTierMinQty } = getParlourPriceWithTier(c.product_id, variant.price, newQty);
          return {
            ...c,
            qty: newQty,
            parlour_price: price,
            applied_tier_min_qty: appliedTierMinQty,
          };
        }
        return c;
      })
    );
    setError(null);
  };

  // Remove item from cart
  const removeFromCart = (variantId: string) => {
    setCart(cart.filter((c) => c.variant_id !== variantId));
  };

  // Calculate totals
  const totalQty = cart.reduce((sum, c) => sum + c.qty, 0);
  const totalRetail = cart.reduce((sum, c) => sum + c.retail_price * c.qty, 0);
  const totalParlour = cart.reduce((sum, c) => sum + c.parlour_price * c.qty, 0);
  const totalSavings = totalRetail - totalParlour;

  // Calculate shipping based on dynamic rules
  const shippingAmount = (() => {
    if (totalQty === 0 || shippingRules.length === 0) return 0;
    // Find the highest min_qty rule that applies
    const applicableRule = [...shippingRules]
      .sort((a, b) => b.min_qty - a.min_qty)
      .find((r) => totalQty >= r.min_qty);
    return applicableRule?.shipping_amount ?? 0;
  })();
  const grandTotal = totalParlour + shippingAmount;

  // Check minimums
  const meetsMinQty = !parlour?.min_order_qty || totalQty >= parlour.min_order_qty;
  const meetsMinValue = !parlour?.min_order_value || totalParlour >= parlour.min_order_value;

  // Submit order
  const submitOrder = async () => {
    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }

    if (!meetsMinQty) {
      setError(`Minimum order quantity is ${parlour?.min_order_qty} units`);
      return;
    }

    if (!meetsMinValue) {
      setError(`Minimum order value is PKR ${parlour?.min_order_value}`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/parlour/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((c) => ({
            variant_id: c.variant_id,
            qty: c.qty,
            unit_price: c.parlour_price,
            applied_tier_min_qty: c.applied_tier_min_qty,
          })),
          payment_method: paymentMethod,
          shipping_amount: shippingAmount,
          shipping_address: shippingAddress,
          shipping_city: shippingCity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit order');
      }

      setSuccess(true);
      setCart([]);
    } catch (err: any) {
      setError(err.message || 'Failed to submit order');
    } finally {
      setSubmitting(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/p/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-green-500 text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold mb-2">Order Submitted!</h1>
          <p className="text-gray-600 mb-6">
            Your order has been received and will be processed shortly.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="bg-black text-white rounded px-6 py-2 hover:bg-gray-800"
          >
            Place Another Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Parlour Portal</h1>
            <p className="text-sm text-gray-600">{parlour?.name}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm text-red-600 hover:underline"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Add Item Form */}
        <section className="bg-white rounded-lg shadow p-4 space-y-4">
          <h2 className="font-semibold">Add Items</h2>

          <div className="flex gap-4">
            {/* Product Image Preview */}
            {selectedProductId && (
              <div className="flex-shrink-0">
                {(() => {
                  const selectedProduct = products.find(p => p.id === selectedProductId);
                  return selectedProduct?.image ? (
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="w-24 h-24 object-cover rounded-lg border shadow-sm"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-100 rounded-lg border flex items-center justify-center">
                      <span className="text-gray-400 text-xs text-center px-2">No image</span>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Product</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select product...</option>
                {products.map((p) => {
                  const hasTiers = pricingTiers.some((t) => t.product_id === p.id);
                  return (
                    <option key={p.id} value={p.id} disabled={!hasTiers}>
                      {p.name} {!hasTiers && '(No parlour pricing)'}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Variant</label>
              <select
                value={selectedVariantId}
                onChange={(e) => setSelectedVariantId(e.target.value)}
                className="w-full border rounded px-3 py-2"
                disabled={!selectedProductId || productVariants.length === 0}
              >
                <option value="">Select variant...</option>
                {productVariants.map((v) => {
                  const avail = getAvailable(v.id);
                  return (
                    <option key={v.id} value={v.id} disabled={avail === 0}>
                      {v.sku} - PKR {v.price} ({avail} available)
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <input
                type="number"
                value={qtyInput}
                onChange={(e) => setQtyInput(e.target.value)}
                onBlur={() => {
                  const val = parseInt(qtyInput);
                  if (isNaN(val) || val < 1) setQtyInput('1');
                }}
                min="1"
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={addToCart}
                disabled={!selectedProductId || !selectedVariantId}
                className="w-full bg-black text-white rounded px-4 py-2 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to Cart
              </button>
            </div>
            </div>
          </div>

          {/* Special message */}
          {selectedProductId && (() => {
            const selectedProduct = products.find(p => p.id === selectedProductId);
            if (!selectedProduct?.parlour_message) return null;
            return (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
                <span className="font-medium">Note:</span> {selectedProduct.parlour_message}
              </div>
            );
          })()}

          {/* Price preview */}
          {selectedProductId && selectedVariantId && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-4 rounded-lg">
              {(() => {
                const variant = variants.find((v) => v.id === selectedVariantId);
                if (!variant) return null;
                const parlourPrice = getParlourPrice(selectedProductId, variant.price, qty);
                const retailTotal = variant.price * qty;
                const parlourTotal = parlourPrice * qty;
                const savings = retailTotal - parlourTotal;
                const savingsPercent = variant.price > 0 ? Math.round((1 - parlourPrice / variant.price) * 100) : 0;
                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">Retail Price:</span>
                      <span className="text-gray-500 line-through">PKR {variant.price.toLocaleString()} × {qty} = PKR {retailTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-800">Your Price:</span>
                      <span className="text-2xl font-bold text-green-700">PKR {parlourTotal.toLocaleString()}</span>
                    </div>
                    {savings > 0 && (
                      <div className="flex items-center justify-between pt-2 border-t border-green-200">
                        <span className="font-semibold text-green-700">You Save:</span>
                        <div className="text-right">
                          <span className="text-xl font-bold text-green-600">PKR {savings.toLocaleString()}</span>
                          <span className="ml-2 bg-green-600 text-white text-sm font-bold px-2 py-1 rounded">{savingsPercent}% OFF</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </section>

        {/* Cart */}
        <section className="bg-white rounded-lg shadow p-4 space-y-4">
          <h2 className="font-semibold">Cart ({cart.length} items)</h2>

          {cart.length === 0 ? (
            <p className="text-gray-500 text-sm">No items in cart</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Product</th>
                      <th className="text-left py-2">SKU</th>
                      <th className="text-right py-2">Qty</th>
                      <th className="text-right py-2">Unit Price</th>
                      <th className="text-right py-2">Total</th>
                      <th className="py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => (
                      <tr key={item.variant_id} className="border-b">
                        <td className="py-2">{item.product_name}</td>
                        <td className="py-2">{item.sku}</td>
                        <td className="py-2 text-right">
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) => updateCartQty(item.variant_id, parseInt(e.target.value) || 0)}
                            min="1"
                            max={item.available}
                            className="w-16 border rounded px-2 py-1 text-right"
                          />
                        </td>
                        <td className="py-2 text-right">PKR {item.parlour_price.toLocaleString()}</td>
                        <td className="py-2 text-right font-medium">
                          PKR {(item.parlour_price * item.qty).toLocaleString()}
                        </td>
                        <td className="py-2 text-right">
                          <button
                            onClick={() => removeFromCart(item.variant_id)}
                            className="text-red-600 hover:underline text-xs"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Items:</span>
                  <span>{totalQty}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500 line-through">
                  <span>Retail Total:</span>
                  <span>PKR {totalRetail.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>PKR {totalParlour.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping ({totalQty} item{totalQty !== 1 ? 's' : ''}):</span>
                  <span>PKR {shippingAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-xl pt-2 border-t">
                  <span>Grand Total:</span>
                  <span>PKR {grandTotal.toLocaleString()}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between text-green-600 font-semibold bg-green-50 px-3 py-2 rounded">
                    <span>You Save:</span>
                    <span>PKR {totalSavings.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Minimums warning */}
              {(!meetsMinQty || !meetsMinValue) && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded text-sm">
                  {!meetsMinQty && <div>Minimum order: {parlour?.min_order_qty} units</div>}
                  {!meetsMinValue && <div>Minimum order value: PKR {parlour?.min_order_value?.toLocaleString()}</div>}
                </div>
              )}

              {/* Shipping Details */}
              <div className="border-t pt-4 space-y-3">
                <h3 className="font-medium">Shipping Details</h3>
                <div className="bg-gray-50 rounded p-3 space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Parlour Name</label>
                    <div className="font-medium">{parlour?.name}</div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Shipping Address</label>
                    <input
                      type="text"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Enter shipping address"
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">City</label>
                    <input
                      type="text"
                      value={shippingCity}
                      onChange={(e) => setShippingCity(e.target.value)}
                      placeholder="Enter city"
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Phone</label>
                    <div className="text-sm">{parlour?.phone || 'Not provided'}</div>
                  </div>
                </div>
              </div>

              {/* Payment method */}
              {(() => {
                // Determine allowed payment methods based on products in cart
                const cartProductIds = Array.from(new Set(cart.map(c => c.product_id)));
                const cartProducts = products.filter(p => cartProductIds.includes(p.id));
                
                // All products must allow the payment method
                const codAllowed = cartProducts.every(p => p.parlour_allow_cod !== false);
                const advanceAllowed = cartProducts.every(p => p.parlour_allow_advance !== false);
                
                // Find products restricting payment methods
                const codRestrictedBy = cartProducts.filter(p => p.parlour_allow_cod === false).map(p => p.name);
                const advanceRestrictedBy = cartProducts.filter(p => p.parlour_allow_advance === false).map(p => p.name);
                
                return (
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium mb-2">Payment Method</label>
                    
                    {/* Warning if payment method is restricted */}
                    {!codAllowed && advanceAllowed && codRestrictedBy.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded text-sm mb-3">
                        <span className="font-medium">Advance payment required</span> because cart contains: {codRestrictedBy.join(', ')}
                      </div>
                    )}
                    {!advanceAllowed && codAllowed && advanceRestrictedBy.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded text-sm mb-3">
                        <span className="font-medium">COD only</span> because cart contains: {advanceRestrictedBy.join(', ')}
                      </div>
                    )}
                    
                    <div className="flex gap-4">
                      {codAllowed && (
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="payment"
                            checked={paymentMethod === 'cod'}
                            onChange={() => setPaymentMethod('cod')}
                          />
                          Cash on Delivery
                        </label>
                      )}
                      {advanceAllowed && (
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="payment"
                            checked={paymentMethod === 'advance'}
                            onChange={() => setPaymentMethod('advance')}
                          />
                          Advance Payment
                        </label>
                      )}
                    </div>
                    {!codAllowed && !advanceAllowed && (
                      <p className="text-red-600 text-sm mt-2">No payment methods available for these products.</p>
                    )}
                  </div>
                );
              })()}

              {/* Submit */}
              <button
                onClick={submitOrder}
                disabled={submitting || !meetsMinQty || !meetsMinValue}
                className="w-full bg-green-600 text-white rounded py-3 font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Place Order'}
              </button>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
