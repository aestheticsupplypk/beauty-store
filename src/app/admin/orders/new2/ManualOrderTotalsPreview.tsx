"use client";

import { useEffect, useState } from "react";

type TotalsState = {
  itemsSubtotal: number;
  shipping: number;
  grandTotal: number;
  amountPaid: number;
  balanceOwing: number;
};

const initialTotals: TotalsState = {
  itemsSubtotal: 0,
  shipping: 0,
  grandTotal: 0,
  amountPaid: 0,
  balanceOwing: 0,
};

type LineSummary = {
  index: number;
  qty: number;
  price: number;
  lineTotal: number;
};

type Warning = string;

function parseNumber(value: string | null): number {
  if (!value) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function ManualOrderTotalsPreview() {
  const [totals, setTotals] = useState<TotalsState>(initialTotals);
  const [lines, setLines] = useState<LineSummary[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);

  useEffect(() => {
    function recompute() {
      const form = document.querySelector<HTMLFormElement>("form[action='/admin/orders/manual-create']");
      if (!form) return;

      // Items: names like items[0][qty], items[0][price]
      const items: { index: number; qty: number; price: number }[] = [];
      const newWarnings: Warning[] = [];
      for (let i = 0; i < 5; i++) {
        const qtyInput = form.querySelector<HTMLInputElement>(`input[name='items[${i}][qty]']`);
        const priceInput = form.querySelector<HTMLInputElement>(`input[name='items[${i}][price]']`);
        const qty = parseNumber(qtyInput?.value ?? "");
        const price = parseNumber(priceInput?.value ?? "");
        if (qty > 0 || price > 0) {
          items.push({ index: i, qty, price });
        }

        if (qty > 0 && price === 0) {
          newWarnings.push(`Item ${i + 1}: quantity is set but price per piece is 0.`);
        }
        if (price > 0 && qty === 0) {
          newWarnings.push(`Item ${i + 1}: price per piece is set but quantity is 0.`);
        }
      }

      const lineSummaries: LineSummary[] = items.map((it) => ({
        index: it.index,
        qty: it.qty,
        price: it.price,
        lineTotal: it.qty * it.price,
      }));

      const itemsSubtotal = lineSummaries.reduce((sum, it) => sum + it.lineTotal, 0);

      const shippingInput = form.querySelector<HTMLInputElement>("input[name='shipping_amount']");
      const amountPaidInput = form.querySelector<HTMLInputElement>("input[name='amount_paid']");

      const shipping = parseNumber(shippingInput?.value ?? "");
      const amountPaidRaw = parseNumber(amountPaidInput?.value ?? "");
      const grandTotal = itemsSubtotal + shipping;
      let amountPaid = amountPaidRaw;
      if (amountPaidRaw > grandTotal && grandTotal > 0) {
        newWarnings.push('Amount paid is greater than total; it will be capped to the order total.');
        amountPaid = grandTotal;
      }
      const balanceOwing = grandTotal - amountPaid;

      setTotals({ itemsSubtotal, shipping, grandTotal, amountPaid, balanceOwing });
      setLines(lineSummaries);
      setWarnings(newWarnings);
    }

    // Initial compute
    recompute();

    const form = document.querySelector<HTMLFormElement>("form[action='/admin/orders/manual-create']");
    if (!form) return;

    const handler = () => recompute();

    const inputs = Array.from(
      form.querySelectorAll<HTMLInputElement>(
        "input[name='shipping_amount'], input[name='amount_paid'], input[name^='items['][name$='[qty]'], input[name^='items['][name$='[price]']"
      )
    );

    inputs.forEach((input) => {
      input.addEventListener("input", handler);
      input.addEventListener("change", handler);
    });

    return () => {
      inputs.forEach((input) => {
        input.removeEventListener("input", handler);
        input.removeEventListener("change", handler);
      });
    };
  }, []);

  const fmt = (n: number) => n.toLocaleString("en-PK", { maximumFractionDigits: 2 });

  const paymentStatus = (() => {
    if (totals.grandTotal === 0) return 'Total is 0 PKR. No items or shipping entered yet.';
    if (totals.balanceOwing <= 0) return 'Fully paid order (no balance owing).';
    if (totals.amountPaid === 0) return 'Unpaid order (no amount recorded as paid).';
    return 'Partially paid order (some balance is still owing).';
  })();

  return (
    <div className="border-t pt-4 text-sm space-y-2">
      <div className="font-medium mb-1">Order preview</div>
      <div className="flex justify-between">
        <span>Items subtotal</span>
        <span>{fmt(totals.itemsSubtotal)} PKR</span>
      </div>
      <div className="flex justify-between">
        <span>Shipping</span>
        <span>{fmt(totals.shipping)} PKR</span>
      </div>
      <div className="flex justify-between font-medium">
        <span>Total</span>
        <span>{fmt(totals.grandTotal)} PKR</span>
      </div>
      <div className="flex justify-between">
        <span>Amount paid</span>
        <span>{fmt(totals.amountPaid)} PKR</span>
      </div>
      <div className="flex justify-between font-medium">
        <span>Balance owing</span>
        <span>{fmt(totals.balanceOwing)} PKR</span>
      </div>
      {lines.length > 0 && (
        <div className="mt-2 space-y-1">
          <div className="font-medium text-xs text-gray-700">Line breakdown</div>
          <ul className="text-xs space-y-0.5">
            {lines.map((ln) => (
              <li key={ln.index} className="flex justify-between">
                <span>
                  Item {ln.index + 1}: {ln.qty} × {fmt(ln.price)}
                </span>
                <span>{fmt(ln.lineTotal)} PKR</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-2 text-xs text-gray-700">{paymentStatus}</div>
      {warnings.length > 0 && (
        <ul className="mt-1 text-xs text-red-600 list-disc pl-4 space-y-0.5">
          {warnings.map((w, idx) => (
            <li key={idx}>{w}</li>
          ))}
        </ul>
      )}
      <p className="text-xs text-gray-500 mt-1">
        Preview updates as you change Qty, Price per piece, Shipping, and Amount paid. Final values are saved when you
        create the order.
      </p>
    </div>
  );
}
