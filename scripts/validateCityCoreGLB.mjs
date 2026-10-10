#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const filePath = path.resolve(process.argv[2] ?? "/home/ubuntu/webdev-static-assets/ice-snow-city/landmark-city-core/v001/city-core.glb");
const bytes = fs.readFileSync(filePath);
const fail = (message) => { throw new Error(message); };
if (bytes.subarray(0, 4).toString() !== "glTF") fail("invalid GLB magic");
if (bytes.readUInt32LE(4) !== 2) fail("glTF version must be 2");
if (bytes.readUInt32LE(8) !== bytes.length) fail("GLB length header does not match file size");
const jsonLength = bytes.readUInt32LE(12);
if (bytes.readUInt32LE(16) !== 0x4e4f534a) fail("first chunk must be JSON");
const json = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString("utf8"));
const names = new Set((json.nodes ?? []).map((node) => node.name));
const required = [
  "landmark_city_core_root", "landmark_city_core_lod0", "landmark_city_core_lod1", "landmark_city_core_lod2",
  "landmark_city_core_collision", "landmark_city_core_interaction", "landmark_city_core_fx", "fx_energy_ring",
  "fx_warm_lights", "landmark_city_core_socket", "socket_quest_marker", "socket_upgrade_effect",
];
for (const name of required) if (!names.has(name)) fail(`missing node ${name}`);
if (json.extras?.assetId !== "landmark-city-core") fail("assetId mismatch");
if (json.extras?.gameplayOnly !== true || json.extras?.nft !== false) fail("gameplay-only policy metadata missing");
if (!Array.isArray(json.materials) || json.materials.length !== 4) fail("expected four PBR material slots");
for (const material of json.materials) if (!material.pbrMetallicRoughness) fail(`missing PBR data for ${material.name}`);
const result = {
  path: filePath,
  sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
  bytes: bytes.length,
  gltfVersion: json.asset?.version,
  nodeCount: json.nodes?.length ?? 0,
  materialCount: json.materials?.length ?? 0,
  lodNodes: required.filter((name) => name.includes("_lod")),
  gameplayOnly: json.extras.gameplayOnly,
  nft: json.extras.nft,
};
console.log(JSON.stringify(result, null, 2));
