'use client';

import { useState, useEffect } from 'react';
import { Snapshot, ApiResponse } from '@/lib/types';

export function useSnapshots(chainId: string) {
  const [snapshots, setSnapshots] = useState<Snapshot[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSnapshots = async () => {
    if (!chainId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/v1/chains/${chainId}/snapshots`);
      const data: ApiResponse<Snapshot[]> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch snapshots');
      }

      setSnapshots(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshots();
  }, [chainId]);

  return {
    snapshots,
    loading,
    error,
    refetch: fetchSnapshots,
  };
}