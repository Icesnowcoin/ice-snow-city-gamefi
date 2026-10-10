import * as BABYLON from '@babylonjs/core';
import { GameplayEnvironmentAssetLoader } from '../environment/GameplayEnvironmentAssetLoader';
import { MinimapManager } from './MinimapManager';

export interface PlayerWorldOptions {
  startPosition?: BABYLON.Vector3;
  speed?: number;
  minX?: number;
  maxX?: number;
  minZ?: number;
  maxZ?: number;
}

/**
 * Owns the playable avatar inside the Babylon scene.
 * The procedural winter outfit is a safe fallback; the gameplay GLB can replace
 * only its visual children without changing movement, minimap, or interaction state.
 */
export class PlayerWorldManager {
  private readonly scene: BABYLON.Scene;
  private readonly minimap: MinimapManager;
  private readonly speed: number;
  private readonly bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  private readonly root: BABYLON.TransformNode;
  private readonly fallbackMeshes: BABYLON.Mesh[] = [];
  private canonicalRoot: BABYLON.TransformNode | null = null;
  private readonly pressedKeys = new Set<string>();
  private keyboardObserver: BABYLON.Observer<BABYLON.KeyboardInfo> | null = null;
  private renderObserver: BABYLON.Observer<BABYLON.Scene> | null = null;
  private enabled = true;

  public constructor(scene: BABYLON.Scene, minimap: MinimapManager, options: PlayerWorldOptions = {}) {
    this.scene = scene;
    this.minimap = minimap;
    this.speed = options.speed ?? 7;
    this.bounds = {
      minX: options.minX ?? -136,
      maxX: options.maxX ?? 146,
      minZ: options.minZ ?? -136,
      maxZ: options.maxZ ?? 146,
    };
    this.root = new BABYLON.TransformNode('player-avatar', scene);
    this.root.position.copyFrom(options.startPosition ?? new BABYLON.Vector3(0, 0, 4));
    this.root.position.y = 0;
    this.root.metadata = { playerId: 'player-1', displayName: '城市建设者', gameplayOnly: true, nft: false };
    this.createFallbackAvatar();
    this.minimap.addMarker({
      id: 'player-1',
      name: '城市建设者',
      label: '我',
      x: this.root.position.x,
      z: this.root.position.z,
      type: 'player',
      color: { r: 0.4, g: 0.95, b: 1 },
      radius: 5,
      landmark: true,
    });
  }

  public start(): void {
    this.stop();
    this.keyboardObserver = this.scene.onKeyboardObservable.add((info) => {
      const key = info.event.key.toLowerCase();
      if (info.type === BABYLON.KeyboardEventTypes.KEYDOWN) this.pressedKeys.add(key);
      if (info.type === BABYLON.KeyboardEventTypes.KEYUP) this.pressedKeys.delete(key);
    });
    this.renderObserver = this.scene.onBeforeRenderObservable.add(() => {
      this.update(this.scene.getEngine().getDeltaTime() / 1000);
    });
  }

  public stop(): void {
    if (this.keyboardObserver) this.scene.onKeyboardObservable.remove(this.keyboardObserver);
    if (this.renderObserver) this.scene.onBeforeRenderObservable.remove(this.renderObserver);
    this.keyboardObserver = null;
    this.renderObserver = null;
    this.pressedKeys.clear();
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.root.setEnabled(enabled);
  }

  public getRoot(): BABYLON.TransformNode {
    return this.root;
  }

  public getPosition(): BABYLON.Vector3 {
    return this.root.position.clone();
  }

  public setPosition(position: BABYLON.Vector3): void {
    const nextX = clamp(position.x, this.bounds.minX, this.bounds.maxX);
    const nextZ = clamp(position.z, this.bounds.minZ, this.bounds.maxZ);
    this.root.position.x = nextX;
    this.root.position.z = nextZ;
    this.root.position.y = 0;
    this.minimap.updateMarkerPosition('player-1', this.root.position.x, this.root.position.z);
  }

  /** Replace only visuals; movement and gameplay identity stay on player-avatar. */
  public async loadCanonicalBaseline(url: string): Promise<boolean> {
    if (!url) return false;
    const importedRoot = await GameplayEnvironmentAssetLoader.loadGameplayAsset(
      this.scene,
      url,
      BABYLON.Vector3.Zero(),
      'player-character-baseline',
    );
    if (!importedRoot) return false;
    this.fallbackMeshes.forEach((mesh) => { mesh.isVisible = false; });
    importedRoot.parent = this.root;
    importedRoot.position.copyFromFloats(0, 0, 0);
    importedRoot.metadata = { ...(importedRoot.metadata ?? {}), playerId: 'player-1', displayName: '城市建设者' };
    this.canonicalRoot?.dispose(false, true);
    this.canonicalRoot = importedRoot;
    return true;
  }

  public dispose(): void {
    this.stop();
    this.minimap.removeMarker('player-1');
    this.canonicalRoot?.dispose(false, true);
    this.canonicalRoot = null;
    this.root.dispose(false, true);
    this.fallbackMeshes.length = 0;
  }

  private createFallbackAvatar(): void {
    const coat = new BABYLON.StandardMaterial('player-avatar-coat', this.scene);
    coat.diffuseColor = BABYLON.Color3.FromHexString('#38BDF8');
    coat.emissiveColor = BABYLON.Color3.FromHexString('#075985').scale(0.28);
    const skin = new BABYLON.StandardMaterial('player-avatar-skin', this.scene);
    skin.diffuseColor = BABYLON.Color3.FromHexString('#F1C7A8');
    const scarf = new BABYLON.StandardMaterial('player-avatar-scarf', this.scene);
    scarf.diffuseColor = BABYLON.Color3.FromHexString('#F8FAFC');
    scarf.emissiveColor = BABYLON.Color3.FromHexString('#BAE6FD').scale(0.2);

    const body = BABYLON.MeshBuilder.CreateCapsule('player-avatar-body', { height: 2.1, radius: 0.48, subdivisions: 2 }, this.scene);
    body.position.y = 1.15;
    body.material = coat;
    const head = BABYLON.MeshBuilder.CreateSphere('player-avatar-head', { diameter: 0.82, segments: 12 }, this.scene);
    head.position.y = 2.55;
    head.material = skin;
    const scarfMesh = BABYLON.MeshBuilder.CreateTorus('player-avatar-scarf', { diameter: 0.72, thickness: 0.12, tessellation: 12 }, this.scene);
    scarfMesh.position.y = 1.88;
    scarfMesh.rotation.x = Math.PI / 2;
    scarfMesh.material = scarf;
    const marker = BABYLON.MeshBuilder.CreateTorus('player-avatar-selection-ring', { diameter: 1.65, thickness: 0.06, tessellation: 24 }, this.scene);
    marker.position.y = 0.08;
    marker.rotation.x = Math.PI / 2;
    marker.material = scarf;

    [body, head, scarfMesh, marker].forEach((mesh) => {
      mesh.parent = this.root;
      mesh.isPickable = false;
      mesh.metadata = { playerId: 'player-1', gameplayOnly: true, nft: false };
      mesh.receiveShadows = true;
      this.fallbackMeshes.push(mesh);
    });
  }

  private update(deltaSeconds: number): void {
    if (!this.enabled) return;
    const x = (this.pressedKeys.has('d') || this.pressedKeys.has('arrowright') ? 1 : 0)
      - (this.pressedKeys.has('a') || this.pressedKeys.has('arrowleft') ? 1 : 0);
    const z = (this.pressedKeys.has('s') || this.pressedKeys.has('arrowdown') ? 1 : 0)
      - (this.pressedKeys.has('w') || this.pressedKeys.has('arrowup') ? 1 : 0);
    if (x === 0 && z === 0) return;
    const direction = new BABYLON.Vector3(x, 0, z);
    direction.normalize().scaleInPlace(this.speed * Math.min(deltaSeconds, 0.05));
    this.setPosition(this.root.position.add(direction));
    this.root.rotation.y = Math.atan2(direction.x, direction.z);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
