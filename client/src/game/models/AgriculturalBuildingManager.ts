import * as BABYLON from '@babylonjs/core';
import { BabylonGameEngine } from '../engine/BabylonGameEngine';

/**
 * 农业区建筑类型定义
 */
export interface BuildingDefinition {
  name: string;
  type: 'farmhouse' | 'greenhouse' | 'dryer' | 'storage' | 'windmill' | 'tool_shed';
  position: BABYLON.Vector3;
  size: { width: number; height: number; depth: number };
  color: BABYLON.Color3;
  description: string;
}

/**
 * 农业区建筑管理器
 * 负责创建和管理农业区的各类建筑
 */
export class AgriculturalBuildingManager {
  private engine: BabylonGameEngine;
  private buildings: Map<string, BABYLON.Mesh> = new Map();

  constructor(engine: BabylonGameEngine) {
    this.engine = engine;
  }

  /**
   * 创建农舍
   * @param position - 位置
   * @param name - 建筑名称
   */
  public createFarmhouse(position: BABYLON.Vector3, name: string = 'farmhouse'): BABYLON.Mesh {
    const farmhouse = this.engine.createBuilding(
      name,
      position,
      { width: 20, height: 15, depth: 25 },
      new BABYLON.Color3(0.8, 0.6, 0.4) // 棕色
    );

    // 添加屋顶（使用 Cylinder 代替 Cone）
    const roof = BABYLON.MeshBuilder.CreateCylinder('roof', {
      diameter: 25,
      height: 10,
      tessellation: 8,
    }, this.engine.getScene());

    roof.position = new BABYLON.Vector3(position.x, position.y + 12, position.z);
    const roofMaterial = new BABYLON.StandardMaterial('roofMat', this.engine.getScene());
    (roofMaterial as any).diffuse = new BABYLON.Color3(0.8, 0.2, 0.1); // 红色屋顶
    roof.material = roofMaterial;

    this.buildings.set(name, farmhouse);
    return farmhouse;
  }

  /**
   * 创建现代温室
   * @param position - 位置
   * @param name - 建筑名称
   */
  public createGreenhouse(position: BABYLON.Vector3, name: string = 'greenhouse'): BABYLON.Mesh {
    const greenhouse = this.engine.createBuilding(
      name,
      position,
      { width: 30, height: 12, depth: 40 },
      new BABYLON.Color3(0.6, 0.8, 0.9) // 浅蓝色（玻璃效果）
    );

    // 设置透明度模拟玻璃
    const material = greenhouse.material as BABYLON.StandardMaterial;
    if (material) {
      material.alpha = 0.7;
      (material as any).specularColor = new BABYLON.Color3(0.8, 0.8, 0.8);
    }

    // 添加金属框架
    const frame = BABYLON.MeshBuilder.CreateBox('frame', {
      width: 32,
      height: 14,
      depth: 42,
    }, this.engine.getScene());

    frame.position = position;
    const frameMaterial = new BABYLON.StandardMaterial('frameMat', this.engine.getScene());
    (frameMaterial as any).diffuse = new BABYLON.Color3(0.5, 0.5, 0.5); // 灰色金属
    frame.material = frameMaterial;

    this.buildings.set(name, greenhouse);
    return greenhouse;
  }

  /**
   * 创建谷物烘干机
   * @param position - 位置
   * @param name - 建筑名称
   */
  public createGrainDryer(position: BABYLON.Vector3, name: string = 'grain_dryer'): BABYLON.Mesh {
    // 主体（圆柱形）
    const dryer = this.engine.createCylinder(
      name,
      position,
      15,
      25,
      new BABYLON.Color3(0.7, 0.7, 0.7) // 灰色
    );

    // 顶部圆锥（使用 Cylinder 代替 Cone）
    const top = BABYLON.MeshBuilder.CreateCylinder('dryer_top', {
      diameter: 15,
      height: 8,
      tessellation: 16,
    }, this.engine.getScene());

    top.position = new BABYLON.Vector3(position.x, position.y + 16.5, position.z);
    const topMaterial = new BABYLON.StandardMaterial('dryer_top_mat', this.engine.getScene());
    (topMaterial as any).diffuse = new BABYLON.Color3(0.6, 0.6, 0.6);
    top.material = topMaterial;

    this.buildings.set(name, dryer);
    return dryer;
  }

  /**
   * 创建冷库/仓库
   * @param position - 位置
   * @param name - 建筑名称
   */
  public createStorageBuilding(position: BABYLON.Vector3, name: string = 'storage'): BABYLON.Mesh {
    const storage = this.engine.createBuilding(
      name,
      position,
      { width: 35, height: 18, depth: 45 },
      new BABYLON.Color3(0.9, 0.9, 0.9) // 白色
    );

    // 添加蓝色门
    const door = BABYLON.MeshBuilder.CreateBox('door', {
      width: 5,
      height: 10,
      depth: 1,
    }, this.engine.getScene());

    door.position = new BABYLON.Vector3(position.x, position.y + 2, position.z + 22.5);
    const doorMaterial = new BABYLON.StandardMaterial('doorMat', this.engine.getScene());
    (doorMaterial as any).diffuse = new BABYLON.Color3(0.2, 0.4, 0.8); // 蓝色门
    door.material = doorMaterial;

    this.buildings.set(name, storage);
    return storage;
  }

  /**
   * 创建风车
   * @param position - 位置
   * @param name - 建筑名称
   */
  public createWindmill(position: BABYLON.Vector3, name: string = 'windmill'): BABYLON.Mesh {
    // 风车塔
    const tower = this.engine.createCylinder(
      name,
      position,
      8,
      30,
      new BABYLON.Color3(0.8, 0.7, 0.5) // 棕色
    );

    // 风车叶片（4 个矩形）
    const bladePositions = [
      new BABYLON.Vector3(0, 0, 12),
      new BABYLON.Vector3(0, 0, -12),
      new BABYLON.Vector3(12, 0, 0),
      new BABYLON.Vector3(-12, 0, 0),
    ];

    bladePositions.forEach((bladePos, index) => {
      const blade = BABYLON.MeshBuilder.CreateBox(`blade_${index}`, {
        width: 2,
        height: 20,
        depth: 1,
      }, this.engine.getScene());

      blade.position = new BABYLON.Vector3(
        position.x + bladePos.x,
        position.y + 20 + bladePos.y,
        position.z + bladePos.z
      );

      const bladeMaterial = new BABYLON.StandardMaterial(`blade_mat_${index}`, this.engine.getScene());
      (bladeMaterial as any).emissiveColor = new BABYLON.Color3(0.9, 0.9, 0.9); // 白色
      blade.material = bladeMaterial;
    });

    this.buildings.set(name, tower);
    return tower;
  }

  /**
   * 创建农具棚
   * @param position - 位置
   * @param name - 建筑名称
   */
  public createToolShed(position: BABYLON.Vector3, name: string = 'tool_shed'): BABYLON.Mesh {
    const shed = this.engine.createBuilding(
      name,
      position,
      { width: 15, height: 10, depth: 20 },
      new BABYLON.Color3(0.6, 0.4, 0.2) // 深棕色
    );

    // 添加屋顶（使用 Cylinder 代替 Cone）
    const roof = BABYLON.MeshBuilder.CreateCylinder('shed_roof', {
      diameter: 20,
      height: 6,
      tessellation: 8,
    }, this.engine.getScene());

    roof.position = new BABYLON.Vector3(position.x, position.y + 8, position.z);
    const roofMaterial = new BABYLON.StandardMaterial('shed_roof_mat', this.engine.getScene());
    (roofMaterial as any).diffuse = new BABYLON.Color3(0.7, 0.3, 0.1); // 红棕色屋顶
    roof.material = roofMaterial;

    this.buildings.set(name, shed);
    return shed;
  }

  /**
   * 创建农业区的所有建筑
   */
  public createAllBuildings(): void {
    // 传统农业区建筑
    this.createFarmhouse(new BABYLON.Vector3(-100, 0, 0), 'farmhouse_1');
    this.createToolShed(new BABYLON.Vector3(-50, 0, 50), 'tool_shed_1');
    this.createWindmill(new BABYLON.Vector3(-80, 0, -80), 'windmill_1');

    // 现代温室区建筑
    this.createGreenhouse(new BABYLON.Vector3(50, 0, 0), 'greenhouse_1');
    this.createGreenhouse(new BABYLON.Vector3(100, 0, 0), 'greenhouse_2');

    // 农产品加工区建筑
    this.createGrainDryer(new BABYLON.Vector3(150, 0, 50), 'grain_dryer_1');
    this.createStorageBuilding(new BABYLON.Vector3(200, 0, 100), 'storage_1');
  }

  /**
   * 获取所有建筑
   */
  public getBuildings(): Map<string, BABYLON.Mesh> {
    return this.buildings;
  }

  /**
   * 获取指定建筑
   */
  public getBuilding(name: string): BABYLON.Mesh | undefined {
    return this.buildings.get(name);
  }

  /**
   * 移除建筑
   */
  public removeBuilding(name: string): void {
    const building = this.buildings.get(name);
    if (building) {
      building.dispose();
      this.buildings.delete(name);
    }
  }

  /**
   * 清空所有建筑
   */
  public clear(): void {
    this.buildings.forEach((building) => {
      building.dispose();
    });
    this.buildings.clear();
  }
}
