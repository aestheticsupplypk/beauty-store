export type MetaContentIdSource = "sku" | "variant_id";

/**
 * Normalizes product/variant identifiers for Meta Pixel.
 *
 * - If source === "variant_id" → always use the internal variant UUID.
 * - If source === "sku"       → prefer SKU if present, otherwise fall back to variant ID.
 */
export function getMetaContentId(
  input: { id: string; sku?: string | null },
  source: MetaContentIdSource
): string {
  const variantId = String(input.id || "");
  const sku = (input.sku || "").trim();

  if (source === "variant_id") {
    return variantId;
  }

  // Default to SKU-based IDs, but never return an empty string
  return sku || variantId;
}
