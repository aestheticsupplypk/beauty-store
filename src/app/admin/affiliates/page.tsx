import { requireSectionAccess } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import AffiliateActions from './AffiliateActions';
import Link from 'next/link';

async function fetchAffiliatesWithStats() {
  const supabase = getSupabaseServerClient();

  const { data: affiliates, error: affErr } = await supabase
    .from('affiliates')
    .select('id, name, parlour_name, city, phone, email, code, active, created_at')
    .order('created_at', { ascending: true });
  if (affErr) throw affErr;

  const ids = (affiliates || []).map((a: any) => a.id).filter(Boolean) as string[];
  const statsById: Record<string, { total_orders: number; total_sales: number; total_commission: number }> = {};

  if (ids.length) {
    const { data: orders, error: ordErr } = await supabase
      .from('orders')
      .select('affiliate_id, total_amount, affiliate_commission_amount')
      .in('affiliate_id', ids);
    if (ordErr) throw ordErr;

    for (const o of orders || []) {
      const ao = o as any;
      const aid = String(ao.affiliate_id || '');
      if (!aid) continue;
      if (!statsById[aid]) {
        statsById[aid] = { total_orders: 0, total_sales: 0, total_commission: 0 };
      }
      statsById[aid].total_orders += 1;
      statsById[aid].total_sales += Number(ao.total_amount || 0);
      statsById[aid].total_commission += Number(ao.affiliate_commission_amount || 0);
    }
  }

  return (affiliates || []).map((a: any) => ({
    ...a,
    stats: statsById[String(a.id)] || { total_orders: 0, total_sales: 0, total_commission: 0 },
  }));
}

export default async function AdminAffiliatesPage() {
  await requireSectionAccess('affiliates');
  const rows = await fetchAffiliatesWithStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Affiliates</h1>
        <Link
          href="/admin/affiliates/tiers"
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
        >
          Commission Tiers
        </Link>
      </div>

      <p className="text-sm text-gray-600 max-w-2xl">
        Overview of all parlours and beauticians with referral codes. This table shows their basic
        profile plus total online orders, sales, and commission earned through their code.
      </p>

      <div className="border rounded bg-white overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
              <th className="py-2 px-3">Name</th>
              <th className="py-2 px-3">Parlour</th>
              <th className="py-2 px-3">City</th>
              <th className="py-2 px-3">Phone</th>
              <th className="py-2 px-3">Code</th>
              <th className="py-2 px-3 text-right">Orders</th>
              <th className="py-2 px-3 text-right">Sales (PKR)</th>
              <th className="py-2 px-3 text-right">Commission (PKR)</th>
              <th className="py-2 px-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="py-4 px-3 text-sm text-gray-500" colSpan={9}>
                  No affiliates created yet.
                </td>
              </tr>
            ) : (
              rows.map((a: any) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="py-2 px-3 whitespace-nowrap">
                    <div className="font-medium">{a.name}</div>
                    {a.email ? (
                      <div className="text-xs text-gray-500">{a.email}</div>
                    ) : null}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">{a.parlour_name || '-'}</td>
                  <td className="py-2 px-3 whitespace-nowrap">{a.city || '-'}</td>
                  <td className="py-2 px-3 whitespace-nowrap text-xs">{a.phone}</td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    <span className="font-mono text-sm tracking-widest">{a.code}</span>
                  </td>
                  <td className="py-2 px-3 text-right">{a.stats.total_orders}</td>
                  <td className="py-2 px-3 text-right">{Number(a.stats.total_sales || 0).toLocaleString()}</td>
                  <td className="py-2 px-3 text-right">{Number(a.stats.total_commission || 0).toLocaleString()}</td>
                  <td className="py-2 px-3 whitespace-nowrap text-xs">
                    <AffiliateActions affiliateId={a.id} isActive={a.active} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
