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
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string>('');

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
        console.log('Download URL generated:', data.data.downloadUrl);
        
        // Store the download URL
        setDownloadUrl(data.data.downloadUrl);
        
        // Show URL in console for debugging
        console.log('To download with curl:');
        console.log(`curl -O "${data.data.downloadUrl}"`);
        
        // For large files, show the URL instead of auto-downloading
        setShowUrlModal(true);
        setIsDownloading(false);
        setShowModal(false);
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

    {/* URL Modal */}
    {showUrlModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">Download Ready</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Your download URL has been generated. For large files, we recommend using a download manager or command-line tool.
          </p>
          
          <div className="bg-gray-100 dark:bg-gray-700 rounded p-3 mb-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Download URL:</p>
            <input
              type="text"
              readOnly
              value={downloadUrl}
              className="w-full bg-transparent text-sm font-mono text-gray-800 dark:text-gray-200 outline-none"
              onClick={(e) => e.currentTarget.select()}
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3 mb-4">
            <p className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-1">Recommended: Use curl or wget</p>
            <code className="text-xs font-mono text-gray-700 dark:text-gray-300 block overflow-x-auto">
              curl -LO "{downloadUrl}"
            </code>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(downloadUrl);
                alert('URL copied to clipboard!');
              }}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
            >
              Copy URL
            </button>
            <button
              onClick={() => setShowUrlModal(false)}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}