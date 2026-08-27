import * as BABYLON from '@babylonjs/core';
import { BabylonGameEngine } from '../engine/BabylonGameEngine';

/**
 * 植被类型定义
 */
export type VegetationType = 'wheat' | 'fruit_tree' | 'bush' | 'flower' | 'grass';

/**
 * 植被管理器
 * 负责创建和管理农业区的植被系统
 */
export class VegetationManager {
  private engine: BabylonGameEngine;
  private vegetation: Map<string, BABYLON.Mesh[]> = new Map();

  constructor(engine: BabylonGameEngine) {
    this.engine = engine;
  }

  /**
   * 创建麦田
   * @param position - 位置
   * @param width - 宽度
   * @param depth - 深度
   * @param name - 名称
   */
  public createWheatField(
    position: BABYLON.Vector3,
    width: number = 100,
    depth: number = 100,
    name: string = 'wheat_field'
  ): BABYLON.Mesh {
    const field = BABYLON.MeshBuilder.CreateGround(name, {
      width,
      height: depth,
      subdivisions: 20,
    }, this.engine.getScene());

    field.position = position;

    // 麦田材质（金黄色）
    const material = new BABYLON.StandardMaterial(`${name}_mat`, this.engine.getScene());
    (material as any).diffuse = new BABYLON.Color3(0.9, 0.8, 0.3); // 金黄色
    (material as any).specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    field.material = material;

    const meshes = [field];
    this.vegetation.set(name, meshes);

    return field;
  }

  /**
   * 创建果树
   * @param position - 位置
   * @param name - 名称
   * @param fruitColor - 果实颜色
   */
  public createFruitTree(
    position: BABYLON.Vector3,
    name: string = 'fruit_tree',
    fruitColor: BABYLON.Color3 = new BABYLON.Color3(1, 0, 0) // 红色
  ): BABYLON.Mesh[] {
    const meshes: BABYLON.Mesh[] = [];

    // 树干
    const trunk = this.engine.createCylinder(
      `${name}_trunk`,
      position,
      2,
      8,
      new BABYLON.Color3(0.5, 0.3, 0.1) // 棕色
    );
    meshes.push(trunk);

    // 树冠（球体）
    const canopy = this.engine.createSphere(
      `${name}_canopy`,
      new BABYLON.Vector3(position.x, position.y + 8, position.z),
      10,
      new BABYLON.Color3(0.2, 0.6, 0.2) // 绿色
    );
    meshes.push(canopy);

    // 果实（小球体）
    const fruitPositions = [
      new BABYLON.Vector3(position.x + 3, position.y + 10, position.z + 3),
      new BABYLON.Vector3(position.x - 3, position.y + 10, position.z - 3),
      new BABYLON.Vector3(position.x + 3, position.y + 8, position.z - 3),
      new BABYLON.Vector3(position.x - 3, position.y + 8, position.z + 3),
    ];

    fruitPositions.forEach((fruitPos, index) => {
      const fruit = this.engine.createSphere(
        `${name}_fruit_${index}`,
        fruitPos,
        1.5,
        fruitColor
      );
      meshes.push(fruit);
    });

    this.vegetation.set(name, meshes);
    return meshes;
  }

  /**
   * 创建灌木丛
   * @param position - 位置
   * @param name - 名称
   */
  public createBush(
    position: BABYLON.Vector3,
    name: string = 'bush'
  ): BABYLON.Mesh {
    const bush = this.engine.createSphere(
      name,
      position,
      5,
      new BABYLON.Color3(0.3, 0.5, 0.2) // 深绿色
    );

    this.vegetation.set(name, [bush]);
    return bush;
  }

  /**
   * 创建花朵
   * @param position - 位置
   * @param name - 名称
   * @param color - 花色
   */
  public createFlower(
    position: BABYLON.Vector3,
    name: string = 'flower',
    color: BABYLON.Color3 = new BABYLON.Color3(1, 0.5, 0) // 橙色
  ): BABYLON.Mesh {
    // 花茎
    const stem = this.engine.createCylinder(
      `${name}_stem`,
      position,
      0.5,
      3,
      new BABYLON.Color3(0.2, 0.6, 0.2) // 绿色
    );

    // 花瓣（球体）
    const petal = this.engine.createSphere(
      `${name}_petal`,
      new BABYLON.Vector3(position.x, position.y + 3, position.z),
      1.5,
      color
    );

    this.vegetation.set(name, [stem, petal]);
    return petal;
  }

  /**
   * 创建灌溉渠
   * @param startPos - 起始位置
   * @param endPos - 结束位置
   * @param name - 名称
   */
  public createIrrigationChannel(
    startPos: BABYLON.Vector3,
    endPos: BABYLON.Vector3,
    name: string = 'irrigation_channel'
  ): BABYLON.Mesh {
    // 计算长度和方向
    const direction = endPos.subtract(startPos);
    const length = BABYLON.Vector3.Distance(startPos, endPos);
    const midpoint = startPos.add(direction.scale(0.5));

    // 创建渠道（长条形）
    const channel = BABYLON.MeshBuilder.CreateBox(name, {
      width: 3,
      height: 0.5,
      depth: length,
    }, this.engine.getScene());

    channel.position = midpoint;

    // 计算旋转角度
    const angle = Math.atan2(direction.z, direction.x);
    channel.rotation.y = angle;

    // 渠道材质（蓝色水）
    const material = new BABYLON.StandardMaterial(`${name}_mat`, this.engine.getScene());
    (material as any).diffuse = new BABYLON.Color3(0.3, 0.6, 0.9); // 蓝色
    material.alpha = 0.6;
    (material as any).specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    channel.material = material;

    this.vegetation.set(name, [channel]);
    return channel;
  }

  /**
   * 创建农业区的完整植被系统
   */
  public createCompleteVegetation(): void {
    // 创建麦田
    this.createWheatField(new BABYLON.Vector3(-200, 0.1, -200), 150, 150, 'wheat_field_1');
    this.createWheatField(new BABYLON.Vector3(50, 0.1, -200), 150, 150, 'wheat_field_2');

    // 创建果园
    const fruitTreePositions = [
      new BABYLON.Vector3(-100, 0, 100),
      new BABYLON.Vector3(-70, 0, 100),
      new BABYLON.Vector3(-40, 0, 100),
      new BABYLON.Vector3(-10, 0, 100),
      new BABYLON.Vector3(20, 0, 100),
      new BABYLON.Vector3(50, 0, 100),
    ];

    fruitTreePositions.forEach((pos, index) => {
      this.createFruitTree(pos, `fruit_tree_${index}`, new BABYLON.Color3(1, 0.3, 0.3));
    });

    // 创建灌木丛
    const bushPositions = [
      new BABYLON.Vector3(-150, 0, 50),
      new BABYLON.Vector3(-120, 0, 80),
      new BABYLON.Vector3(100, 0, 50),
      new BABYLON.Vector3(130, 0, 80),
    ];

    bushPositions.forEach((pos, index) => {
      this.createBush(pos, `bush_${index}`);
    });

    // 创建灌溉渠
    this.createIrrigationChannel(
      new BABYLON.Vector3(-200, 0.2, 0),
      new BABYLON.Vector3(200, 0.2, 0),
      'irrigation_channel_1'
    );

    this.createIrrigationChannel(
      new BABYLON.Vector3(0, 0.2, -200),
      new BABYLON.Vector3(0, 0.2, 200),
      'irrigation_channel_2'
    );

    // 创建花朵
    const flowerPositions = [
      { pos: new BABYLON.Vector3(-180, 0, 30), color: new BABYLON.Color3(1, 0.5, 0) },
      { pos: new BABYLON.Vector3(-150, 0, 60), color: new BABYLON.Color3(1, 0, 1) },
      { pos: new BABYLON.Vector3(80, 0, 30), color: new BABYLON.Color3(1, 1, 0) },
      { pos: new BABYLON.Vector3(120, 0, 60), color: new BABYLON.Color3(0.5, 1, 0.5) },
    ];

    flowerPositions.forEach((flower, index) => {
      this.createFlower(flower.pos, `flower_${index}`, flower.color);
    });
  }

  /**
   * 获取所有植被
   */
  public getVegetation(): Map<string, BABYLON.Mesh[]> {
    return this.vegetation;
  }

  /**
   * 获取指定植被
   */
  public getVegetationByName(name: string): BABYLON.Mesh[] | undefined {
    return this.vegetation.get(name);
  }

  /**
   * 移除植被
   */
  public removeVegetation(name: string): void {
    const meshes = this.vegetation.get(name);
    if (meshes) {
      meshes.forEach((mesh) => {
        mesh.dispose();
      });
      this.vegetation.delete(name);
    }
  }

  /**
   * 清空所有植被
   */
  public clear(): void {
    this.vegetation.forEach((meshes) => {
      meshes.forEach((mesh) => {
        mesh.dispose();
      });
    });
    this.vegetation.clear();
  }
}
