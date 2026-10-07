/**
 * 性能监控工具
 * 用于跟踪和分析应用性能指标
 */

export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  updateTime: number;
  totalTime: number;
}

export class PerformanceMonitor {
  private frameCount: number = 0;
  private lastTime: number = performance.now();
  private fps: number = 0;
  private metrics: PerformanceMetrics = {
    fps: 0,
    memoryUsage: 0,
    renderTime: 0,
    updateTime: 0,
    totalTime: 0,
  };

  private frameTimeHistory: number[] = [];
  private maxHistoryLength: number = 60;

  private renderStartTime: number = 0;
  private updateStartTime: number = 0;

  /**
   * 开始帧计时
   */
  public startFrame(): void {
    this.lastTime = performance.now();
  }

  /**
   * 开始更新计时
   */
  public startUpdate(): void {
    this.updateStartTime = performance.now();
  }

  /**
   * 结束更新计时
   */
  public endUpdate(): void {
    this.metrics.updateTime = performance.now() - this.updateStartTime;
  }

  /**
   * 开始渲染计时
   */
  public startRender(): void {
    this.renderStartTime = performance.now();
  }

  /**
   * 结束渲染计时
   */
  public endRender(): void {
    this.metrics.renderTime = performance.now() - this.renderStartTime;
  }

  /**
   * 结束帧计时并更新 FPS
   */
  public endFrame(): void {
    const currentTime = performance.now();
    const frameTime = currentTime - this.lastTime;

    this.frameTimeHistory.push(frameTime);
    if (this.frameTimeHistory.length > this.maxHistoryLength) {
      this.frameTimeHistory.shift();
    }

    this.frameCount++;

    // 每秒更新一次 FPS
    if (currentTime - this.lastTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = currentTime;

      this.metrics.fps = this.fps;
      this.metrics.totalTime = frameTime;
      this.updateMemoryUsage();
    }
  }

  /**
   * 更新内存使用情况
   */
  private updateMemoryUsage(): void {
    if ((performance as any).memory) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = Math.round(memory.usedJSHeapSize / 1048576); // 转换为 MB
    }
  }

  /**
   * 获取性能指标
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * 获取平均帧时间
   */
  public getAverageFrameTime(): number {
    if (this.frameTimeHistory.length === 0) return 0;
    const sum = this.frameTimeHistory.reduce((a, b) => a + b, 0);
    return sum / this.frameTimeHistory.length;
  }

  /**
   * 获取最小帧时间
   */
  public getMinFrameTime(): number {
    return Math.min(...this.frameTimeHistory);
  }

  /**
   * 获取最大帧时间
   */
  public getMaxFrameTime(): number {
    return Math.max(...this.frameTimeHistory);
  }

  /**
   * 标记性能时间点
   */
  public mark(name: string): void {
    performance.mark(name);
  }

  /**
   * 测量性能时间段
   */
  public measure(name: string, startMark: string, endMark: string): number {
    performance.measure(name, startMark, endMark);
    const entries = performance.getEntriesByName(name);
    return entries.length > 0 ? entries[entries.length - 1].duration : 0;
  }

  /**
   * 清除性能标记
   */
  public clearMarks(): void {
    performance.clearMarks();
    performance.clearMeasures();
  }

  /**
   * 获取性能报告
   */
  public getReport(): string {
    const avgFrameTime = this.getAverageFrameTime();
    const minFrameTime = this.getMinFrameTime();
    const maxFrameTime = this.getMaxFrameTime();

    return `
Performance Report:
- FPS: ${this.metrics.fps}
- Average Frame Time: ${avgFrameTime.toFixed(2)}ms
- Min Frame Time: ${minFrameTime.toFixed(2)}ms
- Max Frame Time: ${maxFrameTime.toFixed(2)}ms
- Render Time: ${this.metrics.renderTime.toFixed(2)}ms
- Update Time: ${this.metrics.updateTime.toFixed(2)}ms
- Memory Usage: ${this.metrics.memoryUsage}MB
    `.trim();
  }
}

/**
 * 全局性能监控实例
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * React Hook: 使用性能监控
 */
export function usePerformanceMonitor() {
  return {
    startFrame: () => performanceMonitor.startFrame(),
    endFrame: () => performanceMonitor.endFrame(),
    startUpdate: () => performanceMonitor.startUpdate(),
    endUpdate: () => performanceMonitor.endUpdate(),
    startRender: () => performanceMonitor.startRender(),
    endRender: () => performanceMonitor.endRender(),
    getMetrics: () => performanceMonitor.getMetrics(),
    getReport: () => performanceMonitor.getReport(),
  };
}
