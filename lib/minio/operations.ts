import { minioClient, getPresignedUrl } from './client';
import { BucketItem } from 'minio';
import { fetchChains, fetchSnapshots, formatSnapshotForUI, getSnapshotDownloadUrl } from '@/lib/snapshot-fetcher';

export interface Snapshot {
  fileName: string;
  size: number;
  lastModified: Date;
  etag: string;
  metadata?: Record<string, string>;
}

// Use real snapshots if configured, otherwise fall back to MinIO
const USE_REAL_SNAPSHOTS = process.env.USE_REAL_SNAPSHOTS === 'true';

export async function listChains(bucketName: string): Promise<string[]> {
  if (USE_REAL_SNAPSHOTS) {
    return fetchChains();
  }
  
  const chains = new Set<string>();
  const stream = minioClient.listObjectsV2(bucketName, '', true);
  
  return new Promise((resolve, reject) => {
    stream.on('data', (obj) => {
      // Extract chain name from path (e.g., "osmosis/snapshot.tar.gz" -> "osmosis")
      const parts = obj.name.split('/');
      if (parts.length > 1) {
        chains.add(parts[0]);
      }
    });
    
    stream.on('error', reject);
    stream.on('end', () => resolve(Array.from(chains)));
  });
}

export async function listSnapshots(bucketName: string, chain: string): Promise<Snapshot[]> {
  if (USE_REAL_SNAPSHOTS) {
    const realSnapshots = await fetchSnapshots(chain);
    return realSnapshots.map(formatSnapshotForUI).map(s => ({
      fileName: s.fileName,
      size: s.size,
      lastModified: s.timestamp,
      etag: '',
      metadata: {
        height: s.height.toString(),
        compressionRatio: s.compressionRatio.toString()
      }
    }));
  }
  
  const snapshots: Snapshot[] = [];
  const stream = minioClient.listObjectsV2(bucketName, `${chain}/`, true);
  
  return new Promise((resolve, reject) => {
    stream.on('data', async (obj) => {
      // Get object metadata
      const stat = await minioClient.statObject(bucketName, obj.name);
      
      snapshots.push({
        fileName: obj.name.split('/').pop() || obj.name,
        size: obj.size,
        lastModified: obj.lastModified,
        etag: obj.etag,
        metadata: stat.metaData
      });
    });
    
    stream.on('error', reject);
    stream.on('end', () => resolve(snapshots));
  });
}

export async function generateDownloadUrl(
  bucketName: string,
  objectName: string,
  tier: 'free' | 'premium',
  userIp?: string
): Promise<string> {
  if (USE_REAL_SNAPSHOTS) {
    // For real snapshots, return direct nginx URL
    // The bandwidth limiting would be handled at nginx/ingress level
    const chainId = objectName.split('/')[0];
    const fileName = objectName.split('/').pop()!;
    return getSnapshotDownloadUrl(chainId, fileName.replace('.tar.lz4', ''));
  }
  
  const metadata = {
    tier,
    ...(userIp && { ip: userIp })
  };
  
  // 5 minute expiry for download URLs
  const expiry = 5 * 60;
  
  return getPresignedUrl(bucketName, objectName, expiry, metadata);
}