'use client';

import { useState, useEffect } from 'react';
import { Chain, ApiResponse } from '@/lib/types';

export function useChains() {
  const [chains, setChains] = useState<Chain[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChains = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/v1/chains');
      const data: ApiResponse<Chain[]> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch chains');
      }

      setChains(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChains();
  }, []);

  return {
    chains,
    loading,
    error,
    refetch: fetchChains,
  };
}