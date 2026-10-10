export type TrafficDirection = 'horizontal' | 'vertical';
const HIGH_TRAFFIC_BASE = 144;

export function getTrafficDirection(x: number, y: number): TrafficDirection {
  return (x + y) % 2 === 0 ? 'horizontal' : 'vertical';
}

export function getTrafficProgress(timeMs: number, x: number, y: number, speed = 0.00008): number {
  const offset = ((x * 37 + y * 19) % 1000) / 1000;
  return ((timeMs * speed + offset) % 1 + 1) % 1;
}

export function shouldRenderTraffic(x: number, y: number): boolean {
  return (x * 13 + y * 7) % 3 !== 0;
}

export function isCongestedRoad(mapData: Uint16Array, height: number, x: number, y: number, upgradedRoads?: ReadonlySet<string>): boolean {
  if (upgradedRoads?.has(`${x}:${y}`)) return false;
  const tile = (mapData[x * height + y] ?? 0) & 0x03ff;
  if (!isRoadTileValue(tile)) return false;
  if (tile >= HIGH_TRAFFIC_BASE) return true;
  let adjacentRoads = 0;
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && ny >= 0 && nx < Math.floor(mapData.length / height) && ny < height) {
      if (isRoadTileValue((mapData[nx * height + ny] ?? 0) & 0x03ff)) adjacentRoads += 1;
    }
  }
  return adjacentRoads >= 3;
}

export function getCongestionPulse(timeMs: number): number {
  return .48 + (Math.sin(timeMs / 115) + 1) * .26;
}

function isRoadTileValue(tile: number): boolean {
  return tile >= 64 && tile <= 206;
}
