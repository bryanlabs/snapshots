import { Snapshot } from '@/lib/types';
import { DownloadButton } from './DownloadButton';
import { components, getCompressionColor, typography } from '@/lib/design-system';
import { cn } from '@/lib/utils';

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
    <div className={cn(components.card.base, 'p-6')}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className={typography.h5}>
              Block #{snapshot.height.toLocaleString()}
            </h3>
            <span className={cn(components.badge.base, getTypeColor(snapshot.type))}>
              {snapshot.type}
            </span>
            <span className={cn(
              components.badge.base,
              getCompressionColor(snapshot.compressionType).bg,
              getCompressionColor(snapshot.compressionType).text
            )}>
              {snapshot.compressionType.toUpperCase()}
            </span>
          </div>
          
          <div className={cn('space-y-1', typography.body.small, typography.muted)}>
            <p>Size: {formatSize(snapshot.size)}</p>
            <p>Created: {formatDate(snapshot.createdAt)}</p>
            <p className={typography.code}>{snapshot.fileName}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DownloadButton 
            snapshot={snapshot}
            chainName={chainName}
            chainLogoUrl={chainLogoUrl}
          />
        </div>
      </div>
    </div>
  );
}