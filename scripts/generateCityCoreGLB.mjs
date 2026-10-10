#!/usr/bin/env node
/**
 * Generate the first Ice Snow City gameplay-ready city-core asset.
 *
 * This is an AI-generated development baseline: it is a real glTF 2.0 binary
 * with named LOD, collision, interaction, FX and socket nodes, but it does
 * not close the external-art or real-device release gates.
 */
import fs from "node:fs";
import path from "node:path";

const output = path.resolve(process.argv[2] ?? "/home/ubuntu/webdev-static-assets/ice-snow-city/landmark-city-core/v001/city-core.glb");

const materials = [
  {
    name: "city_core_struct_pbr",
    pbrMetallicRoughness: { baseColorFactor: [0.055, 0.16, 0.32, 1], metallicFactor: 0.82, roughnessFactor: 0.34 },
  },
  {
    name: "city_core_ice_pbr",
    pbrMetallicRoughness: { baseColorFactor: [0.16, 0.62, 0.94, 0.82], metallicFactor: 0.08, roughnessFactor: 0.22 },
    alphaMode: "BLEND",
    emissiveFactor: [0.02, 0.14, 0.4],
  },
  {
    name: "city_core_snow_pbr",
    pbrMetallicRoughness: { baseColorFactor: [0.88, 0.96, 1, 1], metallicFactor: 0.02, roughnessFactor: 0.88 },
  },
  {
    name: "city_core_fx_warm_lights",
    pbrMetallicRoughness: { baseColorFactor: [1, 0.55, 0.12, 1], metallicFactor: 0.05, roughnessFactor: 0.2 },
    emissiveFactor: [1, 0.22, 0.015],
    extras: { emissiveStrength: 4.2 },
  },
];

const bufferChunks = [];
const bufferViews = [];
const accessors = [];
let byteOffset = 0;

function align4(value) { return (value + 3) & ~3; }
function appendBytes(bytes, target = undefined) {
  const aligned = align4(byteOffset);
  if (aligned > byteOffset) bufferChunks.push(Buffer.alloc(aligned - byteOffset));
  byteOffset = aligned;
  const offset = byteOffset;
  bufferChunks.push(Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength));
  byteOffset += bytes.byteLength;
  const view = { buffer: 0, byteOffset: offset, byteLength: bytes.byteLength };
  if (target) view.target = target;
  const index = bufferViews.push(view) - 1;
  return index;
}

function accessorFor(values, type, componentType, target, min, max) {
  const typed = componentType === 5126 ? new Float32Array(values) : new Uint32Array(values);
  const view = appendBytes(new Uint8Array(typed.buffer), target);
  const count = values.length / ({ SCALAR: 1, VEC2: 2, VEC3: 3 }[type]);
  const accessor = { bufferView: view, componentType, count, type };
  if (min) accessor.min = min;
  if (max) accessor.max = max;
  return accessors.push(accessor) - 1;
}

function range(values, stride) {
  const min = Array(stride).fill(Infinity);
  const max = Array(stride).fill(-Infinity);
  for (let i = 0; i < values.length; i += stride) {
    for (let j = 0; j < stride; j += 1) {
      min[j] = Math.min(min[j], values[i + j]);
      max[j] = Math.max(max[j], values[i + j]);
    }
  }
  return { min, max };
}

function geometry() {
  return { positions: [], normals: [], uvs: [], indices: [] };
}
function pushVertex(g, p, n, uv) {
  g.positions.push(...p); g.normals.push(...n); g.uvs.push(...uv);
  return g.positions.length / 3 - 1;
}
function tri(g, a, b, c) { g.indices.push(a, b, c); }
function quad(g, a, b, c, d) { tri(g, a, b, c); tri(g, a, c, d); }

function addBox(g, center, size, material, bevel = 0) {
  const [cx, cy, cz] = center, [sx, sy, sz] = size;
  const x = sx / 2, y = sy / 2, z = sz / 2;
  const faces = [
    [[-1, 0, 0], [[-x, -y, -z], [-x, -y, z], [-x, y, z], [-x, y, -z]]],
    [[1, 0, 0], [[x, -y, z], [x, -y, -z], [x, y, -z], [x, y, z]]],
    [[0, -1, 0], [[-x, -y, z], [x, -y, z], [x, -y, -z], [-x, -y, -z]]],
    [[0, 1, 0], [[-x, y, -z], [x, y, -z], [x, y, z], [-x, y, z]]],
    [[0, 0, -1], [[x, -y, -z], [-x, -y, -z], [-x, y, -z], [x, y, -z]]],
    [[0, 0, 1], [[-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]]],
  ];
  for (const [normal, corners] of faces) {
    const start = corners.map((p, i) => pushVertex(g, [p[0] + cx, p[1] + cy, p[2] + cz], normal, [[0, 0], [1, 0], [1, 1], [0, 1]][i]));
    quad(g, ...start);
  }
  return material;
}

function addCylinder(g, center, radius, height, segments, material, topRadius = radius) {
  const [cx, cy, cz] = center;
  const bottom = [], top = [];
  for (let i = 0; i < segments; i += 1) {
    const a = i / segments * Math.PI * 2;
    const ca = Math.cos(a), sa = Math.sin(a);
    bottom.push(pushVertex(g, [cx + ca * radius, cy, cz + sa * radius], [ca, 0, sa], [i / segments, 0]));
    top.push(pushVertex(g, [cx + ca * topRadius, cy + height, cz + sa * topRadius], [ca, 0.2, sa], [i / segments, 1]));
  }
  const bottomCenter = pushVertex(g, [cx, cy, cz], [0, -1, 0], [0.5, 0.5]);
  const topCenter = pushVertex(g, [cx, cy + height, cz], [0, 1, 0], [0.5, 0.5]);
  for (let i = 0; i < segments; i += 1) {
    const n = (i + 1) % segments;
    quad(g, bottom[i], bottom[n], top[n], top[i]);
    tri(g, bottomCenter, bottom[n], bottom[i]);
    tri(g, topCenter, top[i], top[n]);
  }
  return material;
}

function addTorus(g, center, major, minor, radialSegments, tubeSegments, material) {
  const [cx, cy, cz] = center;
  const rows = [];
  for (let i = 0; i < radialSegments; i += 1) {
    const a = i / radialSegments * Math.PI * 2;
    const ca = Math.cos(a), sa = Math.sin(a);
    const row = [];
    for (let j = 0; j < tubeSegments; j += 1) {
      const b = j / tubeSegments * Math.PI * 2;
      const cb = Math.cos(b), sb = Math.sin(b);
      const r = major + minor * cb;
      row.push(pushVertex(g, [cx + r * ca, cy + minor * sb, cz + r * sa], [cb * ca, sb, cb * sa], [i / radialSegments, j / tubeSegments]));
    }
    rows.push(row);
  }
  for (let i = 0; i < radialSegments; i += 1) {
    const ni = (i + 1) % radialSegments;
    for (let j = 0; j < tubeSegments; j += 1) {
      const nj = (j + 1) % tubeSegments;
      quad(g, rows[i][j], rows[ni][j], rows[ni][nj], rows[i][nj]);
    }
  }
  return material;
}

function addPylon(g, x, z, material, snowMaterial, detail = true) {
  addBox(g, [x, 1.25, z], [1.25, 2.5, 1.25], material);
  addCylinder(g, [x, 2.5, z], 0.72, 5.6, detail ? 8 : 6, material, 0.34);
  addCylinder(g, [x, 8.1, z], 0.62, 0.7, detail ? 8 : 6, snowMaterial, 0.22);
}

function addCityCoreLOD(level) {
  const g = geometry();
  const detailed = level === 0;
  const segments = level === 0 ? 48 : level === 1 ? 24 : 12;
  const mat = 0, ice = 1, snow = 2, fx = 3;
  addBox(g, [0, 0.35, 0], level === 2 ? [17.5, 0.7, 17.5] : [18, 0.7, 18], mat);
  addBox(g, [0, 1.25, 0], level === 2 ? [12.8, 1.1, 12.8] : [14, 1.1, 14], mat);
  addCylinder(g, [0, 1.8, 0], level === 2 ? 4.1 : 4.8, level === 2 ? 5.6 : 6.3, level === 2 ? 6 : 8, mat, level === 2 ? 3.2 : 3.9);
  addCylinder(g, [0, 7.9, 0], level === 2 ? 2.8 : 3.5, level === 2 ? 8 : 9.5, level === 2 ? 6 : 8, ice, level === 2 ? 2.1 : 2.7);
  addCylinder(g, [0, 17.35, 0], level === 2 ? 1.7 : 2.15, level === 2 ? 3.8 : 4.8, level === 2 ? 6 : 8, ice, 0.45);
  addTorus(g, [0, 7.5, 0], level === 2 ? 5.1 : 6.2, level === 2 ? 0.22 : 0.32, segments, level === 0 ? 12 : 8, fx);
  if (level < 2) addTorus(g, [0, 12.2, 0], level === 1 ? 4.8 : 5.1, 0.22, segments, 8, fx);
  if (level === 0) addTorus(g, [0, 16.4, 0], 3.8, 0.16, 32, 8, fx);
  addCylinder(g, [0, 22.15, 0], level === 2 ? 1.0 : 1.25, level === 2 ? 1.2 : 1.8, level === 2 ? 6 : 8, snow, 0.18);
  addBox(g, [0, 2.15, -5.1], [3.4, 1.5, 0.8], fx);
  addBox(g, [0, 3.5, -5.0], [2.2, 1.0, 0.55], snow);
  const pylons = level === 2 ? [[-5.5, -5.5], [5.5, -5.5]] : [[-6.2, -6.2], [6.2, -6.2], [-6.2, 6.2], [6.2, 6.2]];
  for (const [x, z] of pylons) addPylon(g, x, z, mat, snow, detailed);
  if (level === 0) {
    for (const x of [-4.2, -2.8, 2.8, 4.2]) addBox(g, [x, 10.6, -3.1], [0.55, 2.3, 0.18], fx);
    for (const z of [-4.2, -2.8, 2.8, 4.2]) addBox(g, [-3.1, 10.6, z], [0.18, 2.3, 0.55], fx);
    addBox(g, [-4.6, 4.6, 0], [1.1, 0.3, 8.8], snow);
    addBox(g, [4.6, 4.6, 0], [1.1, 0.3, 8.8], snow);
  }
  return g;
}

function addPrimitive(mesh, g, material) {
  const pRange = range(g.positions, 3);
  const p = accessorFor(g.positions, "VEC3", 5126, 34962, pRange.min, pRange.max);
  const n = accessorFor(g.normals, "VEC3", 5126, 34962);
  const uv = accessorFor(g.uvs, "VEC2", 5126, 34962);
  const index = accessorFor(g.indices, "SCALAR", 5125, 34963);
  mesh.primitives.push({ attributes: { POSITION: p, NORMAL: n, TEXCOORD_0: uv }, indices: index, material });
}

const meshes = [];
const nodes = [];
function addMeshNode(name, level) {
  const mesh = { name: `${name}_mesh`, primitives: [] };
  addPrimitive(mesh, addCityCoreLOD(level), 0);
  const meshIndex = meshes.push(mesh) - 1;
  return nodes.push({ name, mesh: meshIndex, extras: { lodLevel: level, gameplayAsset: true } }) - 1;
}
const lod0 = addMeshNode("landmark_city_core_lod0", 0);
const lod1 = addMeshNode("landmark_city_core_lod1", 1);
const lod2 = addMeshNode("landmark_city_core_lod2", 2);

const collisionMesh = { name: "landmark_city_core_collision_mesh", primitives: [] };
addPrimitive(collisionMesh, (() => { const g = geometry(); addBox(g, [0, 5, 0], [10, 10, 10], 0); return g; })(), 0);
const collisionMeshIndex = meshes.push(collisionMesh) - 1;
const collision = nodes.push({ name: "landmark_city_core_collision", mesh: collisionMeshIndex, extras: { collision: true } }) - 1;
const interaction = nodes.push({ name: "landmark_city_core_interaction", extras: { pickable: true, interactionId: "city-core-main" } }) - 1;
const fxNode = nodes.push({ name: "landmark_city_core_fx", children: [], extras: { runtimeFx: true } }) - 1;
const energyRing = nodes.push({ name: "fx_energy_ring", translation: [0, 7.5, 0], extras: { effect: "energy-ring" } }) - 1;
const warmLights = nodes.push({ name: "fx_warm_lights", translation: [0, 2.2, -5.3], extras: { effect: "warm-lights" } }) - 1;
const socket = nodes.push({ name: "landmark_city_core_socket", children: [], extras: { sockets: true } }) - 1;
const quest = nodes.push({ name: "socket_quest_marker", translation: [0, 4.8, -6.2] }) - 1;
const upgrade = nodes.push({ name: "socket_upgrade_effect", translation: [0, 21.5, 0] }) - 1;
nodes[fxNode].children = [energyRing, warmLights];
nodes[socket].children = [quest, upgrade];
const root = nodes.push({ name: "landmark_city_core_root", children: [lod0, lod1, lod2, collision, interaction, fxNode, socket], extras: { assetId: "landmark-city-core", style: "ice-snow-semi-realistic-cartoon", lodCount: 3 } }) - 1;

const json = {
  asset: { version: "2.0", generator: "Ice Snow City city-core procedural high-fidelity baseline" },
  scene: 0,
  scenes: [{ name: "city_core_scene", nodes: [root] }],
  nodes,
  meshes,
  materials,
  buffers: [{ byteLength: byteOffset }],
  bufferViews,
  accessors,
  extras: {
    assetId: "landmark-city-core",
    gameplayOnly: true,
    nft: false,
    pbrMaps: ["baseColor", "normal", "metallicRoughness"],
    lodPolicy: "Babylon HardwareScalingLOD: LOD0 0-18m, LOD1 18-48m, LOD2 48m+",
  },
};

const jsonBytes = Buffer.from(JSON.stringify(json));
const jsonPaddedLength = align4(jsonBytes.length);
const bin = Buffer.concat(bufferChunks);
const binPaddedLength = align4(bin.length);
const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + jsonPaddedLength + 8 + binPaddedLength, 8);
const jsonChunkHeader = Buffer.alloc(8);
jsonChunkHeader.writeUInt32LE(jsonPaddedLength, 0);
jsonChunkHeader.writeUInt32LE(0x4e4f534a, 4);
const binChunkHeader = Buffer.alloc(8);
binChunkHeader.writeUInt32LE(binPaddedLength, 0);
binChunkHeader.writeUInt32LE(0x004e4942, 4);
const jsonChunk = Buffer.concat([jsonBytes, Buffer.alloc(jsonPaddedLength - jsonBytes.length, 0x20)]);
const binChunk = Buffer.concat([bin, Buffer.alloc(binPaddedLength - bin.length)]);
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, Buffer.concat([header, jsonChunkHeader, jsonChunk, binChunkHeader, binChunk]));
console.log(JSON.stringify({ output, bytes: fs.statSync(output).size, nodes: nodes.length, meshes: meshes.length, triangles: meshes.map((mesh) => mesh.primitives.reduce((sum, primitive) => sum + accessors[primitive.indices].count / 3, 0)) }, null, 2));
