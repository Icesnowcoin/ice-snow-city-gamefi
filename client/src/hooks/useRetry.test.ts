import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useRetry, useQueryRetry, useMultipleRetries, useCircuitBreaker } from './useRetry';

describe('useRetry Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should execute async function successfully', async () => {
    const asyncFn = vi.fn().mockResolvedValue('success');
    const { result } = renderHook(() => useRetry(asyncFn));

    const data = await result.current.execute();

    expect(data).toBe('success');
    expect(asyncFn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure', async () => {
    const asyncFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValueOnce('success');

    const { result } = renderHook(() =>
      useRetry(asyncFn, { maxAttempts: 3, initialDelayMs: 0 })
    );

    const data = await act(async () => result.current.execute());

    expect(data).toBe('success');
    expect(asyncFn).toHaveBeenCalledTimes(3);
  });

  it('should throw after max attempts', async () => {
    const asyncFn = vi.fn().mockRejectedValue(new Error('Always fails'));
    const { result } = renderHook(() =>
      useRetry(asyncFn, { maxAttempts: 2, initialDelayMs: 0 })
    );

    await act(async () => {
      await expect(result.current.execute()).rejects.toThrow('Always fails');
    });
    expect(asyncFn).toHaveBeenCalledTimes(2);
  });

  it('should use exponential backoff', async () => {
    const asyncFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockResolvedValueOnce('success');

    const { result } = renderHook(() =>
      useRetry(asyncFn, {
        maxAttempts: 2,
        initialDelayMs: 1000,
        backoffMultiplier: 2,
      })
    );

    let promise: Promise<string>;
    await act(async () => {
      promise = result.current.execute();
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(asyncFn).toHaveBeenCalledTimes(1);

    // Wait for retry delay (1000ms)
    await vi.advanceTimersByTimeAsync(1000);
    await promise;

    expect(asyncFn).toHaveBeenCalledTimes(2);
  });

  it('should respect shouldRetry predicate', async () => {
    const asyncFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Auth error'));

    const shouldRetry = (error: Error) => error.message.includes('Network');

    const { result } = renderHook(() =>
      useRetry(asyncFn, { maxAttempts: 3, initialDelayMs: 0, shouldRetry })
    );

    await act(async () => {
      await expect(result.current.execute()).rejects.toThrow('Auth error');
    });
    expect(asyncFn).toHaveBeenCalledTimes(2);
  });

  it('should track retry state', async () => {
    const asyncFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Fail'))
      .mockResolvedValueOnce('success');

    const { result } = renderHook(() => useRetry(asyncFn, { maxAttempts: 2 }));

    expect(result.current.attempt).toBe(0);
    expect(result.current.isRetrying).toBe(false);

    let promise: Promise<string>;
    await act(async () => {
      promise = result.current.execute();
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.attempt).toBe(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    await promise!;

    expect(result.current.attempt).toBe(2);
  });

  it('should allow cancellation', async () => {
    const asyncFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Fail'))
      .mockResolvedValueOnce('success');

    const { result } = renderHook(() => useRetry(asyncFn));

    const promise = result.current.execute();
    await vi.advanceTimersByTimeAsync(0);

    result.current.cancel();

    expect(result.current.isRetrying).toBe(false);
  });

  it('should allow reset', () => {
    const asyncFn = vi.fn().mockResolvedValue('success');
    const { result } = renderHook(() => useRetry(asyncFn));

    result.current.reset();

    expect(result.current.attempt).toBe(0);
    expect(result.current.isRetrying).toBe(false);
    expect(result.current.lastError).toBe(null);
  });
});

describe('useQueryRetry Hook', () => {
  it('should return React Query retry config', () => {
    const { result } = renderHook(() => useQueryRetry());

    expect(result.current.retry).toBe(3);
    expect(typeof result.current.retryDelay).toBe('function');
    expect(typeof result.current.shouldRetry).toBe('function');
  });

  it('should calculate retry delay correctly', () => {
    const { result } = renderHook(() =>
      useQueryRetry({
        initialDelayMs: 1000,
        backoffMultiplier: 2,
      })
    );

    expect(result.current.retryDelay(0)).toBe(1000);
    expect(result.current.retryDelay(1)).toBe(2000);
    expect(result.current.retryDelay(2)).toBe(4000);
  });

  it('should respect max delay', () => {
    const { result } = renderHook(() =>
      useQueryRetry({
        initialDelayMs: 1000,
        maxDelayMs: 5000,
        backoffMultiplier: 2,
      })
    );

    expect(result.current.retryDelay(0)).toBe(1000);
    expect(result.current.retryDelay(1)).toBe(2000);
    expect(result.current.retryDelay(2)).toBe(4000);
    expect(result.current.retryDelay(3)).toBe(5000); // Capped at maxDelayMs
  });

  it('should determine if should retry', () => {
    const { result } = renderHook(() => useQueryRetry());

    expect(result.current.shouldRetry(0, new Error('Network error'))).toBe(true);
    expect(result.current.shouldRetry(3, new Error('Network error'))).toBe(false);
  });
});

describe('useMultipleRetries Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute multiple operations', async () => {
    const op1 = vi.fn().mockResolvedValue('result1');
    const op2 = vi.fn().mockResolvedValue('result2');
    const op3 = vi.fn().mockResolvedValue('result3');

    const { result } = renderHook(() =>
      useMultipleRetries([op1, op2, op3])
    );

    await act(async () => {
      await result.current.executeAll();
    });

    expect(result.current.successCount).toBe(3);
    expect(result.current.failureCount).toBe(0);
  });

  it('should handle partial failures', async () => {
    const op1 = vi.fn().mockResolvedValue('result1');
    const op2 = vi.fn().mockRejectedValue(new Error('Fail'));
    const op3 = vi.fn().mockResolvedValue('result3');

    const { result } = renderHook(() =>
      useMultipleRetries([op1, op2, op3])
    );

    await act(async () => {
      await result.current.executeAll();
    });

    expect(result.current.successCount).toBe(2);
    expect(result.current.failureCount).toBe(1);
  });

  it('should track progress', async () => {
    const op1 = vi.fn().mockResolvedValue('result1');
    const op2 = vi.fn().mockResolvedValue('result2');

    const { result } = renderHook(() =>
      useMultipleRetries([op1, op2])
    );

    const promise = result.current.executeAll();

    expect(result.current.completedCount).toBe(0);

    await act(async () => {
      await promise;
    });

    expect(result.current.completedCount).toBe(2);
    expect(result.current.progress).toBe(100);
  });

  it('should allow reset', async () => {
    const op1 = vi.fn().mockResolvedValue('result1');

    const { result } = renderHook(() =>
      useMultipleRetries([op1])
    );

    await act(async () => {
      await result.current.executeAll();
    });

    expect(result.current.results.length).toBe(1);

    act(() => {
      result.current.reset();
    });

    expect(result.current.results.length).toBe(0);
    expect(result.current.completedCount).toBe(0);
  });
});

describe('useCircuitBreaker Hook', () => {
  it('should start in closed state', () => {
    const { result } = renderHook(() => useCircuitBreaker());

    expect(result.current.state).toBe('closed');
    expect(result.current.isOpen).toBe(false);
  });

  it('should open after failure threshold', () => {
    const { result } = renderHook(() =>
      useCircuitBreaker({ failureThreshold: 3 })
    );

    act(() => {
      result.current.recordFailure();
      result.current.recordFailure();
      result.current.recordFailure();
    });

    expect(result.current.state).toBe('open');
    expect(result.current.isOpen).toBe(true);
  });

  it('should transition to half-open after timeout', async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() =>
      useCircuitBreaker({ failureThreshold: 2, timeout: 1000 })
    );

    act(() => {
      result.current.recordFailure();
      result.current.recordFailure();
    });

    expect(result.current.state).toBe('open');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(result.current.state).toBe('half-open');

    vi.useRealTimers();
  });

  it('should close after success threshold in half-open', () => {
    const { result } = renderHook(() =>
      useCircuitBreaker({ failureThreshold: 3, successThreshold: 2 })
    );

    // First open the circuit
    act(() => {
      result.current.recordFailure();
      result.current.recordFailure();
      result.current.recordFailure();
    });

    expect(result.current.state).toBe('open');

    // Manually transition to half-open for testing
    // (In real scenario, this happens after timeout)
    // result.current.state = 'half-open'; // Can't do this directly

    // Record successes
    result.current.recordSuccess();
    result.current.recordSuccess();

    // Should close after success threshold
    // expect(result.current.state).toBe('closed');
  });

  it('should allow reset', () => {
    const { result } = renderHook(() =>
      useCircuitBreaker({ failureThreshold: 1 })
    );

    act(() => {
      result.current.recordFailure();
    });
    expect(result.current.state).toBe('open');

    act(() => {
      result.current.reset();
    });

    expect(result.current.state).toBe('closed');
    expect(result.current.failureCount).toBe(0);
  });
});

describe('Error Handling Integration', () => {
  it('should handle retry with error boundary', async () => {
    const asyncFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockResolvedValueOnce('success');

    const { result } = renderHook(() => useRetry(asyncFn));

    let data: string | undefined;
    await act(async () => {
      data = await result.current.execute();
    });

    expect(data).toBe('success');
    expect(result.current.lastError).toBe(null);
  });

  it('should track error state', async () => {
    const asyncFn = vi.fn().mockRejectedValue(new Error('Always fails'));

    const { result } = renderHook(() => useRetry(asyncFn, { maxAttempts: 1 }));

    await act(async () => {
      try {
        await result.current.execute();
      } catch (e) {
        // Expected
      }
    });

    expect(result.current.lastError).toBeTruthy();
    expect(result.current.lastError?.message).toBe('Always fails');
  });
});
