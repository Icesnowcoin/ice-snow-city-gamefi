import { useRef, useCallback, useEffect } from 'react';

export interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface GestureState {
  isLongPress: boolean;
  isDragging: boolean;
  isPinching: boolean;
  startDistance?: number;
  currentDistance?: number;
  scale: number;
}

const LONG_PRESS_DURATION = 500;
const DRAG_THRESHOLD = 10;
const DOUBLE_TAP_DELAY = 300;

export function useTouchInteraction(
  onTap?: (point: TouchPoint) => void,
  onLongPress?: (point: TouchPoint) => void,
  onDrag?: (start: TouchPoint, current: TouchPoint) => void,
  onPinch?: (scale: number) => void,
  onDoubleTap?: (point: TouchPoint) => void
) {
  const touchStartRef = useRef<TouchPoint | null>(null);
  const lastTapRef = useRef<number>(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gestureStateRef = useRef<GestureState>({
    isLongPress: false,
    isDragging: false,
    isPinching: false,
    scale: 1,
  });

  // Calculate distance between two touch points
  const getDistance = useCallback((touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      const point: TouchPoint = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
      };

      touchStartRef.current = point;
      gestureStateRef.current.isDragging = false;
      gestureStateRef.current.isLongPress = false;

      // Handle pinch start
      if (e.touches.length === 2) {
        gestureStateRef.current.isPinching = true;
        const distance = getDistance(e.touches[0], e.touches[1]);
        gestureStateRef.current.startDistance = distance;
        gestureStateRef.current.currentDistance = distance;
      }

      // Set long press timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }

      longPressTimerRef.current = setTimeout(() => {
        if (touchStartRef.current && !gestureStateRef.current.isDragging) {
          gestureStateRef.current.isLongPress = true;
          onLongPress?.(touchStartRef.current);
        }
      }, LONG_PRESS_DURATION);
    },
    [onLongPress, getDistance]
  );

  // Handle touch move
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.touches[0];
      const currentPoint: TouchPoint = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
      };

      // Calculate distance moved
      const dx = currentPoint.x - touchStartRef.current.x;
      const dy = currentPoint.y - touchStartRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Handle pinch
      if (e.touches.length === 2) {
        gestureStateRef.current.isPinching = true;
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        gestureStateRef.current.currentDistance = currentDistance;

        if (
          gestureStateRef.current.startDistance &&
          currentDistance !== gestureStateRef.current.startDistance
        ) {
          const scale = currentDistance / gestureStateRef.current.startDistance;
          gestureStateRef.current.scale = scale;
          onPinch?.(scale);
        }
      }

      // Handle drag
      if (distance > DRAG_THRESHOLD) {
        gestureStateRef.current.isDragging = true;

        // Cancel long press if dragging
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
        }

        onDrag?.(touchStartRef.current, currentPoint);
      }
    },
    [onDrag, onPinch, getDistance]
  );

  // Handle touch end
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;

      // Cancel long press timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }

      // Handle tap (not dragging, not long press)
      if (
        !gestureStateRef.current.isDragging &&
        !gestureStateRef.current.isLongPress
      ) {
        const now = Date.now();
        const timeSinceLastTap = now - lastTapRef.current;

        // Double tap detection
        if (timeSinceLastTap < DOUBLE_TAP_DELAY) {
          onDoubleTap?.(touchStartRef.current);
          lastTapRef.current = 0; // Reset to prevent triple tap
        } else {
          onTap?.(touchStartRef.current);
          lastTapRef.current = now;
        }
      }

      // Reset gesture state
      gestureStateRef.current = {
        isLongPress: false,
        isDragging: false,
        isPinching: false,
        scale: 1,
      };

      touchStartRef.current = null;
    },
    [onTap, onLongPress, onDoubleTap]
  );

  // Handle touch cancel
  const handleTouchCancel = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    gestureStateRef.current = {
      isLongPress: false,
      isDragging: false,
      isPinching: false,
      scale: 1,
    };

    touchStartRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    gestureState: gestureStateRef.current,
  };
}

// Debounce hook for touch events
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

// Throttle hook for touch events
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallRef.current;

      if (timeSinceLastCall >= delay) {
        lastCallRef.current = now;
        callback(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          callback(...args);
        }, delay - timeSinceLastCall);
      }
    },
    [callback, delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
}
