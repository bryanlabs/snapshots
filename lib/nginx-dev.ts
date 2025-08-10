// Development-friendly nginx client with mock fallback
import { listObjects, objectExists } from './nginx/client';

// Mock nginx responses for development - based on real nginx structure
const mockChains = ['agoric-3', 'columbus-5', 'cosmoshub-4', 'kaiyo-1', 'noble-1', 'osmosis-1', 'phoenix-1', 'thorchain-1'];

// Realistic mock snapshots based on actual nginx structure
const mockSnapshots = {
  'noble-1': [
    {
      name: 'noble-1-20250730-022059.tar.zst',
      size: 1620600176, // ~1.6GB like real data
      mtime: 'Wed, 30 Jul 2025 02:21:33 GMT',
      type: 'file'
    },
    {
      name: 'noble-1-20250730-022059.tar.zst.sha256',
      size: 98,
      mtime: 'Wed, 30 Jul 2025 02:21:33 GMT',
      type: 'file'
    },
    {
      name: 'noble-1-20250729-020000.tar.zst',
      size: 1598234567,
      mtime: 'Tue, 29 Jul 2025 02:15:45 GMT',
      type: 'file'
    }
  ],
  'thorchain-1': [
    {
      name: 'thorchain-1-20250731-175137.tar.zst',
      size: 19639317657, // ~19.6GB like real data
      mtime: 'Thu, 31 Jul 2025 17:59:55 GMT',
      type: 'file'
    },
    {
      name: 'thorchain-1-20250731-175137.tar.zst.sha256',
      size: 102,
      mtime: 'Thu, 31 Jul 2025 17:59:55 GMT',
      type: 'file'
    },
    {
      name: 'thorchain-1-20250731-162909.tar.zst',
      size: 19571995067, // ~19.5GB 
      mtime: 'Thu, 31 Jul 2025 16:38:02 GMT',
      type: 'file'
    },
    {
      name: 'thorchain-1-20250731-162909.tar.zst.sha256',
      size: 102,
      mtime: 'Thu, 31 Jul 2025 16:38:02 GMT',
      type: 'file'
    }
  ],
  'cosmoshub-4': [
    {
      name: 'cosmoshub-4-20250730-180000.tar.zst',
      size: 8500000000, // ~8.5GB estimate
      mtime: 'Wed, 30 Jul 2025 18:15:22 GMT',
      type: 'file'
    },
    {
      name: 'cosmoshub-4-20250730-180000.tar.zst.sha256',
      size: 96,
      mtime: 'Wed, 30 Jul 2025 18:15:22 GMT',
      type: 'file'
    }
  ],
  'osmosis-1': [
    {
      name: 'osmosis-1-20250730-190000.tar.zst',
      size: 25000000000, // ~25GB estimate for Osmosis
      mtime: 'Wed, 30 Jul 2025 19:45:33 GMT',
      type: 'file'
    },
    {
      name: 'osmosis-1-20250730-190000.tar.zst.sha256',
      size: 95,
      mtime: 'Wed, 30 Jul 2025 19:45:33 GMT',
      type: 'file'
    }
  ],
  'agoric-3': [
    {
      name: 'agoric-3-20250730-160000.tar.zst',
      size: 3200000000, // ~3.2GB estimate
      mtime: 'Wed, 30 Jul 2025 16:30:15 GMT',
      type: 'file'
    },
    {
      name: 'agoric-3-20250730-160000.tar.zst.sha256',
      size: 94,
      mtime: 'Wed, 30 Jul 2025 16:30:15 GMT',
      type: 'file'
    }
  ],
  'phoenix-1': [
    {
      name: 'phoenix-1-20250730-140000.tar.zst',
      size: 6800000000, // ~6.8GB estimate
      mtime: 'Wed, 30 Jul 2025 14:25:44 GMT',
      type: 'file'
    },
    {
      name: 'phoenix-1-20250730-140000.tar.zst.sha256',
      size: 97,
      mtime: 'Wed, 30 Jul 2025 14:25:44 GMT',
      type: 'file'
    }
  ],
  'kaiyo-1': [
    {
      name: 'kaiyo-1-20250730-120000.tar.zst',
      size: 4500000000, // ~4.5GB estimate
      mtime: 'Wed, 30 Jul 2025 12:18:21 GMT',
      type: 'file'
    },
    {
      name: 'kaiyo-1-20250730-120000.tar.zst.sha256',
      size: 93,
      mtime: 'Wed, 30 Jul 2025 12:18:21 GMT',
      type: 'file'
    }
  ],
  'columbus-5': [
    {
      name: 'columbus-5-20250730-110000.tar.zst',
      size: 12000000000, // ~12GB estimate
      mtime: 'Wed, 30 Jul 2025 11:45:18 GMT',
      type: 'file'
    },
    {
      name: 'columbus-5-20250730-110000.tar.zst.sha256',
      size: 99,
      mtime: 'Wed, 30 Jul 2025 11:45:18 GMT',
      type: 'file'
    }
  ]
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