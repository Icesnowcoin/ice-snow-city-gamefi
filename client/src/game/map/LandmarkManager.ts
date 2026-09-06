import * as BABYLON from '@babylonjs/core';
import { Building, BuildingType, createDefaultBuilding } from '../types/GameObjectTypes';
import { MeshObjectMapper } from '../utils/MeshObjectMapper';

export type LandmarkZone = 'core' | 'finance' | 'commercial' | 'residential' | 'production' | 'public' | 'social';
export type LandmarkInteraction = 'spawn' | 'bank' | 'market' | 'property' | 'production' | 'quest' | 'guild' | 'logistics';

export interface LandmarkMetadata {
  landmarkId: string;
  displayName: string;
  zone: LandmarkZone;
  interactionType: LandmarkInteraction;
  npcIds: string[];
  prosperity: number;
  isUnlocked: boolean;
}

type LandmarkDefinition = LandmarkMetadata & {
  buildingType: BuildingType;
  position: BABYLON.Vector3;
  size: { width: number; height: number; depth: number };
  baseColor: BABYLON.Color3;
  accentColor: BABYLON.Color3;
  shape: 'core' | 'tower' | 'market' | 'residential' | 'factory' | 'hall' | 'guild' | 'logistics';
};

const pbr = (scene: BABYLON.Scene, name: string, albedoColor: BABYLON.Color3, metallic: number, roughness: number) => {
  const material = new BABYLON.PBRMaterial(name, scene);
  material.albedoColor = albedoColor;
  material.metallic = metallic;
  material.roughness = roughness;
  material.emissiveColor = albedoColor.scale(0.025);
  return material;
};

/**
 * 创建商业帝国初始地标的程序化灰盒。
 * 每个地标都保留稳定根节点、交互元数据和可替换的 render/collision 子节点。
 */
export class LandmarkManager {
  private readonly scene: BABYLON.Scene;
  private readonly mapper: MeshObjectMapper;
  private readonly roots = new Map<string, BABYLON.TransformNode>();
  private readonly buildings = new Map<string, Building>();
  private readonly materials = new Map<string, BABYLON.PBRMaterial>();

  constructor(scene: BABYLON.Scene, mapper: MeshObjectMapper) {
    this.scene = scene;
    this.mapper = mapper;
  }

  public createAllLandmarks(): void {
    this.clear();
    this.getDefinitions().forEach((definition) => this.createLandmark(definition));
  }

  public getBuildings(): Map<string, Building> {
    return this.buildings;
  }

  public getRoots(): Map<string, BABYLON.TransformNode> {
    return this.roots;
  }

  public clear(): void {
    this.buildings.forEach((building) => this.mapper.unregisterObject(building));
    this.buildings.clear();
    this.roots.forEach((root) => root.dispose(false, true));
    this.roots.clear();
    this.materials.forEach((material) => material.dispose());
    this.materials.clear();
  }

  private getDefinitions(): LandmarkDefinition[] {
    return [
      {
        landmarkId: 'landmark-city-core', displayName: '城市核心广场', zone: 'core', interactionType: 'spawn', npcIds: ['npc-city-guide'], prosperity: 100, isUnlocked: true,
        buildingType: 'city_core', position: new BABYLON.Vector3(0, 0, 0), size: { width: 48, height: 13, depth: 48 }, baseColor: BABYLON.Color3.FromHexString('#1E90FF'), accentColor: BABYLON.Color3.FromHexString('#FFD700'), shape: 'core',
      },
      {
        landmarkId: 'landmark-isc-bank', displayName: 'ISC 银行总部', zone: 'finance', interactionType: 'bank', npcIds: ['npc-bank-advisor'], prosperity: 0, isUnlocked: true,
        buildingType: 'bank', position: new BABYLON.Vector3(105, 0, 0), size: { width: 46, height: 30, depth: 34 }, baseColor: BABYLON.Color3.FromHexString('#0F3460'), accentColor: BABYLON.Color3.FromHexString('#FFD700'), shape: 'tower',
      },
      {
        landmarkId: 'landmark-central-market', displayName: '鸿运商都', zone: 'commercial', interactionType: 'market', npcIds: ['npc-market-merchant'], prosperity: 0, isUnlocked: true,
        buildingType: 'commercial_center', position: new BABYLON.Vector3(0, 0, -112), size: { width: 58, height: 22, depth: 42 }, baseColor: BABYLON.Color3.FromHexString('#A9DDF5'), accentColor: BABYLON.Color3.FromHexString('#B37FEB'), shape: 'market',
      },
      {
        landmarkId: 'landmark-residential-service', displayName: '瑞景华府服务中心', zone: 'residential', interactionType: 'property', npcIds: ['npc-residential-architect'], prosperity: 0, isUnlocked: true,
        buildingType: 'residential_service', position: new BABYLON.Vector3(-108, 0, 12), size: { width: 50, height: 18, depth: 36 }, baseColor: BABYLON.Color3.FromHexString('#F8F9FA'), accentColor: BABYLON.Color3.FromHexString('#FFD700'), shape: 'residential',
      },
      {
        landmarkId: 'landmark-production-hub', displayName: '丰盈智造园', zone: 'production', interactionType: 'production', npcIds: ['npc-production-manager'], prosperity: 0, isUnlocked: true,
        buildingType: 'production_hub', position: new BABYLON.Vector3(0, 0, 118), size: { width: 64, height: 24, depth: 48 }, baseColor: BABYLON.Color3.FromHexString('#42C99A'), accentColor: BABYLON.Color3.FromHexString('#1E90FF'), shape: 'factory',
      },
      {
        landmarkId: 'landmark-quest-hall', displayName: '荣耀任务大厅', zone: 'public', interactionType: 'quest', npcIds: ['npc-quest-officer'], prosperity: 0, isUnlocked: true,
        buildingType: 'quest_hall', position: new BABYLON.Vector3(72, 0, 82), size: { width: 42, height: 21, depth: 32 }, baseColor: BABYLON.Color3.FromHexString('#0F3460'), accentColor: BABYLON.Color3.FromHexString('#FFD700'), shape: 'hall',
      },
      {
        landmarkId: 'landmark-guild-hall', displayName: '同心会馆', zone: 'social', interactionType: 'guild', npcIds: ['npc-guild-manager'], prosperity: 0, isUnlocked: true,
        buildingType: 'guild_hall', position: new BABYLON.Vector3(-70, 0, 92), size: { width: 42, height: 19, depth: 32 }, baseColor: BABYLON.Color3.FromHexString('#3C4A9E'), accentColor: BABYLON.Color3.FromHexString('#B37FEB'), shape: 'guild',
      },
      {
        landmarkId: 'landmark-logistics-terminal', displayName: '鸿运物流枢纽', zone: 'production', interactionType: 'logistics', npcIds: ['npc-logistics-dispatcher'], prosperity: 0, isUnlocked: true,
        buildingType: 'logistics_terminal', position: new BABYLON.Vector3(70, 0, 122), size: { width: 54, height: 16, depth: 34 }, baseColor: BABYLON.Color3.FromHexString('#34506B'), accentColor: BABYLON.Color3.FromHexString('#FF8C42'), shape: 'logistics',
      },
    ];
  }

  private createLandmark(definition: LandmarkDefinition): void {
    const root = new BABYLON.TransformNode(definition.landmarkId, this.scene);
    root.position = definition.position;
    root.metadata = this.toMetadata(definition);

    const building = createDefaultBuilding(definition.landmarkId, definition.displayName, definition.buildingType, {
      x: definition.position.x,
      y: 0,
      z: definition.position.z,
    });
    building.description = `${definition.displayName}：基础城市地标占位模型，后续可替换为 GLB/PBR 正式资产。`;
    building.size = definition.size;
    building.color = { r: definition.baseColor.r, g: definition.baseColor.g, b: definition.baseColor.b };
    this.buildings.set(definition.landmarkId, building);
    this.roots.set(definition.landmarkId, root);

    const base = BABYLON.MeshBuilder.CreateBox(`${definition.landmarkId}-base`, {
      width: definition.size.width + 8,
      height: 1,
      depth: definition.size.depth + 8,
    }, this.scene);
    base.position.y = 0.5;
    base.parent = root;
    base.material = this.getMaterial('snow', BABYLON.Color3.FromHexString('#F8F9FA'), 0.05, 0.7);

    const render = this.createMainMesh(definition);
    render.parent = root;
    render.position.y = definition.size.height / 2;
    render.metadata = this.toMetadata(definition);
    render.isPickable = true;
    render.material = this.getMaterial(definition.landmarkId, definition.baseColor, 0.35, 0.42);

    const accent = this.createAccentMesh(definition);
    accent.parent = root;
    accent.metadata = this.toMetadata(definition);
    accent.isPickable = true;
    accent.material = this.getMaterial(`${definition.landmarkId}-accent`, definition.accentColor, 0.65, 0.28);

    const collision = BABYLON.MeshBuilder.CreateBox(`${definition.landmarkId}-collision`, {
      width: definition.size.width,
      height: definition.size.height,
      depth: definition.size.depth,
    }, this.scene);
    collision.parent = root;
    collision.position.y = definition.size.height / 2;
    collision.isVisible = false;
    collision.isPickable = false;
    collision.checkCollisions = true;

    this.mapper.registerMeshes([base, render, accent], building);
  }

  private createMainMesh(definition: LandmarkDefinition): BABYLON.Mesh {
    const { width, height, depth } = definition.size;
    if (definition.shape === 'core' || definition.shape === 'tower') {
      return BABYLON.MeshBuilder.CreateCylinder(`${definition.landmarkId}-render`, { diameter: Math.min(width, depth), height, tessellation: 12 }, this.scene);
    }
    return BABYLON.MeshBuilder.CreateBox(`${definition.landmarkId}-render`, { width, height, depth }, this.scene);
  }

  private createAccentMesh(definition: LandmarkDefinition): BABYLON.Mesh {
    const { width, height, depth } = definition.size;
    const accent = BABYLON.MeshBuilder.CreateBox(`${definition.landmarkId}-accent`, {
      width: Math.max(6, width * 0.62),
      height: Math.max(2, height * 0.12),
      depth: Math.max(2, depth * 0.08),
    }, this.scene);
    accent.position = new BABYLON.Vector3(0, height * 0.72, depth / 2 + 0.5);
    return accent;
  }

  private getMaterial(key: string, color: BABYLON.Color3, metallic: number, roughness: number): BABYLON.PBRMaterial {
    const existing = this.materials.get(key);
    if (existing) return existing;
    const material = pbr(this.scene, `${key}-pbr`, color, metallic, roughness);
    this.materials.set(key, material);
    return material;
  }

  private toMetadata(definition: LandmarkDefinition): LandmarkMetadata {
    return {
      landmarkId: definition.landmarkId,
      displayName: definition.displayName,
      zone: definition.zone,
      interactionType: definition.interactionType,
      npcIds: definition.npcIds,
      prosperity: definition.prosperity,
      isUnlocked: definition.isUnlocked,
    };
  }
}
