/**
 * 相机快速跳转控制器
 * 处理相机的平滑动画跳转到指定位置
 */
export class CameraJumpController {
  private isAnimating: boolean = false;
  private animationProgress: number = 0;
  private animationDuration: number = 1000; // 毫秒
  private startPosition: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
  private targetPosition: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
  private startTime: number = 0;
  private easeFunction: (t: number) => number = this.easeInOutCubic;

  constructor(duration: number = 1000) {
    this.animationDuration = duration;
  }

  /**
   * 开始相机跳转
   */
  public startJump(
    fromX: number,
    fromY: number,
    fromZ: number,
    toX: number,
    toY: number,
    toZ: number,
    duration?: number
  ): void {
    if (this.isAnimating) {
      return; // 已有动画在进行中
    }

    this.isAnimating = true;
    this.animationProgress = 0;
    this.startTime = Date.now();
    this.startPosition = { x: fromX, y: fromY, z: fromZ };
    this.targetPosition = { x: toX, y: toY, z: toZ };

    if (duration) {
      this.animationDuration = duration;
    }
  }

  /**
   * 更新相机位置（每帧调用）
   */
  public update(): { x: number; y: number; z: number } | null {
    if (!this.isAnimating) {
      return null;
    }

    const currentTime = Date.now();
    const elapsed = currentTime - this.startTime;
    const progress = Math.min(elapsed / this.animationDuration, 1);

    this.animationProgress = progress;

    // 应用缓动函数
    const easedProgress = this.easeFunction(progress);

    // 线性插值计算新位置
    const newPosition = {
      x: this.startPosition.x + (this.targetPosition.x - this.startPosition.x) * easedProgress,
      y: this.startPosition.y + (this.targetPosition.y - this.startPosition.y) * easedProgress,
      z: this.startPosition.z + (this.targetPosition.z - this.startPosition.z) * easedProgress,
    };

    // 动画完成
    if (progress >= 1) {
      this.isAnimating = false;
    }

    return newPosition;
  }

  /**
   * 获取是否正在动画
   */
  public isAnimatingNow(): boolean {
    return this.isAnimating;
  }

  /**
   * 获取动画进度（0-1）
   */
  public getProgress(): number {
    return this.animationProgress;
  }

  /**
   * 立即停止动画
   */
  public stop(): void {
    this.isAnimating = false;
    this.animationProgress = 0;
  }

  /**
   * 设置缓动函数
   */
  public setEaseFunction(easeFunc: (t: number) => number): void {
    this.easeFunction = easeFunc;
  }

  /**
   * 缓动函数：线性
   */
  private easeLinear(t: number): number {
    return t;
  }

  /**
   * 缓动函数：二次缓入
   */
  private easeInQuad(t: number): number {
    return t * t;
  }

  /**
   * 缓动函数：二次缓出
   */
  private easeOutQuad(t: number): number {
    return 1 - (1 - t) * (1 - t);
  }

  /**
   * 缓动函数：三次缓入缓出
   */
  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * 缓动函数：圆形缓出
   */
  private easeOutCirc(t: number): number {
    return Math.sqrt(1 - Math.pow(t - 1, 2));
  }

  /**
   * 缓动函数：弹性缓出
   */
  private easeOutElastic(t: number): number {
    const c5 = (2 * Math.PI) / 4.5;

    return t === 0
      ? 0
      : t === 1
        ? 1
        : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c5) + 1;
  }
}
