/**
 * Enhanced Event Listener Module with Health Checks and Recovery
 * 
 * Extends the base EventListenerService with:
 * - Periodic health checks
 * - Automatic restart on failure
 * - Metrics collection and reporting
 * - Failover RPC endpoint support
 */

import { ethers } from "ethers";
import { EventListenerService } from "./eventListener";
import { auditLogService } from "./auditLog";

interface HealthCheckConfig {
  intervalMs?: number;
  maxFailures?: number;
  failureThresholdMs?: number;
}

interface HealthStatus {
  isHealthy: boolean;
  lastCheck: Date;
  consecutiveFailures: number;
  uptime: number;
  eventsProcessed: number;
  lastError?: string;
}

interface RecoveryMetrics {
  restarts: number;
  failovers: number;
  lastRestart: Date | null;
  lastFailover: Date | null;
  totalDowntime: number;
}

/**
 * Enhanced Event Listener with Health Checks
 */
export class EnhancedEventListener {
  private baseListener: EventListenerService;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private consecutiveFailures = 0;
  private lastHealthCheck: Date | null = null;
  private startTime: Date = new Date();
  private metrics: RecoveryMetrics = {
    restarts: 0,
    failovers: 0,
    lastRestart: null,
    lastFailover: null,
    totalDowntime: 0,
  };
  private rpcEndpoints: string[] = [];
  private currentRpcIndex = 0;
  private lastError: string | null = null;

  constructor(baseListener: EventListenerService) {
    this.baseListener = baseListener;
    // Initialize RPC endpoints with fallbacks
    this.rpcEndpoints = [
      process.env.BSC_RPC_URL || "https://bsc-dataseed1.binance.org:443",
      "https://bsc-dataseed2.binance.org:443",
      "https://bsc-dataseed3.binance.org:443",
      "https://bsc-dataseed4.binance.org:443",
    ];
  }

  /**
   * Start health checks
   */
  async startHealthChecks(config: HealthCheckConfig = {}): Promise<void> {
    const intervalMs = config.intervalMs || 60000; // 1 minute
    const maxFailures = config.maxFailures || 3;
    const failureThresholdMs = config.failureThresholdMs || 300000; // 5 minutes

    console.log("[EnhancedEventListener] Starting health checks every", intervalMs, "ms");

    this.healthCheckInterval = setInterval(async () => {
      try {
        const status = this.baseListener.getStatus();
        const now = new Date();

        // Check if listener is running
        if (!status.isRunning) {
          this.consecutiveFailures++;
          console.warn(
            `[EnhancedEventListener] Health check failed: listener not running (${this.consecutiveFailures}/${maxFailures})`
          );

          if (this.consecutiveFailures >= maxFailures) {
            console.error("[EnhancedEventListener] Max failures reached, attempting recovery");
            await this.attemptRecovery();
          }
        } else {
          // Listener is running, reset failure counter
          this.consecutiveFailures = 0;
          this.lastError = null;
        }

        this.lastHealthCheck = now;

        // Log health status
        await auditLogService.logAction({
          userId: "system",
          action: "HEALTH_CHECK",
          resource: "event_listener",
          status: status.isRunning ? "success" : "failure",
          details: {
            isRunning: status.isRunning,
            lastProcessedBlock: status.lastProcessedBlock,
            reconnectAttempts: status.reconnectAttempts,
            processedEventCount: status.processedEventCount,
            consecutiveFailures: this.consecutiveFailures,
          },
        });
      } catch (error) {
        console.error("[EnhancedEventListener] Health check error:", error);
        this.lastError = String(error);
      }
    }, intervalMs);
  }

  /**
   * Stop health checks
   */
  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log("[EnhancedEventListener] Health checks stopped");
    }
  }

  /**
   * Attempt recovery with automatic restart
   */
  private async attemptRecovery(): Promise<void> {
    try {
      console.log("[EnhancedEventListener] Attempting recovery");

      // Stop current listener
      this.baseListener.stop();
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

      // Try failover to next RPC endpoint
      const nextRpc = this.getNextRpcEndpoint();
      console.log(`[EnhancedEventListener] Failing over to RPC: ${nextRpc}`);

      // Log recovery attempt
      await auditLogService.logAction({
        userId: "system",
        action: "RECOVERY_ATTEMPT",
        resource: "event_listener",
        status: "success",
        details: {
          rpcEndpoint: nextRpc,
          consecutiveFailures: this.consecutiveFailures,
          restartCount: this.metrics.restarts,
        },
      });

      // Restart listener
      await this.baseListener.start();
      this.consecutiveFailures = 0;
      this.metrics.restarts++;
      this.metrics.lastRestart = new Date();

      console.log("[EnhancedEventListener] Recovery completed successfully");
    } catch (error) {
      console.error("[EnhancedEventListener] Recovery failed:", error);
      this.lastError = String(error);

      // Log recovery failure
      await auditLogService.logAction({
        userId: "system",
        action: "RECOVERY_FAILED",
        resource: "event_listener",
        status: "failure",
        details: {
          error: String(error),
          consecutiveFailures: this.consecutiveFailures,
        },
      });
    }
  }

  /**
   * Get next RPC endpoint for failover
   */
  private getNextRpcEndpoint(): string {
    this.currentRpcIndex = (this.currentRpcIndex + 1) % this.rpcEndpoints.length;
    this.metrics.failovers++;
    this.metrics.lastFailover = new Date();
    return this.rpcEndpoints[this.currentRpcIndex];
  }

  /**
   * Get health status
   */
  getHealthStatus(): HealthStatus {
    const baseStatus = this.baseListener.getStatus();
    const uptime = Date.now() - this.startTime.getTime();

    return {
      isHealthy: baseStatus.isRunning && this.consecutiveFailures === 0,
      lastCheck: this.lastHealthCheck || new Date(),
      consecutiveFailures: this.consecutiveFailures,
      uptime,
      eventsProcessed: baseStatus.processedEventCount,
      lastError: this.lastError || undefined,
    };
  }

  /**
   * Get recovery metrics
   */
  getRecoveryMetrics(): RecoveryMetrics {
    return { ...this.metrics };
  }

  /**
   * Get detailed status report
   */
  getStatusReport(): {
    health: HealthStatus;
    metrics: RecoveryMetrics;
    baseStatus: ReturnType<EventListenerService["getStatus"]>;
  } {
    return {
      health: this.getHealthStatus(),
      metrics: this.getRecoveryMetrics(),
      baseStatus: this.baseListener.getStatus(),
    };
  }
}

// Export singleton instance
let enhancedListenerInstance: EnhancedEventListener | null = null;

export async function getEnhancedEventListener(
  baseListener: EventListenerService
): Promise<EnhancedEventListener> {
  if (!enhancedListenerInstance) {
    enhancedListenerInstance = new EnhancedEventListener(baseListener);
  }
  return enhancedListenerInstance;
}

