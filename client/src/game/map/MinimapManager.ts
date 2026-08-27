// Babylon.js 类型定义（在运行时可用）
type Color3 = any;

/**
 * 小地图位置标记
 */
export interface MinimapMarker {
  id: string;
  name: string;
  x: number;
  z: number;
  type: 'building' | 'vegetation' | 'poi' | 'player';
  color: Color3;
  radius: number;
}

/**
 * 小地图配置
 */
export interface MinimapConfig {
  width: number;
  height: number;
  scale: number;
  centerX: number;
  centerZ: number;
  showGrid: boolean;
  showMarkers: boolean;
}

/**
 * 小地图数据管理器
 * 负责管理小地图的数据、标记和相机位置
 */
export class MinimapManager {
  private config: MinimapConfig;
  private markers: Map<string, MinimapMarker> = new Map();
  private cameraPosition: { x: number; z: number } = { x: 0, z: 0 };
  private cameraRotation: number = 0;
  private mapBounds: { minX: number; maxX: number; minZ: number; maxZ: number } = {
    minX: -100,
    maxX: 100,
    minZ: -100,
    maxZ: 100,
  };

  constructor(config: Partial<MinimapConfig> = {}) {
    this.config = {
      width: 200,
      height: 200,
      scale: 1,
      centerX: 0,
      centerZ: 0,
      showGrid: true,
      showMarkers: true,
      ...config,
    };
  }

  /**
   * 设置地图边界
   */
  public setMapBounds(minX: number, maxX: number, minZ: number, maxZ: number): void {
    this.mapBounds = { minX, maxX, minZ, maxZ };
  }

  /**
   * 获取地图边界
   */
  public getMapBounds(): typeof this.mapBounds {
    return this.mapBounds;
  }

  /**
   * 添加标记
   */
  public addMarker(marker: MinimapMarker): void {
    this.markers.set(marker.id, marker);
  }

  /**
   * 移除标记
   */
  public removeMarker(id: string): void {
    this.markers.delete(id);
  }

  /**
   * 获取所有标记
   */
  public getMarkers(): MinimapMarker[] {
    return Array.from(this.markers.values());
  }

  /**
   * 获取特定类型的标记
   */
  public getMarkersByType(type: MinimapMarker['type']): MinimapMarker[] {
    return Array.from(this.markers.values()).filter((marker) => marker.type === type);
  }

  /**
   * 更新标记位置
   */
  public updateMarkerPosition(id: string, x: number, z: number): void {
    const marker = this.markers.get(id);
    if (marker) {
      marker.x = x;
      marker.z = z;
    }
  }

  /**
   * 清空所有标记
   */
  public clearMarkers(): void {
    this.markers.clear();
  }

  /**
   * 更新相机位置
   */
  public updateCameraPosition(x: number, z: number, rotation: number = 0): void {
    this.cameraPosition = { x, z };
    this.cameraRotation = rotation;
  }

  /**
   * 获取相机位置
   */
  public getCameraPosition(): { x: number; z: number; rotation: number } {
    return {
      x: this.cameraPosition.x,
      z: this.cameraPosition.z,
      rotation: this.cameraRotation,
    };
  }

  /**
   * 将世界坐标转换为小地图坐标
   */
  public worldToMinimap(worldX: number, worldZ: number): { x: number; y: number } {
    const { minX, maxX, minZ, maxZ } = this.mapBounds;
    const { width, height } = this.config;

    // 归一化坐标
    const normalizedX = (worldX - minX) / (maxX - minX);
    const normalizedZ = (worldZ - minZ) / (maxZ - minZ);

    // 转换为小地图坐标
    const minimapX = normalizedX * width;
    const minimapY = normalizedZ * height;

    return { x: minimapX, y: minimapY };
  }

  /**
   * 将小地图坐标转换为世界坐标
   */
  public minimapToWorld(minimapX: number, minimapY: number): { x: number; z: number } {
    const { minX, maxX, minZ, maxZ } = this.mapBounds;
    const { width, height } = this.config;

    // 归一化小地图坐标
    const normalizedX = minimapX / width;
    const normalizedZ = minimapY / height;

    // 转换为世界坐标
    const worldX = minX + normalizedX * (maxX - minX);
    const worldZ = minZ + normalizedZ * (maxZ - minZ);

    return { x: worldX, z: worldZ };
  }

  /**
   * 获取配置
   */
  public getConfig(): MinimapConfig {
    return this.config;
  }

  /**
   * 更新配置
   */
  public updateConfig(config: Partial<MinimapConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取小地图中心
   */
  public getCenter(): { x: number; z: number } {
    return {
      x: this.config.centerX,
      z: this.config.centerZ,
    };
  }

  /**
   * 设置小地图中心
   */
  public setCenter(x: number, z: number): void {
    this.config.centerX = x;
    this.config.centerZ = z;
  }

  /**
   * 计算两点之间的距离
   */
  public calculateDistance(x1: number, z1: number, x2: number, z2: number): number {
    const dx = x2 - x1;
    const dz = z2 - z1;
    return Math.sqrt(dx * dx + dz * dz);
  }

  /**
   * 检查点是否在地图范围内
   */
  public isPointInBounds(x: number, z: number): boolean {
    const { minX, maxX, minZ, maxZ } = this.mapBounds;
    return x >= minX && x <= maxX && z >= minZ && z <= maxZ;
  }

  /**
   * 获取视图范围（用于显示相机视锥）
   */
  public getViewFrustum(
    cameraX: number,
    cameraZ: number,
    viewDistance: number,
    viewAngle: number
  ): { points: Array<{ x: number; y: number }>; rotation: number } {
    const minimapPos = this.worldToMinimap(cameraX, cameraZ);

    // 计算视锥的四个顶点
    const angle1 = this.cameraRotation - viewAngle / 2;
    const angle2 = this.cameraRotation + viewAngle / 2;

    const worldViewDistance = viewDistance;
    const minimapViewDistance = Math.sqrt(
      Math.pow(worldViewDistance * Math.cos(angle1), 2) +
        Math.pow(worldViewDistance * Math.sin(angle1), 2)
    );

    const points: Array<{ x: number; y: number }> = [];

    // 左上角
    const leftTopWorld = {
      x: cameraX + worldViewDistance * Math.cos(angle1),
      z: cameraZ + worldViewDistance * Math.sin(angle1),
    };
    points.push(this.worldToMinimap(leftTopWorld.x, leftTopWorld.z));

    // 右上角
    const rightTopWorld = {
      x: cameraX + worldViewDistance * Math.cos(angle2),
      z: cameraZ + worldViewDistance * Math.sin(angle2),
    };
    points.push(this.worldToMinimap(rightTopWorld.x, rightTopWorld.z));

    // 相机位置
    points.push(minimapPos);

    return {
      points,
      rotation: this.cameraRotation,
    };
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    this.markers.clear();
  }
}
