'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';

/**
 * Captures attribution data (UTMs, ref code) from URL and stores in cart context.
 * First-touch ref code is locked and cannot be overridden.
 */
export default function AttributionCapture({ productSlug }: { productSlug?: string }) {
  const searchParams = useSearchParams();
  const { setAttribution, lockRefCode, attribution } = useCart();

  useEffect(() => {
    // Capture UTMs
    const utmSource = searchParams.get('utm_source');
    const utmMedium = searchParams.get('utm_medium');
    const utmCampaign = searchParams.get('utm_campaign');
    const utmContent = searchParams.get('utm_content');
    const utmTerm = searchParams.get('utm_term');

    // Capture ref code
    const refCode = searchParams.get('ref') || searchParams.get('referral');

    // Build attribution update
    const attrUpdate: Record<string, string | number | undefined> = {};
    
    if (utmSource) attrUpdate.utmSource = utmSource;
    if (utmMedium) attrUpdate.utmMedium = utmMedium;
    if (utmCampaign) attrUpdate.utmCampaign = utmCampaign;
    if (utmContent) attrUpdate.utmContent = utmContent;
    if (utmTerm) attrUpdate.utmTerm = utmTerm;
    if (productSlug) attrUpdate.landingProductSlug = productSlug;

    // Set attribution (won't override locked ref code)
    if (Object.keys(attrUpdate).length > 0) {
      setAttribution(attrUpdate);
    }

    // Lock ref code if present in URL (first-touch wins)
    if (refCode && !attribution.refCodeLocked) {
      lockRefCode(refCode);
    }
  }, [searchParams, setAttribution, lockRefCode, productSlug, attribution.refCodeLocked]);

  return null;
}
