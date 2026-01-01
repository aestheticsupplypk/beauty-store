import Link from 'next/link';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { requireAdmin } from '@/lib/auth';
import { ManualOrderTotalsPreview } from './ManualOrderTotalsPreview';

type ProductRow = { id: string; name: string };
type VariantRow = { id: string; sku: string | null; product_id: string | null };

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

  const { data: variants } = await supabase
    .from('variants')
    .select('id, sku, product_id')
    .order('sku', { ascending: true });

  const productById = new Map<string, ProductRow>();
  (products || []).forEach((p: any) => {
    if (p?.id) {
      productById.set(String(p.id), { id: String(p.id), name: String(p.name || '') });
    }
  });

  const variantOptions: { id: string; label: string }[] = [];
  (variants || []).forEach((v: any) => {
    const vid = String(v.id || '');
    const pid = v.product_id ? String(v.product_id) : '';
    if (!vid || !pid) return;
    const product = productById.get(pid);
    const sku = v.sku ? String(v.sku) : '';
    const name = product?.name || 'Unknown product';
    const label = sku ? `${name} — ${sku}` : name;
    variantOptions.push({ id: vid, label });
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">New Manual Order</h1>
        <Link className="underline" href="/admin/orders">Back to Orders</Link>
      </div>

      {/* This form posts to the manual-create route handler */}
      <form method="post" action="/admin/orders/manual-create" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="border rounded p-4 space-y-3 lg:col-span-2">
          <h2 className="font-medium flex items-center gap-2">
            Customer
            <span
              className="inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] text-gray-600 cursor-help"
              title="Basic details of the customer placing this manual order."
            >
              ?
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm">
                Name
                <span
                  className="ml-1 inline-flex h-3 w-3 items-center justify-center rounded-full border text-[9px] text-gray-600 cursor-help"
                  title="Full name of the customer or parlour contact person."
                >
                  ?
                </span>
              </label>
              <input name="customer_name" required className="border rounded px-3 py-2 w-full" />
            </div>
            <div>
              <label className="block text-sm">
                Phone
                <span
                  className="ml-1 inline-flex h-3 w-3 items-center justify-center rounded-full border text-[9px] text-gray-600 cursor-help"
                  title="Primary WhatsApp or mobile number to reach this customer."
                >
                  ?
                </span>
              </label>
              <input name="phone" required className="border rounded px-3 py-2 w-full" />
            </div>
            <div>
              <label className="block text-sm">
                Email
                <span
                  className="ml-1 inline-flex h-3 w-3 items-center justify-center rounded-full border text-[9px] text-gray-600 cursor-help"
                  title="Email address (optional) for sending order updates or invoices."
                >
                  ?
                </span>
              </label>
              <input name="email" type="email" className="border rounded px-3 py-2 w-full" />
            </div>
            <div>
              <label className="block text-sm">
                City
                <span
                  className="ml-1 inline-flex h-3 w-3 items-center justify-center rounded-full border text-[9px] text-gray-600 cursor-help"
                  title="City where the order will be delivered."
                >
                  ?
                </span>
              </label>
              <input name="city" required className="border rounded px-3 py-2 w-full" />
            </div>
            <div>
              <label className="block text-sm">
                Province
                <span
                  className="ml-1 inline-flex h-3 w-3 items-center justify-center rounded-full border text-[9px] text-gray-600 cursor-help"
                  title="Select the province for shipping and reporting."
                >
                  ?
                </span>
              </label>
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
              <label className="block text-sm">
                Address
                <span
                  className="ml-1 inline-flex h-3 w-3 items-center justify-center rounded-full border text-[9px] text-gray-600 cursor-help"
                  title="Full delivery address (street, block, area, etc.)."
                >
                  ?
                </span>
              </label>
              <input name="address" required className="border rounded px-3 py-2 w-full" />
            </div>
            <div>
              <label className="block text-sm">
                Customer type
                <span
                  className="ml-1 inline-flex h-3 w-3 items-center justify-center rounded-full border text-[9px] text-gray-600 cursor-help"
                  title="Choose whether this is a parlour/beautician or an individual consumer."
                >
                  ?
                </span>
              </label>
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
              <label className="block text-sm">
                Notes
                <span
                  className="ml-1 inline-flex h-3 w-3 items-center justify-center rounded-full border text-[9px] text-gray-600 cursor-help"
                  title="Any special promises, balance agreements, or internal notes for this order."
                >
                  ?
                </span>
              </label>
              <textarea
                name="notes"
                className="border rounded px-3 py-2 w-full min-h-[80px]"
                placeholder="Optional notes about this manual order (payments, promises, balances, etc.)"
              />
            </div>
          </div>

          <div className="mt-4">
            <h2 className="font-medium mb-2 flex items-center gap-2">
              Shipping & Payments
              <span
                className="inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] text-gray-600 cursor-help"
                title="Record shipping charges and any amount paid upfront by the customer."
              >
                ?
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm">
                  Shipping amount (PKR)
                  <span
                    className="ml-1 inline-flex h-3 w-3 items-center justify-center rounded-full border text-[9px] text-gray-600 cursor-help"
                    title="Total delivery charge in PKR for this order."
                  >
                    ?
                  </span>
                </label>
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
                <label className="block text-sm">
                  Amount paid (PKR)
                  <span
                    className="ml-1 inline-flex h-3 w-3 items-center justify-center rounded-full border text-[9px] text-gray-600 cursor-help"
                    title="How much the customer has already paid (e.g. advance). Can be 0."
                  >
                    ?
                  </span>
                </label>
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
            <h2 className="font-medium mb-2 flex items-center gap-2">
              Items (up to 5)
              <span
                className="inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] text-gray-600 cursor-help"
                title="Add the products being sold in this manual order. Price is per piece; totals are calculated from Qty × Price."
              >
                ?
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="border rounded p-3 space-y-2">
                  <div className="text-sm font-medium">Item {i + 1}</div>
                  <div>
                    <label className="block text-sm">
                      Product (optional)
                      <span
                        className="ml-1 inline-flex h-3 w-3 items-center justify-center rounded-full border text-[9px] text-gray-600 cursor-help"
                        title="Select a catalog product for this line (optional). You can still enter Qty and Price without selecting a product."
                      >
                        ?
                      </span>
                    </label>
                    <select
                      name={`items[${i}][product_id]`}
                      className="border rounded px-3 py-2 w-full bg-white"
                      defaultValue=""
                    >
                      <option value="">Select product (optional)</option>
                      {(products || []).map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm">
                      Variant / SKU (optional)
                      <span
                        className="ml-1 inline-flex h-3 w-3 items-center justify-center rounded-full border text-[9px] text-gray-600 cursor-help"
                        title="Choose the specific variant / SKU for inventory tracking. Only lines with a variant will adjust stock."
                      >
                        ?
                      </span>
                    </label>
                    <select
                      name={`items[${i}][variant_id]`}
                      className="border rounded px-3 py-2 w-full bg-white"
                      defaultValue=""
                    >
                      <option value="">Select variant (optional)</option>
                      {variantOptions.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm">
                      Qty
                      <span
                        className="ml-1 inline-flex h-3 w-3 items-center justify-center rounded-full border text-[9px] text-gray-600 cursor-help"
                        title="Number of pieces for this line item. Must be greater than 0 to count."
                      >
                        ?
                      </span>
                    </label>
                    <input
                      name={`items[${i}][qty]`}
                      type="number"
                      min={0}
                      className="border rounded px-3 py-2 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm">
                      Price per piece (PKR)
                      <span
                        className="ml-1 inline-flex h-3 w-3 items-center justify-center rounded-full border text-[9px] text-gray-600 cursor-help"
                        title="Price for a single piece in PKR. Line total will be Qty × Price per piece."
                      >
                        ?
                      </span>
                    </label>
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
          <ManualOrderTotalsPreview />
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
