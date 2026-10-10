export const DAY_NIGHT_CYCLE_UNITS = 4320;

/** Returns a smooth 0..1 darkness value: noon=0, midnight=1. */
export function getNightOpacity(gameTime: number): number {
  const normalized = ((gameTime % DAY_NIGHT_CYCLE_UNITS) + DAY_NIGHT_CYCLE_UNITS) % DAY_NIGHT_CYCLE_UNITS / DAY_NIGHT_CYCLE_UNITS;
  const daylight = (Math.cos((normalized - 0.5) * Math.PI * 2) + 1) / 2;
  const twilight = Math.min(1, Math.max(0, (1 - daylight) * 1.18));
  return Number((twilight * 0.72).toFixed(4));
}

export function getDayPhaseLabel(gameTime: number): '夜间' | '清晨' | '白昼' | '黄昏' {
  const normalized = ((gameTime % DAY_NIGHT_CYCLE_UNITS) + DAY_NIGHT_CYCLE_UNITS) % DAY_NIGHT_CYCLE_UNITS / DAY_NIGHT_CYCLE_UNITS;
  if (normalized < 0.2 || normalized >= 0.8) return '夜间';
  if (normalized < 0.3) return '清晨';
  if (normalized < 0.7) return '白昼';
  return '黄昏';
}
