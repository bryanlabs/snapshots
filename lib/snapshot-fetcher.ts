/**
 * Fetches snapshot data from the nginx server in Kubernetes
 * This replaces the mock data with real data from your infrastructure
 */

export interface RealSnapshot {
  chain_id: string;
  snapshot_name: string;
  timestamp: string;
  block_height: string;
  data_size_bytes: number;
  compressed_size_bytes: number;
  compression_ratio: number;
}

export interface ChainMetadata {
  chainId: string;
  chainName: string;
  latestSnapshot: string;
  lastUpdated: string;
  snapshots: RealSnapshot[];
}

const SNAPSHOT_SERVER_URL = process.env.SNAPSHOT_SERVER_URL || 'http://snapshot-server.snapshots.svc.cluster.local';

export async function fetchChains(): Promise<string[]> {
  try {
    const response = await fetch(`${SNAPSHOT_SERVER_URL}/`, {
      next: { revalidate: 300 } // Cache for 5 minutes
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch chains');
    }
    
    const data = await response.json();
    
    // Extract chain directories from nginx autoindex
    const chains = data
      .filter((item: any) => item.type === 'directory' && !item.name.startsWith('.'))
      .map((item: any) => item.name.replace(/\/$/, ''));
    
    return chains;
  } catch (error) {
    console.error('Error fetching chains:', error);
    return [];
  }
}

export async function fetchChainMetadata(chainId: string): Promise<ChainMetadata | null> {
  try {
    const response = await fetch(`${SNAPSHOT_SERVER_URL}/${chainId}/metadata.json`, {
      next: { revalidate: 60 } // Cache for 1 minute
    });
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching metadata for ${chainId}:`, error);
    return null;
  }
}

export async function fetchSnapshots(chainId: string): Promise<RealSnapshot[]> {
  const metadata = await fetchChainMetadata(chainId);
  return metadata?.snapshots || [];
}

export function getSnapshotDownloadUrl(chainId: string, snapshotName: string): string {
  return `${SNAPSHOT_SERVER_URL}/${chainId}/${snapshotName}.tar.lz4`;
}

export function formatSnapshotForUI(snapshot: RealSnapshot) {
  return {
    fileName: `${snapshot.snapshot_name}.tar.lz4`,
    size: snapshot.compressed_size_bytes,
    height: parseInt(snapshot.block_height) || 0,
    timestamp: new Date(snapshot.timestamp),
    chainId: snapshot.chain_id,
    compressionRatio: snapshot.compression_ratio
  };
}