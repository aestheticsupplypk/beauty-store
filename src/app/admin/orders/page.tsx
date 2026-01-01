import { requireAdmin } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import Link from 'next/link';

type Search = { q?: string; status?: string; productId?: string; payment?: string; source?: string; returns?: string };

async function fetchOrders(search: Search) {
  const supabase = getSupabaseServerClient();
  let query = supabase
    .from('orders')
    .select(
      'id, order_code, source, status, customer_name, email, phone, address, city, province_code, created_at, shipping_amount, grand_total, amount_paid, amount_due'
    )
    .order('created_at', { ascending: false })
    .limit(50);

  if (search.status && search.status !== 'all') {
    query = query.eq('status', search.status);
  }
  if (search.source && search.source !== 'all') {
    query = query.eq('source', search.source);
  }
  if (search.q && search.q.trim()) {
    const q = `%${search.q.trim()}%`;
    // Search by name, email or phone
    query = query.or(`customer_name.ilike.${q},email.ilike.${q},phone.ilike.${q}`);
  }
  // Filter by product via order_lines -> variants.product_id
  if (search.productId && search.productId !== 'all') {
    const { data: lineOrders, error: lineErr } = await supabase
      .from('order_lines')
      .select('order_id, variants!inner(id, product_id)')
      .eq('variants.product_id', search.productId);
    if (lineErr) throw lineErr;
    const orderIds = Array.from(new Set((lineOrders ?? []).map((r: any) => r.order_id)));
    if (orderIds.length === 0) {
      return [] as any[];
    }
    query = query.in('id', orderIds);
  }
  const { data, error } = await query;
  if (error) throw error;

  const ids = (data ?? []).map((o) => o.id);
  if (ids.length === 0) return [] as any[];

  // Fetch totals per order from order_lines (preferred: sum of line_total)
  const { data: lines } = await supabase
    .from('order_lines')
    .select('order_id, line_total, returned_qty, return_status')
    .in('order_id', ids);

  const totalsFromLines: Record<string, number> = {};
  const hasReturnsMap: Record<string, boolean> = {};
  for (const ln of lines ?? []) {
    const key = String((ln as any).order_id);
    totalsFromLines[key] = (totalsFromLines[key] ?? 0) + Number((ln as any).line_total || 0);
    const returnedQty = Number((ln as any).returned_qty || 0);
    const status = String((ln as any).return_status || 'none');
    if (returnedQty > 0 && status !== 'none') {
      hasReturnsMap[key] = true;
    }
  }
  let result = (data ?? []).map((o) => {
    const idKey = String(o.id);
    const shipping = Number((o as any).shipping_amount || 0);
    const grandTotal = Number((o as any).grand_total || 0);
    const totalFromLines = (totalsFromLines[idKey] ?? 0) + shipping;
    const total = grandTotal > 0 ? grandTotal : totalFromLines;
    const amountPaid = Number((o as any).amount_paid || 0);
    const amountDue = Number((o as any).amount_due ?? total - amountPaid);
    return {
      ...o,
      total,
      amount_paid: amountPaid,
      amount_due: amountDue,
      has_returns: !!hasReturnsMap[idKey],
    };
  });

  // Apply payment filter in-memory based on amount_due
  if (search.payment === 'pending') {
    result = result.filter((o: any) => Number(o.amount_due || 0) > 0);
  } else if (search.payment === 'paid') {
    result = result.filter((o: any) => Number(o.amount_due || 0) <= 0 && Number(o.total || 0) > 0);
  }

  // Filter by returns
  if (search.returns === 'with') {
    result = result.filter((o: any) => !!(o as any).has_returns);
  } else if (search.returns === 'without') {
    result = result.filter((o: any) => !(o as any).has_returns);
  }

  return result;
}

export default async function OrdersPage({ searchParams }: { searchParams: Search }) {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  let orders: any[] = [];
  let fetchError: any = null;
  try {
    orders = await fetchOrders(searchParams || {});
  } catch (e: any) {
    fetchError = e;
  }
  const currentStatus = searchParams?.status ?? 'all';
  const q = searchParams?.q ?? '';
  const currentProduct = searchParams?.productId ?? 'all';
  const currentPayment = searchParams?.payment ?? 'all';
  const currentSource = searchParams?.source ?? 'all';
  const currentReturns = searchParams?.returns ?? 'all';

  // Fetch products for the dropdown
  const { data: products } = await supabase
    .from('products')
    .select('id, name')
    .order('created_at', { ascending: false });
return (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold">Orders </h1>
      <Link
        href="/admin/orders/new2"
        className="inline-flex items-center rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90"
      >
        New manual order
      </Link>
    </div>
    <div className="border rounded p-4">
        <h2 className="font-medium">Orders Capabilities (This Page)</h2>
        <ul className="list-disc pl-5 text-sm mt-2 space-y-1 text-gray-700">
          <li>View orders with filters and quick search.</li>
          <li>Open an order to see items and update status.</li>
          <li>Print a packing slip from the order detail.</li>
        </ul>
      </div>

      <form className="flex flex-wrap items-end gap-3 border rounded p-4" action="/admin/orders" method="get">
        <div>
          <label className="block text-sm">Status</label>
          <select name="status" defaultValue={currentStatus} className="border rounded px-3 py-2">
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="packed">Packed</option>
            <option value="shipped">Shipped</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="block text-sm">Returns</label>
          <select name="returns" defaultValue={currentReturns} className="border rounded px-3 py-2">
            <option value="all">All</option>
            <option value="with">With returns</option>
            <option value="without">Without returns</option>
          </select>
        </div>
        <div>
          <label className="block text-sm">Source</label>
          <select name="source" defaultValue={currentSource} className="border rounded px-3 py-2">
            <option value="all">All</option>
            <option value="manual">Manual</option>
            <option value="online">Web / Online</option>
          </select>
        </div>
        <div>
          <label className="block text-sm">Payment</label>
          <select name="payment" defaultValue={currentPayment} className="border rounded px-3 py-2">
            <option value="all">All</option>
            <option value="pending">Pending payments</option>
            <option value="paid">Paid in full</option>
          </select>
        </div>
        <div>
          <label className="block text-sm">Product</label>
          <select name="productId" defaultValue={currentProduct} className="border rounded px-3 py-2 min-w-[220px]">
            <option value="all">All products</option>
            {(products ?? []).map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm">Search</label>
          <input name="q" defaultValue={q} placeholder="Name or Phone" className="border rounded px-3 py-2 w-full" />
        </div>
        <button className="bg-black text-white rounded px-4 py-2">Apply</button>
      </form>

      {fetchError && (
        <div className="border rounded p-3 text-sm text-red-700 bg-red-50">
          Error loading orders: {String(fetchError?.message || fetchError)}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">Order</th>
              <th className="py-2 pr-4">Customer</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Phone</th>
              <th className="py-2 pr-4">City</th>
              <th className="py-2 pr-4">Source</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Total</th>
              <th className="py-2 pr-4">Balance owing</th>
              <th className="py-2 pr-4">Created</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o: any) => (
              <tr key={o.id} className="border-b hover:bg-gray-50">
                <td className="py-2 pr-4">
                  <Link className="underline" href={`/admin/orders/${o.id}`}>
                    #{o.order_code || String(o.id).slice(0, 8)}
                  </Link>
                </td>
                <td className="py-2 pr-4">{o.customer_name}</td>
                <td className="py-2 pr-4">{o.email || '-'}</td>
                <td className="py-2 pr-4">{o.phone}</td>
                <td className="py-2 pr-4">{o.city} {o.province_code ? `(${o.province_code})` : ''}</td>
                <td className="py-2 pr-4">
                  {(() => {
                    const src = (o as any).source || 'online';
                    const label = src === 'manual' ? 'Manual' : 'Web';
                    const cls =
                      src === 'manual'
                        ? 'inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700'
                        : 'inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700';
                    return <span className={cls}>{label}</span>;
                  })()}
                </td>
                <td className="py-2 pr-4">
                  {(() => {
                    const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize border ';
                    const hasReturns = !!(o as any).has_returns;
                    const cls = hasReturns
                      ? base + 'bg-red-50 text-red-700 border-red-200'
                      : base + 'bg-gray-100 text-gray-800 border-gray-200';
                    return <span className={cls}>{o.status}</span>;
                  })()}
                </td>
                <td className="py-2 pr-4">{Number(o.total).toLocaleString()} PKR</td>
                <td className="py-2 pr-4">{Number((o as any).amount_due || 0).toLocaleString()} PKR</td>
                <td className="py-2 pr-4">{new Date(o.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td className="py-4 text-gray-500" colSpan={9}>No orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
