#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
const filePath = path.resolve(process.argv[2] ?? "/home/ubuntu/webdev-static-assets/ice-snow-city/environment/road-kit.glb");
const bytes = fs.readFileSync(filePath);
if (bytes.subarray(0, 4).toString() !== "glTF" || bytes.readUInt32LE(4) !== 2 || bytes.readUInt32LE(8) !== bytes.length) throw new Error("invalid GLB header");
const length = bytes.readUInt32LE(12);
const json = JSON.parse(bytes.subarray(20, 20 + length).toString("utf8"));
const names = new Set((json.nodes ?? []).map((node) => node.name));
for (const name of ["environment_road_kit_root", "environment_road_lod0", "environment_road_lod1", "environment_road_lod2", "environment_street_lamp", "environment_road_collision"]) if (!names.has(name)) throw new Error(`missing node ${name}`);
if (json.extras?.assetId !== "environment-road" || json.extras?.gameplayOnly !== true || json.extras?.nft !== false) throw new Error("gameplay-only metadata missing");
if ((json.materials ?? []).length < 3 || (json.materials ?? []).some((m) => !m.pbrMetallicRoughness)) throw new Error("PBR material slots missing");
console.log(JSON.stringify({ path: filePath, sha256: crypto.createHash("sha256").update(bytes).digest("hex"), bytes: bytes.length, nodeCount: json.nodes.length, materialCount: json.materials.length, gameplayOnly: true, nft: false }, null, 2));
