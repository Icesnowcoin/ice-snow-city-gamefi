export const ROAD_BASE = 64;
export const LAST_ROAD = 206;
export const RESIDENTIAL_BASE = 240;
export const LAST_ZONE = 826;

export function isRoadTile(tile: number): boolean {
  return tile >= ROAD_BASE && tile <= LAST_ROAD;
}

export function isBuildingTile(tile: number): boolean {
  return tile >= RESIDENTIAL_BASE && tile <= LAST_ZONE;
}

export function shouldLightWindow(x: number, y: number): boolean {
  return ((x * 17 + y * 31) % 5) !== 0;
}
