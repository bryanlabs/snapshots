'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Snapshot } from '@/lib/types';
import { SnapshotItem } from './SnapshotItem';
import { DownloadModal } from '@/components/common/DownloadModal';
import { useAuth } from '@/hooks/useAuth';
import { useSnapshotsQuery } from '@/hooks/useSnapshotsQuery';
import { isPremiumTier } from '@/lib/utils/tier';
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
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
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
      
      // Premium tier users (premium, ultra, ultimate, etc.) get instant download without modal
      if (isPremiumTier(user?.tier)) {
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

  // Use all snapshots since we removed type filtering
  const filteredSnapshots = snapshots;

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
        // Store the download URL and show the modal instead of direct download
        setDownloadUrl(data.data.downloadUrl);
        setShowUrlModal(true);
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

      {/* URL Modal - Same as DownloadButton component */}
      <AnimatePresence>
        {showUrlModal && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowUrlModal(false)}
        >
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                {chainLogoUrl && (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 p-2 flex-shrink-0">
                    <Image
                      src={chainLogoUrl}
                      alt={`${chainName} logo`}
                      width={48}
                      height={48}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold mb-1">Download Ready</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your snapshot is ready to download
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUrlModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <motion.button
                onClick={() => {
                  navigator.clipboard.writeText(downloadUrl);
                  setShowCopySuccess(true);
                  setTimeout(() => setShowCopySuccess(false), 2000);
                }}
                className={`
                  flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-300
                  flex items-center justify-center gap-2
                  ${showCopySuccess 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }
                `}
                whileTap={{ scale: 0.98 }}
              >
                <AnimatePresence mode="wait">
                  {showCopySuccess ? (
                    <>
                      <motion.svg
                        key="check"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </motion.svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <motion.svg
                        key="copy"
                        initial={{ scale: 0, rotate: 180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: -180 }}
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </motion.svg>
                      <span>Copy URL</span>
                    </>
                  )}
                </AnimatePresence>
              </motion.button>
              
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                Download
              </a>
            </div>

          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}