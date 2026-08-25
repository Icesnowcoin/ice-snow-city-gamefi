import * as React from "react";
import { X } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

export type MobileBottomSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  testId?: string;
  haptic?: "none" | "light" | "medium";
  dismissible?: boolean;
  /** Enables native downward swipe-to-dismiss behavior. */
  swipeToClose?: boolean;
  /** Fraction of sheet height that must be dragged before closing. */
  swipeCloseThreshold?: number;
  /** Called after a horizontal swipe crosses the threshold. Return false when at a boundary. */
  onHorizontalSwipe?: (direction: "left" | "right") => boolean | void;
  /** Fraction of sheet width required to switch on a horizontal swipe. */
  horizontalSwipeThreshold?: number;
};

export type MobileHapticPattern = "none" | "light" | "medium" | "success";

export function triggerMobileHaptic(pattern: MobileHapticPattern): void {
  if (
    pattern === "none" ||
    typeof navigator === "undefined" ||
    typeof navigator.vibrate !== "function"
  )
    return;

  const vibration = {
    light: 10,
    medium: 24,
    success: [12, 24, 12],
  }[pattern];

  navigator.vibrate(vibration);
}

function triggerHapticFeedback(level: MobileBottomSheetProps["haptic"]): void {
  triggerMobileHaptic(level ?? "none");
}

/**
 * Mobile-first bottom action surface. The underlying Vaul drawer provides
 * touch drag-to-dismiss, focus management, Escape handling, and a11y dialog semantics.
 */
export function MobileBottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  contentClassName,
  testId,
  haptic = "light",
  dismissible = true,
  swipeToClose = true,
  swipeCloseThreshold = 0.25,
  onHorizontalSwipe,
  horizontalSwipeThreshold = 0.22,
}: MobileBottomSheetProps) {
  const previousOpenRef = React.useRef(open);
  const thresholdReachedRef = React.useRef(false);
  const gestureStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const gestureAxisRef = React.useRef<"horizontal" | "vertical" | null>(null);
  const gestureDeltaRef = React.useRef({ x: 0, y: 0 });
  const sheetContentRef = React.useRef<HTMLDivElement>(null);
  const [dragProgress, setDragProgress] = React.useState(0);
  const [horizontalSwipeProgress, setHorizontalSwipeProgress] =
    React.useState(0);
  const [gestureAxis, setGestureAxis] = React.useState<
    "horizontal" | "vertical" | null
  >(null);

  React.useEffect(() => {
    if (previousOpenRef.current !== open) {
      triggerHapticFeedback(haptic);
      previousOpenRef.current = open;
    }

    if (!open) {
      thresholdReachedRef.current = false;
      setDragProgress(0);
      setHorizontalSwipeProgress(0);
      setGestureAxis(null);
      gestureAxisRef.current = null;
      gestureDeltaRef.current = { x: 0, y: 0 };
    }
  }, [haptic, open]);

  const handleDrag = React.useCallback(
    (_event: React.PointerEvent<HTMLDivElement>, percentageDragged: number) => {
      if (!swipeToClose) return;

      const progress = Math.min(1, Math.max(0, percentageDragged));
      setDragProgress(progress);

      if (progress >= swipeCloseThreshold && !thresholdReachedRef.current) {
        triggerMobileHaptic("light");
        thresholdReachedRef.current = true;
      } else if (progress < swipeCloseThreshold) {
        thresholdReachedRef.current = false;
      }
    },
    [swipeCloseThreshold, swipeToClose]
  );

  const handleRelease = React.useCallback(() => {
    thresholdReachedRef.current = false;
    gestureStartRef.current = null;
    gestureAxisRef.current = null;
    gestureDeltaRef.current = { x: 0, y: 0 };
    setDragProgress(0);
    setHorizontalSwipeProgress(0);
    setGestureAxis(null);
  }, []);

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!swipeToClose || event.pointerType === "mouse") return;

      const target = event.target instanceof HTMLElement ? event.target : null;
      const scrollContainer = target?.closest<HTMLElement>(
        "[data-bottom-sheet-scroll]"
      );
      const isGestureSurface = Boolean(target?.closest("[data-swipe-handle]"));
      const isInteractive = Boolean(
        target?.closest("button,a,input,textarea,select,[data-vaul-no-drag]")
      );

      if (
        (!isGestureSurface && isInteractive) ||
        (scrollContainer && scrollContainer.scrollTop > 0)
      )
        return;

      gestureStartRef.current = {
        x: event.pageX || event.clientX,
        y: event.pageY || event.clientY,
      };
      gestureAxisRef.current = null;
      gestureDeltaRef.current = { x: 0, y: 0 };
      setGestureAxis(null);
    },
    [swipeToClose]
  );

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const start = gestureStartRef.current;
      if (!start || !swipeToClose) return;

      const currentX = event.pageX || event.clientX;
      const currentY = event.pageY || event.clientY;
      const deltaX = currentX - start.x;
      const deltaY = currentY - start.y;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      gestureDeltaRef.current = { x: deltaX, y: deltaY };
      const directionThreshold = 8;

      if (
        !gestureAxisRef.current &&
        Math.max(absDeltaX, absDeltaY) >= directionThreshold
      ) {
        const nextAxis = absDeltaX > absDeltaY ? "horizontal" : "vertical";
        gestureAxisRef.current = nextAxis;
        setGestureAxis(nextAxis);
        if (nextAxis === "horizontal") {
          thresholdReachedRef.current = false;
          setDragProgress(0);
        }
      }

      if (gestureAxisRef.current === "horizontal") {
        const sheetWidth =
          sheetContentRef.current?.getBoundingClientRect().width || 1;
        setHorizontalSwipeProgress(Math.min(1, absDeltaX / sheetWidth));
        return;
      }

      if (gestureAxisRef.current !== "vertical") return;

      if (deltaY <= 0) {
        handleRelease();
        return;
      }

      const sheetHeight =
        sheetContentRef.current?.getBoundingClientRect().height || 1;
      const progress = Math.min(1, Math.max(0, deltaY / sheetHeight));
      setDragProgress(progress);

      if (progress >= swipeCloseThreshold && !thresholdReachedRef.current) {
        triggerMobileHaptic("light");
        thresholdReachedRef.current = true;
      }
    },
    [handleRelease, swipeCloseThreshold, swipeToClose]
  );

  const handlePointerUp = React.useCallback(() => {
    const shouldClose = Boolean(
      gestureStartRef.current &&
        gestureAxisRef.current === "vertical" &&
        thresholdReachedRef.current &&
        dismissible &&
        swipeToClose
    );
    const sheetWidth =
      sheetContentRef.current?.getBoundingClientRect().width || 1;
    const safeHorizontalThreshold = Math.min(
      0.8,
      Math.max(0.1, horizontalSwipeThreshold)
    );
    const horizontalProgress = Math.abs(gestureDeltaRef.current.x) / sheetWidth;
    const horizontalDirection =
      gestureAxisRef.current === "horizontal" &&
      horizontalProgress >= safeHorizontalThreshold
        ? gestureDeltaRef.current.x < 0
          ? "left"
          : "right"
        : null;
    const horizontalResult =
      horizontalDirection && onHorizontalSwipe
        ? onHorizontalSwipe(horizontalDirection)
        : null;

    if (horizontalDirection && onHorizontalSwipe) {
      triggerMobileHaptic(horizontalResult === false ? "light" : "medium");
    }

    handleRelease();
    if (shouldClose) onOpenChange(false);
  }, [
    dismissible,
    handleRelease,
    horizontalSwipeThreshold,
    onHorizontalSwipe,
    onOpenChange,
    swipeToClose,
  ]);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      onOpenChange(nextOpen);
    },
    [onOpenChange]
  );

  return (
    <Drawer
      open={open}
      onOpenChange={handleOpenChange}
      direction="bottom"
      dismissible={dismissible}
      closeThreshold={swipeCloseThreshold}
      onDrag={swipeToClose ? handleDrag : undefined}
      onRelease={swipeToClose ? handleRelease : undefined}
      shouldScaleBackground={false}
    >
      <DrawerContent
        ref={sheetContentRef}
        data-testid={testId}
        data-swipe-progress={dragProgress.toFixed(2)}
        data-horizontal-swipe-progress={horizontalSwipeProgress.toFixed(2)}
        data-gesture-axis={gestureAxis ?? undefined}
        onPointerDownCapture={swipeToClose ? handlePointerDown : undefined}
        onPointerMoveCapture={swipeToClose ? handlePointerMove : undefined}
        onPointerUpCapture={swipeToClose ? handlePointerUp : undefined}
        onPointerCancelCapture={swipeToClose ? handleRelease : undefined}
        className={cn(
          "max-h-[88vh] touch-pan-y border-cyan-400/20 bg-slate-950/98 text-slate-100 shadow-[0_-20px_80px_rgba(8,145,178,0.2)]",
          "pb-[max(1rem,env(safe-area-inset-bottom))]",
          "transition-[box-shadow] duration-150 motion-reduce:transition-none",
          className
        )}
      >
        <DrawerHeader className="px-4 pb-3 pt-2 text-left sm:px-6">
          <div
            data-testid={testId ? `${testId}-drag-handle` : undefined}
            data-swipe-handle="true"
            className="mx-auto mb-3 h-1.5 w-12 touch-none rounded-full bg-cyan-300/40 transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none"
            onPointerDown={swipeToClose ? handlePointerDown : undefined}
            onPointerMove={swipeToClose ? handlePointerMove : undefined}
            onPointerUp={swipeToClose ? handlePointerUp : undefined}
            onPointerCancel={swipeToClose ? handleRelease : undefined}
            style={{
              opacity:
                0.58 + Math.max(dragProgress, horizontalSwipeProgress) * 0.42,
              transform: `translateX(${gestureAxis === "horizontal" ? (gestureDeltaRef.current.x < 0 ? -1 : 1) * horizontalSwipeProgress * 12 : 0}px) scaleX(${1 + Math.max(dragProgress, horizontalSwipeProgress) * 0.18})`,
            }}
            aria-hidden="true"
          />
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <DrawerTitle className="text-base font-semibold text-white sm:text-lg">
                {title}
              </DrawerTitle>
              <DrawerDescription
                className={cn(
                  "mt-1 text-xs leading-5 text-slate-400",
                  !description && "sr-only"
                )}
              >
                {description ?? "移动端快捷操作面板"}
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <button
                type="button"
                aria-label="关闭底部操作面板"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-transform duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div
          data-bottom-sheet-scroll="true"
          className={cn(
            "min-h-0 overflow-y-auto overscroll-contain px-4 pb-2 sm:px-6",
            contentClassName
          )}
        >
          {children}
        </div>

        {footer ? (
          <DrawerFooter className="px-4 pt-3 sm:px-6">{footer}</DrawerFooter>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
