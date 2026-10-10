import * as BABYLON from '@babylonjs/core';

export type ConceptBackdropMode = 'day' | 'night' | 'core';

const CONCEPT_TEXTURES: Record<ConceptBackdropMode, string> = {
  day: '/manus-storage/reference-daylight_841dc8eb.png',
  night: '/manus-storage/reference-night_0510cd30.png',
  core: '/manus-storage/city-core-hero_0b6cd13b.png',
};

export type ConceptBackdropOptions = {
  reducedMotion?: boolean;
  lowQuality?: boolean;
  opacity?: number;
};

/**
 * Mobile-first 2.5D background made from supplied concept references.
 * The image is kept behind the playable map, follows the camera with a
 * restrained parallax offset, and never participates in picking/collisions.
 */
export class ConceptBackdropLayer {
  private readonly scene: BABYLON.Scene;
  private readonly camera: BABYLON.Camera;
  private readonly root = new BABYLON.TransformNode('concept-backdrop-root');
  private readonly backgroundPlane: BABYLON.Mesh;
  private readonly hazePlane: BABYLON.Mesh;
  private readonly backgroundMaterial: BABYLON.StandardMaterial;
  private readonly hazeMaterial: BABYLON.StandardMaterial;
  private readonly observer: BABYLON.Observer<BABYLON.Scene>;
  private readonly options: Required<ConceptBackdropOptions>;
  private mode: ConceptBackdropMode = 'night';
  private targetOpacity: number;
  private currentOpacity: number;

  constructor(scene: BABYLON.Scene, camera: BABYLON.Camera, options: ConceptBackdropOptions = {}) {
    this.scene = scene;
    this.camera = camera;
    this.options = {
      reducedMotion: options.reducedMotion ?? false,
      lowQuality: options.lowQuality ?? false,
      opacity: options.opacity ?? 0.28,
    };
    this.targetOpacity = this.options.opacity;
    this.currentOpacity = this.options.opacity;

    this.backgroundMaterial = new BABYLON.StandardMaterial('concept-backdrop-material', scene);
    this.backgroundMaterial.backFaceCulling = false;
    this.backgroundMaterial.disableLighting = true;
    this.backgroundMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
    this.backgroundMaterial.alpha = this.currentOpacity;
    this.backgroundMaterial.useAlphaFromDiffuseTexture = true;
    this.backgroundMaterial.diffuseTexture = this.createTexture(this.mode);

    this.hazeMaterial = new BABYLON.StandardMaterial('concept-backdrop-haze-material', scene);
    this.hazeMaterial.backFaceCulling = false;
    this.hazeMaterial.disableLighting = true;
    this.hazeMaterial.emissiveColor = new BABYLON.Color3(0.08, 0.22, 0.36);
    this.hazeMaterial.alpha = 0.13;

    this.backgroundPlane = BABYLON.MeshBuilder.CreatePlane('concept-backdrop-image', {
      width: 520,
      height: 292.5,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE,
    }, scene);
    this.backgroundPlane.material = this.backgroundMaterial;
    this.backgroundPlane.parent = this.root;
    this.backgroundPlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    this.backgroundPlane.isPickable = false;
    this.backgroundPlane.checkCollisions = false;
    this.backgroundPlane.renderingGroupId = 0;

    this.hazePlane = BABYLON.MeshBuilder.CreatePlane('concept-backdrop-haze', {
      width: 560,
      height: 315,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE,
    }, scene);
    this.hazePlane.material = this.hazeMaterial;
    this.hazePlane.parent = this.root;
    this.hazePlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    this.hazePlane.isPickable = false;
    this.hazePlane.checkCollisions = false;
    this.hazePlane.renderingGroupId = 0;

    this.observer = scene.onBeforeRenderObservable.add(() => this.update());
    this.update();
  }

  private createTexture(mode: ConceptBackdropMode): BABYLON.Texture {
    const texture = new BABYLON.Texture(CONCEPT_TEXTURES[mode], this.scene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
    texture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
    texture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
    if (this.options.lowQuality) texture.updateSamplingMode(BABYLON.Texture.BILINEAR_SAMPLINGMODE);
    return texture;
  }

  public setMode(mode: ConceptBackdropMode): void {
    if (mode === this.mode) return;
    this.mode = mode;
    const previousTexture = this.backgroundMaterial.diffuseTexture;
    this.backgroundMaterial.diffuseTexture = this.createTexture(mode);
    previousTexture?.dispose();
    this.targetOpacity = this.options.opacity;
    if (this.options.reducedMotion) this.currentOpacity = this.targetOpacity;
    this.update();
  }

  public getMode(): ConceptBackdropMode {
    return this.mode;
  }

  public setVisible(visible: boolean): void {
    this.targetOpacity = visible ? this.options.opacity : 0;
    if (this.options.reducedMotion) this.currentOpacity = this.targetOpacity;
  }

  private update(): void {
    const cameraPosition = this.camera.position;
    const forward = this.camera.getDirection(BABYLON.Axis.Z).normalize();
    const distance = this.options.lowQuality ? 330 : 420;
    const anchor = cameraPosition.add(forward.scale(distance));
    const parallax = this.options.reducedMotion ? 0 : 0.08;

    this.root.position.x = anchor.x + cameraPosition.x * parallax;
    this.root.position.y = anchor.y + 18 + cameraPosition.y * 0.035;
    this.root.position.z = anchor.z;
    const targetCamera = this.camera as BABYLON.TargetCamera;
    this.root.rotationQuaternion = targetCamera.rotationQuaternion?.clone() ?? BABYLON.Quaternion.Identity();

    const delta = this.targetOpacity - this.currentOpacity;
    this.currentOpacity = Math.abs(delta) < 0.004 ? this.targetOpacity : this.currentOpacity + delta * 0.12;
    this.backgroundMaterial.alpha = this.currentOpacity;
    this.hazeMaterial.alpha = this.currentOpacity * 0.42;
  }

  public dispose(): void {
    this.scene.onBeforeRenderObservable.remove(this.observer);
    this.backgroundMaterial.diffuseTexture?.dispose();
    this.backgroundPlane.dispose(false, true);
    this.hazePlane.dispose(false, true);
    this.backgroundMaterial.dispose();
    this.hazeMaterial.dispose();
    this.root.dispose(false, true);
  }
}
