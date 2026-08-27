import { describe, expect, it } from "vitest";

import { getIsometricCameraView, ISOMETRIC_CAMERA_PRESET } from "./cameraPresets";

describe("cameraPresets", () => {
  it("provides a diagonal 2.5D camera baseline", () => {
    expect(ISOMETRIC_CAMERA_PRESET.position).toEqual({ x: 42, y: 42, z: -42 });
    expect(ISOMETRIC_CAMERA_PRESET.target).toEqual({ x: 0, y: 0, z: 0 });
  });

  it("keeps the target center and clamps unsafe distance", () => {
    expect(getIsometricCameraView({ x: 10, y: 2, z: -4 }, 0)).toEqual({
      position: { x: 11, y: 3, z: -5 },
      target: { x: 10, y: 2, z: -4 },
    });
  });
});
