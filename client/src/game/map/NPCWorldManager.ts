import * as BABYLON from '@babylonjs/core';
import { MinimapManager } from './MinimapManager';

export interface NPCPatrolPoint {
  x: number;
  z: number;
  pauseSeconds?: number;
}

export interface NPCWorldDefinition {
  npcId: string;
  name: string;
  role: string;
  zone: string;
  position: { x: number; z: number };
  color: BABYLON.Color3;
  patrol: NPCPatrolPoint[];
}

export interface NPCWorldState extends NPCWorldDefinition {
  currentPoint: number;
  progress: number;
  paused: boolean;
}

const NPC_DEFINITIONS: NPCWorldDefinition[] = [
  {
    npcId: 'npc-city-guide', name: '星澜向导', role: '城市引导员', zone: '城市核心',
    position: { x: 0, z: 16 }, color: BABYLON.Color3.FromHexString('#67E8F9'),
    patrol: [{ x: -14, z: 14, pauseSeconds: 1 }, { x: 14, z: 14, pauseSeconds: 1 }, { x: 14, z: 30, pauseSeconds: 1 }, { x: -14, z: 30, pauseSeconds: 1 }],
  },
  {
    npcId: 'npc-bank-advisor', name: '金衡顾问', role: '银行顾问', zone: '金融区',
    position: { x: 105, z: 14 }, color: BABYLON.Color3.FromHexString('#FACC15'),
    patrol: [{ x: 92, z: -10, pauseSeconds: 1.5 }, { x: 118, z: -10, pauseSeconds: 1.5 }, { x: 118, z: 18, pauseSeconds: 1.5 }, { x: 92, z: 18, pauseSeconds: 1.5 }],
  },
  {
    npcId: 'npc-market-merchant', name: '鸿运掌柜', role: '市场商人', zone: '商业区',
    position: { x: 0, z: -96 }, color: BABYLON.Color3.FromHexString('#C084FC'),
    patrol: [{ x: -22, z: -102, pauseSeconds: 1 }, { x: 22, z: -102, pauseSeconds: 1 }, { x: 22, z: -122, pauseSeconds: 1 }, { x: -22, z: -122, pauseSeconds: 1 }],
  },
  {
    npcId: 'npc-residential-architect', name: '安居筑师', role: '住宅建筑师', zone: '住宅区',
    position: { x: -108, z: 28 }, color: BABYLON.Color3.FromHexString('#FDE68A'),
    patrol: [{ x: -128, z: 4, pauseSeconds: 1.2 }, { x: -88, z: 4, pauseSeconds: 1.2 }, { x: -88, z: 28, pauseSeconds: 1.2 }, { x: -128, z: 28, pauseSeconds: 1.2 }],
  },
  {
    npcId: 'npc-production-manager', name: '丰盈管家', role: '生产调度员', zone: '生产区',
    position: { x: 0, z: 94 }, color: BABYLON.Color3.FromHexString('#34D399'),
    patrol: [{ x: -26, z: 98, pauseSeconds: 1 }, { x: 26, z: 98, pauseSeconds: 1 }, { x: 26, z: 126, pauseSeconds: 1 }, { x: -26, z: 126, pauseSeconds: 1 }],
  },
  {
    npcId: 'npc-quest-officer', name: '荣光使者', role: '任务官', zone: '任务大厅',
    position: { x: 72, z: 64 }, color: BABYLON.Color3.FromHexString('#60A5FA'),
    patrol: [{ x: 58, z: 70, pauseSeconds: 1 }, { x: 86, z: 70, pauseSeconds: 1 }, { x: 86, z: 90, pauseSeconds: 1 }, { x: 58, z: 90, pauseSeconds: 1 }],
  },
];

/** Creates lightweight NPC placeholders and animates them along small zone-local patrols. */
export class NPCWorldManager {
  private readonly scene: BABYLON.Scene;
  private readonly minimap: MinimapManager;
  private readonly lowQuality: boolean;
  private readonly reducedMotion: boolean;
  private readonly roots = new Map<string, BABYLON.TransformNode>();
  private readonly states = new Map<string, NPCWorldState>();
  private readonly materials: BABYLON.StandardMaterial[] = [];
  private observer: BABYLON.Observer<BABYLON.Scene> | null = null;
  private isPaused = false;

  constructor(scene: BABYLON.Scene, minimap: MinimapManager, options: { lowQuality?: boolean; reducedMotion?: boolean } = {}) {
    this.scene = scene;
    this.minimap = minimap;
    this.lowQuality = options.lowQuality ?? false;
    this.reducedMotion = options.reducedMotion ?? false;
  }

  public createAllNPCs(): void {
    this.clear();
    const definitions = this.lowQuality ? NPC_DEFINITIONS.filter((_, index) => index % 2 === 0) : NPC_DEFINITIONS;
    definitions.forEach((definition) => this.createNPC(definition));
    this.observer = this.scene.onBeforeRenderObservable.add(() => this.update(this.scene.getEngine().getDeltaTime() / 1000));
  }

  public getStates(): Map<string, NPCWorldState> {
    return this.states;
  }

  public setPaused(paused: boolean): void {
    this.isPaused = paused;
    this.states.forEach((state) => { state.paused = paused; });
  }

  public clear(): void {
    if (this.observer) {
      this.scene.onBeforeRenderObservable.remove(this.observer);
      this.observer = null;
    }
    this.states.forEach((state) => this.minimap.removeMarker(state.npcId));
    this.states.clear();
    this.roots.forEach((root) => root.dispose(false, true));
    this.roots.clear();
    this.materials.forEach((material) => material.dispose());
    this.materials.length = 0;
  }

  public dispose(): void {
    this.clear();
  }

  private createNPC(definition: NPCWorldDefinition): void {
    const root = new BABYLON.TransformNode(definition.npcId, this.scene);
    root.position = new BABYLON.Vector3(definition.position.x, 0, definition.position.z);
    root.metadata = { npcId: definition.npcId, displayName: definition.name, role: definition.role, zone: definition.zone };

    const bodyMaterial = new BABYLON.StandardMaterial(`${definition.npcId}-body-material`, this.scene);
    bodyMaterial.diffuseColor = definition.color;
    bodyMaterial.emissiveColor = definition.color.scale(0.08);
    this.materials.push(bodyMaterial);

    const skinMaterial = new BABYLON.StandardMaterial(`${definition.npcId}-skin-material`, this.scene);
    skinMaterial.diffuseColor = BABYLON.Color3.FromHexString('#F1C7A8');
    this.materials.push(skinMaterial);

    const body = BABYLON.MeshBuilder.CreateBox(`${definition.npcId}-body`, { width: 1.3, height: 2.2, depth: 0.8 }, this.scene);
    body.position.y = 1.1;
    body.parent = root;
    body.material = bodyMaterial;
    body.isPickable = true;
    body.metadata = { ...root.metadata };

    const head = BABYLON.MeshBuilder.CreateSphere(`${definition.npcId}-head`, { diameter: 0.85, segments: 8 }, this.scene);
    head.position.y = 2.65;
    head.parent = root;
    head.material = skinMaterial;
    head.isPickable = true;
    head.metadata = { ...root.metadata };

    const badge = BABYLON.MeshBuilder.CreateCylinder(`${definition.npcId}-badge`, { diameter: 0.48, height: 0.08, tessellation: 8 }, this.scene);
    badge.rotation.x = Math.PI / 2;
    badge.position = new BABYLON.Vector3(0, 1.2, -0.44);
    badge.parent = root;
    badge.material = bodyMaterial;
    badge.isPickable = true;
    badge.metadata = { ...root.metadata };

    const state: NPCWorldState = { ...definition, currentPoint: 0, progress: 0, paused: this.isPaused || this.reducedMotion };
    this.states.set(definition.npcId, state);
    this.roots.set(definition.npcId, root);
    this.minimap.addMarker({
      id: definition.npcId,
      name: definition.name,
      label: definition.name.slice(0, 2),
      x: definition.position.x,
      z: definition.position.z,
      type: 'npc',
      color: { r: definition.color.r, g: definition.color.g, b: definition.color.b },
      radius: 4,
      landmark: false,
    });
  }

  private update(deltaSeconds: number): void {
    if (this.isPaused || this.reducedMotion) return;
    this.states.forEach((state) => {
      const root = this.roots.get(state.npcId);
      if (!root || state.patrol.length < 2) return;
      const target = state.patrol[(state.currentPoint + 1) % state.patrol.length];
      const current = state.patrol[state.currentPoint];
      const dx = target.x - current.x;
      const dz = target.z - current.z;
      const distance = Math.max(0.001, Math.hypot(dx, dz));
      state.progress = Math.min(1, state.progress + deltaSeconds * 0.18);
      root.position.x = current.x + dx * state.progress;
      root.position.z = current.z + dz * state.progress;
      root.rotation.y = Math.atan2(dx, dz);
      this.minimap.updateMarkerPosition(state.npcId, root.position.x, root.position.z);
      if (state.progress >= 1) {
        state.progress = 0;
        state.currentPoint = (state.currentPoint + 1) % state.patrol.length;
      }
    });
  }
}

export { NPC_DEFINITIONS };
