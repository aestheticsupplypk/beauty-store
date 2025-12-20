"use client";

import { useState } from "react";

type Props = {
  orderId: string;
  action: (formData: FormData) => void | Promise<void>;
  remaining: number;
};

export default function OrderPaymentsForm({ orderId, action, remaining }: Props) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const remainingClean = Number.isFinite(remaining) ? Math.max(0, remaining) : 0;
  const amountNum = Number(amount || 0);
  const disabled = !orderId || remainingClean <= 0 || !amount || !Number.isFinite(amountNum) || amountNum <= 0;

  return (
    <form
      action={action}
      className="mt-3 space-y-2 text-sm"
      onSubmit={() => {
        // Clear fields right after submit so stale values don't stick around
        setAmount("");
        setNote("");
      }}
    >
      <input type="hidden" name="order_id" value={orderId} />
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-xs text-gray-600">Amount (PKR)</label>
          <input
            name="amount"
            type="number"
            min="1"
            step="1"
            className="w-full border rounded px-2 py-1"
            placeholder="e.g. 3000"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <p className="mt-1 text-[11px] text-gray-500">
            {remainingClean > 0
              ? `Max: ${remainingClean.toLocaleString()} PKR`
              : 'No balance owing. Further payments are disabled.'}
          </p>
        </div>
        <div>
          <label className="block text-xs text-gray-600">Method</label>
          <select name="method" className="border rounded px-2 py-1 text-sm">
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank transfer</option>
            <option value="card">Card</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-600">Note (optional)</label>
        <input
          name="note"
          className="w-full border rounded px-2 py-1"
          placeholder="e.g. Second payment 19 Dec"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <button
        type="submit"
        disabled={disabled}
        className={`mt-1 inline-flex items-center rounded px-3 py-1.5 text-xs font-medium text-white ${disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-black/90'}`}
      >
        Add payment
      </button>
    </form>
  );
}
