import { NextRequest, NextResponse } from 'next/server';
import { getPresignedUrl } from '@/lib/minio/client';
import { config } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    console.log('=== TESTING DOWNLOAD URL GENERATION ===');
    console.log('MinIO config:', {
      endPoint: config.minio.endPoint,
      port: config.minio.port,
      externalEndPoint: config.minio.externalEndPoint,
      externalPort: config.minio.externalPort,
      useSSL: config.minio.useSSL,
      bucketName: config.minio.bucketName,
      accessKey: config.minio.accessKey ? 'SET' : 'NOT SET',
      secretKey: config.minio.secretKey ? 'SET' : 'NOT SET',
    });
    
    // Test presigned URL generation for the Noble snapshot
    const objectName = 'noble-1/noble-1-0.tar.zst';
    console.log('Generating presigned URL for:', objectName);
    
    const downloadUrl = await getPresignedUrl(
      config.minio.bucketName,
      objectName,
      300, // 5 minutes
      {
        tier: 'free',
        ip: '127.0.0.1',
        userId: 'test-user'
      }
    );
    
    console.log('Generated download URL:', downloadUrl);
    
    return NextResponse.json({
      success: true,
      config: {
        endPoint: config.minio.endPoint,
        port: config.minio.port,
        useSSL: config.minio.useSSL,
        bucketName: config.minio.bucketName,
      },
      objectName,
      downloadUrl,
    });
  } catch (error) {
    console.error('Download URL generation test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}