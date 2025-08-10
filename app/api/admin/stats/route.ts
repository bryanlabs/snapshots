import { NextRequest, NextResponse } from 'next/server';
import { bandwidthManager } from '@/lib/bandwidth/manager';
import { register } from '@/lib/monitoring/metrics';
import { withAdminAuth } from '@/lib/auth/admin-middleware';

/**
 * Admin endpoint to view system statistics
 * Requires admin authentication
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function handleGetStats(_request: NextRequest) {
  
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
function parseMetrics(metricsText: string): Record<string, unknown> {
  const lines = metricsText.split('\n');
  const metrics: Record<string, unknown> = {};
  
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

export const GET = withAdminAuth(handleGetStats);