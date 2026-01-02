'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type Profile = {
  id: string;
  email: string | null;
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

type PermissionsEditorProps = {
  initialProfiles: Profile[];
};

const SECTION_KEYS = [
  'is_admin_full',
  'can_admin_dashboard',
  'can_admin_orders',
  'can_admin_inventory',
  'can_admin_products',
  'can_admin_reviews',
  'can_admin_shipping',
  'can_admin_affiliates',
  'can_admin_parlours',
] as const;

const SECTION_LABELS: Record<string, string> = {
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

export default function PermissionsEditor({ initialProfiles }: PermissionsEditorProps) {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [originalProfiles, setOriginalProfiles] = useState<Profile[]>(initialProfiles);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if there are unsaved changes
  const hasChanges = JSON.stringify(profiles) !== JSON.stringify(originalProfiles);

  // Block navigation when there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  // Toggle a permission for a profile
  const togglePermission = useCallback((profileId: string, key: string) => {
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id !== profileId) return p;

        const updated = { ...p };

        if (key === 'is_admin_full') {
          // If toggling Full Admin ON, turn on all sections
          if (!p.is_admin_full) {
            updated.is_admin_full = true;
            updated.can_admin_dashboard = true;
            updated.can_admin_orders = true;
            updated.can_admin_inventory = true;
            updated.can_admin_products = true;
            updated.can_admin_reviews = true;
            updated.can_admin_shipping = true;
            updated.can_admin_affiliates = true;
            updated.can_admin_parlours = true;
          } else {
            // If toggling Full Admin OFF, just turn off Full Admin
            updated.is_admin_full = false;
          }
        } else {
          // Toggle the specific section
          (updated as any)[key] = !(p as any)[key];

          // If any section is now OFF, Full Admin must be OFF
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
        }

        return updated;
      })
    );
  }, []);

  // Discard changes
  const handleDiscard = useCallback(() => {
    setProfiles(originalProfiles);
    setError(null);
  }, [originalProfiles]);

  // Save changes
  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profiles }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save');
      }

      // Update original to match current (no more unsaved changes)
      setOriginalProfiles(profiles);
      router.refresh();
    } catch (e: any) {
      setError(e.message || 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  }, [profiles, router]);

  return (
    <div className="space-y-6">
      {/* Unsaved changes notification bar */}
      {hasChanges && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-3 flex items-center justify-between shadow-lg">
          <span className="font-medium">You have unsaved changes</span>
          <div className="flex gap-3">
            <button
              onClick={handleDiscard}
              disabled={saving}
              className="px-4 py-1.5 bg-white text-amber-700 rounded font-medium hover:bg-amber-50 disabled:opacity-50"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 bg-amber-700 text-white rounded font-medium hover:bg-amber-800 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Add top padding when notification bar is visible */}
      {hasChanges && <div className="h-14" />}

      <h1 className="text-2xl font-semibold">Admin Permissions</h1>
      <p className="text-sm text-gray-600">
        Manage which sections each user can access. Full Admin grants access to all sections.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="py-2 px-3 border-b">User</th>
              {SECTION_KEYS.map((key) => (
                <th key={key} className="py-2 px-3 border-b text-center">
                  {SECTION_LABELS[key]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-3 font-medium">{p.email || p.id}</td>
                {SECTION_KEYS.map((key) => {
                  const isOn = Boolean((p as any)[key]);
                  const originalProfile = originalProfiles.find((op) => op.id === p.id);
                  const wasOn = originalProfile ? Boolean((originalProfile as any)[key]) : isOn;
                  const isChanged = isOn !== wasOn;

                  return (
                    <td key={key} className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => togglePermission(p.id, key)}
                        className={`w-6 h-6 rounded border transition-colors ${
                          isOn
                            ? 'bg-green-500 border-green-600 text-white'
                            : 'bg-white border-gray-300'
                        } ${isChanged ? 'ring-2 ring-amber-400' : ''}`}
                        title={`Toggle ${SECTION_LABELS[key]}`}
                      >
                        {isOn ? '✓' : ''}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
            {profiles.length === 0 && (
              <tr>
                <td colSpan={SECTION_KEYS.length + 1} className="py-4 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="border rounded p-4 text-sm text-gray-700 space-y-2">
        <h2 className="font-medium">How permissions work</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Full Admin</strong>: Can access all sections and this permissions page.</li>
          <li><strong>Section flags</strong>: If Full Admin is off, user can only see sections where their flag is on.</li>
          <li>Click checkboxes to toggle, then click <strong>Save Changes</strong> to apply.</li>
          <li>Changed checkboxes are highlighted with an orange ring.</li>
        </ul>
      </div>
    </div>
  );
}
