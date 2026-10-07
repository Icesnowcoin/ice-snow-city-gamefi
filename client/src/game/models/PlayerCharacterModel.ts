/**
 * 玩家角色 3D 模型原型
 * 基于高保真设计和 3D 建模指南
 *
 * 规格:
 * - 多边形数: 15k-25k (当前原型: ~8k)
 * - 纹理分辨率: 2048×2048 (身体), 1024×1024 (衣服)
 * - 骨骼数: 60-80
 * - 风格: 3D 半写实卡通 (轻 Q 版比例)
 */

import * as THREE from "three";
import {
  FacialExpressionSystem,
  ExpressionType,
} from "../expressions/FacialExpressionSystem";

export interface PlayerCharacterConfig {
  scale?: number;
  position?: THREE.Vector3;
  rotation?: THREE.Euler;
  skinTone?: string;
  hairStyle?: string;
  hairColor?: string;
  eyeType?: string;
  outfitColor?: string;
}

export class PlayerCharacterModel {
  private scene: THREE.Group;
  private meshes: Map<string, THREE.Mesh> = new Map();
  private skeleton: THREE.Skeleton | null = null;
  private bones: THREE.Bone[] = [];
  private animations: Map<string, THREE.AnimationClip> = new Map();
  private expressionSystem: FacialExpressionSystem;

  constructor(config: PlayerCharacterConfig = {}) {
    this.scene = new THREE.Group();
    this.expressionSystem = new FacialExpressionSystem();
    this.createCharacter(config);
  }

  private createCharacter(config: PlayerCharacterConfig): void {
    const scale = config.scale || 1;
    const position = config.position || new THREE.Vector3(0, 0, 0);

    // 创建骨骼系统
    this.createSkeleton();

    // 创建身体部分
    this.createHead(config);
    this.createBody(config);
    this.createArms(config);
    this.createLegs(config);
    this.createClothes(config);
    this.createAccessories(config);

    // 应用变换
    this.scene.scale.multiplyScalar(scale);
    this.scene.position.copy(position);
  }

  private createSkeleton(): void {
    // 创建骨骼结构
    const rootBone = new THREE.Bone();
    this.bones.push(rootBone);

    // 脊椎骨骼
    const spine1 = new THREE.Bone();
    const spine2 = new THREE.Bone();
    const spine3 = new THREE.Bone();
    spine1.position.y = 0;
    spine2.position.y = 0.3;
    spine3.position.y = 0.6;
    rootBone.add(spine1);
    spine1.add(spine2);
    spine2.add(spine3);
    this.bones.push(spine1, spine2, spine3);

    // 颈骨
    const neck = new THREE.Bone();
    neck.position.y = 0.4;
    spine3.add(neck);
    this.bones.push(neck);

    // 头骨
    const head = new THREE.Bone();
    head.position.y = 0.3;
    neck.add(head);
    this.bones.push(head);

    // 左臂
    const leftShoulder = new THREE.Bone();
    leftShoulder.position.set(-0.3, 0.2, 0);
    spine2.add(leftShoulder);
    const leftArm = new THREE.Bone();
    leftArm.position.set(-0.3, 0, 0);
    leftShoulder.add(leftArm);
    const leftForearm = new THREE.Bone();
    leftForearm.position.set(-0.3, 0, 0);
    leftArm.add(leftForearm);
    this.bones.push(leftShoulder, leftArm, leftForearm);

    // 右臂
    const rightShoulder = new THREE.Bone();
    rightShoulder.position.set(0.3, 0.2, 0);
    spine2.add(rightShoulder);
    const rightArm = new THREE.Bone();
    rightArm.position.set(0.3, 0, 0);
    rightShoulder.add(rightArm);
    const rightForearm = new THREE.Bone();
    rightForearm.position.set(0.3, 0, 0);
    rightArm.add(rightForearm);
    this.bones.push(rightShoulder, rightArm, rightForearm);

    // 左腿
    const leftHip = new THREE.Bone();
    leftHip.position.set(-0.15, -0.5, 0);
    rootBone.add(leftHip);
    const leftLeg = new THREE.Bone();
    leftLeg.position.set(0, -0.4, 0);
    leftHip.add(leftLeg);
    const leftFoot = new THREE.Bone();
    leftFoot.position.set(0, -0.4, 0);
    leftLeg.add(leftFoot);
    this.bones.push(leftHip, leftLeg, leftFoot);

    // 右腿
    const rightHip = new THREE.Bone();
    rightHip.position.set(0.15, -0.5, 0);
    rootBone.add(rightHip);
    const rightLeg = new THREE.Bone();
    rightLeg.position.set(0, -0.4, 0);
    rightHip.add(rightLeg);
    const rightFoot = new THREE.Bone();
    rightFoot.position.set(0, -0.4, 0);
    rightLeg.add(rightFoot);
    this.bones.push(rightHip, rightLeg, rightFoot);

    // 创建骨骼
    this.skeleton = new THREE.Skeleton(this.bones);
    this.scene.add(rootBone);
  }

  private createHead(config: PlayerCharacterConfig): void {
    // 头部 - 轻 Q 版比例 (头部偏大)
    const headGeometry = new THREE.SphereGeometry(0.25, 32, 32);

    // 应用头部变形 - 拉长脸部
    const positionAttribute = headGeometry.getAttribute("position");
    const positions = positionAttribute.array as Float32Array;
    for (let i = 0; i < positions.length; i += 3) {
      const y = positions[i + 1];
      // 拉长脸部，缩小下巴
      if (y < 0) {
        positions[i + 1] = y * 1.3;
      }
    }
    positionAttribute.needsUpdate = true;
    headGeometry.computeVertexNormals();

    // 皮肤材质 - 高质量柔和皮肤光泽
    const skinTone = config.skinTone || "#f4c4a0"; // 亚洲肤色
    const headMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(skinTone),
      roughness: 0.5,
      emissive: new THREE.Color(0x000000),
    });
    (headMaterial as any).metallic = 0;

    const headMesh = new THREE.Mesh(headGeometry, headMaterial);
    headMesh.position.y = 1.2;
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;

    this.scene.add(headMesh);
    this.meshes.set("head", headMesh);

    // 创建眼睛
    const eyeMeshes = this.createEyes(config);

    // 创建嘴巴
    const mouthMesh = this.createMouth(config);

    // 创建发型
    this.createHair(config);

    // 初始化表情系统
    this.expressionSystem.initialize(headMesh, eyeMeshes, mouthMesh);
  }

  private createEyes(config: PlayerCharacterConfig): THREE.Mesh[] {
    // 大眼睛 - 亚洲审美特征
    const eyeGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x4a3728), // 棕色眼睛
      roughness: 0.3,
    });
    (eyeMaterial as any).metallic = 0.1;

    // 左眼
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.08, 0.05, 0.2);
    this.scene.getObjectByName("head")?.add(leftEye) || this.scene.add(leftEye);

    // 右眼
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.08, 0.05, 0.2);
    this.scene.getObjectByName("head")?.add(rightEye) ||
      this.scene.add(rightEye);

    // 眼白
    const eyeWhiteGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const eyeWhiteMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xffffff),
      roughness: 0.4,
    });
    (eyeWhiteMaterial as any).metallic = 0;

    const leftEyeWhite = new THREE.Mesh(eyeWhiteGeometry, eyeWhiteMaterial);
    leftEyeWhite.position.set(-0.08, 0.05, 0.15);
    leftEyeWhite.scale.z = 0.5;

    const rightEyeWhite = new THREE.Mesh(eyeWhiteGeometry, eyeWhiteMaterial);
    rightEyeWhite.position.set(0.08, 0.05, 0.15);
    rightEyeWhite.scale.z = 0.5;

    this.meshes.set("leftEye", leftEye);
    this.meshes.set("rightEye", rightEye);

    return [leftEye, rightEye];
  }

  private createMouth(config: PlayerCharacterConfig): THREE.Mesh {
    // 嘴巴 - 简单的椭圆形网格
    const mouthGeometry = new THREE.CylinderGeometry(0.1, 0.08, 0.02, 16);
    const mouthMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xc9685c),
      roughness: 0.4,
    });
    (mouthMaterial as any).metallic = 0;
    const mouthMesh = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouthMesh.position.set(0, -0.08, 0.22);
    mouthMesh.rotation.x = Math.PI / 2;
    mouthMesh.scale.set(1, 0.5, 1);

    this.scene.add(mouthMesh);
    this.meshes.set("mouth", mouthMesh);

    return mouthMesh;
  }

  private createHair(config: PlayerCharacterConfig): void {
    // 发型 - 12 种发型之一的原型
    const hairGeometry = new THREE.ConeGeometry(0.28, 0.5, 32);
    const hairColor = config.hairColor || "#2c1810"; // 棕色头发
    const hairMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(hairColor),
      roughness: 0.6,
    });
    (hairMaterial as any).metallic = 0;

    const hairMesh = new THREE.Mesh(hairGeometry, hairMaterial);
    hairMesh.position.y = 0.15;
    hairMesh.castShadow = true;
    hairMesh.receiveShadow = true;

    this.scene.add(hairMesh);
    this.meshes.set("hair", hairMesh);
  }

  private createBody(config: PlayerCharacterConfig): void {
    // 躯干 - 轻 Q 版比例
    const bodyGeometry = new THREE.CapsuleGeometry(0.18, 0.6, 4, 8);
    const skinTone = config.skinTone || "#f4c4a0";
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(skinTone),
      roughness: 0.5,
    });
    (bodyMaterial as any).metallic = 0;

    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.position.y = 0.5;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;

    this.scene.add(bodyMesh);
    this.meshes.set("body", bodyMesh);
  }

  private createArms(config: PlayerCharacterConfig): void {
    // 左臂
    const leftArmGeometry = new THREE.CapsuleGeometry(0.08, 0.5, 4, 8);
    const skinTone = config.skinTone || "#f4c4a0";
    const armMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(skinTone),
      roughness: 0.5,
    });
    (armMaterial as any).metallic = 0;

    const leftArm = new THREE.Mesh(leftArmGeometry, armMaterial);
    leftArm.position.set(-0.3, 0.7, 0);
    leftArm.rotation.z = Math.PI / 4;
    leftArm.castShadow = true;
    leftArm.receiveShadow = true;
    this.scene.add(leftArm);
    this.meshes.set("leftArm", leftArm);

    // 右臂
    const rightArm = new THREE.Mesh(leftArmGeometry, armMaterial);
    rightArm.position.set(0.3, 0.7, 0);
    rightArm.rotation.z = -Math.PI / 4;
    rightArm.castShadow = true;
    rightArm.receiveShadow = true;
    this.scene.add(rightArm);
    this.meshes.set("rightArm", rightArm);
  }

  private createLegs(config: PlayerCharacterConfig): void {
    // 左腿
    const legGeometry = new THREE.CapsuleGeometry(0.1, 0.6, 4, 8);
    const skinTone = config.skinTone || "#f4c4a0";
    const legMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(skinTone),
      roughness: 0.5,
    });
    (legMaterial as any).metallic = 0;

    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.15, -0.3, 0);
    leftLeg.castShadow = true;
    leftLeg.receiveShadow = true;
    this.scene.add(leftLeg);
    this.meshes.set("leftLeg", leftLeg);

    // 右腿
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.15, -0.3, 0);
    rightLeg.castShadow = true;
    rightLeg.receiveShadow = true;
    this.scene.add(rightLeg);
    this.meshes.set("rightLeg", rightLeg);
  }

  private createClothes(config: PlayerCharacterConfig): void {
    // 上衣 - 现代都市风格
    const shirtGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 32);
    const outfitColor = config.outfitColor || "#2563eb"; // 蓝色上衣
    const shirtMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(outfitColor),
      roughness: 0.7,
    });
    (shirtMaterial as any).metallic = 0;

    const shirt = new THREE.Mesh(shirtGeometry, shirtMaterial);
    shirt.position.y = 0.5;
    shirt.castShadow = true;
    shirt.receiveShadow = true;
    this.scene.add(shirt);
    this.meshes.set("shirt", shirt);

    // 裤子
    const pantsGeometry = new THREE.CylinderGeometry(0.18, 0.15, 0.6, 32);
    const pantsMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x1f2937), // 深灰色裤子
      roughness: 0.8,
    });
    (pantsMaterial as any).metallic = 0;

    const pants = new THREE.Mesh(pantsGeometry, pantsMaterial);
    pants.position.y = -0.1;
    pants.castShadow = true;
    pants.receiveShadow = true;
    this.scene.add(pants);
    this.meshes.set("pants", pants);
  }

  private createAccessories(config: PlayerCharacterConfig): void {
    // 鞋子
    const shoeGeometry = new THREE.BoxGeometry(0.15, 0.1, 0.25);
    const shoeMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x000000), // 黑色鞋子
      roughness: 0.6,
    });
    (shoeMaterial as any).metallic = 0.2;

    const leftShoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
    leftShoe.position.set(-0.15, -0.75, 0);
    leftShoe.castShadow = true;
    leftShoe.receiveShadow = true;
    this.scene.add(leftShoe);

    const rightShoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
    rightShoe.position.set(0.15, -0.75, 0);
    rightShoe.castShadow = true;
    rightShoe.receiveShadow = true;
    this.scene.add(rightShoe);

    // 背包 - 可选配饰
    const backpackGeometry = new THREE.BoxGeometry(0.2, 0.3, 0.15);
    const backpackMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xdc2626), // 红色背包
      roughness: 0.7,
    });
    (backpackMaterial as any).metallic = 0;

    const backpack = new THREE.Mesh(backpackGeometry, backpackMaterial);
    backpack.position.set(0, 0.4, -0.2);
    backpack.castShadow = true;
    backpack.receiveShadow = true;
    this.scene.add(backpack);
    this.meshes.set("backpack", backpack);
  }

  /**
   * 获取 Three.js 场景对象
   */
  public getScene(): THREE.Group {
    return this.scene;
  }

  /**
   * 获取所有网格
   */
  public getMeshes(): Map<string, THREE.Mesh> {
    return this.meshes;
  }

  /**
   * 获取骨骼
   */
  public getBones(): THREE.Bone[] {
    return this.bones;
  }

  /**
   * 获取骨骼系统
   */
  public getSkeleton(): THREE.Skeleton | null {
    return this.skeleton;
  }

  /**
   * 设置皮肤颜色
   */
  public setSkinTone(color: string): void {
    const headMesh = this.meshes.get("head");
    const bodyMesh = this.meshes.get("body");
    const leftArm = this.meshes.get("leftArm");
    const rightArm = this.meshes.get("rightArm");
    const leftLeg = this.meshes.get("leftLeg");
    const rightLeg = this.meshes.get("rightLeg");

    const colorObj = new THREE.Color(color);
    [headMesh, bodyMesh, leftArm, rightArm, leftLeg, rightLeg].forEach(mesh => {
      if (mesh && mesh.material instanceof THREE.MeshStandardMaterial) {
        mesh.material.color.copy(colorObj);
      }
    });
  }

  /**
   * 设置发色
   */
  public setHairColor(color: string): void {
    const hairMesh = this.meshes.get("hair");
    if (hairMesh && hairMesh.material instanceof THREE.MeshStandardMaterial) {
      hairMesh.material.color.set(color);
    }
  }

  /**
   * 设置服装颜色
   */
  public setOutfitColor(color: string): void {
    const shirtMesh = this.meshes.get("shirt");
    if (shirtMesh && shirtMesh.material instanceof THREE.MeshStandardMaterial) {
      shirtMesh.material.color.set(color);
    }
  }

  /**
   * 播放指定动作状态动画 (stand / walk / interact)
   */
  public playActionAnimation(
    actionState: "stand" | "walk" | "interact",
    speed: number = 1.0
  ): void {
    const time = Date.now() * 0.001 * speed;
    const bodyMesh = this.meshes.get("body");
    const leftArm = this.meshes.get("leftArm");
    const rightArm = this.meshes.get("rightArm");
    const leftLeg = this.meshes.get("leftLeg");
    const rightLeg = this.meshes.get("rightLeg");

    if (actionState === "walk") {
      // 行走动作：周期性上下起伏与手臂前后摆动
      if (bodyMesh) {
        bodyMesh.position.y = 0.5 + Math.abs(Math.sin(time * 8)) * 0.05;
        bodyMesh.rotation.z = Math.sin(time * 4) * 0.04;
      }
      if (leftArm && rightArm) {
        leftArm.rotation.x = Math.sin(time * 8) * 0.4;
        rightArm.rotation.x = -Math.sin(time * 8) * 0.4;
      }
      if (leftLeg && rightLeg) {
        leftLeg.position.z = Math.sin(time * 8) * 0.15;
        rightLeg.position.z = -Math.sin(time * 8) * 0.15;
      }
    } else if (actionState === "interact") {
      // 互动/打招呼动作：身体前倾，右臂抬起挥手
      if (bodyMesh) {
        bodyMesh.position.y = 0.5 + Math.sin(time * 3) * 0.01;
        bodyMesh.rotation.z = 0;
        bodyMesh.rotation.y = Math.sin(time * 3) * 0.1;
      }
      if (rightArm) {
        rightArm.rotation.x = -Math.PI / 2 + Math.sin(time * 10) * 0.2;
        rightArm.rotation.z = -Math.PI / 3;
      }
      if (leftArm) {
        leftArm.rotation.x = 0;
        leftArm.rotation.z = Math.PI / 4;
      }
      if (leftLeg && rightLeg) {
        leftLeg.position.z = 0;
        rightLeg.position.z = 0;
      }
    } else {
      // 默认站立/Idle 状态
      if (bodyMesh) {
        bodyMesh.position.y = 0.5 + Math.sin(time) * 0.02;
        bodyMesh.rotation.z = Math.sin(time * 0.5) * 0.02;
        bodyMesh.rotation.y = 0;
      }
      if (leftArm && rightArm) {
        leftArm.rotation.x = 0;
        leftArm.rotation.z = Math.PI / 4;
        rightArm.rotation.x = 0;
        rightArm.rotation.z = -Math.PI / 4;
      }
      if (leftLeg && rightLeg) {
        leftLeg.position.z = 0;
        rightLeg.position.z = 0;
      }
    }

    // 更新表情系统
    this.expressionSystem.update();
  }

  /**
   * 播放待机动画
   */
  public playIdleAnimation(): void {
    this.playActionAnimation("stand");
  }

  /**
   * 设置表情
   */
  public setExpression(expression: ExpressionType, duration?: number): void {
    this.expressionSystem.setExpression(expression, duration);
  }

  /**
   * 获取表情系统
   */
  public getExpressionSystem(): FacialExpressionSystem {
    return this.expressionSystem;
  }

  /**
   * 销毁模型
   */
  public dispose(): void {
    this.meshes.forEach(mesh => {
      mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose();
      }
    });
    this.meshes.clear();
    this.bones = [];
    this.skeleton = null;
  }
}
