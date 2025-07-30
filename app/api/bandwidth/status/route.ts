import { NextResponse } from 'next/server';
import { bandwidthManager } from '@/lib/bandwidth/manager';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    const tier = session?.user?.tier || 'free';
    const stats = bandwidthManager.getStats();
    
    // Calculate current speed based on active connections
    const tierConnections = tier === 'premium' 
      ? stats.connectionsByTier.premium 
      : stats.connectionsByTier.free;
    
    const maxSpeed = tier === 'premium' ? 250 : 50;
    const currentSpeed = tierConnections > 0 ? maxSpeed / tierConnections : 0;
    
    return NextResponse.json({
      tier,
      currentSpeed,
      maxSpeed,
      activeConnections: tierConnections,
      totalActiveConnections: stats.activeConnections,
    });
  } catch (error) {
    console.error('Failed to get bandwidth status:', error);
    return NextResponse.json(
      { error: 'Failed to get bandwidth status' },
      { status: 500 }
    );
  }
}