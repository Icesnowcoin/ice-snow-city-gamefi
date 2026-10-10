import { readFile } from "node:fs/promises";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const inputPath =
  "/home/ubuntu/webdev-static-assets/characters/player/player_character_prototype_v0.glb";
const file = await readFile(inputPath);
const arrayBuffer = file.buffer.slice(
  file.byteOffset,
  file.byteOffset + file.byteLength
);

const loader = new GLTFLoader();
const gltf = await new Promise((resolve, reject) => {
  loader.parse(arrayBuffer, "", resolve, reject);
});

let meshCount = 0;
let skinnedMeshCount = 0;
let boneCount = 0;
gltf.scene.traverse(object => {
  if (object.isMesh) meshCount += 1;
  if (object.isSkinnedMesh) skinnedMeshCount += 1;
  if (object.isBone) boneCount += 1;
});

const report = {
  inputPath,
  sceneName: gltf.scene.name,
  meshCount,
  skinnedMeshCount,
  boneCount,
  animationCount: gltf.animations.length,
  assetVersion: gltf.parser.json.asset?.version ?? "unknown",
  prototypeOnly: inputPath.includes("prototype"),
};

if (report.assetVersion !== "2.0") {
  throw new Error(`Unexpected glTF asset version: ${report.assetVersion}`);
}
if (report.meshCount === 0) {
  throw new Error("The GLB contains no mesh nodes");
}

console.log(JSON.stringify(report, null, 2));
