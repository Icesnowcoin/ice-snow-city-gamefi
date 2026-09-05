import { useCallback, useRef, useState } from 'react';

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
    shouldRetry?: (error: Error, attemptNumber: number) => boolean;
}

/**
 * Retry state
 */
export interface RetryState {
  isRetrying: boolean;
  attempt: number;
  maxAttempts: number;
  lastError: Error | null;
  nextRetryIn: number; // milliseconds
}

/**
 * Hook for retrying async operations with exponential backoff
 */
export function useRetry<T>(
  asyncFn: () => Promise<T>,
  config: RetryConfig = {}
) {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
    shouldRetry = () => true,
  } = config;

  const [state, setState] = useState<RetryState>({
    isRetrying: false,
    attempt: 0,
    maxAttempts,
    lastError: null,
    nextRetryIn: 0,
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);

  const calculateDelay = useCallback(
    (attempt: number) => {
      const delay = Math.min(
        initialDelayMs * Math.pow(backoffMultiplier, attempt),
        maxDelayMs
      );
      return delay;
    },
    [initialDelayMs, maxDelayMs, backoffMultiplier]
  );

  const execute = useCallback(async (): Promise<T> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        setState({
          isRetrying: attempt > 0,
          attempt: attempt + 1,
          maxAttempts,
          lastError: null,
          nextRetryIn: 0,
        });

        const result = await asyncFn();
        setState({
          isRetrying: false,
          attempt: attempt + 1,
          maxAttempts,
          lastError: null,
          nextRetryIn: 0,
        });
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if we should retry
        if (attempt < maxAttempts - 1 && shouldRetry(lastError, attempt + 1)) {
          const delay = calculateDelay(attempt);
          setState({
            isRetrying: true,
            attempt: attempt + 1,
            maxAttempts,
            lastError,
            nextRetryIn: delay,
          });

          // Wait before retrying; avoid creating a timer for zero-delay retries.
          if (delay <= 0) {
            await Promise.resolve();
          } else {
            await new Promise((resolve) => {
              timeoutRef.current = setTimeout(resolve, delay);
            });
          }
        } else {
          setState({
            isRetrying: false,
            attempt: attempt + 1,
            maxAttempts,
            lastError,
            nextRetryIn: 0,
          });

          throw lastError;
        }
      }
    }

    throw lastError || new Error('Unknown error');
  }, [asyncFn, maxAttempts, shouldRetry, calculateDelay]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState((prev) => ({
      ...prev,
      isRetrying: false,
      nextRetryIn: 0,
    }));
  }, []);

  const reset = useCallback(() => {
    cancel();
    setState({
      isRetrying: false,
      attempt: 0,
      maxAttempts,
      lastError: null,
      nextRetryIn: 0,
    });
  }, [cancel, maxAttempts]);

  return {
    ...state,
    execute,
    cancel,
    reset,
    canRetry: state.attempt < maxAttempts,
  };
}

/**
 * Hook for retrying with React Query
 */
export function useQueryRetry(config: RetryConfig = {}) {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
    shouldRetry = (error: Error) => {
      // Retry on network errors or 5xx errors
      const message = error.message.toLowerCase();
      return (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('500') ||
        message.includes('502') ||
        message.includes('503')
      );
    },
  } = config;

  return {
    retry: maxAttempts,
    retryDelay: (attemptIndex: number) => {
      const delay = Math.min(
        initialDelayMs * Math.pow(backoffMultiplier, attemptIndex),
        maxDelayMs
      );
      return delay;
    },
    shouldRetry: (failureCount: number, error: any) => {
      if (failureCount >= maxAttempts) return false;
      const err = error instanceof Error ? error : new Error(String(error));
      return shouldRetry(err, failureCount);
    },
  };
}

/**
 * Hook for managing multiple retries
 */
export function useMultipleRetries(operations: Array<() => Promise<any>>, config: RetryConfig = {}) {
  const [results, setResults] = useState<Array<{ success: boolean; data?: any; error?: Error }>>([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const executeAll = useCallback(async () => {
    setIsRetrying(true);
    setCompletedCount(0);
    const operationResults: Array<{ success: boolean; data?: any; error?: Error }> = [];

    for (let i = 0; i < operations.length; i++) {
      try {
        const data = await operations[i]();
        operationResults.push({ success: true, data });
      } catch (error) {
        operationResults.push({
          success: false,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
      setCompletedCount(i + 1);
    }

    setResults(operationResults);
    setIsRetrying(false);
  }, [operations]);

  const reset = useCallback(() => {
    setResults([]);
    setIsRetrying(false);
    setCompletedCount(0);
  }, []);

  return {
    results,
    isRetrying,
    completedCount,
    totalCount: operations.length,
    progress: (completedCount / operations.length) * 100,
    executeAll,
    reset,
    successCount: results.filter((r) => r.success).length,
    failureCount: results.filter((r) => !r.success).length,
  };
}

/**
 * Hook for circuit breaker pattern
 */
export function useCircuitBreaker(config: {
  failureThreshold?: number;
  successThreshold?: number;
  timeout?: number;
} = {}) {
  const {
    failureThreshold = 5,
    successThreshold = 2,
    timeout = 60000,
  } = config;

  const [state, setState] = useState<'closed' | 'open' | 'half-open'>('closed');
  const [failureCount, setFailureCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const stateRef = useRef<'closed' | 'open' | 'half-open'>('closed');
  const failureCountRef = useRef(0);
  const successCountRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const recordSuccess = useCallback(() => {
    if (stateRef.current === 'half-open') {
      const newCount = successCountRef.current + 1;
      successCountRef.current = newCount;
      setSuccessCount(newCount);
      if (newCount >= successThreshold) {
        stateRef.current = 'closed';
        failureCountRef.current = 0;
        successCountRef.current = 0;
        setState('closed');
        setFailureCount(0);
        setSuccessCount(0);
      }
    } else if (stateRef.current === 'closed') {
      failureCountRef.current = 0;
      setFailureCount(0);
    }
  }, [successThreshold]);

  const recordFailure = useCallback(() => {
    const newCount = failureCountRef.current + 1;
    failureCountRef.current = newCount;
    setFailureCount(newCount);
    if (newCount >= failureThreshold && stateRef.current === 'closed') {
      stateRef.current = 'open';
      setState('open');
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        stateRef.current = 'half-open';
        failureCountRef.current = 0;
        successCountRef.current = 0;
        setState('half-open');
        setFailureCount(0);
        setSuccessCount(0);
      }, timeout);
    }
  }, [failureThreshold, timeout]);

  const reset = useCallback(() => {
    stateRef.current = 'closed';
    failureCountRef.current = 0;
    successCountRef.current = 0;
    setState('closed');
    setFailureCount(0);
    setSuccessCount(0);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return {
    state,
    failureCount,
    successCount,
    recordSuccess,
    recordFailure,
    reset,
    isOpen: state === 'open',
    isHalfOpen: state === 'half-open',
  };
}
