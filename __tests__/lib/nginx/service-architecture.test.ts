/**
 * Comprehensive test suite for nginx service architecture
 * Demonstrates mag-7 patterns: dependency injection, circuit breaker, mocking
 */

import {
  initializeServiceRegistry,
  getNginxService,
  resetServiceRegistry,
  createDefaultConfig
} from '../../../lib/nginx/service-registry';
import { MockNginxService } from '../../../lib/nginx/mock-service';
import { ProductionNginxService } from '../../../lib/nginx/production-service';
import { initializeNginxServices, nginxServiceBootstrap } from '../../../lib/nginx/bootstrap';
import { listChains, listSnapshots, generateDownloadUrl } from '../../../lib/nginx/operations';

describe('Nginx Service Architecture', () => {
  beforeEach(() => {
    resetServiceRegistry();
    nginxServiceBootstrap.reset();
  });

  afterEach(() => {
    resetServiceRegistry();
  });

  describe('Service Registry', () => {
    it('should create mock service in test environment', async () => {
      const config = createDefaultConfig();
      initializeServiceRegistry(config);
      
      const service = await getNginxService();
      expect(service).toBeInstanceOf(MockNginxService);
      expect(service.getServiceName()).toBe('MockNginxService');
    });

    it('should respect forced service type', async () => {
      const config = createDefaultConfig();
      config.serviceType = 'mock';
      initializeServiceRegistry(config);
      
      const service = await getNginxService();
      expect(service).toBeInstanceOf(MockNginxService);
    });

    it('should cache service instance', async () => {
      const config = createDefaultConfig();
      initializeServiceRegistry(config);
      
      const service1 = await getNginxService();
      const service2 = await getNginxService();
      
      expect(service1).toBe(service2);
    });

    it('should throw error if not initialized', async () => {
      await expect(getNginxService()).rejects.toThrow(
        'Service registry not initialized'
      );
    });
  });

  describe('Mock Service', () => {
    let mockService: MockNginxService;

    beforeEach(() => {
      mockService = new MockNginxService(false); // Disable latency for tests
    });

    it('should list blockchain chains', async () => {
      const chains = await mockService.listObjects('');
      
      expect(chains).toHaveLength(8);
      expect(chains[0]).toMatchObject({
        name: expect.stringMatching(/^\w+-\d+\/$/),
        type: 'directory',
        size: 0
      });
    });

    it('should list snapshots for a chain', async () => {
      const snapshots = await mockService.listObjects('cosmoshub-4');
      
      expect(snapshots.length).toBeGreaterThan(0);
      expect(snapshots[0]).toMatchObject({
        name: expect.stringMatching(/cosmoshub-4-\d{8}-\d{6}\.tar\.zst$/),
        type: 'file',
        size: expect.any(Number)
      });
    });

    it('should check object existence', async () => {
      expect(await mockService.objectExists('/cosmoshub-4/')).toBe(true);
      expect(await mockService.objectExists('/nonexistent-chain/')).toBe(false);
      expect(await mockService.objectExists('/cosmoshub-4/latest.json')).toBe(true);
    });

    it('should generate secure links', async () => {
      const url = await mockService.generateSecureLink(
        '/cosmoshub-4/test.tar.zst',
        'premium',
        24
      );
      
      expect(url).toMatch(/https:\/\/[^\s]+\?md5=[^&]+&expires=\d+&tier=premium/);
    });

    it('should track metrics', async () => {
      await mockService.listObjects('');
      await mockService.objectExists('/test');
      
      const metrics = mockService.getMetrics();
      expect(metrics.requestCount).toBe(2);
      expect(metrics.errorCount).toBe(0);
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
    });

    it('should provide realistic snapshot data', async () => {
      const snapshots = mockService.getMockSnapshots('thorchain-1');
      
      // Should have recent snapshots
      expect(snapshots.length).toBeGreaterThan(10);
      
      // Should have realistic sizes (thorchain is ~19GB)
      const mainSnapshot = snapshots.find(s => s.name.endsWith('.tar.zst'));
      expect(mainSnapshot?.size).toBeGreaterThan(15_000_000_000); // > 15GB
      expect(mainSnapshot?.size).toBeLessThan(25_000_000_000); // < 25GB
    });
  });

  describe('Production Service', () => {
    let productionService: ProductionNginxService;

    beforeEach(() => {
      const config = {
        endpoint: 'nginx',
        port: 32708,
        useSSL: false,
        timeout: 5000,
        retryAttempts: 3,
        circuitBreakerThreshold: 5,
        circuitBreakerTimeout: 30000
      };
      productionService = new ProductionNginxService(config);
    });

    it('should have correct service name', () => {
      expect(productionService.getServiceName()).toBe(
        'ProductionNginxService(nginx:32708)'
      );
    });

    it('should generate secure links', async () => {
      process.env.SECURE_LINK_SECRET = 'test-secret';
      
      const url = await productionService.generateSecureLink(
        '/cosmoshub-4/test.tar.zst',
        'free',
        12
      );
      
      expect(url).toMatch(/https:\/\/[^\s]+\?md5=[^&]+&expires=\d+&tier=free/);
    });

    it('should track metrics', () => {
      const metrics = productionService.getMetrics();
      expect(metrics).toMatchObject({
        requestCount: 0,
        errorCount: 0,
        averageResponseTime: 0,
        circuitBreakerState: 'closed'
      });
    });
  });

  describe('Bootstrap Integration', () => {
    it('should initialize services automatically', () => {
      initializeNginxServices();
      
      // Should not throw when getting service
      expect(async () => await getNginxService()).not.toThrow();
    });

    it('should prevent double initialization', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      initializeNginxServices();
      initializeNginxServices(); // Second call should be ignored
      
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      consoleSpy.mockRestore();
    });

    it('should support forced service types', async () => {
      nginxServiceBootstrap.forceMock();
      const service = await getNginxService();
      expect(service.getServiceName()).toBe('MockNginxService');
    });
  });

  describe('Operations Integration', () => {
    beforeEach(() => {
      initializeNginxServices();
    });

    it('should list chains using dependency injection', async () => {
      const chains = await listChains();
      
      expect(chains.length).toBeGreaterThan(0);
      expect(chains[0]).toMatchObject({
        chainId: expect.any(String),
        snapshotCount: expect.any(Number),
        totalSize: expect.any(Number)
      });
    });

    it('should list snapshots for a chain', async () => {
      const snapshots = await listSnapshots('cosmoshub-4');
      
      expect(snapshots.length).toBeGreaterThan(0);
      expect(snapshots[0]).toMatchObject({
        filename: expect.stringMatching(/\.tar\.(zst|lz4)$/),
        size: expect.any(Number),
        lastModified: expect.any(Date)
      });
    });

    it('should generate download URLs', async () => {
      const url = await generateDownloadUrl(
        'cosmoshub-4',
        'test-snapshot.tar.zst',
        'premium'
      );
      
      expect(url).toMatch(/\?md5=[^&]+&expires=\d+&tier=premium/);
    });
  });

  describe('Error Handling', () => {
    it('should handle service initialization errors gracefully', async () => {
      const invalidConfig = createDefaultConfig();
      invalidConfig.serviceType = 'invalid' as any;
      initializeServiceRegistry(invalidConfig);
      
      await expect(getNginxService()).rejects.toThrow(
        'Unknown service type: invalid'
      );
    });

    it('should handle missing secure link secret', async () => {
      delete process.env.SECURE_LINK_SECRET;
      
      const config = {
        endpoint: 'nginx',
        port: 32708,
        useSSL: false,
        timeout: 5000,
        retryAttempts: 3,
        circuitBreakerThreshold: 5,
        circuitBreakerTimeout: 30000
      };
      const service = new ProductionNginxService(config);
      
      await expect(service.generateSecureLink('/test', 'free', 12))
        .rejects.toThrow('SECURE_LINK_SECRET environment variable is required');
    });
  });
});
