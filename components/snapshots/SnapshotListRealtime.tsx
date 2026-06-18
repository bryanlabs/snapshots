'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Snapshot } from '@/lib/types';
import { SnapshotItem } from './SnapshotItem';
import { DownloadModal } from '@/components/common/DownloadModal';
import { DownloadUrlDialog } from './DownloadUrlDialog';
import { useAuth } from '@/hooks/useAuth';
import { useDownloadUrl } from '@/hooks/useDownloadUrl';
import { useSnapshotsQuery } from '@/hooks/useSnapshotsQuery';
import { getEffectiveAccessTier, isPremiumTier } from '@/lib/utils/tier';
import { RefreshCw } from 'lucide-react';

interface SnapshotListRealtimeProps {
  chainId: string;
  chainName: string;
  chainLogoUrl?: string;
  initialSnapshots: Snapshot[];
  pollInterval?: number;
  effectiveAccessTier?: 'free' | 'premium' | 'ultra';
}

export function SnapshotListRealtime({ 
  chainId, 
  chainName, 
  chainLogoUrl, 
  initialSnapshots,
  pollInterval = 30000, // 30 seconds default
  effectiveAccessTier,
}: SnapshotListRealtimeProps) {
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { downloadUrl, expiresAt, isLoading, generateDownloadUrl, clearDownloadUrl } = useDownloadUrl({
    userEmail: user?.email,
  });
  const activeAccessTier = effectiveAccessTier || getEffectiveAccessTier(user?.tier);

  // Use React Query for real-time updates
  const { data: snapshots = initialSnapshots, isRefetching, refetch } = useSnapshotsQuery({
    chainId,
    initialData: initialSnapshots,
    refetchInterval: pollInterval,
  });

  const handleInstantDownload = useCallback(async (snapshot: Snapshot) => {
    await generateDownloadUrl(snapshot);
    setSelectedSnapshot(snapshot);
    setShowUrlModal(true);
  }, [generateDownloadUrl]);

  // Handle download query parameter
  useEffect(() => {
    const download = searchParams.get('download');
    if (download === 'latest' && snapshots.length > 0) {
      const latestSnapshot = snapshots.reduce((latest, current) => {
        return new Date(current.updatedAt) > new Date(latest.updatedAt) ? current : latest;
      }, snapshots[0]);
      
      setSelectedSnapshot(latestSnapshot);
      
      // Premium tier users (premium, ultra, ultimate, etc.) get instant download without modal
      if (isPremiumTier(activeAccessTier)) {
        void handleInstantDownload(latestSnapshot);
      } else {
        setShowDownloadModal(true);
      }
      
      // Remove the query parameter from URL without reload
      const url = new URL(window.location.href);
      url.searchParams.delete('download');
      window.history.replaceState({}, '', url.toString());
    }
  }, [activeAccessTier, handleInstantDownload, searchParams, snapshots]);

  // Use all snapshots since we removed type filtering
  const filteredSnapshots = useMemo(() => snapshots, [snapshots]);

  const handleDownload = async () => {
    if (!selectedSnapshot) return;

    try {
      await handleInstantDownload(selectedSnapshot);
    } catch (error) {
      console.error('Download failed:', error);
    }

    setShowDownloadModal(false);
  };

  if (snapshots.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          No snapshots available for this chain yet.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Refresh Indicator */}
      <div className="mb-6 flex justify-end">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            title="Refresh snapshots"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </button>
          {isRefetching && <span>Updating...</span>}
          <span className="text-xs">Auto-refresh every 30s</span>
        </div>
      </div>

      {/* Snapshots */}
      <div className="space-y-4">
        {filteredSnapshots.map(snapshot => (
          <SnapshotItem 
            key={snapshot.id} 
            snapshot={snapshot}
            chainName={chainName}
            chainLogoUrl={chainLogoUrl}
            effectiveAccessTier={activeAccessTier}
          />
        ))}
      </div>
      
      {/* Download Modal */}
      {selectedSnapshot && (
        <DownloadModal
          isOpen={showDownloadModal}
          onClose={() => {
            setShowDownloadModal(false);
            setSelectedSnapshot(null);
          }}
          onConfirm={handleDownload}
          snapshot={{
            chainId: chainId,
            filename: selectedSnapshot.fileName,
            size: `${(selectedSnapshot.size / (1024 * 1024 * 1024)).toFixed(1)} GB`,
            blockHeight: selectedSnapshot.height,
          }}
          isLoading={isLoading}
        />
      )}

      <DownloadUrlDialog
        isOpen={showUrlModal}
        onClose={() => {
          setShowUrlModal(false);
          setSelectedSnapshot(null);
          clearDownloadUrl();
        }}
        downloadUrl={downloadUrl}
        expiresAt={expiresAt}
        snapshot={selectedSnapshot}
      />
    </div>
  );
}
