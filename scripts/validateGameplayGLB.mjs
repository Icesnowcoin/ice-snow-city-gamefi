#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

function readJsonChunk(bytes) {
  if (bytes.subarray(0, 4).toString('utf8') !== 'glTF' || bytes.readUInt32LE(4) !== 2 || bytes.readUInt32LE(8) !== bytes.length) {
    throw new Error('invalid GLB header');
  }
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const length = bytes.readUInt32LE(offset);
    const type = bytes.subarray(offset + 4, offset + 8).toString('ascii');
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    if (type === 'JSON') return JSON.parse(data.toString('utf8').replace(/[\u0000\s]+$/, ''));
    offset += 8 + length;
  }
  throw new Error('JSON chunk missing');
}

function inspect(filePath) {
  const bytes = fs.readFileSync(filePath);
  const json = readJsonChunk(bytes);
  const nodes = Array.isArray(json.nodes) ? json.nodes : [];
  const meshes = Array.isArray(json.meshes) ? json.meshes : [];
  const materials = Array.isArray(json.materials) ? json.materials : [];
  const skins = Array.isArray(json.skins) ? json.skins : [];
  const animations = Array.isArray(json.animations) ? json.animations : [];
  const names = nodes.map((node) => node.name).filter(Boolean);
  const extras = json.extras ?? {};
  const rootExtras = nodes.find((node) => node.extras?.assetId)?.extras ?? {};
  const gameplayOnly = extras.gameplayOnly === true || rootExtras.gameplayOnly === true;
  const nft = extras.nft ?? rootExtras.nft;
  return {
    file: path.resolve(filePath),
    bytes: bytes.length,
    sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    gltfVersion: json.asset?.version ?? null,
    nodeCount: nodes.length,
    meshCount: meshes.length,
    materialCount: materials.length,
    skinCount: skins.length,
    animationCount: animations.length,
    names,
    gameplayOnly,
    nft: nft === undefined ? null : nft,
    assetQuality: skins.length > 0 && animations.length > 0 ? 'rigged-animated' : 'static-gameplay-baseline',
    status: json.asset?.version === '2.0' && bytes.length > 0 && gameplayOnly === true && nft === false ? 'valid-gameplay-file' : 'needs-review',
  };
}

const inputs = process.argv.slice(2);
if (inputs.length === 0) {
  console.error('Usage: node scripts/validateGameplayGLB.mjs <file.glb> [file.glb ...]');
  process.exit(2);
}
const results = inputs.map(inspect);
console.log(JSON.stringify({ generatedAt: new Date().toISOString(), total: results.length, valid: results.filter((result) => result.status === 'valid-gameplay-file').length, results }, null, 2));
if (results.some((result) => result.status !== 'valid-gameplay-file')) process.exitCode = 1;
