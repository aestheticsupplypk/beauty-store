import { requireSectionAccess } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function fetchParlour(id: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('parlours')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function fetchParlourUsers(parlourId: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('parlour_id', parlourId);
  if (error) throw error;
  return data ?? [];
}

async function fetchAvailableUsers() {
  const supabase = getSupabaseServerClient();
  // Get users who are not assigned to any parlour and are not admins
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email')
    .is('parlour_id', null)
    .order('email');
  if (error) throw error;
  return data ?? [];
}

async function updateParlour(formData: FormData) {
  'use server';
  await requireSectionAccess('parlours');

  const id = String(formData.get('id') || '');
  const name = String(formData.get('name') || '').trim();
  const city = String(formData.get('city') || '').trim();
  const phone = String(formData.get('phone') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const minOrderQty = formData.get('min_order_qty') ? Number(formData.get('min_order_qty')) : null;
  const minOrderValue = formData.get('min_order_value') ? Number(formData.get('min_order_value')) : null;

  if (!id || !name) return;

  const supabase = getSupabaseServerClient();
  await supabase
    .from('parlours')
    .update({
      name,
      city: city || null,
      phone: phone || null,
      email: email || null,
      min_order_qty: minOrderQty,
      min_order_value: minOrderValue,
    })
    .eq('id', id);

  revalidatePath(`/admin/parlours/${id}`);
  revalidatePath('/admin/parlours');
}

async function assignUser(formData: FormData) {
  'use server';
  await requireSectionAccess('parlours');

  const parlourId = String(formData.get('parlour_id') || '');
  const userId = String(formData.get('user_id') || '');

  if (!parlourId || !userId) return;

  const supabase = getSupabaseServerClient();
  await supabase
    .from('profiles')
    .update({ parlour_id: parlourId })
    .eq('id', userId);

  revalidatePath(`/admin/parlours/${parlourId}`);
}

async function removeUser(formData: FormData) {
  'use server';
  await requireSectionAccess('parlours');

  const parlourId = String(formData.get('parlour_id') || '');
  const userId = String(formData.get('user_id') || '');

  if (!parlourId || !userId) return;

  const supabase = getSupabaseServerClient();
  await supabase
    .from('profiles')
    .update({ parlour_id: null })
    .eq('id', userId);

  revalidatePath(`/admin/parlours/${parlourId}`);
}

async function deleteParlour(formData: FormData) {
  'use server';
  await requireSectionAccess('parlours');

  const id = String(formData.get('id') || '');
  if (!id) return;

  const supabase = getSupabaseServerClient();
  
  // First remove all user assignments
  await supabase
    .from('profiles')
    .update({ parlour_id: null })
    .eq('parlour_id', id);

  // Then delete the parlour
  await supabase.from('parlours').delete().eq('id', id);

  revalidatePath('/admin/parlours');
  redirect('/admin/parlours');
}

export default async function EditParlourPage({ params }: { params: { id: string } }) {
  await requireSectionAccess('parlours');
  
  const parlour = await fetchParlour(params.id);
  if (!parlour) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Parlour Not Found</h1>
        <Link href="/admin/parlours" className="text-blue-600 hover:underline">
          ← Back to Parlours
        </Link>
      </div>
    );
  }

  const parlourUsers = await fetchParlourUsers(params.id);
  const availableUsers = await fetchAvailableUsers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Parlour: {parlour.name}</h1>
        <Link href="/admin/parlours" className="text-sm text-gray-600 hover:underline">
          ← Back to Parlours
        </Link>
      </div>

      {/* Edit parlour details */}
      <div className="border rounded p-4 space-y-4">
        <h2 className="font-medium">Parlour Details</h2>
        <form action={updateParlour} className="space-y-4">
          <input type="hidden" name="id" value={parlour.id} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                name="name"
                defaultValue={parlour.name}
                required
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input
                type="text"
                name="city"
                defaultValue={parlour.city || ''}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="text"
                name="phone"
                defaultValue={parlour.phone || ''}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                name="email"
                defaultValue={parlour.email || ''}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Order Minimums (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Minimum Order Quantity</label>
                <input
                  type="number"
                  name="min_order_qty"
                  defaultValue={parlour.min_order_qty || ''}
                  min="0"
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="No minimum"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for no minimum</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Minimum Order Value (PKR)</label>
                <input
                  type="number"
                  name="min_order_value"
                  defaultValue={parlour.min_order_value || ''}
                  min="0"
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="No minimum"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for no minimum</p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="bg-black text-white rounded px-4 py-2 text-sm hover:bg-gray-800"
          >
            Save Changes
          </button>
        </form>
      </div>

      {/* Portal Users */}
      <div className="border rounded p-4 space-y-4">
        <h2 className="font-medium">Portal Users</h2>
        <p className="text-sm text-gray-600">
          Users assigned to this parlour can log in to the Parlour Portal and place orders.
        </p>

        {/* Current users */}
        {parlourUsers.length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Assigned Users:</h3>
            <ul className="space-y-1">
              {parlourUsers.map((u: any) => (
                <li key={u.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                  <span className="text-sm">{u.email}</span>
                  <form action={removeUser}>
                    <input type="hidden" name="parlour_id" value={parlour.id} />
                    <input type="hidden" name="user_id" value={u.id} />
                    <button
                      type="submit"
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No users assigned yet.</p>
        )}

        {/* Add user */}
        {availableUsers.length > 0 && (
          <form action={assignUser} className="flex gap-2 items-end">
            <input type="hidden" name="parlour_id" value={parlour.id} />
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Add User</label>
              <select
                name="user_id"
                required
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="">Select a user...</option>
                {availableUsers.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.email}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white rounded px-4 py-2 text-sm hover:bg-blue-700"
            >
              Assign
            </button>
          </form>
        )}

        <p className="text-xs text-gray-500">
          Note: Users must first create an account (sign up) before they can be assigned to a parlour.
        </p>
      </div>

      {/* Danger zone */}
      <div className="border border-red-200 rounded p-4 space-y-4">
        <h2 className="font-medium text-red-600">Danger Zone</h2>
        <p className="text-sm text-gray-600">
          Deleting a parlour will remove all user assignments. This action cannot be undone.
        </p>
        <form action={deleteParlour}>
          <input type="hidden" name="id" value={parlour.id} />
          <button
            type="submit"
            className="bg-red-600 text-white rounded px-4 py-2 text-sm hover:bg-red-700"
          >
            Delete Parlour
          </button>
        </form>
      </div>
    </div>
  );
}
