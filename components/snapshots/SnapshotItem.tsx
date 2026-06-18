import { Database } from 'lucide-react';
import { Snapshot } from '@/lib/types';
import { DownloadButton } from './DownloadButton';
import { TierAccessBadge } from './TierAccessBadge';
import { components, typography } from '@/lib/design-system';
import { cn } from '@/lib/utils';

interface SnapshotCardProps {
  snapshot: Snapshot;
  chainName: string;
  chainLogoUrl?: string;
  effectiveAccessTier?: 'free' | 'premium' | 'ultra';
}

function formatSize(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(2)} GB`;
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelative(date: Date | string): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function SnapshotItem({
  snapshot,
  chainName,
  chainLogoUrl,
  effectiveAccessTier,
}: SnapshotCardProps) {
  const databaseLabel = snapshot.databaseLabel || (
    snapshot.databaseBackend === 'pebbledb' ? 'PebbleDB' : 'LevelDB'
  );
  const compressionLabel = snapshot.compressionType === 'zst'
    ? 'zstd'
    : snapshot.compressionType === 'lz4'
      ? 'lz4'
      : 'raw';
  const visibilityLabel = snapshot.isOwner
    ? 'Yours'
    : snapshot.isCommunity
      ? 'Community'
      : snapshot.isCustom
        ? 'Private custom'
        : null;

  return (
    <div className={cn(
      components.card.base,
      'p-6',
      !snapshot.isAccessible && 'opacity-75 bg-gray-50 dark:bg-gray-800/50'
    )}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {visibilityLabel && (
              <span className={cn(
                components.badge.base,
                snapshot.isCommunity && !snapshot.isOwner
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
              )}>
                {visibilityLabel}
              </span>
            )}
            {snapshot.customPublishStatus === 'pending_review' && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                pending review
              </span>
            )}
            {snapshot.isPinned && (
              <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800 dark:bg-sky-900/30 dark:text-sky-300">
                pinned
              </span>
            )}
            {snapshot.isFeatured && (
              <span className="rounded-full bg-fuchsia-100 px-2.5 py-0.5 text-xs font-semibold text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-300">
                featured
              </span>
            )}
            {snapshot.isCustom && snapshot.isRestoreVerified && (
              <span className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              )}>
                restore verified
              </span>
            )}
            {snapshot.minimumTier && snapshot.minimumTier !== 'free' && (
              <TierAccessBadge
                minimumTier={snapshot.minimumTier}
                userTier={snapshot.userTier}
                isAccessible={snapshot.isAccessible}
                generationCycle={snapshot.generationCycle}
                hourGenerated={snapshot.hourGenerated}
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-500" aria-hidden="true" />
            <span className="text-base font-semibold text-gray-900 dark:text-white">
              {databaseLabel}
            </span>
          </div>

          <div className={cn(
            'mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1',
            typography.body.small,
            typography.muted
          )}>
            <span suppressHydrationWarning title={formatDate(snapshot.createdAt)}>
              updated {formatRelative(snapshot.createdAt)}
            </span>
            <span aria-hidden="true" className="text-gray-300 dark:text-gray-600">·</span>
            <span>
              height {snapshot.height > 0 ? snapshot.height.toLocaleString() : 'unknown'}
            </span>
            <span aria-hidden="true" className="text-gray-300 dark:text-gray-600">·</span>
            <span>{compressionLabel}</span>
          </div>

          <div className="mt-2 space-y-1">
            <p className={cn('truncate font-mono', typography.body.xs, 'text-gray-400 dark:text-gray-500')}>
              {snapshot.fileName}
            </p>
            {snapshot.requestNote && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{snapshot.requestNote}</p>
            )}
            {snapshot.adminNote && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{snapshot.adminNote}</p>
            )}
            {!snapshot.isAccessible && snapshot.minimumTier && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                Your current account does not have access to this snapshot
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 lg:flex-col lg:items-end lg:justify-center">
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatSize(snapshot.size)}
            </div>
          </div>
          <DownloadButton
            snapshot={snapshot}
            chainName={chainName}
            chainLogoUrl={chainLogoUrl}
            disabled={!snapshot.isAccessible}
            effectiveAccessTier={effectiveAccessTier}
          />
        </div>
      </div>
    </div>
  );
}
