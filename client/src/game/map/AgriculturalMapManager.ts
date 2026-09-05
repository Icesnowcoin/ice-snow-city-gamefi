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
import { LandmarkManager } from './LandmarkManager';
import { LandmarkVfxManager } from './LandmarkVfxManager';
import { NPCWorldManager } from './NPCWorldManager';
import { TourRouteManager } from '../tour/TourRouteManager';
import { AutoTourController } from '../tour/AutoTourController';
import { RouteLightingManager, RouteLightingNode } from './RouteLightingManager';
import { BusinessDataCollectionManager, BusinessDataPoint } from './BusinessDataCollectionManager';

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
  private onNPCSelected: ((npcId: string) => void) | null = null;
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
  private landmarkManager: LandmarkManager | null = null;
  private landmarkVfxManager: LandmarkVfxManager | null = null;
  private npcWorldManager: NPCWorldManager | null = null;
  private tourRouteManager: TourRouteManager | null = null;
  private autoTourController: AutoTourController | null = null;
  private routeLightingManager: RouteLightingManager | null = null;
  private onRouteNodeSelected: ((node: RouteLightingNode) => void) | null = null;
  private businessDataManager: BusinessDataCollectionManager | null = null;
  private onBusinessDataPointSelected: ((point: BusinessDataPoint) => void) | null = null;
  private cameraRoamObserver: BABYLON.Observer<BABYLON.Scene> | null = null;
  private cameraRoamOnComplete: (() => void) | null = null;

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

  public setOnNPCSelected(callback: (npcId: string) => void): void {
    this.onNPCSelected = callback;
  }

  public setOnRouteNodeSelected(callback: (node: RouteLightingNode) => void): void {
    this.onRouteNodeSelected = callback;
  }

  public setOnBusinessDataPointSelected(callback: (point: BusinessDataPoint) => void): void {
    this.onBusinessDataPointSelected = callback;
    this.businessDataManager?.setOnPointSelected(callback);
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

    // 创建可点击的程序化测试地块，作为真实 GLB/PBR 资产接入前的交互样板
    this.createInteractiveTestPlots();

    // 创建商业帝国基础地标占位模型，正式 GLB 资产可沿用相同根节点与元数据
    this.landmarkManager = new LandmarkManager(this.engine.getScene(), this.meshMapper);
    this.landmarkManager.createAllLandmarks();
    this.registerLandmarks();
    const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lowQuality = (typeof navigator !== 'undefined' && (navigator.hardwareConcurrency ?? 8) <= 4)
      || this.engine.getEngine().getCaps().maxTextureSize < 4096;
    this.landmarkVfxManager = new LandmarkVfxManager(this.engine.getScene(), this.landmarkManager.getRoots(), {
      reducedMotion,
      lowQuality,
    });

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

    // 设置地图边界，覆盖基础地标和农业区的完整布局
    this.minimapManager.setMapBounds(-140, 150, -140, 150);

    this.businessDataManager = new BusinessDataCollectionManager(this.engine.getScene(), this.minimapManager);
    this.businessDataManager.createPoints();
    if (this.onBusinessDataPointSelected) this.businessDataManager.setOnPointSelected(this.onBusinessDataPointSelected);

    this.routeLightingManager = new RouteLightingManager(this.engine.getScene(), this.minimapManager, { reducedMotion });
    this.routeLightingManager.createRoute();
    this.routeLightingManager.setOnNodeSelected((node) => this.onRouteNodeSelected?.(node));

    // 设置相机位置
    this.setupCameraView();

    // 创建基础 NPC 占位模型、巡逻路线和小地图标记
    this.npcWorldManager = new NPCWorldManager(this.engine.getScene(), this.minimapManager, {
      reducedMotion,
      lowQuality,
    });
    this.npcWorldManager.createAllNPCs();

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
   * 创建可点击的测试地块和建筑样板。
   * 这些对象只存在于当前场景，用于验证点击选择、信息提示和触控交互链路。
   */
  private createInteractiveTestPlots(): void {
    const scene = this.engine.getScene();
    const testPlots = [
      { id: 'test-aurora-residence', name: '瑞景华府', type: 'farmhouse' as const, x: -72, z: -34, height: 16, color: new BABYLON.Color3(0.32, 0.62, 0.86) },
      { id: 'test-crystal-market', name: '鸿运商都', type: 'storage' as const, x: 8, z: -28, height: 24, color: new BABYLON.Color3(0.56, 0.38, 0.86) },
      { id: 'test-frost-factory', name: '丰盈智造园', type: 'greenhouse' as const, x: 74, z: -12, height: 19, color: new BABYLON.Color3(0.28, 0.74, 0.58) },
    ];

    testPlots.forEach((plot) => {
      const building = createDefaultBuilding(plot.id, plot.name, plot.type, { x: plot.x, y: plot.height / 2, z: plot.z });
      building.description = `${plot.name}：用于验证冰雪都市 3D 地图的点击查看与移动端触控交互。`;
      building.state.productivity = 70 + Math.round(plot.height);
      building.size = { width: 26, height: plot.height, depth: 22 };
      building.color = { r: plot.color.r, g: plot.color.g, b: plot.color.b };
      this.gameObjects.set(plot.id, building);
      this.minimapManager?.addMarker({
        id: plot.id,
        name: plot.name,
        label: plot.name.slice(0, 2),
        x: plot.x,
        z: plot.z,
        type: 'building',
        color: plot.color,
        radius: 4,
        landmark: true,
      });

      const plotMesh = BABYLON.MeshBuilder.CreateGround(`${plot.id}-plot`, { width: 38, height: 34 }, scene);
      plotMesh.position = new BABYLON.Vector3(plot.x, 0.06, plot.z);
      const plotMaterial = new BABYLON.StandardMaterial(`${plot.id}-plot-material`, scene);
      plotMaterial.diffuseColor = new BABYLON.Color3(0.82, 0.9, 0.96);
      plotMaterial.emissiveColor = new BABYLON.Color3(0.04, 0.1, 0.16);
      plotMesh.material = plotMaterial;

      const buildingMesh = this.engine.createBuilding(
        `${plot.id}-building`,
        new BABYLON.Vector3(plot.x, plot.height / 2 + 0.12, plot.z),
        building.size,
        plot.color,
      );
      const facadeMaterial = buildingMesh.material as BABYLON.StandardMaterial;
      facadeMaterial.emissiveColor = plot.color.scale(0.12);
      buildingMesh.metadata = { ...(buildingMesh.metadata ?? {}), testPlotId: plot.id };

      this.meshMapper.registerMesh(plotMesh, building);
      this.meshMapper.registerMesh(buildingMesh, building);
    });
  }

  /**
   * 将地标对象加入统一的游戏对象选择和信息面板数据源。
   */
  private registerLandmarks(): void {
    this.landmarkManager?.getBuildings().forEach((building) => {
      this.gameObjects.set(building.id, building);
      const color = building.color;
      this.minimapManager?.addMarker({
        id: building.id,
        name: building.name,
        label: building.name.slice(0, 2),
        x: building.position.x,
        z: building.position.z,
        type: 'building',
        color: { r: color.r, g: color.g, b: color.b },
        radius: building.buildingType === 'city_core' ? 5 : 4,
        landmark: true,
      });
    });
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
      const pickedMetadata = (hit.pickedMesh as BABYLON.Mesh).metadata as { npcId?: string } | null;
      if (pickedMetadata?.npcId) {
        this.onNPCSelected?.(pickedMetadata.npcId);
        return;
      }
      if (this.businessDataManager?.handlePickedMesh(hit.pickedMesh as BABYLON.Mesh)) {
        return;
      }
      if (this.routeLightingManager?.handlePickedMesh(hit.pickedMesh as BABYLON.Mesh)) {
        return;
      }
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
   * 从当前相机视角平滑漫游到金融区（ISC 银行总部附近）。
   * 仅控制当前本地 Babylon 相机，不改变服务端权限或链上状态。
   */
  public roamToFinanceDistrict(onComplete?: () => void, durationMs = 2200): boolean {
    const scene = this.engine.getScene();
    const camera = scene.activeCamera as BABYLON.UniversalCamera | null;
    const bank = this.landmarkManager?.getRoots().get('landmark-isc-bank');
    if (!camera || !bank) return false;

    this.cancelCameraRoam();
    const fromPosition = camera.position.clone();
    const fromTarget = camera.getTarget().clone();
    const toTarget = bank.position.add(new BABYLON.Vector3(0, 9, 0));
    const toPosition = bank.position.add(new BABYLON.Vector3(68, 52, -68));
    const safeDuration = Math.max(500, durationMs);
    let elapsed = 0;
    this.cameraRoamOnComplete = onComplete ?? null;
    this.cameraRoamObserver = scene.onBeforeRenderObservable.add(() => {
      elapsed += Math.max(0, scene.getEngine().getDeltaTime());
      const linear = Math.min(1, elapsed / safeDuration);
      const eased = linear < 0.5 ? 4 * linear * linear * linear : 1 - Math.pow(-2 * linear + 2, 3) / 2;
      camera.position = BABYLON.Vector3.Lerp(fromPosition, toPosition, eased);
      camera.setTarget(BABYLON.Vector3.Lerp(fromTarget, toTarget, eased));
      if (linear >= 1) {
        const complete = this.cameraRoamOnComplete;
        this.clearCameraRoam();
        complete?.();
      }
    });
    return true;
  }

  /** 取消当前金融区镜头漫游并保持取消瞬间的相机视角。 */
  public cancelCameraRoam(): void {
    if (this.cameraRoamObserver) {
      this.engine.getScene().onBeforeRenderObservable.remove(this.cameraRoamObserver);
    }
    this.cameraRoamObserver = null;
    this.cameraRoamOnComplete = null;
  }

  private clearCameraRoam(): void {
    if (this.cameraRoamObserver) {
      this.engine.getScene().onBeforeRenderObservable.remove(this.cameraRoamObserver);
    }
    this.cameraRoamObserver = null;
    this.cameraRoamOnComplete = null;
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    this.cancelCameraRoam();
    this.buildingManager.clear();
    this.vegetationManager.clear();

    if (this.businessDataManager) {
      this.businessDataManager.clear();
    }

    if (this.landmarkVfxManager) {
      this.landmarkVfxManager.dispose();
    }

    if (this.landmarkManager) {
      this.landmarkManager.clear();
    }

    if (this.npcWorldManager) {
      this.npcWorldManager.dispose();
    }

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

  public lightRouteNode(nodeId: string): RouteLightingNode | null {
    return this.routeLightingManager?.lightNode(nodeId) ?? null;
  }

  public interactWithRouteNode(nodeId: string): boolean {
    return this.routeLightingManager?.selectNode(nodeId) ?? false;
  }

  public getBusinessDataPoints(): BusinessDataPoint[] {
    return this.businessDataManager?.getPoints() ?? [];
  }

  public collectBusinessDataPoint(pointId: string): BusinessDataPoint | null {
    return this.businessDataManager?.collectPoint(pointId) ?? null;
  }

  public selectBusinessDataPoint(pointId: string): boolean {
    return this.businessDataManager?.selectPoint(pointId) ?? false;
  }

  /** 获取当前地图中的基础 NPC 状态，供 HUD/调试和后续互动系统使用。 */
  public getNPCWorldManager(): NPCWorldManager | null {
    return this.npcWorldManager;
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
