import * as THREE from "three";
import { PlayerCharacterModel } from "@/game/models/PlayerCharacterModel";

export type CharacterAssetValidationStatus =
  | "prototype-needs-upgrade"
  | "glb-ready"
  | "glb-verified";

export type PlayerCharacterAssetValidationReport = {
  status: CharacterAssetValidationStatus;
  modelPath: string;
  triangleCount: number;
  boneCount: number;
  meshCount: number;
  skinnedMeshCount: number;
  hasSkeleton: boolean;
  hasValidBoneHierarchy: boolean;
  hasAnimationEntryPoint: boolean;
  meetsPolygonTarget: boolean;
  meetsBoneTarget: boolean;
  notes: string[];
};

export const PLAYER_CHARACTER_ASSET_TARGET = {
  modelPath: "/manus-storage/characters/player/player_character_v1.glb",
  minTriangles: 15000,
  maxTriangles: 25000,
  minBones: 60,
  maxBones: 80,
};

function countTriangles(geometry: THREE.BufferGeometry): number {
  const index = geometry.getIndex();
  if (index) return Math.floor(index.count / 3);
  const position = geometry.getAttribute("position");
  return position ? Math.floor(position.count / 3) : 0;
}

function hasValidBoneHierarchy(bones: THREE.Bone[]): boolean {
  if (bones.length === 0) return false;
  const boneSet = new Set(bones);
  const rootBones = bones.filter(bone => !(bone.parent instanceof THREE.Bone));
  if (rootBones.length !== 1) return false;

  return bones.every(bone => {
    if (!(bone.parent instanceof THREE.Bone)) return bone === rootBones[0];
    return boneSet.has(bone.parent);
  });
}

export function validatePlayerCharacterModel(
  model: PlayerCharacterModel
): PlayerCharacterAssetValidationReport {
  const scene = model.getScene();
  const bones = model.getBones();
  const skeleton = model.getSkeleton();
  let triangleCount = 0;
  let meshCount = 0;
  let skinnedMeshCount = 0;

  scene.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    meshCount += 1;
    triangleCount += countTriangles(object.geometry);
    if (object instanceof THREE.SkinnedMesh) skinnedMeshCount += 1;
  });

  const meetsPolygonTarget =
    triangleCount >= PLAYER_CHARACTER_ASSET_TARGET.minTriangles &&
    triangleCount <= PLAYER_CHARACTER_ASSET_TARGET.maxTriangles;
  const meetsBoneTarget =
    bones.length >= PLAYER_CHARACTER_ASSET_TARGET.minBones &&
    bones.length <= PLAYER_CHARACTER_ASSET_TARGET.maxBones;
  const hasValidHierarchy = hasValidBoneHierarchy(bones);
  const hasAnimationEntryPoint = typeof model.playIdleAnimation === "function";
  const hasSkeleton = Boolean(
    skeleton && skeleton.bones.length === bones.length
  );
  const isReady =
    meetsPolygonTarget &&
    meetsBoneTarget &&
    hasSkeleton &&
    hasValidHierarchy &&
    hasAnimationEntryPoint;

  const notes: string[] = [];
  if (!meetsPolygonTarget) {
    notes.push(
      `原型网格三角面数为 ${triangleCount}，目标范围为 ${PLAYER_CHARACTER_ASSET_TARGET.minTriangles}-${PLAYER_CHARACTER_ASSET_TARGET.maxTriangles}。`
    );
  }
  if (!meetsBoneTarget) {
    notes.push(
      `原型骨骼数为 ${bones.length}，目标范围为 ${PLAYER_CHARACTER_ASSET_TARGET.minBones}-${PLAYER_CHARACTER_ASSET_TARGET.maxBones}。`
    );
  }
  if (skinnedMeshCount === 0) {
    notes.push(
      "当前原型网格尚未绑定到 SkinnedMesh，不能宣称 GLB 蒙皮导出已验证。"
    );
  }
  if (!hasValidHierarchy) {
    notes.push("骨骼层级存在不在骨骼集合内的父节点，需要在导出前修复。");
  }
  if (isReady && skinnedMeshCount > 0) {
    notes.push(
      "模型满足当前角色资产验收门槛，可进入 GLB 导出与真实文件加载验证。"
    );
  }

  return {
    status:
      isReady && skinnedMeshCount > 0 ? "glb-ready" : "prototype-needs-upgrade",
    modelPath: PLAYER_CHARACTER_ASSET_TARGET.modelPath,
    triangleCount,
    boneCount: bones.length,
    meshCount,
    skinnedMeshCount,
    hasSkeleton,
    hasValidBoneHierarchy: hasValidHierarchy,
    hasAnimationEntryPoint,
    meetsPolygonTarget,
    meetsBoneTarget,
    notes,
  };
}
