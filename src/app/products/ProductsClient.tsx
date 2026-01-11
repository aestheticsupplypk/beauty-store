'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import CartIcon from '@/components/web/cart/CartIcon';

type ProductCard = {
  id: string;
  name: string;
  slug: string;
  fromPrice: number | null;
  image: string | null;
  hasActiveVariant: boolean;
  variantCount: number;
  defaultVariantId: string | null;
};

type ProductsClientProps = {
  products: ProductCard[];
  activeProductCount: number;
};

export default function ProductsClient({ products, activeProductCount }: ProductsClientProps) {
  const { addItem, openCart, itemCount } = useCart();
  const [hideComingSoon, setHideComingSoon] = useState(false);

  // Filter products: purchasable (has active variant) vs coming soon
  const purchasableProducts = products.filter(p => p.hasActiveVariant);
  const comingSoonProducts = products.filter(p => !p.hasActiveVariant);
  
  // Show all products by default, allow hiding coming soon
  const displayProducts = hideComingSoon ? purchasableProducts : products;
  const showCartBehavior = activeProductCount >= 2;

  const handleAddToCart = (product: ProductCard) => {
    if (!product.hasActiveVariant || !product.defaultVariantId) return;
    
    // For products with multiple variants, go to LP for variant selection
    if (product.variantCount > 1) {
      window.location.href = `/lp/${product.slug}`;
      return;
    }
    
    // Single variant - add directly to cart
    addItem({
      variantId: product.defaultVariantId,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      variantLabel: '',
      price: product.fromPrice || 0,
      quantity: 1,
    });
    openCart();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF7F3] to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[#7A1E3A]">Products</h1>
          <div className="flex items-center gap-6">
            {itemCount > 0 && (
              <CartIcon className="text-[#7A1E3A] hover:text-[#5A1226]" />
            )}
            <Link href="/" className="text-[#7A1E3A] hover:text-[#5A1226] text-sm font-medium">
              Back to home
            </Link>
          </div>
        </header>

        {/* Coming Soon Toggle */}
        {comingSoonProducts.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={hideComingSoon}
                onChange={(e) => setHideComingSoon(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#7A1E3A]"></div>
            </label>
            <span className="text-sm text-[#7A7A7A]">Hide coming soon ({comingSoonProducts.length})</span>
          </div>
        )}

        {/* Products Grid */}
        {displayProducts.length === 0 ? (
          <p className="text-sm text-[#7A7A7A]">No products available yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayProducts.map((p) => (
              <div
                key={p.id}
                className="group rounded-xl border border-[#EFD6DE] bg-white hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Image */}
                <Link href={`/lp/${p.slug}`}>
                  <div className="aspect-[4/3] w-full bg-rose-50 grid place-items-center overflow-hidden relative">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                      />
                    ) : (
                      <div className="text-rose-300 text-sm">Image coming soon</div>
                    )}
                    {/* Coming Soon Badge */}
                    {!p.hasActiveVariant && (
                      <div className="absolute top-3 right-3 bg-[#7A1E3A]/90 text-white text-xs font-medium px-3 py-1 rounded-full">
                        Coming Soon
                      </div>
                    )}
                  </div>
                </Link>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <Link href={`/lp/${p.slug}`}>
                    <div className="font-medium text-[#2B2B2B] truncate hover:text-[#7A1E3A]">{p.name}</div>
                  </Link>
                  
                  {/* Price + Trust Line */}
                  <div className="space-y-1">
                    {p.hasActiveVariant && p.fromPrice != null ? (
                      <>
                        <div className="text-sm font-semibold text-[#7A1E3A]">
                          From PKR {Number(p.fromPrice).toLocaleString()}
                        </div>
                        <div className="text-xs text-[#7A7A7A]">
                          COD • 24–48h Dispatch
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-[#7A7A7A]">Price coming soon</div>
                    )}
                  </div>

                  {/* CTAs */}
                  <div className="flex gap-2 pt-1">
                    {showCartBehavior && p.hasActiveVariant ? (
                      <>
                        {/* Primary: Add to cart */}
                        <button
                          onClick={() => handleAddToCart(p)}
                          className="flex-1 px-4 py-2 bg-[#7A1E3A] text-white text-sm font-medium rounded-lg hover:bg-[#5A1226] transition-colors"
                        >
                          {p.variantCount > 1 ? 'Select options' : 'Add to cart'}
                        </button>
                        {/* Secondary: View details */}
                        <Link
                          href={`/lp/${p.slug}`}
                          className="px-4 py-2 border border-[#7A1E3A] text-[#7A1E3A] text-sm font-medium rounded-lg hover:bg-rose-50 transition-colors"
                        >
                          Details
                        </Link>
                      </>
                    ) : p.hasActiveVariant ? (
                      /* Single product mode: View product only */
                      <Link
                        href={`/lp/${p.slug}`}
                        className="flex-1 px-4 py-2 bg-[#7A1E3A] text-white text-sm font-medium rounded-lg hover:bg-[#5A1226] transition-colors text-center"
                      >
                        View product
                      </Link>
                    ) : (
                      /* Coming soon: View details only */
                      <Link
                        href={`/lp/${p.slug}`}
                        className="flex-1 px-4 py-2 border border-[#EFD6DE] text-[#7A7A7A] text-sm font-medium rounded-lg hover:bg-rose-50 transition-colors text-center"
                      >
                        View details
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
