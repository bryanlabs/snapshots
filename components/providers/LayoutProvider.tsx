'use client';

import { useAuth } from '@/hooks/useAuth';
import { ReactNode } from 'react';
import { isFreeTier } from '@/lib/utils/tier';

export function LayoutProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  
  // Adjust padding based on whether the upgrade banner is shown
  const paddingTop = !loading && isFreeTier(user?.tier) ? 'pt-28' : 'pt-16';
  
  return (
    <main className={paddingTop}>
      {children}
    </main>
  );
}
