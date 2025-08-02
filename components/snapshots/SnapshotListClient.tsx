'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Snapshot } from '@/lib/types';
import { SnapshotItem } from './SnapshotItem';
import { SnapshotUpgradePrompt } from './SnapshotUpgradePrompt';
import { DownloadModal } from '@/components/common/DownloadModal';
import { useAuth } from '@/hooks/useAuth';
import { getSnapshotAccessSummary } from '@/lib/utils/tier';

interface SnapshotListClientProps {
  chainId: string;
  chainName: string;
  chainLogoUrl?: string;
  initialSnapshots: Snapshot[];
}

export function SnapshotListClient({ chainId, chainName, chainLogoUrl, initialSnapshots }: SnapshotListClientProps) {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Handle download query parameter
  useEffect(() => {
    const download = searchParams.get('download');
    if (download === 'latest' && initialSnapshots.length > 0) {
      // Find the latest snapshot
      const latestSnapshot = initialSnapshots.reduce((latest, current) => {
        return new Date(current.updatedAt) > new Date(latest.updatedAt) ? current : latest;
      }, initialSnapshots[0]);
      
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
  }, [searchParams, initialSnapshots, user]);

  const filteredSnapshots = useMemo(() => {
    if (selectedType === 'all') return initialSnapshots;
    return initialSnapshots.filter(snapshot => snapshot.type === selectedType);
  }, [initialSnapshots, selectedType]);

  // Get inaccessible snapshots for upgrade prompts
  const inaccessibleSnapshots = useMemo(() => {
    return filteredSnapshots.filter(snapshot => !snapshot.isAccessible);
  }, [filteredSnapshots]);

  // Group inaccessible snapshots by minimum tier
  const upgradePrompts = useMemo(() => {
    const tiers = new Set(inaccessibleSnapshots.map(s => s.minimumTier).filter(Boolean));
    return Array.from(tiers).sort((a, b) => {
      const order = { premium: 1, ultra: 2 };
      return (order[a as keyof typeof order] || 0) - (order[b as keyof typeof order] || 0);
    });
  }, [inaccessibleSnapshots]);

  // Tier access summary for user
  const userAccessSummary = useMemo(() => {
    return getSnapshotAccessSummary(user?.tier);
  }, [user?.tier]);

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

  if (initialSnapshots.length === 0) {
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
      {/* User Tier Summary */}
      {user && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                Your {user.tier?.charAt(0).toUpperCase()}{user.tier?.slice(1)} Tier Access
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {userAccessSummary.description} • {userAccessSummary.frequency} snapshots
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Next Snapshot
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                {userAccessSummary.hours.map(h => `${h.toString().padStart(2, '0')}:00`).join(', ')} UTC
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
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
              {type} ({type === 'all' ? initialSnapshots.length : initialSnapshots.filter(s => s.type === type).length})
            </button>
          ))}
        </nav>
      </div>

      {/* Upgrade Prompts */}
      {upgradePrompts.length > 0 && (
        <div className="space-y-4 mb-6">
          {upgradePrompts.map(tier => (
            <SnapshotUpgradePrompt
              key={tier}
              minimumTier={tier}
              userTier={user?.tier}
              chainName={chainName}
            />
          ))}
        </div>
      )}

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