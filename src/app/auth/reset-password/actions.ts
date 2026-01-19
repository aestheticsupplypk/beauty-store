'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  const cookieStore = cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  // Update the user's password using server-side client (can read httpOnly cookies)
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    console.error('Password update error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
