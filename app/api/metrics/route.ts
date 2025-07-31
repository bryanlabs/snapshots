import { NextRequest, NextResponse } from 'next/server';
import { register } from '@/lib/monitoring/metrics';
import { auth } from '@/auth';

export async function GET(_request: NextRequest) {
  try {
    // Optional: Add authentication check for metrics endpoint
    // You might want to restrict access to metrics
    await auth();
    
    // Uncomment to require authentication for metrics
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
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
    return NextResponse.json(
      { error: 'Failed to collect metrics' },
      { status: 500 }
    );
  }
}