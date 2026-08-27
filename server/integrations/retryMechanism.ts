/**
 * Retry Mechanism with Exponential Backoff
 * Handles automatic retry of failed verification attempts
 */

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterFactor: number;
}

export interface RetryState {
  attempt: number;
  lastError?: Error;
  nextRetryTime?: Date;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 60000, // 1 minute
  backoffMultiplier: 2,
  jitterFactor: 0.1, // 10% jitter
};

/**
 * Calculate delay for next retry with exponential backoff and jitter
 */
export function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  // Calculate exponential backoff: initialDelay * (multiplier ^ attempt)
  let delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);

  // Cap at max delay
  delay = Math.min(delay, config.maxDelayMs);

  // Add jitter: ±jitterFactor * delay
  const jitter = delay * config.jitterFactor * (Math.random() * 2 - 1);
  delay = Math.max(0, delay + jitter);

  return Math.floor(delay);
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onRetry?: (attempt: number, delay: number, error: Error) => void
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < config.maxRetries) {
        const delay = calculateBackoffDelay(attempt, config);
        if (onRetry) {
          onRetry(attempt + 1, delay, lastError);
        }
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry manager for tracking and managing retries
 */
export class RetryManager {
  private retryStates: Map<string, RetryState> = new Map();
  private config: RetryConfig;

  constructor(config: RetryConfig = DEFAULT_RETRY_CONFIG) {
    this.config = config;
  }

  /**
   * Get retry state for an ID
   */
  getRetryState(id: string): RetryState {
    if (!this.retryStates.has(id)) {
      this.retryStates.set(id, { attempt: 0 });
    }
    return this.retryStates.get(id)!;
  }

  /**
   * Check if should retry
   */
  shouldRetry(id: string): boolean {
    const state = this.getRetryState(id);
    return state.attempt < this.config.maxRetries;
  }

  /**
   * Record a failure and get next retry time
   */
  recordFailure(id: string, error: Error): Date | null {
    const state = this.getRetryState(id);
    state.attempt++;
    state.lastError = error;

    if (this.shouldRetry(id)) {
      const delay = calculateBackoffDelay(state.attempt - 1, this.config);
      state.nextRetryTime = new Date(Date.now() + delay);
      return state.nextRetryTime;
    }

    return null;
  }

  /**
   * Record a success and clear retry state
   */
  recordSuccess(id: string): void {
    this.retryStates.delete(id);
  }

  /**
   * Reset retry state for an ID
   */
  reset(id: string): void {
    this.retryStates.delete(id);
  }

  /**
   * Get all retry states
   */
  getAllRetryStates(): Map<string, RetryState> {
    const result = new Map<string, RetryState>();
    this.retryStates.forEach((value, key) => {
      result.set(key, value);
    });
    return result;
  }

  /**
   * Clean up old retry states
   */
  cleanup(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    const idsToDelete: string[] = [];

    this.retryStates.forEach((state, id) => {
      if (state.nextRetryTime && now - state.nextRetryTime.getTime() > maxAgeMs) {
        idsToDelete.push(id);
      }
    });

    for (const id of idsToDelete) {
      this.retryStates.delete(id);
    }
  }
}

/**
 * Global retry manager instance
 */
let globalRetryManager: RetryManager | null = null;

/**
 * Get or create global retry manager
 */
export function getGlobalRetryManager(): RetryManager {
  if (!globalRetryManager) {
    globalRetryManager = new RetryManager();
  }
  return globalRetryManager;
}

/**
 * Async retry queue for processing retries
 */
export class RetryQueue {
  private queue: Array<{
    id: string;
    fn: () => Promise<void>;
    nextRetryTime: Date;
  }> = [];
  private processing = false;
  private interval?: NodeJS.Timeout;

  /**
   * Add item to retry queue
   */
  add(id: string, fn: () => Promise<void>, nextRetryTime: Date): void {
    // Remove existing item with same ID
    this.queue = this.queue.filter((item) => item.id !== id);

    // Add new item
    this.queue.push({ id, fn, nextRetryTime });

    // Sort by retry time
    this.queue.sort((a, b) => a.nextRetryTime.getTime() - b.nextRetryTime.getTime());

    // Start processing if not already running
    if (!this.processing) {
      this.startProcessing();
    }
  }

  /**
   * Start processing queue
   */
  private startProcessing(): void {
    if (this.processing) return;
    this.processing = true;

    this.interval = setInterval(() => {
      this.processQueue();
    }, 1000); // Check every second
  }

  /**
   * Stop processing queue
   */
  stop(): void {
    this.processing = false;
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  /**
   * Process items in queue
   */
  private async processQueue(): Promise<void> {
    const now = new Date();

    while (this.queue.length > 0 && this.queue[0].nextRetryTime <= now) {
      const item = this.queue.shift();
      if (item) {
        try {
          await item.fn();
        } catch (error) {
          console.error(`Error processing retry queue item ${item.id}:`, error);
        }
      }
    }

    // Stop if queue is empty
    if (this.queue.length === 0) {
      this.stop();
    }
  }

  /**
   * Get queue size
   */
  getSize(): number {
    return this.queue.length;
  }

  /**
   * Get queue items
   */
  getItems(): Array<{ id: string; nextRetryTime: Date }> {
    return this.queue.map((item) => ({ id: item.id, nextRetryTime: item.nextRetryTime }));
  }
}

/**
 * Global retry queue instance
 */
let globalRetryQueue: RetryQueue | null = null;

/**
 * Get or create global retry queue
 */
export function getGlobalRetryQueue(): RetryQueue {
  if (!globalRetryQueue) {
    globalRetryQueue = new RetryQueue();
  }
  return globalRetryQueue;
}
