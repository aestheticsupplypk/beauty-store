import { createClient } from '@supabase/supabase-js';
import TermsContent from './TermsContent';

// Revalidate every 60 seconds - ensures "Last updated" reflects DB state, not build time
export const revalidate = 60;

// Server component - fetches data from database
export default async function AffiliateTermsPage() {
  // Create a public Supabase client (no auth needed for public views)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch products with affiliate commission enabled
  // Only show products that are: affiliate_enabled, active, and have commission value set
  const { data: products } = await supabase
    .from('products')
    .select('id, name, affiliate_commission_type, affiliate_commission_value')
    .eq('affiliate_enabled', true)
    .eq('active', true)
    .gt('affiliate_commission_value', 0)
    .order('name');

  // Fetch active tiers
  const { data: tiers } = await supabase
    .from('affiliate_tiers')
    .select('name, min_delivered_orders_30d, multiplier_percent')
    .eq('active', true)
    .order('min_delivered_orders_30d');

  // Fetch policy meta for last updated timestamp
  const { data: policyMeta } = await supabase
    .from('affiliate_policy_meta')
    .select('terms_last_updated_at')
    .eq('id', 1)
    .single();

  // Fallback to current date if no meta exists yet
  const lastUpdated = policyMeta?.terms_last_updated_at || new Date().toISOString();

  return (
    <TermsContent
      products={products || []}
      tiers={tiers || []}
      lastUpdated={lastUpdated}
    />
  );
}
