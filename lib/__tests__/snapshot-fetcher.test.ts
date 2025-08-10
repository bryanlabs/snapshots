import {
  fetchChains,
  fetchChainMetadata,
  fetchSnapshots,
  getSnapshotDownloadUrl,
  formatSnapshotForUI,
  RealSnapshot,
  ChainMetadata
} from '../snapshot-fetcher';

// Mock fetch globally
global.fetch = jest.fn();

describe('snapshot-fetcher', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  const SNAPSHOT_SERVER_URL = 'http://snapshot-server.snapshots.svc.cluster.local';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SNAPSHOT_SERVER_URL = SNAPSHOT_SERVER_URL;
  });

  describe('fetchChains', () => {
    it('should fetch and parse chains successfully', async () => {
      const mockData = [
        { type: 'directory', name: 'osmosis/' },
        { type: 'directory', name: 'cosmos/' },
        { type: 'file', name: 'readme.txt' },
        { type: 'directory', name: '.hidden/' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const chains = await fetchChains();

      expect(mockFetch).toHaveBeenCalledWith(`${SNAPSHOT_SERVER_URL}/`, {
        next: { revalidate: 300 }
      });
      expect(chains).toEqual(['osmosis', 'cosmos']);
    });

    it('should handle empty response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      const chains = await fetchChains();

      expect(chains).toEqual([]);
    });

    it('should handle non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const chains = await fetchChains();

      expect(chains).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching chains:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const chains = await fetchChains();

      expect(chains).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching chains:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should handle JSON parse errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as Response);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const chains = await fetchChains();

      expect(chains).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching chains:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should use custom SNAPSHOT_SERVER_URL when provided', async () => {
      const customUrl = 'https://custom-snapshot-server.com';
      process.env.SNAPSHOT_SERVER_URL = customUrl;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      await fetchChains();

      expect(mockFetch).toHaveBeenCalledWith(`${customUrl}/`, {
        next: { revalidate: 300 }
      });
    });
  });

  describe('fetchChainMetadata', () => {
    const mockMetadata: ChainMetadata = {
      chainId: 'osmosis',
      chainName: 'Osmosis',
      latestSnapshot: 'snapshot-12345',
      lastUpdated: '2024-01-01T00:00:00Z',
      snapshots: [
        {
          chain_id: 'osmosis',
          snapshot_name: 'snapshot-12345',
          timestamp: '2024-01-01T00:00:00Z',
          block_height: '1000000',
          data_size_bytes: 1000000000,
          compressed_size_bytes: 500000000,
          compression_ratio: 2.0,
        },
      ],
    };

    it('should fetch chain metadata successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetadata,
      } as Response);

      const metadata = await fetchChainMetadata('osmosis');

      expect(mockFetch).toHaveBeenCalledWith(
        `${SNAPSHOT_SERVER_URL}/osmosis/metadata.json`,
        { next: { revalidate: 60 } }
      );
      expect(metadata).toEqual(mockMetadata);
    });

    it('should return null for non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const metadata = await fetchChainMetadata('osmosis');

      expect(metadata).toBeNull();
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const metadata = await fetchChainMetadata('osmosis');

      expect(metadata).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching metadata for osmosis:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });

    it('should handle JSON parse errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as Response);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const metadata = await fetchChainMetadata('osmosis');

      expect(metadata).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching metadata for osmosis:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('fetchSnapshots', () => {
    const mockSnapshots: RealSnapshot[] = [
      {
        chain_id: 'osmosis',
        snapshot_name: 'snapshot-12345',
        timestamp: '2024-01-01T00:00:00Z',
        block_height: '1000000',
        data_size_bytes: 1000000000,
        compressed_size_bytes: 500000000,
        compression_ratio: 2.0,
      },
      {
        chain_id: 'osmosis',
        snapshot_name: 'snapshot-12346',
        timestamp: '2024-01-02T00:00:00Z',
        block_height: '1000100',
        data_size_bytes: 1100000000,
        compressed_size_bytes: 550000000,
        compression_ratio: 2.0,
      },
    ];

    it('should fetch snapshots from metadata', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          chainId: 'osmosis',
          chainName: 'Osmosis',
          snapshots: mockSnapshots,
        }),
      } as Response);

      const snapshots = await fetchSnapshots('osmosis');

      expect(snapshots).toEqual(mockSnapshots);
    });

    it('should return empty array when metadata is null', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const snapshots = await fetchSnapshots('osmosis');

      expect(snapshots).toEqual([]);
    });

    it('should return empty array when metadata has no snapshots', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          chainId: 'osmosis',
          chainName: 'Osmosis',
        }),
      } as Response);

      const snapshots = await fetchSnapshots('osmosis');

      expect(snapshots).toEqual([]);
    });
  });

  describe('getSnapshotDownloadUrl', () => {
    it('should generate correct download URL', () => {
      const url = getSnapshotDownloadUrl('osmosis', 'snapshot-12345');
      expect(url).toBe(`${SNAPSHOT_SERVER_URL}/osmosis/snapshot-12345.tar.lz4`);
    });

    it('should use custom SNAPSHOT_SERVER_URL', () => {
      const customUrl = 'https://custom-server.com';
      process.env.SNAPSHOT_SERVER_URL = customUrl;

      const url = getSnapshotDownloadUrl('cosmos', 'snapshot-99999');
      expect(url).toBe(`${customUrl}/cosmos/snapshot-99999.tar.lz4`);
    });
  });

  describe('formatSnapshotForUI', () => {
    it('should format snapshot correctly', () => {
      const snapshot: RealSnapshot = {
        chain_id: 'osmosis',
        snapshot_name: 'snapshot-12345',
        timestamp: '2024-01-01T12:00:00Z',
        block_height: '1000000',
        data_size_bytes: 1000000000,
        compressed_size_bytes: 500000000,
        compression_ratio: 2.0,
      };

      const formatted = formatSnapshotForUI(snapshot);

      expect(formatted).toEqual({
        fileName: 'snapshot-12345.tar.lz4',
        size: 500000000,
        height: 1000000,
        timestamp: new Date('2024-01-01T12:00:00Z'),
        chainId: 'osmosis',
        compressionRatio: 2.0,
      });
    });

    it('should handle invalid block height', () => {
      const snapshot: RealSnapshot = {
        chain_id: 'osmosis',
        snapshot_name: 'snapshot-12345',
        timestamp: '2024-01-01T12:00:00Z',
        block_height: 'invalid',
        data_size_bytes: 1000000000,
        compressed_size_bytes: 500000000,
        compression_ratio: 2.0,
      };

      const formatted = formatSnapshotForUI(snapshot);

      expect(formatted.height).toBe(0);
    });

    it('should handle empty block height', () => {
      const snapshot: RealSnapshot = {
        chain_id: 'osmosis',
        snapshot_name: 'snapshot-12345',
        timestamp: '2024-01-01T12:00:00Z',
        block_height: '',
        data_size_bytes: 1000000000,
        compressed_size_bytes: 500000000,
        compression_ratio: 2.0,
      };

      const formatted = formatSnapshotForUI(snapshot);

      expect(formatted.height).toBe(0);
    });
  });
});