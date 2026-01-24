import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabaseService';
import crypto from 'crypto';
import { cookies } from 'next/headers';

/*
Expected payload (JSON):
{
  "customer": {
    "name": string,
    "email"?: string,
    "phone": string,
    "address": string,
    "city": string,
    "province_code"?: string
  },
  "utm"?: {
    "source"?: string,
    "medium"?: string,
    "campaign"?: string
  },
  "items": [
    { "variant_id": string, "qty": number }
  ]
}
*/

export async function POST(req: Request) {
  try {
    // Debug: confirm env visibility at runtime (safe: does not print secret values)
    try {
      console.log('[orders/create] env check', {
        HAS_RESEND_KEY: !!process.env.RESEND_API_KEY,
        RESEND_FROM: process.env.RESEND_FROM,
        OWNER_EMAIL: process.env.OWNER_EMAIL,
      });
    } catch {}
    // Use privileged client (service role) on the server to bypass RLS during order creation
    // Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
    const supabase = getSupabaseServiceClient();
    const body = await req.json();

    // Basic validation
    const items = (body?.items ?? []) as Array<{ variant_id: string; qty: number }>;
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }
    const customer = body?.customer || {};
    if (!customer.name || !customer.phone || !customer.address || !customer.city) {
      return NextResponse.json({ error: 'Missing required customer fields' }, { status: 400 });
    }

    const shippingAmount = Number((body?.shipping?.amount as any) || 0);

    // Affiliate / referral code handling (optional)
    // Priority: 1) ref_code from request body, 2) aff_ref cookie (set by /r/[code] route)
    const cookieStore = cookies();
    const cookieRef = cookieStore.get('aff_ref')?.value || '';
    const rawRef = String(body?.ref_code || cookieRef || '').trim().toUpperCase();
    let affiliateId: string | null = null;
    let affiliateRefCode: string | null = null;

    if (rawRef) {
      const { data: aff, error: affErr } = await supabase
        .from('affiliates')
        .select('id, code, active, status')
        .eq('code', rawRef)
        .maybeSingle();
      if (affErr) {
        console.error('[orders/create] affiliate lookup error', affErr.message);
      } else if (aff) {
        const affStatus = (aff as any).status || 'active';
        const isActive = (aff as any).active && affStatus !== 'suspended' && affStatus !== 'revoked';
        if (isActive) {
          affiliateId = String((aff as any).id);
          affiliateRefCode = String((aff as any).code || rawRef);
        }
      }
    }

    // Inline implementation of order placement (replacing missing place_order RPC)
    // 1) Fetch variant pricing
    const variantIds = Array.from(new Set(items.map((it) => it.variant_id))); 
    const { data: variantRows, error: variantErr } = await supabase
      .from('variants')
      .select('id, sku, price, product_id')
      .in('id', variantIds);
    if (variantErr) {
      return NextResponse.json({ error: variantErr.message }, { status: 400 });
    }
    const variantMap: Record<string, { id: string; sku?: string | null; price: number; product_id?: string | null }> = {};
    for (const v of variantRows || []) {
      const vv = v as any;
      variantMap[String(vv.id)] = {
        id: String(vv.id),
        sku: vv.sku || null,
        price: Number(vv.price || 0),
        product_id: vv.product_id || null,
      };
    }

    // 2) Fetch product-level affiliate settings (if any affiliate code present)
    const productIdsSet = new Set<string>();
    for (const v of Object.values(variantMap)) {
      const pid = v.product_id as string | undefined;
      if (pid) productIdsSet.add(pid);
    }

    type ProductAffRow = {
      id: string;
      affiliate_enabled: boolean | null;
      affiliate_discount_type: 'none' | 'percent' | 'fixed' | null;
      affiliate_discount_value: number | null;
      affiliate_commission_type: 'percent' | 'fixed' | null;
      affiliate_commission_value: number | null;
    };

    const productAffMap: Record<string, ProductAffRow> = {};
    if (productIdsSet.size > 0) {
      const { data: productRows, error: prodErr } = await supabase
        .from('products')
        .select('id, affiliate_enabled, affiliate_discount_type, affiliate_discount_value, affiliate_commission_type, affiliate_commission_value')
        .in('id', Array.from(productIdsSet));
      if (prodErr) {
        console.error('[orders/create] product affiliate fetch error', prodErr.message);
      } else {
        for (const p of productRows || []) {
          const pp = p as any;
          productAffMap[String(pp.id)] = {
            id: String(pp.id),
            affiliate_enabled: !!pp.affiliate_enabled,
            affiliate_discount_type: (pp.affiliate_discount_type || 'none') as any,
            affiliate_discount_value: pp.affiliate_discount_value != null ? Number(pp.affiliate_discount_value) : null,
            affiliate_commission_type: (pp.affiliate_commission_type || 'percent') as any,
            affiliate_commission_value: pp.affiliate_commission_value != null ? Number(pp.affiliate_commission_value) : null,
          };
        }
      }
    }

    // 3) Fetch affiliate tier (if affiliate present)
    let tierMultiplier = 100; // Default 100% (no change)
    let tierId: string | null = null;
    let tierName: string | null = null;

    if (affiliateId) {
      // Get affiliate's delivered order count in last 30 days
      const { data: tierData, error: tierErr } = await supabase.rpc('get_affiliate_tier', { p_affiliate_id: affiliateId });
      
      if (!tierErr && tierData && tierData.length > 0) {
        const t = tierData[0];
        tierId = t.tier_id || null;
        tierName = t.tier_name || null;
        tierMultiplier = t.multiplier_percent || 100;
        console.log(`[orders/create] Affiliate ${affiliateId} tier: ${tierName} (${tierMultiplier}%), delivered_30d: ${t.delivered_count_30d}`);
      } else {
        // Fallback: try to get default tier (min_delivered_orders_30d = 0)
        const { data: defaultTier } = await supabase
          .from('affiliate_tiers')
          .select('id, name, multiplier_percent')
          .eq('active', true)
          .eq('min_delivered_orders_30d', 0)
          .maybeSingle();
        
        if (defaultTier) {
          tierId = (defaultTier as any).id;
          tierName = (defaultTier as any).name;
          tierMultiplier = (defaultTier as any).multiplier_percent || 100;
        }
      }
    }

    // 4) Build order_lines + compute discounted subtotal and total commission
    const linePayload: Array<{ order_id?: string; variant_id: string; qty: number; unit_price: number; line_total: number }> = [];
    let itemsSubtotalCustomer = 0;
    let totalBaseCommission = 0;
    let totalCommission = 0;
    let totalBasePriceForCommission = 0; // Sum of base prices used for commission calculation
    
    // Track commission type/value for snapshot (use first product's settings as representative)
    let snapshotCommissionType: 'percent' | 'fixed' | null = null;
    let snapshotCommissionValue: number | null = null;

    for (const it of items) {
      const v = variantMap[it.variant_id];
      if (!v) {
        return NextResponse.json({ error: `Variant not found: ${it.variant_id}` }, { status: 400 });
      }
      const qty = Number(it.qty || 0);
      if (!qty || qty <= 0) continue;

      const baseUnit = Number(v.price || 0);
      let discountPerUnit = 0;
      let commissionPerUnit = 0;

      const pid = (v.product_id || null) as string | null;
      const settings = pid ? productAffMap[pid] : undefined;

      if (affiliateId && settings && settings.affiliate_enabled) {
        const dType = (settings.affiliate_discount_type || 'none') as 'none' | 'percent' | 'fixed';
        const dVal = settings.affiliate_discount_value != null ? Number(settings.affiliate_discount_value) : 0;
        if (dType === 'percent' && dVal > 0) {
          discountPerUnit = baseUnit * (dVal / 100);
        } else if (dType === 'fixed' && dVal > 0) {
          discountPerUnit = dVal;
        }

        const cType = (settings.affiliate_commission_type || 'percent') as 'percent' | 'fixed';
        const cVal = settings.affiliate_commission_value != null ? Number(settings.affiliate_commission_value) : 0;
        if (cType === 'percent' && cVal > 0) {
          commissionPerUnit = baseUnit * (cVal / 100);
          totalBasePriceForCommission += baseUnit * qty;
        } else if (cType === 'fixed' && cVal > 0) {
          commissionPerUnit = cVal;
        }
        
        // Capture first product's commission settings for snapshot
        if (snapshotCommissionType === null && cVal > 0) {
          snapshotCommissionType = cType;
          snapshotCommissionValue = cVal;
        }
        
        // Apply tier multiplier to commission
        commissionPerUnit = commissionPerUnit * (tierMultiplier / 100);
      }

      if (discountPerUnit > baseUnit) {
        discountPerUnit = baseUnit;
      }

      const effectiveUnit = baseUnit - discountPerUnit;
      const lineCustomerTotal = effectiveUnit * qty;
      const lineBaseCommission = commissionPerUnit * qty / (tierMultiplier / 100); // Base before multiplier
      const lineCommission = commissionPerUnit * qty;

      itemsSubtotalCustomer += lineCustomerTotal;
      totalBaseCommission += lineBaseCommission;
      totalCommission += lineCommission;

      linePayload.push({
        variant_id: it.variant_id,
        qty,
        unit_price: effectiveUnit,
        line_total: lineCustomerTotal,
      } as any);
    }

    if (linePayload.length === 0) {
      return NextResponse.json({ error: 'No valid line items' }, { status: 400 });
    }

    const grandTotal = itemsSubtotalCustomer + shippingAmount;

    // Build commission rule summary for audit trail
    const commissionRule = affiliateId && totalCommission > 0
      ? `base ${totalBaseCommission.toFixed(2)} × tier ${tierMultiplier}% = ${totalCommission.toFixed(2)}`
      : null;

    // 5) Insert into orders
    const { data: orderRow, error: orderErr } = await supabase
      .from('orders')
      .insert({
        source: 'website',
        status: 'pending',
        payment_status: 'unpaid',
        customer_name: customer.name,
        email: customer.email || null,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        province_code: customer.province_code || null,
        shipping_amount: shippingAmount,
        total_amount: itemsSubtotalCustomer,
        grand_total: grandTotal,
        affiliate_id: affiliateId,
        affiliate_ref_code: affiliateId ? affiliateRefCode : null,
        affiliate_commission_amount: affiliateId ? totalCommission : 0,
        affiliate_tier_id: affiliateId ? tierId : null,
        affiliate_tier_name: affiliateId ? tierName : null,
        affiliate_tier_multiplier: affiliateId ? tierMultiplier : null,
        affiliate_base_commission: affiliateId ? totalBaseCommission : null,
        affiliate_commission_rule: commissionRule,
        affiliate_commission_type_snapshot: affiliateId ? snapshotCommissionType : null,
        affiliate_commission_value_snapshot: affiliateId ? snapshotCommissionValue : null,
        affiliate_base_price_snapshot: affiliateId && snapshotCommissionType === 'percent' ? totalBasePriceForCommission : null,
      })
      .select('id')
      .maybeSingle();
    if (orderErr || !orderRow) {
      return NextResponse.json({ error: orderErr?.message || 'Failed to create order' }, { status: 400 });
    }
    const orderId = String((orderRow as any).id);

    // 5) Insert order_lines
    const linesWithOrderId = linePayload.map((ln) => ({ ...ln, order_id: orderId }));
    const { error: linesErr } = await supabase.from('order_lines').insert(linesWithOrderId as any[]);
    if (linesErr) {
      return NextResponse.json({ error: linesErr.message }, { status: 400 });
    }

    // Try to send an email notification (non-blocking)
    try {
      const RESEND_API_KEY = process.env.RESEND_API_KEY;
      const FROM = process.env.RESEND_FROM || 'Afal Store <onboarding@resend.dev>';
      const OWNER = process.env.OWNER_EMAIL || 'afalhelp@gmail.com';

      if (!RESEND_API_KEY) {
        console.warn('[orders/create] RESEND_API_KEY missing; skipping email send');
      } else {
        // Pull line details for a proper summary
        const { data: lines } = await getSupabaseServiceClient()
          .from('order_lines')
          .select('variant_id, qty, unit_price, line_total, variants!inner(sku)')
          .eq('order_id', orderId);

        const lineRows = (lines as any[]) || [];
        const subtotal = lineRows.reduce((s, r) => s + Number(r.line_total || 0), 0);
        const shipping = Number((body?.shipping?.amount as any) || 0);
        const total = subtotal + shipping;

        const itemsHtml = lineRows.map(r => `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #eee;font-family:Arial,Helvetica,sans-serif;">${r?.variants?.sku || r.variant_id}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;font-family:Arial,Helvetica,sans-serif;">${Number(r.qty)}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;font-family:Arial,Helvetica,sans-serif;">PKR ${Number(r.unit_price).toLocaleString()}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;font-family:Arial,Helvetica,sans-serif;">PKR ${Number(r.line_total).toLocaleString()}</td>
          </tr>
        `).join('');

        const htmlBase = (greeting: string) => `
          <div style="max-width:640px;margin:0 auto;padding:16px;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px">
            <h2 style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;color:#111827;">${greeting}</h2>
            <p style="margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;color:#374151;">Order ID: <strong>#${orderId}</strong></p>
            <div style="margin:12px 0;padding:12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;color:#374151;">${customer.name}<br/>
              ${customer.address}, ${customer.city}${customer.province_code ? ' ('+customer.province_code+')' : ''}<br/>
              ${customer.phone}${customer.email ? ' · '+customer.email : ''}</p>
            </div>
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:8px">
              <thead>
                <tr style="background:#f3f4f6">
                  <th style="padding:8px;text-align:left;font-family:Arial,Helvetica,sans-serif;color:#374151;">SKU</th>
                  <th style="padding:8px;text-align:right;font-family:Arial,Helvetica,sans-serif;color:#374151;">Qty</th>
                  <th style="padding:8px;text-align:right;font-family:Arial,Helvetica,sans-serif;color:#374151;">Unit</th>
                  <th style="padding:8px;text-align:right;font-family:Arial,Helvetica,sans-serif;color:#374151;">Line</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="padding:8px;text-align:right;font-family:Arial,Helvetica,sans-serif;border-top:1px solid #eee;">Items subtotal</td>
                  <td style="padding:8px;text-align:right;font-family:Arial,Helvetica,sans-serif;border-top:1px solid #eee;">PKR ${subtotal.toLocaleString()}</td>
                </tr>
                <tr>
                  <td colspan="3" style="padding:8px;text-align:right;font-family:Arial,Helvetica,sans-serif;">Shipping</td>
                  <td style="padding:8px;text-align:right;font-family:Arial,Helvetica,sans-serif;">PKR ${Number(shipping).toLocaleString()}</td>
                </tr>
                <tr>
                  <td colspan="3" style="padding:8px;text-align:right;font-weight:bold;font-family:Arial,Helvetica,sans-serif;">Total</td>
                  <td style="padding:8px;text-align:right;font-weight:bold;font-family:Arial,Helvetica,sans-serif;">PKR ${total.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
            <p style="margin-top:16px;font-family:Arial,Helvetica,sans-serif;color:#6b7280;font-size:14px;">If you have any questions, simply reply to this email.</p>
          </div>`;

        const sendEmailResend = async (payload: { to: string[]; subject: string; text: string; html: string }) => {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: FROM,
              to: payload.to,
              subject: payload.subject,
              text: payload.text,
              html: payload.html,
              reply_to: customer.email ? [String(customer.email)] : undefined,
            }),
          });
          const text = await res.text();
          if (!res.ok) {
            console.error('[orders/create] Resend error', res.status, text);
            return { ok: false, status: res.status, body: text } as const;
          }
          console.log('[orders/create] Resend accepted', text);
          return { ok: true } as const;
        };

        // Send admin email
        await sendEmailResend({
          to: [OWNER],
          subject: `New order placed: ${orderId}`,
          text: `New order ${orderId} by ${customer.name}, phone ${customer.phone}. Total: PKR ${total}.`,
          html: htmlBase('New order received'),
        });

        // Customer confirmation
        if (customer.email) {
          await sendEmailResend({
            to: [String(customer.email)],
            subject: `Thank you for your order (${orderId})`,
            text: `Thank you for your order. Your order ID is ${orderId}. Total: PKR ${total}.`,
            html: htmlBase('Thank you for your order'),
          });
        }
      }
    } catch (e) {
      // Swallow email errors; do not block order creation
      console.error('Email notification failed', e);
    }

    // Conversions API (Meta) — Purchase event (server-to-server)
    try {
      const GLOBAL_PIXEL_ID = process.env.FB_PIXEL_ID;
      const ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
      if (!ACCESS_TOKEN) {
        console.warn('[orders/create] FB CAPI disabled (missing FB_ACCESS_TOKEN)');
      } else {
        // Build value/contents from order_lines and resolve per-product pixel from variants -> products -> product_pixel
        const { data: lines2 } = await getSupabaseServiceClient()
          .from('order_lines')
          .select('variant_id, qty, unit_price, line_total, variants!inner(sku, product_id)')
          .eq('order_id', orderId);
        const lineRows2 = (lines2 as any[]) || [];
        const value = lineRows2.reduce((s, r) => s + Number(r.line_total || 0), 0) + Number((body?.shipping?.amount as any) || 0); // include shipping
        const contents = lineRows2.map(r => ({ id: r?.variants?.sku || r.variant_id, quantity: Number(r.qty), item_price: Number(r.unit_price) }));

        // Resolve pixel: if exactly one enabled per-product pixel among products in the order, use it; else fallback to global
        const productIdsSet = new Set<string>();
        for (const r of lineRows2) {
          const pid = (r as any)?.variants?.product_id as string | undefined;
          if (pid) productIdsSet.add(pid);
        }
        let resolvedPixelId: string | undefined = undefined;
        let resolveReason = 'no_products';
        if (productIdsSet.size > 0) {
          const productIds = Array.from(productIdsSet);
          const { data: pixelRows } = await getSupabaseServiceClient()
            .from('product_pixel')
            .select('product_id, enabled, pixel_id')
            .in('product_id', productIds);
          const enabledPixels = (pixelRows || [])
            .filter((p: any) => !!p?.enabled && !!(p?.pixel_id || '').trim())
            .map((p: any) => String(p.pixel_id).trim());
          const distinct = Array.from(new Set(enabledPixels));
          if (distinct.length === 1) {
            resolvedPixelId = distinct[0];
            resolveReason = 'single_per_product_pixel';
          } else if (distinct.length > 1) {
            resolveReason = 'multiple_per_product_pixels_fallback_global';
          } else {
            resolveReason = 'no_per_product_pixels_fallback_global';
          }
        }
        if (!resolvedPixelId) {
          resolvedPixelId = (GLOBAL_PIXEL_ID || '').trim() || undefined;
        }

        console.log('[orders/create] FB CAPI pixel resolve', {
          orderId,
          pixel: resolvedPixelId || 'undefined',
          reason: resolveReason,
          env: process.env.NODE_ENV,
        });

        if (!resolvedPixelId) {
          console.warn('[orders/create] FB CAPI skipped (no per-product pixel and no global fallback)');
        } else {
          // User data: fbp/fbc from payload, IP/UA from headers, hash email/phone
          const fbp = body?.fbMeta?.fbp || null;
          const fbc = body?.fbMeta?.fbc || null;
          const ua = req.headers.get('user-agent') || undefined;
          const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0]?.trim() || undefined;

          const sha256 = (s?: string | null) => {
            if (!s) return undefined;
            try {
              return crypto.createHash('sha256').update(String(s).trim().toLowerCase()).digest('hex');
            } catch { return undefined; }
          };
          const em = sha256(body?.customer?.email || null);
          // Normalize PK phone like +92XXXXXXXXXX before hashing
          const normPhone = (p?: string | null) => (p ? p.replace(/\D/g, '') : undefined);
          const ph = sha256(normPhone(body?.customer?.phone || null));

          const payload = {
            data: [
              {
                event_name: 'Purchase',
                event_time: Math.floor(Date.now() / 1000),
                event_id: String(orderId), // dedupe with browser Purchase if sent with same id
                action_source: 'website',
                event_source_url: undefined,
                user_data: {
                  client_user_agent: ua,
                  client_ip_address: ip,
                  fbp: fbp || undefined,
                  fbc: fbc || undefined,
                  em,
                  ph,
                },
                custom_data: {
                  currency: 'PKR',
                  value: Number(isFinite(value as any) ? value : 0),
                  contents,
                  content_type: 'product',
                },
              },
            ],
            // Only include test_event_code outside production
            test_event_code: process.env.NODE_ENV !== 'production' ? (process.env.FB_TEST_EVENT_CODE || undefined) : undefined,
          } as any;
          const url = `https://graph.facebook.com/v17.0/${encodeURIComponent(resolvedPixelId)}/events?access_token=${encodeURIComponent(ACCESS_TOKEN)}`;
          const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          const txt = await res.text();
          if (!res.ok) {
            console.error('[orders/create] FB CAPI error', res.status, txt);
          } else {
            console.log('[orders/create] FB CAPI sent', { status: res.status, body: txt?.slice?.(0, 500) });
          }
        }
      }
    } catch (e) {
      console.error('[orders/create] FB CAPI exception', e);
    }
    // Always respond with success JSON when order is created
    return NextResponse.json({ ok: true, order_id: orderId }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
