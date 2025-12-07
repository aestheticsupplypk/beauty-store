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

  if (!customer_name || !phone || !address || !city) {
    console.warn('[manual-order] missing required fields');
    return NextResponse.redirect(new URL('/admin/orders/new2', req.url));
  }

  const items: { qty: number; price: number }[] = [];
  for (let i = 0; i < 5; i++) {
    const qty = parseIntOrZero(formData.get(`items[${i}][qty]`));
    const price = parsePriceOrZero(formData.get(`items[${i}][price]`));
    if (qty > 0 && price >= 0) items.push({ qty, price });
  }

  if (items.length === 0) {
    console.warn('[manual-order] no items with qty > 0');
    return NextResponse.redirect(new URL('/admin/orders/new2', req.url));
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
    unit_price: it.price,
    line_total: it.qty * it.price,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(payload);
  if (itemsError) {
    console.error('[manual-order] failed to insert order_items', itemsError);
    return NextResponse.redirect(new URL('/admin/orders/new2', req.url));
  }

  return NextResponse.redirect(new URL(`/admin/orders/${order.id}`, req.url));
}
