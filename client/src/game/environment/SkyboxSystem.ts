import * as BABYLON from '@babylonjs/core';

/**
 * 天空盒系统
 * 管理游戏内的天空、云层和环境渲染
 */
export class SkyboxSystem {
  private scene: BABYLON.Scene;
  private skybox: BABYLON.Mesh | null = null;
  private skyboxMaterial: BABYLON.StandardMaterial | null = null;
  private currentTimeOfDay: number = 0.5; // 0-1，0 为午夜，0.5 为中午

  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
    this.initializeSkybox();
  }

  /**
   * 初始化天空盒
   */
  private initializeSkybox(): void {
    // 创建天空盒网格
    this.skybox = BABYLON.MeshBuilder.CreateBox('skybox', { size: 1000 }, this.scene);

    // 创建天空盒材质
    this.skyboxMaterial = new BABYLON.StandardMaterial('skyboxMaterial', this.scene);
    this.skyboxMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.7, 1);
    this.skyboxMaterial.backFaceCulling = false;

    this.skybox.material = this.skyboxMaterial;

    // 将天空盒附加到摄像机
    if (this.scene.activeCamera) {
      this.skybox.parent = this.scene.activeCamera;
    }
  }

  /**
   * 更新天空盒颜色
   */
  public updateSkyColor(timeProgress: number): void {
    if (!this.skyboxMaterial) return;

    this.currentTimeOfDay = timeProgress;

    // 根据时间计算天空颜色
    let skyColor: BABYLON.Color3;

    if (timeProgress < 0.25) {
      // 午夜到日出 (0:00 - 6:00)
      const t = timeProgress / 0.25; // 0-1
      skyColor = BABYLON.Color3.Lerp(
        new BABYLON.Color3(0.1, 0.1, 0.2), // 午夜：深蓝色
        new BABYLON.Color3(1, 0.5, 0.2), // 日出：橙色
        t
      );
    } else if (timeProgress < 0.5) {
      // 日出到中午 (6:00 - 12:00)
      const t = (timeProgress - 0.25) / 0.25; // 0-1
      skyColor = BABYLON.Color3.Lerp(
        new BABYLON.Color3(1, 0.5, 0.2), // 日出：橙色
        new BABYLON.Color3(0.5, 0.7, 1), // 中午：蓝色
        t
      );
    } else if (timeProgress < 0.75) {
      // 中午到日落 (12:00 - 18:00)
      const t = (timeProgress - 0.5) / 0.25; // 0-1
      skyColor = BABYLON.Color3.Lerp(
        new BABYLON.Color3(0.5, 0.7, 1), // 中午：蓝色
        new BABYLON.Color3(1, 0.5, 0.2), // 日落：橙色
        t
      );
    } else {
      // 日落到午夜 (18:00 - 0:00)
      const t = (timeProgress - 0.75) / 0.25; // 0-1
      skyColor = BABYLON.Color3.Lerp(
        new BABYLON.Color3(1, 0.5, 0.2), // 日落：橙色
        new BABYLON.Color3(0.1, 0.1, 0.2), // 午夜：深蓝色
        t
      );
    }

    this.skyboxMaterial.emissiveColor = skyColor;
  }

  /**
   * 根据天气调整天空颜色
   */
  public adjustForWeather(weatherType: string, intensity: number): void {
    if (!this.skyboxMaterial) return;

    let adjustment = new BABYLON.Color3(1, 1, 1);

    switch (weatherType) {
      case 'cloudy':
        adjustment = new BABYLON.Color3(0.8, 0.8, 0.8);
        break;
      case 'rainy':
        adjustment = new BABYLON.Color3(0.5, 0.5, 0.6);
        break;
      case 'stormy':
        adjustment = new BABYLON.Color3(0.3, 0.3, 0.4);
        break;
      case 'snowy':
        adjustment = new BABYLON.Color3(0.7, 0.7, 0.8);
        break;
    }

    // 根据强度混合调整
    const currentColor = this.skyboxMaterial.emissiveColor;
    this.skyboxMaterial.emissiveColor = BABYLON.Color3.Lerp(
      currentColor,
      currentColor.multiply(adjustment),
      intensity * 0.5
    );
  }

  /**
   * 获取当前天空颜色
   */
  public getSkyColor(): BABYLON.Color3 {
    return this.skyboxMaterial?.emissiveColor.clone() || new BABYLON.Color3(0.5, 0.7, 1);
  }

  /**
   * 获取当前时间进度 (0-1)
   */
  public getTimeProgress(): number {
    return this.currentTimeOfDay;
  }

  /**
   * 更新天空盒位置（跟随摄像机）
   */
  public update(): void {
    if (this.skybox && this.scene.activeCamera) {
      this.skybox.position = this.scene.activeCamera.position.clone();
    }
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    if (this.skybox) {
      this.skybox.dispose();
    }
    if (this.skyboxMaterial) {
      this.skyboxMaterial.dispose();
    }
  }
}
