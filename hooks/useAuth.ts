'use client';

import { useSession } from 'next-auth/react';

export function useAuth() {
  const { data: session, status } = useSession();
  
  return {
    user: session?.user || null,
    loading: status === 'loading',
    error: null,
    // Legacy compatibility - these aren't used with NextAuth
    login: async () => false,
    logout: async () => {},
    checkAuth: async () => {},
  };
}