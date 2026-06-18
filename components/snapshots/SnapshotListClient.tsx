'use client';

import { Snapshot } from '@/lib/types';
import { SnapshotListRealtime } from './SnapshotListRealtime';

interface SnapshotListClientProps {
  chainId: string;
  chainName: string;
  chainLogoUrl?: string;
  initialSnapshots: Snapshot[];
  effectiveAccessTier?: 'free' | 'premium' | 'ultra';
}

export function SnapshotListClient(props: SnapshotListClientProps) {
  return <SnapshotListRealtime {...props} />;
}
