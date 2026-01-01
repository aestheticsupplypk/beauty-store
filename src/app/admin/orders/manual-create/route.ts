import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

function parseIntOrZero(v: FormDataEntryValue | null): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function parsePriceOrZero(v: FormDataEntryValue | null): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function makePrefix(source: string, length: number): string {
  const cleaned = (source || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
  if (!cleaned) return '';
  return cleaned.slice(0, length).padEnd(length, 'X');
}

export async function POST(req: Request) {
  await requireAdmin();
  const supabase = getSupabaseServerClient();

  const formData = await req.formData();

  const customer_name = String(formData.get('customer_name') || '').trim();
  const phone = String(formData.get('phone') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const address = String(formData.get('address') || '').trim();
  const city = String(formData.get('city') || '').trim();
  const province_code = String(formData.get('province_code') || '').trim();
  const notes = String(formData.get('notes') || '').trim();
  const shipping_amount = Number(formData.get('shipping_amount') || 0) || 0;
  const initial_amount_paid = Number(formData.get('amount_paid') || 0) || 0;

  if (!customer_name || !phone || !address || !city) {
    console.warn('[manual-order] missing required fields');
    return NextResponse.redirect(new URL('/admin/orders/new2', req.url));
  }

  const items: { qty: number; price: number; product_id: string | null; variant_id: string | null }[] = [];
  for (let i = 0; i < 5; i++) {
    const qty = parseIntOrZero(formData.get(`items[${i}][qty]`));
    const price = parsePriceOrZero(formData.get(`items[${i}][price]`));
    const rawProductId = String(formData.get(`items[${i}][product_id]`) || '').trim();
    const rawVariantId = String(formData.get(`items[${i}][variant_id]`) || '').trim();
    const product_id = rawProductId || null;
    const variant_id = rawVariantId || null;
    if (qty > 0 && price >= 0) items.push({ qty, price, product_id, variant_id });
  }

  // If a product is selected but no variant is chosen, try to auto-resolve when there is exactly one variant.
  // If there are multiple variants and none is chosen, we block to avoid ambiguous inventory deductions.
  const productIdsNeedingVariant = Array.from(
    new Set(
      items
        .filter((it) => it.product_id && !it.variant_id)
        .map((it) => String(it.product_id))
    )
  );

  if (productIdsNeedingVariant.length > 0) {
    const { data: variantRows, error: vErr } = await supabase
      .from('variants')
      .select('id, product_id')
      .in('product_id', productIdsNeedingVariant);

    if (vErr) {
      console.error('[manual-order] failed to resolve variants for products', vErr);
      return NextResponse.redirect(new URL('/admin/orders/new2', req.url));
    }

    const variantsByProduct = new Map<string, string[]>();
    (variantRows || []).forEach((row: any) => {
      const pid = String(row.product_id || '');
      const vid = String(row.id || '');
      if (!pid || !vid) return;
      const list = variantsByProduct.get(pid) || [];
      list.push(vid);
      variantsByProduct.set(pid, list);
    });

    for (const it of items) {
      if (!it.product_id || it.variant_id) continue;
      const pid = String(it.product_id);
      const list = variantsByProduct.get(pid) || [];
      if (list.length === 1) {
        // Auto-attach the single variant for convenience
        it.variant_id = list[0];
      } else if (list.length > 1) {
        console.warn(
          '[manual-order] product has multiple variants but no variant selected; blocking order creation',
          { product_id: pid }
        );
        return NextResponse.redirect(new URL('/admin/orders/new2', req.url));
      }
      // If list.length === 0, leave variant_id as null (no inventory effect)
    }
  }

  if (items.length === 0) {
    console.warn('[manual-order] no items with qty > 0');
    return NextResponse.redirect(new URL('/admin/orders/new2', req.url));
  }

  // Subtotal is the sum of (qty * pricePerPiece) for each line
  const itemsSubtotal = items.reduce((sum, it) => sum + it.qty * it.price, 0);
  const grand_total = itemsSubtotal + shipping_amount;
  const amount_paid = Math.min(initial_amount_paid, grand_total);
  const amount_due = grand_total - amount_paid;

  // Generate a short human-friendly order code like FAI-MUL-001
  let order_code: string | undefined;
  try {
    const namePrefix = makePrefix(customer_name, 3) || 'CUS';
    const cityPrefix = makePrefix(city, 3) || 'CTY';
    const base = `${namePrefix}-${cityPrefix}`;

    const { count } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .ilike('order_code', `${base}-%`);

    const nextNumber = (count ?? 0) + 1;
    const suffix = String(nextNumber).padStart(3, '0');
    order_code = `${base}-${suffix}`;
  } catch (e) {
    // If anything goes wrong (e.g. column missing), skip setting order_code
    console.warn('[manual-order] failed to generate order_code', e);
  }

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      customer_name,
      phone,
      email,
      address,
      city,
      province_code,
      status: 'pending',
      source: 'manual',
      payment_status: 'unpaid',
      total_amount: itemsSubtotal,
      shipping_amount,
      grand_total,
      amount_paid,
      amount_due,
      // order_code is optional and will be ignored by Supabase if the column doesn't exist yet
      ...(order_code ? { order_code } : {}),
      notes: notes || null,
    })
    .select('id')
    .maybeSingle();

  if (error || !order) {
    console.error('[manual-order] failed to create order', error);
    return NextResponse.redirect(new URL('/admin/orders/new2', req.url));
  }

  const payload = items.map((it) => ({
    order_id: order.id,
    quantity: it.qty,
    // Price is per-piece; line_total is qty * pricePerPiece
    unit_price: it.price,
    line_total: it.qty * it.price,
    // product_id / variant_id columns are optional; Supabase will ignore them if they don't exist
    product_id: it.product_id,
    variant_id: it.variant_id,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(payload as any[]);
  if (itemsError) {
    console.error('[manual-order] failed to insert order_items', itemsError);
    return NextResponse.redirect(new URL('/admin/orders/new2', req.url));
  }

  // Create order_lines for any line that has a variant_id so that inventory and packing slips work consistently
  const lines = items
    .filter((it) => it.variant_id && it.qty > 0)
    .map((it) => ({
      order_id: order.id,
      variant_id: it.variant_id!,
      qty: it.qty,
      unit_price: it.price,
      line_total: it.qty * it.price,
    }));

  if (lines.length > 0) {
    const { error: linesError } = await supabase.from('order_lines').insert(lines as any[]);
    if (linesError) {
      console.error('[manual-order] failed to insert order_lines', linesError);
      return NextResponse.redirect(new URL('/admin/orders/new2', req.url));
    }

    // Reserve inventory at order creation: increase inventory.reserved for each variant
    for (const ln of lines) {
      const vid = ln.variant_id as string;
      const qty = ln.qty;
      if (!vid || !qty || qty <= 0) continue;

      const { data: cur } = await supabase
        .from('inventory')
        .select('stock_on_hand, reserved')
        .eq('variant_id', vid)
        .maybeSingle();

      const currentOnHand = Number((cur as any)?.stock_on_hand ?? 0);
      const currentReserved = Number((cur as any)?.reserved ?? 0);

      const { error: invErr } = await supabase
        .from('inventory')
        .upsert(
          {
            variant_id: vid,
            stock_on_hand: currentOnHand,
            reserved: currentReserved + qty,
          } as any,
          { onConflict: 'variant_id' }
        );

      if (invErr) {
        console.error('[manual-order] failed to reserve inventory', invErr);
        return NextResponse.redirect(new URL('/admin/orders/new2', req.url));
      }
    }
  }

  return NextResponse.redirect(new URL(`/admin/orders/${order.id}`, req.url));
}
