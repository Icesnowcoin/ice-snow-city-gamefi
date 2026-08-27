/**
 * Backend Optimization and Security Utilities
 * 
 * Phase 61-65: 后端优化和安全加固
 * 
 * 优化策略：
 * 1. 数据库查询优化 - 索引、查询分析、缓存
 * 2. API 响应缓存 - Redis、内存缓存
 * 3. 速率限制 - 防止滥用、DDoS 防护
 * 4. 输入验证和清理 - XSS、SQL 注入防护
 * 5. 认证和授权 - JWT、角色权限
 * 6. 数据加密 - 敏感数据加密、传输加密
 * 7. 错误处理 - 安全的错误消息
 * 8. 审计日志 - 操作追踪、合规性
 */

/**
 * 数据库查询优化
 */
export class QueryOptimizer {
  private queryStats: Map<string, { count: number; totalTime: number; avgTime: number }> = new Map();

  /**
   * 记录查询性能
   */
  recordQuery(queryName: string, executionTime: number): void {
    const stats = this.queryStats.get(queryName) || { count: 0, totalTime: 0, avgTime: 0 };
    stats.count++;
    stats.totalTime += executionTime;
    stats.avgTime = stats.totalTime / stats.count;
    this.queryStats.set(queryName, stats);
  }

  /**
   * 获取慢查询
   */
  getSlowQueries(threshold: number = 1000): Array<{ name: string; avgTime: number }> {
    return Array.from(this.queryStats.entries())
      .filter(([_, stats]) => stats.avgTime > threshold)
      .map(([name, stats]) => ({ name, avgTime: stats.avgTime }))
      .sort((a, b) => b.avgTime - a.avgTime);
  }

  /**
   * 获取查询统计
   */
  getQueryStats(): Record<string, { count: number; totalTime: number; avgTime: number }> {
    const stats: Record<string, { count: number; totalTime: number; avgTime: number }> = {};
    this.queryStats.forEach((value, key) => {
      stats[key] = value;
    });
    return stats;
  }

  /**
   * 重置统计
   */
  reset(): void {
    this.queryStats.clear();
  }
}

/**
 * 缓存管理
 */
export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

export class CacheManager<K, V> {
  private cache: Map<K, CacheEntry<V>> = new Map();
  private hits: number = 0;
  private misses: number = 0;

  /**
   * 设置缓存
   */
  set(key: K, value: V, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * 获取缓存
   */
  get(key: K): V | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value;
  }

  /**
   * 删除缓存
   */
  delete(key: K): void {
    this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存命中率
   */
  getHitRate(): number {
    const total = this.hits + this.misses;
    return total === 0 ? 0 : (this.hits / total) * 100;
  }

  /**
   * 获取缓存统计
   */
  getStats(): { hits: number; misses: number; hitRate: number; size: number } {
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: this.getHitRate(),
      size: this.cache.size,
    };
  }
}

/**
 * 速率限制器
 */
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (req: any) => string;
}

export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      maxRequests: config.maxRequests || 100,
      windowMs: config.windowMs || 60 * 1000,
      keyGenerator: config.keyGenerator || ((req: any) => req.ip || 'unknown'),
    };
  }

  /**
   * 检查是否超过限制
   */
  isLimited(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const timestamps = this.requests.get(key)!;
    const validTimestamps = timestamps.filter((ts) => ts > windowStart);

    if (validTimestamps.length >= this.config.maxRequests) {
      return true;
    }

    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    return false;
  }

  /**
   * 获取剩余请求数
   */
  getRemainingRequests(key: string): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    const timestamps = this.requests.get(key) || [];
    const validTimestamps = timestamps.filter((ts) => ts > windowStart);

    return Math.max(0, this.config.maxRequests - validTimestamps.length);
  }

  /**
   * 重置限制
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * 清空所有限制
   */
  clear(): void {
    this.requests.clear();
  }
}

/**
 * 输入验证和清理
 */
export class InputValidator {
  /**
   * 验证邮箱
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证 URL
   */
  static validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 验证整数
   */
  static validateInteger(value: any): boolean {
    return Number.isInteger(value) && value >= 0;
  }

  /**
   * 验证浮点数
   */
  static validateFloat(value: any): boolean {
    return typeof value === 'number' && !isNaN(value);
  }

  /**
   * 清理字符串（防止 XSS）
   */
  static sanitizeString(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * 清理对象
   */
  static sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  }

  /**
   * 验证密码强度
   */
  static validatePasswordStrength(password: string): {
    isStrong: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score++;
    else feedback.push('密码长度至少 8 个字符');

    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    else feedback.push('密码应包含小写字母');

    if (/[A-Z]/.test(password)) score++;
    else feedback.push('密码应包含大写字母');

    if (/[0-9]/.test(password)) score++;
    else feedback.push('密码应包含数字');

    if (/[!@#$%^&*]/.test(password)) score++;
    else feedback.push('密码应包含特殊字符');

    return {
      isStrong: score >= 4,
      score,
      feedback,
    };
  }
}

/**
 * 认证和授权
 */
export interface AuthContext {
  userId: string;
  role: 'admin' | 'user' | 'guest';
  permissions: string[];
}

export class AuthorizationManager {
  private rolePermissions: Map<string, Set<string>> = new Map();

  /**
   * 定义角色权限
   */
  defineRolePermissions(role: string, permissions: string[]): void {
    this.rolePermissions.set(role, new Set(permissions));
  }

  /**
   * 检查权限
   */
  hasPermission(context: AuthContext, requiredPermission: string): boolean {
    if (context.role === 'admin') {
      return true;
    }

    if (context.permissions.includes(requiredPermission)) {
      return true;
    }

    const rolePermissions = this.rolePermissions.get(context.role);
    return rolePermissions ? rolePermissions.has(requiredPermission) : false;
  }

  /**
   * 检查多个权限（AND）
   */
  hasAllPermissions(context: AuthContext, requiredPermissions: string[]): boolean {
    return requiredPermissions.every((permission) => this.hasPermission(context, permission));
  }

  /**
   * 检查多个权限（OR）
   */
  hasAnyPermission(context: AuthContext, requiredPermissions: string[]): boolean {
    return requiredPermissions.some((permission) => this.hasPermission(context, permission));
  }
}

/**
 * 数据加密
 */
export class DataEncryption {
  /**
   * 哈希密码（简化版，实际应使用 bcrypt）
   */
  static hashPassword(password: string): string {
    // 实际应使用 bcrypt 或 argon2
    const hash = require('crypto').createHash('sha256');
    hash.update(password);
    return hash.digest('hex');
  }

  /**
   * 验证密码
   */
  static verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }

  /**
   * 加密敏感数据
   */
  static encryptSensitiveData(data: string, key: string): string {
    // 实际应使用 AES-256 加密
    const crypto = require('crypto');
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * 解密敏感数据
   */
  static decryptSensitiveData(encrypted: string, key: string): string {
    // 实际应使用 AES-256 解密
    const crypto = require('crypto');
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * 掩码敏感信息
   */
  static maskSensitiveInfo(value: string, visibleChars: number = 4): string {
    if (value.length <= visibleChars) {
      return '*'.repeat(value.length);
    }
    const visible = value.substring(value.length - visibleChars);
    const masked = '*'.repeat(value.length - visibleChars);
    return masked + visible;
  }
}

/**
 * 安全的错误处理
 */
export interface SafeError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
}

export class ErrorHandler {
  /**
   * 创建安全的错误响应
   */
  static createSafeError(error: any, isDevelopment: boolean = false): SafeError {
    // 不暴露内部错误细节
    const safeError: SafeError = {
      code: error.code || 'INTERNAL_ERROR',
      message: isDevelopment ? error.message : '发生错误，请稍后重试',
      statusCode: error.statusCode || 500,
    };

    if (isDevelopment) {
      safeError.details = {
        originalMessage: error.message,
        stack: error.stack,
      };
    }

    return safeError;
  }

  /**
   * 验证错误
   */
  static createValidationError(field: string, message: string): SafeError {
    return {
      code: 'VALIDATION_ERROR',
      message: `${field}: ${message}`,
      statusCode: 400,
    };
  }

  /**
   * 认证错误
   */
  static createAuthError(message: string = '未授权'): SafeError {
    return {
      code: 'AUTH_ERROR',
      message,
      statusCode: 401,
    };
  }

  /**
   * 权限错误
   */
  static createPermissionError(message: string = '禁止访问'): SafeError {
    return {
      code: 'PERMISSION_ERROR',
      message,
      statusCode: 403,
    };
  }

  /**
   * 未找到错误
   */
  static createNotFoundError(resource: string): SafeError {
    return {
      code: 'NOT_FOUND',
      message: `${resource} 不存在`,
      statusCode: 404,
    };
  }
}

/**
 * 审计日志
 */
export interface AuditLog {
  timestamp: number;
  userId: string;
  action: string;
  resource: string;
  details: any;
  status: 'success' | 'failure';
  ipAddress?: string;
}

export class AuditLogger {
  private logs: AuditLog[] = [];

  /**
   * 记录操作
   */
  log(entry: Omit<AuditLog, 'timestamp'>): void {
    this.logs.push({
      ...entry,
      timestamp: Date.now(),
    });
  }

  /**
   * 获取审计日志
   */
  getLogs(filter?: { userId?: string; action?: string; status?: string }): AuditLog[] {
    if (!filter) {
      return [...this.logs];
    }

    return this.logs.filter((log) => {
      if (filter.userId && log.userId !== filter.userId) return false;
      if (filter.action && log.action !== filter.action) return false;
      if (filter.status && log.status !== filter.status) return false;
      return true;
    });
  }

  /**
   * 获取用户操作历史
   */
  getUserHistory(userId: string, limit: number = 100): AuditLog[] {
    return this.logs
      .filter((log) => log.userId === userId)
      .slice(-limit);
  }

  /**
   * 清空日志
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * 获取日志统计
   */
  getStats(): {
    totalLogs: number;
    successCount: number;
    failureCount: number;
    uniqueUsers: number;
  } {
    const uniqueUsers = new Set(this.logs.map((log) => log.userId)).size;
    const successCount = this.logs.filter((log) => log.status === 'success').length;
    const failureCount = this.logs.filter((log) => log.status === 'failure').length;

    return {
      totalLogs: this.logs.length,
      successCount,
      failureCount,
      uniqueUsers,
    };
  }
}

/**
 * 生成后端优化报告
 */
export function generateBackendOptimizationReport(
  queryOptimizer: QueryOptimizer,
  cacheManager: CacheManager<any, any>,
  auditLogger: AuditLogger
): string {
  const queryStats = queryOptimizer.getQueryStats();
  const cacheStats = cacheManager.getStats();
  const auditStats = auditLogger.getStats();

  const report = `
=== 后端优化报告 ===

数据库查询优化:
- 记录的查询数: ${Object.keys(queryStats).length}
- 慢查询数: ${Object.values(queryStats).filter((s) => s.avgTime > 1000).length}
- 平均查询时间: ${
    Object.values(queryStats).length > 0
      ? (
          Object.values(queryStats).reduce((sum, s) => sum + s.avgTime, 0) /
          Object.values(queryStats).length
        ).toFixed(2)
      : 0
  }ms

缓存管理:
- 缓存命中率: ${cacheStats.hitRate.toFixed(2)}%
- 缓存命中数: ${cacheStats.hits}
- 缓存未命中数: ${cacheStats.misses}
- 缓存大小: ${cacheStats.size}

审计日志:
- 总日志数: ${auditStats.totalLogs}
- 成功操作: ${auditStats.successCount}
- 失败操作: ${auditStats.failureCount}
- 独立用户数: ${auditStats.uniqueUsers}
  `;

  return report;
}
