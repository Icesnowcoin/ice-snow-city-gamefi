import { useState, useCallback, useRef } from 'react';

/**
 * Loading state type definition
 */
export interface LoadingStateInfo {
  isLoading: boolean;
  progress: number; // 0-100
  message?: string;
  error?: string;
}

/**
 * Hook for managing loading state with progress tracking
 * Useful for batch operations and multi-step loading processes
 */
export function useLoadingState(initialMessage?: string) {
  const [state, setState] = useState<LoadingStateInfo>({
    isLoading: false,
    progress: 0,
    message: initialMessage,
  });

  const startLoading = useCallback((message?: string) => {
    setState({
      isLoading: true,
      progress: 0,
      message: message || '加载中...',
      error: undefined,
    });
  }, []);

  const updateProgress = useCallback((progress: number, message?: string) => {
    setState((prev) => ({
      ...prev,
      progress: Math.min(Math.max(progress, 0), 100),
      message: message || prev.message,
    }));
  }, []);

  const setError = useCallback((error: string) => {
    setState((prev) => ({
      ...prev,
      isLoading: false,
      error,
    }));
  }, []);

  const finishLoading = useCallback((message?: string) => {
    setState({
      isLoading: false,
      progress: 100,
      message: message || '加载完成',
      error: undefined,
    });
  }, []);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      progress: 0,
      message: initialMessage,
      error: undefined,
    });
  }, [initialMessage]);

  return {
    ...state,
    startLoading,
    updateProgress,
    setError,
    finishLoading,
    reset,
  };
}

/**
 * Hook for managing batch loading state
 * Tracks progress of multiple concurrent operations
 */
export function useBatchLoadingState(totalItems: number) {
  const [loadedItems, setLoadedItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const progress = totalItems > 0 ? (loadedItems / totalItems) * 100 : 0;

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setLoadedItems(0);
    setError(undefined);
  }, []);

  const incrementLoaded = useCallback(() => {
    setLoadedItems((prev) => Math.min(prev + 1, totalItems));
  }, [totalItems]);

  const setLoaded = useCallback((count: number) => {
    setLoadedItems(Math.min(Math.max(count, 0), totalItems));
  }, [totalItems]);

  const finishLoading = useCallback(() => {
    setIsLoading(false);
    setLoadedItems(totalItems);
  }, [totalItems]);

  const handleError = useCallback((err: string) => {
    setIsLoading(false);
    setError(err);
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setLoadedItems(0);
    setError(undefined);
  }, []);

  return {
    isLoading,
    loadedItems,
    totalItems,
    progress,
    error,
    startLoading,
    incrementLoaded,
    setLoaded,
    finishLoading,
    handleError,
    reset,
  };
}

/**
 * Hook for managing sequential loading state
 * Useful for operations that load data in stages
 */
export function useSequentialLoadingState(stages: string[]) {
  const [currentStage, setCurrentStage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const progress = ((currentStage + 1) / stages.length) * 100;
  const currentMessage = stages[currentStage] || '加载中...';

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setCurrentStage(0);
    setError(undefined);
  }, []);

  const nextStage = useCallback(() => {
    setCurrentStage((prev) => Math.min(prev + 1, stages.length - 1));
  }, [stages.length]);

  const finishLoading = useCallback(() => {
    setIsLoading(false);
    setCurrentStage(stages.length - 1);
  }, [stages.length]);

  const handleError = useCallback((err: string) => {
    setIsLoading(false);
    setError(err);
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setCurrentStage(0);
    setError(undefined);
  }, []);

  return {
    isLoading,
    currentStage,
    currentMessage,
    progress,
    error,
    startLoading,
    nextStage,
    finishLoading,
    handleError,
    reset,
  };
}

/**
 * Hook for debouncing loading state
 * Prevents flickering when loading completes quickly
 */
export function useDebouncedLoadingState(delay: number = 300) {
  const [isLoading, setIsLoading] = useState(false);
  const [displayLoading, setDisplayLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    // Delay showing loading state to prevent flickering
    timeoutRef.current = setTimeout(() => {
      setDisplayLoading(true);
    }, delay);
  }, [delay]);

  const finishLoading = useCallback(() => {
    setIsLoading(false);
    setDisplayLoading(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setDisplayLoading(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    isLoading,
    displayLoading,
    startLoading,
    finishLoading,
    reset,
  };
}

/**
 * Hook for managing multiple loading states
 * Useful for components that load multiple data sources
 */
export function useMultipleLoadingStates(keys: string[]) {
  const [states, setStates] = useState<Record<string, boolean>>(
    keys.reduce((acc, key) => ({ ...acc, [key]: false }), {} as Record<string, boolean>)
  );

  const setLoading = useCallback((key: string, isLoading: boolean) => {
    setStates((prev) => ({ ...prev, [key]: isLoading }));
  }, []);

  const isAnyLoading = Object.values(states).some((v) => v);
  const isAllLoading = Object.values(states).every((v) => v);

  const reset = useCallback(() => {
    setStates(keys.reduce((acc, key) => ({ ...acc, [key]: false }), {} as Record<string, boolean>));
  }, [keys]);

  return {
    states,
    setLoading,
    isAnyLoading,
    isAllLoading,
    reset,
  };
}

/**
 * Hook for managing loading state with timeout
 * Automatically marks as failed if loading takes too long
 */
export function useLoadingStateWithTimeout(timeout: number = 10000) {
  const [isLoading, setIsLoading] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setIsTimedOut(false);

    timeoutRef.current = setTimeout(() => {
      setIsTimedOut(true);
      setIsLoading(false);
    }, timeout);
  }, [timeout]);

  const finishLoading = useCallback(() => {
    setIsLoading(false);
    setIsTimedOut(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setIsTimedOut(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    isLoading,
    isTimedOut,
    startLoading,
    finishLoading,
    reset,
  };
}
