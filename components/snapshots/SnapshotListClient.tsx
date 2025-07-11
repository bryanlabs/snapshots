'use client';

import { useState, useMemo } from 'react';
import { Snapshot } from '@/lib/types';
import { SnapshotItem } from './SnapshotItem';

interface SnapshotListClientProps {
  chainId: string;
  chainName: string;
  initialSnapshots: Snapshot[];
}

export function SnapshotListClient({ chainId, chainName, initialSnapshots }: SnapshotListClientProps) {
  const [selectedType, setSelectedType] = useState<string>('all');

  const filteredSnapshots = useMemo(() => {
    if (selectedType === 'all') return initialSnapshots;
    return initialSnapshots.filter(snapshot => snapshot.type === selectedType);
  }, [initialSnapshots, selectedType]);

  if (initialSnapshots.length === 0) {
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
      {/* Filter Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {['all', 'default', 'pruned', 'archive'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors
                ${selectedType === type
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              {type} ({type === 'all' ? initialSnapshots.length : initialSnapshots.filter(s => s.type === type).length})
            </button>
          ))}
        </nav>
      </div>

      {/* Snapshots */}
      <div className="space-y-4">
        {filteredSnapshots.map(snapshot => (
          <SnapshotItem 
            key={snapshot.id} 
            snapshot={snapshot}
            chainName={chainName}
          />
        ))}
      </div>
    </div>
  );
}