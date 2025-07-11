import { bandwidthManager } from './manager';

export async function getStats() {
  const stats = bandwidthManager.getStats();
  
  return {
    activeConnections: stats.activeConnections,
    connectionsByTier: stats.connectionsByTier,
    totalBandwidthUsage: formatBytes(stats.totalBandwidthUsage),
    userCount: stats.userCount,
    timestamp: new Date().toISOString(),
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}