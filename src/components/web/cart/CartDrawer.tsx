'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart, CartItem } from '@/contexts/CartContext';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { track } from '@/lib/pixel';

type UpsellProduct = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  minPrice: number;
  variantId?: string;
};

export default function CartDrawer() {
  const router = useRouter();
  const { 
    items, 
    isOpen, 
    closeCart, 
    itemCount, 
    subtotal, 
    updateQuantity, 
    removeItem,
    addItem,
    attribution 
  } = useCart();
  
  const [upsells, setUpsells] = useState<UpsellProduct[]>([]);
  const [loadingUpsells, setLoadingUpsells] = useState(false);
  const [addingUpsell, setAddingUpsell] = useState<string | null>(null);

  // Load upsells based on cart items
  useEffect(() => {
    if (!isOpen || items.length === 0) {
      setUpsells([]);
      return;
    }

    const loadUpsells = async () => {
      setLoadingUpsells(true);
      try {
        // Get product IDs from cart
        const productIds = Array.from(new Set(items.map(i => i.productId)));
        
        // Fetch upsells for these products
        const { data } = await supabaseBrowser
          .from('product_upsells')
          .select(`
            upsell_product_id,
            sort_order,
            products!product_upsells_upsell_product_id_fkey(id, name, slug, logo_url)
          `)
          .in('product_id', productIds)
          .order('sort_order', { ascending: true })
          .limit(6);

        if (!data) {
          setUpsells([]);
          return;
        }

        // Get unique upsell products not already in cart
        const cartVariantIds = new Set(items.map(i => i.variantId));
        const cartProductIds = new Set(items.map(i => i.productId));
        
        const uniqueUpsells: UpsellProduct[] = [];
        const seenIds = new Set<string>();

        for (const row of data as any[]) {
          const product = row.products;
          if (!product || seenIds.has(product.id) || cartProductIds.has(product.id)) continue;
          seenIds.add(product.id);
          
          // Get min price variant - only purchasable (active + price > 0)
          const { data: variants } = await supabaseBrowser
            .from('variants')
            .select('id, price')
            .eq('product_id', product.id)
            .eq('active', true)
            .gt('price', 0)
            .order('price', { ascending: true })
            .limit(1);

          const minVariant = variants?.[0];
          
          // Skip if no purchasable variant exists
          if (!minVariant || !minVariant.price || minVariant.price <= 0) continue;
          
          uniqueUpsells.push({
            id: product.id,
            name: product.name,
            slug: product.slug,
            logoUrl: product.logo_url,
            minPrice: minVariant.price,
            variantId: minVariant.id,
          });

          if (uniqueUpsells.length >= 3) break; // Max 3 upsells shown
        }

        setUpsells(uniqueUpsells);
      } catch (e) {
        console.error('Failed to load upsells:', e);
      } finally {
        setLoadingUpsells(false);
      }
    };

    loadUpsells();
  }, [isOpen, items]);

  // Handle adding upsell to cart
  const handleAddUpsell = async (upsell: UpsellProduct) => {
    if (!upsell.variantId) {
      // Navigate to product page if no simple variant
      router.push(`/lp/${upsell.slug}`);
      return;
    }

    setAddingUpsell(upsell.id);
    try {
      addItem({
        variantId: upsell.variantId,
        productId: upsell.id,
        productName: upsell.name,
        productSlug: upsell.slug,
        variantLabel: '',
        price: upsell.minPrice,
        thumbUrl: upsell.logoUrl,
      });
      
      // Track AddToCart
      track('AddToCart', {
        content_ids: [upsell.variantId],
        value: upsell.minPrice,
        currency: 'PKR',
        content_type: 'product',
      });
    } finally {
      setAddingUpsell(null);
    }
  };

  // Handle proceed to checkout
  const handleCheckout = () => {
    if (items.length === 0) return;

    // Build items param for checkout
    const checkoutItems = items.map(i => ({
      variant_id: i.variantId,
      qty: i.quantity,
    }));

    const itemsParam = encodeURIComponent(JSON.stringify(checkoutItems));
    
    // Build attribution params
    const params = new URLSearchParams();
    params.set('items', itemsParam);
    
    if (attribution.refCode) {
      params.set('ref', attribution.refCode);
    }
    if (attribution.utmSource) params.set('utm_source', attribution.utmSource);
    if (attribution.utmMedium) params.set('utm_medium', attribution.utmMedium);
    if (attribution.utmCampaign) params.set('utm_campaign', attribution.utmCampaign);

    // Track InitiateCheckout
    track('InitiateCheckout', {
      content_ids: items.map(i => i.variantId),
      value: subtotal,
      currency: 'PKR',
      num_items: itemCount,
    });

    router.push(`/checkout?${params.toString()}`);
    closeCart();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={closeCart}
      />

      {/* Drawer - Desktop: right side, Mobile: bottom sheet */}
      <div className={`
        fixed z-50 bg-white shadow-xl
        transition-transform duration-300 ease-out
        
        /* Mobile: bottom sheet */
        inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl
        
        /* Desktop: right side drawer */
        sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[420px] sm:max-h-none sm:rounded-none sm:rounded-l-xl
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            Your Cart {itemCount > 0 && <span className="text-gray-500">({itemCount})</span>}
          </h2>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close cart"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(85vh - 180px)' }}>
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🛒</div>
              <p>Your cart is empty</p>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-3">
                {items.map((item) => (
                  <CartItemRow 
                    key={item.variantId} 
                    item={item} 
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                  />
                ))}
              </div>

              {/* Upsells */}
              {upsells.length > 0 && (
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">You might also like</h3>
                  <div className="space-y-2">
                    {upsells.map((upsell) => (
                      <div key={upsell.id} className="flex items-center gap-3 p-2 border rounded-lg bg-gray-50">
                        {upsell.logoUrl && (
                          <img 
                            src={upsell.logoUrl} 
                            alt={upsell.name}
                            className="w-12 h-12 object-contain rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{upsell.name}</div>
                          <div className="text-sm text-gray-600">PKR {upsell.minPrice.toLocaleString()}</div>
                        </div>
                        <button
                          onClick={() => handleAddUpsell(upsell)}
                          disabled={addingUpsell === upsell.id}
                          className="px-3 py-1.5 text-xs font-medium bg-black text-white rounded hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
                        >
                          {addingUpsell === upsell.id ? '...' : '+ Add'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer - Sticky CTA */}
        {items.length > 0 && (
          <div className="border-t p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-lg font-semibold">PKR {subtotal.toLocaleString()}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Proceed to Checkout
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              Shipping calculated at checkout
            </p>
          </div>
        )}
      </div>
    </>
  );
}

// Cart item row component
function CartItemRow({ 
  item, 
  onUpdateQuantity, 
  onRemove 
}: { 
  item: CartItem; 
  onUpdateQuantity: (variantId: string, qty: number) => void;
  onRemove: (variantId: string) => void;
}) {
  return (
    <div className="flex gap-3 p-2 border rounded-lg">
      {item.thumbUrl && (
        <img 
          src={item.thumbUrl} 
          alt={item.productName}
          className="w-16 h-16 object-contain rounded"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{item.productName}</div>
        {item.variantLabel && (
          <div className="text-xs text-gray-500">{item.variantLabel}</div>
        )}
        <div className="text-sm text-gray-700 mt-1">
          PKR {item.price.toLocaleString()}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <button
          onClick={() => onRemove(item.variantId)}
          className="text-xs text-red-600 hover:underline"
        >
          Remove
        </button>
        <div className="flex items-center gap-1 border rounded">
          <button
            onClick={() => onUpdateQuantity(item.variantId, item.quantity - 1)}
            className="px-2 py-1 text-gray-600 hover:bg-gray-100"
          >
            −
          </button>
          <span className="px-2 text-sm font-medium">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.variantId, item.quantity + 1)}
            className="px-2 py-1 text-gray-600 hover:bg-gray-100"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
