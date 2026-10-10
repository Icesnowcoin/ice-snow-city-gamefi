import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine.js";
import { Scene } from "@babylonjs/core/scene.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { GLTF2Export } from "@babylonjs/serializers";

const OUTPUT_ROOT = process.env.BASELINE_ASSET_OUTPUT ?? "/home/ubuntu/webdev-static-assets/ice-snow-city/procedural-baseline";

const ASSETS = [
  { id: "player-character-baseline", kind: "player", shape: "capsule", color: new Color3(0.12, 0.48, 0.72) },
  { id: "npc-citizen-baseline", kind: "npc", shape: "capsule", color: new Color3(0.66, 0.42, 0.18) },
  { id: "landmark-city-core-baseline", kind: "landmark", shape: "tower", color: new Color3(0.20, 0.75, 0.92) },
  { id: "landmark-bank-baseline", kind: "landmark", shape: "tower", color: new Color3(0.78, 0.63, 0.24) },
  { id: "landmark-commercial-baseline", kind: "landmark", shape: "building", color: new Color3(0.42, 0.30, 0.82) },
  { id: "landmark-production-baseline", kind: "landmark", shape: "building", color: new Color3(0.32, 0.62, 0.48) },
  { id: "environment-road-baseline", kind: "environment", shape: "road", color: new Color3(0.18, 0.22, 0.30) },
  { id: "environment-vegetation-baseline", kind: "environment", shape: "tree", color: new Color3(0.20, 0.58, 0.44) },
];

function createMesh(scene, asset) {
  const root = new MeshBuilder.CreateBox(`ISC_BASELINE_${asset.id}`, { size: 1 }, scene);
  root.metadata = {
    assetId: asset.id,
    assetStatus: "procedural-baseline",
    highFidelityDelivery: "pending-import",
    source: "generated-procedural",
  };

  if (asset.shape === "capsule") {
    root.dispose();
    const capsule = MeshBuilder.CreateCapsule(`ISC_BASELINE_${asset.id}`, { height: 2.1, radius: 0.42 }, scene);
    capsule.position.y = 1.05;
    capsule.metadata = root.metadata;
    return capsule;
  }

  if (asset.shape === "tower") {
    root.scaling = new Vector3(1.3, 3.2, 1.3);
    root.position.y = 1.6;
  } else if (asset.shape === "building") {
    root.scaling = new Vector3(2.4, 1.8, 1.8);
    root.position.y = 0.9;
  } else if (asset.shape === "road") {
    root.scaling = new Vector3(5.5, 0.08, 1.5);
    root.position.y = 0.04;
  } else if (asset.shape === "tree") {
    root.dispose();
    const trunk = MeshBuilder.CreateCylinder(`ISC_BASELINE_${asset.id}_trunk`, { height: 1.2, diameter: 0.28 }, scene);
    const crown = MeshBuilder.CreateSphere(`ISC_BASELINE_${asset.id}_crown`, { diameter: 1.35, segments: 8 }, scene);
    trunk.position.y = 0.6;
    crown.position.y = 1.45;
    const parent = MeshBuilder.CreateBox(`ISC_BASELINE_${asset.id}`, { size: 0.01 }, scene);
    trunk.parent = parent;
    crown.parent = parent;
    parent.metadata = {
      assetId: asset.id,
      assetStatus: "procedural-baseline",
      highFidelityDelivery: "pending-import",
      source: "generated-procedural",
    };
    return parent;
  }

  const material = new StandardMaterial(`ISC_BASELINE_MAT_${asset.id}`, scene);
  material.diffuseColor = asset.color;
  material.specularColor = new Color3(0.18, 0.22, 0.28);
  root.material = material;
  return root;
}

async function exportAsset(asset) {
  const engine = new NullEngine({ renderWidth: 256, renderHeight: 256, textureSize: 256 });
  const scene = new Scene(engine);
  scene.useRightHandedSystem = true;
  const mesh = createMesh(scene, asset);
  if (asset.shape === "tree") {
    const material = new StandardMaterial(`ISC_BASELINE_MAT_${asset.id}`, scene);
    material.diffuseColor = asset.color;
    material.specularColor = new Color3(0.12, 0.16, 0.18);
    mesh.getChildMeshes().forEach((child) => { child.material = material; });
  }
  const gltf = await GLTF2Export.GLBAsync(scene, asset.id, {
    exportWithoutWaitingForScene: true,
    removeNoopRootNodes: false,
  });
  const file = gltf.files[`${asset.id}.glb`];
  if (!(file instanceof Blob)) throw new Error(`Expected Blob output for ${asset.id}`);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const outputPath = path.join(OUTPUT_ROOT, `${asset.id}.glb`);
  await writeFile(outputPath, bytes);
  scene.dispose();
  engine.dispose();
  return { ...asset, outputPath, bytes: bytes.byteLength, status: "procedural-baseline" };
}

await mkdir(OUTPUT_ROOT, { recursive: true });
const results = [];
for (const asset of ASSETS) results.push(await exportAsset(asset));
await writeFile(path.join(OUTPUT_ROOT, "manifest.json"), JSON.stringify({
  generatedAt: new Date().toISOString(),
  source: "generated-procedural",
  status: "procedural-baseline",
  highFidelityDelivery: "pending-import",
  assets: results,
}, null, 2));
console.log(JSON.stringify({ outputRoot: OUTPUT_ROOT, status: "procedural-baseline", assets: results }, null, 2));
