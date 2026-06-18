'use client';

import { useCallback, useState } from 'react';
import { Snapshot } from '@/lib/types';

interface UseDownloadUrlOptions {
  userEmail?: string | null;
}

interface DownloadUrlState {
  downloadUrl: string;
  expiresAt: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useDownloadUrl({ userEmail }: UseDownloadUrlOptions = {}) {
  const [state, setState] = useState<DownloadUrlState>({
    downloadUrl: '',
    expiresAt: null,
    isLoading: false,
    error: null,
  });

  const generateDownloadUrl = useCallback(async (snapshot: Snapshot) => {
    setState({ downloadUrl: '', expiresAt: null, isLoading: true, error: null });

    try {
      const response = await fetch(`/api/v1/chains/${snapshot.chainId}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshotId: snapshot.id,
          email: userEmail || undefined,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success || !payload.data?.downloadUrl) {
        throw new Error(payload.message || payload.error || 'Failed to get download URL');
      }

      const downloadUrl = payload.data.downloadUrl as string;
      const expiresAt = typeof payload.data.expiresAt === 'string' ? payload.data.expiresAt : null;
      setState({ downloadUrl, expiresAt, isLoading: false, error: null });
      return downloadUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get download URL';
      setState({ downloadUrl: '', expiresAt: null, isLoading: false, error: message });
      throw error;
    }
  }, [userEmail]);

  const clearDownloadUrl = useCallback(() => {
    setState({ downloadUrl: '', expiresAt: null, isLoading: false, error: null });
  }, []);

  return {
    ...state,
    generateDownloadUrl,
    clearDownloadUrl,
  };
}
