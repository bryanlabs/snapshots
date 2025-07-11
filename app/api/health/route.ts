import { NextResponse } from 'next/server';
import { ApiResponse, HealthCheckResponse } from '@/lib/types';
import { getMinioClient } from '@/lib/minio/client';

export async function GET() {
  try {
    // Check MinIO connection
    let minioHealthy = false;
    try {
      const client = getMinioClient();
      await client.listBuckets();
      minioHealthy = true;
    } catch (error) {
      console.error('MinIO health check failed:', error);
    }

    const response: HealthCheckResponse = {
      status: minioHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: true, // Placeholder - implement actual database check
        minio: minioHealthy,
      },
    };

    return NextResponse.json<ApiResponse<HealthCheckResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}