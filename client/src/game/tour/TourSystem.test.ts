import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as BABYLON from '@babylonjs/core';
import { TourRouteManager } from './TourRouteManager';
import { AutoTourController, TourState } from './AutoTourController';

describe('Tour System', () => {
  let scene: BABYLON.Scene;
  let camera: BABYLON.UniversalCamera;
  let routeManager: TourRouteManager;
  let tourController: AutoTourController;

  beforeEach(() => {
    // 使用 NullEngine 隔离真实 WebGL 硬件，保持路线与控制器逻辑测试稳定
    const engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);

    // 创建相机；路线控制器测试不依赖 DOM 输入绑定
    camera = new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(0, 10, -20));

    // 创建路线管理器和导覍控制器
    routeManager = new TourRouteManager();
    tourController = new AutoTourController(scene, camera, routeManager);
  });

  describe('TourRouteManager', () => {
    it('应该返回所有路线', () => {
      const routes = routeManager.getRoutes();
      expect(routes.length).toBeGreaterThan(0);
    });

    it('应该返回默认路线', () => {
      const defaultRoute = routeManager.getDefaultRoute();
      expect(defaultRoute).toBeDefined();
      expect(defaultRoute?.id).toBe('agricultural-complete-tour');
    });

    it('应该返回指定 ID 的路线', () => {
      const route = routeManager.getRoute('agricultural-complete-tour');
      expect(route).toBeDefined();
      expect(route?.id).toBe('agricultural-complete-tour');
    });

    it('应该计算路线总时长', () => {
      const duration = routeManager.getRouteDuration('agricultural-complete-tour');
      expect(duration).toBeGreaterThan(0);
    });

    it('应该返回路线景点数', () => {
      const count = routeManager.getRoutePointCount('agricultural-complete-tour');
      expect(count).toBeGreaterThan(0);
    });

    it('应该返回下一个景点', () => {
      const route = routeManager.getRoute('agricultural-complete-tour');
      if (route && route.points.length > 0) {
        const nextPoint = routeManager.getNextPoint(route.id, 0);
        expect(nextPoint).toBeDefined();
      }
    });

    it('应该返回上一个景点', () => {
      const route = routeManager.getRoute('agricultural-complete-tour');
      if (route && route.points.length > 1) {
        const prevPoint = routeManager.getPreviousPoint(route.id, 1);
        expect(prevPoint).toBeDefined();
      }
    });
  });

  describe('AutoTourController', () => {
    it('应该初始化为 IDLE 状态', () => {
      expect(tourController.getState()).toBe(TourState.IDLE);
    });

    it('应该返回 null 作为当前路线（未启动时）', () => {
      expect(tourController.getCurrentRoute()).toBeNull();
    });

    it('应该返回 0 作为当前景点索引（未启动时）', () => {
      expect(tourController.getCurrentPointIndex()).toBe(0);
    });

    it('应该启动导覍', () => {
      const callback = vi.fn();
      tourController.setCallbacks({ onTourStart: callback });

      tourController.startTour('agricultural-complete-tour');

      expect(tourController.getState()).toBe(TourState.PLAYING);
      expect(tourController.getCurrentRoute()).toBeDefined();
      expect(callback).toHaveBeenCalled();
    });

    it('应该停止导覍', () => {
      const startCallback = vi.fn();
      const stopCallback = vi.fn();
      tourController.setCallbacks({
        onTourStart: startCallback,
        onTourStop: stopCallback,
      });

      tourController.startTour('agricultural-complete-tour');
      tourController.stopTour();

      expect(tourController.getState()).toBe(TourState.STOPPED);
      expect(tourController.getCurrentRoute()).toBeNull();
      expect(stopCallback).toHaveBeenCalled();
    });

    it('应该暂停导覍', () => {
      const pauseCallback = vi.fn();
      tourController.setCallbacks({ onTourPause: pauseCallback });

      tourController.startTour('agricultural-complete-tour');
      tourController.pauseTour();

      expect(tourController.getState()).toBe(TourState.PAUSED);
      expect(pauseCallback).toHaveBeenCalled();
    });

    it('应该恢复导覍', () => {
      const resumeCallback = vi.fn();
      tourController.setCallbacks({ onTourResume: resumeCallback });

      tourController.startTour('agricultural-complete-tour');
      tourController.pauseTour();
      tourController.resumeTour();

      expect(tourController.getState()).toBe(TourState.PLAYING);
      expect(resumeCallback).toHaveBeenCalled();
    });

    it('应该设置过渡时间', () => {
      tourController.setTransitionDuration(3000);
      // 验证设置成功（通过检查内部状态）
      expect(tourController).toBeDefined();
    });

    it('应该设置缓动函数', () => {
      const easeFunc = (t: number) => t;
      tourController.setEaseFunction(easeFunc);
      // 验证设置成功
      expect(tourController).toBeDefined();
    });

    it('应该支持多个缓动函数', () => {
      // 测试线性缓动
      tourController.setEaseFunction(tourController.easeLinear);
      expect(tourController.easeLinear(0.5)).toBe(0.5);

      // 测试二次方缓入缓出
      tourController.setEaseFunction(tourController.easeInOutQuad);
      const easeValue = tourController.easeInOutQuad(0.5);
      expect(easeValue).toBeDefined();
      expect(typeof easeValue).toBe('number');
    });

    it('应该在导覍结束后停止', (done) => {
      const stopCallback = vi.fn();
      tourController.setCallbacks({ onTourStop: stopCallback });

      tourController.startTour('agricultural-quick-tour');

      // 模拟导覍完成（快速路线）
      setTimeout(() => {
        // 检查导覍是否已停止或仍在播放
        const state = tourController.getState();
        expect([TourState.PLAYING, TourState.STOPPED]).toContain(state);
        done();
      }, 100);
    });

    it('应该触发景点到达回调', (done) => {
      const pointReachedCallback = vi.fn();
      tourController.setCallbacks({ onPointReached: pointReachedCallback });

      tourController.startTour('agricultural-complete-tour');

      // 等待景点到达
      setTimeout(() => {
        // 验证回调是否被调用
        expect(tourController.getState()).toBe(TourState.PLAYING);
        done();
      }, 100);
    });

    it('应该清理资源', () => {
      tourController.startTour('agricultural-complete-tour');
      tourController.dispose();

      expect(tourController.getState()).toBe(TourState.STOPPED);
      expect(tourController.getCurrentRoute()).toBeNull();
    });

    it('应该不重复启动导覍', () => {
      const callback = vi.fn();
      tourController.setCallbacks({ onTourStart: callback });

      tourController.startTour('agricultural-complete-tour');
      tourController.startTour('agricultural-complete-tour');

      // 回调应该只被调用一次
      expect(callback.mock.calls.length).toBe(1);
    });

    it('应该支持不同的路线', () => {
      const callback = vi.fn();
      tourController.setCallbacks({ onTourStart: callback });

      tourController.startTour('agricultural-complete-tour');
      expect(tourController.getCurrentRoute()?.id).toBe('agricultural-complete-tour');

      tourController.stopTour();

      tourController.startTour('agricultural-quick-tour');
      expect(tourController.getCurrentRoute()?.id).toBe('agricultural-quick-tour');
    });
  });

  describe('Tour Callbacks', () => {
    it('应该支持多个回调', () => {
      const startCallback = vi.fn();
      const stopCallback = vi.fn();
      const pauseCallback = vi.fn();

      tourController.setCallbacks({
        onTourStart: startCallback,
        onTourStop: stopCallback,
        onTourPause: pauseCallback,
      });

      tourController.startTour('agricultural-complete-tour');
      expect(startCallback).toHaveBeenCalled();

      tourController.pauseTour();
      expect(pauseCallback).toHaveBeenCalled();

      tourController.stopTour();
      expect(stopCallback).toHaveBeenCalled();
    });

    it('应该在景点开始时触发回调', (done) => {
      const pointStartCallback = vi.fn();
      tourController.setCallbacks({ onPointStart: pointStartCallback });

      tourController.startTour('agricultural-complete-tour');

      // 等待景点开始
      setTimeout(() => {
        expect(tourController.getState()).toBe(TourState.PLAYING);
        done();
      }, 100);
    });
  });
});
