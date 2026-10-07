import * as BABYLON from '@babylonjs/core';

/**
 * 导覽点定义
 */
export interface TourPoint {
  id: string;
  name: string;
  description: string;
  position: { x: number; y: number; z: number };
  lookAt: { x: number; y: number; z: number };
  duration: number; // 停留时间（毫秒）
  type: 'building' | 'landscape' | 'landmark';
}

/**
 * 导覽路线定义
 */
export interface TourRoute {
  id: string;
  name: string;
  description: string;
  points: TourPoint[];
  totalDuration: number; // 总时长（毫秒）
  loop: boolean; // 是否循环
}

/**
 * 导覽路线管理器
 * 管理导覽路线和导覽点的定义和获取
 */
export class TourRouteManager {
  private routes: Map<string, TourRoute> = new Map();
  private defaultRoute: string = '';

  constructor() {
    this.initializeDefaultRoutes();
  }

  /**
   * 初始化默认导覽路线
   */
  private initializeDefaultRoutes(): void {
    // 农业区完整导覽路线
    const agriculturalTourRoute: TourRoute = {
      id: 'agricultural-complete-tour',
      name: '农业区完整导覽',
      description: '游览农业区的所有主要建筑和景观',
      loop: true,
      points: [
        {
          id: 'tour-start',
          name: '导覽起点',
          description: '农业区入口',
          position: { x: 0, y: 50, z: -100 },
          lookAt: { x: 0, y: 0, z: 0 },
          duration: 3000,
          type: 'landmark',
        },
        {
          id: 'farmhouse',
          name: '农舍',
          description: '农民的住所和工作场所',
          position: { x: -80, y: 40, z: -60 },
          lookAt: { x: -80, y: 0, z: -60 },
          duration: 4000,
          type: 'building',
        },
        {
          id: 'greenhouse',
          name: '温室',
          description: '蔬菜和花卉种植地',
          position: { x: 60, y: 45, z: -80 },
          lookAt: { x: 60, y: 0, z: -80 },
          duration: 4000,
          type: 'building',
        },
        {
          id: 'drying-machine',
          name: '烘干机',
          description: '农产品烘干设备',
          position: { x: 80, y: 35, z: 20 },
          lookAt: { x: 80, y: 0, z: 20 },
          duration: 3000,
          type: 'building',
        },
        {
          id: 'storage',
          name: '仓库',
          description: '农产品存储设施',
          position: { x: -60, y: 40, z: 70 },
          lookAt: { x: -60, y: 0, z: 70 },
          duration: 3000,
          type: 'building',
        },
        {
          id: 'windmill',
          name: '风车',
          description: '传统农业工具',
          position: { x: 0, y: 50, z: 100 },
          lookAt: { x: 0, y: 0, z: 100 },
          duration: 4000,
          type: 'landmark',
        },
        {
          id: 'wheat-field',
          name: '麦田',
          description: '广阔的麦田景观',
          position: { x: -100, y: 40, z: 0 },
          lookAt: { x: -100, y: 0, z: 0 },
          duration: 4000,
          type: 'landscape',
        },
        {
          id: 'orchard',
          name: '果园',
          description: '果树种植区',
          position: { x: 100, y: 40, z: 0 },
          lookAt: { x: 100, y: 0, z: 0 },
          duration: 4000,
          type: 'landscape',
        },
        {
          id: 'tour-end',
          name: '导覽结束',
          description: '返回起点',
          position: { x: 0, y: 50, z: -100 },
          lookAt: { x: 0, y: 0, z: 0 },
          duration: 2000,
          type: 'landmark',
        },
      ],
      totalDuration: 0,
    };

    // 计算总时长
    agriculturalTourRoute.totalDuration = agriculturalTourRoute.points.reduce(
      (sum, point) => sum + point.duration,
      0
    );

    this.routes.set(agriculturalTourRoute.id, agriculturalTourRoute);
    this.defaultRoute = agriculturalTourRoute.id;

    // 快速导覽路线（只访问主要建筑）
    const quickTourRoute: TourRoute = {
      id: 'agricultural-quick-tour',
      name: '农业区快速导覽',
      description: '快速浏览农业区的主要建筑',
      loop: true,
      points: [
        {
          id: 'quick-start',
          name: '快速导覽起点',
          description: '农业区入口',
          position: { x: 0, y: 50, z: -100 },
          lookAt: { x: 0, y: 0, z: 0 },
          duration: 2000,
          type: 'landmark',
        },
        {
          id: 'quick-farmhouse',
          name: '农舍',
          description: '农民的住所',
          position: { x: -80, y: 40, z: -60 },
          lookAt: { x: -80, y: 0, z: -60 },
          duration: 2000,
          type: 'building',
        },
        {
          id: 'quick-greenhouse',
          name: '温室',
          description: '蔬菜种植地',
          position: { x: 60, y: 45, z: -80 },
          lookAt: { x: 60, y: 0, z: -80 },
          duration: 2000,
          type: 'building',
        },
        {
          id: 'quick-storage',
          name: '仓库',
          description: '农产品存储',
          position: { x: -60, y: 40, z: 70 },
          lookAt: { x: -60, y: 0, z: 70 },
          duration: 2000,
          type: 'building',
        },
        {
          id: 'quick-end',
          name: '快速导覽结束',
          description: '返回起点',
          position: { x: 0, y: 50, z: -100 },
          lookAt: { x: 0, y: 0, z: 0 },
          duration: 1500,
          type: 'landmark',
        },
      ],
      totalDuration: 0,
    };

    quickTourRoute.totalDuration = quickTourRoute.points.reduce(
      (sum, point) => sum + point.duration,
      0
    );

    this.routes.set(quickTourRoute.id, quickTourRoute);

    // 风景导覽路线（只访问景观）
    const sceneryTourRoute: TourRoute = {
      id: 'agricultural-scenery-tour',
      name: '农业区风景导覽',
      description: '欣赏农业区的自然风景',
      loop: true,
      points: [
        {
          id: 'scenery-start',
          name: '风景导覽起点',
          description: '农业区入口',
          position: { x: 0, y: 50, z: -100 },
          lookAt: { x: 0, y: 0, z: 0 },
          duration: 2000,
          type: 'landmark',
        },
        {
          id: 'scenery-wheat',
          name: '麦田',
          description: '金色的麦田',
          position: { x: -100, y: 40, z: 0 },
          lookAt: { x: -100, y: 0, z: 0 },
          duration: 5000,
          type: 'landscape',
        },
        {
          id: 'scenery-orchard',
          name: '果园',
          description: '绿色的果园',
          position: { x: 100, y: 40, z: 0 },
          lookAt: { x: 100, y: 0, z: 0 },
          duration: 5000,
          type: 'landscape',
        },
        {
          id: 'scenery-windmill',
          name: '风车',
          description: '标志性的风车',
          position: { x: 0, y: 50, z: 100 },
          lookAt: { x: 0, y: 0, z: 100 },
          duration: 4000,
          type: 'landmark',
        },
        {
          id: 'scenery-end',
          name: '风景导覽结束',
          description: '返回起点',
          position: { x: 0, y: 50, z: -100 },
          lookAt: { x: 0, y: 0, z: 0 },
          duration: 2000,
          type: 'landmark',
        },
      ],
      totalDuration: 0,
    };

    sceneryTourRoute.totalDuration = sceneryTourRoute.points.reduce(
      (sum, point) => sum + point.duration,
      0
    );

    this.routes.set(sceneryTourRoute.id, sceneryTourRoute);
  }

  /**
   * 获取所有导覽路线
   */
  getRoutes(): TourRoute[] {
    return Array.from(this.routes.values());
  }

  /**
   * 获取指定ID的导覽路线
   */
  getRoute(routeId: string): TourRoute | undefined {
    return this.routes.get(routeId);
  }

  /**
   * 获取默认导覽路线
   */
  getDefaultRoute(): TourRoute | undefined {
    return this.routes.get(this.defaultRoute);
  }

  /**
   * 添加自定义导覽路线
   */
  addRoute(route: TourRoute): void {
    route.totalDuration = route.points.reduce((sum, point) => sum + point.duration, 0);
    this.routes.set(route.id, route);
  }

  /**
   * 移除导覽路线
   */
  removeRoute(routeId: string): void {
    this.routes.delete(routeId);
  }

  /**
   * 设置默认导覽路线
   */
  setDefaultRoute(routeId: string): void {
    if (this.routes.has(routeId)) {
      this.defaultRoute = routeId;
    }
  }

  /**
   * 获取导覽路线的总时长（秒）
   */
  getRouteDuration(routeId: string): number {
    const route = this.routes.get(routeId);
    return route ? route.totalDuration / 1000 : 0;
  }

  /**
   * 获取导覽路线的点数
   */
  getRoutePointCount(routeId: string): number {
    const route = this.routes.get(routeId);
    return route ? route.points.length : 0;
  }

  /**
   * 获取导覽路线的下一个点
   */
  getNextPoint(routeId: string, currentIndex: number): TourPoint | undefined {
    const route = this.routes.get(routeId);
    if (!route) return undefined;

    const nextIndex = currentIndex + 1;
    if (nextIndex < route.points.length) {
      return route.points[nextIndex];
    }

    // 如果是循环路线，返回第一个点
    if (route.loop && route.points.length > 0) {
      return route.points[0];
    }

    return undefined;
  }

  /**
   * 获取导覽路线的上一个点
   */
  getPreviousPoint(routeId: string, currentIndex: number): TourPoint | undefined {
    const route = this.routes.get(routeId);
    if (!route) return undefined;

    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      return route.points[prevIndex];
    }

    // 如果是循环路线，返回最后一个点
    if (route.loop && route.points.length > 0) {
      return route.points[route.points.length - 1];
    }

    return undefined;
  }
}
