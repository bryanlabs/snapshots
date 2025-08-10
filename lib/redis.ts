import { getRedisClient } from './redis-dev';

// Create Redis client with development fallback
export const redis = getRedisClient();