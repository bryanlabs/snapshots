import { getMinioClient, getPresignedUrl } from './client';
import { BucketItem } from 'minio';

export interface Snapshot {
  fileName: string;
  size: number;
  lastModified: Date;
  etag: string;
  metadata?: Record<string, string>;
}

export async function listChains(bucketName: string): Promise<string[]> {
  const chains = new Set<string>();
  const stream = getMinioClient().listObjectsV2(bucketName, '', true);
  
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
  console.log(`MinIO listSnapshots: bucket=${bucketName}, chain=${chain}, prefix=${chain}/`);
  const snapshots: Snapshot[] = [];
  const stream = getMinioClient().listObjectsV2(bucketName, `${chain}/`, true);
  
  return new Promise((resolve, reject) => {
    stream.on('data', (obj) => {
      console.log(`MinIO object found: ${obj.name}, size: ${obj.size}`);
      
      // Only include actual files, not directories or hidden files
      if (obj.size > 0 && !obj.name.endsWith('/') && !obj.name.includes('/.')) {
        const fileName = obj.name.split('/').pop() || obj.name;
        
        // Extract metadata from filename if possible
        const metadata: Record<string, string> = {};
        
        // Extract height from filename (e.g., noble-1-0.tar.zst -> height: 0)
        const heightMatch = fileName.match(/(\d+)\.tar\.(zst|lz4)$/);
        if (heightMatch) {
          metadata.height = heightMatch[1];
          metadata.compressionType = heightMatch[2];
        }
        
        snapshots.push({
          fileName,
          size: obj.size,
          lastModified: obj.lastModified,
          etag: obj.etag,
          metadata
        });
        console.log(`Added snapshot: ${fileName} with metadata:`, metadata);
      }
    });
    
    stream.on('error', (error) => {
      console.error('MinIO stream error:', error);
      reject(error);
    });
    stream.on('end', () => {
      console.log(`MinIO stream ended. Total snapshots found: ${snapshots.length}`);
      resolve(snapshots);
    });
  });
}

export async function generateDownloadUrl(
  bucketName: string,
  objectName: string,
  tier: 'free' | 'premium',
  userIp?: string
): Promise<string> {
  const metadata = {
    tier,
    ...(userIp && { ip: userIp })
  };
  
  // 24 hour expiry for download URLs
  const expiry = 24 * 60 * 60; // 86400 seconds
  
  return getPresignedUrl(bucketName, objectName, expiry, metadata);
}