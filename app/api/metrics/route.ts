import { NextRequest, NextResponse } from 'next/server';
import { refreshCustomSnapshotMetrics, register } from '@/lib/monitoring/metrics';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_request: NextRequest) {
  try {
    await refreshCustomSnapshotMetrics();

    // Get metrics in Prometheus format
    const metrics = await register.metrics();
    
    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': register.contentType,
      },
    });
  } catch (error) {
    console.error('Error collecting metrics:', error);
    return new NextResponse('# Failed to collect metrics\n', {
      status: 500,
      headers: {
        'Content-Type': register.contentType,
      },
    });
  }
}
