import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  EnvironmentConfigManager,
  HealthChecker,
  StartupChecker,
  MigrationManager,
  DocumentationGenerator,
  generateDeploymentReport,
} from './deploymentConfig';

describe('Deployment Configuration and Documentation', () => {
  describe('Environment Config Manager', () => {
    it('should load development config', () => {
      const manager = new EnvironmentConfigManager('development');
      const config = manager.getConfig();

      expect(config.env).toBe('development');
      expect(config.debug).toBe(true);
      expect(config.logLevel).toBe('debug');
    });

    it('should load production config', () => {
      const manager = new EnvironmentConfigManager('production');
      const config = manager.getConfig();

      expect(config.env).toBe('production');
      expect(config.debug).toBe(false);
      expect(config.logLevel).toBe('warn');
      expect(config.maxConnections).toBe(500);
    });

    it('should load staging config', () => {
      const manager = new EnvironmentConfigManager('staging');
      const config = manager.getConfig();

      expect(config.env).toBe('staging');
      expect(config.maxConnections).toBe(200);
    });

    it('should validate config', () => {
      // Set required env vars
      process.env.DATABASE_URL = 'mysql://localhost/test';
      process.env.JWT_SECRET = 'test-secret';
      
      const manager = new EnvironmentConfigManager('development');
      const validation = manager.validateConfig();

      expect(validation.isValid).toBe(true);
      
      // Cleanup
      delete process.env.DATABASE_URL;
      delete process.env.JWT_SECRET;
    });

    it('should detect invalid port', () => {
      // Set required env vars
      process.env.DATABASE_URL = 'mysql://localhost/test';
      process.env.JWT_SECRET = 'test-secret';
      process.env.PORT = '99999';
      
      const manager = new EnvironmentConfigManager('development');
      const validation = manager.validateConfig();

      expect(validation.errors.some((e) => e.includes('PORT'))).toBe(true);
      
      // Cleanup
      delete process.env.PORT;
      delete process.env.DATABASE_URL;
      delete process.env.JWT_SECRET;
    });
  });

  describe('Health Checker', () => {
    let checker: HealthChecker;

    beforeEach(() => {
      checker = new HealthChecker();
    });

    it('should perform health check', async () => {
      const result = await checker.performHealthCheck();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('checks');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(result.status);
    });

    it('should include memory check', async () => {
      const result = await checker.performHealthCheck();

      expect(result.checks.memory).toBeDefined();
      expect(result.checks.memory.status).toMatch(/ok|error/);
    });

    it('should track uptime', async () => {
      const result = await checker.performHealthCheck();

      expect(result.checks.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Startup Checker', () => {
    it('should perform startup check', async () => {
      const checker = new StartupChecker('development');
      const result = await checker.performStartupCheck();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('checks');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
    });

    it('should check dependencies', async () => {
      const checker = new StartupChecker('development');
      const result = await checker.performStartupCheck();

      expect(result.checks.dependenciesAvailable).toBe(true);
    });

    it('should validate configuration on startup', async () => {
      // Set required env vars
      process.env.DATABASE_URL = 'mysql://localhost/test';
      process.env.JWT_SECRET = 'test-secret';
      
      const checker = new StartupChecker('development');
      const result = await checker.performStartupCheck();

      // Should succeed with proper env vars
      expect(result.success).toBe(true);
      
      // Cleanup
      delete process.env.DATABASE_URL;
      delete process.env.JWT_SECRET;
    });
  });

  describe('Migration Manager', () => {
    let manager: MigrationManager;

    beforeEach(() => {
      manager = new MigrationManager();
    });

    it('should register migration', () => {
      const migration = {
        version: '1.0.0',
        name: 'initial',
        up: async () => {},
        down: async () => {},
      };

      manager.registerMigration(migration);
      const status = manager.getMigrationStatus();

      expect(status.total).toBe(1);
      expect(status.pending).toBe(1);
    });

    it('should apply migrations', async () => {
      const migration = {
        version: '1.0.0',
        name: 'initial',
        up: async () => {},
        down: async () => {},
      };

      manager.registerMigration(migration);
      const result = await manager.applyPendingMigrations();

      expect(result.applied).toContain('1.0.0');
      expect(result.failed.length).toBe(0);
    });

    it('should track migration status', async () => {
      const migration = {
        version: '1.0.0',
        name: 'initial',
        up: async () => {},
        down: async () => {},
      };

      manager.registerMigration(migration);
      await manager.applyPendingMigrations();

      const status = manager.getMigrationStatus();
      expect(status.applied).toBe(1);
      expect(status.pending).toBe(0);
    });

    it('should rollback migration', async () => {
      const migration = {
        version: '1.0.0',
        name: 'initial',
        up: async () => {},
        down: async () => {},
      };

      manager.registerMigration(migration);
      await manager.applyPendingMigrations();

      const rollback = await manager.rollbackMigration('1.0.0');
      expect(rollback.success).toBe(true);

      const status = manager.getMigrationStatus();
      expect(status.applied).toBe(0);
    });

    it('should handle migration errors', async () => {
      const migration = {
        version: '1.0.0',
        name: 'initial',
        up: async () => {
          throw new Error('Migration failed');
        },
        down: async () => {},
      };

      manager.registerMigration(migration);
      const result = await manager.applyPendingMigrations();

      expect(result.failed.length).toBe(1);
    });
  });

  describe('Documentation Generator', () => {
    let generator: DocumentationGenerator;

    beforeEach(() => {
      generator = new DocumentationGenerator();
    });

    it('should register endpoints', () => {
      generator.registerEndpoint({
        method: 'GET',
        path: '/api/users',
        description: 'Get all users',
        authentication: true,
      });

      const doc = generator.generateMarkdownDocumentation();
      expect(doc).toContain('/api/users');
      expect(doc).toContain('Get all users');
    });

    it('should generate markdown documentation', () => {
      generator.registerEndpoint({
        method: 'POST',
        path: '/api/users',
        description: 'Create a user',
        parameters: [
          { name: 'name', type: 'string', required: true, description: 'User name' },
          { name: 'email', type: 'string', required: true, description: 'User email' },
        ],
        responses: [
          { code: 201, description: 'User created', example: { id: 1, name: 'John' } },
          { code: 400, description: 'Invalid input' },
        ],
        authentication: true,
      });

      const doc = generator.generateMarkdownDocumentation();
      expect(doc).toContain('# API 文档');
      expect(doc).toContain('POST');
      expect(doc).toContain('参数');
      expect(doc).toContain('响应');
      expect(doc).toContain('认证');
    });

    it('should generate deployment guide', () => {
      const guide = generator.generateDeploymentGuide();

      expect(guide).toContain('# 部署指南');
      expect(guide).toContain('前置要求');
      expect(guide).toContain('环境配置');
      expect(guide).toContain('数据库迁移');
      expect(guide).toContain('构建应用');
    });

    it('should generate changelog', () => {
      const changes = [
        '+ 新增用户认证功能',
        '* 修复数据库连接问题',
        '~ 改进 API 响应时间',
      ];

      const changelog = generator.generateChangelog('1.0.0', changes);

      expect(changelog).toContain('# 变更日志');
      expect(changelog).toContain('[1.0.0]');
      expect(changelog).toContain('新增');
      expect(changelog).toContain('修复');
      expect(changelog).toContain('改进');
    });

    it('should handle multiple endpoints', () => {
      generator.registerEndpoint({
        method: 'GET',
        path: '/api/users',
        description: 'Get users',
      });

      generator.registerEndpoint({
        method: 'POST',
        path: '/api/users',
        description: 'Create user',
      });

      generator.registerEndpoint({
        method: 'GET',
        path: '/api/products',
        description: 'Get products',
      });

      const doc = generator.generateMarkdownDocumentation();
      expect(doc).toContain('/api/users');
      expect(doc).toContain('/api/products');
      expect(doc.match(/GET/g)?.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Deployment Report Generation', () => {
    it('should generate deployment report', () => {
      const configManager = new EnvironmentConfigManager('production');
      const healthChecker = new HealthChecker();
      const startupChecker = new StartupChecker('production');
      const migrationManager = new MigrationManager();

      const report = generateDeploymentReport(
        configManager,
        healthChecker,
        startupChecker,
        migrationManager
      );

      expect(report).toContain('部署报告');
      expect(report).toContain('环境配置');
      expect(report).toContain('数据库迁移');
      expect(report).toContain('缓存配置');
    });
  });

  describe('Deployment Integration', () => {
    it('should handle complete deployment flow', async () => {
      // Setup
      const configManager = new EnvironmentConfigManager('staging');
      const startupChecker = new StartupChecker('staging');
      const migrationManager = new MigrationManager();

      // Register migration
      migrationManager.registerMigration({
        version: '1.0.0',
        name: 'initial',
        up: async () => {},
        down: async () => {},
      });

      // Perform startup check
      const startupResult = await startupChecker.performStartupCheck();
      expect(startupResult).toBeDefined();

      // Apply migrations
      const migrationResult = await migrationManager.applyPendingMigrations();
      expect(migrationResult.failed.length).toBe(0);

      // Verify migration status
      const status = migrationManager.getMigrationStatus();
      expect(status.applied).toBe(1);
    });

    it('should generate complete documentation', () => {
      const generator = new DocumentationGenerator();

      // Register endpoints
      generator.registerEndpoint({
        method: 'GET',
        path: '/api/health',
        description: 'Health check',
      });

      generator.registerEndpoint({
        method: 'GET',
        path: '/api/users/:id',
        description: 'Get user by ID',
        authentication: true,
      });

      // Generate documentation
      const apiDoc = generator.generateMarkdownDocumentation();
      const deploymentGuide = generator.generateDeploymentGuide();
      const changelog = generator.generateChangelog('1.0.0', [
        '+ 初始版本',
      ]);

      expect(apiDoc).toContain('API 文档');
      expect(deploymentGuide).toContain('部署指南');
      expect(changelog).toContain('变更日志');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate all required environment variables', () => {
      // Unset env vars to test validation
      const originalDb = process.env.DATABASE_URL;
      const originalJwt = process.env.JWT_SECRET;
      
      delete process.env.DATABASE_URL;
      delete process.env.JWT_SECRET;
      
      const manager = new EnvironmentConfigManager('production');
      const validation = manager.validateConfig();

      // Should fail due to missing DATABASE_URL and JWT_SECRET
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      
      // Restore
      if (originalDb) process.env.DATABASE_URL = originalDb;
      if (originalJwt) process.env.JWT_SECRET = originalJwt;
    });

    it('should warn about debug mode in production', () => {
      process.env.NODE_ENV = 'production';
      const manager = new EnvironmentConfigManager('production');
      const config = manager.getConfig();

      expect(config.debug).toBe(false);
      delete process.env.NODE_ENV;
    });
  });
});
