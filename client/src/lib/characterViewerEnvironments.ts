export type CharacterViewerEnvironment = "snow" | "indoor" | "night";

export interface CharacterViewerEnvironmentConfig {
  id: CharacterViewerEnvironment;
  label: string;
  description: string;
  skyColor: [number, number, number, number];
  groundColor: [number, number, number];
  fogColor: [number, number, number];
  fogDensity: number;
  hemiDiffuse: [number, number, number];
  hemiGround: [number, number, number];
  directionalDiffuse: [number, number, number];
  directionalIntensity: number;
  groundMaterial: "snow" | "wood" | "asphalt";
}

export const CHARACTER_VIEWER_ENVIRONMENTS: ReadonlyArray<CharacterViewerEnvironmentConfig> = [
  {
    id: "snow",
    label: "冬季雪景",
    description: "冷蓝天空、雪地反光和轻薄冬雾",
    skyColor: [0.06, 0.14, 0.24, 1],
    groundColor: [0.78, 0.86, 0.92],
    fogColor: [0.68, 0.8, 0.9],
    fogDensity: 0.012,
    hemiDiffuse: [0.29, 0.56, 0.89],
    hemiGround: [0.1, 0.1, 0.15],
    directionalDiffuse: [0.91, 0.95, 0.97],
    directionalIntensity: 1.2,
    groundMaterial: "snow",
  },
  {
    id: "indoor",
    label: "室内暖光",
    description: "木质地面、柔和暖光和舒适室内氛围",
    skyColor: [0.16, 0.1, 0.07, 1],
    groundColor: [0.34, 0.22, 0.13],
    fogColor: [0.24, 0.16, 0.11],
    fogDensity: 0.006,
    hemiDiffuse: [1, 0.68, 0.42],
    hemiGround: [0.18, 0.09, 0.04],
    directionalDiffuse: [1, 0.82, 0.58],
    directionalIntensity: 1.05,
    groundMaterial: "wood",
  },
  {
    id: "night",
    label: "城市夜景",
    description: "深色城市背景、霓虹蓝光和高对比轮廓",
    skyColor: [0.015, 0.025, 0.09, 1],
    groundColor: [0.08, 0.1, 0.16],
    fogColor: [0.04, 0.06, 0.16],
    fogDensity: 0.009,
    hemiDiffuse: [0.16, 0.28, 0.72],
    hemiGround: [0.02, 0.03, 0.1],
    directionalDiffuse: [0.35, 0.58, 1],
    directionalIntensity: 1.35,
    groundMaterial: "asphalt",
  },
];

export function getCharacterViewerEnvironmentConfig(
  environment: CharacterViewerEnvironment,
): CharacterViewerEnvironmentConfig {
  return CHARACTER_VIEWER_ENVIRONMENTS.find((item) => item.id === environment) ?? CHARACTER_VIEWER_ENVIRONMENTS[0];
}
