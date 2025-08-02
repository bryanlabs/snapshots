/**
 * Nginx Service Module - Main Export
 * Provides a clean, dependency-injection based API for nginx operations
 * 
 * Usage:
 *   1. Call initializeNginxServices() once at app startup
 *   2. Use operations functions (listChains, listSnapshots, etc.)
 *   3. Service implementation is automatically selected based on environment
 */

// Core exports
export * from './types';
export * from './operations';
export * from './bootstrap';
export { getNginxService, getServiceMetrics } from './service-registry';

// Service implementations (for advanced usage)
export { ProductionNginxService } from './production-service';
export { MockNginxService } from './mock-service';

// Backwards compatibility with existing code
export { generateSecureLink, listObjects, objectExists } from './client';
