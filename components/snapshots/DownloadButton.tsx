'use client';

import { useState } from 'react';
import { Snapshot } from '@/lib/types';
import { useAuth } from '../providers/AuthProvider';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { DownloadModal } from '../common/DownloadModal';

interface DownloadButtonProps {
  snapshot: Snapshot;
  chainName: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function DownloadButton({ snapshot, chainName }: DownloadButtonProps) {
  const { user } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bandwidth, setBandwidth] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleDownloadClick = () => {
    // Show modal for free users, proceed directly for premium users
    if (!user) {
      setShowModal(true);
    } else {
      handleDownload();
    }
  };

  const handleDownload = async () => {
    setShowModal(false);
    try {
      setIsDownloading(true);
      setProgress(0);
      setBandwidth(null);

      // Get the download URL from the API
      const response = await fetch(`/api/v1/chains/${snapshot.chainId}/download`, {
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
        // Create a temporary link and click it
        const link = document.createElement('a');
        link.href = data.data.downloadUrl;
        link.download = snapshot.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Simulate download progress (in a real app, you'd track actual progress)
        const interval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 95) {
              clearInterval(interval);
              setTimeout(() => {
                setIsDownloading(false);
                setProgress(0);
                setBandwidth(null);
              }, 1000);
              return 100;
            }
            
            // Simulate bandwidth calculation
            const mbps = (Math.random() * 50 + 50).toFixed(1);
            setBandwidth(`${mbps} MB/s`);
            
            return prev + Math.random() * 10;
          });
        }, 500);
      }
    } catch (error) {
      console.error('Download failed:', error);
      setIsDownloading(false);
      setProgress(0);
      setBandwidth(null);
    }
  };

  return (
    <>
      <div className="flex flex-col items-end gap-2">
        <button
          onClick={handleDownloadClick}
          disabled={isDownloading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
        >
        {isDownloading ? (
          <>
            <LoadingSpinner size="sm" />
            <span>Downloading...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            <span>Download</span>
          </>
        )}
      </button>

      {isDownloading && (
        <div className="w-full space-y-1">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          {bandwidth && (
            <p className="text-xs text-gray-600 dark:text-gray-400 text-right">
              {bandwidth}
            </p>
          )}
        </div>
      )}
    </div>

    <DownloadModal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      onConfirm={handleDownload}
      snapshot={{
        chainId: snapshot.chainId,
        filename: snapshot.fileName,
        size: formatFileSize(snapshot.size),
        blockHeight: snapshot.height,
      }}
      isLoading={isDownloading}
    />
    </>
  );
}