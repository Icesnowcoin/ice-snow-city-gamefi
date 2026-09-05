import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Scene } from '@babylonjs/core/scene';
import { MinimapManager } from './MinimapManager';

export interface BusinessDataPoint {
  id: string;
  name: string;
  description: string;
  category: string;
  archiveContent: string;
  x: number;
  z: number;
  collected: boolean;
  collectedAt?: number;
}

const DATA_POINTS: Omit<BusinessDataPoint, 'collected' | 'collectedAt'>[] = [
  { id: 'business-data-bank', name: '银行客流终端', description: '记录金融区公共服务的本地演示数据。', category: '公共服务', archiveContent: '金融区早间客流保持稳定，银行大厅与资产咨询窗口是主要服务节点。', x: 82, z: -18 },
  { id: 'business-data-market', name: '商圈交易终端', description: '记录鸿运商都的商品流转趋势。', category: '商业流转', archiveContent: '鸿运商都的交易热度集中在午后，生活物资与城市装饰品的流转最为活跃。', x: 34, z: -78 },
  { id: 'business-data-transit', name: '交通调度终端', description: '记录金融区与商业区之间的交通热度。', category: '交通调度', archiveContent: '金融区至商业区的主要通行路线运行顺畅，建议优先维护晨曦路线节点。', x: 126, z: 38 },
  { id: 'business-data-plaza', name: '广场公告终端', description: '记录城市核心向金融区的公共公告。', category: '城市公告', archiveContent: '城市核心广场发布金融区开放公告，鼓励居民参与商业网络建设。', x: 42, z: 26 },
];

export class BusinessDataCollectionManager {
  private readonly scene: Scene;
  private readonly minimap: MinimapManager;
  private readonly points = new Map<string, BusinessDataPoint>();
  private readonly roots = new Map<string, TransformNode>();
  private readonly materials = new Map<string, PBRMaterial>();
  private onPointSelected: ((point: BusinessDataPoint) => void) | null = null;

  constructor(scene: Scene, minimap: MinimapManager) {
    this.scene = scene;
    this.minimap = minimap;
  }

  public createPoints(): void {
    this.clear();
    DATA_POINTS.forEach((definition) => {
      const point = { ...definition, collected: false };
      const root = new TransformNode(point.id, this.scene);
      root.position.set(point.x, 0, point.z);
      root.metadata = { businessDataPointId: point.id };

      const base = MeshBuilder.CreateCylinder(`${point.id}-base`, { diameter: 3.8, height: 0.6, tessellation: 12 }, this.scene);
      base.parent = root;
      base.position.y = 0.3;
      base.metadata = { businessDataPointId: point.id };
      const orb = MeshBuilder.CreateSphere(`${point.id}-orb`, { diameter: 1.8, segments: 10 }, this.scene);
      orb.parent = root;
      orb.position.y = 2.1;
      orb.metadata = { businessDataPointId: point.id };

      const material = this.createMaterial(`${point.id}-material`, false);
      base.material = material;
      orb.material = material;
      this.points.set(point.id, point);
      this.roots.set(point.id, root);
      this.materials.set(point.id, material);
      this.minimap.addMarker({ id: point.id, name: point.name, label: '数', x: point.x, z: point.z, type: 'poi', color: '#fbbf24', radius: 5 });
    });
  }

  public setOnPointSelected(callback: (point: BusinessDataPoint) => void): void {
    this.onPointSelected = callback;
  }

  public getPoints(): BusinessDataPoint[] {
    return Array.from(this.points.values()).map((point) => ({ ...point }));
  }

  public getBusinessDataPoints(): BusinessDataPoint[] {
    return this.getPoints();
  }

  public getCollectedArchiveEntries(): BusinessDataPoint[] {
    return this.getPoints().filter((point) => point.collected);
  }

  public getCollectedCount(): number {
    return Array.from(this.points.values()).filter((point) => point.collected).length;
  }

  public collectPoint(pointId: string): BusinessDataPoint | null {
    const point = this.points.get(pointId);
    if (!point || point.collected) return null;
    point.collected = true;
    point.collectedAt = Date.now();
    const material = this.materials.get(pointId);
    if (material) {
      material.albedoColor = Color3.FromHexString('#94a3b8');
      material.emissiveColor = Color3.FromHexString('#334155').scale(0.18);
    }
    this.minimap.upsertMarker({ id: point.id, name: point.name, label: '已', x: point.x, z: point.z, type: 'poi', color: '#94a3b8', radius: 4 });
    const snapshot = { ...point };
    this.onPointSelected?.(snapshot);
    return snapshot;
  }

  public handlePickedMesh(mesh: Mesh): boolean {
    const pointId = (mesh.metadata as { businessDataPointId?: string } | null)?.businessDataPointId;
    if (!pointId) return false;
    const point = this.points.get(pointId);
    if (!point) return true;
    this.onPointSelected?.({ ...point });
    return true;
  }

  public selectPoint(pointId: string): boolean {
    const point = this.points.get(pointId);
    if (!point) return false;
    this.onPointSelected?.({ ...point });
    return true;
  }

  public clear(): void {
    this.points.forEach((point) => this.minimap.removeMarker(point.id));
    this.roots.forEach((root) => root.dispose(false, true));
    this.materials.forEach((material) => material.dispose());
    this.points.clear();
    this.roots.clear();
    this.materials.clear();
  }

  private createMaterial(name: string, collected: boolean): PBRMaterial {
    const material = new PBRMaterial(name, this.scene);
    material.albedoColor = Color3.FromHexString(collected ? '#94a3b8' : '#fbbf24');
    material.metallic = 0.35;
    material.roughness = 0.3;
    material.emissiveColor = Color3.FromHexString(collected ? '#334155' : '#f59e0b').scale(0.35);
    return material;
  }
}
