'use client';

import React, { useEffect, useState } from 'react';

type DeactivateReason = 'inactive' | 'fraud' | 'request' | 'policy_violation' | 'other';

type Order = {
  id: string;
  order_code: string;
  created_at: string;
  total_amount: number;
  commission_amount: number;
  delivery_status: string;
  commission_status: string;
};

type AffiliateDetail = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  parlour_name: string | null;
  city: string | null;
  code: string;
  active: boolean;
  created_at: string;
  payout_method: string | null;
  easypaisa_number: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_iban: string | null;
  notes: string | null;
  stats: {
    total_orders: number;
    total_sales: number;
    total_commission: number;
    payable_amount: number;
    pending_amount: number;
  };
  recent_orders: Order[];
};

type Props = {
  affiliateId: string | null;
  onClose: () => void;
  onStatusChange: () => void;
};

export default function AffiliateDetailDrawer({ affiliateId, onClose, onStatusChange }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AffiliateDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState<DeactivateReason>('inactive');
  const [deactivateNotes, setDeactivateNotes] = useState('');

  useEffect(() => {
    if (affiliateId) {
      loadDetail();
    }
  }, [affiliateId]);

  async function loadDetail() {
    if (!affiliateId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/affiliate/${affiliateId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load');
      setData(json.affiliate);
    } catch (e: any) {
      setError(e?.message || 'Failed to load affiliate');
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus() {
    if (!data) return;
    
    // For activation, just confirm
    if (!data.active) {
      if (!confirm('Are you sure you want to activate this affiliate?')) return;
      await doToggle();
      return;
    }
    
    // For deactivation, show modal
    setShowDeactivateModal(true);
    setShowActionsMenu(false);
  }

  async function doToggle(reason?: string, notes?: string) {
    if (!data) return;
    try {
      setToggling(true);
      const body = reason ? { reason, notes } : {};
      const res = await fetch(`/api/admin/affiliate/${data.id}/toggle-status`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to toggle status');
      await loadDetail();
      onStatusChange();
      setShowDeactivateModal(false);
      setDeactivateReason('inactive');
      setDeactivateNotes('');
    } catch (e: any) {
      alert(e?.message || 'Failed to toggle status');
    } finally {
      setToggling(false);
      setShowActionsMenu(false);
    }
  }

  async function copyCode() {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {}
  }

  async function copyReferralLink() {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(`https://aestheticpk.com/r/${data.code}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  }

  function getWhatsAppLink(phone: string, message?: string) {
    // Clean phone number
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '92' + cleanPhone.slice(1);
    }
    const encodedMsg = message ? encodeURIComponent(message) : '';
    return `https://wa.me/${cleanPhone}${encodedMsg ? `?text=${encodedMsg}` : ''}`;
  }

  function getPayoutRequestMessage() {
    if (!data) return '';
    return `Hi ${data.name}! 👋\n\nThis is a reminder to complete your payout setup on Aesthetic PK.\n\nPlease log in to your affiliate dashboard and add your payout method (Easypaisa or Bank Transfer) so we can send your commissions.\n\nDashboard: https://aestheticpk.com/affiliate/dashboard\n\nThank you!`;
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function getDeliveryBadge(status: string) {
    switch (status) {
      case 'delivered':
        return <span className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-100 text-emerald-700">Delivered</span>;
      case 'failed':
        return <span className="px-1.5 py-0.5 text-[10px] rounded bg-red-100 text-red-700">Failed</span>;
      case 'returned':
        return <span className="px-1.5 py-0.5 text-[10px] rounded bg-orange-100 text-orange-700">Returned</span>;
      default:
        return <span className="px-1.5 py-0.5 text-[10px] rounded bg-gray-100 text-gray-600">Pending</span>;
    }
  }

  if (!affiliateId) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Affiliate Details</h2>
            <div className="flex items-center gap-2">
              {/* Actions Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowActionsMenu(!showActionsMenu)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="More actions"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                {showActionsMenu && (
                  <div className="absolute right-0 mt-1 w-48 bg-white border rounded-lg shadow-lg py-1 z-10">
                    <button
                      onClick={toggleStatus}
                      disabled={toggling}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${data?.active ? 'text-red-600' : 'text-emerald-600'}`}
                    >
                      {toggling ? 'Processing...' : data?.active ? 'Deactivate Affiliate' : 'Activate Affiliate'}
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Quick Actions */}
          {data && (
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={copyCode}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {copiedCode ? 'Copied!' : 'Copy Code'}
              </button>
              <button
                onClick={copyReferralLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                {copiedLink ? 'Copied!' : 'Copy Link'}
              </button>
              <a
                href={getWhatsAppLink(data.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </a>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading && <div className="text-center py-8 text-gray-500">Loading...</div>}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          
          {data && (
            <>
              {/* Basic Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{data.name}</h3>
                    <p className="text-sm text-gray-500">{data.email}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${data.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {data.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Phone:</span> {data.phone}
                  </div>
                  <div>
                    <span className="text-gray-500">Code:</span> <span className="font-mono">{data.code}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Parlour:</span> {data.parlour_name || '—'}
                  </div>
                  <div>
                    <span className="text-gray-500">City:</span> {data.city || '—'}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="border rounded p-3 bg-gray-50">
                  <div className="text-xs text-gray-500 uppercase">Orders</div>
                  <div className="text-lg font-semibold">{data.stats.total_orders}</div>
                </div>
                <div className="border rounded p-3 bg-gray-50">
                  <div className="text-xs text-gray-500 uppercase">Sales</div>
                  <div className="text-lg font-semibold">{data.stats.total_sales.toLocaleString()}</div>
                </div>
                <div className="border rounded p-3 bg-gray-50">
                  <div className="text-xs text-amber-600 uppercase">Pending</div>
                  <div className="text-lg font-semibold text-amber-600">{data.stats.pending_amount.toLocaleString()}</div>
                </div>
                <div className="border rounded p-3 bg-emerald-50 border-emerald-200">
                  <div className="text-xs text-emerald-600 uppercase">Payable</div>
                  <div className="text-lg font-semibold text-emerald-600">{data.stats.payable_amount.toLocaleString()}</div>
                </div>
              </div>

              {/* Payout Method */}
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  Payout Method
                  {data.payout_method ? (
                    <span className="px-2 py-0.5 text-xs rounded bg-emerald-100 text-emerald-700">Ready</span>
                  ) : (
                    <span className="px-2 py-0.5 text-xs rounded bg-red-100 text-red-700">Not Ready</span>
                  )}
                </h4>
                
                {!data.payout_method ? (
                  <div className="space-y-3">
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                      <strong>Missing:</strong> Payout method not selected
                    </div>
                    <a
                      href={getWhatsAppLink(data.phone, getPayoutRequestMessage())}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Request Payout Info
                    </a>
                  </div>
                ) : data.payout_method === 'easypaisa' ? (
                  <div className="text-sm space-y-1">
                    <div><span className="text-gray-500">Method:</span> <span className="text-green-600 font-medium">Easypaisa</span></div>
                    {data.easypaisa_number ? (
                      <div><span className="text-gray-500">Number:</span> {data.easypaisa_number}</div>
                    ) : (
                      <div className="text-red-600 bg-red-50 p-2 rounded text-xs"><strong>Missing:</strong> Easypaisa number not provided</div>
                    )}
                  </div>
                ) : data.payout_method === 'bank_transfer' ? (
                  <div className="text-sm space-y-1">
                    <div><span className="text-gray-500">Method:</span> <span className="text-blue-600 font-medium">Bank Transfer</span></div>
                    {data.bank_name && data.bank_account_number ? (
                      <>
                        <div><span className="text-gray-500">Bank:</span> {data.bank_name}</div>
                        <div><span className="text-gray-500">Account Name:</span> {data.bank_account_name || '—'}</div>
                        <div><span className="text-gray-500">Account #:</span> {data.bank_account_number}</div>
                        {data.bank_iban && <div><span className="text-gray-500">IBAN:</span> {data.bank_iban}</div>}
                      </>
                    ) : (
                      <div className="text-red-600 bg-red-50 p-2 rounded text-xs">
                        <strong>Missing:</strong> {!data.bank_name ? 'Bank name' : ''} {!data.bank_account_number ? 'Account number' : ''}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Recent Orders */}
              <div className="border rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b">
                  <h4 className="font-medium">Recent Orders (Last 10)</h4>
                </div>
                {data.recent_orders.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500 text-center">No orders yet</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-3 py-2 text-xs text-gray-500">Order</th>
                        <th className="text-left px-3 py-2 text-xs text-gray-500">Date</th>
                        <th className="text-left px-3 py-2 text-xs text-gray-500">Status</th>
                        <th className="text-right px-3 py-2 text-xs text-gray-500">Commission</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recent_orders.map((o) => (
                        <tr key={o.id} className="border-b last:border-0">
                          <td className="px-3 py-2 font-mono text-xs">{o.order_code}</td>
                          <td className="px-3 py-2 text-xs text-gray-500">{formatDate(o.created_at)}</td>
                          <td className="px-3 py-2">{getDeliveryBadge(o.delivery_status)}</td>
                          <td className="px-3 py-2 text-right font-medium">{o.commission_amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Notes */}
              {data.notes && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Notes</h4>
                  <p className="text-sm text-gray-600">{data.notes}</p>
                </div>
              )}

              {/* Meta */}
              <div className="text-xs text-gray-400 border-t pt-4">
                <p>Joined: {formatDate(data.created_at)}</p>
                <p>ID: {data.id}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Deactivation Modal */}
      {showDeactivateModal && data && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setShowDeactivateModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-2xl z-[70] p-6">
            <h3 className="text-lg font-semibold text-red-600 mb-4">Deactivate Affiliate</h3>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-800">
              <strong>Warning:</strong> Deactivating this affiliate will:
              <ul className="list-disc ml-5 mt-1 space-y-1">
                <li>Prevent new order attributions to their code</li>
                <li>Stop new commission earnings</li>
                <li>Existing earned commissions remain unchanged</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for deactivation</label>
                <select
                  value={deactivateReason}
                  onChange={(e) => setDeactivateReason(e.target.value as DeactivateReason)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="inactive">Inactive / No longer participating</option>
                  <option value="request">Affiliate requested deactivation</option>
                  <option value="policy_violation">Policy violation</option>
                  <option value="fraud">Suspected fraud</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  value={deactivateNotes}
                  onChange={(e) => setDeactivateNotes(e.target.value)}
                  placeholder="Add any additional notes..."
                  className="w-full px-3 py-2 border rounded-lg text-sm h-20 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDeactivateModal(false);
                  setDeactivateReason('inactive');
                  setDeactivateNotes('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => doToggle(deactivateReason, deactivateNotes)}
                disabled={toggling}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              >
                {toggling ? 'Processing...' : 'Deactivate Affiliate'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
