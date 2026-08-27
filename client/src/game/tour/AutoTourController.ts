import * as BABYLON from '@babylonjs/core';
import { TourRoute, TourPoint, TourRouteManager } from './TourRouteManager';

/**
 * 导覽状态
 */
export enum TourState {
  IDLE = 'idle',
  PLAYING = 'playing',
  PAUSED = 'paused',
  STOPPED = 'stopped',
}

/**
 * 导覍事件回调
 */
export interface TourEventCallbacks {
  onTourStart?: (route: TourRoute) => void;
  onTourStop?: () => void;
  onTourPause?: () => void;
  onTourResume?: () => void;
  onPointReached?: (point: TourPoint, index: number) => void;
  onPointStart?: (point: TourPoint, index: number) => void;
  onPointEnd?: (point: TourPoint, index: number) => void;
  onProgressUpdate?: (progress: number, totalDuration: number) => void;
}

/**
 * 自动导覽控制器
 * 管理相机的自动导覍路线播放
 */
export class AutoTourController {
  private scene: BABYLON.Scene;
  private camera: BABYLON.UniversalCamera;
  private routeManager: TourRouteManager;
  private state: TourState = TourState.IDLE;
  private currentRoute: TourRoute | null = null;
  private currentPointIndex: number = 0;
  private elapsedTime: number = 0;
  private pointStartTime: number = 0;
  private callbacks: TourEventCallbacks = {};
  private animationFrameId: number | null = null;
  private transitionDuration: number = 2000; // 相机过渡时间（毫秒）
  private easeFunction: (t: number) => number = this.easeInOutCubic;

  constructor(scene: BABYLON.Scene, camera: BABYLON.UniversalCamera, routeManager: TourRouteManager) {
    this.scene = scene;
    this.camera = camera;
    this.routeManager = routeManager;
  }

  /**
   * 开始导覍
   */
  startTour(routeId?: string): void {
    if (this.state === TourState.PLAYING) {
      return;
    }

    const route = routeId ? this.routeManager.getRoute(routeId) : this.routeManager.getDefaultRoute();
    if (!route) {
      console.error('Tour route not found');
      return;
    }

    this.currentRoute = route;
    this.currentPointIndex = 0;
    this.elapsedTime = 0;
    this.state = TourState.PLAYING;

    if (this.callbacks.onTourStart) {
      this.callbacks.onTourStart(route);
    }

    this.playNextPoint();
  }

  /**
   * 停止导覍
   */
  stopTour(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.state = TourState.STOPPED;
    this.currentRoute = null;
    this.currentPointIndex = 0;
    this.elapsedTime = 0;

    if (this.callbacks.onTourStop) {
      this.callbacks.onTourStop();
    }
  }

  /**
   * 暂停导覍
   */
  pauseTour(): void {
    if (this.state === TourState.PLAYING) {
      this.state = TourState.PAUSED;

      if (this.callbacks.onTourPause) {
        this.callbacks.onTourPause();
      }
    }
  }

  /**
   * 恢复导覍
   */
  resumeTour(): void {
    if (this.state === TourState.PAUSED) {
      this.state = TourState.PLAYING;

      if (this.callbacks.onTourResume) {
        this.callbacks.onTourResume();
      }

      this.playNextPoint();
    }
  }

  /**
   * 播放下一个导覍点
   */
  private playNextPoint(): void {
    if (!this.currentRoute || this.state !== TourState.PLAYING) {
      return;
    }

    const point = this.currentRoute.points[this.currentPointIndex];
    if (!point) {
      // 导覍结束
      if (this.currentRoute.loop) {
        this.currentPointIndex = 0;
        this.playNextPoint();
      } else {
        this.stopTour();
      }
      return;
    }

    if (this.callbacks.onPointStart) {
      this.callbacks.onPointStart(point, this.currentPointIndex);
    }

    this.pointStartTime = Date.now();
    this.animateToPoint(point);
  }

  /**
   * 动画到指定导覍点
   */
  private animateToPoint(point: TourPoint): void {
    const startPos = this.camera.position.clone();
    const startTarget = this.camera.getTarget().clone();

    const endPos = new BABYLON.Vector3(point.position.x, point.position.y, point.position.z);
    const endTarget = new BABYLON.Vector3(point.lookAt.x, point.lookAt.y, point.lookAt.z);

    const startTime = Date.now();
    const transitionDuration = this.transitionDuration;

    const animate = () => {
      if (this.state !== TourState.PLAYING) {
        return;
      }

      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / transitionDuration, 1);
      const easeProgress = this.easeFunction(progress);

      // 插值相机位置
      this.camera.position = BABYLON.Vector3.Lerp(startPos, endPos, easeProgress);

      // 插值相机目标
      const currentTarget = BABYLON.Vector3.Lerp(startTarget, endTarget, easeProgress);
      this.camera.setTarget(currentTarget);

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        // 过渡完成，等待停留时间
        this.waitAtPoint(point);
      }
    };

    animate();
  }

  /**
   * 在导覍点停留
   */
  private waitAtPoint(point: TourPoint): void {
    if (this.callbacks.onPointReached) {
      this.callbacks.onPointReached(point, this.currentPointIndex);
    }

    const waitTime = point.duration;
    const startWaitTime = Date.now();

    const wait = () => {
      if (this.state !== TourState.PLAYING) {
        return;
      }

      const elapsed = Date.now() - startWaitTime;
      const progress = elapsed / waitTime;

      if (this.callbacks.onProgressUpdate) {
        this.callbacks.onProgressUpdate(
          this.elapsedTime + elapsed,
          this.currentRoute?.totalDuration || 0
        );
      }

      if (elapsed < waitTime) {
        this.animationFrameId = requestAnimationFrame(wait);
      } else {
        // 停留时间结束，移动到下一个点
        this.elapsedTime += elapsed;

        if (this.callbacks.onPointEnd) {
          this.callbacks.onPointEnd(point, this.currentPointIndex);
        }

        this.currentPointIndex++;
        this.playNextPoint();
      }
    };

    wait();
  }

  /**
   * 获取导覍状态
   */
  getState(): TourState {
    return this.state;
  }

  /**
   * 获取当前导覍路线
   */
  getCurrentRoute(): TourRoute | null {
    return this.currentRoute;
  }

  /**
   * 获取当前导覍点索引
   */
  getCurrentPointIndex(): number {
    return this.currentPointIndex;
  }

  /**
   * 设置导覍事件回调
   */
  setCallbacks(callbacks: TourEventCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * 设置相机过渡时间
   */
  setTransitionDuration(duration: number): void {
    this.transitionDuration = duration;
  }

  /**
   * 设置缓动函数
   */
  setEaseFunction(easeFunction: (t: number) => number): void {
    this.easeFunction = easeFunction;
  }

  /**
   * 缓动函数：三次方缓入缓出
   */
  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * 缓动函数：二次方缓入缓出
   */
  easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  /**
   * 缓动函数：线性
   */
  easeLinear(t: number): number {
    return t;
  }

  /**
   * 缓动函数：四次方缓入缓出
   */
  easeInOutQuart(t: number): number {
    return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.stopTour();
    this.callbacks = {};
  }
}
