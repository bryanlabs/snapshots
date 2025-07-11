import winston from 'winston';
import { NextRequest } from 'next/server';

// Create Winston logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'snapshot-service' },
  transports: [
    // Console transport with colorized output for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    })
  );
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
    })
  );
}

// Request logging interface
interface RequestLog {
  method: string;
  path: string;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  userId?: string;
  tier?: string;
  ip?: string;
  userAgent?: string;
  referer?: string;
  responseStatus?: number;
  responseTime?: number;
  error?: string;
}

// Log request helper
export function logRequest(log: RequestLog): void {
  const level = log.error ? 'error' : 'info';
  logger[level]('API Request', log);
}

// Log download event
export function logDownload(
  userId: string,
  snapshotId: string,
  tier: string,
  success: boolean,
  error?: string
): void {
  logger.info('Download Event', {
    event: 'download',
    userId,
    snapshotId,
    tier,
    success,
    error,
    timestamp: new Date().toISOString(),
  });
}

// Log authentication event
export function logAuth(
  type: 'login' | 'logout' | 'register',
  username: string,
  success: boolean,
  error?: string
): void {
  const level = success ? 'info' : 'warn';
  logger[level]('Authentication Event', {
    event: 'auth',
    type,
    username,
    success,
    error,
    timestamp: new Date().toISOString(),
  });
}

// Log bandwidth event
export function logBandwidth(
  userId: string,
  tier: string,
  bytesUsed: number,
  limitExceeded: boolean
): void {
  const level = limitExceeded ? 'warn' : 'info';
  logger[level]('Bandwidth Event', {
    event: 'bandwidth',
    userId,
    tier,
    bytesUsed,
    limitExceeded,
    timestamp: new Date().toISOString(),
  });
}

// Log rate limit event
export function logRateLimit(
  clientId: string,
  endpoint: string,
  tier: string
): void {
  logger.warn('Rate Limit Hit', {
    event: 'rate_limit',
    clientId,
    endpoint,
    tier,
    timestamp: new Date().toISOString(),
  });
}

// Extract request metadata
export function extractRequestMetadata(request: NextRequest): Partial<RequestLog> {
  const headers = request.headers;
  const searchParams = request.nextUrl.searchParams;
  
  const query: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    query[key] = value;
  });
  
  return {
    method: request.method,
    path: request.nextUrl.pathname,
    query: Object.keys(query).length > 0 ? query : undefined,
    ip: headers.get('x-forwarded-for') || headers.get('x-real-ip') || undefined,
    userAgent: headers.get('user-agent') || undefined,
    referer: headers.get('referer') || undefined,
  };
}

// Middleware to log requests
export async function withLogging<T extends NextRequest>(
  handler: (request: T) => Promise<Response>
): Promise<(request: T) => Promise<Response>> {
  return async (request: T): Promise<Response> => {
    const startTime = Date.now();
    const requestLog = extractRequestMetadata(request);
    
    try {
      const response = await handler(request);
      const responseTime = Date.now() - startTime;
      
      logRequest({
        ...requestLog,
        responseStatus: response.status,
        responseTime,
      });
      
      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      logRequest({
        ...requestLog,
        responseStatus: 500,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  };
}

export default logger;