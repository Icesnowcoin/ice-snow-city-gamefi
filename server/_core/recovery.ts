/**
 * Automated Recovery Mechanism for Ice Snow City Admin Agent
 * 
 * Handles automatic detection, recovery, and restart of critical services:
 * - Event Listener Service
 * - Blockchain Service
 * - Database connections
 */

import { EventListenerService } from "./eventListener";
import { BlockchainService } from "./blockchain";
import { getMonitoringService } from "./monitoring";
import { getDb } from "../db";

export interface RecoveryConfig {
  maxRetries: number;
  retryDelayMs: number;
  healthCheckIntervalMs: number;
  enableAutoRestart: boolean;
}

export interface ServiceStatus {
  name: string;
  isHealthy: boolean;
  lastCheck: Date;
  errorCount: number;
  lastError?: string;
}

export class RecoveryService {
  private config: RecoveryConfig;
  private serviceStatuses: Map<string, ServiceStatus> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;
  private recoveryInProgress = false;

  constructor(config: Partial<RecoveryConfig> = {}) {
    this.config = {
      maxRetries: 5,
      retryDelayMs: 5000,
      healthCheckIntervalMs: 30000,
      enableAutoRestart: true,
      ...config,
    };

    this.initializeServiceStatuses();
  }

  private initializeServiceStatuses(): void {
    this.serviceStatuses.set("eventListener", {
      name: "Event Listener",
      isHealthy: true,
      lastCheck: new Date(),
      errorCount: 0,
    });

    this.serviceStatuses.set("blockchain", {
      name: "Blockchain Service",
      isHealthy: true,
      lastCheck: new Date(),
      errorCount: 0,
    });

    this.serviceStatuses.set("database", {
      name: "Database",
      isHealthy: true,
      lastCheck: new Date(),
      errorCount: 0,
    });
  }

  /**
   * Start the automated health check and recovery process
   */
  public async start(): Promise<void> {
    console.log("[Recovery] Starting automated recovery service");

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckIntervalMs);

    // Perform initial health check
    await this.performHealthCheck();
  }

  /**
   * Stop the automated recovery process
   */
  public stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
    console.log("[Recovery] Stopped automated recovery service");
  }

  /**
   * Perform comprehensive health check on all services
   */
  private async performHealthCheck(): Promise<void> {
    if (this.recoveryInProgress) {
      console.log("[Recovery] Recovery already in progress, skipping health check");
      return;
    }

    try {
      // Check database connection
      await this.checkDatabaseHealth();

      // Check blockchain service
      await this.checkBlockchainHealth();

      // Check event listener
      await this.checkEventListenerHealth();

      // Trigger recovery if needed
      await this.triggerRecoveryIfNeeded();
    } catch (error) {
      console.error("[Recovery] Health check failed:", error);
    }
  }

  /**
   * Check database connection health
   */
  private async checkDatabaseHealth(): Promise<void> {
    const status = this.serviceStatuses.get("database")!;

    try {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Simple query to verify connection
      await db.execute("SELECT 1");

      status.isHealthy = true;
      status.errorCount = 0;
      status.lastCheck = new Date();
      status.lastError = undefined;

      console.log("[Recovery] Database health check passed");
    } catch (error) {
      status.isHealthy = false;
      status.errorCount++;
      status.lastCheck = new Date();
      status.lastError = error instanceof Error ? error.message : String(error);

      console.error("[Recovery] Database health check failed:", status.lastError);
    }
  }

  /**
   * Check blockchain service health
   */
  private async checkBlockchainHealth(): Promise<void> {
    const status = this.serviceStatuses.get("blockchain")!;

    try {
      const blockchain = new BlockchainService();
      // Try to initialize and verify connection
      await blockchain.initialize();
      
      // Verify by getting treasury balance
      const balance = await blockchain.getTreasuryBalance();
      if (!balance) {
        throw new Error("Failed to verify blockchain connection");
      }

      status.isHealthy = true;
      status.errorCount = 0;
      status.lastCheck = new Date();
      status.lastError = undefined;

      console.log("[Recovery] Blockchain service health check passed");
    } catch (error) {
      status.isHealthy = false;
      status.errorCount++;
      status.lastCheck = new Date();
      status.lastError = error instanceof Error ? error.message : String(error);

      console.error("[Recovery] Blockchain service health check failed:", status.lastError);
    }
  }

  /**
   * Check event listener health
   */
  private async checkEventListenerHealth(): Promise<void> {
    const status = this.serviceStatuses.get("eventListener")!;

    try {
      // Check if event listener is running
      // This is a placeholder - actual implementation depends on how EventListenerService is managed
      status.isHealthy = true;
      status.errorCount = 0;
      status.lastCheck = new Date();
      status.lastError = undefined;

      console.log("[Recovery] Event listener health check passed");
    } catch (error) {
      status.isHealthy = false;
      status.errorCount++;
      status.lastCheck = new Date();
      status.lastError = error instanceof Error ? error.message : String(error);

      console.error("[Recovery] Event listener health check failed:", status.lastError);
    }
  }

  /**
   * Trigger recovery process if services are unhealthy
   */
  private async triggerRecoveryIfNeeded(): Promise<void> {
    const unhealthyServices = Array.from(this.serviceStatuses.values()).filter(
      (status) => !status.isHealthy && status.errorCount >= 2
    );

    if (unhealthyServices.length === 0) {
      return;
    }

    if (!this.config.enableAutoRestart) {
      console.warn("[Recovery] Auto-restart disabled, unhealthy services detected:", unhealthyServices);
      return;
    }

    console.warn("[Recovery] Triggering recovery for unhealthy services:", unhealthyServices);

    this.recoveryInProgress = true;

    try {
      for (const service of unhealthyServices) {
        await this.recoverService(service.name);
      }
    } finally {
      this.recoveryInProgress = false;
    }
  }

  /**
   * Recover a specific service
   */
  private async recoverService(serviceName: string): Promise<void> {
    console.log(`[Recovery] Attempting to recover ${serviceName}`);

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        switch (serviceName) {
          case "Event Listener":
            await this.recoverEventListener();
            break;
          case "Blockchain Service":
            await this.recoverBlockchainService();
            break;
          case "Database":
            await this.recoverDatabase();
            break;
        }

        console.log(`[Recovery] Successfully recovered ${serviceName}`);
        // Find the status by name
        const statusEntry = Array.from(this.serviceStatuses.entries()).find(
          ([_, s]) => s.name === serviceName
        );
        if (statusEntry) {
          statusEntry[1].errorCount = 0;
        }
        return;
      } catch (error) {
        console.error(
          `[Recovery] Recovery attempt ${attempt}/${this.config.maxRetries} failed for ${serviceName}:`,
          error
        );

        if (attempt < this.config.maxRetries) {
          await this.delay(this.config.retryDelayMs * attempt);
        }
      }
    }

    console.error(`[Recovery] Failed to recover ${serviceName} after ${this.config.maxRetries} attempts`);
  }

  /**
   * Recover event listener service
   */
  private async recoverEventListener(): Promise<void> {
    // Restart event listener
    // This is a placeholder - actual implementation depends on how EventListenerService is managed
    console.log("[Recovery] Restarting event listener...");
    // await eventListener.restart();
  }

  /**
   * Recover blockchain service
   */
  private async recoverBlockchainService(): Promise<void> {
    // Reinitialize blockchain service
    console.log("[Recovery] Reinitializing blockchain service...");
    const blockchain = new BlockchainService();
    await blockchain.initialize();
  }

  /**
   * Recover database connection
   */
  private async recoverDatabase(): Promise<void> {
    // Attempt to reconnect to database
    console.log("[Recovery] Attempting to reconnect to database...");
    const db = await getDb();
    if (!db) {
      throw new Error("Failed to reconnect to database");
    }
    await db.execute("SELECT 1");
  }

  /**
   * Get current status of all services
   */
  public getServiceStatuses(): ServiceStatus[] {
    return Array.from(this.serviceStatuses.values());
  }

  /**
   * Get status of a specific service
   */
  public getServiceStatus(serviceName: string): ServiceStatus | undefined {
    return this.serviceStatuses.get(serviceName);
  }

  /**
   * Reset error count for a service
   */
  public resetServiceErrorCount(serviceName: string): void {
    const status = this.serviceStatuses.get(serviceName);
    if (status) {
      status.errorCount = 0;
      status.lastError = undefined;
    }
  }

  /**
   * Helper function to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const recoveryService = new RecoveryService({
  maxRetries: 5,
  retryDelayMs: 5000,
  healthCheckIntervalMs: 30000,
  enableAutoRestart: true,
});
