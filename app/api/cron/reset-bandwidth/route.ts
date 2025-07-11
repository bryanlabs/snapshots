import { NextRequest, NextResponse } from 'next/server';
import { monthlyBandwidthResetTask } from '@/lib/tasks/resetBandwidth';
import { headers } from 'next/headers';

/**
 * API endpoint for resetting monthly bandwidth
 * This can be called by Vercel Cron Jobs
 * 
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/reset-bandwidth",
 *     "schedule": "0 0 1 * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = (await headers()).get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await monthlyBandwidthResetTask();
    
    return NextResponse.json({
      success: true,
      message: 'Monthly bandwidth reset completed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reset bandwidth',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}