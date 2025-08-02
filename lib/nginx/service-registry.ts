/**
 * Service Registry for Dependency Injection
 * Follows mag-7 patterns used at Google/Meta for service management
 */

import { NginxService, NginxServiceConfig } from './types';
import { ProductionNginxService } from './production-service';
import { MockNginxService } from './mock-service';

type ServiceType = 'production' | 'mock' | 'auto';

interface RegistryConfig {
  serviceType: ServiceType;
  nginxConfig: NginxServiceConfig;
  enableFallback: boolean;
  fallbackTimeout: number;
}

/**
 * Centralized service registry - single point of configuration
 * Handles service creation, lifecycle, and fallback logic
 */
class ServiceRegistry {
  private nginxService: NginxService | null = null;
  private config: RegistryConfig;
  private logger = console; // In production, use structured logger

  constructor(config: RegistryConfig) {
    this.config = config;
  }

  /**
   * Get nginx service instance - lazy loaded and cached
   */
  async getNginxService(): Promise<NginxService> {
    if (!this.nginxService) {
      this.nginxService = await this.createNginxService();
    }
    return this.nginxService;
  }

  /**
   * Create appropriate nginx service based on configuration
   */
  private async createNginxService(): Promise<NginxService> {
    const { serviceType, nginxConfig, enableFallback, fallbackTimeout } = this.config;

    switch (serviceType) {
      case 'production':
        return this.createProductionService(nginxConfig, enableFallback, fallbackTimeout);
      
      case 'mock':
        this.logger.info('[ServiceRegistry] Using mock nginx service');
        return new MockNginxService();
      
      case 'auto':
        return this.createAutoService(nginxConfig, fallbackTimeout);
      
      default:
        throw new Error(`Unknown service type: ${serviceType}`);
    }
  }

  /**
   * Create production service with optional fallback
   */
  private async createProductionService(
    config: NginxServiceConfig, 
    enableFallback: boolean, 
    fallbackTimeout: number
  ): Promise<NginxService> {
    const productionService = new ProductionNginxService(config);
    
    if (!enableFallback) {
      this.logger.info('[ServiceRegistry] Using production nginx service (no fallback)');
      return productionService;
    }

    // Test production service availability
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), fallbackTimeout);
      
      const isHealthy = await productionService.healthCheck();
      clearTimeout(timeoutId);
      
      if (isHealthy) {
        this.logger.info('[ServiceRegistry] Production nginx service is healthy');
        return productionService;
      }
    } catch (error) {
      this.logger.warn('[ServiceRegistry] Production nginx service failed health check', error);
    }

    // Fallback to mock service
    this.logger.info('[ServiceRegistry] Falling back to mock nginx service');
    return new MockNginxService();
  }

  /**
   * Auto-detect best service based on environment and availability
   */
  private async createAutoService(
    config: NginxServiceConfig, 
    fallbackTimeout: number
  ): Promise<NginxService> {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isTest = process.env.NODE_ENV === 'test';
    
    // Always use mock in test environment
    if (isTest) {
      this.logger.info('[ServiceRegistry] Test environment - using mock service');
      return new MockNginxService();
    }

    // In development, prefer mock but allow override
    if (isDevelopment && !process.env.FORCE_REAL_NGINX) {
      this.logger.info('[ServiceRegistry] Development environment - using mock service');
      return new MockNginxService();
    }

    // Production or forced real nginx - try production with fallback
    return this.createProductionService(config, true, fallbackTimeout);
  }

  /**
   * Reset service instance - useful for testing or config changes
   */
  reset(): void {
    this.nginxService = null;
  }

  /**
   * Get current service metrics if available
   */
  getMetrics() {
    return this.nginxService?.getMetrics() || null;
  }
}

// Global registry instance - configured at app startup
let globalRegistry: ServiceRegistry | null = null;

/**
 * Initialize the global service registry
 * Call this once at application startup
 */
export function initializeServiceRegistry(config: RegistryConfig): void {
  globalRegistry = new ServiceRegistry(config);
}

/**
 * Check if service registry is initialized
 */
export function isServiceRegistryInitialized(): boolean {
  return globalRegistry !== null;
}

/**
 * Get the global nginx service instance
 * Throws error if registry not initialized
 */
export async function getNginxService(): Promise<NginxService> {
  if (!globalRegistry) {
    throw new Error('Service registry not initialized. Call initializeServiceRegistry() first.');
  }
  return globalRegistry.getNginxService();
}

/**
 * Get service metrics from global registry
 */
export function getServiceMetrics() {
  return globalRegistry?.getMetrics() || null;
}

/**
 * Reset global registry - mainly for testing
 */
export function resetServiceRegistry(): void {
  globalRegistry?.reset();
  globalRegistry = null;
}

/**
 * Create default configuration based on environment
 */
export function createDefaultConfig(): RegistryConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isTest = process.env.NODE_ENV === 'test';
  
  return {
    serviceType: isTest ? 'mock' : isDevelopment ? 'auto' : 'production',
    nginxConfig: {
      endpoint: process.env.NGINX_ENDPOINT || 'nginx',
      port: parseInt(process.env.NGINX_PORT || '32708'),
      useSSL: process.env.NGINX_USE_SSL === 'true',
      timeout: parseInt(process.env.NGINX_TIMEOUT || '5000'),
      retryAttempts: parseInt(process.env.NGINX_RETRY_ATTEMPTS || '3'),
      circuitBreakerThreshold: parseInt(process.env.NGINX_CB_THRESHOLD || '5'),
      circuitBreakerTimeout: parseInt(process.env.NGINX_CB_TIMEOUT || '30000'),
    },
    enableFallback: process.env.NGINX_ENABLE_FALLBACK !== 'false',
    fallbackTimeout: parseInt(process.env.NGINX_FALLBACK_TIMEOUT || '2000'),
  };
}

export type { RegistryConfig, ServiceType };
