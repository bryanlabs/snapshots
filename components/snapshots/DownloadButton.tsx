'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CloudDownload, Terminal } from 'lucide-react';
import { Snapshot } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { useDownloadUrl } from '@/hooks/useDownloadUrl';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { DownloadModal } from '../common/DownloadModal';
import { DownloadUrlDialog } from './DownloadUrlDialog';
import { getEffectiveAccessTier, isPremiumTier } from '@/lib/utils/tier';

interface DownloadButtonProps {
  snapshot: Snapshot;
  chainName: string;
  chainLogoUrl?: string;
  disabled?: boolean;
  effectiveAccessTier?: 'free' | 'premium' | 'ultra';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function DownloadButton({
  snapshot,
  disabled = false,
  effectiveAccessTier,
}: DownloadButtonProps) {
  const { user } = useAuth();
  const [showTierModal, setShowTierModal] = useState(false);
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { downloadUrl, expiresAt, isLoading, generateDownloadUrl, clearDownloadUrl } = useDownloadUrl({
    userEmail: user?.email,
  });
  const effectiveTier = effectiveAccessTier || getEffectiveAccessTier(user?.tier);
  const hasInstantDownload = isPremiumTier(effectiveTier);

  const startBrowserDownload = (url: string) => {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const openDownloadUrl = async () => {
    try {
      setError(null);
      await generateDownloadUrl(snapshot);
      setShowUrlDialog(true);
      setShowTierModal(false);
    } catch (downloadError) {
      console.error('Download failed:', downloadError);
      setError(downloadError instanceof Error ? downloadError.message : 'Failed to generate download URL');
    }
  };

  const startInstantDownload = async () => {
    try {
      setError(null);
      const url = await generateDownloadUrl(snapshot);
      startBrowserDownload(url);
      setShowTierModal(false);
    } catch (downloadError) {
      console.error('Download failed:', downloadError);
      setError(downloadError instanceof Error ? downloadError.message : 'Failed to generate download URL');
    }
  };

  const handleDownloadClick = () => {
    if (disabled || isLoading) return;

    if (hasInstantDownload) {
      void startInstantDownload();
    } else {
      setShowTierModal(true);
    }
  };

  return (
    <>
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <motion.button
          onClick={handleDownloadClick}
          disabled={isLoading || disabled}
          className={`
            flex items-center justify-center gap-2 rounded-lg px-4 py-2 transition-colors disabled:cursor-not-allowed
            ${disabled
              ? 'bg-gray-400 text-gray-200 dark:bg-gray-600 dark:text-gray-400'
              : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400'
            }
          `}
          whileHover={disabled ? {} : { scale: 1.02 }}
          whileTap={disabled ? {} : { scale: 0.98 }}
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <CloudDownload className="h-5 w-5" />
              <span>{disabled ? 'Restricted' : hasInstantDownload ? 'Download Now' : 'Download'}</span>
            </>
          )}
        </motion.button>

        {hasInstantDownload && !disabled && (
          <motion.button
            type="button"
            onClick={() => void openDownloadUrl()}
            disabled={isLoading}
            title="Command options"
            aria-label="Command options"
            className="flex h-10 w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-3 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Terminal className="h-4 w-4" />
          </motion.button>
        )}
      </div>

      {error && (
        <p className="mt-2 max-w-xs text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      <DownloadModal
        isOpen={showTierModal}
        onClose={() => setShowTierModal(false)}
        onConfirm={() => void openDownloadUrl()}
        snapshot={{
          chainId: snapshot.chainId,
          filename: snapshot.fileName,
          size: formatFileSize(snapshot.size),
          blockHeight: snapshot.height,
        }}
        isLoading={isLoading}
      />

      <DownloadUrlDialog
        isOpen={showUrlDialog}
        onClose={() => {
          setShowUrlDialog(false);
          clearDownloadUrl();
        }}
        downloadUrl={downloadUrl}
        expiresAt={expiresAt}
        snapshot={snapshot}
      />
    </>
  );
}
