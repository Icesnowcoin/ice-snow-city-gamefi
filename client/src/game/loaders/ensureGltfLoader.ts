let gltfLoaderPromise: Promise<unknown> | null = null;

/**
 * Load the Babylon glTF loader only when a real GLB/GLTF asset is requested.
 * The procedural map does not need this dependency during its first render.
 */
export function ensureGltfLoader(): Promise<unknown> {
  gltfLoaderPromise ??= import("@babylonjs/loaders/glTF");
  return gltfLoaderPromise;
}

export function resetGltfLoaderForTests(): void {
  gltfLoaderPromise = null;
}
