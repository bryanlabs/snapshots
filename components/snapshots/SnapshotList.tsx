'use client';

import { Snapshot } from '@/lib/types';
import { SnapshotItem } from './SnapshotItem';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { useSnapshots } from '@/hooks/useSnapshots';

interface SnapshotListProps {
  chainId: string;
  chainName: string;
}

export function SnapshotList({ chainId, chainName }: SnapshotListProps) {
  const { snapshots, loading, error, refetch } = useSnapshots(chainId);

  // Use all snapshots since we removed type filtering
  const filteredSnapshots = snapshots || [];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage 
        title="Failed to load snapshots" 
        message={error} 
        onRetry={refetch}
      />
    );
  }

  if (!snapshots || snapshots.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          No snapshots available for this chain yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredSnapshots.map(snapshot => (
        <SnapshotItem 
          key={snapshot.id} 
          snapshot={snapshot}
          chainName={chainName}
        />
      ))}
    </div>
  );
}