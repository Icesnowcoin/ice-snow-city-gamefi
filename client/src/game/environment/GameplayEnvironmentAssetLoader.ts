import * as BABYLON from '@babylonjs/core';
import { ensureGltfLoader } from '../loaders/ensureGltfLoader';

export class GameplayEnvironmentAssetLoader {
  public static async loadGameplayAsset(
    scene: BABYLON.Scene,
    url: string,
    position: BABYLON.Vector3,
    assetId: string,
  ): Promise<BABYLON.TransformNode | null> {
    try {
      await ensureGltfLoader();
      const result = await BABYLON.SceneLoader.ImportMeshAsync('', '', url, scene);
      const root = new BABYLON.TransformNode(`${assetId}-instance`, scene);
      root.position.copyFrom(position);
      root.metadata = { assetId, gameplayOnly: true, nft: false, source: 'canonical-gameplay-glb' };
      result.meshes.forEach((mesh) => {
        if (!mesh.parent) mesh.parent = root;
        mesh.metadata = { ...(mesh.metadata ?? {}), assetId, gameplayOnly: true, nft: false };
        mesh.isPickable = mesh.name.includes('street_lamp') || mesh.name.includes('interaction') || mesh.name.includes('harvest');
      });
      const lod0 = result.meshes.find((mesh) => mesh.name.includes('lod0'));
      const lod1 = result.meshes.find((mesh) => mesh.name.includes('lod1'));
      const lod2 = result.meshes.find((mesh) => mesh.name.includes('lod2'));
      lod0?.setEnabled(true);
      lod1?.setEnabled(false);
      lod2?.setEnabled(false);
      return root;
    } catch (error) {
      console.warn(`[GameplayEnvironmentAssetLoader] ${assetId} unavailable; procedural fallback remains active.`, error);
      return null;
    }
  }

  public static loadRoadKit(scene: BABYLON.Scene, url: string, position: BABYLON.Vector3): Promise<BABYLON.TransformNode | null> {
    return this.loadGameplayAsset(scene, url, position, 'environment-road');
  }

  public static loadVegetationKit(scene: BABYLON.Scene, url: string, position: BABYLON.Vector3): Promise<BABYLON.TransformNode | null> {
    return this.loadGameplayAsset(scene, url, position, 'environment-vegetation');
  }
}
