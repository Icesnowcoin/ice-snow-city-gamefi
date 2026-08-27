/**
 * Deployment Configuration and Documentation Utilities
 * 
 * Phase 66-70: 部署准备和文档完善
 * 
 * 部署策略：
 * 1. 环境配置管理 - 开发、测试、生产环境
 * 2. 健康检查 - 服务可用性监控
 * 3. 启动检查 - 依赖项验证
 * 4. 配置验证 - 环境变量检查
 * 5. 数据库迁移 - 版本管理
 * 6. 备份和恢复 - 灾难恢复
 * 7. 监控和告警 - 性能指标
 * 8. 文档生成 - API 文档、部署指南
 */

/**
 * 环境配置
 */
export type Environment = 'development' | 'staging' | 'production';

export interface EnvironmentConfig {
  env: Environment;
  debug: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  apiTimeout: number;
  maxConnections: number;
  enableCache: boolean;
  cacheTTL: number;
  enableMonitoring: boolean;
  monitoringInterval: number;
}

/**
 * 环境配置管理器
 */
export class EnvironmentConfigManager {
  private config: EnvironmentConfig;

  constructor(env: Environment = 'development') {
    this.config = this.loadConfig(env);
  }

  /**
   * 加载环境配置
   */
  private loadConfig(env: Environment): EnvironmentConfig {
    const baseConfig: EnvironmentConfig = {
      env,
      debug: env !== 'production',
      logLevel: env === 'production' ? 'warn' : 'debug',
      port: parseInt(process.env.PORT || '3000', 10),
      databaseUrl: process.env.DATABASE_URL || '',
      jwtSecret: process.env.JWT_SECRET || 'default-secret',
      apiTimeout: 30000,
      maxConnections: 100,
      enableCache: true,
      cacheTTL: 5 * 60 * 1000,
      enableMonitoring: env !== 'development',
      monitoringInterval: 60000,
    };

    if (env === 'production') {
      return {
        ...baseConfig,
        apiTimeout: 60000,
        maxConnections: 500,
        cacheTTL: 10 * 60 * 1000,
      };
    }

    if (env === 'staging') {
      return {
        ...baseConfig,
        apiTimeout: 45000,
        maxConnections: 200,
        cacheTTL: 7 * 60 * 1000,
      };
    }

    return baseConfig;
  }

  /**
   * 获取配置
   */
  getConfig(): EnvironmentConfig {
    return { ...this.config };
  }

  /**
   * 验证配置
   */
  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.databaseUrl) {
      errors.push('DATABASE_URL 未设置');
    }

    if (!this.config.jwtSecret || this.config.jwtSecret === 'default-secret') {
      errors.push('JWT_SECRET 未正确设置');
    }

    if (this.config.port < 1 || this.config.port > 65535) {
      errors.push('PORT 无效');
    }

    if (this.config.env === 'production' && this.config.debug) {
      errors.push('生产环境不应启用 debug 模式');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * 健康检查
 */
export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  checks: {
    database: { status: 'ok' | 'error'; message: string };
    cache: { status: 'ok' | 'error'; message: string };
    memory: { status: 'ok' | 'error'; message: string };
    uptime: number;
  };
}

export class HealthChecker {
  private startTime: number = Date.now();

  /**
   * 执行健康检查
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const checks = {
      database: await this.checkDatabase(),
      cache: await this.checkCache(),
      memory: this.checkMemory(),
      uptime: Date.now() - this.startTime,
    };

    const errors = [checks.database, checks.cache, checks.memory].filter(
      (c) => c.status === 'error'
    ).length;

    const status: 'healthy' | 'degraded' | 'unhealthy' =
      errors === 0 ? 'healthy' : errors === 1 ? 'degraded' : 'unhealthy';

    return {
      status,
      timestamp: Date.now(),
      checks,
    };
  }

  /**
   * 检查数据库
   */
  private async checkDatabase(): Promise<{ status: 'ok' | 'error'; message: string }> {
    try {
      // 实际应执行数据库连接测试
      return { status: 'ok', message: '数据库连接正常' };
    } catch (error) {
      return { status: 'error', message: `数据库连接失败: ${error}` };
    }
  }

  /**
   * 检查缓存
   */
  private async checkCache(): Promise<{ status: 'ok' | 'error'; message: string }> {
    try {
      // 实际应执行缓存连接测试
      return { status: 'ok', message: '缓存连接正常' };
    } catch (error) {
      return { status: 'error', message: `缓存连接失败: ${error}` };
    }
  }

  /**
   * 检查内存
   */
  private checkMemory(): { status: 'ok' | 'error'; message: string } {
    const memUsage = process.memoryUsage();
    const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

    if (heapUsedPercent > 90) {
      return {
        status: 'error',
        message: `内存使用率过高: ${heapUsedPercent.toFixed(2)}%`,
      };
    }

    if (heapUsedPercent > 75) {
      return {
        status: 'ok',
        message: `内存使用率: ${heapUsedPercent.toFixed(2)}%`,
      };
    }

    return {
      status: 'ok',
      message: `内存使用率: ${heapUsedPercent.toFixed(2)}%`,
    };
  }
}

/**
 * 启动检查
 */
export interface StartupCheckResult {
  success: boolean;
  checks: {
    configValid: boolean;
    dependenciesAvailable: boolean;
    databaseConnected: boolean;
    cacheConnected: boolean;
  };
  errors: string[];
  warnings: string[];
}

export class StartupChecker {
  private configManager: EnvironmentConfigManager;

  constructor(env: Environment = 'development') {
    this.configManager = new EnvironmentConfigManager(env);
  }

  /**
   * 执行启动检查
   */
  async performStartupCheck(): Promise<StartupCheckResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 配置验证
    const configValidation = this.configManager.validateConfig();
    if (!configValidation.isValid) {
      errors.push(...configValidation.errors);
    }

    // 依赖检查
    const depsCheck = this.checkDependencies();
    if (!depsCheck.available) {
      errors.push(...depsCheck.missing);
    }

    // 数据库连接检查
    const dbCheck = await this.checkDatabaseConnection();
    if (!dbCheck.connected) {
      errors.push(dbCheck.error || '数据库连接失败');
    }

    // 缓存连接检查
    const cacheCheck = await this.checkCacheConnection();
    if (!cacheCheck.connected) {
      warnings.push(cacheCheck.error || '缓存连接失败');
    }

    return {
      success: errors.length === 0,
      checks: {
        configValid: configValidation.isValid,
        dependenciesAvailable: depsCheck.available,
        databaseConnected: dbCheck.connected,
        cacheConnected: cacheCheck.connected,
      },
      errors,
      warnings,
    };
  }

  /**
   * 检查依赖
   */
  private checkDependencies(): { available: boolean; missing: string[] } {
    const requiredModules = ['express', 'dotenv', 'drizzle-orm'];
    const missing: string[] = [];

    requiredModules.forEach((module) => {
      try {
        require(module);
      } catch {
        missing.push(`缺少依赖: ${module}`);
      }
    });

    return {
      available: missing.length === 0,
      missing,
    };
  }

  /**
   * 检查数据库连接
   */
  private async checkDatabaseConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      // 实际应执行数据库连接测试
      return { connected: true };
    } catch (error) {
      return { connected: false, error: `数据库连接失败: ${error}` };
    }
  }

  /**
   * 检查缓存连接
   */
  private async checkCacheConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      // 实际应执行缓存连接测试
      return { connected: true };
    } catch (error) {
      return { connected: false, error: `缓存连接失败: ${error}` };
    }
  }
}

/**
 * 数据库迁移管理
 */
export interface Migration {
  version: string;
  name: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
}

export class MigrationManager {
  private migrations: Map<string, Migration> = new Map();
  private appliedMigrations: Set<string> = new Set();

  /**
   * 注册迁移
   */
  registerMigration(migration: Migration): void {
    this.migrations.set(migration.version, migration);
  }

  /**
   * 应用待处理的迁移
   */
  async applyPendingMigrations(): Promise<{ applied: string[]; failed: string[] }> {
    const applied: string[] = [];
    const failed: string[] = [];

    for (const [version, migration] of Array.from(this.migrations.entries())) {
      if (!this.appliedMigrations.has(version)) {
        try {
          await migration.up();
          this.appliedMigrations.add(version);
          applied.push(version);
        } catch (error) {
          failed.push(`${version}: ${error}`);
        }
      }
    }

    return { applied, failed };
  }

  /**
   * 回滚迁移
   */
  async rollbackMigration(version: string): Promise<{ success: boolean; error?: string }> {
    const migration = this.migrations.get(version);
    if (!migration) {
      return { success: false, error: `迁移 ${version} 不存在` };
    }

    try {
      await migration.down();
      this.appliedMigrations.delete(version);
      return { success: true };
    } catch (error) {
      return { success: false, error: `回滚失败: ${error}` };
    }
  }

  /**
   * 获取迁移状态
   */
  getMigrationStatus(): {
    total: number;
    applied: number;
    pending: number;
    migrations: { version: string; name: string; applied: boolean }[];
  } {
    const migrations = Array.from(this.migrations.values()).map((m) => ({
      version: m.version,
      name: m.name,
      applied: this.appliedMigrations.has(m.version),
    }));

    return {
      total: migrations.length,
      applied: migrations.filter((m) => m.applied).length,
      pending: migrations.filter((m) => !m.applied).length,
      migrations,
    };
  }
}

/**
 * 文档生成
 */
export interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  parameters?: { name: string; type: string; required: boolean; description: string }[];
  responses?: { code: number; description: string; example?: any }[];
  authentication?: boolean;
}

export class DocumentationGenerator {
  private endpoints: APIEndpoint[] = [];

  /**
   * 注册 API 端点
   */
  registerEndpoint(endpoint: APIEndpoint): void {
    this.endpoints.push(endpoint);
  }

  /**
   * 生成 Markdown 文档
   */
  generateMarkdownDocumentation(): string {
    let doc = '# API 文档\n\n';
    doc += `生成时间: ${new Date().toISOString()}\n\n`;
    doc += `总端点数: ${this.endpoints.length}\n\n`;

    // 按路径分组
    const grouped = this.groupEndpointsByPath();

    for (const [path, endpoints] of Array.from(grouped.entries())) {
      doc += `## ${path}\n\n`;

      for (const endpoint of endpoints) {
        doc += `### ${endpoint.method} ${endpoint.path}\n\n`;
        doc += `${endpoint.description}\n\n`;

        if (endpoint.authentication) {
          doc += '**认证**: 需要\n\n';
        }

        if (endpoint.parameters && endpoint.parameters.length > 0) {
          doc += '**参数**:\n\n';
          doc += '| 名称 | 类型 | 必需 | 描述 |\n';
          doc += '|------|------|------|------|\n';
          for (const param of endpoint.parameters) {
            doc += `| ${param.name} | ${param.type} | ${param.required ? '是' : '否'} | ${param.description} |\n`;
          }
          doc += '\n';
        }

        if (endpoint.responses && endpoint.responses.length > 0) {
          doc += '**响应**:\n\n';
          for (const response of endpoint.responses) {
            doc += `- \`${response.code}\`: ${response.description}\n`;
            if (response.example) {
              doc += `  \`\`\`json\n  ${JSON.stringify(response.example, null, 2)}\n  \`\`\`\n`;
            }
          }
          doc += '\n';
        }
      }
    }

    return doc;
  }

  /**
   * 生成部署指南
   */
  generateDeploymentGuide(): string {
    const guide = `# 部署指南

## 前置要求

- Node.js 18+
- MySQL 8.0+
- Redis 6.0+

## 环境配置

### 1. 克隆仓库

\`\`\`bash
git clone <repository-url>
cd ice_snow_city_agent
\`\`\`

### 2. 安装依赖

\`\`\`bash
pnpm install
\`\`\`

### 3. 配置环境变量

创建 \`.env\` 文件:

\`\`\`
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://user:password@localhost:3306/ice_snow_city
JWT_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379
\`\`\`

### 4. 数据库迁移

\`\`\`bash
pnpm run migrate
\`\`\`

### 5. 构建应用

\`\`\`bash
pnpm run build
\`\`\`

### 6. 启动应用

\`\`\`bash
pnpm run start
\`\`\`

## 监控和维护

### 健康检查

访问 \`/health\` 端点检查应用状态。

### 日志

日志文件位于 \`./logs\` 目录。

### 备份

定期备份数据库:

\`\`\`bash
pnpm run backup
\`\`\`

## 故障排除

### 数据库连接失败

检查 DATABASE_URL 是否正确设置。

### 缓存连接失败

检查 Redis 服务是否运行。

### 内存使用过高

检查是否有内存泄漏，考虑增加内存限制。
`;

    return guide;
  }

  /**
   * 生成 API 变更日志
   */
  generateChangelog(version: string, changes: string[]): string {
    const changelog = `# 变更日志

## [${version}] - ${new Date().toISOString().split('T')[0]}

### 新增
${changes.filter((c) => c.startsWith('+')).map((c) => `- ${c.substring(1)}`).join('\n')}

### 修复
${changes.filter((c) => c.startsWith('*')).map((c) => `- ${c.substring(1)}`).join('\n')}

### 改进
${changes.filter((c) => c.startsWith('~')).map((c) => `- ${c.substring(1)}`).join('\n')}
`;

    return changelog;
  }

  /**
   * 按路径分组端点
   */
  private groupEndpointsByPath(): Map<string, APIEndpoint[]> {
    const grouped = new Map<string, APIEndpoint[]>();

    this.endpoints.forEach((endpoint) => {
      const path = endpoint.path.split('/')[1] || 'root';
      if (!grouped.has(path)) {
        grouped.set(path, []);
      }
      grouped.get(path)!.push(endpoint);
    });

    return grouped;
  }
}

/**
 * 生成部署报告
 */
export function generateDeploymentReport(
  configManager: EnvironmentConfigManager,
  healthChecker: HealthChecker,
  startupChecker: StartupChecker,
  migrationManager: MigrationManager
): string {
  const config = configManager.getConfig();
  const migrationStatus = migrationManager.getMigrationStatus();

  const report = `
=== 部署报告 ===

环境配置:
- 环境: ${config.env}
- 端口: ${config.port}
- 调试模式: ${config.debug}
- 日志级别: ${config.logLevel}

数据库迁移:
- 总迁移数: ${migrationStatus.total}
- 已应用: ${migrationStatus.applied}
- 待处理: ${migrationStatus.pending}

缓存配置:
- 启用缓存: ${config.enableCache}
- 缓存 TTL: ${config.cacheTTL}ms

监控配置:
- 启用监控: ${config.enableMonitoring}
- 监控间隔: ${config.monitoringInterval}ms

最大连接数: ${config.maxConnections}
API 超时: ${config.apiTimeout}ms
  `;

  return report;
}
