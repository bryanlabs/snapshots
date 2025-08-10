'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Snapshot } from '@/lib/types';
import { SnapshotItem } from './SnapshotItem';
import { DownloadModal } from '@/components/common/DownloadModal';
import { useAuth } from '@/hooks/useAuth';
import { useSnapshotsQuery } from '@/hooks/useSnapshotsQuery';
import { RefreshCw } from 'lucide-react';

interface SnapshotListRealtimeProps {
  chainId: string;
  chainName: string;
  chainLogoUrl?: string;
  initialSnapshots: Snapshot[];
  pollInterval?: number;
}

export function SnapshotListRealtime({ 
  chainId, 
  chainName, 
  chainLogoUrl, 
  initialSnapshots,
  pollInterval = 30000 // 30 seconds default
}: SnapshotListRealtimeProps) {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Use React Query for real-time updates
  const { data: snapshots = initialSnapshots, isRefetching, refetch } = useSnapshotsQuery({
    chainId,
    initialData: initialSnapshots,
    refetchInterval: pollInterval,
  });

  // Handle download query parameter
  useEffect(() => {
    const download = searchParams.get('download');
    if (download === 'latest' && snapshots.length > 0) {
      // Find the latest snapshot
      const latestSnapshot = snapshots.reduce((latest, current) => {
        return new Date(current.updatedAt) > new Date(latest.updatedAt) ? current : latest;
      }, snapshots[0]);
      
      setSelectedSnapshot(latestSnapshot);
      
      // Premium and unlimited users get instant download without modal
      if (user?.tier === 'premium' || user?.tier === 'unlimited') {
        // Directly trigger download
        handleInstantDownload(latestSnapshot);
      } else {
        // Show modal for free users
        setShowDownloadModal(true);
      }
      
      // Remove the query parameter from URL without reload
      const url = new URL(window.location.href);
      url.searchParams.delete('download');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, snapshots, user]);

  const filteredSnapshots = useMemo(() => {
    if (selectedType === 'all') return snapshots;
    return snapshots.filter(snapshot => snapshot.type === selectedType);
  }, [snapshots, selectedType]);

  const handleInstantDownload = async (snapshot: Snapshot) => {
    try {
      // Get the download URL from the API
      const response = await fetch(`/api/v1/chains/${chainId}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          snapshotId: snapshot.id,
          email: user?.email 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get download URL');
      }

      const data = await response.json();
      
      if (data.success && data.data?.downloadUrl) {
        window.location.href = data.data.downloadUrl;
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDownload = async () => {
    if (!selectedSnapshot) return;
    
    try {
      // Get the download URL from the API
      const response = await fetch(`/api/v1/chains/${chainId}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          snapshotId: selectedSnapshot.id,
          email: user?.email 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get download URL');
      }

      const data = await response.json();
      
      if (data.success && data.data?.downloadUrl) {
        window.location.href = data.data.downloadUrl;
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
    
    setShowDownloadModal(false);
    setSelectedSnapshot(null);
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
      {/* Filter Tabs with Refresh Indicator */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <nav className="-mb-px flex space-x-8">
            {['all', 'default', 'pruned', 'archive'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`
                  py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors
                  ${selectedType === type
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                {type} ({type === 'all' ? snapshots.length : snapshots.filter(s => s.type === type).length})
              </button>
            ))}
          </nav>
          
          {/* Refresh Indicator */}
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
      </div>

      {/* Snapshots */}
      <div className="space-y-4">
        {filteredSnapshots.map(snapshot => (
          <SnapshotItem 
            key={snapshot.id} 
            snapshot={snapshot}
            chainName={chainName}
            chainLogoUrl={chainLogoUrl}
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
        />
      )}
    </div>
  );
}