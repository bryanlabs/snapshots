import { RedisCache, cacheKeys } from '../redis-cache';
import { redis } from '@/lib/redis';

// Mock Redis client
jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    setex: jest.fn(),
    sadd: jest.fn(),
    expire: jest.fn(),
    smembers: jest.fn(),
    flushdb: jest.fn(),
    on: jest.fn(),
  }
}));

describe('RedisCache', () => {
  let cache: RedisCache;
  let mockRedis: any;

  beforeEach(() => {
    jest.clearAllMocks();
    cache = new RedisCache();
    mockRedis = redis as jest.Mocked<typeof redis>;
    
    // Simulate connected state by default
    const connectCallback = mockRedis.on.mock.calls.find(call => call[0] === 'connect')?.[1];
    if (connectCallback) connectCallback();
  });

  describe('get', () => {
    it('should return parsed value when key exists', async () => {
      const testData = { foo: 'bar', count: 42 };
      mockRedis.get.mockResolvedValue(JSON.stringify(testData));

      const result = await cache.get('test-key');

      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
      expect(result).toEqual(testData);
    });

    it('should return null when key does not exist', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await cache.get('non-existent');

      expect(result).toBeNull();
    });

    it('should return null when Redis is not connected', async () => {
      // Simulate disconnected state
      const errorCallback = mockRedis.on.mock.calls.find(call => call[0] === 'error')?.[1];
      if (errorCallback) errorCallback();

      const result = await cache.get('test-key');

      expect(mockRedis.get).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should handle JSON parse errors gracefully', async () => {
      mockRedis.get.mockResolvedValue('invalid json');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await cache.get('test-key');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Cache get error:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await cache.get('test-key');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Cache get error:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('set', () => {
    it('should set value with default TTL', async () => {
      const testData = { foo: 'bar' };
      
      await cache.set('test-key', testData);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'test-key',
        300, // default TTL
        JSON.stringify(testData)
      );
    });

    it('should set value with custom TTL', async () => {
      const testData = { foo: 'bar' };
      
      await cache.set('test-key', testData, { ttl: 600 });

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'test-key',
        600,
        JSON.stringify(testData)
      );
    });

    it('should handle tags when provided', async () => {
      const testData = { foo: 'bar' };
      const tags = ['tag1', 'tag2'];
      
      await cache.set('test-key', testData, { tags });

      expect(mockRedis.sadd).toHaveBeenCalledWith('tag:tag1', 'test-key');
      expect(mockRedis.sadd).toHaveBeenCalledWith('tag:tag2', 'test-key');
      expect(mockRedis.expire).toHaveBeenCalledWith('tag:tag1', 300);
      expect(mockRedis.expire).toHaveBeenCalledWith('tag:tag2', 300);
    });

    it('should not set when Redis is not connected', async () => {
      // Simulate disconnected state
      const errorCallback = mockRedis.on.mock.calls.find(call => call[0] === 'error')?.[1];
      if (errorCallback) errorCallback();

      await cache.set('test-key', { foo: 'bar' });

      expect(mockRedis.setex).not.toHaveBeenCalled();
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.setex.mockRejectedValue(new Error('Redis error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await cache.set('test-key', { foo: 'bar' });

      expect(consoleSpy).toHaveBeenCalledWith('Cache set error:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('delete', () => {
    it('should delete key when connected', async () => {
      await cache.delete('test-key');

      expect(mockRedis.del).toHaveBeenCalledWith('test-key');
    });

    it('should not delete when Redis is not connected', async () => {
      // Simulate disconnected state
      const errorCallback = mockRedis.on.mock.calls.find(call => call[0] === 'error')?.[1];
      if (errorCallback) errorCallback();

      await cache.delete('test-key');

      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await cache.delete('test-key');

      expect(consoleSpy).toHaveBeenCalledWith('Cache delete error:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('invalidateTag', () => {
    it('should delete all keys with a tag', async () => {
      const taggedKeys = ['key1', 'key2', 'key3'];
      mockRedis.smembers.mockResolvedValue(taggedKeys);

      await cache.invalidateTag('tag1');

      expect(mockRedis.smembers).toHaveBeenCalledWith('tag:tag1');
      expect(mockRedis.del).toHaveBeenCalledWith(...taggedKeys);
      expect(mockRedis.del).toHaveBeenCalledWith('tag:tag1');
    });

    it('should handle empty tag gracefully', async () => {
      mockRedis.smembers.mockResolvedValue([]);

      await cache.invalidateTag('empty-tag');

      expect(mockRedis.smembers).toHaveBeenCalledWith('tag:empty-tag');
      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should not invalidate when Redis is not connected', async () => {
      // Simulate disconnected state
      const errorCallback = mockRedis.on.mock.calls.find(call => call[0] === 'error')?.[1];
      if (errorCallback) errorCallback();

      await cache.invalidateTag('tag1');

      expect(mockRedis.smembers).not.toHaveBeenCalled();
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.smembers.mockRejectedValue(new Error('Redis error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await cache.invalidateTag('tag1');

      expect(consoleSpy).toHaveBeenCalledWith('Cache invalidate tag error:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('flush', () => {
    it('should flush database when connected', async () => {
      await cache.flush();

      expect(mockRedis.flushdb).toHaveBeenCalled();
    });

    it('should not flush when Redis is not connected', async () => {
      // Simulate disconnected state
      const errorCallback = mockRedis.on.mock.calls.find(call => call[0] === 'error')?.[1];
      if (errorCallback) errorCallback();

      await cache.flush();

      expect(mockRedis.flushdb).not.toHaveBeenCalled();
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.flushdb.mockRejectedValue(new Error('Redis error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await cache.flush();

      expect(consoleSpy).toHaveBeenCalledWith('Cache flush error:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('getOrSet', () => {
    it('should return cached value when it exists', async () => {
      const cachedData = { cached: true };
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedData));
      const factory = jest.fn();

      const result = await cache.getOrSet('test-key', factory);

      expect(result).toEqual(cachedData);
      expect(factory).not.toHaveBeenCalled();
    });

    it('should compute and cache value when not cached', async () => {
      const computedData = { computed: true };
      mockRedis.get.mockResolvedValue(null);
      const factory = jest.fn().mockResolvedValue(computedData);

      const result = await cache.getOrSet('test-key', factory);

      expect(result).toEqual(computedData);
      expect(factory).toHaveBeenCalled();
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'test-key',
        300,
        JSON.stringify(computedData)
      );
    });

    it('should pass options to set method', async () => {
      mockRedis.get.mockResolvedValue(null);
      const factory = jest.fn().mockResolvedValue({ data: 'test' });

      await cache.getOrSet('test-key', factory, { ttl: 600, tags: ['tag1'] });

      expect(mockRedis.setex).toHaveBeenCalledWith('test-key', 600, expect.any(String));
      expect(mockRedis.sadd).toHaveBeenCalledWith('tag:tag1', 'test-key');
    });

    it('should handle factory errors', async () => {
      mockRedis.get.mockResolvedValue(null);
      const factory = jest.fn().mockRejectedValue(new Error('Factory error'));

      await expect(cache.getOrSet('test-key', factory)).rejects.toThrow('Factory error');
    });
  });

  describe('staleWhileRevalidate', () => {
    it('should return fresh value when available', async () => {
      const freshData = { fresh: true };
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(freshData));
      const factory = jest.fn();

      const result = await cache.staleWhileRevalidate('test-key', factory);

      expect(result).toEqual(freshData);
      expect(factory).not.toHaveBeenCalled();
    });

    it('should return stale value and revalidate in background', async () => {
      const staleData = { stale: true };
      const newData = { new: true };
      
      // First get returns null (no fresh), second returns stale data
      mockRedis.get
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(JSON.stringify(staleData));
      
      // Lock acquisition succeeds
      mockRedis.set.mockResolvedValueOnce('OK');
      
      const factory = jest.fn().mockResolvedValue(newData);

      const result = await cache.staleWhileRevalidate('test-key', factory);

      expect(result).toEqual(staleData);
      
      // Factory should be called in background
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(factory).toHaveBeenCalled();
    });

    it('should wait for fresh value when no stale value exists', async () => {
      const newData = { new: true };
      
      // Both get calls return null
      mockRedis.get.mockResolvedValue(null);
      
      // Lock acquisition succeeds
      mockRedis.set.mockResolvedValueOnce('OK');
      
      const factory = jest.fn().mockResolvedValue(newData);

      const result = await cache.staleWhileRevalidate('test-key', factory);

      expect(result).toEqual(newData);
      expect(factory).toHaveBeenCalled();
      expect(mockRedis.setex).toHaveBeenCalled();
    });

    it('should handle disconnected Redis by calling factory directly', async () => {
      // Simulate disconnected state
      const errorCallback = mockRedis.on.mock.calls.find(call => call[0] === 'error')?.[1];
      if (errorCallback) errorCallback();
      
      const factoryData = { factory: true };
      const factory = jest.fn().mockResolvedValue(factoryData);

      const result = await cache.staleWhileRevalidate('test-key', factory);

      expect(result).toEqual(factoryData);
      expect(factory).toHaveBeenCalled();
      expect(mockRedis.get).not.toHaveBeenCalled();
    });

    it('should handle lock acquisition failure', async () => {
      const staleData = { stale: true };
      
      mockRedis.get
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(JSON.stringify(staleData));
      
      // Lock acquisition fails
      mockRedis.set.mockResolvedValueOnce(null);
      
      const factory = jest.fn();

      const result = await cache.staleWhileRevalidate('test-key', factory);

      expect(result).toEqual(staleData);
      // Factory should not be called since lock wasn't acquired
      expect(factory).not.toHaveBeenCalled();
    });

    it('should handle revalidation errors gracefully', async () => {
      const staleData = { stale: true };
      
      mockRedis.get
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(JSON.stringify(staleData));
      
      mockRedis.set.mockResolvedValueOnce('OK');
      
      const factory = jest.fn().mockRejectedValue(new Error('Factory error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await cache.staleWhileRevalidate('test-key', factory);

      expect(result).toEqual(staleData);
      
      // Wait for background revalidation to complete
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(consoleSpy).toHaveBeenCalledWith('Revalidation error:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('cacheKeys', () => {
    it('should generate correct chain keys', () => {
      expect(cacheKeys.chains()).toBe('chains:all');
      expect(cacheKeys.chain('osmosis')).toBe('chain:osmosis');
      expect(cacheKeys.chainSnapshots('osmosis')).toBe('chain:osmosis:snapshots');
      expect(cacheKeys.latestSnapshot('osmosis')).toBe('chain:osmosis:latest');
    });

    it('should generate correct user keys', () => {
      expect(cacheKeys.userDownloads('user123')).toBe('user:user123:downloads');
      expect(cacheKeys.userBandwidth('user123')).toBe('user:user123:bandwidth');
    });

    it('should generate correct stats keys', () => {
      expect(cacheKeys.systemStats()).toBe('stats:system');
      expect(cacheKeys.downloadStats()).toBe('stats:downloads');
    });

    it('should generate correct API response keys', () => {
      expect(cacheKeys.apiResponse('/chains')).toBe('api:/chains');
      expect(cacheKeys.apiResponse('/chains', 'limit=10')).toBe('api:/chains:limit=10');
    });
  });
});