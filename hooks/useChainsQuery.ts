'use client';

import { useQuery } from '@tanstack/react-query';
import { Chain, ApiResponse } from '@/lib/types';

interface UseChainsOptions {
  enabled?: boolean;
  refetchInterval?: number | false;
  initialData?: Chain[];
}

async function fetchChains(): Promise<Chain[]> {
  const response = await fetch('/api/v1/chains');
  const data: ApiResponse<Chain[]> = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch chains');
  }

  return data.data || [];
}

export function useChainsQuery({
  enabled = true,
  refetchInterval = 60000, // Poll every 60 seconds by default
  initialData,
}: UseChainsOptions = {}) {
  return useQuery({
    queryKey: ['chains'],
    queryFn: fetchChains,
    enabled,
    refetchInterval,
    initialData,
    // Keep previous data while fetching new data
    placeholderData: (previousData) => previousData,
  });
}