'use client';

import { useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export default function AdminSignOut() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }, [supabase, router]);

  // Session timeout - auto logout after 15 minutes of inactivity
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleSignOut();
      }, SESSION_TIMEOUT_MS);
    };

    // Events that reset the timer (user activity)
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Start the timer
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [handleSignOut]);

  return (
    <button
      onClick={handleSignOut}
      className="text-base font-bold text-red-600 hover:text-red-800 hover:underline mt-4"
    >
      Sign Out
    </button>
  );
}
