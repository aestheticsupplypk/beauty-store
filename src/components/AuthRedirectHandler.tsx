'use client';

import { useEffect } from 'react';

export default function AuthRedirectHandler() {
  useEffect(() => {
    // Check if there's a hash with recovery type (password reset link)
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type');
      
      if (type === 'recovery') {
        // Use window.location to preserve the hash fragment
        window.location.href = '/auth/reset-password' + window.location.hash;
      }
    }
  }, []);

  return null;
}
