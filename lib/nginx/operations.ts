import { generateSecureLink, listObjects, objectExists } from './client';
import { getNginxClient } from '../nginx-dev';
import { 
  isValidSnapshotFile, 
  getCompressionType, 
  extractHeightFromFilename 
} from '../config/supported-formats';
import {
  getCanonicalChainId,
  getSnapshotStorageVariant,
  getStorageChainIdsForChain,
} from '../config/chains';

export interface Snapshot {
  filename: string;
  chainId: string;
  storageChainId: string;
  size: number;
  lastModified: Date;
  height?: number;
  compressionType?: string;
  databaseBackend?: string;
  databaseLabel?: string;
}

export interface ChainInfo {
  chainId: string;
  snapshotCount: number;
  latestSnapshot?: Snapshot;
  totalSize: number;
}

async function listObjectsForStorageChain(storageChainId: string) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    const nginxClient = getNginxClient();
    return nginxClient.listObjects(`/snapshots/${storageChainId}/`);
  }

  return listObjects(storageChainId);
}

async function listSnapshotsForStorageChain(storageChainId: string): Promise<Snapshot[]> {
  let objects;

  try {
    objects = await listObjectsForStorageChain(storageChainId);
  } catch (error) {
    console.error(`Error listing snapshots for ${storageChainId}:`, error);
    return [];
  }

  const variant = getSnapshotStorageVariant(storageChainId);
  const snapshots: Snapshot[] = [];

  for (const obj of objects) {
    // Skip directories and non-snapshot files
    if (obj.type === 'directory' || !isValidSnapshotFile(obj.name)) {
      continue;
    }

    // Skip latest.tar.zst as it's a pointer
    if (obj.name === 'latest.tar.zst') {
      continue;
    }

    const compressionType = getCompressionType(obj.name);
    const snapshot: Snapshot = {
      filename: obj.name,
      chainId: variant.chainId,
      storageChainId,
      size: obj.size,
      lastModified: new Date(obj.mtime),
      compressionType,
      databaseBackend: variant.databaseBackend,
      databaseLabel: variant.databaseLabel,
    };

    const height = extractHeightFromFilename(obj.name);
    if (height) {
      snapshot.height = height;
    }

    snapshots.push(snapshot);
  }

  snapshots.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  return snapshots;
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
      const chainsById = new Map<string, ChainInfo>();
      
      for (const obj of objects) {
        if (obj.type === 'directory') {
          const storageChainId = obj.name.replace(/\/$/, '');
          const chainId = getCanonicalChainId(storageChainId);
          const snapshots = await listSnapshotsForStorageChain(storageChainId);
          const existing = chainsById.get(chainId) || {
            chainId,
            snapshotCount: 0,
            totalSize: 0,
          };
          const allSnapshots = [existing.latestSnapshot, ...snapshots].filter(Boolean) as Snapshot[];
          allSnapshots.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
          
          chainsById.set(chainId, {
            chainId,
            snapshotCount: existing.snapshotCount + snapshots.length,
            latestSnapshot: allSnapshots[0],
            totalSize: existing.totalSize + snapshots.reduce((sum, s) => sum + s.size, 0)
          });
        }
      }
      
      const chains = Array.from(chainsById.values());
      console.log(`Chain infos from nginx: ${JSON.stringify(chains.map(c => ({ chainId: c.chainId, count: c.snapshotCount })))}`);
      return chains;
    } catch (error) {
      console.error('Error fetching chains from nginx client:', error);
      return [];
    }
  }
  
  // Production code (original implementation)
  const objects = await listObjects('');
  const chainsById = new Map<string, ChainInfo>();
  
  for (const obj of objects) {
    if (obj.type === 'directory') {
      const storageChainId = obj.name.replace(/\/$/, '');
      const chainId = getCanonicalChainId(storageChainId);
      const snapshots = await listSnapshotsForStorageChain(storageChainId);
      const existing = chainsById.get(chainId) || {
        chainId,
        snapshotCount: 0,
        totalSize: 0,
      };
      const allSnapshots = [existing.latestSnapshot, ...snapshots].filter(Boolean) as Snapshot[];
      allSnapshots.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
      
      chainsById.set(chainId, {
        chainId,
        snapshotCount: existing.snapshotCount + snapshots.length,
        latestSnapshot: allSnapshots[0],
        totalSize: existing.totalSize + snapshots.reduce((sum, s) => sum + s.size, 0)
      });
    }
  }
  
  return Array.from(chainsById.values());
}

/**
 * List snapshots for a specific chain
 */
export async function listSnapshots(chainId: string): Promise<Snapshot[]> {
  const canonicalChainId = getCanonicalChainId(chainId);
  const storageChainIds = getStorageChainIdsForChain(canonicalChainId);
  const snapshotGroups = await Promise.all(storageChainIds.map(listSnapshotsForStorageChain));
  const snapshots = snapshotGroups.flat();
  
  // Sort by last modified date (newest first)
  snapshots.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  
  return snapshots;
}

/**
 * Get the latest snapshot for a chain
 */
export async function getLatestSnapshot(chainId: string): Promise<Snapshot | null> {
  const canonicalChainId = getCanonicalChainId(chainId);
  const storageChainIds = getStorageChainIdsForChain(canonicalChainId);

  // First check if latest.json exists
  const latestJsonPath = `/${canonicalChainId}/latest.json`;
  if (storageChainIds.length === 1 && await objectExists(latestJsonPath)) {
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
          chainId: canonicalChainId,
          storageChainId: canonicalChainId,
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
  const snapshots = await listSnapshots(canonicalChainId);
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
