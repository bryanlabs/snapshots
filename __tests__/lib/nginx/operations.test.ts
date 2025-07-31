import * as nginxOperations from '@/lib/nginx/operations';
import * as nginxClient from '@/lib/nginx/client';

// Mock the nginx client
jest.mock('@/lib/nginx/client');

describe('Nginx Operations', () => {
  let mockListObjects: jest.Mock;
  let mockObjectExists: jest.Mock;
  let mockGenerateSecureLink: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    mockListObjects = jest.fn();
    mockObjectExists = jest.fn();
    mockGenerateSecureLink = jest.fn();
    
    (nginxClient.listObjects as jest.Mock) = mockListObjects;
    (nginxClient.objectExists as jest.Mock) = mockObjectExists;
    (nginxClient.generateSecureLink as jest.Mock) = mockGenerateSecureLink;
  });

  describe('listChains', () => {
    it('should list all available chains', async () => {
      mockListObjects.mockResolvedValueOnce([
        { name: 'cosmos-hub/', type: 'directory', size: 0, mtime: '2025-01-30T12:00:00' },
        { name: 'noble-1/', type: 'directory', size: 0, mtime: '2025-01-30T12:00:00' },
        { name: 'osmosis-1/', type: 'directory', size: 0, mtime: '2025-01-30T12:00:00' },
      ]);
      
      // Mock snapshot listings for each chain
      mockListObjects
        .mockResolvedValueOnce([
          { name: 'cosmos-hub-123456.tar.zst', type: 'file', size: 1000000, mtime: '2025-01-30T10:00:00' },
          { name: 'cosmos-hub-123455.tar.zst', type: 'file', size: 900000, mtime: '2025-01-29T10:00:00' },
        ])
        .mockResolvedValueOnce([
          { name: 'noble-1-789012.tar.lz4', type: 'file', size: 2000000, mtime: '2025-01-30T11:00:00' },
        ])
        .mockResolvedValueOnce([
          { name: 'osmosis-1-345678.tar.zst', type: 'file', size: 1500000, mtime: '2025-01-30T09:00:00' },
        ]);
      
      const chains = await nginxOperations.listChains();
      
      expect(chains).toHaveLength(3);
      expect(chains[0]).toEqual({
        chainId: 'cosmos-hub',
        snapshotCount: 2,
        latestSnapshot: expect.objectContaining({
          filename: 'cosmos-hub-123456.tar.zst',
          size: 1000000,
          compressionType: 'zst',
        }),
        totalSize: 1900000,
      });
      expect(chains[1]).toEqual({
        chainId: 'noble-1',
        snapshotCount: 1,
        latestSnapshot: expect.objectContaining({
          filename: 'noble-1-789012.tar.lz4',
          size: 2000000,
          compressionType: 'lz4',
        }),
        totalSize: 2000000,
      });
    });
    
    it('should handle chains with no snapshots', async () => {
      mockListObjects.mockResolvedValueOnce([
        { name: 'empty-chain/', type: 'directory', size: 0, mtime: '2025-01-30T12:00:00' },
      ]);
      
      mockListObjects.mockResolvedValueOnce([]); // No snapshots
      
      const chains = await nginxOperations.listChains();
      
      expect(chains).toHaveLength(1);
      expect(chains[0]).toEqual({
        chainId: 'empty-chain',
        snapshotCount: 0,
        latestSnapshot: undefined,
        totalSize: 0,
      });
    });
  });

  describe('listSnapshots', () => {
    it('should list snapshots for a chain', async () => {
      mockListObjects.mockResolvedValue([
        { name: 'cosmos-hub-123456.tar.zst', type: 'file', size: 1000000, mtime: '2025-01-30T10:00:00' },
        { name: 'cosmos-hub-123455.tar.zst', type: 'file', size: 900000, mtime: '2025-01-29T10:00:00' },
        { name: 'cosmos-hub-123454.tar.lz4', type: 'file', size: 800000, mtime: '2025-01-28T10:00:00' },
        { name: 'latest.tar.zst', type: 'file', size: 100, mtime: '2025-01-30T10:00:00' }, // Should be skipped
        { name: 'README.md', type: 'file', size: 1024, mtime: '2025-01-27T10:00:00' }, // Should be skipped
      ]);
      
      const snapshots = await nginxOperations.listSnapshots('cosmos-hub');
      
      expect(snapshots).toHaveLength(3);
      expect(snapshots[0]).toEqual({
        filename: 'cosmos-hub-123456.tar.zst',
        size: 1000000,
        lastModified: new Date('2025-01-30T10:00:00'),
        compressionType: 'zst',
        height: 123456,
      });
      expect(snapshots[1]).toEqual({
        filename: 'cosmos-hub-123455.tar.zst',
        size: 900000,
        lastModified: new Date('2025-01-29T10:00:00'),
        compressionType: 'zst',
        height: 123455,
      });
      expect(snapshots[2]).toEqual({
        filename: 'cosmos-hub-123454.tar.lz4',
        size: 800000,
        lastModified: new Date('2025-01-28T10:00:00'),
        compressionType: 'lz4',
        height: 123454,
      });
    });
    
    it('should sort snapshots by last modified date (newest first)', async () => {
      mockListObjects.mockResolvedValue([
        { name: 'cosmos-hub-123454.tar.zst', type: 'file', size: 800000, mtime: '2025-01-28T10:00:00' },
        { name: 'cosmos-hub-123456.tar.zst', type: 'file', size: 1000000, mtime: '2025-01-30T10:00:00' },
        { name: 'cosmos-hub-123455.tar.zst', type: 'file', size: 900000, mtime: '2025-01-29T10:00:00' },
      ]);
      
      const snapshots = await nginxOperations.listSnapshots('cosmos-hub');
      
      expect(snapshots[0].filename).toBe('cosmos-hub-123456.tar.zst');
      expect(snapshots[1].filename).toBe('cosmos-hub-123455.tar.zst');
      expect(snapshots[2].filename).toBe('cosmos-hub-123454.tar.zst');
    });
  });

  describe('getLatestSnapshot', () => {
    it('should fetch latest snapshot from latest.json if available', async () => {
      mockObjectExists.mockResolvedValue(true);
      
      // Mock fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          filename: 'cosmos-hub-123456.tar.zst',
          size_bytes: 1000000,
          timestamp: '2025-01-30T10:00:00Z',
        }),
      });
      
      const latest = await nginxOperations.getLatestSnapshot('cosmos-hub');
      
      expect(latest).toEqual({
        filename: 'cosmos-hub-123456.tar.zst',
        size: 1000000,
        lastModified: new Date('2025-01-30T10:00:00Z'),
        compressionType: 'zst',
      });
      expect(mockObjectExists).toHaveBeenCalledWith('/cosmos-hub/latest.json');
    });
    
    it('should fallback to newest snapshot if latest.json not available', async () => {
      mockObjectExists.mockResolvedValue(false);
      
      mockListObjects.mockResolvedValue([
        { name: 'cosmos-hub-123455.tar.zst', type: 'file', size: 900000, mtime: '2025-01-29T10:00:00' },
        { name: 'cosmos-hub-123456.tar.zst', type: 'file', size: 1000000, mtime: '2025-01-30T10:00:00' },
      ]);
      
      const latest = await nginxOperations.getLatestSnapshot('cosmos-hub');
      
      expect(latest).toEqual({
        filename: 'cosmos-hub-123456.tar.zst',
        size: 1000000,
        lastModified: new Date('2025-01-30T10:00:00'),
        compressionType: 'zst',
        height: 123456,
      });
    });
    
    it('should return null if no snapshots available', async () => {
      mockObjectExists.mockResolvedValue(false);
      mockListObjects.mockResolvedValue([]);
      
      const latest = await nginxOperations.getLatestSnapshot('cosmos-hub');
      
      expect(latest).toBeNull();
    });
  });

  describe('generateDownloadUrl', () => {
    it('should generate download URL for free tier', async () => {
      mockGenerateSecureLink.mockReturnValue('https://snapshots.bryanlabs.net/secure-link');
      
      const url = await nginxOperations.generateDownloadUrl(
        'cosmos-hub',
        'cosmos-hub-123456.tar.zst',
        'free',
        'user123'
      );
      
      expect(url).toBe('https://snapshots.bryanlabs.net/secure-link');
      expect(mockGenerateSecureLink).toHaveBeenCalledWith(
        '/cosmos-hub/cosmos-hub-123456.tar.zst',
        'free',
        12 // 12 hours for free tier
      );
    });
    
    it('should generate download URL for premium tier', async () => {
      mockGenerateSecureLink.mockReturnValue('https://snapshots.bryanlabs.net/secure-link-premium');
      
      const url = await nginxOperations.generateDownloadUrl(
        'cosmos-hub',
        'cosmos-hub-123456.tar.zst',
        'premium',
        'premium-user'
      );
      
      expect(url).toBe('https://snapshots.bryanlabs.net/secure-link-premium');
      expect(mockGenerateSecureLink).toHaveBeenCalledWith(
        '/cosmos-hub/cosmos-hub-123456.tar.zst',
        'premium',
        24 // 24 hours for premium tier
      );
    });
    
    it('should default to free tier if not specified', async () => {
      mockGenerateSecureLink.mockReturnValue('https://snapshots.bryanlabs.net/secure-link');
      
      const url = await nginxOperations.generateDownloadUrl(
        'cosmos-hub',
        'cosmos-hub-123456.tar.zst'
      );
      
      expect(mockGenerateSecureLink).toHaveBeenCalledWith(
        '/cosmos-hub/cosmos-hub-123456.tar.zst',
        'free',
        12
      );
    });
  });
});