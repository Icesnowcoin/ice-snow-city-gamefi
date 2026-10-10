#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function paddedJson(json) {
  const raw = Buffer.from(JSON.stringify(json));
  const length = Math.ceil(raw.length / 4) * 4;
  return Buffer.concat([raw, Buffer.alloc(length - raw.length, 0x20)]);
}

function patch(filePath, assetId) {
  const input = fs.readFileSync(filePath);
  if (input.subarray(0, 4).toString('utf8') !== 'glTF' || input.readUInt32LE(4) !== 2) throw new Error(`${filePath}: invalid GLB header`);
  let offset = 12;
  const chunks = [];
  while (offset + 8 <= input.length) {
    const length = input.readUInt32LE(offset);
    const type = input.subarray(offset + 4, offset + 8);
    const data = input.subarray(offset + 8, offset + 8 + length);
    chunks.push({ type, data });
    offset += 8 + length;
  }
  const jsonChunk = chunks.find((chunk) => chunk.type.toString('ascii') === 'JSON');
  if (!jsonChunk) throw new Error(`${filePath}: JSON chunk missing`);
  const json = JSON.parse(jsonChunk.data.toString('utf8').replace(/[\u0000\s]+$/, ''));
  json.extras = { ...(json.extras ?? {}), assetId, gameplayOnly: true, nft: false, source: 'generated-gameplay-baseline' };
  json.nodes = (json.nodes ?? []).map((node, index) => index === 0
    ? { ...node, extras: { ...(node.extras ?? {}), assetId, gameplayOnly: true, nft: false } }
    : node);
  jsonChunk.data = paddedJson(json);
  const body = Buffer.concat(chunks.flatMap(({ type, data }) => {
    const header = Buffer.alloc(8);
    header.writeUInt32LE(data.length, 0);
    type.copy(header, 4);
    return [header, data];
  }));
  const header = Buffer.alloc(12);
  header.write('glTF', 0, 4, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + body.length, 8);
  fs.writeFileSync(filePath, Buffer.concat([header, body]));
}

const [assetId, ...files] = process.argv.slice(2);
if (!assetId || files.length === 0) {
  console.error('Usage: node scripts/markGameplayOnlyGlb.mjs <assetId> <file.glb> [file.glb ...]');
  process.exit(2);
}
files.forEach((filePath) => patch(path.resolve(filePath), assetId));
console.log(JSON.stringify({ assetId, files: files.map((filePath) => path.resolve(filePath)) }, null, 2));
