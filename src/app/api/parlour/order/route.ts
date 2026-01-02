import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export async function POST(req: Request) {
  try {
    // Get session
    const cookieStore = cookies();
    const supabaseAuth = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabaseAuth.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();

    // Get user's parlour
    const { data: profile } = await supabase
      .from('profiles')
      .select('parlour_id')
      .eq('id', session.user.id)
      .maybeSingle();

    if (!profile?.parlour_id) {
      return NextResponse.json({ error: 'Not authorized for parlour portal' }, { status: 403 });
    }

    // Get parlour details
    const { data: parlour } = await supabase
      .from('parlours')
      .select('id, name, active, min_order_qty, min_order_value, city, phone, email')
      .eq('id', profile.parlour_id)
      .maybeSingle();

    if (!parlour?.active) {
      return NextResponse.json({ error: 'Parlour account is not active' }, { status: 403 });
    }

    const body = await req.json();
    const { items, payment_method, shipping_amount, shipping_address, shipping_city } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }

    if (!['cod', 'advance'].includes(payment_method)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    // Get variant IDs to check product payment restrictions
    const variantIds = items.map((i: any) => i.variant_id);
    const { data: variantData } = await supabase
      .from('variants')
      .select('id, product_id')
      .in('id', variantIds);
    
    const productIds = Array.from(new Set((variantData || []).map(v => v.product_id)));
    const { data: productData } = await supabase
      .from('products')
      .select('id, name, parlour_allow_cod, parlour_allow_advance')
      .in('id', productIds);
    
    // Validate payment method is allowed by all products
    if (payment_method === 'cod') {
      const restricted = (productData || []).filter(p => p.parlour_allow_cod === false);
      if (restricted.length > 0) {
        return NextResponse.json({ 
          error: `COD not allowed for: ${restricted.map(p => p.name).join(', ')}` 
        }, { status: 400 });
      }
    }
    if (payment_method === 'advance') {
      const restricted = (productData || []).filter(p => p.parlour_allow_advance === false);
      if (restricted.length > 0) {
        return NextResponse.json({ 
          error: `Advance payment not allowed for: ${restricted.map(p => p.name).join(', ')}` 
        }, { status: 400 });
      }
    }

    // Validate items and calculate totals
    let totalQty = 0;
    let totalAmount = 0;
    const orderLines: Array<{
      variant_id: string;
      qty: number;
      unit_price: number;
      line_total: number;
      applied_tier_min_qty: number | null;
    }> = [];

    for (const item of items) {
      const { variant_id, qty, unit_price } = item;

      if (!variant_id || !qty || qty < 1 || !unit_price || unit_price < 0) {
        return NextResponse.json({ error: 'Invalid item data' }, { status: 400 });
      }

      // Check inventory
      const { data: inv } = await supabase
        .from('inventory')
        .select('stock_on_hand, reserved')
        .eq('variant_id', variant_id)
        .maybeSingle();

      const available = inv ? Math.max(0, (inv.stock_on_hand ?? 0) - (inv.reserved ?? 0)) : 0;
      if (available < qty) {
        return NextResponse.json({ error: `Insufficient inventory for variant ${variant_id}` }, { status: 400 });
      }

      totalQty += qty;
      const lineTotal = unit_price * qty;
      totalAmount += lineTotal;

      // Extract applied tier min_qty from the request if provided
      const applied_tier_min_qty = item.applied_tier_min_qty ?? null;
      
      orderLines.push({
        variant_id,
        qty,
        unit_price,
        line_total: lineTotal,
        applied_tier_min_qty,
      });
    }

    // Check minimums
    if (parlour.min_order_qty && totalQty < parlour.min_order_qty) {
      return NextResponse.json({ error: `Minimum order quantity is ${parlour.min_order_qty}` }, { status: 400 });
    }

    if (parlour.min_order_value && totalAmount < parlour.min_order_value) {
      return NextResponse.json({ error: `Minimum order value is PKR ${parlour.min_order_value}` }, { status: 400 });
    }

    // Generate order code
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderCode = `PRL-${timestamp}-${random}`;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_code: orderCode,
        source: 'parlour',
        parlour_id: parlour.id,
        status: 'pending',
        customer_name: parlour.name,
        phone: parlour.phone || '',
        email: parlour.email || '',
        address: shipping_address || parlour.city || '',
        city: shipping_city || parlour.city || '',
        total_amount: totalAmount,
        shipping_amount: shipping_amount || 0,
        grand_total: totalAmount + (shipping_amount || 0),
        amount_paid: 0,
        amount_due: totalAmount + (shipping_amount || 0),
        payment_status: 'unpaid',
        payment_preference: payment_method,
      })
      .select('id')
      .single();

    if (orderError || !order) {
      console.error('Order creation error:', orderError);
      return NextResponse.json({ error: `Failed to create order: ${orderError?.message || 'Unknown error'}` }, { status: 500 });
    }

    // Create order lines and reserve inventory
    for (const line of orderLines) {
      // Insert order line with applied tier info
      await supabase.from('order_lines').insert({
        order_id: order.id,
        variant_id: line.variant_id,
        qty: line.qty,
        unit_price: line.unit_price,
        line_total: line.line_total,
        applied_tier_min_qty: line.applied_tier_min_qty,
      });

      // Reserve inventory - increment the reserved count
      const { data: currentInv } = await supabase
        .from('inventory')
        .select('reserved')
        .eq('variant_id', line.variant_id)
        .single();
      
      const currentReserved = currentInv?.reserved ?? 0;
      await supabase
        .from('inventory')
        .update({ reserved: currentReserved + line.qty })
        .eq('variant_id', line.variant_id);
    }

    return NextResponse.json({
      ok: true,
      order_id: order.id,
      order_code: orderCode,
    });
  } catch (e: any) {
    console.error('Parlour order error:', e);
    return NextResponse.json({ error: e.message || 'Failed to process order' }, { status: 500 });
  }
}
