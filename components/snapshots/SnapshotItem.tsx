import { Snapshot } from '@/lib/types';
import { DownloadButton } from './DownloadButton';

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
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'pruned':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getCompressionBadge = (compression: string) => {
    switch (compression) {
      case 'lz4':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'zst':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Block #{snapshot.height.toLocaleString()}
            </h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(snapshot.type)}`}>
              {snapshot.type}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCompressionBadge(snapshot.compressionType)}`}>
              {snapshot.compressionType.toUpperCase()}
            </span>
          </div>
          
          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <p>Size: {formatSize(snapshot.size)}</p>
            <p>Created: {formatDate(snapshot.createdAt)}</p>
            <p className="font-mono text-xs break-all">{snapshot.fileName}</p>
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