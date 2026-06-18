import { NextResponse } from 'next/server';
import { bandwidthManager } from '@/lib/bandwidth/manager';
import { auth } from '@/auth';
import { getEffectiveAccessTier, getTierBandwidth, isPremiumTier } from '@/lib/utils/tier';

export async function GET() {
  try {
    const session = await auth();
    const tier = getEffectiveAccessTier(session?.user?.tier || 'free');
    const stats = bandwidthManager.getStats();
    
    // Calculate current speed based on active connections
    const tierConnections = isPremiumTier(tier)
      ? stats.connectionsByTier.premium 
      : stats.connectionsByTier.free;
    
    const maxSpeed = getTierBandwidth(tier);
    const currentSpeed = tierConnections > 0 ? maxSpeed / tierConnections : maxSpeed;
    
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
