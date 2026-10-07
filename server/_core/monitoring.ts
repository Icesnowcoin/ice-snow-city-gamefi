/**
 * Monitoring & Alerting Service
 * 
 * Provides transaction monitoring, error alerting, and downtime protection
 * for the Ice Snow City admin system.
 */

import { getDb } from "../db";
import { notifyOwner } from "./notification";

export interface TransactionMonitor {
  txHash: string;
  status: "pending" | "success" | "failed";
  createdAt: Date;
  updatedAt: Date;
  retryCount: number;
  lastError?: string;
}

export interface AlertConfig {
  enableAlerts: boolean;
  alertThresholds: {
    failedTransactionCount: number;
    errorRatePercentage: number;
    eventProcessingDelayMs: number;
  };
}

export interface MonitoringStatus {
  isHealthy: boolean;
  lastCheckTime: Date;
  failedTransactionCount: number;
  successTransactionCount: number;
  errorRate: number;
  averageProcessingTime: number;
  lastAlertTime?: Date;
}

class MonitoringService {
  private alertConfig: AlertConfig = {
    enableAlerts: true,
    alertThresholds: {
      failedTransactionCount: 5,
      errorRatePercentage: 10,
      eventProcessingDelayMs: 60000, // 1 minute
    },
  };

  private transactionMonitors = new Map<string, TransactionMonitor>();
  private lastAlertTime = 0;
  private alertCooldown = 300000; // 5 minutes
  private isHealthy = true;
  private failedTransactionCount = 0;
  private successTransactionCount = 0;
  private processingTimes: number[] = [];
  private lastCheckTime = new Date();

  /**
   * Initialize monitoring service
   */
  async initialize(config?: Partial<AlertConfig>): Promise<void> {
    if (config) {
      this.alertConfig = {
        ...this.alertConfig,
        ...config,
        alertThresholds: {
          ...this.alertConfig.alertThresholds,
          ...(config.alertThresholds || {}),
        },
      };
    }

    console.log("[Monitoring] Service initialized with config:", this.alertConfig);
  }

  /**
   * Track transaction
   */
  trackTransaction(txHash: string, status: "pending" | "success" | "failed"): void {
    const monitor: TransactionMonitor = {
      txHash,
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
      retryCount: 0,
    };

    this.transactionMonitors.set(txHash, monitor);

    if (status === "success") {
      this.successTransactionCount++;
    } else if (status === "failed") {
      this.failedTransactionCount++;
    }

    this.checkHealth();
  }

  /**
   * Update transaction status
   */
  updateTransactionStatus(
    txHash: string,
    status: "pending" | "success" | "failed",
    error?: string
  ): void {
    const monitor = this.transactionMonitors.get(txHash);
    if (monitor) {
      monitor.status = status;
      monitor.updatedAt = new Date();
      if (error) {
        monitor.lastError = error;
      }

      if (status === "success") {
        this.successTransactionCount++;
        this.failedTransactionCount = Math.max(0, this.failedTransactionCount - 1);
      } else if (status === "failed") {
        this.failedTransactionCount++;
        monitor.retryCount++;
      }

      this.checkHealth();
    }
  }

  /**
   * Record event processing time
   */
  recordProcessingTime(timeMs: number): void {
    this.processingTimes.push(timeMs);
    // Keep only last 100 measurements
    if (this.processingTimes.length > 100) {
      this.processingTimes.shift();
    }
  }

  /**
   * Check system health and trigger alerts
   */
  private async checkHealth(): Promise<void> {
    const errorRate =
      this.successTransactionCount + this.failedTransactionCount > 0
        ? (this.failedTransactionCount /
            (this.successTransactionCount + this.failedTransactionCount)) *
          100
        : 0;

    const averageProcessingTime =
      this.processingTimes.length > 0
        ? this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length
        : 0;

    const wasHealthy = this.isHealthy;

    // Check health conditions
    this.isHealthy =
      this.failedTransactionCount < this.alertConfig.alertThresholds.failedTransactionCount &&
      errorRate < this.alertConfig.alertThresholds.errorRatePercentage &&
      averageProcessingTime < this.alertConfig.alertThresholds.eventProcessingDelayMs;

    // Trigger alert if health status changed
    if (!this.isHealthy && wasHealthy && this.alertConfig.enableAlerts) {
      await this.triggerAlert({
        failedTransactionCount: this.failedTransactionCount,
        errorRate,
        averageProcessingTime,
      });
    }

    this.lastCheckTime = new Date();
  }

  /**
   * Trigger alert notification
   */
  private async triggerAlert(metrics: {
    failedTransactionCount: number;
    errorRate: number;
    averageProcessingTime: number;
  }): Promise<void> {
    const now = Date.now();
    if (now - this.lastAlertTime < this.alertCooldown) {
      console.log("[Monitoring] Alert cooldown active, skipping notification");
      return;
    }

    this.lastAlertTime = now;

    try {
      await notifyOwner({
        title: "⚠️ Ice Snow City Admin System Health Alert",
        content: `System health degradation detected:\n\n- Failed Transactions: ${metrics.failedTransactionCount}\n- Error Rate: ${metrics.errorRate.toFixed(2)}%\n- Avg Processing Time: ${metrics.averageProcessingTime.toFixed(0)}ms\n\nPlease check the monitoring dashboard for details.`,
      });

      console.log("[Monitoring] Alert notification sent");
    } catch (error) {
      console.error("[Monitoring] Failed to send alert:", error);
    }
  }

  /**
   * Get monitoring status
   */
  getStatus(): MonitoringStatus {
    const errorRate =
      this.successTransactionCount + this.failedTransactionCount > 0
        ? (this.failedTransactionCount /
            (this.successTransactionCount + this.failedTransactionCount)) *
          100
        : 0;

    const averageProcessingTime =
      this.processingTimes.length > 0
        ? this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length
        : 0;

    return {
      isHealthy: this.isHealthy,
      lastCheckTime: this.lastCheckTime,
      failedTransactionCount: this.failedTransactionCount,
      successTransactionCount: this.successTransactionCount,
      errorRate,
      averageProcessingTime,
      lastAlertTime: this.lastAlertTime > 0 ? new Date(this.lastAlertTime) : undefined,
    };
  }

  /**
   * Get transaction monitor
   */
  getTransactionMonitor(txHash: string): TransactionMonitor | undefined {
    return this.transactionMonitors.get(txHash);
  }

  /**
   * Get all pending transactions
   */
  getPendingTransactions(): TransactionMonitor[] {
    const result: TransactionMonitor[] = [];
    this.transactionMonitors.forEach((monitor) => {
      if (monitor.status === "pending") {
        result.push(monitor);
      }
    });
    return result;
  }

  /**
   * Get failed transactions
   */
  getFailedTransactions(): TransactionMonitor[] {
    const result: TransactionMonitor[] = [];
    this.transactionMonitors.forEach((monitor) => {
      if (monitor.status === "failed") {
        result.push(monitor);
      }
    });
    return result;
  }

  /**
   * Clean up old transaction monitors
   */
  cleanup(maxAgeMs: number = 86400000): void {
    // 24 hours
    const now = Date.now();
    const toDelete: string[] = [];

    this.transactionMonitors.forEach((monitor, txHash) => {
      if (now - monitor.updatedAt.getTime() > maxAgeMs) {
        toDelete.push(txHash);
      }
    });

    toDelete.forEach((txHash) => {
      this.transactionMonitors.delete(txHash);
    });

    console.log(`[Monitoring] Cleaned up ${toDelete.length} old transaction monitors`);
  }

  /**
   * Reset monitoring state (for testing)
   */
  reset(): void {
    this.transactionMonitors.clear();
    this.failedTransactionCount = 0;
    this.successTransactionCount = 0;
    this.processingTimes = [];
    this.isHealthy = true;
    this.lastAlertTime = 0;
    this.lastCheckTime = new Date();
  }
}

// Singleton instance
let monitoringService: MonitoringService | null = null;

export function getMonitoringService(): MonitoringService {
  if (!monitoringService) {
    monitoringService = new MonitoringService();
  }
  return monitoringService;
}

export function resetMonitoringService(): void {
  monitoringService = null;
}

export default MonitoringService;
