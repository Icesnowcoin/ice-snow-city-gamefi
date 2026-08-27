import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MinimapManager, MinimapMarker } from './MinimapManager';
import { CameraJumpController } from './CameraJumpController';

describe('MinimapManager', () => {
  let minimapManager: MinimapManager;

  beforeEach(() => {
    minimapManager = new MinimapManager({
      width: 200,
      height: 200,
      scale: 1,
      centerX: 0,
      centerZ: 0,
      showGrid: true,
      showMarkers: true,
    });
  });

  describe('初始化', () => {
    it('应该创建小地图管理器', () => {
      expect(minimapManager).toBeDefined();
    });

    it('应该有正确的配置', () => {
      const config = minimapManager.getConfig();
      expect(config.width).toBe(200);
      expect(config.height).toBe(200);
    });
  });

  describe('标记管理', () => {
    it('应该添加标记', () => {
      const marker: MinimapMarker = {
        id: 'test-1',
        name: '测试建筑',
        x: 10,
        z: 20,
        type: 'building',
        color: {} as any,
        radius: 5,
      };

      minimapManager.addMarker(marker);
      const markers = minimapManager.getMarkers();

      expect(markers).toHaveLength(1);
      expect(markers[0].id).toBe('test-1');
    });

    it('应该移除标记', () => {
      const marker: MinimapMarker = {
        id: 'test-1',
        name: '测试建筑',
        x: 10,
        z: 20,
        type: 'building',
        color: {} as any,
        radius: 5,
      };

      minimapManager.addMarker(marker);
      minimapManager.removeMarker('test-1');
      const markers = minimapManager.getMarkers();

      expect(markers).toHaveLength(0);
    });

    it('应该按类型获取标记', () => {
      const buildingMarker: MinimapMarker = {
        id: 'building-1',
        name: '建筑',
        x: 10,
        z: 20,
        type: 'building',
        color: {} as any,
        radius: 5,
      };

      const vegetationMarker: MinimapMarker = {
        id: 'veg-1',
        name: '植被',
        x: 30,
        z: 40,
        type: 'vegetation',
        color: {} as any,
        radius: 3,
      };

      minimapManager.addMarker(buildingMarker);
      minimapManager.addMarker(vegetationMarker);

      const buildings = minimapManager.getMarkersByType('building');
      const vegetation = minimapManager.getMarkersByType('vegetation');

      expect(buildings).toHaveLength(1);
      expect(vegetation).toHaveLength(1);
    });

    it('应该更新标记位置', () => {
      const marker: MinimapMarker = {
        id: 'test-1',
        name: '测试',
        x: 10,
        z: 20,
        type: 'building',
        color: {} as any,
        radius: 5,
      };

      minimapManager.addMarker(marker);
      minimapManager.updateMarkerPosition('test-1', 50, 60);

      const markers = minimapManager.getMarkers();
      expect(markers[0].x).toBe(50);
      expect(markers[0].z).toBe(60);
    });

    it('应该清空所有标记', () => {
      const marker1: MinimapMarker = {
        id: 'test-1',
        name: '测试1',
        x: 10,
        z: 20,
        type: 'building',
        color: {} as any,
        radius: 5,
      };

      const marker2: MinimapMarker = {
        id: 'test-2',
        name: '测试2',
        x: 30,
        z: 40,
        type: 'vegetation',
        color: {} as any,
        radius: 3,
      };

      minimapManager.addMarker(marker1);
      minimapManager.addMarker(marker2);
      minimapManager.clearMarkers();

      const markers = minimapManager.getMarkers();
      expect(markers).toHaveLength(0);
    });
  });

  describe('坐标转换', () => {
    beforeEach(() => {
      minimapManager.setMapBounds(-100, 100, -100, 100);
    });

    it('应该将世界坐标转换为小地图坐标', () => {
      const minimapPos = minimapManager.worldToMinimap(0, 0);
      expect(minimapPos.x).toBe(100);
      expect(minimapPos.y).toBe(100);
    });

    it('应该将小地图坐标转换为世界坐标', () => {
      const worldPos = minimapManager.minimapToWorld(100, 100);
      expect(worldPos.x).toBeCloseTo(0, 1);
      expect(worldPos.z).toBeCloseTo(0, 1);
    });

    it('应该正确处理边界坐标', () => {
      const topLeftWorld = minimapManager.minimapToWorld(0, 0);
      expect(topLeftWorld.x).toBeCloseTo(-100, 1);
      expect(topLeftWorld.z).toBeCloseTo(-100, 1);

      const bottomRightWorld = minimapManager.minimapToWorld(200, 200);
      expect(bottomRightWorld.x).toBeCloseTo(100, 1);
      expect(bottomRightWorld.z).toBeCloseTo(100, 1);
    });
  });

  describe('相机位置', () => {
    it('应该更新相机位置', () => {
      minimapManager.updateCameraPosition(10, 20, Math.PI / 4);
      const cameraPos = minimapManager.getCameraPosition();

      expect(cameraPos.x).toBe(10);
      expect(cameraPos.z).toBe(20);
      expect(cameraPos.rotation).toBe(Math.PI / 4);
    });

    it('应该获取相机位置', () => {
      minimapManager.updateCameraPosition(50, 60, 0);
      const cameraPos = minimapManager.getCameraPosition();

      expect(cameraPos).toEqual({ x: 50, z: 60, rotation: 0 });
    });
  });

  describe('地图边界', () => {
    it('应该设置和获取地图边界', () => {
      minimapManager.setMapBounds(-50, 50, -75, 75);
      const bounds = minimapManager.getMapBounds();

      expect(bounds.minX).toBe(-50);
      expect(bounds.maxX).toBe(50);
      expect(bounds.minZ).toBe(-75);
      expect(bounds.maxZ).toBe(75);
    });

    it('应该检查点是否在边界内', () => {
      minimapManager.setMapBounds(-100, 100, -100, 100);

      expect(minimapManager.isPointInBounds(0, 0)).toBe(true);
      expect(minimapManager.isPointInBounds(50, 50)).toBe(true);
      expect(minimapManager.isPointInBounds(-100, -100)).toBe(true);
      expect(minimapManager.isPointInBounds(150, 150)).toBe(false);
    });
  });

  describe('距离计算', () => {
    it('应该计算两点之间的距离', () => {
      const distance = minimapManager.calculateDistance(0, 0, 3, 4);
      expect(distance).toBe(5);
    });

    it('应该计算相同点的距离为0', () => {
      const distance = minimapManager.calculateDistance(10, 20, 10, 20);
      expect(distance).toBe(0);
    });
  });
});

describe('CameraJumpController', () => {
  let controller: CameraJumpController;

  beforeEach(() => {
    vi.useFakeTimers();
    controller = new CameraJumpController(1000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('初始化', () => {
    it('应该创建相机跳转控制器', () => {
      expect(controller).toBeDefined();
    });

    it('初始不应该在动画中', () => {
      expect(controller.isAnimatingNow()).toBe(false);
    });

    it('初始进度应该为0', () => {
      expect(controller.getProgress()).toBe(0);
    });
  });

  describe('跳转动画', () => {
    it('应该开始跳转', () => {
      controller.startJump(0, 0, 0, 10, 10, 10);
      expect(controller.isAnimatingNow()).toBe(true);
    });

    it('应该更新相机位置', () => {
      controller.startJump(0, 0, 0, 10, 10, 10);
      vi.advanceTimersByTime(250);
      const pos = controller.update();

      expect(pos).toBeDefined();
      expect(pos?.x).toBeGreaterThan(0);
      expect(pos?.y).toBeGreaterThan(0);
      expect(pos?.z).toBeGreaterThan(0);
    });

    it('应该停止动画', () => {
      controller.startJump(0, 0, 0, 10, 10, 10);
      controller.stop();

      expect(controller.isAnimatingNow()).toBe(false);
    });

    it('应该阻止重复动画', () => {
      controller.startJump(0, 0, 0, 10, 10, 10);
      controller.startJump(0, 0, 0, 20, 20, 20); // 第二次调用应该被忽略

      // 验证仍然在第一个跳转中
      const pos = controller.update();
      expect(pos?.x).toBeLessThan(20);
    });
  });

  describe('缓动函数', () => {
    it('应该支持自定义缓动函数', () => {
      const linearEase = (t: number) => t;
      controller.setEaseFunction(linearEase);

      controller.startJump(0, 0, 0, 10, 10, 10);
      const pos = controller.update();

      expect(pos).toBeDefined();
    });
  });
});
