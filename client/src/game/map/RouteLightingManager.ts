import * as BABYLON from '@babylonjs/core';
import { MinimapManager } from './MinimapManager';

export interface RouteLightingNode {
  id: string;
  name: string;
  x: number;
  z: number;
  order: number;
  lit: boolean;
  mesh: BABYLON.TransformNode;
}

const NODE_DEFINITIONS = [
  { id: 'route-lamp-01', name: '晨曦路灯一号', x: -52, z: -86 },
  { id: 'route-lamp-02', name: '晨曦路灯二号', x: -12, z: -60 },
  { id: 'route-lamp-03', name: '晨曦路灯三号', x: 30, z: -34 },
  { id: 'route-lamp-04', name: '晨曦路灯四号', x: 72, z: -8 },
] as const;

/** Owns the local, non-chain route lighting gameplay objects. */
export class RouteLightingManager {
  private readonly scene: BABYLON.Scene;
  private readonly minimap: MinimapManager;
  private readonly nodes = new Map<string, RouteLightingNode>();
  private readonly ownedMeshes: BABYLON.Mesh[] = [];
  private readonly ownedMaterials: BABYLON.StandardMaterial[] = [];
  private onNodeSelected: ((node: RouteLightingNode) => void) | null = null;
  private reducedMotion = false;

  constructor(scene: BABYLON.Scene, minimap: MinimapManager, options: { reducedMotion?: boolean } = {}) {
    this.scene = scene;
    this.minimap = minimap;
    this.reducedMotion = Boolean(options.reducedMotion);
  }

  public setOnNodeSelected(callback: (node: RouteLightingNode) => void): void {
    this.onNodeSelected = callback;
  }

  public createRoute(): void {
    this.clear();
    NODE_DEFINITIONS.forEach((definition, index) => {
      const root = new BABYLON.TransformNode(definition.id, this.scene);
      root.position.set(definition.x, 0, definition.z);
      root.metadata = { routeNodeId: definition.id };

      const pole = BABYLON.MeshBuilder.CreateCylinder(`${definition.id}-pole`, { height: 4.2, diameter: 0.18, tessellation: 8 }, this.scene);
      pole.position.y = 2.1;
      pole.parent = root;
      const poleMaterial = this.createMaterial(`${definition.id}-pole-material`, new BABYLON.Color3(0.16, 0.25, 0.35));
      pole.material = poleMaterial;
      pole.metadata = { routeNodeId: definition.id };
      pole.isPickable = true;

      const lantern = BABYLON.MeshBuilder.CreateSphere(`${definition.id}-lantern`, { diameter: 0.62, segments: 8 }, this.scene);
      lantern.position.y = 4.2;
      lantern.parent = root;
      const lanternMaterial = this.createMaterial(`${definition.id}-lantern-material`, new BABYLON.Color3(0.18, 0.32, 0.46));
      lanternMaterial.emissiveColor = new BABYLON.Color3(0.05, 0.1, 0.16);
      lantern.material = lanternMaterial;
      lantern.metadata = { routeNodeId: definition.id, routeNodePart: 'lantern' };
      lantern.isPickable = true;

      const marker = this.minimap.worldToMinimap(definition.x, definition.z);
      this.minimap.addMarker({
        id: definition.id,
        name: definition.name,
        label: `灯${index + 1}`,
        x: definition.x,
        z: definition.z,
        type: 'poi',
        color: new BABYLON.Color3(0.35, 0.78, 0.96),
        radius: 3,
        landmark: false,
      });
      void marker;

      this.ownedMeshes.push(pole, lantern);
      this.nodes.set(definition.id, { ...definition, order: index + 1, lit: false, mesh: root });
    });
  }

  public handlePickedMesh(mesh: BABYLON.AbstractMesh): boolean {
    const routeNodeId = (mesh.metadata as { routeNodeId?: string } | null)?.routeNodeId;
    if (!routeNodeId) return false;
    return this.selectNode(routeNodeId);
  }

  public selectNode(nodeId: string): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) return false;
    this.onNodeSelected?.(node);
    return true;
  }

  public lightNode(nodeId: string): RouteLightingNode | null {
    const node = this.nodes.get(nodeId);
    if (!node || node.lit) return node ?? null;
    node.lit = true;
    const lantern = this.scene.getMeshByName(`${nodeId}-lantern`);
    if (lantern?.material instanceof BABYLON.StandardMaterial) {
      lantern.material.diffuseColor = new BABYLON.Color3(0.45, 0.82, 1);
      lantern.material.emissiveColor = new BABYLON.Color3(0.16, 0.48, 0.9);
    }
    this.minimap.updateMarkerPosition(node.id, node.x, node.z);
    return node;
  }

  public getNodes(): RouteLightingNode[] {
    return Array.from(this.nodes.values());
  }

  public getNode(nodeId: string): RouteLightingNode | undefined {
    return this.nodes.get(nodeId);
  }

  public clear(): void {
    this.nodes.clear();
    NODE_DEFINITIONS.forEach(({ id }) => this.minimap.removeMarker(id));
    this.ownedMeshes.splice(0).forEach((mesh) => mesh.dispose(false, true));
    this.ownedMaterials.splice(0).forEach((material) => material.dispose());
  }

  public dispose(): void {
    this.clear();
    this.onNodeSelected = null;
  }

  private createMaterial(name: string, color: BABYLON.Color3): BABYLON.StandardMaterial {
    const material = new BABYLON.StandardMaterial(name, this.scene);
    material.diffuseColor = color;
    material.specularColor = new BABYLON.Color3(0.2, 0.3, 0.4);
    this.ownedMaterials.push(material);
    return material;
  }
}

export { NODE_DEFINITIONS as ROUTE_LIGHTING_NODE_DEFINITIONS };
