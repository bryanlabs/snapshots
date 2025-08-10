/**
 * Bootstrap configuration for nginx service initialization
 * Call this once at application startup (e.g., in layout.tsx or middleware)
 */

import { initializeServiceRegistry, createDefaultConfig } from './service-registry';

/**
 * Initialize nginx services with environment-based configuration
 * This replaces the old environment branching approach
 */
export function initializeNginxServices(): void {
  // Import here to avoid circular dependencies
  const { isServiceRegistryInitialized } = require('./service-registry');
  
  // Check if already initialized
  if (isServiceRegistryInitialized()) {
    return;
  }

  const config = createDefaultConfig();
  
  // Allow environment overrides for testing/debugging
  if (process.env.NGINX_SERVICE_TYPE) {
    config.serviceType = process.env.NGINX_SERVICE_TYPE as any;
  }
  
  console.log(`[Bootstrap] Initializing nginx services with type: ${config.serviceType}`);
  
  initializeServiceRegistry(config);
}

/**
 * Environment-specific initialization helpers
 */
export const nginxServiceBootstrap = {
  /**
   * Force production service (useful for testing production behavior)
   */
  forceProduction(): void {
    process.env.NGINX_SERVICE_TYPE = 'production';
    delete process.env.__NGINX_SERVICES_INITIALIZED;
    initializeNginxServices();
  },
  
  /**
   * Force mock service (useful for development/testing)
   */
  forceMock(): void {
    process.env.NGINX_SERVICE_TYPE = 'mock';
    delete process.env.__NGINX_SERVICES_INITIALIZED;
    initializeNginxServices();
  },
  
  /**
   * Use auto-detection (default behavior)
   */
  useAuto(): void {
    process.env.NGINX_SERVICE_TYPE = 'auto';
    delete process.env.__NGINX_SERVICES_INITIALIZED;
    initializeNginxServices();
  },
  
  /**
   * Reset initialization (useful for testing)
   */
  reset(): void {
    delete process.env.__NGINX_SERVICES_INITIALIZED;
  }
};
