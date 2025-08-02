import { generateSecureLink, listObjects, objectExists } from './client';
import { getNginxClient } from '../nginx-dev';

export interface Snapshot {
  filename: string;
  size: number;
  lastModified: Date;
  height?: number;
  compressionType?: string;
}

export interface ChainInfo {
  chainId: string;
  snapshotCount: number;
  latestSnapshot?: Snapshot;
  totalSize: number;
}

/**
 * List all available chains
 */
export async function listChains(): Promise<ChainInfo[]> {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    console.log('Fetching chains from nginx...');
    // Use development nginx client with fallback
    try {
      const nginxClient = getNginxClient();
      const objects = await nginxClient.listObjects('/snapshots/');
      const chains: ChainInfo[] = [];
      
      for (const obj of objects) {
        if (obj.type === 'directory') {
          const chainId = obj.name.replace(/\/$/, '');
          const snapshots = await listSnapshots(chainId);
          
          chains.push({
            chainId,
            snapshotCount: snapshots.length,
            latestSnapshot: snapshots[0], // Already sorted by height desc
            totalSize: snapshots.reduce((sum, s) => sum + s.size, 0)
          });
        }
      }
      
      console.log(`Chain infos from nginx: ${JSON.stringify(chains.map(c => ({ chainId: c.chainId, count: c.snapshotCount })))}`);
      return chains;
    } catch (error) {
      console.error('Error fetching chains from nginx client:', error);
      return [];
    }
  }
  
  // Production code (original implementation)
  const objects = await listObjects('');
  const chains: ChainInfo[] = [];
  
  for (const obj of objects) {
    if (obj.type === 'directory') {
      const chainId = obj.name.replace(/\/$/, '');
      const snapshots = await listSnapshots(chainId);
      
      chains.push({
        chainId,
        snapshotCount: snapshots.length,
        latestSnapshot: snapshots[0], // Already sorted by height desc
        totalSize: snapshots.reduce((sum, s) => sum + s.size, 0)
      });
    }
  }
  
  return chains;
}

/**
 * List snapshots for a specific chain
 */
export async function listSnapshots(chainId: string): Promise<Snapshot[]> {
  const isDevelopment = process.env.NODE_ENV === 'development';
  let objects;
  
  if (isDevelopment) {
    try {
      const nginxClient = getNginxClient();
      objects = await nginxClient.listObjects(`/snapshots/${chainId}/`);
    } catch (error) {
      console.error(`Error listing snapshots for ${chainId}:`, error);
      return [];
    }
  } else {
    objects = await listObjects(chainId);
  }
  
  const snapshots: Snapshot[] = [];
  
  for (const obj of objects) {
    // Skip directories and non-snapshot files
    if (obj.type === 'directory' || (!obj.name.endsWith('.tar.zst') && !obj.name.endsWith('.tar.lz4'))) {
      continue;
    }
    
    // Skip latest.tar.zst as it's a pointer
    if (obj.name === 'latest.tar.zst') {
      continue;
    }
    
    // Parse snapshot info from filename
    // Format: chainId-YYYYMMDD-HHMMSS.tar.zst or chainId-height.tar.zst
    const compressionType = obj.name.endsWith('.tar.lz4') ? 'lz4' : 'zst';
    const snapshot: Snapshot = {
      filename: obj.name,
      size: obj.size,
      lastModified: new Date(obj.mtime),
      compressionType
    };
    
    // Try to extract height from filename
    const heightMatch = obj.name.match(/(\d+)\.tar\.(zst|lz4)$/);
    if (heightMatch) {
      snapshot.height = parseInt(heightMatch[1], 10);
    }
    
    snapshots.push(snapshot);
  }
  
  // Sort by last modified date (newest first)
  snapshots.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  
  return snapshots;
}

/**
 * Get the latest snapshot for a chain
 */
export async function getLatestSnapshot(chainId: string): Promise<Snapshot | null> {
  // First check if latest.json exists
  const latestJsonPath = `/${chainId}/latest.json`;
  if (await objectExists(latestJsonPath)) {
    // Fetch latest.json to get the actual filename
    const endpoint = process.env.NGINX_ENDPOINT || 'nginx';
    const port = process.env.NGINX_PORT || '32708';
    const useSSL = process.env.NGINX_USE_SSL === 'true';
    const protocol = useSSL ? 'https' : 'http';
    const url = `${protocol}://${endpoint}:${port}/snapshots${latestJsonPath}`;
    
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        return {
          filename: data.filename,
          size: data.size_bytes,
          lastModified: new Date(data.timestamp),
          compressionType: 'zst'
        };
      }
    } catch (error) {
      console.error('Error fetching latest.json:', error);
    }
  }
  
  // Fallback to listing snapshots and getting the newest
  const snapshots = await listSnapshots(chainId);
  return snapshots[0] || null;
}

/**
 * Generate a download URL for a snapshot
 */
export async function generateDownloadUrl(
  chainId: string,
  filename: string,
  tier: 'free' | 'premium' | 'unlimited' = 'free',
  userId?: string
): Promise<string> {
  // Path should be relative to /snapshots
  const path = `/${chainId}/${filename}`;
  
  // Use 24 hours for premium/unlimited, 12 hours for free
  const expiryHours = (tier === 'premium' || tier === 'unlimited') ? 24 : 12;
  
  return generateSecureLink(path, tier, expiryHours);
}