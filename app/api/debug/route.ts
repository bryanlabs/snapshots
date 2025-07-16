import { NextRequest, NextResponse } from 'next/server';
import { getMinioClient } from '@/lib/minio/client';
import { config } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    console.log('Debug endpoint called');
    
    const result: any = {
      env: {
        USE_MOCK_DATA: process.env.USE_MOCK_DATA,
        MINIO_ENDPOINT: process.env.MINIO_ENDPOINT,
        MINIO_PORT: process.env.MINIO_PORT,
        MINIO_BUCKET_NAME: process.env.MINIO_BUCKET_NAME,
      },
      config: {
        endpoint: config.minio.endPoint,
        port: config.minio.port,
        bucket: config.minio.bucketName,
      },
      minioTest: {}
    };
    
    // Test MinIO connection
    try {
      const client = getMinioClient();
      
      // Test 1: List buckets
      const buckets = await client.listBuckets();
      result.minioTest.buckets = buckets.map(b => b.name);
      
      // Test 2: Check if snapshots bucket exists
      const bucketExists = await client.bucketExists(config.minio.bucketName);
      result.minioTest.bucketExists = bucketExists;
      
      // Test 3: List objects with noble-1 prefix
      const objects: any[] = [];
      const stream = client.listObjectsV2(config.minio.bucketName, 'noble-1/', true);
      
      await new Promise((resolve, reject) => {
        stream.on('data', (obj) => {
          objects.push({
            name: obj.name,
            size: obj.size,
            lastModified: obj.lastModified
          });
        });
        stream.on('error', reject);
        stream.on('end', resolve);
      });
      
      result.minioTest.objects = objects;
      result.minioTest.objectCount = objects.length;
      
    } catch (minioError: any) {
      result.minioTest.error = minioError.message;
      result.minioTest.stack = minioError.stack;
    }
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}