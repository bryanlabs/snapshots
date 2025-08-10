'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { setUserContext, clearUserContext } from '@/lib/sentry';

export function SentryUserContext() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user) {
      setUserContext({
        id: session.user.id,
        email: session.user.email || undefined,
        username: session.user.name || undefined,
        tier: session.user.tier || 'free',
      });
    } else {
      clearUserContext();
    }
  }, [session]);

  return null;
}