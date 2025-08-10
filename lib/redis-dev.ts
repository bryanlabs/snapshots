// Development-friendly Redis client with in-memory fallback
import { Redis } from 'ioredis';

// In-memory storage for development
const memoryStore = new Map<string, { value: string; expiry?: number }>();

class MockRedis {
  async get(key: string): Promise<string | null> {
    const item = memoryStore.get(key);
    if (!item) return null;
    
    if (item.expiry && Date.now() > item.expiry) {
      memoryStore.delete(key);
      return null;
    }
    
    return item.value;
  }

  async set(key: string, value: string): Promise<'OK'> {
    memoryStore.set(key, { value });
    return 'OK';
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const newValue = (parseInt(current || '0') + 1).toString();
    memoryStore.set(key, { value: newValue });
    return parseInt(newValue);
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = memoryStore.get(key);
    if (!item) return 0;
    
    item.expiry = Date.now() + (seconds * 1000);
    return 1;
  }

  async lpush(key: string, ...values: string[]): Promise<number> {
    const current = await this.get(key);
    const list = current ? JSON.parse(current) : [];
    list.unshift(...values);
    await this.set(key, JSON.stringify(list));
    return list.length;
  }

  async ltrim(key: string, start: number, stop: number): Promise<'OK'> {
    const current = await this.get(key);
    if (!current) return 'OK';
    
    const list = JSON.parse(current);
    const trimmed = list.slice(start, stop + 1);
    await this.set(key, JSON.stringify(trimmed));
    return 'OK';
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const current = await this.get(key);
    if (!current) return [];
    
    const list = JSON.parse(current);
    return list.slice(start, stop === -1 ? undefined : stop + 1);
  }

  async hincrby(key: string, field: string, increment: number): Promise<number> {
    const current = await this.get(key);
    const hash = current ? JSON.parse(current) : {};
    const newValue = (parseInt(hash[field] || '0') + increment);
    hash[field] = newValue.toString();
    await this.set(key, JSON.stringify(hash));
    return newValue;
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    const current = await this.get(key);
    return current ? JSON.parse(current) : {};
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    const expiry = Date.now() + (seconds * 1000);
    memoryStore.set(key, { value, expiry });
    return 'OK';
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    const current = await this.get(key);
    const set = new Set(current ? JSON.parse(current) : []);
    let added = 0;
    for (const member of members) {
      if (!set.has(member)) {
        set.add(member);
        added++;
      }
    }
    await this.set(key, JSON.stringify(Array.from(set)));
    return added;
  }

  async smembers(key: string): Promise<string[]> {
    const current = await this.get(key);
    return current ? JSON.parse(current) : [];
  }

  async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    for (const key of keys) {
      if (memoryStore.has(key)) {
        memoryStore.delete(key);
        deleted++;
      }
    }
    return deleted;
  }

  async flushdb(): Promise<'OK'> {
    memoryStore.clear();
    return 'OK';
  }

  async ping(): Promise<'PONG'> {
    return 'PONG';
  }

  // Event emitter methods for compatibility
  on(event: string, callback: Function): this {
    // Mock event system - immediately call connect callback
    if (event === 'connect') {
      setTimeout(() => callback(), 10);
    }
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    return true;
  }
}

// Initialize Redis client with development fallback
let redis: Redis | MockRedis | null = null;
let isRedisAvailable = false;
let hasLoggedRedisStatus = false;

export function getRedisClient(): Redis | MockRedis {
  if (!redis) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379');
    
    if (isDevelopment) {
      // Try to connect to Redis first, fallback to mock if it fails
      try {
        redis = new Redis({
          host,
          port,
          password: process.env.REDIS_PASSWORD,
          retryDelayOnFailover: 100,
          retryDelayOnClusterDown: 300,
          maxRetriesPerRequest: 1,
          lazyConnect: true,
          enableOfflineQueue: false,
        });
        
        redis.on('error', (err) => {
          if (!isRedisAvailable && !hasLoggedRedisStatus) {
            console.log(`[Redis] Using in-memory store for development`);
            hasLoggedRedisStatus = true;
            redis = new MockRedis();
          }
        });
        
        redis.on('connect', () => {
          isRedisAvailable = true;
          if (!hasLoggedRedisStatus) {
            console.log('[Redis] Connected to Redis');
            hasLoggedRedisStatus = true;
          }
        });
        
        // Test connection
        (redis as Redis).ping().catch(() => {
          if (!hasLoggedRedisStatus) {
            console.log(`[Redis] Using in-memory store for development`);
            hasLoggedRedisStatus = true;
          }
          redis = new MockRedis();
        });
        
      } catch (error) {
        if (!hasLoggedRedisStatus) {
          console.log(`[Redis] Using in-memory store for development`);
          hasLoggedRedisStatus = true;
        }
        redis = new MockRedis();
      }
    } else {
      // Production - require Redis
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
  }
  
  return redis!;
}

export { Redis, MockRedis };