import * as BABYLON from '@babylonjs/core';
import { Season, BuildingSeasonalAppearance, SeasonSystem } from './SeasonSystem';

/**
 * 建筑季节变化管理器
 * 管理建筑根据季节的颜色、积雪和结冰效果
 */
export class BuildingSeasonManager {
  private seasonSystem: SeasonSystem;
  private buildingMeshes: Map<BABYLON.Mesh, { materials: BABYLON.Material[] }> = new Map();
  private snowMeshes: Map<BABYLON.Mesh, BABYLON.Mesh> = new Map(); // 建筑 -> 积雪网格
  private iceMeshes: Map<BABYLON.Mesh, BABYLON.Mesh> = new Map(); // 建筑 -> 结冰网格

  constructor(seasonSystem: SeasonSystem) {
    this.seasonSystem = seasonSystem;
  }

  /**
   * 注册建筑网格
   */
  public registerBuilding(mesh: BABYLON.Mesh): void {
    const materials = mesh.material ? [mesh.material] : [];
    this.buildingMeshes.set(mesh, { materials });
  }

  /**
   * 应用季节外观到建筑
   */
  public applySeasonalAppearance(mesh: BABYLON.Mesh, appearance: BuildingSeasonalAppearance): void {
    // 更新屋顶颜色
    const roofMeshes = mesh.getChildren().filter((child) => child instanceof BABYLON.Mesh && child.name.includes('roof'));
    roofMeshes.forEach((roofMesh) => {
      const material = (roofMesh as BABYLON.Mesh).material as BABYLON.StandardMaterial;
      if (material) {
        material.diffuseColor = appearance.roofColor;
      }
    });

    // 更新墙壁颜色
    const wallMeshes = mesh.getChildren().filter((child) => child instanceof BABYLON.Mesh && child.name.includes('wall'));
    wallMeshes.forEach((wallMesh) => {
      const material = (wallMesh as BABYLON.Mesh).material as BABYLON.StandardMaterial;
      if (material) {
        material.diffuseColor = appearance.wallColor;
      }
    });

    // 主网格颜色
    const mainMaterial = mesh.material as BABYLON.StandardMaterial;
    if (mainMaterial) {
      mainMaterial.emissiveColor = appearance.wallColor;
    }

    // 应用积雪效果
    this.applySnowEffect(mesh, appearance.snowCoverage);

    // 应用结冰效果
    this.applyIceEffect(mesh, appearance.iceFormation);
  }

  /**
   * 应用积雪效果
   */
  private applySnowEffect(mesh: BABYLON.Mesh, snowCoverage: number): void {
    if (snowCoverage <= 0) {
      // 移除积雪
      const snowMesh = this.snowMeshes.get(mesh);
      if (snowMesh) {
        snowMesh.dispose();
        this.snowMeshes.delete(mesh);
      }
      return;
    }

    // 获取或创建积雪网格
    let snowMesh = this.snowMeshes.get(mesh);
    if (!snowMesh) {
      snowMesh = this.createSnowMesh(mesh);
      this.snowMeshes.set(mesh, snowMesh);
    }

    // 调整积雪覆盖率
    const snowMaterial = snowMesh.material as BABYLON.StandardMaterial;
    if (snowMaterial) {
      snowMaterial.alpha = snowCoverage;
      snowMaterial.emissiveColor = new BABYLON.Color3(
        0.9 + snowCoverage * 0.1,
        0.9 + snowCoverage * 0.1,
        1
      );
    }
  }

  /**
   * 创建积雪网格
   */
  private createSnowMesh(building: BABYLON.Mesh): BABYLON.Mesh {
    const scene = building.getScene();

    // 获取建筑的边界
    const boundingInfo = building.getBoundingInfo();
    const size = boundingInfo.boundingBox.maximum.subtract(boundingInfo.boundingBox.minimum);

    // 创建积雪网格（简单的立方体）
    const snowMesh = BABYLON.MeshBuilder.CreateBox(
      `${building.name}_snow`,
      {
        width: size.x * 1.1,
        height: size.z * 0.3, // 积雪高度
        depth: size.z * 1.1,
      },
      scene
    );

    // 设置位置
    snowMesh.position = building.position.clone();
    snowMesh.position.y += size.y * 0.5 + size.z * 0.15;

    // 创建积雪材质
    const snowMaterial = new BABYLON.StandardMaterial(`${building.name}_snowMat`, scene);
    snowMaterial.emissiveColor = new BABYLON.Color3(0.95, 0.95, 1);
    snowMaterial.alpha = 0.7;

    snowMesh.material = snowMaterial;
    snowMesh.parent = building;

    return snowMesh;
  }

  /**
   * 应用结冰效果
   */
  private applyIceEffect(mesh: BABYLON.Mesh, iceFormation: number): void {
    if (iceFormation <= 0) {
      // 移除结冰
      const iceMesh = this.iceMeshes.get(mesh);
      if (iceMesh) {
        iceMesh.dispose();
        this.iceMeshes.delete(mesh);
      }
      return;
    }

    // 获取或创建结冰网格
    let iceMesh = this.iceMeshes.get(mesh);
    if (!iceMesh) {
      iceMesh = this.createIceMesh(mesh);
      this.iceMeshes.set(mesh, iceMesh);
    }

    // 调整结冰程度
    const iceMaterial = iceMesh.material as BABYLON.StandardMaterial;
    if (iceMaterial) {
      iceMaterial.alpha = iceFormation * 0.6;
      iceMaterial.emissiveColor = new BABYLON.Color3(
        0.8 + iceFormation * 0.2,
        0.9 + iceFormation * 0.1,
        1
      );
    }
  }

  /**
   * 创建结冰网格
   */
  private createIceMesh(building: BABYLON.Mesh): BABYLON.Mesh {
    const scene = building.getScene();

    // 获取建筑的边界
    const boundingInfo = building.getBoundingInfo();
    const size = boundingInfo.boundingBox.maximum.subtract(boundingInfo.boundingBox.minimum);

    // 创建结冰网格（覆盖建筑表面）
    const iceMesh = BABYLON.MeshBuilder.CreateBox(
      `${building.name}_ice`,
      {
        width: size.x * 1.05,
        height: size.y * 1.05,
        depth: size.z * 1.05,
      },
      scene
    );

    // 设置位置
    iceMesh.position = building.position.clone();

    // 创建结冰材质
    const iceMaterial = new BABYLON.StandardMaterial(`${building.name}_iceMat`, scene);
    iceMaterial.emissiveColor = new BABYLON.Color3(0.8, 0.9, 1);
    iceMaterial.alpha = 0.3;
    iceMaterial.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5); // 冰面反光

    iceMesh.material = iceMaterial;
    iceMesh.parent = building;

    return iceMesh;
  }

  /**
   * 更新所有建筑的季节外观
   */
  public updateAllBuildingAppearances(season: Season): void {
    const appearance = this.seasonSystem.getBuildingAppearance(season);
    if (!appearance) return;

    this.buildingMeshes.forEach((_, mesh) => {
      this.applySeasonalAppearance(mesh, appearance);
    });
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    this.snowMeshes.forEach((mesh) => {
      mesh.dispose();
    });
    this.snowMeshes.clear();

    this.iceMeshes.forEach((mesh) => {
      mesh.dispose();
    });
    this.iceMeshes.clear();

    this.buildingMeshes.clear();
  }
}
