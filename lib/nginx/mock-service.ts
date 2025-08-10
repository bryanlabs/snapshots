/**
 * Mock Nginx Service Implementation
 * Provides realistic blockchain snapshot data for development/testing
 * Based on actual production nginx structure and file sizes
 */

import { createHash } from 'crypto';
import {
  NginxService,
  NginxObject,
  NginxServiceMetrics
} from './types';

/**
 * Realistic mock data based on actual blockchain snapshot patterns
 * File sizes and timestamps reflect real-world scenarios
 */
const MOCK_CHAINS = [
  'agoric-3',
  'columbus-5', 
  'cosmoshub-4',
  'kaiyo-1',
  'noble-1',
  'osmosis-1', 
  'phoenix-1',
  'thorchain-1'
];

/**
 * Generate realistic snapshots for each chain
 * Simulates different chain sizes and update patterns
 */
function generateMockSnapshots(chainId: string): NginxObject[] {
  const now = new Date();
  const snapshots: NginxObject[] = [];
  
  // Chain-specific configurations (based on real data)
  const chainConfigs = {
    'noble-1': { baseSize: 1_600_000_000, variance: 0.1, frequency: 24 }, // ~1.6GB, daily
    'thorchain-1': { baseSize: 19_600_000_000, variance: 0.15, frequency: 12 }, // ~19.6GB, twice daily
    'cosmoshub-4': { baseSize: 8_500_000_000, variance: 0.2, frequency: 24 }, // ~8.5GB, daily
    'osmosis-1': { baseSize: 25_000_000_000, variance: 0.12, frequency: 12 }, // ~25GB, twice daily
    'agoric-3': { baseSize: 3_200_000_000, variance: 0.08, frequency: 24 }, // ~3.2GB, daily
    'phoenix-1': { baseSize: 6_800_000_000, variance: 0.18, frequency: 24 }, // ~6.8GB, daily
    'kaiyo-1': { baseSize: 4_500_000_000, variance: 0.15, frequency: 24 }, // ~4.5GB, daily
    'columbus-5': { baseSize: 12_000_000_000, variance: 0.25, frequency: 24 }, // ~12GB, daily
  };

  const config = chainConfigs[chainId as keyof typeof chainConfigs] || 
    { baseSize: 5_000_000_000, variance: 0.2, frequency: 24 };

  // Generate last 7 days of snapshots
  for (let i = 0; i < 7; i++) {
    const snapshotDate = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
    
    // Some chains have multiple snapshots per day
    const snapshotsPerDay = 24 / config.frequency;
    for (let j = 0; j < snapshotsPerDay; j++) {
      const snapshotTime = new Date(snapshotDate.getTime() - (j * config.frequency * 60 * 60 * 1000));
      
      // Add some randomness to sizes (growth/shrinkage)
      const sizeVariation = 1 + (Math.random() - 0.5) * config.variance;
      const size = Math.floor(config.baseSize * sizeVariation);
      
      const timestamp = snapshotTime.toISOString().replace(/[:-]/g, '').replace(/\.[0-9]{3}Z/, '');
      const filename = `${chainId}-${timestamp.substring(0, 8)}-${timestamp.substring(9, 15)}.tar.zst`;
      
      snapshots.push({
        name: filename,
        size,
        mtime: snapshotTime.toUTCString(),
        type: 'file'
      });
      
      // Add corresponding SHA256 file
      snapshots.push({
        name: `${filename}.sha256`,
        size: 96 + Math.floor(Math.random() * 10), // SHA256 files are ~100 bytes
        mtime: snapshotTime.toUTCString(),
        type: 'file'
      });
    }
  }
  
  // Sort by modification time (newest first)
  snapshots.sort((a, b) => new Date(b.mtime).getTime() - new Date(a.mtime).getTime());
  
  return snapshots;
}

/**
 * Mock service with realistic latency simulation
 */
export class MockNginxService implements NginxService {
  private metrics: NginxServiceMetrics;
  private mockSnapshots: Map<string, NginxObject[]> = new Map();
  
  constructor(private simulateLatency = true) {
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      lastRequestTime: new Date(),
      averageResponseTime: 45, // Simulate ~45ms average response
      circuitBreakerState: 'closed'
    };
    
    // Pre-generate snapshots for all chains
    MOCK_CHAINS.forEach(chainId => {
      this.mockSnapshots.set(chainId, generateMockSnapshots(chainId));
    });
  }

  async listObjects(path: string): Promise<NginxObject[]> {
    return this.withMetrics(async () => {
      await this.simulateNetworkLatency();
      
      // Normalize path
      const cleanPath = path.replace(/^\/+|\/$/, '');
      
      // Root directory - return chains
      if (!cleanPath) {
        return MOCK_CHAINS.map(chainId => ({
          name: `${chainId}/`,
          type: 'directory' as const,
          size: 0,
          mtime: new Date().toUTCString()
        }));
      }
      
      // Chain directory - return snapshots
      const snapshots = this.mockSnapshots.get(cleanPath);
      if (snapshots) {
        return [...snapshots]; // Return copy to prevent mutation
      }
      
      // Path not found
      return [];
    });
  }

  async objectExists(path: string): Promise<boolean> {
    return this.withMetrics(async () => {
      await this.simulateNetworkLatency(20); // Faster for HEAD requests
      
      const cleanPath = path.replace(/^\/+/, '');
      
      // Check if it's a chain directory
      if (cleanPath.endsWith('/')) {
        const chainId = cleanPath.replace(/\/$/, '');
        return MOCK_CHAINS.includes(chainId);
      }
      
      // Check for latest.json files
      if (cleanPath.endsWith('/latest.json')) {
        const chainId = cleanPath.replace(/\/latest\.json$/, '');
        return MOCK_CHAINS.includes(chainId);
      }
      
      // Check for specific snapshot files
      const match = cleanPath.match(/^([^\/]+)\/(.+)$/);
      if (match) {
        const [, chainId, filename] = match;
        const snapshots = this.mockSnapshots.get(chainId);
        return snapshots?.some(s => s.name === filename) || false;
      }
      
      return false;
    });
  }

  async generateSecureLink(
    path: string,
    tier: 'free' | 'premium' | 'unlimited',
    expiryHours: number
  ): Promise<string> {
    // Simulate the same secure link generation as production
    const secret = process.env.SECURE_LINK_SECRET || 'mock-secret-key';
    const expiryTime = Math.floor(Date.now() / 1000) + (expiryHours * 3600);
    
    const uri = `/snapshots${path}`;
    const hashString = `${secret}${uri}${expiryTime}${tier}`;
    const md5 = createHash('md5').update(hashString).digest('base64url');
    
    const baseUrl = process.env.NGINX_EXTERNAL_URL || 'https://snapshots.bryanlabs.net';
    return `${baseUrl}${uri}?md5=${md5}&expires=${expiryTime}&tier=${tier}`;
  }

  async healthCheck(): Promise<boolean> {
    await this.simulateNetworkLatency(10); // Fast health check
    return true; // Mock service is always healthy
  }

  getMetrics(): NginxServiceMetrics {
    return { ...this.metrics };
  }

  getServiceName(): string {
    return 'MockNginxService';
  }

  /**
   * Get mock snapshot for a specific chain (useful for testing)
   */
  getMockSnapshots(chainId: string): NginxObject[] {
    return this.mockSnapshots.get(chainId) || [];
  }

  /**
   * Add custom mock data (useful for testing edge cases)
   */
  addMockChain(chainId: string, snapshots: NginxObject[]): void {
    this.mockSnapshots.set(chainId, snapshots);
    if (!MOCK_CHAINS.includes(chainId)) {
      MOCK_CHAINS.push(chainId);
    }
  }

  /**
   * Simulate network latency for realistic testing
   */
  private async simulateNetworkLatency(baseMs = 50): Promise<void> {
    if (!this.simulateLatency) return;
    
    // Add some jitter to make it realistic
    const jitter = Math.random() * 20; // ±10ms
    const delay = baseMs + jitter;
    
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Wrap operations with metrics collection
   */
  private async withMetrics<T>(operation: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    this.metrics.requestCount++;
    this.metrics.lastRequestTime = new Date();

    try {
      const result = await operation();
      
      // Update average response time
      const responseTime = Date.now() - startTime;
      this.metrics.averageResponseTime = 
        (this.metrics.averageResponseTime * 0.9) + (responseTime * 0.1);
      
      return result;
    } catch (error) {
      this.metrics.errorCount++;
      throw error;
    }
  }

  /**
   * Simulate failure scenarios for testing
   */
  simulateFailure(errorRate = 0.1): void {
    if (Math.random() < errorRate) {
      throw new Error('Simulated nginx failure for testing');
    }
  }
}
