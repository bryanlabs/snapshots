import { NextRequest, NextResponse } from 'next/server';
import { bandwidthManager } from '@/lib/bandwidth/manager';
import { register } from '@/lib/monitoring/metrics';
import { getIronSession } from 'iron-session';
import { User } from '@/types/user';
import { sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';

/**
 * Admin endpoint to view system statistics
 * Requires admin authentication
 */
async function handleGetStats(request: NextRequest) {
  // Check authentication
  const cookieStore = await cookies();
  const session = await getIronSession<User>(cookieStore, sessionOptions);
  
  // For now, just check if logged in - you might want to add admin role check
  if (!session?.isLoggedIn) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    // Get bandwidth statistics
    const bandwidthStats = bandwidthManager.getStats();
    
    // Get current metrics snapshot
    const metricsText = await register.metrics();
    const metrics = parseMetrics(metricsText);
    
    return NextResponse.json({
      success: true,
      data: {
        bandwidth: bandwidthStats,
        metrics: metrics,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Helper function to parse Prometheus metrics into JSON
function parseMetrics(metricsText: string): Record<string, any> {
  const lines = metricsText.split('\n');
  const metrics: Record<string, any> = {};
  
  for (const line of lines) {
    if (line.startsWith('#') || !line.trim()) continue;
    
    const match = line.match(/^([^\s{]+)({[^}]+})?\s+(.+)$/);
    if (match) {
      const [, name, labels, value] = match;
      if (!metrics[name]) {
        metrics[name] = [];
      }
      metrics[name].push({
        labels: labels ? JSON.parse(labels.replace(/([a-zA-Z_]+)=/g, '"$1":')) : {},
        value: parseFloat(value),
      });
    }
  }
  
  return metrics;
}

export const GET = handleGetStats;