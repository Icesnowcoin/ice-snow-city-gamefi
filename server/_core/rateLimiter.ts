/**
 * Rate Limiter Module
 * 
 * Implements multi-level rate limiting:
 * - Global rate limit: 1000 requests/second
 * - IP-based rate limit: 100 requests/minute
 * - User-based rate limit: 50 requests/minute
 * 
 * Uses Redis for distributed rate limiting across multiple instances.
 */

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import type { Store } from 'express-rate-limit';
import { createClient } from 'redis';
import type { Request, Response } from 'express';

// Redis client for rate limiting
let redisClient: ReturnType<typeof createClient> | null = null;

/**
 * Initialize Redis client for rate limiting
 */
async function initializeRedisClient() {
  if (redisClient) {
    return redisClient;
  }

  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = createClient({ url: redisUrl });
    
    redisClient.on('error', (err) => {
      console.error('[RateLimiter] Redis error:', err);
    });

    await redisClient.connect();
    console.log('[RateLimiter] Redis client connected');
    return redisClient;
  } catch (error) {
    console.warn('[RateLimiter] Failed to connect to Redis, using memory store:', error);
    return null;
  }
}

/**
 * Global rate limiter (1000 requests/second)
 */
export function createGlobalRateLimiter() {
  return rateLimit({
    windowMs: 1 * 1000, // 1 second
    max: 1000, // 1000 requests per second
    message: 'Too many requests from this server, please try again later.',
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    skip: (req: Request) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/api/health';
    },
  });
}

/**
 * IP-based rate limiter (100 requests/minute)
 */
export async function createIpRateLimiter() {
  const client = await initializeRedisClient();

  const store = client
    ? new RedisStore({
        client: client as any,
        prefix: 'rate-limit:ip:',
        expiry: 60, // 60 seconds
      } as any)
    : undefined;

  return rateLimit({
    store: store as unknown as Store,
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute per IP
    message: 'Too many requests from this IP, please try again after an hour.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      // Use X-Forwarded-For for proxy environments
      return (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || 'unknown';
    },
    skip: (req: Request) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/api/health';
    },
  });
}

/**
 * User-based rate limiter (50 requests/minute)
 */
export async function createUserRateLimiter() {
  const client = await initializeRedisClient();

  const store = client
    ? new RedisStore({
        client: client as any,
        prefix: 'rate-limit:user:',
        expiry: 60, // 60 seconds
      } as any)
    : undefined;

  return rateLimit({
    store: store as unknown as Store,
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 50, // 50 requests per minute per user
    message: 'Too many requests from this user, please try again after a minute.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      // Use user ID if authenticated, otherwise use IP
      const userId = (req as any).user?.id;
      if (userId) {
        return `user:${userId}`;
      }
      return (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || 'unknown';
    },
    skip: (req: Request) => {
      // Skip rate limiting for health checks and public endpoints
      return req.path === '/health' || req.path === '/api/health' || req.path === '/api/oauth/callback';
    },
  });
}

/**
 * API endpoint rate limiter (stricter for sensitive endpoints)
 */
export async function createApiRateLimiter() {
  const client = await initializeRedisClient();

  const store = client
    ? new RedisStore({
        client: client as any,
        prefix: 'rate-limit:api:',
        expiry: 60, // 60 seconds
      } as any)
    : undefined;

  return rateLimit({
    store: store as unknown as Store,
    windowMs: 1 * 60 * 1000, // 1 minute
    max: (req: Request) => {
      // Stricter limits for sensitive endpoints
      const path = req.path;
      if (path.includes('/secret') || path.includes('/agent') || path.includes('/admin')) {
        return 20; // 20 requests per minute for sensitive endpoints
      }
      return 100; // 100 requests per minute for other endpoints
    },
    message: 'Too many API requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      const userId = (req as any).user?.id;
      if (userId) {
        return `api:${userId}`;
      }
      return `api:${(req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || 'unknown'}`;
    },
  });
}

/**
 * Cleanup Redis connection
 */
export async function closeRedisClient() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('[RateLimiter] Redis client closed');
  }
}

/**
 * Get Redis client
 */
export function getRedisClient() {
  return redisClient;
}
