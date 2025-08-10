export const mockChains = {
  'cosmos-hub': {
    id: 'cosmos-hub',
    name: 'Cosmos Hub',
    network: 'cosmoshub-4',
    description: 'The Cosmos Hub is the first of thousands of interconnected blockchains.',
    logoUrl: '/chains/cosmos.png',
  },
  'osmosis': {
    id: 'osmosis',
    name: 'Osmosis',
    network: 'osmosis-1',
    description: 'Osmosis is an advanced AMM protocol for interchain assets.',
    logoUrl: '/chains/osmosis.png',
  },
  'juno': {
    id: 'juno',
    name: 'Juno',
    network: 'juno-1',
    description: 'Juno is a sovereign public blockchain in the Cosmos ecosystem.',
    logoUrl: '/chains/juno.png',
  },
};

// Helper function to create a snapshot date at a specific UTC hour
const createSnapshotDate = (daysAgo: number, hour: number): Date => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
};

export const mockSnapshots = {
  'cosmos-hub': [
    // Ultra tier: 6-hour snapshot (latest)
    {
      id: 'cosmos-snapshot-1',
      chainId: 'cosmos-hub',
      height: 19234567,
      size: 450 * 1024 * 1024 * 1024,
      fileName: 'cosmoshub-4-19234567.tar.lz4',
      createdAt: createSnapshotDate(0, 18), // Today 18:00 UTC
      updatedAt: createSnapshotDate(0, 18),
      type: 'pruned' as const,
      compressionType: 'lz4' as const,
      generationCycle: 'six-hourly' as const,
      hourGenerated: 18,
      minimumTier: 'ultra' as const,
      isRestricted: true,
    },
    // Premium tier: 12-hour snapshot
    {
      id: 'cosmos-snapshot-2',
      chainId: 'cosmos-hub',
      height: 19230000,
      size: 448 * 1024 * 1024 * 1024,
      fileName: 'cosmoshub-4-19230000.tar.lz4',
      createdAt: createSnapshotDate(0, 12), // Today 12:00 UTC
      updatedAt: createSnapshotDate(0, 12),
      type: 'pruned' as const,
      compressionType: 'lz4' as const,
      generationCycle: 'twice-daily' as const,
      hourGenerated: 12,
      minimumTier: 'free' as const,
      isRestricted: false,
    },
    // Ultra tier: Early morning snapshot
    {
      id: 'cosmos-snapshot-3',
      chainId: 'cosmos-hub',
      height: 19226000,
      size: 447 * 1024 * 1024 * 1024,
      fileName: 'cosmoshub-4-19226000.tar.lz4',
      createdAt: createSnapshotDate(0, 6), // Today 06:00 UTC
      updatedAt: createSnapshotDate(0, 6),
      type: 'pruned' as const,
      compressionType: 'lz4' as const,
      generationCycle: 'six-hourly' as const,
      hourGenerated: 6,
      minimumTier: 'ultra' as const,
      isRestricted: true,
    },
    // Premium tier: Midnight snapshot
    {
      id: 'cosmos-snapshot-4',
      chainId: 'cosmos-hub',
      height: 19220000,
      size: 446 * 1024 * 1024 * 1024,
      fileName: 'cosmoshub-4-19220000.tar.lz4',
      createdAt: createSnapshotDate(0, 0), // Today 00:00 UTC
      updatedAt: createSnapshotDate(0, 0),
      type: 'pruned' as const,
      compressionType: 'lz4' as const,
      generationCycle: 'twice-daily' as const,
      hourGenerated: 0,
      minimumTier: 'premium' as const,
      isRestricted: true,
    },
    // Archive snapshot (accessible to all)
    {
      id: 'cosmos-snapshot-5',
      chainId: 'cosmos-hub',
      height: 19200000,
      size: 850 * 1024 * 1024 * 1024,
      fileName: 'cosmoshub-4-19200000-archive.tar.lz4',
      createdAt: createSnapshotDate(1, 12), // Yesterday 12:00 UTC
      updatedAt: createSnapshotDate(1, 12),
      type: 'archive' as const,
      compressionType: 'lz4' as const,
      generationCycle: 'daily' as const,
      hourGenerated: 12,
      minimumTier: 'free' as const,
      isRestricted: false,
    },
  ],
  'osmosis': [
    // Ultra tier: Latest 6-hour snapshot
    {
      id: 'osmosis-snapshot-1',
      chainId: 'osmosis',
      height: 12345678,
      size: 128849018880,
      fileName: 'osmosis-1-12345678.tar.lz4',
      createdAt: createSnapshotDate(0, 18), // Today 18:00 UTC
      updatedAt: createSnapshotDate(0, 18),
      type: 'pruned' as const,
      compressionType: 'lz4' as const,
      generationCycle: 'six-hourly' as const,
      hourGenerated: 18,
      minimumTier: 'ultra' as const,
      isRestricted: true,
    },
    // Free tier: Daily snapshot
    {
      id: 'osmosis-snapshot-2',
      chainId: 'osmosis',
      height: 12340000,
      size: 127312345600,
      fileName: 'osmosis-1-12340000.tar.lz4',
      createdAt: createSnapshotDate(0, 12), // Today 12:00 UTC
      updatedAt: createSnapshotDate(0, 12),
      type: 'pruned' as const,
      compressionType: 'lz4' as const,
      generationCycle: 'daily' as const,
      hourGenerated: 12,
      minimumTier: 'free' as const,
      isRestricted: false,
    },
    // Ultra tier: Morning snapshot
    {
      id: 'osmosis-snapshot-3',
      chainId: 'osmosis',
      height: 12335000,
      size: 127000000000,
      fileName: 'osmosis-1-12335000.tar.lz4',
      createdAt: createSnapshotDate(0, 6), // Today 06:00 UTC
      updatedAt: createSnapshotDate(0, 6),
      type: 'pruned' as const,
      compressionType: 'lz4' as const,
      generationCycle: 'six-hourly' as const,
      hourGenerated: 6,
      minimumTier: 'ultra' as const,
      isRestricted: true,
    },
  ],
  'juno': [
    // Premium tier: Latest twice-daily snapshot
    {
      id: 'juno-snapshot-1',
      chainId: 'juno',
      height: 12345678,
      size: 250 * 1024 * 1024 * 1024,
      fileName: 'juno-1-12345678.tar.lz4',
      createdAt: createSnapshotDate(0, 12), // Today 12:00 UTC
      updatedAt: createSnapshotDate(0, 12),
      type: 'pruned' as const,
      compressionType: 'lz4' as const,
      generationCycle: 'twice-daily' as const,
      hourGenerated: 12,
      minimumTier: 'free' as const,
      isRestricted: false,
    },
    // Premium tier: Midnight snapshot
    {
      id: 'juno-snapshot-2',
      chainId: 'juno',
      height: 12340000,
      size: 248 * 1024 * 1024 * 1024,
      fileName: 'juno-1-12340000.tar.lz4',
      createdAt: createSnapshotDate(0, 0), // Today 00:00 UTC
      updatedAt: createSnapshotDate(0, 0),
      type: 'pruned' as const,
      compressionType: 'lz4' as const,
      generationCycle: 'twice-daily' as const,
      hourGenerated: 0,
      minimumTier: 'premium' as const,
      isRestricted: true,
    },
  ],
};