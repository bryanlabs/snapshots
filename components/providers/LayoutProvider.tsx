'use client';

import { useAuth } from '@/hooks/useAuth';
import { ReactNode } from 'react';
import { isFreeTier } from '@/lib/utils/tier';

export function LayoutProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  
  // Adjust padding to clear the fixed network bar (40px) plus the fixed header,
  // accounting for the extra upgrade banner shown to free-tier users.
  const paddingTop = !loading && isFreeTier(user?.tier) ? 'pt-[144px]' : 'pt-[96px]';
  
  return (
    <main className={paddingTop}>
      {children}
    </main>
  );
}
