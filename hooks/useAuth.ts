'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';

export function useAuth() {
  const { data: session, status } = useSession();
  
  // Fetch user tier information from API
  const { data: userTierData } = useQuery({
    queryKey: ['user-me'],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      
      const response = await fetch('/api/v1/auth/me');
      if (!response.ok) return null;
      
      const data = await response.json();
      return data.success ? data.data : null;
    },
    enabled: !!session?.user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Merge session data with tier information
  const user = session?.user ? {
    ...session.user,
    tier: userTierData?.tier || session.user.tier || 'free'
  } : null;
  
  return {
    user,
    loading: status === 'loading',
    error: null,
    // Legacy compatibility - these aren't used with NextAuth
    login: async () => false,
    logout: async () => {},
    checkAuth: async () => {},
  };
}