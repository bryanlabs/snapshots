'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Snapshot } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { DownloadModal } from '../common/DownloadModal';

interface DownloadButtonProps {
  snapshot: Snapshot;
  chainName: string;
  chainLogoUrl?: string;
  disabled?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function DownloadButton({ snapshot, chainName, chainLogoUrl, disabled = false }: DownloadButtonProps) {
  const { user } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bandwidth, setBandwidth] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  const handleDownloadClick = () => {
    if (disabled) return;
    
    // Premium and ultra users get instant download, others see modal
    if (user?.tier === 'premium' || user?.tier === 'ultra') {
      handleDownload();
    } else {
      setShowModal(true);
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
        <motion.button
          onClick={handleDownloadClick}
          disabled={isDownloading || disabled}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:cursor-not-allowed
            ${disabled 
              ? 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-400' 
              : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white'
            }
          `}
          whileHover={disabled ? {} : { scale: 1.02 }}
          whileTap={disabled ? {} : { scale: 0.98 }}
        >
        {isDownloading ? (
          <>
            <LoadingSpinner size="sm" />
            <span>Downloading...</span>
          </>
        ) : (
          <>
            <motion.svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              animate={disabled ? {} : { y: [0, 2, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {disabled ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 1.732a2 2 0 0 1-1.732-1v-10c0-.866.5-1.667 1.732-2L12 3.732a2 2 0 0 1 3.464 0L21.732 6.5c1.232.566 1.732 1.5 1.732 2.5v9a2 2 0 0 1-1.732 2L12 20.268a2 2 0 0 1-3.464 0L2.268 17.5A2 2 0 0 1 .536 15.5V6.5C.536 5.5 1.036 4.566 2.268 4L8.536.732A2 2 0 0 1 12 .732z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              )}
            </motion.svg>
            <span>{disabled ? 'Restricted' : 'Download'}</span>
          </>
        )}
      </motion.button>

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

    {/* URL Modal - Redesigned */}
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
    </>
  );
}