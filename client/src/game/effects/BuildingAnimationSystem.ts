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
   * 播放建筑生产动画（脉冲）
   */
  playProductionAnimation(mesh: BABYLON.Mesh, config: BuildingAnimationConfig = { duration: 800 }): void {
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

    // 启动循环动画
    this.scene.beginAnimation(mesh, 0, 60, true, 1);
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
