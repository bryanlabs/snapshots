import { NextRequest, NextResponse } from 'next/server';
import { listSnapshots } from '@/lib/minio/operations';
import { config } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG SNAPSHOTS ===');
    console.log('Config:', {
      bucket: config.minio.bucketName,
      endpoint: config.minio.endPoint,
      port: config.minio.port,
    });
    
    const minioSnapshots = await listSnapshots(config.minio.bucketName, 'noble-1');
    console.log('Raw MinIO snapshots:', minioSnapshots);
    
    const filtered = minioSnapshots.filter(s => 
      s.fileName.endsWith('.tar.zst') || s.fileName.endsWith('.tar.lz4')
    );
    console.log('Filtered snapshots:', filtered);
    
    return NextResponse.json({
      success: true,
      config: {
        bucket: config.minio.bucketName,
        endpoint: config.minio.endPoint,
        port: config.minio.port,
      },
      rawSnapshots: minioSnapshots,
      filteredSnapshots: filtered,
      env: {
        USE_REAL_SNAPSHOTS: process.env.USE_REAL_SNAPSHOTS,
      }
    });
  } catch (error) {
    console.error('Debug snapshots error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}