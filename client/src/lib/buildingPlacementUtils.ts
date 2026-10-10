export type PlacementRotation = 0 | 90 | 180 | 270;

export interface GridPoint {
  x: number;
  y: number;
}

export interface BuildingFootprint {
  width: number;
  height: number;
}

export interface PlacementBounds {
  width: number;
  height: number;
}

export interface BuildingPlacementCandidate {
  id: string;
  buildingId: string;
  landId: string;
  position: GridPoint;
  footprint: BuildingFootprint;
  rotation: PlacementRotation;
  cost: number;
}

export type PlacementValidationReason =
  | 'valid'
  | 'out-of-bounds'
  | 'collision'
  | 'invalid-footprint'
  | 'insufficient-balance';

export interface PlacementValidationResult {
  valid: boolean;
  reason: PlacementValidationReason;
  message: string;
}

const ROTATIONS: PlacementRotation[] = [0, 90, 180, 270];

export function normalizeRotation(value: number): PlacementRotation {
  const normalized = ((Math.round(value / 90) * 90) % 360 + 360) % 360;
  return ROTATIONS.includes(normalized as PlacementRotation)
    ? (normalized as PlacementRotation)
    : 0;
}

export function rotateFootprint(
  footprint: BuildingFootprint,
  rotation: PlacementRotation,
): BuildingFootprint {
  const normalizedRotation = normalizeRotation(rotation);
  if (normalizedRotation === 90 || normalizedRotation === 270) {
    return { width: footprint.height, height: footprint.width };
  }
  return { width: footprint.width, height: footprint.height };
}

export function snapToGrid(point: GridPoint, gridSize = 1): GridPoint {
  const safeGridSize = Math.max(1, Math.floor(gridSize));
  return {
    x: Math.max(0, Math.round(point.x / safeGridSize) * safeGridSize),
    y: Math.max(0, Math.round(point.y / safeGridSize) * safeGridSize),
  };
}

export function getOccupiedCells(
  position: GridPoint,
  footprint: BuildingFootprint,
  rotation: PlacementRotation,
): GridPoint[] {
  const rotated = rotateFootprint(footprint, rotation);
  const cells: GridPoint[] = [];
  for (let y = 0; y < rotated.height; y += 1) {
    for (let x = 0; x < rotated.width; x += 1) {
      cells.push({ x: position.x + x, y: position.y + y });
    }
  }
  return cells;
}

export function isPlacementWithinBounds(
  position: GridPoint,
  footprint: BuildingFootprint,
  rotation: PlacementRotation,
  bounds: PlacementBounds,
): boolean {
  if (
    !Number.isInteger(position.x) ||
    !Number.isInteger(position.y) ||
    position.x < 0 ||
    position.y < 0 ||
    bounds.width <= 0 ||
    bounds.height <= 0
  ) {
    return false;
  }
  const rotated = rotateFootprint(footprint, rotation);
  return (
    rotated.width > 0 &&
    rotated.height > 0 &&
    position.x + rotated.width <= bounds.width &&
    position.y + rotated.height <= bounds.height
  );
}

export function placementsOverlap(
  left: BuildingPlacementCandidate,
  right: BuildingPlacementCandidate,
): boolean {
  if (left.landId !== right.landId) return false;
  const leftCells = new Set(
    getOccupiedCells(left.position, left.footprint, left.rotation).map((cell) => `${cell.x}:${cell.y}`),
  );
  return getOccupiedCells(right.position, right.footprint, right.rotation).some((cell) =>
    leftCells.has(`${cell.x}:${cell.y}`),
  );
}

export function validatePlacement(
  candidate: BuildingPlacementCandidate,
  existingPlacements: BuildingPlacementCandidate[],
  bounds: PlacementBounds,
  iscBalance?: number,
): PlacementValidationResult {
  const rotated = rotateFootprint(candidate.footprint, candidate.rotation);
  if (rotated.width <= 0 || rotated.height <= 0) {
    return { valid: false, reason: 'invalid-footprint', message: '建筑占地尺寸无效' };
  }
  if (!isPlacementWithinBounds(candidate.position, candidate.footprint, candidate.rotation, bounds)) {
    return { valid: false, reason: 'out-of-bounds', message: '建筑超出土地边界' };
  }
  if (existingPlacements.some((placement) => placement.id !== candidate.id && placementsOverlap(candidate, placement))) {
    return { valid: false, reason: 'collision', message: '建筑与已有建筑发生重叠' };
  }
  if (iscBalance !== undefined && iscBalance < candidate.cost) {
    return { valid: false, reason: 'insufficient-balance', message: 'ISC 余额不足，无法确认放置' };
  }
  return { valid: true, reason: 'valid', message: '可以放置建筑' };
}
