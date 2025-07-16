import * as Minio from 'minio';
import { config } from '../config';

let minioClient: Minio.Client | null = null;
let minioClientExternal: Minio.Client | null = null;

export function getMinioClient(): Minio.Client {
  if (!minioClient) {
    minioClient = new Minio.Client({
      endPoint: config.minio.endPoint,
      port: config.minio.port,
      useSSL: config.minio.useSSL,
      accessKey: config.minio.accessKey,
      secretKey: config.minio.secretKey,
    });
  }
  return minioClient;
}

// Separate client for generating presigned URLs with external endpoint
export function getMinioClientExternal(): Minio.Client {
  if (!minioClientExternal) {
    minioClientExternal = new Minio.Client({
      endPoint: config.minio.externalEndPoint,
      port: config.minio.externalPort,
      useSSL: config.minio.externalUseSSL,
      accessKey: config.minio.accessKey,
      secretKey: config.minio.secretKey,
    });
  }
  return minioClientExternal;
}

export async function ensureBucketExists(bucketName: string): Promise<void> {
  const client = getMinioClient();
  const exists = await client.bucketExists(bucketName);
  
  if (!exists) {
    await client.makeBucket(bucketName, 'us-east-1');
  }
}

export async function getPresignedUrl(
  bucketName: string,
  objectName: string,
  expiry: number = 3600, // 1 hour default
  metadata?: {
    tier?: string;
    ip?: string;
    userId?: string;
  }
): Promise<string> {
  // Use external client to generate presigned URLs with proxy endpoint
  const client = getMinioClientExternal();
  
  // Create request parameters with metadata
  const reqParams: Record<string, string> = {};
  
  if (metadata) {
    if (metadata.tier) reqParams['response-cache-control'] = `max-age=0, tier=${metadata.tier}`;
    // IP restriction removed to allow cross-IP usage
    if (metadata.userId) reqParams['X-Amz-Meta-User-Id'] = metadata.userId;
  }
  
  try {
    // Generate URL with external client pointing to nginx proxy
    const presignedUrl = await client.presignedGetObject(bucketName, objectName, expiry, reqParams);
    
    console.log('Generated presigned URL:', presignedUrl);
    
    return presignedUrl;
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw error;
  }
}

export async function listObjects(
  bucketName: string,
  prefix?: string
): Promise<Minio.BucketItem[]> {
  const client = getMinioClient();
  const objects: Minio.BucketItem[] = [];
  
  return new Promise((resolve, reject) => {
    const stream = client.listObjects(bucketName, prefix, true);
    
    stream.on('data', (obj) => objects.push(obj));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(objects));
  });
}