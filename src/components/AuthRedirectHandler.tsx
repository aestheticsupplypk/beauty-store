'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthRedirectHandler() {
  const router = useRouter();

  useEffect(() => {
    // Check if there's a hash with recovery type (password reset link)
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type');
      
      if (type === 'recovery') {
        // Redirect to reset password page with the hash
        router.push('/auth/reset-password' + window.location.hash);
      }
    }
  }, [router]);

  return null;
}
