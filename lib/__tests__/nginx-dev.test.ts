import { MockNginxClient } from '../nginx-dev';

describe('MockNginxClient (Development Mode)', () => {
  let mockClient: MockNginxClient;
  
  beforeEach(() => {
    mockClient = new MockNginxClient('http://localhost:32708');
  });

  describe('listObjects', () => {
    it('should list chain directories at root', async () => {
      const result = await mockClient.listObjects('/');
      
      expect(result).toHaveLength(8); // 8 mock chains
      expect(result[0]).toEqual({
        name: 'agoric-3/',
        type: 'directory',
        size: 0,
        mtime: expect.any(String),
      });
      
      // Should include all expected chains
      const chainNames = result.map(item => item.name);
      expect(chainNames).toContain('agoric-3/');
      expect(chainNames).toContain('noble-1/');
      expect(chainNames).toContain('osmosis-1/');
      expect(chainNames).toContain('cosmoshub-4/');
    });

    it('should list snapshots for specific chains', async () => {
      const result = await mockClient.listObjects('/noble-1/');
      
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toEqual({
        name: expect.stringMatching(/noble-1-\d+-\d+\.tar\.(zst|lz4)/),
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
      const result = await mockClient.listObjects('noble-1/');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('objectExists', () => {
    it('should return true for existing chain directories', async () => {
      const exists = await mockClient.objectExists('/noble-1/');
      expect(exists).toBe(true);
    });

    it('should return true for existing snapshot files', async () => {
      // Get a file from noble-1 first
      const files = await mockClient.listObjects('/noble-1/');
      const firstFile = files[0];
      
      const exists = await mockClient.objectExists(`/noble-1/${firstFile.name}`);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent paths', async () => {
      const exists = await mockClient.objectExists('/non-existent-chain/');
      expect(exists).toBe(false);
    });

    it('should return true for latest.json files', async () => {
      const exists = await mockClient.objectExists('/noble-1/latest.json');
      expect(exists).toBe(true);
    });
  });

  describe('realistic blockchain data', () => {
    it('should provide realistic file sizes', async () => {
      const files = await mockClient.listObjects('/noble-1/');
      const file = files[0];
      
      // File sizes should be in realistic range (1-3 GB)
      expect(file.size).toBeGreaterThan(1000000000); // > 1GB
      expect(file.size).toBeLessThan(3000000000); // < 3GB
    });

    it('should provide realistic timestamps', async () => {
      const files = await mockClient.listObjects('/osmosis-1/');
      const file = files[0];
      
      // Timestamp should be valid RFC3339 format
      const date = new Date(file.mtime);
      expect(date.getTime()).not.toBeNaN();
      
      // Should be recent (within last few days)
      const now = new Date();
      const daysDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeLessThan(7); // Within last week
    });

    it('should support both zst and lz4 compression types', async () => {
      const files = await mockClient.listObjects('/cosmoshub-4/');
      
      const compressionTypes = files.map(file => {
        const match = file.name.match(/\.(zst|lz4)$/);
        return match ? match[1] : null;
      }).filter(Boolean);
      
      expect(compressionTypes).toContain('zst');
      expect(compressionTypes).toContain('lz4');
    });

    it('should provide consistent chain naming', async () => {
      const files = await mockClient.listObjects('/agoric-3/');
      
      files.forEach(file => {
        // All files should start with the chain name
        expect(file.name).toMatch(/^agoric-3-\d+/);
      });
    });
  });

  describe('development logging', () => {
    it('should log operations in development mode', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await mockClient.listObjects('/noble-1/');
      await mockClient.objectExists('/noble-1/latest.json');
      
      expect(consoleSpy).toHaveBeenCalledWith('[MockNginx] listObjects /noble-1/');
      expect(consoleSpy).toHaveBeenCalledWith('[MockNginx] objectExists /noble-1/latest.json -> true');
      
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
    it('should include all expected Cosmos chains', async () => {
      const chains = await mockClient.listObjects('/');
      const chainNames = chains.map(c => c.name.replace('/', ''));
      
      const expectedChains = [
        'agoric-3',
        'columbus-5', 
        'cosmoshub-4',
        'kaiyo-1',
        'noble-1',
        'osmosis-1',
        'phoenix-1',
        'thorchain-1'
      ];
      
      expectedChains.forEach(chain => {
        expect(chainNames).toContain(chain);
      });
    });
  });
});