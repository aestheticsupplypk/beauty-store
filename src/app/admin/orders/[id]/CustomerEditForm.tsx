'use client';

import { useState } from 'react';

type CustomerEditFormProps = {
  orderId: string;
  customerName: string;
  phone: string;
  alternatePhone?: string;
  address: string;
  city: string;
  onSave: (data: {
    customer_name: string;
    phone: string;
    alternate_phone: string;
    address: string;
    city: string;
  }) => Promise<{ ok: boolean; message?: string }>;
};

export default function CustomerEditForm({
  orderId,
  customerName,
  phone,
  alternatePhone,
  address,
  city,
  onSave,
}: CustomerEditFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    customer_name: customerName,
    phone: phone,
    alternate_phone: alternatePhone || '',
    address: address,
    city: city,
  });

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const result = await onSave(formData);
      if (result.ok) {
        setIsEditing(false);
      } else {
        setError(result.message || 'Failed to save');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      customer_name: customerName,
      phone: phone,
      alternate_phone: alternatePhone || '',
      address: address,
      city: city,
    });
    setIsEditing(false);
    setError(null);
  };

  if (!isEditing) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-medium">Customer</h2>
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-blue-600 hover:underline"
          >
            Edit
          </button>
        </div>
        <div className="text-sm">
          <div className="font-medium">{customerName}</div>
          <div>{phone}</div>
          {alternatePhone && <div className="text-gray-500">Alt: {alternatePhone}</div>}
          <div>{address}</div>
          <div>{city}</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-medium">Customer</h2>
      </div>
      <div className="space-y-2 text-sm">
        <div>
          <label className="block text-xs text-gray-600">Name</label>
          <input
            type="text"
            value={formData.customer_name}
            onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600">Phone</label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600">Alternate Phone</label>
          <input
            type="text"
            value={formData.alternate_phone}
            onChange={(e) => setFormData({ ...formData, alternate_phone: e.target.value })}
            className="w-full border rounded px-2 py-1"
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600">Address</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600">City</label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        
        {error && (
          <div className="text-xs text-red-600">{error}</div>
        )}
        
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1 bg-black text-white rounded text-xs disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            className="px-3 py-1 border rounded text-xs"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
