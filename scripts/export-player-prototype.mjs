import { Blob } from "node:buffer";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

if (!globalThis.FileReader) {
  globalThis.FileReader = class NodeFileReader {
    result = null;
    onloadend = null;

    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then(buffer => {
        this.result = buffer;
        this.onloadend?.();
      });
    }
  };
}

if (!globalThis.Blob) {
  globalThis.Blob = Blob;
}
import { PlayerCharacterModel } from "../client/src/game/models/PlayerCharacterModel.ts";

const outputPath = resolve(
  "/home/ubuntu/webdev-static-assets/characters/player/player_character_prototype_v0.glb"
);

await mkdir(dirname(outputPath), { recursive: true });

const model = new PlayerCharacterModel({
  skinTone: "#f4c4a0",
  hairColor: "#2c1810",
  outfitColor: "#2563eb",
});
model.getScene().name = "IceSnowCity_PlayerCharacter_Prototype_v0";
model.getScene().userData.assetStatus = "procedural-prototype";
model.getScene().userData.highFidelityDelivery = false;
model.getScene().userData.exportNotes =
  "Prototype GLB exported from the current procedural model; not the final high-fidelity character asset.";

const exporter = new GLTFExporter();
const result = await new Promise((resolveResult, reject) => {
  exporter.parse(model.getScene(), resolveResult, reject, {
    binary: true,
    onlyVisible: true,
    trs: false,
  });
});

if (!(result instanceof ArrayBuffer)) {
  throw new Error("Expected binary GLB output from GLTFExporter");
}

await writeFile(outputPath, Buffer.from(result));
model.dispose();
console.log(JSON.stringify({ outputPath, bytes: result.byteLength }, null, 2));
