/**
 * Production Nginx Service Implementation
 * Features mag-7 patterns: circuit breaker, retry logic, metrics, observability
 */

import { createHash } from 'crypto';
import {
  NginxService,
  NginxObject,
  NginxServiceConfig,
  NginxServiceMetrics,
  NginxServiceError,
  NginxTimeoutError,
  NginxCircuitBreakerError
} from './types';

/**
 * Circuit breaker states and logic
 */
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime: Date | null = null;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number,
    private timeout: number
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state = 'half-open';
      } else {
        throw new NginxCircuitBreakerError();
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private shouldAttemptReset(): boolean {
    return this.lastFailureTime && 
           (Date.now() - this.lastFailureTime.getTime()) > this.timeout;
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();
    
    if (this.failureCount >= this.threshold) {
      this.state = 'open';
    }
  }

  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }
}

/**
 * Production nginx service with enterprise-grade reliability patterns
 */
export class ProductionNginxService implements NginxService {
  private circuitBreaker: CircuitBreaker;
  private metrics: NginxServiceMetrics;
  private baseUrl: string;

  constructor(private config: NginxServiceConfig) {
    this.circuitBreaker = new CircuitBreaker(
      config.circuitBreakerThreshold,
      config.circuitBreakerTimeout
    );
    
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      lastRequestTime: new Date(),
      averageResponseTime: 0,
      circuitBreakerState: 'closed'
    };

    const protocol = config.useSSL ? 'https' : 'http';
    this.baseUrl = `${protocol}://${config.endpoint}:${config.port}`;
  }

  async listObjects(path: string): Promise<NginxObject[]> {
    return this.withMetrics(async () => {
      return this.circuitBreaker.execute(async () => {
        return this.retryOperation(async () => {
          const url = `${this.baseUrl}/snapshots/${path.replace(/^\/+/, '')}/`;
          const response = await this.fetchWithTimeout(url, {
            headers: { 'Accept': 'application/json' }
          });

          if (!response.ok) {
            if (response.status === 404) {
              return [];
            }
            throw new NginxServiceError(
              `Failed to list objects: ${response.statusText}`,
              'LIST_OBJECTS_FAILED',
              response.status,
              response.status >= 500
            );
          }

          const data = await response.json();
          return this.normalizeObjects(data);
        });
      });
    });
  }

  async objectExists(path: string): Promise<boolean> {
    return this.withMetrics(async () => {
      return this.circuitBreaker.execute(async () => {
        return this.retryOperation(async () => {
          const url = `${this.baseUrl}/snapshots${path}`;
          const response = await this.fetchWithTimeout(url, { method: 'HEAD' });
          return response.ok;
        });
      });
    });
  }

  async generateSecureLink(
    path: string,
    tier: 'free' | 'premium' | 'unlimited',
    expiryHours: number
  ): Promise<string> {
    const secret = process.env.SECURE_LINK_SECRET;
    if (!secret) {
      throw new NginxServiceError(
        'SECURE_LINK_SECRET environment variable is required',
        'MISSING_SECRET',
        500
      );
    }

    const expiryTime = Math.floor(Date.now() / 1000) + (expiryHours * 3600);
    const uri = `/snapshots${path}`;
    const hashString = `${secret}${uri}${expiryTime}${tier}`;
    const md5 = createHash('md5').update(hashString).digest('base64url');

    const baseUrl = process.env.NGINX_EXTERNAL_URL || 'https://snapshots.bryanlabs.net';
    return `${baseUrl}${uri}?md5=${md5}&expires=${expiryTime}&tier=${tier}`;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/health`, {
        method: 'HEAD'
      }, 2000); // Short timeout for health checks
      return response.ok;
    } catch {
      return false;
    }
  }

  getMetrics(): NginxServiceMetrics {
    return {
      ...this.metrics,
      circuitBreakerState: this.circuitBreaker.getState()
    };
  }

  getServiceName(): string {
    return `ProductionNginxService(${this.config.endpoint}:${this.config.port})`;
  }

  /**
   * Retry operation with exponential backoff
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    attempt: number = 1
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= this.config.retryAttempts || !this.isRetryableError(error)) {
        throw error;
      }

      // Exponential backoff with jitter
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      const jitter = Math.random() * 0.1 * delay;
      
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
      return this.retryOperation(operation, attempt + 1);
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof NginxServiceError) {
      return error.retryable;
    }
    if (error instanceof Error) {
      // Network errors are generally retryable
      return error.name === 'TypeError' || error.message.includes('fetch');
    }
    return false;
  }

  /**
   * Fetch with timeout support
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeoutMs?: number
  ): Promise<Response> {
    const timeout = timeoutMs || this.config.timeout;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new NginxTimeoutError(timeout);
      }
      throw error;
    }
  }

  /**
   * Normalize nginx response objects
   */
  private normalizeObjects(data: any[]): NginxObject[] {
    return data.map(item => ({
      name: item.name,
      size: item.size || 0,
      mtime: item.mtime,
      type: item.type === 'directory' ? 'directory' : 'file'
    }));
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
      
      // Update average response time (simple moving average)
      const responseTime = Date.now() - startTime;
      this.metrics.averageResponseTime = 
        (this.metrics.averageResponseTime * 0.9) + (responseTime * 0.1);
      
      return result;
    } catch (error) {
      this.metrics.errorCount++;
      throw error;
    }
  }
}
