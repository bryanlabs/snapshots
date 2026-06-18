// Development-friendly nginx client with mock fallback
import { listObjects, objectExists } from './nginx/client';

// Mock nginx responses for development. Keep this aligned with the current
// public service shape: three chains, each with LevelDB and PebbleDB storage.
const mockChains = [
  'cosmoshub-4',
  'cosmoshub-4-pebble',
  'noble-1',
  'noble-1-pebble',
  'osmosis-1',
  'osmosis-1-pebble',
];

type MockSnapshotConfig = {
  size: number;
  height: number;
  mtime: string;
};

function archive(storageChainId: string, config: MockSnapshotConfig) {
  const date = new Date(config.mtime);
  const yyyymmdd = date.toISOString().slice(0, 10).replace(/-/g, '');
  const hhmmss = date.toISOString().slice(11, 19).replace(/:/g, '');
  const name = `${storageChainId}-${config.height}-${yyyymmdd}-${hhmmss}.tar.zst`;

  return [
    {
      name,
      size: config.size,
      mtime: config.mtime,
      type: 'file'
    },
    {
      name: `${name}.sha256`,
      size: 96,
      mtime: config.mtime,
      type: 'file'
    }
  ];
}

const mockSnapshots = {
  'cosmoshub-4': [
    ...archive('cosmoshub-4', {
      size: 112_000_000_000,
      height: 31_561_611,
      mtime: 'Sun, 14 Jun 2026 14:17:29 GMT',
    }),
    ...archive('cosmoshub-4', {
      size: 111_500_000_000,
      height: 31_560_352,
      mtime: 'Sun, 14 Jun 2026 10:17:25 GMT',
    }),
  ],
  'cosmoshub-4-pebble': [
    ...archive('cosmoshub-4-pebble', {
      size: 69_600_000_000,
      height: 31_561_000,
      mtime: 'Sun, 14 Jun 2026 12:10:04 GMT',
    }),
    ...archive('cosmoshub-4-pebble', {
      size: 69_200_000_000,
      height: 31_559_800,
      mtime: 'Sun, 14 Jun 2026 08:09:24 GMT',
    }),
  ],
  'noble-1': [
    ...archive('noble-1', {
      size: 1_324_829_151,
      height: 52_725_869,
      mtime: 'Sun, 14 Jun 2026 13:41:52 GMT',
    }),
    ...archive('noble-1', {
      size: 1_123_240_921,
      height: 52_723_300,
      mtime: 'Sun, 14 Jun 2026 07:41:29 GMT',
    }),
  ],
  'noble-1-pebble': [
    ...archive('noble-1-pebble', {
      size: 890_881_178,
      height: 52_725_529,
      mtime: 'Sun, 14 Jun 2026 10:33:47 GMT',
    }),
    ...archive('noble-1-pebble', {
      size: 887_432_937,
      height: 52_725_181,
      mtime: 'Sun, 14 Jun 2026 04:25:37 GMT',
    }),
  ],
  'osmosis-1': [
    ...archive('osmosis-1', {
      size: 56_799_059_175,
      height: 64_010_506,
      mtime: 'Sun, 14 Jun 2026 09:15:40 GMT',
    }),
    ...archive('osmosis-1', {
      size: 54_788_337_057,
      height: 64_007_135,
      mtime: 'Sun, 14 Jun 2026 03:06:07 GMT',
    }),
  ],
  'osmosis-1-pebble': [
    ...archive('osmosis-1-pebble', {
      size: 22_554_906_602,
      height: 64_023_587,
      mtime: 'Sun, 14 Jun 2026 11:21:28 GMT',
    }),
    ...archive('osmosis-1-pebble', {
      size: 22_100_000_000,
      height: 64_020_100,
      mtime: 'Sun, 14 Jun 2026 05:21:28 GMT',
    }),
  ],
};

class MockNginxClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async listObjects(path: string): Promise<any[]> {
    console.log(`[MockNginx] listObjects ${path}`);
    // Root directory - return chains
    if (path === '/snapshots/' || path === '/snapshots') {
      return mockChains.map(chain => ({
        name: chain + '/',
        type: 'directory',
        mtime: 'Wed, 30 Jul 2025 12:00:00 GMT', // Use nginx format
        size: 0
      }));
    }

    // Chain directory - return snapshots
    const chainMatch = path.match(/\/snapshots\/([^\/]+)\/?$/);
    if (chainMatch) {
      const chainId = chainMatch[1];
      const snapshots = mockSnapshots[chainId as keyof typeof mockSnapshots] || [];
      return snapshots;
    }
    return [];
  }

  async getFileInfo(filePath: string): Promise<any | null> {
    // Parse chain and filename from path
    const match = filePath.match(/\/snapshots\/([^\/]+)\/(.+)$/);
    if (!match) return null;

    const [, chainId, filename] = match;
    const snapshots = mockSnapshots[chainId as keyof typeof mockSnapshots] || [];
    const snapshot = snapshots.find(s => s.name === filename);

    if (snapshot) {
      return {
        name: snapshot.name,
        size: snapshot.size,
        mtime: snapshot.mtime,
        type: 'file'
      };
    }

    return null;
  }

  async objectExists(path: string): Promise<boolean> {
    
    let result = false;
    
    // Handle chain directories
    if (path.endsWith('/')) {
      const chainId = path.replace(/^\/+|\/+$/g, '');
      result = mockChains.includes(chainId);
    }
    // Handle latest.json files
    else if (path.endsWith('/latest.json')) {
      const chainId = path.replace(/^\/+|\/latest\.json$/g, '');
      result = mockChains.includes(chainId);
    }
    // Handle snapshot files
    else {
      const match = path.match(/\/([^\/]+)\/(.+)$/);
      if (match) {
        const [, chainId, filename] = match;
        const snapshots = mockSnapshots[chainId as keyof typeof mockSnapshots] || [];
        result = snapshots.some(s => s.name === filename);
      }
    }
    
    console.log(`[MockNginx] objectExists ${path} -> ${result}`);
    return result;
  }

  async checkConnection(): Promise<boolean> {
    return true;
  }
}

// Initialize nginx client with development fallback
let nginxClient: MockNginxClient | null = null;
let isNginxAvailable = false;

export function getNginxClient(): MockNginxClient {
  if (!nginxClient) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const nginxEndpoint = process.env.NGINX_ENDPOINT || 'nginx';
    const nginxPort = parseInt(process.env.NGINX_PORT || '32708');
    const useSSL = process.env.NGINX_USE_SSL === 'true';
    
    const baseUrl = `${useSSL ? 'https' : 'http'}://${nginxEndpoint}:${nginxPort}`;

    if (isDevelopment) {
      // Always use mock in development for now
      nginxClient = new MockNginxClient(baseUrl);
    } else {
      // Production - still use mock until we have proper nginx client wrapper
      nginxClient = new MockNginxClient(baseUrl);
    }
  }
  
  return nginxClient!;
}

// Alternative function that tries real nginx first, then falls back to mock
export async function tryNginxOrMock(operation: () => Promise<any>): Promise<any> {
  try {
    return await operation();
  } catch (error) {
    console.log('[Nginx] Real nginx failed, using mock data');
    // Return mock data or re-throw if this is critical
    throw error;
  }
}

export { MockNginxClient };
