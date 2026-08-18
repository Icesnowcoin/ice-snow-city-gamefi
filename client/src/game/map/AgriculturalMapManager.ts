import * as BABYLON from '@babylonjs/core';
import { BabylonGameEngine } from '../engine/BabylonGameEngine';
import { AgriculturalBuildingManager } from '../models/AgriculturalBuildingManager';
import { VegetationManager } from '../models/VegetationManager';
import { Building, Vegetation, createDefaultBuilding, createDefaultVegetation } from '../types/GameObjectTypes';
import { MeshObjectMapper } from '../utils/MeshObjectMapper';
import { VisualFeedbackController } from '../effects/VisualFeedbackController';
import { DayNightCycleSystem } from '../environment/DayNightCycleSystem';
import { WeatherSystem } from '../environment/WeatherSystem';
import { SkyboxSystem } from '../environment/SkyboxSystem';
import { ParticleSystemManager } from '../effects/ParticleSystem';
import { SeasonSystem } from '../environment/SeasonSystem';
import { VegetationSeasonManager } from '../environment/VegetationSeasonManager';
import { BuildingSeasonManager } from '../environment/BuildingSeasonManager';
import { EnvironmentSeasonManager } from '../environment/EnvironmentSeasonManager';
import { AudioManager } from '../audio/AudioManager';
import { SeasonalAudioManager } from '../audio/SeasonalAudioManager';
import { WeatherAudioManager } from '../audio/WeatherAudioManager';
import { EnvironmentalAudioManager } from '../audio/EnvironmentalAudioManager';
import { MinimapManager } from './MinimapManager';
import { TourRouteManager } from '../tour/TourRouteManager';
import { AutoTourController } from '../tour/AutoTourController';

/**
 * 农业区地图管理器
 * 负责创建和管理农业区的完整 3D 地图场景
 */
export class AgriculturalMapManager {
  private engine: BabylonGameEngine;
  private buildingManager: AgriculturalBuildingManager;
  private vegetationManager: VegetationManager;
  private ground: BABYLON.Mesh | null = null;
  private selectedMesh: BABYLON.Mesh | null = null;
  private raycaster: BABYLON.Ray | null = null;
  private gameObjects: Map<string, Building | Vegetation> = new Map();
  private meshMapper: MeshObjectMapper = new MeshObjectMapper();
  private onObjectSelected: ((object: Building | Vegetation | null) => void) | null = null;
  private visualFeedback: VisualFeedbackController | null = null;
  private dayNightCycle: DayNightCycleSystem | null = null;
  private weatherSystem: WeatherSystem | null = null;
  private skyboxSystem: SkyboxSystem | null = null;
  private particleManager: ParticleSystemManager | null = null;
  private seasonSystem: SeasonSystem | null = null;
  private vegetationSeasonManager: VegetationSeasonManager | null = null;
  private buildingSeasonManager: BuildingSeasonManager | null = null;
  private environmentSeasonManager: EnvironmentSeasonManager | null = null;
  private audioManager: AudioManager | null = null;
  private seasonalAudioManager: SeasonalAudioManager | null = null;
  private weatherAudioManager: WeatherAudioManager | null = null;
  private environmentalAudioManager: EnvironmentalAudioManager | null = null;
  private minimapManager: MinimapManager | null = null;
  private tourRouteManager: TourRouteManager | null = null;
  private autoTourController: AutoTourController | null = null;

  constructor(engine: BabylonGameEngine) {
    this.engine = engine;
    this.buildingManager = new AgriculturalBuildingManager(engine);
    this.vegetationManager = new VegetationManager(engine);
  }

  /**
   * 设置对象选择回调
   */
  public setOnObjectSelected(callback: (object: Building | Vegetation | null) => void): void {
    this.onObjectSelected = callback;
  }

  /**
   * 初始化农业区地图
   */
  public async initialize(): Promise<void> {
    // 创建地面
    this.ground = this.engine.createGround(500, 500);

    // 创建所有建筑
    this.buildingManager.createAllBuildings();
    this.registerBuildings();

    // 创建所有植被
    this.vegetationManager.createCompleteVegetation();
    this.registerVegetation();

    // 创建视觉反馈控制器
    this.visualFeedback = new VisualFeedbackController(this.engine.getScene(), {
      enableParticles: true,
      enableAnimations: true,
      enableSounds: true,
      particleDuration: 1.0,
      animationDuration: 0.5,
    });

    // 创建粒子系统管理器
    this.particleManager = new ParticleSystemManager(this.engine.getScene());

    // 初始化昼夜循环系统
    this.dayNightCycle = new DayNightCycleSystem(this.engine.getScene(), {
      gameHourDuration: 36,
      startHour: 6,
      sunriseHour: 6,
      sunsetHour: 18,
    });
    this.dayNightCycle.start();

    // 初始化天气系统
    this.weatherSystem = new WeatherSystem(this.engine.getScene(), this.particleManager);
    this.weatherSystem.setWeather({ type: 'clear', intensity: 0, duration: 300 });
    this.weatherSystem.start();

    // 初始化天空盒系统
    this.skyboxSystem = new SkyboxSystem(this.engine.getScene());

    // 初始化季节系统
    this.seasonSystem = new SeasonSystem();
    this.seasonSystem.setDate(3, 1);

    // 创建植被季节管理器
    this.vegetationSeasonManager = new VegetationSeasonManager(this.seasonSystem, this.particleManager);
    this.vegetationManager.getVegetation().forEach((meshes) => {
      meshes.forEach((mesh) => {
        this.vegetationSeasonManager?.registerVegetation(mesh);
      });
    });

    // 创建建筑季节管理器
    this.buildingSeasonManager = new BuildingSeasonManager(this.seasonSystem);
    this.buildingManager.getBuildings().forEach((mesh) => {
      this.buildingSeasonManager?.registerBuilding(mesh);
    });

    // 创建环境季节管理器
    this.environmentSeasonManager = new EnvironmentSeasonManager(
      this.seasonSystem,
      this.weatherSystem,
      this.skyboxSystem,
      this.engine.getScene()
    );

    // 应用初始季节效果
    this.environmentSeasonManager.applyAllSeasonalEffects('spring');
    this.vegetationSeasonManager.updateAllVegetationAppearances('spring');
    this.buildingSeasonManager.updateAllBuildingAppearances('spring');

    // 设置季节变化回调
    this.seasonSystem.setOnSeasonChanged((season) => {
      this.environmentSeasonManager?.applyAllSeasonalEffects(season);
      this.vegetationSeasonManager?.updateAllVegetationAppearances(season);
      this.buildingSeasonManager?.updateAllBuildingAppearances(season);
      this.seasonalAudioManager?.changeSeason(season);
    });

    // 初始化音效系统
    this.audioManager = new AudioManager();
    this.seasonalAudioManager = new SeasonalAudioManager(this.audioManager);
    this.weatherAudioManager = new WeatherAudioManager(this.audioManager);
    this.environmentalAudioManager = new EnvironmentalAudioManager(this.audioManager);

    // 播放初始季节音效
    this.seasonalAudioManager.changeSeason('spring');
    this.environmentalAudioManager.changeTimeOfDay('morning');

    // 初始化小地图
    this.minimapManager = new MinimapManager({
      width: 200,
      height: 200,
      scale: 1,
      centerX: 0,
      centerZ: 0,
      showGrid: true,
      showMarkers: true,
    });

    // 设置地图边界
    this.minimapManager.setMapBounds(-100, 100, -100, 100);

    // 设置相机位置
    this.setupCameraView();

    // 初始化导覽系统
    this.tourRouteManager = new TourRouteManager();
    const camera = this.engine.getScene().activeCamera as BABYLON.UniversalCamera;
    if (camera) {
      this.autoTourController = new AutoTourController(this.engine.getScene(), camera, this.tourRouteManager);
    }

    // 设置交互系统
    this.setupInteractions();

    // 创建网格和坐标轴（调试用）
    this.createDebugVisuals();
  }

  /**
   * 注册建筑对象
   */
  private registerBuildings(): void {
    const buildings = this.buildingManager.getBuildings();
    buildings.forEach((mesh, name) => {
      const building = createDefaultBuilding(name, name, 'farmhouse', {
        x: mesh.position.x,
        y: mesh.position.y,
        z: mesh.position.z,
      });
      this.gameObjects.set(name, building);
      
      // 注册主网格
      this.meshMapper.registerMesh(mesh, building);
      
      // 注册所有子网格
      this.registerBuildingSubMeshes(mesh, building);
    });
  }

  /**
   * 注册建筑的子网格
   */
  private registerBuildingSubMeshes(mesh: BABYLON.Mesh, building: Building): void {
    const scene = this.engine.getScene();
    const allMeshes = scene.meshes;
    
    // 找到所有与此建筑相关的子网格（基于名称前缀）
    const buildingPrefix = building.name.replace(/_\d+$/, ''); // 移除数字后缀
    allMeshes.forEach((m) => {
      if (m.name.startsWith(buildingPrefix) && m.name !== mesh.name) {
        this.meshMapper.registerMesh(m as BABYLON.Mesh, building);
      }
    });
  }

  /**
   * 注册植被对象
   */
  private registerVegetation(): void {
    const vegetation = this.vegetationManager.getVegetation();
    vegetation.forEach((meshes, name) => {
      const veg = createDefaultVegetation(name, name, 'wheat_field', {
        x: meshes[0].position.x,
        y: meshes[0].position.y,
        z: meshes[0].position.z,
      });
      this.gameObjects.set(name, veg);
      
      // 注册所有网格
      this.meshMapper.registerMeshes(meshes, veg);
    });
  }

  /**
   * 设置相机视角
   */
  private setupCameraView(): void {
    // 设置初始相机位置（俯视角）
    this.engine.setCameraView(
      new BABYLON.Vector3(0, 150, -200),
      new BABYLON.Vector3(0, 0, 0)
    );
  }

  /**
   * 设置交互系统
   */
  private setupInteractions(): void {
    const scene = this.engine.getScene();
    const canvas = scene.getEngine().getRenderingCanvas();

    if (!canvas) return;

    // 鼠标点击事件
    canvas.addEventListener('click', (event) => {
      this.handleMouseClick(event);
    });

    // 鼠标悬停事件
    canvas.addEventListener('mousemove', (event) => {
      this.handleMouseMove(event);
    });

    // 鼠标滚轮缩放
    canvas.addEventListener('wheel', (event) => {
      this.handleMouseWheel(event);
    });
  }

  /**
   * 处理鼠标点击
   */
  private handleMouseClick(event: MouseEvent): void {
    const scene = this.engine.getScene();
    const camera = this.engine.getCamera();
    const canvas = scene.getEngine().getRenderingCanvas();

    if (!canvas) return;

    // 获取鼠标在画布中的位置
    const x = event.clientX - canvas.getBoundingClientRect().left;
    const y = event.clientY - canvas.getBoundingClientRect().top;

    // 使用 pickWithRay 不需要手动创建 Ray
    const hit = scene.pick(
      x,
      y,
      (mesh) => {
        return mesh !== this.ground; // 排除地面
      }
    );

    if (hit && hit.hit) {
      this.selectMesh(hit.pickedMesh as BABYLON.Mesh);
      const gameObject = this.meshMapper.getObjectByMesh(hit.pickedMesh as BABYLON.Mesh);
      if (this.onObjectSelected) {
        this.onObjectSelected(gameObject || null);
      }
      console.log('Selected:', hit.pickedMesh?.name, gameObject);
    } else {
      this.deselectMesh();
      if (this.onObjectSelected) {
        this.onObjectSelected(null);
      }
    }
  }

  /**
   * 处理鼠标移动
   */
  private handleMouseMove(event: MouseEvent): void {
    const scene = this.engine.getScene();
    const camera = this.engine.getCamera();
    const canvas = scene.getEngine().getRenderingCanvas();

    if (!canvas) return;

    // 获取鼠标在画布中的位置
    const x = event.clientX - canvas.getBoundingClientRect().left;
    const y = event.clientY - canvas.getBoundingClientRect().top;

    // 使用 pick 方法检测鼠标位置
    const hit = scene.pick(
      x,
      y,
      (mesh) => {
        return mesh !== this.ground; // 排除地面
      }
    );

    if (hit && hit.hit) {
      // 改变光标样式
      canvas.style.cursor = 'pointer';
    } else {
      canvas.style.cursor = 'default';
    }
  }

  /**
   * 处理鼠标滚轮缩放
   */
  private handleMouseWheel(event: WheelEvent): void {
    event.preventDefault();

    const camera = this.engine.getCamera();
    const direction = camera.getDirection(BABYLON.Axis.Z);
    const distance = event.deltaY > 0 ? 10 : -10;

    camera.position.addInPlace(direction.scale(distance));
  }

  /**
   * 选择网格
   */
  private selectMesh(mesh: BABYLON.Mesh | null): void {
    // 取消之前的选择
    if (this.selectedMesh) {
      this.deselectMesh();
    }

    if (mesh) {
      this.selectedMesh = mesh;

      // 添加选择效果
      const outline = new BABYLON.GlowLayer('glow', this.engine.getScene());
      outline.addIncludedOnlyMesh(mesh);
      outline.intensity = 1.5;
    }
  }

  /**
   * 取消选择网格
   */
  private deselectMesh(): void {
    if (this.selectedMesh) {
      // 移除发光效果
      const scene = this.engine.getScene();
      const glowLayers = scene.layers;
      glowLayers.forEach((layer: any) => {
        if (layer.name === 'glow') {
          layer.dispose();
        }
      });

      this.selectedMesh = null;
    }
  }

  /**
   * 创建调试可视化
   */
  private createDebugVisuals(): void {
    const scene = this.engine.getScene();

    // 创建坐标轴
    const axisSize = 50;

    // X 轴（红色）
    const xAxis = BABYLON.MeshBuilder.CreateTube('xAxis', {
      path: [
        new BABYLON.Vector3(0, 0, 0),
        new BABYLON.Vector3(axisSize, 0, 0),
      ],
      radius: 1,
    }, scene);

    const xMaterial = new BABYLON.StandardMaterial('xMat', scene);
    (xMaterial as any).emissiveColor = new BABYLON.Color3(1, 0, 0);
    xAxis.material = xMaterial;

    // Y 轴（绿色）
    const yAxis = BABYLON.MeshBuilder.CreateTube('yAxis', {
      path: [
        new BABYLON.Vector3(0, 0, 0),
        new BABYLON.Vector3(0, axisSize, 0),
      ],
      radius: 1,
    }, scene);

    const yMaterial = new BABYLON.StandardMaterial('yMat', scene);
    (yMaterial as any).emissiveColor = new BABYLON.Color3(0, 1, 0);
    yAxis.material = yMaterial;

    // Z 轴（蓝色）
    const zAxis = BABYLON.MeshBuilder.CreateTube('zAxis', {
      path: [
        new BABYLON.Vector3(0, 0, 0),
        new BABYLON.Vector3(0, 0, axisSize),
      ],
      radius: 1,
    }, scene);

    const zMaterial = new BABYLON.StandardMaterial('zMat', scene);
    (zMaterial as any).emissiveColor = new BABYLON.Color3(0, 0, 1);
    zAxis.material = zMaterial;
  }

  /**
   * 获取建筑管理器
   */
  public getBuildingManager(): AgriculturalBuildingManager {
    return this.buildingManager;
  }

  /**
   * 获取植被管理器
   */
  public getVegetationManager(): VegetationManager {
    return this.vegetationManager;
  }

  /**
   * 获取选中的网格
   */
  public getSelectedMesh(): BABYLON.Mesh | null {
    return this.selectedMesh;
  }

  /**
   * 获取游戏对象
   */
  public getGameObject(name: string): Building | Vegetation | undefined {
    return this.gameObjects.get(name);
  }

  /**
   * 获取所有游戏对象
   */
  public getAllGameObjects(): Map<string, Building | Vegetation> {
    return this.gameObjects;
  }

  /**
   * 获取网格映射器
   */
  public getMeshMapper(): MeshObjectMapper {
    return this.meshMapper;
  }

  /**
   * 播放编辑反馈
   */
  public playEditFeedback(object: Building | Vegetation): void {
    if (!this.visualFeedback) return;

    const meshes = this.meshMapper.getMeshesByObject(object);
    const mesh = meshes.length > 0 ? meshes[0] : null;
    if (mesh) {
      this.visualFeedback.playEditFeedback(mesh, object);
    }
  }

  /**
   * 播放维护反馈
   */
  public playMaintenanceFeedback(building: Building): void {
    if (!this.visualFeedback) return;

    const meshes = this.meshMapper.getMeshesByObject(building);
    const mesh = meshes.length > 0 ? meshes[0] : null;
    if (mesh) {
      this.visualFeedback.playMaintenanceFeedback(mesh, building);
    }
  }

  /**
   * 播放删除反馈
   */
  public playDeleteFeedback(object: Building | Vegetation): void {
    if (!this.visualFeedback) return;

    const meshes = this.meshMapper.getMeshesByObject(object);
    const mesh = meshes.length > 0 ? meshes[0] : null;
    if (mesh) {
      this.visualFeedback.playDeleteFeedback(mesh, object);
    }
  }

  /**
   * 更新地图（每帧调用）
   */
  public update(deltaTime: number): void {
    // 更新昼夜循环
    if (this.dayNightCycle) {
      this.dayNightCycle.update(deltaTime);
      
      // 更新天空盒颜色
      if (this.skyboxSystem) {
        this.skyboxSystem.updateSkyColor(this.dayNightCycle.getTimeProgress());
      }
    }

    // 更新天气系统
    if (this.weatherSystem) {
      this.weatherSystem.update(deltaTime);
    }

    // 更新天空盒位置
    if (this.skyboxSystem) {
      this.skyboxSystem.update();
    }

    // 更新季节系统
    if (this.seasonSystem && this.dayNightCycle) {
      const timeInfo = this.dayNightCycle.getTimeInfo();
      this.seasonSystem.setDate(3, 1);
    }
  }

  /**
   * 获取昼夜循环系统
   */
  public getDayNightCycle(): DayNightCycleSystem | null {
    return this.dayNightCycle;
  }

  /**
   * 获取天气系统
   */
  public getWeatherSystem(): WeatherSystem | null {
    return this.weatherSystem;
  }

  /**
   * 获取天空盒系统
   */
  public getSkyboxSystem(): SkyboxSystem | null {
    return this.skyboxSystem;
  }

  /**
   * 获取季节系统
   */
  public getSeasonSystem(): SeasonSystem | null {
    return this.seasonSystem;
  }

  /**
   * 快进到下一个季节
   */
  public advanceToNextSeason(): void {
    if (this.seasonSystem) {
      this.seasonSystem.advanceToNextSeason();
    }
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    this.buildingManager.clear();
    this.vegetationManager.clear();

    if (this.visualFeedback) {
      this.visualFeedback.dispose();
    }

    if (this.dayNightCycle) {
      this.dayNightCycle.dispose();
    }

    if (this.weatherSystem) {
      this.weatherSystem.dispose();
    }

    if (this.skyboxSystem) {
      this.skyboxSystem.dispose();
    }

    if (this.vegetationSeasonManager) {
      this.vegetationSeasonManager.dispose();
    }

    if (this.buildingSeasonManager) {
      this.buildingSeasonManager.dispose();
    }

    if (this.environmentSeasonManager) {
      this.environmentSeasonManager.dispose();
    }

    if (this.seasonalAudioManager) {
      this.seasonalAudioManager.dispose();
    }

    if (this.weatherAudioManager) {
      this.weatherAudioManager.dispose();
    }

    if (this.environmentalAudioManager) {
      this.environmentalAudioManager.dispose();
    }

    if (this.audioManager) {
      this.audioManager.dispose();
    }

    if (this.ground) {
      this.ground.dispose();
    }

    if (this.minimapManager) {
      this.minimapManager.dispose();
    }

    if (this.autoTourController) {
      this.autoTourController.dispose();
    }
  }

  /**
   * 获取导覽路线管理器
   */
  public getTourRouteManager(): TourRouteManager | null {
    return this.tourRouteManager;
  }

  /**
   * 获取自动导覽控制器
   */
  public getAutoTourController(): AutoTourController | null {
    return this.autoTourController;
  }

  /**
   * 开始导覽
   */
  public startTour(routeId?: string): void {
    if (this.autoTourController) {
      this.autoTourController.startTour(routeId);
    }
  }

  /**
   * 停止导覽
   */
  public stopTour(): void {
    if (this.autoTourController) {
      this.autoTourController.stopTour();
    }
  }

  /**
   * 暂停导覽
   */
  public pauseTour(): void {
    if (this.autoTourController) {
      this.autoTourController.pauseTour();
    }
  }

  /**
   * 恢复导覽
   */
  public resumeTour(): void {
    if (this.autoTourController) {
      this.autoTourController.resumeTour();
    }
  }

  /**
   * 获取小地图管理器
   */
  public getMinimapManager(): MinimapManager | null {
    return this.minimapManager;
  }

  /**
   * 更新小地图相机位置
   */
  public updateMinimapCamera(): void {
    if (!this.minimapManager) return;

    const camera = this.engine.getScene().activeCamera as any;
    if (camera) {
      const position = camera.position;
      const rotation = camera.rotation?.y || 0;
      this.minimapManager.updateCameraPosition(position.x, position.z, rotation);
    }
  }
}
