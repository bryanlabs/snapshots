import { NextResponse } from 'next/server';
import { ApiResponse, HealthCheckResponse } from '@/lib/types';
import { listChains } from '@/lib/nginx/operations';

export async function GET() {
  try {
    // Check nginx connection
    let nginxHealthy = false;
    try {
      // Try to list chains as a health check
      await listChains();
      nginxHealthy = true;
    } catch (error) {
      console.error('nginx health check failed:', error);
    }

    const response: HealthCheckResponse = {
      status: nginxHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: true, // Placeholder - implement actual database check
        minio: nginxHealthy, // Keep the key for compatibility, but it's actually nginx
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