import { resetMonthlyBandwidth } from '@/lib/bandwidth/downloadTracker';
import logger from '@/lib/middleware/logger';

/**
 * Monthly bandwidth reset task
 * This should be scheduled to run at the beginning of each month
 * 
 * Example cron expression: 0 0 1 * * (runs at midnight on the 1st of each month)
 * 
 * Can be integrated with:
 * - Vercel Cron Jobs
 * - GitHub Actions
 * - External cron service
 * - Kubernetes CronJob
 */
export async function monthlyBandwidthResetTask() {
  try {
    logger.info('Starting monthly bandwidth reset task');
    
    // Reset bandwidth usage for all users
    resetMonthlyBandwidth();
    
    logger.info('Monthly bandwidth reset completed successfully');
  } catch (error) {
    logger.error('Monthly bandwidth reset failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// If running as a standalone script
if (require.main === module) {
  monthlyBandwidthResetTask()
    .then(() => {
      console.log('Bandwidth reset completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Bandwidth reset failed:', error);
      process.exit(1);
    });
}