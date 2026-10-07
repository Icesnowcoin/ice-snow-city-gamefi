import * as BABYLON from '@babylonjs/core';

export type RoamingCameraOptions = {
  minHeight?: number;
  maxHeight?: number;
  minX?: number;
  maxX?: number;
  minZ?: number;
  maxZ?: number;
  speed?: number;
};

const DEFAULT_OPTIONS: Required<RoamingCameraOptions> = {
  minHeight: 4,
  maxHeight: 140,
  minX: -220,
  maxX: 220,
  minZ: -220,
  maxZ: 220,
  speed: 0.45,
};

/**
 * Free-roam controls for the mobile-landscape Babylon scene.
 * UniversalCamera supplies pointer/touch rotation and keyboard movement; this
 * controller adds a safe world boundary and a deterministic reset view.
 */
export class RoamingCameraController {
  private readonly camera: BABYLON.UniversalCamera;
  private readonly options: Required<RoamingCameraOptions>;
  private readonly scene: BABYLON.Scene;
  private observer: BABYLON.Observer<BABYLON.Scene> | null = null;
  private readonly initialPosition: BABYLON.Vector3;
  private readonly initialTarget: BABYLON.Vector3;

  constructor(
    scene: BABYLON.Scene,
    camera: BABYLON.UniversalCamera,
    options: RoamingCameraOptions = {},
  ) {
    this.scene = scene;
    this.camera = camera;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.initialPosition = camera.position.clone();
    this.initialTarget = camera.getTarget().clone();
  }

  public enable(): void {
    this.camera.speed = this.options.speed;
    this.camera.inertia = 0.72;
    this.camera.angularSensibility = 850;
    this.camera.touchAngularSensibility = 4200;
    this.camera.keysUp = [87, 38];
    this.camera.keysDown = [83, 40];
    this.camera.keysLeft = [65, 37];
    this.camera.keysRight = [68, 39];
    this.camera.applyGravity = false;
    this.camera.checkCollisions = true;
    this.camera.ellipsoid = new BABYLON.Vector3(1.2, 2, 1.2);
    this.camera.ellipsoidOffset = new BABYLON.Vector3(0, 1, 0);
    this.camera.minZ = 0.1;
    this.camera.maxZ = 1200;

    if (!this.observer) {
      this.observer = this.scene.onAfterRenderObservable.add(() => this.clampPosition());
    }
  }

  public reset(): void {
    this.camera.position.copyFrom(this.initialPosition);
    this.camera.setTarget(this.initialTarget);
  }

  public getInstructions(): string[] {
    return ['拖拽旋转视角', 'WASD/方向键移动', '触控滑动旋转，双指操作观察'];
  }

  private clampPosition(): void {
    const position = this.camera.position;
    position.x = BABYLON.Scalar.Clamp(position.x, this.options.minX, this.options.maxX);
    position.y = BABYLON.Scalar.Clamp(position.y, this.options.minHeight, this.options.maxHeight);
    position.z = BABYLON.Scalar.Clamp(position.z, this.options.minZ, this.options.maxZ);
  }

  public dispose(): void {
    if (this.observer) {
      this.scene.onAfterRenderObservable.remove(this.observer);
      this.observer = null;
    }
  }
}
