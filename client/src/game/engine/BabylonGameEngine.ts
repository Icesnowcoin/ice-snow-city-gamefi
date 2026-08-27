import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import '@babylonjs/materials';

/**
 * Babylon.js 3D 游戏引擎
 * 负责场景管理、相机控制、光照、物理等核心功能
 */
export class BabylonGameEngine {
  private engine: BABYLON.Engine | null = null;
  private scene: BABYLON.Scene | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private camera: BABYLON.UniversalCamera | null = null;
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
    this.camera = new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(0, 50, -100));
    this.camera.attachControl(this.canvas, true);

    // 相机速度和惯性
    this.camera.speed = 0;
    this.camera.angularSensibility = 1000;
    this.camera.inertia = 0.7;

    // 相机碰撞检测
    this.camera.checkCollisions = true;
    (this.camera as any).collisionRadius = new BABYLON.Vector3(2, 2, 2);

    // 设置相机范围
    this.camera.minZ = 0.1;
    this.camera.maxZ = 10000;

    // 设置视角
    this.camera.attachControl(this.canvas, true);
  }

  /**
   * 设置光照
   */
  private setupLighting(): void {
    if (!this.scene) return;

    // 环境光
    const ambientLight = new BABYLON.HemisphericLight('ambient', new BABYLON.Vector3(0, 1, 0), this.scene);
    ambientLight.intensity = 0.6;

    // 主光源（太阳光）
    const sunLight = new BABYLON.DirectionalLight('sun', new BABYLON.Vector3(-1, 1, -1), this.scene);
    sunLight.intensity = 0.8;
    sunLight.position = new BABYLON.Vector3(100, 100, -100);

    // 阴影贴图
    const shadowGenerator = new BABYLON.ShadowGenerator(2048, sunLight);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurKernel = 32;

    // 点光源（用于建筑和环境）
    const pointLight = new BABYLON.PointLight('point', new BABYLON.Vector3(0, 20, 0), this.scene);
    pointLight.intensity = 0.3;
    pointLight.range = 100;
  }

  /**
   * 设置天空盒
   */
  private setupSkybox(): void {
    if (!this.scene) return;

    // 创建天空盒材质
    const skyboxMaterial = new BABYLON.StandardMaterial('skyBox', this.scene);
    skyboxMaterial.emissiveColor = new BABYLON.Color3(0.8, 0.9, 1);
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
    const groundMaterial = new BABYLON.StandardMaterial('groundMat', this.scene);
    (groundMaterial as any).diffuse = new BABYLON.Color3(0.4, 0.6, 0.3);
    (groundMaterial as any).specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
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
    const material = new BABYLON.StandardMaterial(`${name}Mat`, this.scene);
    (material as any).diffuse = color;
    (material as any).specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
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
    const material = new BABYLON.StandardMaterial(`${name}Mat`, this.scene);
    (material as any).diffuse = color;
    (material as any).specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
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
    const material = new BABYLON.StandardMaterial(`${name}Mat`, this.scene);
    (material as any).diffuse = color;
    (material as any).specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
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
    position: BABYLON.Vector3
  ): Promise<BABYLON.AbstractMesh> {
    if (!this.scene) throw new Error('Scene not initialized');

    const result = await BABYLON.SceneLoader.ImportMeshAsync('', '', url, this.scene);
    const mesh = result.meshes[0];
    mesh.name = name;
    mesh.position = position;

    return mesh;
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
