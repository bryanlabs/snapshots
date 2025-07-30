'use client';

import { useAuth } from '@/hooks/useAuth';
import { ReactNode } from 'react';

export function LayoutProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // Adjust padding based on whether the upgrade banner is shown
  const paddingTop = user?.tier === 'premium' ? 'pt-16' : 'pt-28';
  
  return (
    <main className={paddingTop}>
      {children}
    </main>
  );
}