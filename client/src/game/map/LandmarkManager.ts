import * as BABYLON from '@babylonjs/core';
import { Building, BuildingType, createDefaultBuilding } from '../types/GameObjectTypes';
import { MeshObjectMapper } from '../utils/MeshObjectMapper';
import { ensureGltfLoader } from '../loaders/ensureGltfLoader';

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
  private readonly loadedAssetRoots = new Map<string, BABYLON.TransformNode>();

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
    this.loadedAssetRoots.forEach((root) => root.dispose(false, true));
    this.loadedAssetRoots.clear();
    this.roots.forEach((root) => root.dispose(false, true));
    this.roots.clear();
    this.materials.forEach((material) => material.dispose());
    this.materials.clear();
  }

  /**
   * Replace one procedural landmark with the canonical GLB when available.
   * The procedural version remains visible until the import succeeds, so a
   * storage/network failure never removes the playable landmark.
   */
  public async loadCanonicalAsset(landmarkId: string, url: string): Promise<boolean> {
    const root = this.roots.get(landmarkId);
    const building = this.buildings.get(landmarkId);
    if (!root || !building || !url) return false;

    try {
      await ensureGltfLoader();
      const result = await BABYLON.SceneLoader.ImportMeshAsync('', '', url, this.scene);
      const importedRoot = new BABYLON.TransformNode(`${landmarkId}-canonical`, this.scene);
      importedRoot.parent = root;
      importedRoot.metadata = { assetId: landmarkId, gameplayOnly: true, source: 'canonical-glb' };

      const importedMeshes = result.meshes.filter((mesh) => mesh !== importedRoot);
      if (importedMeshes.length === 0) {
        importedRoot.dispose(false, true);
        return false;
      }

      importedMeshes.forEach((mesh) => {
        if (!mesh.parent) mesh.parent = importedRoot;
        mesh.metadata = { ...(mesh.metadata ?? {}), landmarkId, gameplayOnly: true, source: 'canonical-glb' };
        mesh.isPickable = mesh.name.includes('lod0') || mesh.name.includes('interaction');
        if (mesh instanceof BABYLON.Mesh) this.mapper.registerMesh(mesh, building);
      });

      const lod0 = importedMeshes.find((mesh) => mesh.name.includes('lod0'));
      const lod1 = importedMeshes.find((mesh) => mesh.name.includes('lod1'));
      const lod2 = importedMeshes.find((mesh) => mesh.name.includes('lod2'));
      lod0?.setEnabled(true);
      lod1?.setEnabled(false);
      lod2?.setEnabled(false);

      root.getChildren().forEach((child) => {
        if (child !== importedRoot) child.setEnabled(false);
      });
      this.loadedAssetRoots.set(landmarkId, importedRoot);
      return true;
    } catch (error) {
      console.warn(`[LandmarkManager] Canonical asset unavailable for ${landmarkId}; keeping procedural fallback.`, error);
      return false;
    }
  }

  private getDefinitions(): LandmarkDefinition[] {
    return [
      {
        landmarkId: 'landmark-city-core', displayName: '城市核心广场', zone: 'core', interactionType: 'spawn', npcIds: ['npc-city-guide'], prosperity: 100, isUnlocked: true,
        // Day 1 Lv.1 graybox: 32×32 m building body inside a 48×48 m lot.
        buildingType: 'city_core', position: new BABYLON.Vector3(0, 0, 0), size: { width: 32, height: 22, depth: 32 }, baseColor: BABYLON.Color3.FromHexString('#1E90FF'), accentColor: BABYLON.Color3.FromHexString('#FFD700'), shape: 'core',
      },
      {
        landmarkId: 'landmark-isc-bank', displayName: 'ISC 银行总部', zone: 'finance', interactionType: 'bank', npcIds: ['npc-bank-advisor'], prosperity: 0, isUnlocked: true,
        buildingType: 'bank', position: new BABYLON.Vector3(105, 0, 0), size: { width: 46, height: 30, depth: 34 }, baseColor: BABYLON.Color3.FromHexString('#0F3460'), accentColor: BABYLON.Color3.FromHexString('#FFD700'), shape: 'tower',
      },
      {
        landmarkId: 'landmark-central-market', displayName: '鸿运商都', zone: 'commercial', interactionType: 'market', npcIds: ['npc-market-merchant'], prosperity: 0, isUnlocked: true,
        buildingType: 'commercial_center', position: new BABYLON.Vector3(0, 0, -112), size: { width: 58, height: 22, depth: 42 }, baseColor: BABYLON.Color3.FromHexString('#B9C9D4'), accentColor: BABYLON.Color3.FromHexString('#304658'), shape: 'market',
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

    if (definition.shape === 'core') {
      this.createCoreConceptDetails(definition, root);
    }

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

  /**
   * Concept-aligned development substitute for the city core: a crystal
   * energy tower, three orbital rings and four smaller ice pylons. These
   * meshes are deliberately not registered as gameplay objects; they are
   * visual children of the landmark root and remain replaceable by the
   * canonical GLB/PBR delivery without changing interaction IDs.
   */
  private createCoreConceptDetails(definition: LandmarkDefinition, root: BABYLON.TransformNode): void {
    const foundationMaterial = this.getMaterial('city-core-foundation', BABYLON.Color3.FromHexString('#DCEAF2'), 0.12, 0.62);
    const crystalMaterial = this.getMaterial('city-core-crystal', BABYLON.Color3.FromHexString('#8CEBFF'), 0.72, 0.18);
    crystalMaterial.emissiveColor = BABYLON.Color3.FromHexString('#2D9CDB').scale(0.42);
    const goldMaterial = this.getMaterial('city-core-gold', BABYLON.Color3.FromHexString('#FFD166'), 0.82, 0.22);
    goldMaterial.emissiveColor = BABYLON.Color3.FromHexString('#F59E0B').scale(0.24);

    // Four modular wall blocks establish the 32×32 m Lv.1 footprint.
    const wallPositions = [
      new BABYLON.Vector3(0, 2.5, -14),
      new BABYLON.Vector3(0, 2.5, 14),
      new BABYLON.Vector3(-14, 2.5, 0),
      new BABYLON.Vector3(14, 2.5, 0),
    ];
    wallPositions.forEach((position, index) => {
      const wall = BABYLON.MeshBuilder.CreateBox(`${definition.landmarkId}-wall-module-${index + 1}`, {
        width: index < 2 ? 28 : 0.8,
        height: 5,
        depth: index < 2 ? 0.8 : 28,
      }, this.scene);
      wall.parent = root;
      wall.position = position;
      wall.material = foundationMaterial;
      wall.isPickable = false;
    });

    const centralPlatform = BABYLON.MeshBuilder.CreateBox(`${definition.landmarkId}-central-platform`, {
      width: 16,
      height: 1.2,
      depth: 16,
    }, this.scene);
    centralPlatform.parent = root;
    centralPlatform.position.y = 1.1;
    centralPlatform.material = foundationMaterial;
    centralPlatform.isPickable = false;

    const tower = BABYLON.MeshBuilder.CreateCylinder(`${definition.landmarkId}-crystal-tower`, {
      diameterTop: 3.2,
      diameterBottom: 8,
      height: 20,
      tessellation: 6,
    }, this.scene);
    tower.parent = root;
    tower.position.y = definition.size.height + 10;
    tower.rotation.z = Math.PI / 12;
    tower.material = crystalMaterial;
    tower.isPickable = false;

    [8, 13, 18].forEach((height, index) => {
      const ring = BABYLON.MeshBuilder.CreateTorus(`${definition.landmarkId}-energy-ring-${index + 1}`, {
        diameter: 10 + index * 8,
        thickness: 0.7,
        tessellation: 32,
      }, this.scene);
      ring.parent = root;
      ring.position.y = definition.size.height + height;
      ring.rotation.x = Math.PI / 2;
      ring.rotation.y = index % 2 === 0 ? Math.PI / 10 : -Math.PI / 10;
      ring.material = goldMaterial;
      ring.isPickable = false;
    });

    const pylonPositions = [
      new BABYLON.Vector3(-12, definition.size.height + 4, -12),
      new BABYLON.Vector3(12, definition.size.height + 4, -12),
      new BABYLON.Vector3(-12, definition.size.height + 4, 12),
      new BABYLON.Vector3(12, definition.size.height + 4, 12),
    ];
    pylonPositions.forEach((position, index) => {
      const pylon = BABYLON.MeshBuilder.CreateCylinder(`${definition.landmarkId}-pylon-${index + 1}`, {
        diameterTop: 1.2,
        diameterBottom: 3.2,
        height: 8,
        tessellation: 6,
      }, this.scene);
      pylon.parent = root;
      pylon.position = position;
      pylon.rotation.z = Math.PI / 10;
      pylon.material = crystalMaterial;
      pylon.isPickable = false;
    });
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
