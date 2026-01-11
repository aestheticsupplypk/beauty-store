/**
 * Purchasable Definition (variant-priced model):
 * 
 * A product is purchasable if:
 * 1. products.active = true
 * 2. AND exists at least one variant where:
 *    - variants.product_id = products.id
 *    - variants.active = true
 *    - variants.price > 0
 * 
 * Use this helper consistently across:
 * - Homepage hero selection + slideshow enablement
 * - Products nav conditional routing
 * - /products CTAs
 * - LP order gating
 * - Upsells filtering
 */

export type ProductWithVariants = {
  active: boolean;
  variants?: { active: boolean; price: number | null }[];
};

export type ProductWithFromPrice = {
  active?: boolean;
  fromPrice: number | null;
};

/**
 * Check if a product is purchasable (client-side, when variants are joined)
 */
export function isPurchasableProduct(product: ProductWithVariants): boolean {
  return (
    product.active === true &&
    (product.variants ?? []).some(v => v.active === true && (v.price ?? 0) > 0)
  );
}

/**
 * Check if a product is purchasable (simplified, when fromPrice is pre-computed)
 * 
 * IMPORTANT: fromPrice MUST be computed as:
 *   MIN(variants.price) WHERE variants.active = true AND variants.price > 0
 * 
 * If fromPrice is null or 0, the product is not purchasable.
 * This helper assumes the caller has already filtered for active variants with price > 0.
 */
export function isPurchasableFromPrice(product: ProductWithFromPrice): boolean {
  return (product.fromPrice ?? 0) > 0;
}

/**
 * Supabase query builder for getting min purchasable price
 * Use this pattern everywhere to ensure consistency:
 * 
 * const { data: pv } = await supabase
 *   .from('variants')
 *   .select('price, active')
 *   .eq('product_id', productId)
 *   .eq('active', true)
 *   .gt('price', 0)  // <-- CRITICAL: excludes price = 0 or null
 *   .order('price', { ascending: true })
 *   .limit(1);
 * const fromPrice = pv?.[0]?.price ?? null;
 */

/**
 * Server-side SQL condition for purchasable products:
 * 
 * SELECT p.* FROM products p
 * WHERE p.active = true
 * AND EXISTS (
 *   SELECT 1 FROM variants v
 *   WHERE v.product_id = p.id
 *   AND v.active = true
 *   AND v.price > 0
 * )
 */
