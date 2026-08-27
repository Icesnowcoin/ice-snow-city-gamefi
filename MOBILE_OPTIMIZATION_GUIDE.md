# Ice Snow City - Mobile Optimization Guide

## Overview

This guide documents all mobile optimization improvements made to Ice Snow City, ensuring smooth touch interactions and optimal performance on mobile devices.

## 1. Viewport Configuration

### Enhanced Viewport Meta Tag
```html
<meta name="viewport" 
      content="width=device-width, initial-scale=1.0, maximum-scale=5, user-scalable=yes, viewport-fit=cover" />
```

**Key improvements:**
- `viewport-fit=cover`: Supports notch and safe areas on modern devices
- `user-scalable=yes`: Allows user pinch-zoom for accessibility
- `maximum-scale=5`: Prevents accidental over-zoom

### PWA Support
```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Ice Snow City" />
<meta name="theme-color" content="#0f172a" />
```

## 2. Mobile-Specific CSS

### Safe Area Support
```css
@supports (padding: max(0px)) {
  body {
    padding-left: max(0px, env(safe-area-inset-left));
    padding-right: max(0px, env(safe-area-inset-right));
  }
  
  .fixed.bottom-0 {
    padding-bottom: max(0px, env(safe-area-inset-bottom));
  }
  
  .fixed.top-0 {
    padding-top: max(0px, env(safe-area-inset-top));
  }
}
```

### Touch Target Size
```css
@media (max-width: 768px) {
  button,
  a,
  [role="button"],
  [role="tab"] {
    min-height: 44px;
    min-width: 44px;
  }
}
```

**Rationale:** Apple HIG recommends 44x44px minimum touch targets for accessibility.

### Input Font Size
```css
@media (max-width: 768px) {
  input,
  select,
  textarea {
    font-size: 16px !important;
  }
}
```

**Rationale:** Prevents automatic zoom on iOS when input is focused.

### Smooth Scrolling
```css
@media (max-width: 768px) {
  html {
    scroll-behavior: smooth;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}
```

## 3. Touch Interaction Hooks

### useTouchInteraction Hook
Provides comprehensive touch gesture support:

```typescript
const {
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  handleTouchCancel,
  gestureState
} = useTouchInteraction(
  onTap,
  onLongPress,
  onDrag,
  onPinch,
  onDoubleTap
);
```

**Features:**
- Tap detection (single and double)
- Long press detection (500ms threshold)
- Drag detection (10px threshold)
- Pinch zoom detection
- Gesture state tracking

### useDebounce & useThrottle
For performance-critical touch events:

```typescript
const debouncedCallback = useDebounce(callback, 300);
const throttledCallback = useThrottle(callback, 100);
```

## 4. Mobile Layout Components

### MobileGameLayout
Optimized layout for mobile screens:

**Features:**
- Sticky top header with safe area support
- Horizontal scrolling bottom navigation (8 primary items)
- Drawer menu for additional items
- Responsive spacing and sizing
- Touch-friendly button sizes

### MobileGameHub
Mobile-optimized game selection screen:

**Features:**
- 2-column game grid (responsive)
- Compact top bar with time display
- Game tips for mobile users
- Performance info display
- Touch feedback (active:scale-95)

## 5. Canvas Touch Support

### RTSGameEngine Touch Handlers
Added touch event handlers to complement mouse events:

```typescript
function handleCanvasTouchStart(e: React.TouchEvent<HTMLCanvasElement>) {
  e.preventDefault();
  // Touch coordinate conversion and object selection
}

function handleCanvasTouchMove(e: React.TouchEvent<HTMLCanvasElement>) {
  e.preventDefault();
  // Hover tile tracking on touch
}
```

**Features:**
- Touch coordinate conversion to isometric coordinates
- Building and unit selection on touch
- Hover feedback during touch drag

## 6. Performance Optimization Hooks

### useMobilePerformance
Monitor and optimize performance:

```typescript
const { metrics, getMetrics } = useMobilePerformance(enabled);
```

**Metrics tracked:**
- FPS (frames per second)
- Memory usage (MB)
- Render time
- Last measurement timestamp

### useLazyLoadImage
Lazy load images on mobile:

```typescript
useLazyLoadImage(imageRef);
```

**Features:**
- Intersection Observer API
- 50px margin for preloading
- Automatic cleanup

### useVirtualScroll
Virtual scrolling for long lists:

```typescript
const { visibleItems, offsetY, onScroll } = useVirtualScroll({
  itemHeight: 60,
  containerHeight: 400,
  items: largeList,
  overscan: 3
});
```

**Benefits:**
- Only renders visible items
- Smooth scrolling
- Reduced memory usage

### useViewportDimensions
Track viewport changes:

```typescript
const { width, height, isPortrait } = useViewportDimensions();
```

### usePrefersReducedMotion
Respect user motion preferences:

```typescript
const prefersReducedMotion = usePrefersReducedMotion();
```

### useBatteryStatus
Monitor device battery:

```typescript
const { level, charging, chargingTime } = useBatteryStatus();
```

## 7. Best Practices

### Touch Interaction Guidelines

1. **Prevent Default Behavior**
   ```typescript
   function handleTouchStart(e: React.TouchEvent) {
     e.preventDefault(); // Prevent scrolling, zoom
   }
   ```

2. **Use touch-none Class**
   ```jsx
   <canvas className="touch-none" />
   ```

3. **Provide Visual Feedback**
   ```css
   button {
     active:scale-95;
     transition-transform 200ms ease-out;
   }
   ```

4. **Avoid Hover States**
   ```css
   @media (hover: none) {
     button:hover {
       /* Hover styles disabled on touch devices */
     }
   }
   ```

### Performance Guidelines

1. **Debounce/Throttle Events**
   - Resize: debounce 250ms
   - Scroll: throttle 100ms
   - Touch move: throttle 50ms

2. **Lazy Load Assets**
   - Images: use useLazyLoadImage
   - Code: use dynamic imports
   - Data: use pagination

3. **Monitor Performance**
   - Track FPS (target: 60fps)
   - Monitor memory (target: <50MB)
   - Measure render time (target: <16ms)

4. **Optimize Rendering**
   - Use React.memo for expensive components
   - Implement virtual scrolling for long lists
   - Batch state updates

### Accessibility Guidelines

1. **Touch Targets**
   - Minimum 44x44px
   - Adequate spacing (8px minimum)
   - Clear visual feedback

2. **Text Readability**
   - Minimum 16px font size
   - Sufficient color contrast
   - Line height: 1.5

3. **Motion**
   - Respect prefers-reduced-motion
   - Keep animations under 300ms
   - Provide non-animated alternatives

## 8. Testing Checklist

- [ ] Test on iOS Safari (iPhone SE, iPhone 12, iPhone 14 Pro)
- [ ] Test on Android Chrome (Samsung Galaxy, Pixel)
- [ ] Test landscape and portrait orientations
- [ ] Test with notch/safe area devices
- [ ] Test touch interactions (tap, long press, drag, pinch)
- [ ] Test with reduced motion enabled
- [ ] Test with low battery mode
- [ ] Test with slow network (3G)
- [ ] Test with 50% CPU throttling
- [ ] Verify FPS stays above 55
- [ ] Verify memory usage under 50MB
- [ ] Test with screen reader (VoiceOver, TalkBack)

## 9. Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| iOS Safari | 12+ | Full |
| Chrome Android | 80+ | Full |
| Firefox Android | 68+ | Full |
| Samsung Internet | 10+ | Full |
| UC Browser | Latest | Partial |

## 10. Deployment Considerations

### Server Configuration
```nginx
# Enable gzip compression
gzip on;
gzip_types text/css application/javascript;
gzip_min_length 1000;

# Cache static assets
expires 1y;
add_header Cache-Control "public, immutable";
```

### Performance Budget
- Initial load: < 3s (3G)
- Interactive: < 5s (3G)
- First paint: < 1s
- Largest contentful paint: < 2.5s

### Monitoring
- Use Lighthouse CI
- Monitor Core Web Vitals
- Track crash rates
- Monitor user engagement

## 11. Resources

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Android Material Design](https://material.io/design/)
- [MDN Touch Events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
- [Web Vitals](https://web.dev/vitals/)
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

## 12. Troubleshooting

### Issue: Zoom on input focus (iOS)
**Solution:** Set font-size to 16px on inputs

### Issue: Double-tap zoom conflicts with interactions
**Solution:** Use touch-action: manipulation CSS

### Issue: Slow scrolling on long lists
**Solution:** Implement virtual scrolling with useVirtualScroll

### Issue: High memory usage
**Solution:** Implement lazy loading and cleanup unused listeners

### Issue: Canvas touch coordinates incorrect
**Solution:** Use getBoundingClientRect() for accurate coordinate conversion

## 13. Future Improvements

- [ ] Implement service worker for offline support
- [ ] Add haptic feedback for touch interactions
- [ ] Implement adaptive loading based on network speed
- [ ] Add gesture customization options
- [ ] Implement predictive prefetching
- [ ] Add analytics for touch interaction patterns
- [ ] Implement progressive image loading
- [ ] Add voice control support
