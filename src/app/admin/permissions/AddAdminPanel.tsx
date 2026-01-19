'use client';

import { useState } from 'react';

type Template = 'full_admin' | 'delivery' | 'custom';

type Permissions = {
  is_admin_full: boolean;
  can_admin_dashboard: boolean;
  can_admin_orders: boolean;
  can_admin_inventory: boolean;
  can_admin_products: boolean;
  can_admin_reviews: boolean;
  can_admin_shipping: boolean;
  can_admin_affiliates: boolean;
  can_admin_parlours: boolean;
};

type AddAdminPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const PERMISSION_LABELS: Record<keyof Permissions, string> = {
  is_admin_full: 'Full Admin',
  can_admin_dashboard: 'Dashboard',
  can_admin_orders: 'Orders',
  can_admin_inventory: 'Inventory',
  can_admin_products: 'Products',
  can_admin_reviews: 'Reviews',
  can_admin_shipping: 'Shipping',
  can_admin_affiliates: 'Affiliates',
  can_admin_parlours: 'Parlours',
};

const DEFAULT_PERMISSIONS: Permissions = {
  is_admin_full: false,
  can_admin_dashboard: false,
  can_admin_orders: false,
  can_admin_inventory: false,
  can_admin_products: false,
  can_admin_reviews: false,
  can_admin_shipping: false,
  can_admin_affiliates: false,
  can_admin_parlours: false,
};

export default function AddAdminPanel({ isOpen, onClose, onSuccess }: AddAdminPanelProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [template, setTemplate] = useState<Template>('delivery');
  const [permissions, setPermissions] = useState<Permissions>(DEFAULT_PERMISSIONS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTemplateChange = (newTemplate: Template) => {
    setTemplate(newTemplate);
    
    if (newTemplate === 'full_admin') {
      setPermissions({
        is_admin_full: true,
        can_admin_dashboard: true,
        can_admin_orders: true,
        can_admin_inventory: true,
        can_admin_products: true,
        can_admin_reviews: true,
        can_admin_shipping: true,
        can_admin_affiliates: true,
        can_admin_parlours: true,
      });
    } else if (newTemplate === 'delivery') {
      setPermissions({
        ...DEFAULT_PERMISSIONS,
        can_admin_dashboard: true,
        can_admin_orders: true,
      });
    } else {
      setPermissions(DEFAULT_PERMISSIONS);
    }
  };

  const togglePermission = (key: keyof Permissions) => {
    if (template !== 'custom') return;
    
    setPermissions(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      
      // Check if all permissions are on
      const allOn = 
        updated.can_admin_dashboard &&
        updated.can_admin_orders &&
        updated.can_admin_inventory &&
        updated.can_admin_products &&
        updated.can_admin_reviews &&
        updated.can_admin_shipping &&
        updated.can_admin_affiliates &&
        updated.can_admin_parlours;
      
      updated.is_admin_full = allOn;
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          template,
          permissions: template === 'custom' ? permissions : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create admin');
      }

      // Reset form
      setEmail('');
      setPassword('');
      setTemplate('delivery');
      setPermissions(DEFAULT_PERMISSIONS);
      
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setTemplate('delivery');
    setPermissions(DEFAULT_PERMISSIONS);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={handleClose}
      />
      
      {/* Slide-in Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Add Admin User</h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Minimum 6 characters"
              />
            </div>

            {/* Role Template */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role Template
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="template"
                    checked={template === 'full_admin'}
                    onChange={() => handleTemplateChange('full_admin')}
                    className="text-blue-600"
                  />
                  <span className="font-medium">Full Admin</span>
                  <span className="text-sm text-gray-500">- All permissions</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="template"
                    checked={template === 'delivery'}
                    onChange={() => handleTemplateChange('delivery')}
                    className="text-blue-600"
                  />
                  <span className="font-medium">Delivery</span>
                  <span className="text-sm text-gray-500">- Dashboard + Orders only</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="template"
                    checked={template === 'custom'}
                    onChange={() => handleTemplateChange('custom')}
                    className="text-blue-600"
                  />
                  <span className="font-medium">Custom</span>
                  <span className="text-sm text-gray-500">- Select permissions manually</span>
                </label>
              </div>
            </div>

            {/* Custom Permissions */}
            {template === 'custom' && (
              <div className="border rounded p-4 bg-gray-50">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Permissions
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(PERMISSION_LABELS) as Array<keyof Permissions>)
                    .filter(key => key !== 'is_admin_full')
                    .map((key) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions[key]}
                          onChange={() => togglePermission(key)}
                          className="rounded text-blue-600"
                        />
                        <span className="text-sm">{PERMISSION_LABELS[key]}</span>
                      </label>
                    ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Admin User'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
