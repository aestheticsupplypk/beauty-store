import { requireAdmin } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import OrderPaymentsForm from './OrderPaymentsForm';

async function fetchOrder(id: string) {
  const supabase = getSupabaseServerClient();
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, status, customer_name, email, phone, address, city, province_code, created_at, shipping_amount, source, total_amount, grand_total, amount_paid, amount_due, affiliate_id, affiliate_ref_code, affiliate_commission_amount')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!order) return null;

  // Fetch order lines with variant SKU
  const { data: lines, error: linesError } = await supabase
    .from('order_lines')
    .select('id, order_id, variant_id, qty, unit_price, line_total, returned_qty, return_status, variants!inner(sku)')
    .eq('order_id', id);
  if (linesError) throw linesError;

  const source = String((order as any).source || 'online');
  const shipping = Number((order as any).shipping_amount || 0);

  let subtotal: number;
  let total: number;

  if (source === 'manual') {
    // For manual orders, use precomputed totals on the order row
    subtotal = Number((order as any).total_amount || 0);
    total = Number((order as any).grand_total || subtotal + shipping);
  } else {
    subtotal = (lines ?? []).reduce((sum, it: any) => sum + Number(it.line_total || 0), 0);
    total = subtotal + shipping;
  }

  const amount_paid = Number((order as any).amount_paid || 0);
  const amount_due = Number((order as any).amount_due ?? (total - amount_paid));

  // Fetch payments history (if any)
  const { data: payments } = await supabase
    .from('order_payments')
    .select('id, amount, method, note, received_at, created_at')
    .eq('order_id', id)
    .order('received_at', { ascending: true });

  return { order, items: lines ?? [], total, subtotal, shipping, amount_paid, amount_due, payments: payments ?? [] } as const;
}

async function addPayment(formData: FormData) {
  'use server';
  const id = String(formData.get('order_id') || '');
  const rawAmount = String(formData.get('amount') || '').trim();
  const method = String(formData.get('method') || 'cash').trim() || 'cash';
  const note = String(formData.get('note') || '').trim() || null;

  const amount = Number(rawAmount || 0);
  if (!id || !amount || amount <= 0 || !Number.isFinite(amount)) {
    // Silently ignore invalid submissions
    revalidatePath(`/admin/orders/${id}`);
    return;
  }

  const supabase = getSupabaseServerClient();

  // Load current order totals
  const { data: order } = await supabase
    .from('orders')
    .select('id, grand_total, amount_paid, amount_due')
    .eq('id', id)
    .maybeSingle();
  if (!order) {
    revalidatePath(`/admin/orders/${id}`);
    return;
  }

  const grandTotal = Number((order as any).grand_total || 0);
  const prevPaid = Number((order as any).amount_paid || 0);
  const prevDue = Number((order as any).amount_due || 0);
  const totalForDue = grandTotal > 0 ? grandTotal : prevPaid + prevDue;

  // If already fully paid, ignore additional payments
  if (totalForDue <= 0 || prevPaid >= totalForDue) {
    revalidatePath(`/admin/orders/${id}`);
    return;
  }

  // Clamp payment so we never go over the remaining balance
  const remainingBefore = Math.max(0, totalForDue - prevPaid);
  const effectiveAmount = Math.min(amount, remainingBefore);
  if (!effectiveAmount || effectiveAmount <= 0) {
    revalidatePath(`/admin/orders/${id}`);
    return;
  }

  const newPaid = prevPaid + effectiveAmount;
  const newDue = Math.max(0, totalForDue - newPaid);

  let payment_status: string = 'unpaid';
  if (newPaid <= 0) payment_status = 'unpaid';
  else if (newDue <= 0) payment_status = 'paid';
  else payment_status = 'partial';

  // Insert payment + update order in a best-effort way
  await supabase.from('order_payments').insert({
    order_id: id,
    amount: effectiveAmount,
    method,
    note,
  } as any);

  await supabase
    .from('orders')
    .update({
      amount_paid: newPaid,
      amount_due: newDue,
      payment_status,
    })
    .eq('id', id);

  revalidatePath(`/admin/orders/${id}`);
  revalidatePath('/admin/orders');
}

async function returnLineAction(formData: FormData) {
  'use server';
  await requireAdmin();

  const orderId = String(formData.get('order_id') || '');
  const lineId = String(formData.get('line_id') || '');
  const action = String(formData.get('action') || 'good');
  const rawQty = String(formData.get('qty') || '').trim();

  const qtyRequested = Number(rawQty || 0);
  if (!orderId || !lineId || !Number.isFinite(qtyRequested) || qtyRequested <= 0) {
    revalidatePath(`/admin/orders/${orderId}`);
    return;
  }

  const kind: 'good' | 'damaged' | 'lost' =
    action === 'damaged' || action === 'lost' ? (action as any) : 'good';

  const supabase = getSupabaseServerClient();

  // Load line and ensure it belongs to a shipped order
  const { data: lineRow, error: lineErr } = await supabase
    .from('order_lines')
    .select('id, order_id, variant_id, qty, returned_qty, return_status, orders!inner(status)')
    .eq('id', lineId)
    .maybeSingle();
  if (lineErr || !lineRow) {
    revalidatePath(`/admin/orders/${orderId}`);
    return;
  }

  const totalQty = Number((lineRow as any).qty || 0);
  const prevReturned = Number((lineRow as any).returned_qty || 0);
  const remaining = Math.max(0, totalQty - prevReturned);

  if (remaining <= 0) {
    revalidatePath(`/admin/orders/${orderId}`);
    return;
  }

  const applyQty = Math.min(remaining, qtyRequested);
  if (!applyQty || applyQty <= 0) {
    revalidatePath(`/admin/orders/${orderId}`);
    return;
  }

  const newReturned = prevReturned + applyQty;
  let newStatus: string = (lineRow as any).return_status || 'none';
  if (kind === 'good') newStatus = 'returned_good';
  else if (kind === 'damaged') newStatus = 'returned_damaged';
  else if (kind === 'lost') newStatus = 'returned_lost';

  // Update line first
  await supabase
    .from('order_lines')
    .update({ returned_qty: newReturned, return_status: newStatus })
    .eq('id', lineId);

  // For good returns, put stock back via adjust_stock RPC using the SKU
  if (kind === 'good') {
    const vid = (lineRow as any).variant_id as string | null;
    if (vid) {
      const { data: variant } = await supabase
        .from('variants')
        .select('sku')
        .eq('id', vid)
        .maybeSingle();
      const sku = (variant as any)?.sku as string | undefined;
      if (sku) {
        await supabase.rpc('adjust_stock', {
          p_sku: sku,
          p_delta: applyQty,
          p_reason: 'return_good',
        });
      }
    }
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/admin/inventory');
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const id = params.id;
  const result = await fetchOrder(id);

  if (!result) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Order #{id}</h1>
        <p className="text-gray-600">Order not found.</p>
        <Link className="underline" href="/admin/orders">Back to Orders</Link>
      </div>
    );
  }

  const { order, items, total, subtotal, shipping, amount_paid, amount_due, payments } = result as any;

  const paymentStatus: string = (order as any).payment_status || (amount_due > 0 ? (amount_paid > 0 ? 'partial' : 'unpaid') : 'paid');
  const paymentBadge = (status: string) => {
    const s = String(status || '').toLowerCase();
    let colors = 'bg-gray-100 text-gray-800 border-gray-200';
    if (s === 'paid') colors = 'bg-green-100 text-green-800 border-green-200';
    else if (s === 'partial') colors = 'bg-amber-100 text-amber-800 border-amber-200';
    else if (s === 'unpaid') colors = 'bg-red-100 text-red-800 border-red-200';
    return (
      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${colors}`}>
        {s || 'unknown'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Order #{order.order_code || order.id}</h1>
          {paymentBadge(paymentStatus)}
        </div>
        <Link className="underline" href="/admin/orders">Back to Orders</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="border rounded p-4 lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Created</div>
              <div className="font-medium">{new Date(order.created_at as any).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-600">Status</div>
              <div className="font-medium capitalize">{order.status}</div>
            </div>
            <div>
              <div className="text-gray-600">Payment</div>
              <div className="mt-0.5">{paymentBadge(paymentStatus)}</div>
            </div>
          </div>

          <div>
            <h2 className="font-medium mb-2">Customer</h2>
            <div className="text-sm">
              <div className="font-medium">{order.customer_name}</div>
              <div>{order.email || '-'}</div>
              <div>{order.phone}</div>
              <div>{order.address}</div>
              <div>
                {order.city} {order.province_code ? `(${order.province_code})` : ''}
              </div>
            </div>
          </div>

          {order.affiliate_ref_code || order.affiliate_commission_amount ? (
            <div>
              <h2 className="font-medium mb-2">Affiliate</h2>
              <div className="text-sm space-y-1">
                <div>
                  <span className="text-gray-600">Code: </span>
                  <span className="font-medium">{order.affiliate_ref_code || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Commission: </span>
                  <span className="font-medium">{Number(order.affiliate_commission_amount || 0).toLocaleString()} PKR</span>
                </div>
              </div>
            </div>
          ) : null}

          <div>
            <h2 className="font-medium mb-2">Items</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">SKU</th>
                    <th className="py-2 pr-4">Qty</th>
                    <th className="py-2 pr-4">Unit Price</th>
                    <th className="py-2 pr-4">Line Total</th>
                    <th className="py-2 pr-4">Returns</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it: any) => {
                    const returnedQty = Number(it.returned_qty || 0);
                    const status = String(it.return_status || 'none');
                    const remaining = Math.max(0, Number(it.qty || 0) - returnedQty);
                    const hasReturn = returnedQty > 0 && status !== 'none';
                    const statusLabel =
                      status === 'returned_good'
                        ? 'Returned to stock'
                        : status === 'returned_damaged'
                        ? 'Damaged / written off'
                        : status === 'returned_lost'
                        ? 'Lost / written off'
                        : '';

                    return (
                      <tr key={it.id} className="border-b align-top">
                        <td className="py-2 pr-4">{it.variants?.sku || it.variant_id}</td>
                        <td className="py-2 pr-4">{it.qty}</td>
                        <td className="py-2 pr-4">{Number(it.unit_price).toLocaleString()} PKR</td>
                        <td className="py-2 pr-4">{Number(it.line_total).toLocaleString()} PKR</td>
                        <td className="py-2 pr-4">
                          {hasReturn && (
                            <div className="mb-1 text-xs text-gray-700">
                              <div>
                                Returned: <span className="font-medium">{returnedQty}</span>
                              </div>
                              <div className="italic">{statusLabel}</div>
                            </div>
                          )}
                          {remaining > 0 && (
                            <form action={returnLineAction} className="flex flex-col gap-1 text-xs border rounded p-2 bg-gray-50">
                              <input type="hidden" name="order_id" value={order.id} />
                              <input type="hidden" name="line_id" value={it.id} />
                              <label className="flex flex-col gap-1">
                                <span>Action</span>
                                <select name="action" className="border rounded px-2 py-1 bg-white">
                                  <option value="good">Return to inventory</option>
                                  <option value="damaged">Write off as damaged</option>
                                  <option value="lost">Write off as lost</option>
                                </select>
                              </label>
                              <label className="flex flex-col gap-1 mt-1">
                                <span>
                                  Qty (max {remaining})
                                </span>
                                <input
                                  name="qty"
                                  type="number"
                                  min={1}
                                  max={remaining}
                                  defaultValue={remaining}
                                  className="border rounded px-2 py-1"
                                />
                              </label>
                              <button className="mt-2 bg-black text-white rounded px-2 py-1 text-xs" type="submit">
                                Apply
                              </button>
                            </form>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="py-2 pr-4" colSpan={3}>Items subtotal</td>
                    <td className="py-2 pr-4">{Number(subtotal || 0).toLocaleString()} PKR</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4" colSpan={3}>Shipping</td>
                    <td className="py-2 pr-4">{Number(shipping || 0).toLocaleString()} PKR</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium" colSpan={3}>Total</td>
                    <td className="py-2 pr-4 font-medium">{Number(total || 0).toLocaleString()} PKR</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4" colSpan={3}>Amount paid</td>
                    <td className="py-2 pr-4">{Number(amount_paid || 0).toLocaleString()} PKR</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium" colSpan={3}>Balance owing</td>
                    <td className="py-2 pr-4 font-medium">{Number(amount_due || 0).toLocaleString()} PKR</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border rounded p-4 space-y-4">
            <h2 className="font-medium">Update Status</h2>
            <StatusForm id={String(order.id)} currentStatus={String(order.status)} />

            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Actions</h3>
              <div className="flex items-center gap-3 text-sm">
                <Link className="underline" href={`/admin/orders/${order.id}/packing-slip`}>Print Packing Slip</Link>
              </div>
            </div>
          </div>

          <div className="border rounded p-4 space-y-3">
            <h2 className="font-medium">Payments</h2>
            <div className="text-sm text-gray-700 space-y-1">
              <div className="flex justify-between">
                <span>Total</span>
                <span>{Number(total || 0).toLocaleString()} PKR</span>
              </div>
              <div className="flex justify-between">
                <span>Paid</span>
                <span>{Number(amount_paid || 0).toLocaleString()} PKR</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Balance owing</span>
                <span>{Number(amount_due || 0).toLocaleString()} PKR</span>
              </div>
            </div>

            <OrderPaymentsForm orderId={String(order.id)} action={addPayment} remaining={Number(amount_due || 0)} />

            <div className="mt-4">
              <h3 className="font-medium text-sm mb-1">Payment history</h3>
              {payments.length === 0 ? (
                <p className="text-xs text-gray-500">No payments recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-1 pr-2">Date</th>
                        <th className="py-1 pr-2">Amount</th>
                        <th className="py-1 pr-2">Method</th>
                        <th className="py-1 pr-2">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...payments].sort((a: any, b: any) => new Date(b.received_at || b.created_at).getTime() - new Date(a.received_at || a.created_at).getTime()).map((p: any) => (
                        <tr key={p.id} className="border-b last:border-0">
                          <td className="py-1 pr-2 whitespace-nowrap">{new Date(p.received_at || p.created_at).toLocaleString()}</td>
                          <td className="py-1 pr-2 whitespace-nowrap">{Number(p.amount || 0).toLocaleString()} PKR</td>
                          <td className="py-1 pr-2 capitalize">{p.method || '-'}</td>
                          <td className="py-1 pr-2 max-w-[220px] truncate" title={p.note || ''}>{p.note || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

async function updateStatusAction(formData: FormData) {
  'use server';
  const id = String(formData.get('id') || '');
  const status = String(formData.get('status') || '');
  await requireAdmin();

  if (!id || !status) {
    return { ok: false, message: 'Missing id or status' } as const;
  }

  const allowed = ['pending', 'packed', 'shipped', 'cancelled'];
  if (!allowed.includes(status)) {
    return { ok: false, message: 'Invalid status' } as const;
  }

  const supabase = getSupabaseServerClient();

  // Fetch current status and items to compute inventory deltas
  const { data: existing, error: fetchErr } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', id)
    .maybeSingle();
  if (fetchErr) return { ok: false, message: fetchErr.message } as const;
  const fromStatus = String(existing?.status || 'pending');

  // If no change, do nothing
  if (fromStatus === status) {
    return { ok: true } as const;
  }

  const { data: items, error: itemsErr } = await supabase
    .from('order_lines')
    .select('variant_id, qty')
    .eq('order_id', id);
  if (itemsErr) return { ok: false, message: itemsErr.message } as const;

  // Update order status first
  const { error: updErr } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id);
  if (updErr) return { ok: false, message: updErr.message } as const;

  // Compute inventory adjustments based on transition
  // Rules:
  // - pending -> cancelled: reserved -= qty
  // - pending/packed -> shipped: reserved -= qty, on_hand -= qty
  // - cancelled -> pending: reserved += qty (re-activate)
  // Other transitions: no-op
  const from = fromStatus.toLowerCase();
  const to = status.toLowerCase();

  const shouldUnreserve = (from === 'pending' && to === 'cancelled') || (from === 'pending' && to === 'shipped') || (from === 'packed' && to === 'shipped');
  const shouldShip = (to === 'shipped') && (from === 'pending' || from === 'packed');
  const shouldReReserve = (from === 'cancelled' && to === 'pending');

  for (const it of (items || [])) {
    const vid = (it as any).variant_id as string;
    const qty = Number((it as any).qty || 0);
    if (!vid || !qty) continue;

    // Read current inventory row
    const { data: cur } = await supabase
      .from('inventory')
      .select('stock_on_hand, reserved')
      .eq('variant_id', vid)
      .maybeSingle();
    let on = Number(cur?.stock_on_hand || 0);
    let res = Number(cur?.reserved || 0);

    if (shouldUnreserve) {
      res = Math.max(0, res - qty);
    }
    if (shouldReReserve) {
      res = res + qty;
    }
    if (shouldShip) {
      // Reduce physical stock; keep non-negative and not below reserved
      on = Math.max(res, on - qty);
    }

    await supabase
      .from('inventory')
      .upsert({ variant_id: vid, stock_on_hand: on, reserved: res }, { onConflict: 'variant_id' });
  }

  revalidatePath(`/admin/orders/${id}`);
  return { ok: true } as const;
}

function StatusForm({ id, currentStatus }: { id: string; currentStatus: string }) {
  return (
    <form action={updateStatusAction} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <div>
        <label className="block text-sm">Status</label>
        <select name="status" defaultValue={currentStatus} className="border rounded px-3 py-2 w-full">
          <option value="pending">Pending</option>
          <option value="packed">Packed</option>
          <option value="shipped">Shipped</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <button className="bg-black text-white rounded px-4 py-2">Save</button>
    </form>
  );
}
