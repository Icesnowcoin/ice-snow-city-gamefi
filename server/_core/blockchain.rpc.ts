/**
 * RPC Failover Manager
 * Handles multiple RPC endpoints with automatic failover
 */

interface RpcEndpoint {
  url: string;
  priority: number;
  lastError?: Error;
  failureCount: number;
  lastUsed?: number;
}

export class RpcFailoverManager {
  private endpoints: RpcEndpoint[] = [];
  private currentIndex: number = 0;
  private readonly maxFailures: number = 3;
  private readonly recoveryTime: number = 60000; // 1 minute

  constructor(urls: string[]) {
    this.endpoints = urls.map((url, index) => ({
      url,
      priority: index,
      failureCount: 0,
    }));
  }

  /**
   * Get the next available RPC endpoint
   */
  getNextEndpoint(): string {
    const now = Date.now();
    
    // Check if current endpoint has recovered
    const current = this.endpoints[this.currentIndex];
    if (current.failureCount >= this.maxFailures && current.lastUsed) {
      if (now - current.lastUsed < this.recoveryTime) {
        // Try next endpoint
        this.currentIndex = (this.currentIndex + 1) % this.endpoints.length;
      } else {
        // Reset failure count and try again
        current.failureCount = 0;
      }
    }

    const endpoint = this.endpoints[this.currentIndex];
    endpoint.lastUsed = now;
    return endpoint.url;
  }

  /**
   * Record a failure for the current endpoint
   */
  recordFailure(error: Error): void {
    const endpoint = this.endpoints[this.currentIndex];
    endpoint.failureCount++;
    endpoint.lastError = error;

    if (endpoint.failureCount >= this.maxFailures) {
      console.warn(`[RPC] Endpoint ${endpoint.url} failed ${endpoint.failureCount} times, switching...`);
      this.currentIndex = (this.currentIndex + 1) % this.endpoints.length;
    }
  }

  /**
   * Record a success for the current endpoint
   */
  recordSuccess(): void {
    const endpoint = this.endpoints[this.currentIndex];
    endpoint.failureCount = Math.max(0, endpoint.failureCount - 1);
    endpoint.lastError = undefined;
  }

  /**
   * Get all endpoints status
   */
  getStatus() {
    return this.endpoints.map((ep, index) => ({
      url: ep.url,
      active: index === this.currentIndex,
      failureCount: ep.failureCount,
      lastError: ep.lastError?.message,
      lastUsed: ep.lastUsed ? new Date(ep.lastUsed).toISOString() : undefined,
    }));
  }

  /**
   * Reset all endpoints
   */
  reset(): void {
    this.endpoints.forEach(ep => {
      ep.failureCount = 0;
      ep.lastError = undefined;
    });
    this.currentIndex = 0;
  }
}

// Default BSC RPC endpoints
export const DEFAULT_BSC_ENDPOINTS = [
  "https://bsc-dataseed1.binance.org:443",
  "https://bsc-dataseed2.binance.org:443",
  "https://bsc-dataseed3.binance.org:443",
  "https://bsc-dataseed4.binance.org:443",
];

// Create global instance
export const rpcFailoverManager = new RpcFailoverManager(
  process.env.BSC_RPC_ENDPOINTS?.split(",") || DEFAULT_BSC_ENDPOINTS
);
