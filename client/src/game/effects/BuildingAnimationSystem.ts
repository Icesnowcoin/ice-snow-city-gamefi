import * as BABYLON from '@babylonjs/core';

/**
 * 建筑动画配置接口
 */
export interface BuildingAnimationConfig {
  duration: number;
  easing?: (t: number) => number;
}

/**
 * 建筑状态动画系统
 * 负责处理建筑的各种状态变化动画
 */
export class BuildingAnimationSystem {
  private scene: BABYLON.Scene;
  private activeAnimations: Map<string, BABYLON.Animation[]> = new Map();

  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
  }

  /**
   * 创建缓动函数
   */
  private createEasing(type: 'easeInOut' | 'easeOut' | 'linear'): (t: number) => number {
    switch (type) {
      case 'easeInOut':
        return (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      case 'easeOut':
        return (t: number) => t * (2 - t);
      case 'linear':
      default:
        return (t: number) => t;
    }
  }

  /**
   * 播放建筑选中动画（缩放和发光）
   */
  playSelectionAnimation(mesh: BABYLON.Mesh, config: BuildingAnimationConfig = { duration: 300 }): void {
    const animationName = `selection_${mesh.name}`;
    this.stopAnimation(mesh, animationName);

    // 缩放动画
    const scaleAnimation = new BABYLON.Animation(
      `${animationName}_scale`,
      'scaling',
      60,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    const keys = [
      { frame: 0, value: mesh.scaling.clone() },
      { frame: 30, value: mesh.scaling.scale(1.1) },
      { frame: 60, value: mesh.scaling.clone() },
    ];

    scaleAnimation.setKeys(keys);
    scaleAnimation.setEasingFunction(new BABYLON.CircleEase());

    mesh.animations.push(scaleAnimation);

    // 启动动画
    this.scene.beginAnimation(mesh, 0, 60, true, 1);
  }

  /**
   * 停止建筑选中动画
   */
  stopSelectionAnimation(mesh: BABYLON.Mesh): void {
    this.scene.stopAnimation(mesh);
  }

  /**
   * 播放建筑升级动画（旋转和上升）
   */
  playUpgradeAnimation(mesh: BABYLON.Mesh, config: BuildingAnimationConfig = { duration: 500 }): Promise<void> {
    return new Promise((resolve) => {
      const animationName = `upgrade_${mesh.name}`;
      this.stopAnimation(mesh, animationName);

      const originalPosition = mesh.position.clone();
      const originalRotation = mesh.rotation.clone();

      // 上升动画
      const positionAnimation = new BABYLON.Animation(
        `${animationName}_position`,
        'position',
        60,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      const positionKeys = [
        { frame: 0, value: originalPosition },
        { frame: 30, value: originalPosition.add(new BABYLON.Vector3(0, 1, 0)) },
        { frame: 60, value: originalPosition },
      ];

      positionAnimation.setKeys(positionKeys);
      positionAnimation.setEasingFunction(new BABYLON.CircleEase());

      // 旋转动画
      const rotationAnimation = new BABYLON.Animation(
        `${animationName}_rotation`,
        'rotation',
        60,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      const rotationKeys = [
        { frame: 0, value: originalRotation },
        { frame: 60, value: new BABYLON.Vector3(
          originalRotation.x,
          originalRotation.y + Math.PI * 2,
          originalRotation.z
        ) },
      ];

      rotationAnimation.setKeys(rotationKeys);

      mesh.animations.push(positionAnimation, rotationAnimation);

      const animatable = this.scene.beginAnimation(mesh, 0, 60, false, 1);
      animatable.onAnimationEnd = () => {
        mesh.position = originalPosition;
        mesh.rotation = originalRotation;
        resolve();
      };
    });
  }

  /**
   * 播放建筑维护动画（闪烁）
   */
  playMaintenanceAnimation(mesh: BABYLON.Mesh, config: BuildingAnimationConfig = { duration: 400 }): Promise<void> {
    return new Promise((resolve) => {
      const animationName = `maintenance_${mesh.name}`;
      this.stopAnimation(mesh, animationName);

      const originalMaterial = mesh.material;
      const material = new BABYLON.StandardMaterial(`${animationName}_material`, this.scene);

      if (originalMaterial instanceof BABYLON.StandardMaterial) {
        material.emissiveColor = originalMaterial.emissiveColor;
        material.specularColor = originalMaterial.specularColor;
      }

      mesh.material = material;

      // 颜色閪烁动画
      const colorAnimation = new BABYLON.Animation(
        `${animationName}_color`,
        'material.emissiveColor',
        60,
        BABYLON.Animation.ANIMATIONTYPE_COLOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      const colorKeys = [
        { frame: 0, value: new BABYLON.Color3(0, 0, 0) },
        { frame: 15, value: new BABYLON.Color3(1, 1, 0) },
        { frame: 30, value: new BABYLON.Color3(0, 0, 0) },
        { frame: 45, value: new BABYLON.Color3(1, 1, 0) },
        { frame: 60, value: new BABYLON.Color3(0, 0, 0) },
      ];

      colorAnimation.setKeys(colorKeys);
      mesh.animations.push(colorAnimation);

      const animatable = this.scene.beginAnimation(mesh, 0, 60, false, 1);
      animatable.onAnimationEnd = () => {
        mesh.material = originalMaterial;
        resolve();
      };
    });
  }

  /**
   * 播放建筑删除动画（缩小和淡出）
   */
  playDeletionAnimation(mesh: BABYLON.Mesh, config: BuildingAnimationConfig = { duration: 600 }): Promise<void> {
    return new Promise((resolve) => {
      const animationName = `deletion_${mesh.name}`;
      this.stopAnimation(mesh, animationName);

      const originalScale = mesh.scaling.clone();
      const originalMaterial = mesh.material;

      // 缩放动画
      const scaleAnimation = new BABYLON.Animation(
        `${animationName}_scale`,
        'scaling',
        60,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      const scaleKeys = [
        { frame: 0, value: originalScale },
        { frame: 60, value: new BABYLON.Vector3(0.1, 0.1, 0.1) },
      ];

      scaleAnimation.setKeys(scaleKeys);
      scaleAnimation.setEasingFunction(new BABYLON.CircleEase());

      mesh.animations.push(scaleAnimation);

      // 淡出动画
      if (mesh.material instanceof BABYLON.StandardMaterial) {
        const alphaAnimation = new BABYLON.Animation(
          `${animationName}_alpha`,
          'material.alpha',
          60,
          BABYLON.Animation.ANIMATIONTYPE_FLOAT,
          BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        const alphaKeys = [
          { frame: 0, value: 1 },
          { frame: 60, value: 0 },
        ];

        alphaAnimation.setKeys(alphaKeys);
        mesh.animations.push(alphaAnimation);
      }

      const animatable = this.scene.beginAnimation(mesh, 0, 60, false, 1);
      animatable.onAnimationEnd = () => {
        mesh.scaling = originalScale;
        mesh.material = originalMaterial;
        resolve();
      };
    });
  }

  /**
   * 播放建筑门开动画。传入门网格或门节点，动画结束后回到关闭状态。
   */
  playDoorOpenAnimation(mesh: BABYLON.Mesh, config: BuildingAnimationConfig = { duration: 450 }): Promise<void> {
    return new Promise((resolve) => {
      const animationName = `door_open_${mesh.name}`;
      this.stopAnimation(mesh, animationName);
      const originalRotation = mesh.rotation.clone();
      const animation = new BABYLON.Animation(`${animationName}_rotation`, "rotation", 60, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
      animation.setKeys([
        { frame: 0, value: originalRotation },
        { frame: 24, value: new BABYLON.Vector3(originalRotation.x, originalRotation.y - Math.PI / 2, originalRotation.z) },
        { frame: 48, value: new BABYLON.Vector3(originalRotation.x, originalRotation.y - Math.PI / 2, originalRotation.z) },
        { frame: 72, value: originalRotation },
      ]);
      animation.setEasingFunction(new BABYLON.CircleEase());
      mesh.animations.push(animation);
      const animatable = this.scene.beginAnimation(mesh, 0, 72, false, Math.max(0.1, 800 / Math.max(1, config.duration)));
      animatable.onAnimationEnd = () => { mesh.rotation = originalRotation; resolve(); };
    });
  }

  /**
   * 播放建筑生产动画（脉冲）
   */
  playProductionAnimation(mesh: BABYLON.Mesh, config: BuildingAnimationConfig & { loop?: boolean } = { duration: 800 }): void {
    const animationName = `production_${mesh.name}`;
    this.stopAnimation(mesh, animationName);

    const originalScale = mesh.scaling.clone();

    // 脉冲缩放动画
    const scaleAnimation = new BABYLON.Animation(
      `${animationName}_scale`,
      'scaling',
      60,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    const scaleKeys = [
      { frame: 0, value: originalScale },
      { frame: 30, value: originalScale.scale(1.15) },
      { frame: 60, value: originalScale },
    ];

    scaleAnimation.setKeys(scaleKeys);
    scaleAnimation.setEasingFunction(new BABYLON.CircleEase());

    mesh.animations.push(scaleAnimation);

    // 生产过程默认循环；收获前可调用 stopProductionAnimation。
    this.scene.beginAnimation(mesh, 0, 60, config.loop !== false, Math.max(0.1, 800 / Math.max(1, config.duration)));
  }

  stopProductionAnimation(mesh: BABYLON.Mesh): void {
    this.scene.stopAnimation(mesh);
    mesh.animations = mesh.animations.filter((animation) => !animation.name.startsWith(`production_${mesh.name}`));
  }

  /**
   * 播放建筑收获动画：轻微上浮并回落，结束后恢复原始变换。
   */
  playHarvestAnimation(mesh: BABYLON.Mesh, config: BuildingAnimationConfig = { duration: 550 }): Promise<void> {
    return new Promise((resolve) => {
      const animationName = `harvest_${mesh.name}`;
      this.stopAnimation(mesh, animationName);
      const originalPosition = mesh.position.clone();
      const originalScale = mesh.scaling.clone();
      const positionAnimation = new BABYLON.Animation(`${animationName}_position`, "position", 60, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
      positionAnimation.setKeys([
        { frame: 0, value: originalPosition },
        { frame: 24, value: originalPosition.add(new BABYLON.Vector3(0, 0.25, 0)) },
        { frame: 48, value: originalPosition },
      ]);
      const scaleAnimation = new BABYLON.Animation(`${animationName}_scale`, "scaling", 60, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
      scaleAnimation.setKeys([
        { frame: 0, value: originalScale },
        { frame: 24, value: originalScale.scale(1.08) },
        { frame: 48, value: originalScale },
      ]);
      mesh.animations.push(positionAnimation, scaleAnimation);
      const animatable = this.scene.beginAnimation(mesh, 0, 48, false, Math.max(0.1, 800 / Math.max(1, config.duration)));
      animatable.onAnimationEnd = () => { mesh.position = originalPosition; mesh.scaling = originalScale; resolve(); };
    });
  }

  /**
   * 播放建筑烟雾效果。该实现使用透明度与缩放动画，不依赖未交付的纹理资产。
   */
  playSmokeEffect(mesh: BABYLON.Mesh, config: BuildingAnimationConfig & { loop?: boolean } = { duration: 900 }): void {
    const animationName = `smoke_${mesh.name}`;
    this.stopAnimation(mesh, animationName);
    const material = mesh.material instanceof BABYLON.StandardMaterial
      ? mesh.material
      : new BABYLON.StandardMaterial(`${animationName}_material`, this.scene);
    const originalAlpha = material.alpha;
    const originalScale = mesh.scaling.clone();
    material.alpha = 0;
    mesh.material = material;
    const alphaAnimation = new BABYLON.Animation(`${animationName}_alpha`, "material.alpha", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    alphaAnimation.setKeys([{ frame: 0, value: 0 }, { frame: 30, value: 0.42 }, { frame: 60, value: 0 }]);
    const scaleAnimation = new BABYLON.Animation(`${animationName}_scale`, "scaling", 60, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    scaleAnimation.setKeys([{ frame: 0, value: originalScale }, { frame: 60, value: originalScale.scale(1.12) }]);
    mesh.animations.push(alphaAnimation, scaleAnimation);
    const animatable = this.scene.beginAnimation(mesh, 0, 60, config.loop !== false, Math.max(0.1, 900 / Math.max(1, config.duration)));
    if (config.loop === false) {
      animatable.onAnimationEnd = () => { material.alpha = originalAlpha; mesh.scaling = originalScale; };
    }
  }

  stopSmokeEffect(mesh: BABYLON.Mesh): void {
    this.scene.stopAnimation(mesh);
    mesh.animations = mesh.animations.filter((animation) => !animation.name.startsWith(`smoke_${mesh.name}`));
    if (mesh.material instanceof BABYLON.StandardMaterial) mesh.material.alpha = 1;
  }

  /**
   * 播放冰蓝色光效脉冲，用于建筑生产、完成或收益可收取提示。
   */
  playLightEffect(mesh: BABYLON.Mesh, config: BuildingAnimationConfig & { loop?: boolean } = { duration: 700 }): void {
    const animationName = `light_${mesh.name}`;
    this.stopAnimation(mesh, animationName);
    const material = mesh.material instanceof BABYLON.StandardMaterial
      ? mesh.material
      : new BABYLON.StandardMaterial(`${animationName}_material`, this.scene);
    const originalEmissive = material.emissiveColor.clone();
    material.emissiveColor = new BABYLON.Color3(0.05, 0.55, 1);
    mesh.material = material;
    const emissiveAnimation = new BABYLON.Animation(`${animationName}_emissive`, "material.emissiveColor", 60, BABYLON.Animation.ANIMATIONTYPE_COLOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    emissiveAnimation.setKeys([{ frame: 0, value: new BABYLON.Color3(0.05, 0.55, 1) }, { frame: 30, value: new BABYLON.Color3(0.35, 0.9, 1) }, { frame: 60, value: new BABYLON.Color3(0.05, 0.55, 1) }]);
    mesh.animations.push(emissiveAnimation);
    const animatable = this.scene.beginAnimation(mesh, 0, 60, config.loop !== false, Math.max(0.1, 700 / Math.max(1, config.duration)));
    if (config.loop === false) animatable.onAnimationEnd = () => { material.emissiveColor = originalEmissive; };
  }

  stopLightEffect(mesh: BABYLON.Mesh): void {
    this.scene.stopAnimation(mesh);
    mesh.animations = mesh.animations.filter((animation) => !animation.name.startsWith(`light_${mesh.name}`));
    if (mesh.material instanceof BABYLON.StandardMaterial) mesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
  }

  /**
   * 播放建筑健康度恢复动画（绿色闪光）
   */
  playHealthRecoveryAnimation(mesh: BABYLON.Mesh, config: BuildingAnimationConfig = { duration: 500 }): Promise<void> {
    return new Promise((resolve) => {
      const animationName = `health_recovery_${mesh.name}`;
      this.stopAnimation(mesh, animationName);

      const originalMaterial = mesh.material;
      const material = new BABYLON.StandardMaterial(`${animationName}_material`, this.scene);

      if (originalMaterial instanceof BABYLON.StandardMaterial) {
        material.emissiveColor = originalMaterial.emissiveColor;
        material.specularColor = originalMaterial.specularColor;
      }

      mesh.material = material;

      // 绿色发光动画
      const emissiveAnimation = new BABYLON.Animation(
        `${animationName}_emissive`,
        'material.emissiveColor',
        60,
        BABYLON.Animation.ANIMATIONTYPE_COLOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      const emissiveKeys = [
        { frame: 0, value: new BABYLON.Color3(0, 0, 0) },
        { frame: 20, value: new BABYLON.Color3(0, 1, 0) },
        { frame: 40, value: new BABYLON.Color3(0, 0, 0) },
        { frame: 60, value: new BABYLON.Color3(0, 0, 0) },
      ];

      emissiveAnimation.setKeys(emissiveKeys);
      mesh.animations.push(emissiveAnimation);

      const animatable = this.scene.beginAnimation(mesh, 0, 60, false, 1);
      animatable.onAnimationEnd = () => {
        mesh.material = originalMaterial;
        resolve();
      };
    });
  }

  /**
   * 停止特定动画
   */
  private stopAnimation(mesh: BABYLON.Mesh, animationName: string): void {
    this.scene.stopAnimation(mesh);
    mesh.animations = mesh.animations.filter((anim) => !anim.name.includes(animationName));
  }

  /**
   * 清理所有动画
   */
  dispose(): void {
    this.activeAnimations.clear();
  }
}
