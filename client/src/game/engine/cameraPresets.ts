export type CameraVector = { x: number; y: number; z: number };

export const ISOMETRIC_CAMERA_PRESET = {
  position: { x: 42, y: 42, z: -42 } satisfies CameraVector,
  target: { x: 0, y: 0, z: 0 } satisfies CameraVector,
  label: "isometric",
} as const;

export function getIsometricCameraView(center: CameraVector = ISOMETRIC_CAMERA_PRESET.target, distance = 42) {
  const safeDistance = Math.max(1, distance);
  return {
    position: { x: center.x + safeDistance, y: center.y + safeDistance, z: center.z - safeDistance },
    target: { ...center },
  };
}
