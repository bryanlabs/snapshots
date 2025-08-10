import { MockRedis } from '../redis-dev';

describe('MockRedis (Development Mode)', () => {
  let mockRedis: MockRedis;

  beforeEach(() => {
    mockRedis = new MockRedis();
    // Clear the in-memory store between tests
    (MockRedis as any).memoryStore.clear();
  });

  describe('basic operations', () => {
    it('should set and get values', async () => {
      await mockRedis.set('test-key', 'test-value');
      const result = await mockRedis.get('test-key');
      expect(result).toBe('test-value');
    });

    it('should return null for non-existent keys', async () => {
      const result = await mockRedis.get('non-existent');
      expect(result).toBeNull();
    });

    it('should delete keys', async () => {
      await mockRedis.set('test-key', 'test-value');
      const deleted = await mockRedis.del('test-key');
      expect(deleted).toBe(1);
      
      const result = await mockRedis.get('test-key');
      expect(result).toBeNull();
    });
  });

  describe('expiration', () => {
    it('should handle setex with expiration', async () => {
      await mockRedis.setex('expiring-key', 1, 'value'); // 1 second
      
      // Should exist immediately
      const result1 = await mockRedis.get('expiring-key');
      expect(result1).toBe('value');
      
      // Mock time passing
      jest.useFakeTimers();
      jest.advanceTimersByTime(1100); // 1.1 seconds
      
      // Should be expired
      const result2 = await mockRedis.get('expiring-key');
      expect(result2).toBeNull();
      
      jest.useRealTimers();
    });

    it('should handle expire command', async () => {
      await mockRedis.set('test-key', 'test-value');
      await mockRedis.expire('test-key', 1); // 1 second
      
      jest.useFakeTimers();
      jest.advanceTimersByTime(1100); // 1.1 seconds
      
      const result = await mockRedis.get('test-key');
      expect(result).toBeNull();
      
      jest.useRealTimers();
    });
  });

  describe('sets operations', () => {
    it('should add members to sets', async () => {
      const result = await mockRedis.sadd('test-set', 'member1', 'member2');
      expect(result).toBe(2); // 2 new members added
    });

    it('should return set members', async () => {
      await mockRedis.sadd('test-set', 'member1', 'member2', 'member3');
      const members = await mockRedis.smembers('test-set');
      expect(members).toHaveLength(3);
      expect(members).toContain('member1');
      expect(members).toContain('member2');
      expect(members).toContain('member3');
    });

    it('should not add duplicate members', async () => {
      await mockRedis.sadd('test-set', 'member1');
      const result = await mockRedis.sadd('test-set', 'member1', 'member2');
      expect(result).toBe(1); // Only 1 new member added (member2)
      
      const members = await mockRedis.smembers('test-set');
      expect(members).toHaveLength(2);
    });
  });

  describe('development logging', () => {
    it('should log operations in development mode', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await mockRedis.set('test-key', 'test-value');
      await mockRedis.get('test-key');
      await mockRedis.del('test-key');
      
      expect(consoleSpy).toHaveBeenCalledWith('[MockRedis] SET test-key');
      expect(consoleSpy).toHaveBeenCalledWith('[MockRedis] GET test-key -> test-value');
      expect(consoleSpy).toHaveBeenCalledWith('[MockRedis] DEL test-key -> 1');
      
      consoleSpy.mockRestore();
    });
  });

  describe('flushdb', () => {
    it('should clear all data', async () => {
      await mockRedis.set('key1', 'value1');
      await mockRedis.set('key2', 'value2');
      await mockRedis.sadd('set1', 'member1');
      
      await mockRedis.flushdb();
      
      expect(await mockRedis.get('key1')).toBeNull();
      expect(await mockRedis.get('key2')).toBeNull();
      expect(await mockRedis.smembers('set1')).toHaveLength(0);
    });
  });

  describe('realistic redis behavior', () => {
    it('should handle concurrent operations', async () => {
      const promises = [
        mockRedis.set('key1', 'value1'),
        mockRedis.set('key2', 'value2'),
        mockRedis.set('key3', 'value3'),
      ];
      
      await Promise.all(promises);
      
      expect(await mockRedis.get('key1')).toBe('value1');
      expect(await mockRedis.get('key2')).toBe('value2');
      expect(await mockRedis.get('key3')).toBe('value3');
    });

    it('should maintain data consistency', async () => {
      // Simulate cache scenario used in the app
      await mockRedis.setex('cache:chains:all', 300, JSON.stringify(['chain1', 'chain2']));
      await mockRedis.sadd('tag:chains', 'cache:chains:all');
      
      const cachedData = await mockRedis.get('cache:chains:all');
      const tagMembers = await mockRedis.smembers('tag:chains');
      
      expect(JSON.parse(cachedData!)).toEqual(['chain1', 'chain2']);
      expect(tagMembers).toContain('cache:chains:all');
    });
  });
});