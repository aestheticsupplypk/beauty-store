import { requireSectionAccess } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

async function fetchParlours() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('parlours')
    .select('*')
    .order('approved', { ascending: true }) // Pending first
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function fetchParlourUsers() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, parlour_id')
    .not('parlour_id', 'is', null);
  if (error) throw error;
  return data ?? [];
}

async function createParlour(formData: FormData) {
  'use server';
  await requireSectionAccess('parlours');

  const name = String(formData.get('name') || '').trim();
  const city = String(formData.get('city') || '').trim();
  const phone = String(formData.get('phone') || '').trim();
  const email = String(formData.get('email') || '').trim();

  if (!name) return;

  const supabase = getSupabaseServerClient();
  await supabase.from('parlours').insert({
    name,
    city: city || null,
    phone: phone || null,
    email: email || null,
    active: true,
  });

  revalidatePath('/admin/parlours');
}

async function toggleActive(formData: FormData) {
  'use server';
  await requireSectionAccess('parlours');

  const id = String(formData.get('id') || '');
  const currentActive = formData.get('current_active') === 'true';

  if (!id) return;

  const supabase = getSupabaseServerClient();
  await supabase
    .from('parlours')
    .update({ active: !currentActive })
    .eq('id', id);

  revalidatePath('/admin/parlours');
}

async function approveParlour(formData: FormData) {
  'use server';
  await requireSectionAccess('parlours');

  const id = String(formData.get('id') || '');
  if (!id) return;

  const supabase = getSupabaseServerClient();
  await supabase
    .from('parlours')
    .update({ approved: true, active: true })
    .eq('id', id);

  revalidatePath('/admin/parlours');
}

async function rejectParlour(formData: FormData) {
  'use server';
  await requireSectionAccess('parlours');

  const id = String(formData.get('id') || '');
  if (!id) return;

  const supabase = getSupabaseServerClient();
  
  // Get the parlour's user
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('parlour_id', id);

  // Remove parlour link from profiles
  if (profiles && profiles.length > 0) {
    for (const p of profiles) {
      await supabase
        .from('profiles')
        .update({ parlour_id: null })
        .eq('id', p.id);
    }
  }

  // Delete the parlour
  await supabase.from('parlours').delete().eq('id', id);

  revalidatePath('/admin/parlours');
}

export default async function AdminParloursPage() {
  await requireSectionAccess('parlours');
  const parlours = await fetchParlours();
  const parlourUsers = await fetchParlourUsers();

  // Group users by parlour_id
  const usersByParlour: Record<string, any[]> = {};
  for (const u of parlourUsers) {
    if (!usersByParlour[u.parlour_id]) usersByParlour[u.parlour_id] = [];
    usersByParlour[u.parlour_id].push(u);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Parlours</h1>
        <Link
          href="/admin/parlours/shipping"
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-4 py-2 text-sm"
        >
          Shipping Rules →
        </Link>
      </div>

      <p className="text-sm text-gray-600">
        Manage parlours that can place wholesale orders through the Parlour Portal.
      </p>

      {/* Create new parlour form */}
      <div className="border rounded p-4 space-y-4">
        <h2 className="font-medium">Add New Parlour</h2>
        <form action={createParlour} className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            type="text"
            name="name"
            placeholder="Parlour Name *"
            required
            className="border rounded px-3 py-2 text-sm"
          />
          <input
            type="text"
            name="city"
            placeholder="City"
            className="border rounded px-3 py-2 text-sm"
          />
          <input
            type="text"
            name="phone"
            placeholder="Phone"
            className="border rounded px-3 py-2 text-sm"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="border rounded px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="bg-black text-white rounded px-4 py-2 text-sm hover:bg-gray-800"
          >
            Add Parlour
          </button>
        </form>
      </div>

      {/* Parlours list */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="py-2 px-3 border-b">Name</th>
              <th className="py-2 px-3 border-b">City</th>
              <th className="py-2 px-3 border-b">Phone</th>
              <th className="py-2 px-3 border-b">Email</th>
              <th className="py-2 px-3 border-b">Portal Users</th>
              <th className="py-2 px-3 border-b">Status</th>
              <th className="py-2 px-3 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {parlours.map((p: any) => {
              const users = usersByParlour[p.id] || [];
              return (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3 font-medium">{p.name}</td>
                  <td className="py-2 px-3">{p.city || '-'}</td>
                  <td className="py-2 px-3">{p.phone || '-'}</td>
                  <td className="py-2 px-3">{p.email || '-'}</td>
                  <td className="py-2 px-3">
                    {users.length > 0 ? (
                      <span className="text-xs text-gray-600">
                        {users.map((u: any) => u.email).join(', ')}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">No users assigned</span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {!p.approved ? (
                      <span className="px-2 py-1 rounded text-xs bg-amber-100 text-amber-800">
                        Pending Approval
                      </span>
                    ) : (
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          p.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {p.active ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 space-x-2">
                    {!p.approved ? (
                      <>
                        <form action={approveParlour} className="inline">
                          <input type="hidden" name="id" value={p.id} />
                          <button
                            type="submit"
                            className="text-xs text-green-600 hover:underline font-medium"
                          >
                            Approve
                          </button>
                        </form>
                        <form action={rejectParlour} className="inline">
                          <input type="hidden" name="id" value={p.id} />
                          <button
                            type="submit"
                            className="text-xs text-red-600 hover:underline"
                          >
                            Reject
                          </button>
                        </form>
                        <Link
                          href={`/admin/parlours/${p.id}`}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          View
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href={`/admin/parlours/${p.id}`}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          Edit
                        </Link>
                        <form action={toggleActive} className="inline">
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="current_active" value={String(p.active)} />
                          <button
                            type="submit"
                            className="text-xs text-gray-600 hover:underline"
                          >
                            {p.active ? 'Deactivate' : 'Activate'}
                          </button>
                        </form>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
            {parlours.length === 0 && (
              <tr>
                <td colSpan={7} className="py-4 text-center text-gray-500">
                  No parlours yet. Add one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
