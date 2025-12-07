import Link from 'next/link';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { requireAdmin } from '@/lib/auth';

export default async function NewManualOrderPage() {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  const { data: provinces } = await supabase
    .from('provinces')
    .select('code, name')
    .order('name', { ascending: true });
  const { data: products } = await supabase
    .from('products')
    .select('id, name')
    .order('name', { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">New Manual Order</h1>
        <Link className="underline" href="/admin/orders">Back to Orders</Link>
      </div>

      {/* This form posts to the manual-create route handler */}
      <form method="post" action="/admin/orders/manual-create" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="border rounded p-4 space-y-3 lg:col-span-2">
          <h2 className="font-medium">Customer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm">Name</label>
              <input name="customer_name" required className="border rounded px-3 py-2 w-full" />
            </div>
            <div>
              <label className="block text-sm">Phone</label>
              <input name="phone" required className="border rounded px-3 py-2 w-full" />
            </div>
            <div>
              <label className="block text-sm">Email</label>
              <input name="email" type="email" className="border rounded px-3 py-2 w-full" />
            </div>
            <div>
              <label className="block text-sm">City</label>
              <input name="city" required className="border rounded px-3 py-2 w-full" />
            </div>
            <div>
              <label className="block text-sm">Province</label>
              <select
                name="province_code"
                className="border rounded px-3 py-2 w-full bg-white"
                defaultValue=""
              >
                <option value="">Select province</option>
                {(provinces || []).map((p) => (
                  <option key={p.code} value={p.code ?? ''}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm">Address</label>
              <input name="address" required className="border rounded px-3 py-2 w-full" />
            </div>
            <div>
              <label className="block text-sm">Customer type</label>
              <select
                name="customer_type"
                className="border rounded px-3 py-2 w-full bg-white"
                defaultValue="parlour"
              >
                <option value="parlour">Parlour / Beautician</option>
                <option value="individual">Individual</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm">Notes</label>
              <textarea
                name="notes"
                className="border rounded px-3 py-2 w-full min-h-[80px]"
                placeholder="Optional notes about this manual order (payments, promises, balances, etc.)"
              />
            </div>
          </div>

          <div className="mt-4">
            <h2 className="font-medium mb-2">Shipping</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm">Shipping amount (PKR)</label>
                <input
                  name="shipping_amount"
                  type="number"
                  min={0}
                  step="0.01"
                  className="border rounded px-3 py-2 w-full"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm">Amount paid (PKR)</label>
                <input
                  name="amount_paid"
                  type="number"
                  min={0}
                  step="0.01"
                  className="border rounded px-3 py-2 w-full"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h2 className="font-medium mb-2">Items (up to 5)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="border rounded p-3 space-y-2">
                  <div className="text-sm font-medium">Item {i + 1}</div>
                  <div>
                    <label className="block text-sm">Product (optional)</label>
                    <select
                      name={`items[${i}][product_id]`}
                      className="border rounded px-3 py-2 w-full bg-white"
                      defaultValue=""
                    >
                      <option value="">Select product (optional)</option>
                      {(products || []).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm">Qty</label>
                    <input
                      name={`items[${i}][qty]`}
                      type="number"
                      min={0}
                      className="border rounded px-3 py-2 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm">Price</label>
                    <input
                      name={`items[${i}][price]`}
                      type="number"
                      min={0}
                      step="0.01"
                      className="border rounded px-3 py-2 w-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border rounded p-4 space-y-3">
          <h2 className="font-medium">Actions</h2>
          <p className="text-sm text-gray-600">
            Order will be created with status <span className="font-medium">pending</span>.
          </p>
          <button type="submit" className="bg-black text-white rounded px-4 py-2">
            Create Order
          </button>
        </div>
      </form>

      <div className="border rounded p-4">
        <h2 className="font-medium">New Order Capabilities (This Page)</h2>
        <ul className="list-disc pl-5 text-sm mt-2 space-y-1 text-gray-700">
          <li>Enter customer details (name, phone, email, address, city, province).</li>
          <li>Add up to 5 items with quantity and price.</li>
          <li>Creates the order with status pending and redirects to the order detail page.</li>
        </ul>
      </div>
    </div>
  );
}
