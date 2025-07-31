'use client';

import { useQuery } from '@tanstack/react-query';
import { Snapshot, ApiResponse } from '@/lib/types';

interface UseSnapshotsOptions {
  chainId: string;
  enabled?: boolean;
  refetchInterval?: number | false;
  initialData?: Snapshot[];
}

async function fetchSnapshots(chainId: string): Promise<Snapshot[]> {
  const response = await fetch(`/api/v1/chains/${chainId}/snapshots`);
  const data: ApiResponse<Snapshot[]> = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch snapshots');
  }

  return data.data || [];
}

export function useSnapshotsQuery({
  chainId,
  enabled = true,
  refetchInterval = 30000, // Poll every 30 seconds by default
  initialData,
}: UseSnapshotsOptions) {
  return useQuery({
    queryKey: ['snapshots', chainId],
    queryFn: () => fetchSnapshots(chainId),
    enabled: enabled && !!chainId,
    refetchInterval,
    initialData,
    // Keep previous data while fetching new data
    placeholderData: (previousData) => previousData,
  });
}