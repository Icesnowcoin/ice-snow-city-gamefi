/**
 * Frontend Performance Optimization Utilities
 * 
 * Phase 56-60: 前端性能优化和测试
 * 
 * 优化策略：
 * 1. 代码分割 (Code Splitting) - 按需加载模块
 * 2. 图片优化 - 懒加载、WebP、响应式图片
 * 3. 缓存策略 - 浏览器缓存、内存缓存
 * 4. 虚拟化 - 大列表虚拟化
 * 5. 防抖和节流 - 减少不必要的重新渲染
 * 6. 组件懒加载 - React.lazy + Suspense
 * 7. 内存泄漏检测 - 清理事件监听器、定时器
 * 8. 网络优化 - 请求合并、预加载
 */

/**
 * 性能监控指标
 */
export interface PerformanceMetrics {
  // 核心 Web 指标 (Core Web Vitals)
  LCP: number; // Largest Contentful Paint
  FID: number; // First Input Delay
  CLS: number; // Cumulative Layout Shift
  
  // 其他指标
  FCP: number; // First Contentful Paint
  TTFB: number; // Time to First Byte
  DOMContentLoaded: number;
  LoadComplete: number;
  
  // 内存指标
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  
  // 网络指标
  resourceCount: number;
  transferSize: number;
  decodedSize: number;
}

/**
 * 性能监控类
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    LCP: 0,
    FID: 0,
    CLS: 0,
    FCP: 0,
    TTFB: 0,
    DOMContentLoaded: 0,
    LoadComplete: 0,
    usedJSHeapSize: 0,
    totalJSHeapSize: 0,
    jsHeapSizeLimit: 0,
    resourceCount: 0,
    transferSize: 0,
    decodedSize: 0,
  };

  private observers: Map<string, PerformanceObserver> = new Map();

  /**
   * 初始化性能监控
   */
  init(): void {
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeNavigationTiming();
    this.observeMemory();
    this.observeResources();
  }

  /**
   * 监控 LCP (Largest Contentful Paint)
   */
  private observeLCP(): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.metrics.LCP = lastEntry.renderTime || lastEntry.loadTime;
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('LCP', observer);
      } catch (e) {
        console.warn('LCP observer not supported');
      }
    }
  }

  /**
   * 监控 FID (First Input Delay)
   */
  private observeFID(): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.metrics.FID = entry.processingDuration;
          });
        });
        observer.observe({ entryTypes: ['first-input'] });
        this.observers.set('FID', observer);
      } catch (e) {
        console.warn('FID observer not supported');
      }
    }
  }

  /**
   * 监控 CLS (Cumulative Layout Shift)
   */
  private observeCLS(): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              this.metrics.CLS += entry.value;
            }
          });
        });
        observer.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('CLS', observer);
      } catch (e) {
        console.warn('CLS observer not supported');
      }
    }
  }

  /**
   * 监控导航时序
   */
  private observeNavigationTiming(): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.metrics.FCP = entry.firstContentfulPaint;
            this.metrics.TTFB = entry.responseStart - entry.fetchStart;
            this.metrics.DOMContentLoaded = entry.domContentLoadedEventEnd - entry.fetchStart;
            this.metrics.LoadComplete = entry.loadEventEnd - entry.fetchStart;
          });
        });
        observer.observe({ entryTypes: ['navigation'] });
        this.observers.set('Navigation', observer);
      } catch (e) {
        console.warn('Navigation observer not supported');
      }
    }
  }

  /**
   * 监控内存使用
   */
  private observeMemory(): void {
    if ((performance as any).memory) {
      const updateMemory = () => {
        const memory = (performance as any).memory;
        this.metrics.usedJSHeapSize = memory.usedJSHeapSize;
        this.metrics.totalJSHeapSize = memory.totalJSHeapSize;
        this.metrics.jsHeapSizeLimit = memory.jsHeapSizeLimit;
      };
      updateMemory();
      setInterval(updateMemory, 5000);
    }
  }

  /**
   * 监控资源加载
   */
  private observeResources(): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          this.metrics.resourceCount = entries.length;
          this.metrics.transferSize = entries.reduce((sum: number, entry: any) => sum + (entry.transferSize || 0), 0);
          this.metrics.decodedSize = entries.reduce((sum: number, entry: any) => sum + (entry.decodedBodySize || 0), 0);
        });
        observer.observe({ entryTypes: ['resource'] });
        this.observers.set('Resource', observer);
      } catch (e) {
        console.warn('Resource observer not supported');
      }
    }
  }

  /**
   * 获取性能指标
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * 清理观察器
   */
  cleanup(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
  }
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 内存缓存类
 */
export class MemoryCache<K, V> {
  private cache: Map<K, { value: V; timestamp: number }> = new Map();
  private ttl: number; // 生存时间（毫秒）

  constructor(ttl: number = 5 * 60 * 1000) {
    this.ttl = ttl;
  }

  set(key: K, value: V): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  get(key: K): V | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key: K): boolean {
    return this.get(key) !== null;
  }

  delete(key: K): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * 图片懒加载配置
 */
export interface LazyLoadOptions {
  rootMargin?: string;
  threshold?: number | number[];
}

/**
 * 图片懒加载
 */
export function setupLazyLoad(options: LazyLoadOptions = {}): IntersectionObserver {
  const {
    rootMargin = '50px',
    threshold = 0.01,
  } = options;

  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;
        const srcset = img.dataset.srcset;

        if (src) {
          img.src = src;
        }
        if (srcset) {
          img.srcset = srcset;
        }

        img.classList.add('loaded');
        imageObserver.unobserve(img);
      }
    });
  }, {
    rootMargin,
    threshold,
  });

  // 观察所有带 data-src 的图片
  document.querySelectorAll('img[data-src]').forEach((img) => {
    imageObserver.observe(img);
  });

  return imageObserver;
}

/**
 * 虚拟列表配置
 */
export interface VirtualListConfig {
  itemHeight: number;
  containerHeight: number;
  bufferSize?: number;
}

/**
 * 虚拟列表计算
 */
export function calculateVirtualListRange(
  scrollTop: number,
  config: VirtualListConfig
): { start: number; end: number } {
  const { itemHeight, containerHeight, bufferSize = 5 } = config;
  
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
  const endIndex = startIndex + visibleCount + bufferSize * 2;

  return { start: startIndex, end: endIndex };
}

/**
 * 请求去重和合并
 */
export class RequestDeduplicator<T> {
  private pendingRequests: Map<string, Promise<T>> = new Map();

  async deduplicate(key: string, request: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    const promise = request().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  clear(): void {
    this.pendingRequests.clear();
  }
}

/**
 * 性能报告生成
 */
export function generatePerformanceReport(metrics: PerformanceMetrics): string {
  const report = `
=== 前端性能报告 ===

核心 Web 指标 (Core Web Vitals):
- LCP (Largest Contentful Paint): ${metrics.LCP.toFixed(2)}ms ${getLCPStatus(metrics.LCP)}
- FID (First Input Delay): ${metrics.FID.toFixed(2)}ms ${getFIDStatus(metrics.FID)}
- CLS (Cumulative Layout Shift): ${metrics.CLS.toFixed(3)} ${getCLSStatus(metrics.CLS)}

其他指标:
- FCP (First Contentful Paint): ${metrics.FCP.toFixed(2)}ms
- TTFB (Time to First Byte): ${metrics.TTFB.toFixed(2)}ms
- DOM Content Loaded: ${metrics.DOMContentLoaded.toFixed(2)}ms
- Load Complete: ${metrics.LoadComplete.toFixed(2)}ms

内存使用:
- 已使用堆内存: ${(metrics.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB
- 总堆内存: ${(metrics.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB
- 堆内存限制: ${(metrics.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB
- 内存使用率: ${((metrics.usedJSHeapSize / metrics.jsHeapSizeLimit) * 100).toFixed(2)}%

网络资源:
- 资源总数: ${metrics.resourceCount}
- 传输大小: ${(metrics.transferSize / 1024 / 1024).toFixed(2)}MB
- 解码大小: ${(metrics.decodedSize / 1024 / 1024).toFixed(2)}MB
  `;

  return report;
}

/**
 * 获取 LCP 状态
 */
function getLCPStatus(lcp: number): string {
  if (lcp <= 2500) return '✓ 优秀';
  if (lcp <= 4000) return '⚠ 需要改进';
  return '✗ 较差';
}

/**
 * 获取 FID 状态
 */
function getFIDStatus(fid: number): string {
  if (fid <= 100) return '✓ 优秀';
  if (fid <= 300) return '⚠ 需要改进';
  return '✗ 较差';
}

/**
 * 获取 CLS 状态
 */
function getCLSStatus(cls: number): string {
  if (cls <= 0.1) return '✓ 优秀';
  if (cls <= 0.25) return '⚠ 需要改进';
  return '✗ 较差';
}

/**
 * 单例性能监控实例
 */
let performanceMonitorInstance: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new PerformanceMonitor();
    performanceMonitorInstance.init();
  }
  return performanceMonitorInstance;
}

export function cleanupPerformanceMonitor(): void {
  if (performanceMonitorInstance) {
    performanceMonitorInstance.cleanup();
    performanceMonitorInstance = null;
  }
}
