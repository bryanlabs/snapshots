'use client';

import { SnapshotItem } from '@/components/snapshots/SnapshotItem';

const osmosisSnapshots = [
  {
    id: 'osmosis-snapshot-1',
    chainId: 'osmosis',
    height: 12345678,
    size: 128849018880,
    fileName: 'osmosis-1-12345678.tar.lz4',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    type: 'pruned' as const,
    compressionType: 'lz4' as const,
  },
  {
    id: 'osmosis-snapshot-2',
    chainId: 'osmosis',
    height: 12300000,
    size: 127312345600,
    fileName: 'osmosis-1-12300000.tar.lz4',
    createdAt: new Date('2024-01-09'),
    updatedAt: new Date('2024-01-09'),
    type: 'pruned' as const,
    compressionType: 'lz4' as const,
  },
];

export default function OsmosisStaticPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Osmosis Snapshots</h1>
      <p className="text-gray-600 mb-8">Static test page for Osmosis snapshots</p>
      
      <div className="space-y-4">
        {osmosisSnapshots.map(snapshot => (
          <SnapshotItem 
            key={snapshot.id} 
            snapshot={snapshot}
            chainName="Osmosis"
          />
        ))}
      </div>
    </div>
  );
}