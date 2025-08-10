import { Snapshot } from '@/lib/types';
import { DownloadButton } from './DownloadButton';
import { TierAccessBadge, SnapshotFreshnessIndicator } from './TierAccessBadge';
import { components, getCompressionColor, getArchiveColor, typography } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import { getArchiveFormat } from '@/lib/config/supported-formats';

interface SnapshotCardProps {
  snapshot: Snapshot;
  chainName: string;
  chainLogoUrl?: string;
}

export function SnapshotItem({ snapshot, chainName, chainLogoUrl }: SnapshotCardProps) {
  const formatSize = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'archive':
        return components.badge.variant.secondary;
      case 'pruned':
        return components.badge.variant.primary;
      default:
        return components.badge.variant.default;
    }
  };

  return (
    <div className={cn(
      components.card.base, 
      'p-6',
      !snapshot.isAccessible && 'opacity-75 bg-gray-50 dark:bg-gray-800/50'
    )}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {/* Show type badge only if it's archive (not pruned) */}
            {snapshot.type === 'archive' && (
              <span className={cn(components.badge.base, getTypeColor(snapshot.type))}>
                {snapshot.type}
              </span>
            )}
            {/* Order: Tier, Archive Format, Compression Format */}
            <TierAccessBadge
              minimumTier={snapshot.minimumTier}
              userTier={snapshot.userTier}
              isAccessible={snapshot.isAccessible}
              generationCycle={snapshot.generationCycle}
              hourGenerated={snapshot.hourGenerated}
            />
            {(() => {
              const archiveFormat = getArchiveFormat(snapshot.fileName);
              return (
                <>
                  {archiveFormat && (
                    <span className={cn(
                      components.badge.base,
                      getArchiveColor(archiveFormat).bg,
                      getArchiveColor(archiveFormat).text
                    )}>
                      {archiveFormat.toLowerCase()}
                    </span>
                  )}
                  {/* Only show compression if it's not 'none' */}
                  {snapshot.compressionType && snapshot.compressionType !== 'none' && (
                    <span className={cn(
                      components.badge.base,
                      getCompressionColor(snapshot.compressionType).bg,
                      getCompressionColor(snapshot.compressionType).text
                    )}>
                      {snapshot.compressionType.toLowerCase()}
                    </span>
                  )}
                </>
              );
            })()}
          </div>
          
          <div className={cn('space-y-1', typography.body.small, typography.muted)}>
            <p>Size: {formatSize(snapshot.size)}</p>
            <div className="flex items-center gap-2">
              <span>Created: {formatDate(snapshot.createdAt)}</span>
              <SnapshotFreshnessIndicator
                hourGenerated={snapshot.hourGenerated}
                userTier={snapshot.userTier}
                isAccessible={snapshot.isAccessible}
              />
            </div>
            <p className={typography.code}>{snapshot.fileName}</p>
            {!snapshot.isAccessible && snapshot.minimumTier && (
              <p className="text-amber-600 dark:text-amber-400 text-xs mt-2">
                Upgrade to {snapshot.minimumTier} tier for access
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DownloadButton 
            snapshot={snapshot}
            chainName={chainName}
            chainLogoUrl={chainLogoUrl}
            disabled={!snapshot.isAccessible}
          />
        </div>
      </div>
    </div>
  );
}