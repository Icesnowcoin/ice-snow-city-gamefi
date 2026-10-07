/**
 * 共享游戏世界和地图系统 (Phase 86)
 * 实现全局地图、建筑管理、玩家位置追踪和区域同步
 */

export interface Position {
  x: number;
  y: number;
}

export interface Chunk {
  id: string;
  position: Position;
  buildings: Building[];
  resources: Resource[];
  players: string[];
  lastUpdate: number;
}

export interface Building {
  id: string;
  ownerId: string;
  type: 'house' | 'shop' | 'factory' | 'office' | 'bank';
  position: Position;
  size: { width: number; height: number };
  level: number;
  status: 'active' | 'abandoned' | 'for_sale';
  revenue: number;
  maintenance: number;
  capacity: number;
  createdAt: number;
  lastUpdate: number;
}

export interface Resource {
  id: string;
  type: 'mineral' | 'agricultural' | 'energy' | 'commercial';
  position: Position;
  quantity: number;
  regenerationRate: number;
  lastHarvest: number;
}

export interface PlayerLocation {
  playerId: string;
  position: Position;
  chunkId: string;
  visiblePlayers: string[];
  lastUpdate: number;
}

export interface MapEvent {
  id: string;
  type: 'player_joined' | 'building_created' | 'trade_completed' | 'disaster';
  location: Position;
  affectedPlayers: string[];
  timestamp: number;
  data: Record<string, unknown>;
}

/**
 * 共享游戏世界管理器
 */
export class SharedGameWorldManager {
  private chunks: Map<string, Chunk> = new Map();
  private buildings: Map<string, Building> = new Map();
  private playerLocations: Map<string, PlayerLocation> = new Map();
  private resources: Map<string, Resource> = new Map();
  private mapEvents: MapEvent[] = [];

  // 地图配置
  private readonly MAP_SIZE = 10000;
  private readonly GRID_SIZE = 100;
  private readonly CHUNK_SIZE = 1000;
  private readonly VISION_RANGE = 500;
  private readonly LOAD_RANGE = 1000;
  private readonly MAX_EVENTS = 10000;

  constructor() {
    this.initializeMap();
  }

  /**
   * 初始化地图
   */
  private initializeMap(): void {
    // 创建所有 Chunk
    const chunksPerSide = Math.ceil(this.MAP_SIZE / this.CHUNK_SIZE);
    for (let x = 0; x < chunksPerSide; x++) {
      for (let y = 0; y < chunksPerSide; y++) {
        const chunkId = `chunk_${x}_${y}`;
        this.chunks.set(chunkId, {
          id: chunkId,
          position: { x: x * this.CHUNK_SIZE, y: y * this.CHUNK_SIZE },
          buildings: [],
          resources: [],
          players: [],
          lastUpdate: Date.now(),
        });
      }
    }

    // 初始化资源分布
    this.initializeResources();
  }

  /**
   * 初始化资源分布
   */
  private initializeResources(): void {
    const resourceTypes: Array<'mineral' | 'agricultural' | 'energy' | 'commercial'> = [
      'mineral',
      'agricultural',
      'energy',
      'commercial',
    ];

    for (let i = 0; i < 500; i++) {
      const x = Math.random() * this.MAP_SIZE;
      const y = Math.random() * this.MAP_SIZE;
      const type = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];

      const resource: Resource = {
        id: `resource_${i}`,
        type,
        position: { x, y },
        quantity: Math.floor(Math.random() * 1000) + 100,
        regenerationRate: Math.random() * 10,
        lastHarvest: 0,
      };

      this.resources.set(resource.id, resource);
    }
  }

  /**
   * 获取玩家所在的 Chunk ID
   */
  private getChunkId(position: Position): string {
    const chunkX = Math.floor(position.x / this.CHUNK_SIZE);
    const chunkY = Math.floor(position.y / this.CHUNK_SIZE);
    return `chunk_${chunkX}_${chunkY}`;
  }

  /**
   * 获取相邻的 Chunk
   */
  private getAdjacentChunks(chunkId: string): string[] {
    const [, x, y] = chunkId.split('_');
    const chunkX = parseInt(x);
    const chunkY = parseInt(y);

    const adjacent: string[] = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const adjId = `chunk_${chunkX + dx}_${chunkY + dy}`;
        if (this.chunks.has(adjId)) {
          adjacent.push(adjId);
        }
      }
    }
    return adjacent;
  }

  /**
   * 更新玩家位置
   */
  updatePlayerLocation(playerId: string, position: Position): void {
    const chunkId = this.getChunkId(position);
    const chunk = this.chunks.get(chunkId);

    if (!chunk) return;

    const oldLocation = this.playerLocations.get(playerId);
    const visiblePlayers = this.getVisiblePlayers(position);

    const newLocation: PlayerLocation = {
      playerId,
      position,
      chunkId,
      visiblePlayers,
      lastUpdate: Date.now(),
    };

    this.playerLocations.set(playerId, newLocation);

    // 更新 Chunk 中的玩家列表
    if (oldLocation && oldLocation.chunkId !== chunkId) {
      const oldChunk = this.chunks.get(oldLocation.chunkId);
      if (oldChunk) {
        oldChunk.players = oldChunk.players.filter((id) => id !== playerId);
      }
    }

    if (!chunk.players.includes(playerId)) {
      chunk.players.push(playerId);
    }

    chunk.lastUpdate = Date.now();
  }

  /**
   * 获取视野内的玩家
   */
  private getVisiblePlayers(position: Position): string[] {
    const visible: string[] = [];

    this.playerLocations.forEach((location, playerId) => {
      const distance = Math.sqrt(
        Math.pow(location.position.x - position.x, 2) +
          Math.pow(location.position.y - position.y, 2)
      );

      if (distance <= this.VISION_RANGE) {
        visible.push(playerId);
      }
    });

    return visible;
  }

  /**
   * 创建建筑
   */
  createBuilding(
    ownerId: string,
    type: Building['type'],
    position: Position,
    size: { width: number; height: number }
  ): Building | null {
    // 检查位置是否有效
    if (!this.isValidBuildingPosition(position, size)) {
      return null;
    }

    const building: Building = {
      id: `building_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ownerId,
      type,
      position,
      size,
      level: 1,
      status: 'active',
      revenue: this.getBaseRevenue(type),
      maintenance: this.getBaseMaintenance(type),
      capacity: this.getBaseCapacity(type),
      createdAt: Date.now(),
      lastUpdate: Date.now(),
    };

    this.buildings.set(building.id, building);

    // 添加到对应的 Chunk
    const chunkId = this.getChunkId(position);
    const chunk = this.chunks.get(chunkId);
    if (chunk) {
      chunk.buildings.push(building);
      chunk.lastUpdate = Date.now();
    }

    // 记录事件
    this.recordEvent({
      id: `event_${Date.now()}`,
      type: 'building_created',
      location: position,
      affectedPlayers: this.getVisiblePlayers(position),
      timestamp: Date.now(),
      data: { building },
    });

    return building;
  }

  /**
   * 检查建筑位置是否有效
   */
  private isValidBuildingPosition(position: Position, size: { width: number; height: number }): boolean {
    // 检查是否超出地图边界
    if (
      position.x < 0 ||
      position.y < 0 ||
      position.x + size.width > this.MAP_SIZE ||
      position.y + size.height > this.MAP_SIZE
    ) {
      return false;
    }

    // 检查是否与现有建筑冲突
    const buildingsArray = Array.from(this.buildings.values());
    for (const building of buildingsArray) {
      if (this.buildingsOverlap(position, size, building.position, building.size)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 检查两个建筑是否重叠
   */
  private buildingsOverlap(
    pos1: Position,
    size1: { width: number; height: number },
    pos2: Position,
    size2: { width: number; height: number }
  ): boolean {
    return !(
      pos1.x + size1.width <= pos2.x ||
      pos1.y + size1.height <= pos2.y ||
      pos2.x + size2.width <= pos1.x ||
      pos2.y + size2.height <= pos1.y
    );
  }

  /**
   * 获取基础收入
   */
  private getBaseRevenue(type: Building['type']): number {
    const revenues: Record<Building['type'], number> = {
      house: 10,
      shop: 50,
      factory: 200,
      office: 100,
      bank: 500,
    };
    return revenues[type];
  }

  /**
   * 获取基础维护费
   */
  private getBaseMaintenance(type: Building['type']): number {
    const maintenances: Record<Building['type'], number> = {
      house: 5,
      shop: 20,
      factory: 100,
      office: 50,
      bank: 200,
    };
    return maintenances[type];
  }

  /**
   * 获取基础容量
   */
  private getBaseCapacity(type: Building['type']): number {
    const capacities: Record<Building['type'], number> = {
      house: 10,
      shop: 50,
      factory: 100,
      office: 30,
      bank: 1000,
    };
    return capacities[type];
  }

  /**
   * 加载区域数据
   */
  loadChunkData(chunkId: string): Chunk | null {
    return this.chunks.get(chunkId) || null;
  }

  /**
   * 获取玩家周围的 Chunk 数据
   */
  getLoadedChunksForPlayer(playerId: string): Chunk[] {
    const location = this.playerLocations.get(playerId);
    if (!location) return [];

    const adjacentChunks = this.getAdjacentChunks(location.chunkId);
    return adjacentChunks
      .map((chunkId) => this.chunks.get(chunkId))
      .filter((chunk): chunk is Chunk => chunk !== undefined);
  }

  /**
   * 获取玩家位置
   */
  getPlayerLocation(playerId: string): PlayerLocation | null {
    return this.playerLocations.get(playerId) || null;
  }

  /**
   * 获取建筑信息
   */
  getBuilding(buildingId: string): Building | null {
    return this.buildings.get(buildingId) || null;
  }

  /**
   * 获取区域内的建筑
   */
  getBuildingsInArea(position: Position, radius: number): Building[] {
    const buildings: Building[] = [];

    const buildingsArray = Array.from(this.buildings.values());
    for (const building of buildingsArray) {
      const distance = Math.sqrt(
        Math.pow(building.position.x - position.x, 2) +
          Math.pow(building.position.y - position.y, 2)
      );

      if (distance <= radius) {
        buildings.push(building);
      }
    }

    return buildings;
  }

  /**
   * 获取资源信息
   */
  getResourcesInArea(position: Position, radius: number): Resource[] {
    const resources: Resource[] = [];

    const resourcesArray = Array.from(this.resources.values());
    for (const resource of resourcesArray) {
      const distance = Math.sqrt(
        Math.pow(resource.position.x - position.x, 2) +
          Math.pow(resource.position.y - position.y, 2)
      );

      if (distance <= radius) {
        resources.push(resource);
      }
    }

    return resources;
  }

  /**
   * 记录地图事件
   */
  private recordEvent(event: MapEvent): void {
    this.mapEvents.push(event);
    if (this.mapEvents.length > this.MAX_EVENTS) {
      this.mapEvents.shift();
    }
  }

  /**
   * 获取最近的事件
   */
  getRecentEvents(limit: number = 50): MapEvent[] {
    return this.mapEvents.slice(-limit);
  }

  /**
   * 获取系统统计
   */
  getSystemStats(): {
    totalChunks: number;
    totalBuildings: number;
    totalResources: number;
    totalPlayers: number;
    totalEvents: number;
  } {
    return {
      totalChunks: this.chunks.size,
      totalBuildings: this.buildings.size,
      totalResources: this.resources.size,
      totalPlayers: this.playerLocations.size,
      totalEvents: this.mapEvents.length,
    };
  }
}

export default SharedGameWorldManager;
