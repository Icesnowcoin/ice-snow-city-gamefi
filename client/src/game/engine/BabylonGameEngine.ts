import * as BABYLON from '@babylonjs/core';
import { ensureGltfLoader } from '../loaders/ensureGltfLoader';
import { RoamingCameraController } from '../camera/RoamingCameraController';
import { IceSnowRenderingProfile } from '../rendering/IceSnowRenderingProfile';
import { getPreferredRenderQuality } from '../rendering/renderQuality';

/**
 * Babylon.js 3D 游戏引擎
 * 负责场景管理、相机控制、光照、物理等核心功能
 */
export interface LoadModelProgress {
  loaded: number;
  total: number;
  lengthComputable: boolean;
  percent: number | null;
}

export interface LoadModelOptions {
  onProgress?: (progress: LoadModelProgress) => void;
  signal?: AbortSignal;
}

export class BabylonGameEngine {
  private engine: BABYLON.Engine | null = null;
  private scene: BABYLON.Scene | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private camera: BABYLON.UniversalCamera | null = null;
  private roamingCamera: RoamingCameraController | null = null;
  private iceSnowRendering: IceSnowRenderingProfile | null = null;
  private isRunning = false;

  /**
   * 初始化游戏引擎
   * @param canvasElement - 游戏画布元素
   */
  public async initialize(canvasElement: HTMLCanvasElement): Promise<void> {
    this.canvas = canvasElement;

    // 创建 Babylon.js 引擎
    this.engine = new BABYLON.Engine(this.canvas, true, {
      antialias: true,
      preserveDrawingBuffer: true,
      stencil: true,
    });

    // 创建场景
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.collisionsEnabled = true;

    // 设置相机
    this.setupCamera();

    // 设置光照
    this.setupLighting();

    // 设置天空盒
    this.setupSkybox();

    // 处理窗口调整大小
    window.addEventListener('resize', () => this.handleWindowResize());

    // 启动渲染循环
    this.startRenderLoop();
  }

  /**
   * 设置相机
   */
  private setupCamera(): void {
    if (!this.scene || !this.canvas) return;

    // 创建通用相机
    this.camera = new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(42, 34, -58));
    this.camera.setTarget(new BABYLON.Vector3(0, 12, 0));
    this.camera.attachControl(this.canvas, true);

    // 相机速度和惯性
    this.camera.speed = 0.45;
    this.camera.angularSensibility = 1000;
    this.camera.inertia = 0.7;

    // 相机碰撞检测与移动端椭球体
    this.camera.checkCollisions = true;
    this.camera.ellipsoid = new BABYLON.Vector3(1.2, 2, 1.2);
    this.camera.ellipsoidOffset = new BABYLON.Vector3(0, 1, 0);

    // 设置相机范围
    this.camera.minZ = 0.1;
    this.camera.maxZ = 10000;

    // 启用拖拽、触控和 WASD/方向键漫游，并在场景边界内限制相机。
    this.roamingCamera = new RoamingCameraController(this.scene, this.camera, {
      minHeight: 4,
      maxHeight: 140,
      minX: -220,
      maxX: 220,
      minZ: -220,
      maxZ: 220,
      speed: 0.45,
    });
    this.roamingCamera.enable();
  }

  /**
   * 设置光照
   */
  private setupLighting(): void {
    if (!this.scene) return;
    this.iceSnowRendering = new IceSnowRenderingProfile(this.scene, { quality: getPreferredRenderQuality() });
    this.iceSnowRendering.setupLighting();
  }

  /** 应用画质菜单选择，并重新配置现有场景的光照、阴影和 PBR 雪层。 */
  public setRenderQuality(quality: 'low' | 'medium' | 'high'): void {
    if (!this.scene) return;
    this.iceSnowRendering?.dispose();
    this.iceSnowRendering = new IceSnowRenderingProfile(this.scene, { quality });
    this.iceSnowRendering.setupLighting();
    this.iceSnowRendering.applyToSceneMeshes();
  }

  public getRenderQuality(): 'low' | 'medium' | 'high' {
    return this.iceSnowRendering?.getQuality() ?? getPreferredRenderQuality();
  }

  /**
   * 设置天空盒
   */
  private setupSkybox(): void {
    if (!this.scene) return;

    // 创建天空盒材质
    const skyboxMaterial = new BABYLON.StandardMaterial('skyBox', this.scene);
    skyboxMaterial.emissiveColor = new BABYLON.Color3(0.18, 0.28, 0.5);
    skyboxMaterial.backFaceCulling = false;

    // 创建天空盒网格
    const skybox = BABYLON.MeshBuilder.CreateBox('skyBox', { size: 5000 }, this.scene);
    skybox.material = skyboxMaterial;
  }

  /**
   * 创建地面
   * @param width - 地面宽度
   * @param depth - 地面深度
   */
  public createGround(width: number = 1000, depth: number = 1000): BABYLON.Mesh {
    if (!this.scene) throw new Error('Scene not initialized');

    const ground = BABYLON.MeshBuilder.CreateGround('ground', {
      width,
      height: depth,
      subdivisions: 50,
    }, this.scene);

    // 地面材质
    const groundMaterial = new BABYLON.PBRMaterial('groundMat', this.scene);
    groundMaterial.albedoColor = new BABYLON.Color3(0.32, 0.46, 0.58);
    groundMaterial.metallic = 0.02;
    groundMaterial.roughness = 0.82;
    ground.material = groundMaterial;

    return ground;
  }

  /**
   * 创建简单的立方体建筑
   * @param name - 建筑名称
   * @param position - 位置
   * @param size - 大小
   * @param color - 颜色
   */
  public createBuilding(
    name: string,
    position: BABYLON.Vector3,
    size: { width: number; height: number; depth: number },
    color: BABYLON.Color3
  ): BABYLON.Mesh {
    if (!this.scene) throw new Error('Scene not initialized');

    const building = BABYLON.MeshBuilder.CreateBox(name, {
      width: size.width,
      height: size.height,
      depth: size.depth,
    }, this.scene);

    building.position = position;

    // 建筑材质
    const material = new BABYLON.PBRMaterial(`${name}Mat`, this.scene);
    material.albedoColor = color;
    material.metallic = 0.08;
    material.roughness = 0.52;
    building.material = material;

    return building;
  }

  /**
   * 创建圆柱体（用于树木等）
   * @param name - 对象名称
   * @param position - 位置
   * @param diameter - 直径
   * @param height - 高度
   * @param color - 颜色
   */
  public createCylinder(
    name: string,
    position: BABYLON.Vector3,
    diameter: number,
    height: number,
    color: BABYLON.Color3
  ): BABYLON.Mesh {
    if (!this.scene) throw new Error('Scene not initialized');

    const cylinder = BABYLON.MeshBuilder.CreateCylinder(name, {
      diameter,
      height,
      tessellation: 16,
    }, this.scene);

    cylinder.position = position;

    // 材质
    const material = new BABYLON.PBRMaterial(`${name}Mat`, this.scene);
    material.albedoColor = color;
    material.metallic = 0.04;
    material.roughness = 0.62;
    cylinder.material = material;

    return cylinder;
  }

  /**
   * 创建球体
   * @param name - 对象名称
   * @param position - 位置
   * @param diameter - 直径
   * @param color - 颜色
   */
  public createSphere(
    name: string,
    position: BABYLON.Vector3,
    diameter: number,
    color: BABYLON.Color3
  ): BABYLON.Mesh {
    if (!this.scene) throw new Error('Scene not initialized');

    const sphere = BABYLON.MeshBuilder.CreateSphere(name, {
      diameter,
      segments: 16,
    }, this.scene);

    sphere.position = position;

    // 材质
    const material = new BABYLON.PBRMaterial(`${name}Mat`, this.scene);
    material.albedoColor = color;
    material.metallic = 0.04;
    material.roughness = 0.58;
    sphere.material = material;

    return sphere;
  }

  /**
   * 加载 glTF 模型
   * @param url - 模型 URL
   * @param name - 模型名称
   * @param position - 位置
   */
  public async loadModel(
    url: string,
    name: string,
    position: BABYLON.Vector3,
    options: LoadModelOptions = {},
  ): Promise<BABYLON.AbstractMesh> {
    if (!this.scene) throw new Error('Scene not initialized');
    if (options.signal?.aborted) throw new DOMException('Model loading was aborted', 'AbortError');

    // The procedural map does not need the GLTF loader. Load it only when a
    // real GLB/GLTF asset is requested so the first map chunk stays smaller.
    await ensureGltfLoader();

    const result = await BABYLON.SceneLoader.ImportMeshAsync(
      '',
      '',
      url,
      this.scene,
      (event) => {
        const total = event.lengthComputable ? event.total : 0;
        const loaded = event.loaded;
        options.onProgress?.({
          loaded,
          total,
          lengthComputable: event.lengthComputable,
          percent: event.lengthComputable && total > 0 ? Math.min(100, (loaded / total) * 100) : null,
        });
      },
    );

    if (options.signal?.aborted) {
      result.meshes.forEach((mesh) => mesh.dispose(false, true));
      throw new DOMException('Model loading was aborted', 'AbortError');
    }

    const mesh = result.meshes.find((candidate) => !candidate.parent) ?? result.meshes[0];
    if (!mesh) throw new Error(`No renderable meshes found in model: ${url}`);

    mesh.name = name;
    mesh.position = position.clone();
    options.onProgress?.({ loaded: 1, total: 1, lengthComputable: true, percent: 100 });
    return mesh;
  }

  /** Dispose a loaded GLB root and its owned materials/textures. */
  public disposeLoadedModel(mesh: BABYLON.AbstractMesh): void {
    mesh.dispose(false, true);
  }

  /**
   * 设置相机位置和目标
   * @param position - 相机位置
   * @param target - 相机目标
   */
  public setCameraView(position: BABYLON.Vector3, target: BABYLON.Vector3): void {
    if (!this.camera) return;

    this.camera.position = position;
    this.camera.setTarget(target);
  }

  /**
   * 将相机切换为 2.5D 等距视角；默认自由相机行为保持不变。
   */
  public setIsometricView(center: BABYLON.Vector3 = BABYLON.Vector3.Zero(), distance = 42): void {
    const safeDistance = Math.max(1, distance);
    this.setCameraView(
      new BABYLON.Vector3(center.x + safeDistance, center.y + safeDistance, center.z - safeDistance),
      center.clone(),
    );
  }

  /** Restore the default city-core inspection view after free roaming. */
  public resetRoamingCamera(): void {
    this.roamingCamera?.reset();
  }

  /** Expose concise controls for the in-game help HUD. */
  public getRoamingCameraInstructions(): string[] {
    return this.roamingCamera?.getInstructions() ?? [];
  }

  /**
   * 获取场景
   */
  public getScene(): BABYLON.Scene {
    if (!this.scene) throw new Error('Scene not initialized');
    return this.scene;
  }

  /**
   * 获取相机
   */
  public getCamera(): BABYLON.UniversalCamera {
    if (!this.camera) throw new Error('Camera not initialized');
    return this.camera;
  }

  /**
   * 获取引擎
   */
  public getEngine(): BABYLON.Engine {
    if (!this.engine) throw new Error('Engine not initialized');
    return this.engine;
  }

  /** Apply the winter material profile to meshes created after engine startup. */
  public applyIceSnowRendering(): void {
    this.iceSnowRendering?.applyToSceneMeshes();
  }

  /**
   * 启动渲染循环
   */
  private startRenderLoop(): void {
    if (!this.engine || !this.scene) return;

    this.isRunning = true;

    this.engine.runRenderLoop(() => {
      this.scene?.render();
    });
  }

  /**
   * 停止渲染循环
   */
  public stopRenderLoop(): void {
    this.isRunning = false;
    if (this.engine) {
      this.engine.stopRenderLoop();
    }
  }

  /**
   * 处理窗口调整大小
   */
  private handleWindowResize(): void {
    if (this.engine) {
      this.engine.resize();
    }
  }

  /**
   * 销毁引擎
   */
  public dispose(): void {
    this.stopRenderLoop();
    this.roamingCamera?.dispose();
    this.roamingCamera = null;
    this.iceSnowRendering?.dispose();
    this.iceSnowRendering = null;
    if (this.scene) {
      this.scene.dispose();
    }
    if (this.engine) {
      this.engine.dispose();
    }
    this.scene = null;
    this.engine = null;
    this.camera = null;
  }
}
