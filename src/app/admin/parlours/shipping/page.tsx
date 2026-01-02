import { requireSectionAccess } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import Link from 'next/link';
import ShippingRulesEditor from './ShippingRulesEditor';

type ShippingRule = {
  id: string;
  min_qty: number;
  shipping_amount: number;
};

async function fetchShippingRules(): Promise<ShippingRule[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('parlour_shipping_rules')
    .select('id, min_qty, shipping_amount')
    .order('min_qty', { ascending: true });
  if (error) {
    console.error('Error fetching shipping rules:', error);
    return [];
  }
  return data ?? [];
}

export default async function ParlourShippingRulesPage() {
  await requireSectionAccess('parlours');
  const rules = await fetchShippingRules();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Parlour Shipping Rules</h1>
          <p className="text-sm text-gray-600 mt-1">
            Configure shipping rates based on order quantity for parlour orders.
          </p>
        </div>
        <Link href="/admin/parlours" className="text-sm text-gray-600 hover:underline">
          ← Back to Parlours
        </Link>
      </div>

      <ShippingRulesEditor initialRules={rules} />
    </div>
  );
}
