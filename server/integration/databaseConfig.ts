/**
 * 数据库连接优化和连接池配置
 */

import { Pool, createPool } from "mysql2/promise";

/**
 * 数据库连接池配置
 */
export interface DatabasePoolConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  waitForConnections: boolean;
  connectionLimit: number;
  queueLimit: number;
  enableKeepAlive: boolean;
  keepAliveInitialDelayMs: number;
  charset: string;
  timezone: string;
  supportBigNumbers: boolean;
  bigNumberStrings: boolean;
  decimalNumbers: boolean;
  multipleStatements: boolean;
  connectTimeout: number;
  acquireTimeout: number;
  idleTimeout: number;
}

/**
 * 默认数据库连接池配置
 */
export const DEFAULT_POOL_CONFIG: Partial<DatabasePoolConfig> = {
  waitForConnections: true,
  connectionLimit: 20, // 生产环境可增加到 50-100
  queueLimit: 0, // 无限队列
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0,
  charset: "utf8mb4",
  timezone: "+00:00",
  supportBigNumbers: true,
  bigNumberStrings: true,
  decimalNumbers: true,
  multipleStatements: false, // 安全考虑，禁用多语句
  connectTimeout: 10000, // 10 秒
  acquireTimeout: 30000, // 30 秒
  idleTimeout: 60000, // 60 秒
};

/**
 * 数据库连接池实例
 */
let pool: Pool | null = null;

/**
 * 初始化数据库连接池
 */
export async function initializePool(
  config: DatabasePoolConfig
): Promise<Pool> {
  if (pool) {
    console.warn("Database pool already initialized");
    return pool;
  }

  try {
    pool = createPool({
      ...config,
      ...DEFAULT_POOL_CONFIG,
    });

    // 测试连接
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    console.log("Database pool initialized successfully");
    return pool;
  } catch (error) {
    console.error("Failed to initialize database pool:", error);
    throw error;
  }
}

/**
 * 获取数据库连接池
 */
export function getPool(): Pool {
  if (!pool) {
    throw new Error("Database pool not initialized");
  }
  return pool;
}

/**
 * 关闭数据库连接池
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log("Database pool closed");
  }
}

/**
 * 获取连接池统计信息
 */
export function getPoolStats() {
  if (!pool) {
    return null;
  }

  const poolAny = pool as any;
  return {
    connectionLimit: poolAny.config?.connectionLimit || 0,
    waitingConnectionCount: poolAny._waitingConnections?.length || 0,
    allConnectionCount: poolAny._allConnections?.length || 0,
    freeConnectionCount: poolAny._freeConnections?.length || 0,
  };
}

/**
 * 数据库连接监控
 */
export class DatabaseMonitor {
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private readonly intervalMs: number;

  constructor(intervalMs: number = 60000) {
    this.intervalMs = intervalMs;
  }

  /**
   * 启动监控
   */
  start(): void {
    if (this.checkInterval) {
      console.warn("Database monitor already started");
      return;
    }

    this.checkInterval = setInterval(() => {
      this.checkPoolHealth();
    }, this.intervalMs);

    console.log(`Database monitor started (interval: ${this.intervalMs}ms)`);
  }

  /**
   * 停止监控
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log("Database monitor stopped");
    }
  }

  /**
   * 检查连接池健康状态
   */
  private async checkPoolHealth(): Promise<void> {
    try {
      const pool = getPool();
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();

      const stats = getPoolStats();
      console.log("Database pool health check passed", stats);
    } catch (error) {
      console.error("Database pool health check failed:", error);
      // 可以在这里添加告警逻辑
    }
  }
}

/**
 * 事务管理器
 */
export class TransactionManager {
  /**
   * 执行事务
   */
  static async execute<T>(
    callback: (connection: any) => Promise<T>
  ): Promise<T> {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 执行多个查询的事务
   */
  static async executeMultiple<T>(
    queries: Array<{
      sql: string;
      values?: any[];
    }>
  ): Promise<T[]> {
    return this.execute(async (connection) => {
      const results: T[] = [];
      for (const query of queries) {
        const [result] = await connection.execute(query.sql, query.values);
        results.push(result as T);
      }
      return results;
    });
  }
}

/**
 * 数据库连接字符串解析
 */
export function parseConnectionString(connectionString: string): DatabasePoolConfig {
  // 格式: mysql://user:password@host:port/database
  const url = new URL(connectionString);

  return {
    host: url.hostname,
    port: parseInt(url.port || "3306"),
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelayMs: 0,
    charset: "utf8mb4",
    timezone: "+00:00",
    supportBigNumbers: true,
    bigNumberStrings: true,
    decimalNumbers: true,
    multipleStatements: false,
    connectTimeout: 10000,
    acquireTimeout: 30000,
    idleTimeout: 60000,
  };
}

/**
 * 数据库查询执行器
 */
export class QueryExecutor {
  /**
   * 执行查询（带重试）
   */
  static async execute<T>(
    sql: string,
    values?: any[],
    retries: number = 3
  ): Promise<T[]> {
    let lastError: Error | null = null;

    for (let i = 0; i < retries; i++) {
      try {
        const pool = getPool();
        const [results] = await pool.execute(sql, values);
        return results as T[];
      } catch (error) {
        lastError = error as Error;
        console.warn(`Query execution failed (attempt ${i + 1}/${retries}):`, error);

        if (i < retries - 1) {
          // 等待后重试
          await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    }

    throw lastError || new Error("Query execution failed after retries");
  }

  /**
   * 执行单个查询
   */
  static async executeOne<T>(sql: string, values?: any[]): Promise<T | null> {
    const results = await this.execute<T>(sql, values);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * 执行更新
   */
  static async executeUpdate(
    sql: string,
    values?: any[]
  ): Promise<{ affectedRows: number; insertId: number }> {
    const pool = getPool();
    const [result] = await pool.execute(sql, values);
    const resultAny = result as any;
    return {
      affectedRows: resultAny.affectedRows || 0,
      insertId: resultAny.insertId || 0,
    };
  }

  /**
   * 执行批量操作
   */
  static async executeBatch(
    queries: Array<{
      sql: string;
      values?: any[];
    }>
  ): Promise<any[]> {
    return TransactionManager.executeMultiple(queries);
  }
}

/**
 * 数据库连接池配置验证
 */
export function validatePoolConfig(config: Partial<DatabasePoolConfig>): boolean {
  const required = ["host", "port", "user", "password", "database"];
  for (const field of required) {
    if (!config[field as keyof DatabasePoolConfig]) {
      console.error(`Missing required field: ${field}`);
      return false;
    }
  }
  return true;
}
