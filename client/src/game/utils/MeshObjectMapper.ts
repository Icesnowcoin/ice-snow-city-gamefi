import * as BABYLON from '@babylonjs/core';
import { Building, Vegetation } from '../types/GameObjectTypes';

/**
 * 网格到游戏对象的映射系统
 * 用于将 3D 网格与游戏对象关联，支持复合网格的子部件映射
 */
export class MeshObjectMapper {
  private meshToObjectMap: Map<string, Building | Vegetation> = new Map();
  private objectToMeshesMap: Map<string, BABYLON.Mesh[]> = new Map();

  /**
   * 注册单个网格到游戏对象
   */
  public registerMesh(mesh: BABYLON.Mesh, gameObject: Building | Vegetation): void {
    this.meshToObjectMap.set(mesh.name, gameObject);

    // 维护反向映射
    const meshes = this.objectToMeshesMap.get(gameObject.id) || [];
    if (!meshes.includes(mesh)) {
      meshes.push(mesh);
      this.objectToMeshesMap.set(gameObject.id, meshes);
    }
  }

  /**
   * 注册多个网格到同一游戏对象
   */
  public registerMeshes(meshes: BABYLON.Mesh[], gameObject: Building | Vegetation): void {
    meshes.forEach((mesh) => {
      this.registerMesh(mesh, gameObject);
    });
  }

  /**
   * 通过网格名称获取游戏对象
   */
  public getObjectByMeshName(meshName: string): Building | Vegetation | undefined {
    return this.meshToObjectMap.get(meshName);
  }

  /**
   * 通过网格获取游戏对象
   */
  public getObjectByMesh(mesh: BABYLON.Mesh | null): Building | Vegetation | undefined {
    if (!mesh) return undefined;
    return this.meshToObjectMap.get(mesh.name);
  }

  /**
   * 通过游戏对象获取所有关联的网格
   */
  public getMeshesByObject(gameObject: Building | Vegetation): BABYLON.Mesh[] {
    return this.objectToMeshesMap.get(gameObject.id) || [];
  }

  /**
   * 注销网格
   */
  public unregisterMesh(mesh: BABYLON.Mesh): void {
    const gameObject = this.meshToObjectMap.get(mesh.name);
    if (gameObject) {
      this.meshToObjectMap.delete(mesh.name);

      const meshes = this.objectToMeshesMap.get(gameObject.id) || [];
      const index = meshes.indexOf(mesh);
      if (index > -1) {
        meshes.splice(index, 1);
      }

      if (meshes.length === 0) {
        this.objectToMeshesMap.delete(gameObject.id);
      }
    }
  }

  /**
   * 注销游戏对象的所有网格
   */
  public unregisterObject(gameObject: Building | Vegetation): void {
    const meshes = this.objectToMeshesMap.get(gameObject.id) || [];
    meshes.forEach((mesh) => {
      this.meshToObjectMap.delete(mesh.name);
    });
    this.objectToMeshesMap.delete(gameObject.id);
  }

  /**
   * 清空所有映射
   */
  public clear(): void {
    this.meshToObjectMap.clear();
    this.objectToMeshesMap.clear();
  }

  /**
   * 获取映射统计信息
   */
  public getStats(): {
    totalMeshes: number;
    totalObjects: number;
  } {
    return {
      totalMeshes: this.meshToObjectMap.size,
      totalObjects: this.objectToMeshesMap.size,
    };
  }
}

/**
 * 创建全局网格映射实例
 */
export const globalMeshMapper = new MeshObjectMapper();
