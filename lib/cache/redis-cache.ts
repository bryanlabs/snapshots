import { redis } from '@/lib/redis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
}

/**
 * Comprehensive caching layer with Redis
 */
export class RedisCache {
  private defaultTTL = 300; // 5 minutes default
  private isConnected = false;

  constructor() {
    // Check Redis connection status
    redis.on('connect', () => {
      this.isConnected = true;
      console.log('Redis cache connected');
    });
    
    redis.on('error', () => {
      this.isConnected = false;
    });
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.isConnected) return null;
    
    try {
      const value = await redis.get(key);
      if (!value) return null;
      
      return JSON.parse(value);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL and tags
   */
  async set(key: string, value: any, options?: CacheOptions): Promise<void> {
    if (!this.isConnected) return;
    
    try {
      const ttl = options?.ttl || this.defaultTTL;
      const serialized = JSON.stringify(value);
      
      // Set the main key
      await redis.setex(key, ttl, serialized);
      
      // Handle tags for bulk invalidation
      if (options?.tags && options.tags.length > 0) {
        for (const tag of options.tags) {
          await redis.sadd(`tag:${tag}`, key);
          await redis.expire(`tag:${tag}`, ttl);
        }
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete a specific key
   */
  async delete(key: string): Promise<void> {
    if (!this.isConnected) return;
    
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Invalidate all keys with a specific tag
   */
  async invalidateTag(tag: string): Promise<void> {
    if (!this.isConnected) return;
    
    try {
      const keys = await redis.smembers(`tag:${tag}`);
      if (keys.length > 0) {
        await redis.del(...keys);
        await redis.del(`tag:${tag}`);
      }
    } catch (error) {
      console.error('Cache invalidate tag error:', error);
    }
  }

  /**
   * Clear all cache (use with caution)
   */
  async flush(): Promise<void> {
    if (!this.isConnected) return;
    
    try {
      await redis.flushdb();
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  }

  /**
   * Get or set pattern - fetch from cache or compute and cache
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Compute the value
    const value = await factory();
    
    // Cache it
    await this.set(key, value, options);
    
    return value;
  }

  /**
   * Stale-while-revalidate pattern
   */
  async staleWhileRevalidate<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions & { staleTime?: number }
  ): Promise<T> {
    // If Redis not connected, just run the factory
    if (!this.isConnected) {
      return await factory();
    }
    
    const staleKey = `${key}:stale`;
    const lockKey = `${key}:lock`;
    
    // Try to get fresh value
    let value = await this.get<T>(key);
    
    if (value !== null) {
      return value;
    }
    
    // Try to get stale value
    const staleValue = await this.get<T>(staleKey);
    
    // Try to acquire lock for revalidation
    let lockAcquired = false;
    try {
      lockAcquired = await redis.set(lockKey, '1', 'NX', 'EX', 10) === 'OK';
    } catch (error) {
      console.error('Lock acquisition error:', error);
    }
    
    if (lockAcquired) {
      // Revalidate in background
      factory().then(async (newValue) => {
        await this.set(key, newValue, options);
        await this.set(staleKey, newValue, { 
          ttl: options?.staleTime || 3600 // 1 hour stale time 
        });
        if (this.isConnected) {
          await redis.del(lockKey).catch(() => {});
        }
      }).catch((error) => {
        console.error('Revalidation error:', error);
        if (this.isConnected) {
          redis.del(lockKey).catch(() => {});
        }
      });
    }
    
    // Return stale value if available, otherwise wait for fresh
    if (staleValue !== null) {
      return staleValue;
    }
    
    // No stale value, must wait for fresh
    value = await factory();
    await this.set(key, value, options);
    await this.set(staleKey, value, { 
      ttl: options?.staleTime || 3600 
    });
    
    return value;
  }
}

// Export singleton instance
export const cache = new RedisCache();

// Cache key generators
export const cacheKeys = {
  // Chain related
  chains: () => 'chains:all',
  chain: (chainId: string) => `chain:${chainId}`,
  chainSnapshots: (chainId: string) => `chain:${chainId}:snapshots`,
  latestSnapshot: (chainId: string) => `chain:${chainId}:latest`,
  
  // User related
  userDownloads: (userId: string) => `user:${userId}:downloads`,
  userBandwidth: (userId: string) => `user:${userId}:bandwidth`,
  
  // Stats
  systemStats: () => 'stats:system',
  downloadStats: () => 'stats:downloads',
  
  // API responses
  apiResponse: (endpoint: string, params?: string) => 
    `api:${endpoint}${params ? `:${params}` : ''}`,
};