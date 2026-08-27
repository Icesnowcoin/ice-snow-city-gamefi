import * as THREE from "three";
import { GLTFLoader, GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { PlayerCharacterModel } from "@/game/models/PlayerCharacterModel";
import { PLAYER_CHARACTER_ASSET_TARGET } from "./playerCharacterAssetValidation";

export type HighFidelityLoadResult = {
  success: boolean;
  model: THREE.Object3D | null;
  animations: THREE.AnimationClip[];
  source: "high-fidelity-glb" | "programmatic-prototype-fallback";
  error?: string;
  metrics?: {
    triangleCount: number;
    boneCount: number;
    skinnedMeshCount: number;
    animationCount: number;
    hasPbrMaterials: boolean;
  };
};

/**
 * 校验高保真 GLB 资产是否符合 Ice Snow City 的美术规范
 */
export function validateHighFidelityGlb(gltf: GLTF): {
  isValid: boolean;
  triangleCount: number;
  boneCount: number;
  skinnedMeshCount: number;
  animationCount: number;
  hasPbrMaterials: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  let triangleCount = 0;
  let skinnedMeshCount = 0;
  let hasPbrMaterials = true;
  const bonesSet = new Set<THREE.Bone>();

  gltf.scene.traverse(object => {
    if (object instanceof THREE.SkinnedMesh) {
      skinnedMeshCount += 1;
      if (object.geometry) {
        const index = object.geometry.getIndex();
        if (index) {
          triangleCount += Math.floor(index.count / 3);
        } else {
          const posAttr = object.geometry.getAttribute("position");
          if (posAttr) {
            triangleCount += Math.floor(posAttr.count / 3);
          }
        }
      }
      if (object.material) {
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        for (const mat of materials) {
          if (
            !(
              mat instanceof THREE.MeshStandardMaterial ||
              mat instanceof THREE.MeshPhysicalMaterial
            )
          ) {
            hasPbrMaterials = false;
          }
        }
      }
      if (object.skeleton) {
        object.skeleton.bones.forEach(b => bonesSet.add(b));
      }
    }
  });

  const boneCount = bonesSet.size;
  const animationCount = gltf.animations.length;

  if (
    triangleCount < PLAYER_CHARACTER_ASSET_TARGET.minTriangles ||
    triangleCount > PLAYER_CHARACTER_ASSET_TARGET.maxTriangles
  ) {
    errors.push(
      `三角面数 ${triangleCount} 超出规范范围 [${PLAYER_CHARACTER_ASSET_TARGET.minTriangles}, ${PLAYER_CHARACTER_ASSET_TARGET.maxTriangles}]`
    );
  }

  if (
    boneCount < PLAYER_CHARACTER_ASSET_TARGET.minBones ||
    boneCount > PLAYER_CHARACTER_ASSET_TARGET.maxBones
  ) {
    errors.push(
      `骨骼数 ${boneCount} 超出规范范围 [${PLAYER_CHARACTER_ASSET_TARGET.minBones}, ${PLAYER_CHARACTER_ASSET_TARGET.maxBones}]`
    );
  }

  if (skinnedMeshCount === 0) {
    errors.push("未检测到 SkinnedMesh 蒙皮网格");
  }

  if (!hasPbrMaterials) {
    errors.push(
      "部分材质未使用标准 PBR 材质 (MeshStandardMaterial/MeshPhysicalMaterial)"
    );
  }

  return {
    isValid: errors.length === 0,
    triangleCount,
    boneCount,
    skinnedMeshCount,
    animationCount,
    hasPbrMaterials,
    errors,
  };
}

/**
 * 异步加载高保真 GLB 角色资产，若加载失败或验证不通过则自动降级为程序化原型
 */
export async function loadHighFidelityCharacterWithFallback(
  glbUrl: string = PLAYER_CHARACTER_ASSET_TARGET.modelPath,
  onProgress?: (progress: {
    loaded: number;
    total: number;
    percent: number;
  }) => void
): Promise<HighFidelityLoadResult> {
  const loader = new GLTFLoader();

  try {
    const gltf = await new Promise<GLTF>((resolve, reject) => {
      loader.load(
        glbUrl,
        data => resolve(data),
        event => {
          if (onProgress) {
            const loaded = event.loaded;
            const total =
              event.total > 0 ? event.total : Math.max(loaded, 1024 * 1024);
            const percent = Math.min(Math.round((loaded / total) * 100), 100);
            onProgress({ loaded, total, percent });
          }
        },
        err => reject(err)
      );
    });

    const validation = validateHighFidelityGlb(gltf);
    if (!validation.isValid) {
      console.warn(
        "[HighFidelityLoader] GLB 资产未完全通过高保真规范校验，已回退为程序化原型:",
        validation.errors
      );
      return {
        success: false,
        model: null,
        animations: [],
        source: "programmatic-prototype-fallback",
        error: validation.errors.join("; "),
      };
    }

    return {
      success: true,
      model: gltf.scene,
      animations: gltf.animations,
      source: "high-fidelity-glb",
      metrics: {
        triangleCount: validation.triangleCount,
        boneCount: validation.boneCount,
        skinnedMeshCount: validation.skinnedMeshCount,
        animationCount: validation.animationCount,
        hasPbrMaterials: validation.hasPbrMaterials,
      },
    };
  } catch (err) {
    return {
      success: false,
      model: null,
      animations: [],
      source: "programmatic-prototype-fallback",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
