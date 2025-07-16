import { Redis } from 'ioredis';

// Initialize Redis client with error handling
let redis: Redis | null = null;

function getRedisClient(): Redis {
  if (!redis) {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379');
    console.log(`[Redis] Creating new Redis client - host: ${host}, port: ${port}`);
    
    redis = new Redis({
      host,
      port,
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        console.log(`[Redis] Retry attempt ${times}, delay: ${delay}ms`);
        return delay;
      },
      enableOfflineQueue: false,
    });
    
    redis.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });
    
    redis.on('connect', () => {
      console.log('[Redis] Successfully connected to Redis');
    });
  }
  return redis;
}

export interface DownloadRecord {
  snapshotId: string;
  chainId: string;
  userId: string;
  ip: string;
  tier: 'free' | 'premium';
  timestamp: Date;
}

/**
 * Get the number of downloads for an IP address today
 */
export async function getDailyDownloadCount(ip: string): Promise<number> {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const key = `downloads:daily:${ip}:${today}`;
    
    console.log(`[Redis] Getting download count for IP: ${ip}, key: ${key}`);
    const count = await getRedisClient().get(key);
    console.log(`[Redis] Download count for ${ip}: ${count || '0'}`);
    return parseInt(count || '0');
  } catch (error) {
    console.error('Error getting daily download count:', error);
    return 0; // Return 0 if Redis is down
  }
}

/**
 * Increment the download count for an IP address
 */
export async function incrementDailyDownload(ip: string): Promise<number> {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const key = `downloads:daily:${ip}:${today}`;
    
    console.log(`[Redis] Incrementing download count for IP: ${ip}, key: ${key}`);
    // Increment and set expiry
    const redis = getRedisClient();
    const count = await redis.incr(key);
    await redis.expire(key, 86400); // Expire after 24 hours
    
    console.log(`[Redis] New download count for ${ip}: ${count}`);
    return count;
  } catch (error) {
    console.error('Error incrementing daily download:', error);
    return 1; // Return 1 if Redis is down
  }
}

/**
 * Log a download for analytics
 */
export async function logDownload(record: DownloadRecord): Promise<void> {
  try {
    const logKey = `downloads:log:${record.chainId}`;
    const logEntry = JSON.stringify({
      ...record,
      timestamp: record.timestamp.toISOString(),
    });
    
    // Add to a list for recent downloads (keep last 1000)
    const redis = getRedisClient();
    await redis.lpush(logKey, logEntry);
    await redis.ltrim(logKey, 0, 999);
    
    // Also increment counters for analytics
    const today = new Date().toISOString().split('T')[0];
    await redis.hincrby('downloads:stats:daily', today, 1);
    await redis.hincrby('downloads:stats:chain', record.chainId, 1);
    await redis.hincrby('downloads:stats:tier', record.tier, 1);
  } catch (error) {
    console.error('Error logging download:', error);
    // Continue even if logging fails
  }
}

/**
 * Get download statistics
 */
export async function getDownloadStats() {
  const [daily, chains, tiers] = await Promise.all([
    redis.hgetall('downloads:stats:daily'),
    redis.hgetall('downloads:stats:chain'),
    redis.hgetall('downloads:stats:tier'),
  ]);
  
  return {
    daily: Object.entries(daily).map(([date, count]) => ({
      date,
      count: parseInt(count),
    })),
    chains: Object.entries(chains).map(([chainId, count]) => ({
      chainId,
      count: parseInt(count),
    })),
    tiers: Object.entries(tiers).map(([tier, count]) => ({
      tier,
      count: parseInt(count),
    })),
  };
}

/**
 * Check if IP is allowed to download (for free tier)
 */
export async function checkDownloadAllowed(
  ip: string,
  tier: 'free' | 'premium',
  limit: number = 5
): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
  console.log(`[Redis] Checking download allowed for IP: ${ip}, tier: ${tier}, limit: ${limit}`);
  
  // Premium users have unlimited downloads
  if (tier === 'premium') {
    console.log(`[Redis] Premium user - unlimited downloads allowed`);
    return {
      allowed: true,
      remaining: -1, // Unlimited
      resetTime: new Date(),
    };
  }
  
  const count = await getDailyDownloadCount(ip);
  const remaining = Math.max(0, limit - count);
  
  // Calculate reset time (midnight UTC)
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  
  const result = {
    allowed: count < limit,
    remaining,
    resetTime: tomorrow,
  };
  
  console.log(`[Redis] Download check result:`, JSON.stringify(result));
  return result;
}

/**
 * Get recent downloads for a chain
 */
export async function getRecentDownloads(
  chainId: string,
  limit: number = 10
): Promise<DownloadRecord[]> {
  const logKey = `downloads:log:${chainId}`;
  const logs = await getRedisClient().lrange(logKey, 0, limit - 1);
  
  return logs.map(log => {
    const parsed = JSON.parse(log);
    return {
      ...parsed,
      timestamp: new Date(parsed.timestamp),
    };
  });
}