'use client';

import { useState } from 'react';

type StatusFormProps = {
  id: string;
  currentStatus: string;
  paymentMode?: string;
  codDueAmount?: number;
  amountDue?: number;
  amountPaid?: number;
  hasCodPayment?: boolean; // True if "COD collected on delivery" payment already exists
  updateStatusAction: (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
};

export default function StatusForm({ 
  id, 
  currentStatus, 
  paymentMode,
  codDueAmount,
  amountDue,
  amountPaid,
  hasCodPayment,
  updateStatusAction
}: StatusFormProps) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [codCollected, setCodCollected] = useState('');
  
  const isPrepaid = paymentMode === 'prepaid';
  const isCodOrSplit = paymentMode === 'cod' || paymentMode === 'split';
  const showAdvanceWarning = isPrepaid && (amountPaid || 0) === 0;
  
  // Calculate expected COD amount
  const expectedCodAmount = paymentMode === 'split' && codDueAmount 
    ? codDueAmount 
    : (amountDue || 0);
  
  // Show COD prompt when marking as delivered and there's COD to collect
  // Hide if COD payment already exists (idempotency)
  const showCodPrompt = selectedStatus === 'delivered' && isCodOrSplit && expectedCodAmount > 0 && !hasCodPayment;
  
  return (
    <form action={updateStatusAction} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="payment_mode" value={paymentMode || 'cod'} />
      <input type="hidden" name="expected_cod_amount" value={expectedCodAmount} />
      <div>
        <label className="block text-sm">Status</label>
        <select 
          name="status" 
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        >
          <option value="pending">Pending</option>
          <option value="packed">Packed</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      
      {showAdvanceWarning && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded text-xs">
          <span className="font-medium">Warning:</span> This order requires advance payment but no payment has been recorded yet.
        </div>
      )}
      
      {showCodPrompt && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3 space-y-2">
          <div className="text-sm font-medium text-blue-800">COD Collection</div>
          <p className="text-xs text-blue-700">
            Expected COD amount: <span className="font-medium">{expectedCodAmount.toLocaleString()} PKR</span>
          </p>
          <div>
            <label className="block text-xs text-blue-700">Amount collected (PKR)</label>
            <input
              type="number"
              name="cod_collected"
              value={codCollected}
              onChange={(e) => setCodCollected(e.target.value)}
              placeholder={expectedCodAmount.toString()}
              min="0"
              step="1"
              className="border rounded px-2 py-1 w-full text-sm"
            />
            <p className="text-xs text-blue-600 mt-1">
              Leave empty to use expected amount. Enter actual amount if different.
            </p>
          </div>
        </div>
      )}
      
      <button className="bg-black text-white rounded px-4 py-2">Save</button>
    </form>
  );
}
