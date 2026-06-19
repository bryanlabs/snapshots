import { MockNginxClient } from '../nginx-dev';

describe('MockNginxClient (Development Mode)', () => {
  let mockClient: MockNginxClient;
  
  beforeEach(() => {
    mockClient = new MockNginxClient('http://localhost:32708');
  });

  describe('listObjects', () => {
    it('should list chain directories at root', async () => {
      const result = await mockClient.listObjects('/');
      
      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({
        name: 'cosmoshub-4/',
        type: 'directory',
        size: 0,
        mtime: expect.any(String),
      });
      
      // Should include all expected chains
      const chainNames = result.map(item => item.name);
      expect(chainNames).toContain('cosmoshub-4/');
      expect(chainNames).toContain('cosmoshub-4-pebble/');
      expect(chainNames).toContain('provider/');
      expect(chainNames).toContain('provider-pebble/');
    });

    it('should list snapshots for specific chains', async () => {
      const result = await mockClient.listObjects('/provider/');
      
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toEqual({
        name: expect.stringMatching(/provider-\d+-\d+\.tar\.zst/),
        type: 'file',
        size: expect.any(Number),
        mtime: expect.any(String),
      });
    });

    it('should return empty array for non-existent paths', async () => {
      const result = await mockClient.listObjects('/non-existent/');
      expect(result).toEqual([]);
    });

    it('should handle paths without leading slash', async () => {
      const result = await mockClient.listObjects('provider/');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('objectExists', () => {
    it('should return true for existing chain directories', async () => {
      const exists = await mockClient.objectExists('/provider/');
      expect(exists).toBe(true);
    });

    it('should return true for existing snapshot files', async () => {
      // Get a file from provider first
      const files = await mockClient.listObjects('/provider/');
      const firstFile = files[0];
      
      const exists = await mockClient.objectExists(`/provider/${firstFile.name}`);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent paths', async () => {
      const exists = await mockClient.objectExists('/non-existent-chain/');
      expect(exists).toBe(false);
    });

    it('should return true for latest.json files', async () => {
      const exists = await mockClient.objectExists('/provider/latest.json');
      expect(exists).toBe(true);
    });
  });

  describe('realistic blockchain data', () => {
    it('should provide realistic file sizes', async () => {
      const files = await mockClient.listObjects('/provider/');
      const file = files[0];
      
      // File sizes should be in realistic range (1-3 GB)
      expect(file.size).toBeGreaterThan(1000000000); // > 1GB
      expect(file.size).toBeLessThan(3000000000); // < 3GB
    });

    it('should provide realistic timestamps', async () => {
      const files = await mockClient.listObjects('/provider/');
      const file = files[0];
      
      // Timestamp should be valid RFC3339 format
      const date = new Date(file.mtime);
      expect(date.getTime()).not.toBeNaN();
      
      // Should be recent (within last few days)
      const now = new Date();
      const daysDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeLessThan(7); // Within last week
    });

    it('should provide zst snapshot archives', async () => {
      const files = await mockClient.listObjects('/cosmoshub-4/');
      
      const compressionTypes = files.map(file => {
        const match = file.name.match(/\.(zst|lz4)$/);
        return match ? match[1] : null;
      }).filter(Boolean);
      
      expect(compressionTypes).toContain('zst');
    });

    it('should provide consistent chain naming', async () => {
      const files = await mockClient.listObjects('/provider/');
      
      files.forEach(file => {
        // All files should start with the chain name
        expect(file.name).toMatch(/^provider-\d+/);
      });
    });
  });

  describe('development logging', () => {
    it('should log operations in development mode', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await mockClient.listObjects('/provider/');
      await mockClient.objectExists('/provider/latest.json');
      
      expect(consoleSpy).toHaveBeenCalledWith('[MockNginx] listObjects /provider/');
      expect(consoleSpy).toHaveBeenCalledWith('[MockNginx] objectExists /provider/latest.json -> true');
      
      consoleSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle empty chain directories', async () => {
      // Test with a chain that has no snapshots
      const emptyChain = 'empty-chain-test';
      const files = await mockClient.listObjects(`/${emptyChain}/`);
      
      // Should return empty array, not throw error
      expect(files).toEqual([]);
    });

    it('should handle malformed paths gracefully', async () => {
      const tests = [
        '//double-slash//',
        '/path/with/../../traversal',
        '/path with spaces/',
      ];
      
      for (const path of tests) {
        const result = await mockClient.listObjects(path);
        expect(Array.isArray(result)).toBe(true);
      }
    });
  });

  describe('chain coverage', () => {
    it('should include all expected public storage directories', async () => {
      const chains = await mockClient.listObjects('/');
      const chainNames = chains.map(c => c.name.replace('/', ''));
      
      const expectedChains = [
        'cosmoshub-4',
        'cosmoshub-4-pebble',
        'provider',
        'provider-pebble',
      ];
      
      expectedChains.forEach(chain => {
        expect(chainNames).toContain(chain);
      });
    });
  });
});
