import * as BABYLON from '@babylonjs/core';
import { NPCActivityType } from './NPCScheduleSystem';

/**
 * NPC 模型配置
 */
export interface NPCModelConfig {
  npcId: string;
  npcName: string;
  position: BABYLON.Vector3;
  scale: number;
  skinColor: BABYLON.Color3;
  clothColor: BABYLON.Color3;
  hairColor: BABYLON.Color3;
}

/**
 * NPC 3D 模型和动画系统
 */
export class NPCModelManager {
  private scene: BABYLON.Scene;
  private npcModels: Map<string, BABYLON.Mesh> = new Map();
  private npcAnimations: Map<string, BABYLON.AnimationGroup[]> = new Map();
  private currentAnimations: Map<string, BABYLON.AnimationGroup> = new Map();

  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
  }

  /**
   * 创建 NPC 3D 模型
   */
  public createNPCModel(config: NPCModelConfig): BABYLON.Mesh {
    // 创建 NPC 根网格
    const npcRoot = new BABYLON.TransformNode(`npc-root-${config.npcId}`, this.scene);
    npcRoot.position = config.position;

    // 创建身体（圆柱体）
    const body = BABYLON.MeshBuilder.CreateCylinder(
      `npc-body-${config.npcId}`,
      {
        height: 1.8 * config.scale,
        diameter: 0.6 * config.scale,
        tessellation: 16,
      },
      this.scene
    );
    body.position.y = 0.9 * config.scale;

    const bodyMaterial = new BABYLON.StandardMaterial(`body-mat-${config.npcId}`, this.scene);
    (bodyMaterial as any).albedoColor = config.clothColor;
    bodyMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    body.material = bodyMaterial;
    body.parent = npcRoot;

    // 创建头部（球体）
    const head = BABYLON.MeshBuilder.CreateSphere(
      `npc-head-${config.npcId}`,
      {
        segments: 32,
        diameter: 0.5 * config.scale,
      },
      this.scene
    );
    head.position.y = 2.1 * config.scale;

    const headMaterial = new BABYLON.StandardMaterial(`head-mat-${config.npcId}`, this.scene);
    (headMaterial as any).albedoColor = config.skinColor;
    headMaterial.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    head.material = headMaterial;
    head.parent = npcRoot;

    // 创建头发（圆锥体）
    const hair = (BABYLON.MeshBuilder as any).CreateCone(
      `npc-hair-${config.npcId}`,
      {
        height: 0.3 * config.scale,
        diameterTop: 0,
        diameterBottom: 0.55 * config.scale,
      },
      this.scene
    );
    hair.position.y = 2.3 * config.scale;

    const hairMaterial = new BABYLON.StandardMaterial(`hair-mat-${config.npcId}`, this.scene);
    (hairMaterial as any).albedoColor = config.hairColor;
    hairMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    hair.material = hairMaterial;
    hair.parent = npcRoot;

    // 创建左臂（圆柱体）
    const leftArm = BABYLON.MeshBuilder.CreateCylinder(
      `npc-left-arm-${config.npcId}`,
      {
        height: 1.2 * config.scale,
        diameter: 0.25 * config.scale,
        tessellation: 16,
      },
      this.scene
    );
    leftArm.position = new BABYLON.Vector3(-0.4 * config.scale, 1.5 * config.scale, 0);

    const armMaterial = new BABYLON.StandardMaterial(`arm-mat-${config.npcId}`, this.scene);
    (armMaterial as any).albedoColor = config.skinColor;
    armMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    leftArm.material = armMaterial;
    leftArm.parent = npcRoot;

    // 创建右臂（圆柱体）
    const rightArm = BABYLON.MeshBuilder.CreateCylinder(
      `npc-right-arm-${config.npcId}`,
      {
        height: 1.2 * config.scale,
        diameter: 0.25 * config.scale,
        tessellation: 16,
      },
      this.scene
    );
    rightArm.position = new BABYLON.Vector3(0.4 * config.scale, 1.5 * config.scale, 0);
    rightArm.material = armMaterial;
    rightArm.parent = npcRoot;

    // 创建左腿（圆柱体）
    const leftLeg = BABYLON.MeshBuilder.CreateCylinder(
      `npc-left-leg-${config.npcId}`,
      {
        height: 1.0 * config.scale,
        diameter: 0.25 * config.scale,
        tessellation: 16,
      },
      this.scene
    );
    leftLeg.position = new BABYLON.Vector3(-0.2 * config.scale, 0.5 * config.scale, 0);

    const legMaterial = new BABYLON.StandardMaterial(`leg-mat-${config.npcId}`, this.scene);
    (legMaterial as any).albedoColor = new BABYLON.Color3(0.2, 0.2, 0.2); // 深色裤子
    legMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    leftLeg.material = legMaterial;
    leftLeg.parent = npcRoot;

    // 创建右腿（圆柱体）
    const rightLeg = BABYLON.MeshBuilder.CreateCylinder(
      `npc-right-leg-${config.npcId}`,
      {
        height: 1.0 * config.scale,
        diameter: 0.25 * config.scale,
        tessellation: 16,
      },
      this.scene
    );
    rightLeg.position = new BABYLON.Vector3(0.2 * config.scale, 0.5 * config.scale, 0);
    rightLeg.material = legMaterial;
    rightLeg.parent = npcRoot;

    // 创建名字标签
    this.createNameLabel(npcRoot, config.npcName, config.scale);

    // 保存模型引用
    this.npcModels.set(config.npcId, npcRoot as BABYLON.Mesh);

    // 初始化动画
    this.initializeAnimations(config.npcId, npcRoot);

    return npcRoot as BABYLON.Mesh;
  }

  /**
   * 创建名字标签
   */
  private createNameLabel(
    parent: BABYLON.TransformNode,
    npcName: string,
    scale: number
  ): void {
    // 创建一个平面作为标签背景
    const labelPlane = BABYLON.MeshBuilder.CreatePlane(
      `label-${npcName}`,
      { width: 1.5 * scale, height: 0.3 * scale },
      this.scene
    );
    labelPlane.position.y = 2.8 * scale;
    labelPlane.parent = parent;

    // 创建标签材质
    const labelMaterial = new BABYLON.StandardMaterial(`label-mat-${npcName}`, this.scene);
    labelMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
    labelMaterial.backFaceCulling = false;

    // 创建动态纹理用于文字
    const dynamicTexture = new BABYLON.DynamicTexture(`label-texture-${npcName}`, 512, this.scene);
    const ctx = dynamicTexture.getContext() as any;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 60px Arial';
    (ctx as CanvasRenderingContext2D).textAlign = 'center';
    ctx.fillText(npcName, 256, 80);
    dynamicTexture.update();

    labelMaterial.emissiveTexture = dynamicTexture;
    labelPlane.material = labelMaterial;
  }

  /**
   * 初始化 NPC 动画
   */
  private initializeAnimations(npcId: string, npcRoot: BABYLON.TransformNode): void {
    const animations: BABYLON.AnimationGroup[] = [];

    // 创建闲置动画（轻微摇晃）
    const idleAnimation = new BABYLON.AnimationGroup(`idle-${npcId}`, this.scene);
    const idleRotation = new BABYLON.Animation(
      `idle-rotation-${npcId}`,
      'rotation.y',
      30,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );
    const idleKeys = [
      { frame: 0, value: 0 },
      { frame: 30, value: 0.1 },
      { frame: 60, value: 0 },
      { frame: 90, value: -0.1 },
      { frame: 120, value: 0 },
    ];
    idleRotation.setKeys(idleKeys);
    idleAnimation.addTargetedAnimation(idleRotation, npcRoot);
    animations.push(idleAnimation);

    // 创建行走动画
    const walkAnimation = new BABYLON.AnimationGroup(`walk-${npcId}`, this.scene);
    const walkPosition = new BABYLON.Animation(
      `walk-position-${npcId}`,
      'position',
      30,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );
    const walkKeys = [
      { frame: 0, value: npcRoot.position },
      { frame: 30, value: npcRoot.position.add(new BABYLON.Vector3(1, 0, 0)) },
      { frame: 60, value: npcRoot.position },
    ];
    walkPosition.setKeys(walkKeys);
    walkAnimation.addTargetedAnimation(walkPosition, npcRoot);
    animations.push(walkAnimation);

    // 创建工作动画（弯腰）
    const workAnimation = new BABYLON.AnimationGroup(`work-${npcId}`, this.scene);
    const workRotation = new BABYLON.Animation(
      `work-rotation-${npcId}`,
      'rotation.x',
      30,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );
    const workKeys = [
      { frame: 0, value: 0 },
      { frame: 30, value: 0.5 },
      { frame: 60, value: 0 },
    ];
    workRotation.setKeys(workKeys);
    workAnimation.addTargetedAnimation(workRotation, npcRoot);
    animations.push(workAnimation);

    // 创建睡眠动画（躺下）
    const sleepAnimation = new BABYLON.AnimationGroup(`sleep-${npcId}`, this.scene);
    const sleepRotation = new BABYLON.Animation(
      `sleep-rotation-${npcId}`,
      'rotation.z',
      30,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    const sleepKeys = [{ frame: 0, value: Math.PI / 2 }];
    sleepRotation.setKeys(sleepKeys);
    sleepAnimation.addTargetedAnimation(sleepRotation, npcRoot);
    animations.push(sleepAnimation);

    this.npcAnimations.set(npcId, animations);
  }

  /**
   * 播放 NPC 动画
   */
  public playAnimation(npcId: string, activity: NPCActivityType): void {
    const animations = this.npcAnimations.get(npcId);
    if (!animations) {
      return;
    }

    // 停止当前动画
    const currentAnimation = this.currentAnimations.get(npcId);
    if (currentAnimation) {
      currentAnimation.stop();
    }

    // 播放新动画
    let animationToPlay: BABYLON.AnimationGroup | null = null;

    switch (activity) {
      case NPCActivityType.IDLE:
      case NPCActivityType.RESTING:
      case NPCActivityType.SOCIALIZING:
        animationToPlay = animations[0]; // 闲置动画
        break;
      case NPCActivityType.TRAVELING:
        animationToPlay = animations[1]; // 行走动画
        break;
      case NPCActivityType.WORKING:
      case NPCActivityType.FARMING:
      case NPCActivityType.FISHING:
        animationToPlay = animations[2]; // 工作动画
        break;
      case NPCActivityType.SLEEPING:
        animationToPlay = animations[3]; // 睡眠动画
        break;
      default:
        animationToPlay = animations[0]; // 默认闲置动画
    }

    if (animationToPlay) {
      animationToPlay.play(true);
      this.currentAnimations.set(npcId, animationToPlay);
    }
  }

  /**
   * 停止 NPC 动画
   */
  public stopAnimation(npcId: string): void {
    const currentAnimation = this.currentAnimations.get(npcId);
    if (currentAnimation) {
      currentAnimation.stop();
      this.currentAnimations.delete(npcId);
    }
  }

  /**
   * 移动 NPC 到指定位置
   */
  public moveNPCToLocation(npcId: string, targetPosition: BABYLON.Vector3, duration: number = 1000): void {
    const npcModel = this.npcModels.get(npcId);
    if (!npcModel) {
      return;
    }

    // 播放行走动画
    this.playAnimation(npcId, NPCActivityType.TRAVELING);

    // 创建移动动画
    const moveAnimation = new BABYLON.Animation(
      `move-${npcId}`,
      'position',
      30,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const keys = [
      { frame: 0, value: npcModel.position.clone() },
      { frame: (duration / 1000) * 30, value: targetPosition },
    ];
    moveAnimation.setKeys(keys);

    npcModel.animations.push(moveAnimation);
    this.scene.beginAnimation(npcModel, 0, (duration / 1000) * 30, false, 1, () => {
      // 移动完成后停止行走动画
      this.playAnimation(npcId, NPCActivityType.IDLE);
    });
  }

  /**
   * 获取 NPC 模型
   */
  public getNPCModel(npcId: string): BABYLON.Mesh | undefined {
    return this.npcModels.get(npcId);
  }

  /**
   * 删除 NPC 模型
   */
  public removeNPCModel(npcId: string): void {
    const npcModel = this.npcModels.get(npcId);
    if (npcModel) {
      npcModel.dispose();
      this.npcModels.delete(npcId);
    }

    const animations = this.npcAnimations.get(npcId);
    if (animations) {
      animations.forEach((anim) => anim.dispose());
      this.npcAnimations.delete(npcId);
    }

    this.currentAnimations.delete(npcId);
  }

  /**
   * 清理所有 NPC 模型
   */
  public dispose(): void {
    this.npcModels.forEach((model) => model.dispose());
    this.npcAnimations.forEach((animations) => {
      animations.forEach((anim) => anim.dispose());
    });
    this.npcModels.clear();
    this.npcAnimations.clear();
    this.currentAnimations.clear();
  }
}
