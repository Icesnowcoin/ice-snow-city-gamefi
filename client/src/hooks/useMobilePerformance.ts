import { useEffect, useRef, useCallback } from 'react';

export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  lastMeasure: number;
}

/**
 * Hook for monitoring and optimizing mobile performance
 */
export function useMobilePerformance(enabled: boolean = true) {
  const metricsRef = useRef<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    renderTime: 0,
    lastMeasure: Date.now(),
  });

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  const rafIdRef = useRef<number | null>(null);

  // Calculate FPS
  const measureFPS = useCallback(() => {
    frameCountRef.current++;
    const now = Date.now();
    const elapsed = now - lastTimeRef.current;

    if (elapsed >= 1000) {
      metricsRef.current.fps = frameCountRef.current;
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }

    if (enabled) {
      rafIdRef.current = requestAnimationFrame(measureFPS);
    }
  }, [enabled]);

  // Measure memory usage (if available)
  const measureMemory = useCallback(() => {
    if ((performance as any).memory) {
      metricsRef.current.memoryUsage = (performance as any).memory.usedJSHeapSize / 1048576; // Convert to MB
    }
  }, []);

  // Get metrics
  const getMetrics = useCallback(() => {
    measureMemory();
    return { ...metricsRef.current };
  }, [measureMemory]);

  // Start monitoring
  useEffect(() => {
    if (enabled) {
      measureFPS();
    }

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [enabled, measureFPS]);

  return {
    metrics: metricsRef.current,
    getMetrics,
  };
}

/**
 * Hook for lazy loading images on mobile
 */
export function useLazyLoadImage(ref: React.RefObject<HTMLImageElement>) {
  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
              observer.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: '50px',
      }
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref]);
}

/**
 * Hook for virtual scrolling on mobile lists
 */
export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  items: any[];
  overscan?: number;
}

export function useVirtualScroll({
  itemHeight,
  containerHeight,
  items,
  overscan = 3,
}: VirtualScrollOptions) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    offsetY,
    startIndex,
    endIndex,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    },
  };
}

/**
 * Hook for debouncing resize events on mobile
 */
export function useWindowResize(callback: () => void, delay: number = 250) {
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback();
      }, delay);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [callback, delay]);
}

/**
 * Hook for managing viewport dimensions on mobile
 */
export function useViewportDimensions() {
  const [dimensions, setDimensions] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    isPortrait: typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : true,
  });

  useWindowResize(() => {
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
      isPortrait: window.innerHeight > window.innerWidth,
    });
  });

  return dimensions;
}

/**
 * Hook for reducing motion on mobile
 */
export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook for managing battery status on mobile
 */
export function useBatteryStatus() {
  const [batteryStatus, setBatteryStatus] = React.useState({
    level: 1,
    charging: true,
    chargingTime: 0,
    dischargingTime: 0,
  });

  useEffect(() => {
    const getBatteryStatus = async () => {
      try {
        const battery = await (navigator as any).getBattery?.();
        if (battery) {
          const updateStatus = () => {
            setBatteryStatus({
              level: battery.level,
              charging: battery.charging,
              chargingTime: battery.chargingTime,
              dischargingTime: battery.dischargingTime,
            });
          };

          updateStatus();

          battery.addEventListener('levelchange', updateStatus);
          battery.addEventListener('chargingchange', updateStatus);
          battery.addEventListener('chargingtimechange', updateStatus);
          battery.addEventListener('dischargingtimechange', updateStatus);

          return () => {
            battery.removeEventListener('levelchange', updateStatus);
            battery.removeEventListener('chargingchange', updateStatus);
            battery.removeEventListener('chargingtimechange', updateStatus);
            battery.removeEventListener('dischargingtimechange', updateStatus);
          };
        }
      } catch (error) {
        console.error('Battery Status API not available:', error);
      }
    };

    getBatteryStatus();
  }, []);

  return batteryStatus;
}

// Re-export React for convenience
import React from 'react';
