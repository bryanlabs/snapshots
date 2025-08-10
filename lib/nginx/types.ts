/**
 * Core nginx service types and interfaces
 * Following mag-7 patterns for service abstraction
 */

export interface NginxObject {
  name: string;
  size: number;
  mtime: string;
  type: 'file' | 'directory';
}

export interface NginxServiceMetrics {
  requestCount: number;
  errorCount: number;
  lastRequestTime: Date;
  averageResponseTime: number;
  circuitBreakerState: 'closed' | 'open' | 'half-open';
}

export interface NginxServiceConfig {
  endpoint: string;
  port: number;
  useSSL: boolean;
  timeout: number;
  retryAttempts: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
}

/**
 * Core service interface - all nginx implementations must implement this
 * Follows mag-7 interface segregation principle
 */
export interface NginxService {
  /**
   * List objects at the given path
   * @param path - Path relative to snapshots root (e.g., '', 'cosmoshub-4/')
   */
  listObjects(path: string): Promise<NginxObject[]>;
  
  /**
   * Check if an object exists at the given path
   * @param path - Full path to object (e.g., '/cosmoshub-4/latest.json')
   */
  objectExists(path: string): Promise<boolean>;
  
  /**
   * Generate a secure download URL
   * @param path - Path to file
   * @param tier - User tier for access control
   * @param expiryHours - URL expiry time
   */
  generateSecureLink(path: string, tier: 'free' | 'premium' | 'unlimited', expiryHours: number): Promise<string>;
  
  /**
   * Health check - verify service is available
   */
  healthCheck(): Promise<boolean>;
  
  /**
   * Get service metrics for monitoring
   */
  getMetrics(): NginxServiceMetrics;
  
  /**
   * Get service name for logging/debugging
   */
  getServiceName(): string;
}

/**
 * Factory interface for creating nginx services
 */
export interface NginxServiceFactory {
  create(config: NginxServiceConfig): NginxService;
}

/**
 * Error types for proper error handling
 */
export class NginxServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'NginxServiceError';
  }
}

export class NginxTimeoutError extends NginxServiceError {
  constructor(timeout: number) {
    super(`Nginx request timed out after ${timeout}ms`, 'TIMEOUT', 408, true);
  }
}

export class NginxCircuitBreakerError extends NginxServiceError {
  constructor() {
    super('Circuit breaker is open - nginx service unavailable', 'CIRCUIT_BREAKER', 503, false);
  }
}
