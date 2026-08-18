import { describe, it, expect, beforeEach } from 'vitest';
import {
  QueryOptimizer,
  CacheManager,
  RateLimiter,
  InputValidator,
  AuthorizationManager,
  DataEncryption,
  ErrorHandler,
  AuditLogger,
  generateBackendOptimizationReport,
} from './backendOptimization';

describe('Backend Optimization and Security', () => {
  describe('Query Optimizer', () => {
    let optimizer: QueryOptimizer;

    beforeEach(() => {
      optimizer = new QueryOptimizer();
    });

    it('should record query performance', () => {
      optimizer.recordQuery('getUserById', 100);
      optimizer.recordQuery('getUserById', 150);

      const stats = optimizer.getQueryStats();
      expect(stats['getUserById']).toBeDefined();
      expect(stats['getUserById'].count).toBe(2);
      expect(stats['getUserById'].avgTime).toBe(125);
    });

    it('should identify slow queries', () => {
      optimizer.recordQuery('fastQuery', 50);
      optimizer.recordQuery('slowQuery', 2000);

      const slowQueries = optimizer.getSlowQueries(1000);
      expect(slowQueries.length).toBe(1);
      expect(slowQueries[0].name).toBe('slowQuery');
    });

    it('should reset statistics', () => {
      optimizer.recordQuery('query1', 100);
      optimizer.reset();

      const stats = optimizer.getQueryStats();
      expect(Object.keys(stats).length).toBe(0);
    });
  });

  describe('Cache Manager', () => {
    let cache: CacheManager<string, string>;

    beforeEach(() => {
      cache = new CacheManager();
    });

    it('should set and get cache', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return null for expired cache', async () => {
      cache.set('key1', 'value1', 50);
      expect(cache.get('key1')).toBe('value1');

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(cache.get('key1')).toBeNull();
    });

    it('should calculate hit rate', () => {
      cache.set('key1', 'value1');
      cache.get('key1');
      cache.get('key1');
      cache.get('nonexistent');

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(66.67, 1);
    });

    it('should delete cache entries', () => {
      cache.set('key1', 'value1');
      cache.delete('key1');
      expect(cache.get('key1')).toBeNull();
    });

    it('should clear all cache', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();

      const stats = cache.getStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('Rate Limiter', () => {
    let limiter: RateLimiter;

    beforeEach(() => {
      limiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 1000,
      });
    });

    it('should allow requests within limit', () => {
      for (let i = 0; i < 5; i++) {
        expect(limiter.isLimited('user1')).toBe(false);
      }
    });

    it('should block requests exceeding limit', () => {
      for (let i = 0; i < 5; i++) {
        limiter.isLimited('user1');
      }
      expect(limiter.isLimited('user1')).toBe(true);
    });

    it('should track remaining requests', () => {
      limiter.isLimited('user1');
      limiter.isLimited('user1');

      const remaining = limiter.getRemainingRequests('user1');
      expect(remaining).toBe(3);
    });

    it('should reset limits', () => {
      for (let i = 0; i < 5; i++) {
        limiter.isLimited('user1');
      }
      expect(limiter.isLimited('user1')).toBe(true);

      limiter.reset('user1');
      expect(limiter.isLimited('user1')).toBe(false);
    });
  });

  describe('Input Validator', () => {
    it('should validate email', () => {
      expect(InputValidator.validateEmail('test@example.com')).toBe(true);
      expect(InputValidator.validateEmail('invalid-email')).toBe(false);
    });

    it('should validate URL', () => {
      expect(InputValidator.validateUrl('https://example.com')).toBe(true);
      expect(InputValidator.validateUrl('not-a-url')).toBe(false);
    });

    it('should validate integer', () => {
      expect(InputValidator.validateInteger(123)).toBe(true);
      expect(InputValidator.validateInteger(123.45)).toBe(false);
      expect(InputValidator.validateInteger('123')).toBe(false);
    });

    it('should validate float', () => {
      expect(InputValidator.validateFloat(123.45)).toBe(true);
      expect(InputValidator.validateFloat(123)).toBe(true);
      expect(InputValidator.validateFloat('123')).toBe(false);
    });

    it('should sanitize strings (XSS prevention)', () => {
      const malicious = '<script>alert("XSS")</script>';
      const sanitized = InputValidator.sanitizeString(malicious);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('&lt;');
    });

    it('should sanitize objects', () => {
      const malicious = {
        name: '<script>alert("XSS")</script>',
        items: ['<img src=x onerror=alert(1)>'],
      };
      const sanitized = InputValidator.sanitizeObject(malicious);
      expect(sanitized.name).not.toContain('<script>');
      expect(sanitized.items[0]).not.toContain('<img');
    });

    it('should validate password strength', () => {
      const weak = InputValidator.validatePasswordStrength('123');
      expect(weak.isStrong).toBe(false);

      const strong = InputValidator.validatePasswordStrength('SecurePass123!');
      expect(strong.isStrong).toBe(true);
      expect(strong.score).toBeGreaterThan(3);
    });
  });

  describe('Authorization Manager', () => {
    let authManager: AuthorizationManager;

    beforeEach(() => {
      authManager = new AuthorizationManager();
      authManager.defineRolePermissions('user', ['read', 'write']);
      authManager.defineRolePermissions('moderator', ['read', 'write', 'delete']);
    });

    it('should check permissions', () => {
      const userContext = {
        userId: 'user1',
        role: 'user' as const,
        permissions: [],
      };

      expect(authManager.hasPermission(userContext, 'read')).toBe(true);
      expect(authManager.hasPermission(userContext, 'delete')).toBe(false);
    });

    it('should grant admin all permissions', () => {
      const adminContext = {
        userId: 'admin1',
        role: 'admin' as const,
        permissions: [],
      };

      expect(authManager.hasPermission(adminContext, 'read')).toBe(true);
      expect(authManager.hasPermission(adminContext, 'delete')).toBe(true);
      expect(authManager.hasPermission(adminContext, 'any-permission')).toBe(true);
    });

    it('should check multiple permissions (AND)', () => {
      const userContext = {
        userId: 'user1',
        role: 'user' as const,
        permissions: [],
      };

      expect(authManager.hasAllPermissions(userContext, ['read', 'write'])).toBe(true);
      expect(authManager.hasAllPermissions(userContext, ['read', 'delete'])).toBe(false);
    });

    it('should check multiple permissions (OR)', () => {
      const userContext = {
        userId: 'user1',
        role: 'user' as const,
        permissions: [],
      };

      expect(authManager.hasAnyPermission(userContext, ['read', 'delete'])).toBe(true);
      expect(authManager.hasAnyPermission(userContext, ['delete', 'admin'])).toBe(false);
    });
  });

  describe('Data Encryption', () => {
    it('should hash passwords', () => {
      const password = 'mySecurePassword';
      const hash = DataEncryption.hashPassword(password);
      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should verify passwords', () => {
      const password = 'mySecurePassword';
      const hash = DataEncryption.hashPassword(password);
      expect(DataEncryption.verifyPassword(password, hash)).toBe(true);
      expect(DataEncryption.verifyPassword('wrongPassword', hash)).toBe(false);
    });

    it('should mask sensitive information', () => {
      const cardNumber = '1234567890123456';
      const masked = DataEncryption.maskSensitiveInfo(cardNumber, 4);
      expect(masked).toContain('3456');
      expect(masked).toContain('*');
    });
  });

  describe('Error Handler', () => {
    it('should create safe errors', () => {
      const error = new Error('Database connection failed');
      const safeError = ErrorHandler.createSafeError(error, false);

      expect(safeError.code).toBe('INTERNAL_ERROR');
      expect(safeError.statusCode).toBe(500);
      expect(safeError.message).not.toContain('Database');
    });

    it('should create validation errors', () => {
      const error = ErrorHandler.createValidationError('email', 'Invalid format');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
    });

    it('should create auth errors', () => {
      const error = ErrorHandler.createAuthError();
      expect(error.code).toBe('AUTH_ERROR');
      expect(error.statusCode).toBe(401);
    });

    it('should create permission errors', () => {
      const error = ErrorHandler.createPermissionError();
      expect(error.code).toBe('PERMISSION_ERROR');
      expect(error.statusCode).toBe(403);
    });

    it('should create not found errors', () => {
      const error = ErrorHandler.createNotFoundError('User');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('Audit Logger', () => {
    let logger: AuditLogger;

    beforeEach(() => {
      logger = new AuditLogger();
    });

    it('should log operations', () => {
      logger.log({
        userId: 'user1',
        action: 'LOGIN',
        resource: 'auth',
        details: {},
        status: 'success',
      });

      const logs = logger.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe('LOGIN');
    });

    it('should filter logs by user', () => {
      logger.log({
        userId: 'user1',
        action: 'LOGIN',
        resource: 'auth',
        details: {},
        status: 'success',
      });
      logger.log({
        userId: 'user2',
        action: 'LOGIN',
        resource: 'auth',
        details: {},
        status: 'success',
      });

      const user1Logs = logger.getLogs({ userId: 'user1' });
      expect(user1Logs.length).toBe(1);
    });

    it('should get user history', () => {
      for (let i = 0; i < 5; i++) {
        logger.log({
          userId: 'user1',
          action: `ACTION_${i}`,
          resource: 'test',
          details: {},
          status: 'success',
        });
      }

      const history = logger.getUserHistory('user1', 3);
      expect(history.length).toBe(3);
    });

    it('should calculate statistics', () => {
      logger.log({
        userId: 'user1',
        action: 'LOGIN',
        resource: 'auth',
        details: {},
        status: 'success',
      });
      logger.log({
        userId: 'user1',
        action: 'LOGIN',
        resource: 'auth',
        details: {},
        status: 'failure',
      });

      const stats = logger.getStats();
      expect(stats.totalLogs).toBe(2);
      expect(stats.successCount).toBe(1);
      expect(stats.failureCount).toBe(1);
      expect(stats.uniqueUsers).toBe(1);
    });
  });

  describe('Backend Optimization Report', () => {
    it('should generate optimization report', () => {
      const optimizer = new QueryOptimizer();
      const cache = new CacheManager<string, string>();
      const logger = new AuditLogger();

      optimizer.recordQuery('query1', 100);
      cache.set('key1', 'value1');
      cache.get('key1');
      logger.log({
        userId: 'user1',
        action: 'TEST',
        resource: 'test',
        details: {},
        status: 'success',
      });

      const report = generateBackendOptimizationReport(optimizer, cache, logger);
      expect(report).toContain('后端优化报告');
      expect(report).toContain('缓存命中率');
      expect(report).toContain('审计日志');
    });
  });

  describe('Security Integration', () => {
    it('should handle complete security flow', () => {
      // Input validation
      const email = 'user@example.com';
      expect(InputValidator.validateEmail(email)).toBe(true);

      // Password validation
      const password = 'SecurePass123!';
      const validation = InputValidator.validatePasswordStrength(password);
      expect(validation.isStrong).toBe(true);

      // Password hashing
      const hash = DataEncryption.hashPassword(password);
      expect(DataEncryption.verifyPassword(password, hash)).toBe(true);

      // Authorization
      const authManager = new AuthorizationManager();
      authManager.defineRolePermissions('user', ['read']);

      const context = {
        userId: 'user1',
        role: 'user' as const,
        permissions: [],
      };

      expect(authManager.hasPermission(context, 'read')).toBe(true);
      expect(authManager.hasPermission(context, 'delete')).toBe(false);
    });
  });
});
