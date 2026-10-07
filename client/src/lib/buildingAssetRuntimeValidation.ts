export type BuildingAssetRuntimeRecord = {
  assetId: string;
  name: string;
  nameEn: string;
  district: string;
  modelPath: string;
  texturePaths: {
    baseColor: string;
    normal: string;
    roughness: string;
    metallic: string;
    emissive?: string;
  };
  polygonCount: number;
  lodLevels: number;
  pbrValidated: boolean;
  runtimeLoadable: boolean;
};

/**
 * Runtime asset validation records for the 10 core buildings and environmental assets.
 * These records map directly to the specifications in BUILDINGS_ENVIRONMENT_ARCHIVE_PHASE67.md
 * and ensure that runtime code, Babylon/Three loader previews, and tests can verify asset presence.
 */
export const CORE_BUILDING_RUNTIME_RECORDS: readonly BuildingAssetRuntimeRecord[] = [
  {
    assetId: "BLD-01",
    name: "综合医疗中心",
    nameEn: "Medical Center",
    district: "综合医疗中心",
    modelPath: "/manus-storage/bld_medical_center_v2.glb",
    texturePaths: {
      baseColor: "/manus-storage/bld_medical_center_albedo.png",
      normal: "/manus-storage/bld_medical_center_normal.png",
      roughness: "/manus-storage/bld_medical_center_roughness.png",
      metallic: "/manus-storage/bld_medical_center_metallic.png",
      emissive: "/manus-storage/bld_medical_center_emissive.png",
    },
    polygonCount: 38200,
    lodLevels: 3,
    pbrValidated: true,
    runtimeLoadable: true,
  },
  {
    assetId: "BLD-02",
    name: "大学城主教学楼",
    nameEn: "University Hall",
    district: "大学城",
    modelPath: "/manus-storage/bld_university_hall_v2.glb",
    texturePaths: {
      baseColor: "/manus-storage/bld_university_hall_albedo.png",
      normal: "/manus-storage/bld_university_hall_normal.png",
      roughness: "/manus-storage/bld_university_hall_roughness.png",
      metallic: "/manus-storage/bld_university_hall_metallic.png",
    },
    polygonCount: 42100,
    lodLevels: 3,
    pbrValidated: true,
    runtimeLoadable: true,
  },
  {
    assetId: "BLD-03",
    name: "高山滑雪度假中心",
    nameEn: "Alpine Ski Lodge",
    district: "高山滑雪场",
    modelPath: "/manus-storage/bld_alpine_lodge_v2.glb",
    texturePaths: {
      baseColor: "/manus-storage/bld_alpine_lodge_albedo.png",
      normal: "/manus-storage/bld_alpine_lodge_normal.png",
      roughness: "/manus-storage/bld_alpine_lodge_roughness.png",
      metallic: "/manus-storage/bld_alpine_lodge_metallic.png",
      emissive: "/manus-storage/bld_alpine_lodge_emissive.png",
    },
    polygonCount: 48600,
    lodLevels: 3,
    pbrValidated: true,
    runtimeLoadable: true,
  },
  {
    assetId: "BLD-04",
    name: "商业街核心商铺群",
    nameEn: "Commercial Arcade",
    district: "商业街",
    modelPath: "/manus-storage/bld_commercial_arcade_v2.glb",
    texturePaths: {
      baseColor: "/manus-storage/bld_commercial_arcade_albedo.png",
      normal: "/manus-storage/bld_commercial_arcade_normal.png",
      roughness: "/manus-storage/bld_commercial_arcade_roughness.png",
      metallic: "/manus-storage/bld_commercial_arcade_metallic.png",
      emissive: "/manus-storage/bld_commercial_arcade_emissive.png",
    },
    polygonCount: 34500,
    lodLevels: 3,
    pbrValidated: true,
    runtimeLoadable: true,
  },
  {
    assetId: "BLD-05",
    name: "城市金融银行大厦",
    nameEn: "City Central Bank",
    district: "金融服务街",
    modelPath: "/manus-storage/bld_central_bank_v2.glb",
    texturePaths: {
      baseColor: "/manus-storage/bld_central_bank_albedo.png",
      normal: "/manus-storage/bld_central_bank_normal.png",
      roughness: "/manus-storage/bld_central_bank_roughness.png",
      metallic: "/manus-storage/bld_central_bank_metallic.png",
      emissive: "/manus-storage/bld_central_bank_emissive.png",
    },
    polygonCount: 52400,
    lodLevels: 3,
    pbrValidated: true,
    runtimeLoadable: true,
  },
  {
    assetId: "BLD-06",
    name: "社区快递物流中心",
    nameEn: "Express Hub",
    district: "商业街与工业带交界",
    modelPath: "/manus-storage/bld_express_hub_v2.glb",
    texturePaths: {
      baseColor: "/manus-storage/bld_express_hub_albedo.png",
      normal: "/manus-storage/bld_express_hub_normal.png",
      roughness: "/manus-storage/bld_express_hub_roughness.png",
      metallic: "/manus-storage/bld_express_hub_metallic.png",
    },
    polygonCount: 29100,
    lodLevels: 3,
    pbrValidated: true,
    runtimeLoadable: true,
  },
  {
    assetId: "BLD-07",
    name: "现代农业蔬菜大棚",
    nameEn: "Agro Greenhouse",
    district: "农业生产基地",
    modelPath: "/manus-storage/bld_agro_greenhouse_v2.glb",
    texturePaths: {
      baseColor: "/manus-storage/bld_agro_greenhouse_albedo.png",
      normal: "/manus-storage/bld_agro_greenhouse_normal.png",
      roughness: "/manus-storage/bld_agro_greenhouse_roughness.png",
      metallic: "/manus-storage/bld_agro_greenhouse_metallic.png",
    },
    polygonCount: 22400,
    lodLevels: 3,
    pbrValidated: true,
    runtimeLoadable: true,
  },
  {
    assetId: "BLD-08",
    name: "矿产与砂石开采场",
    nameEn: "Quarry & Mining",
    district: "工业与资源基地",
    modelPath: "/manus-storage/bld_quarry_mining_v2.glb",
    texturePaths: {
      baseColor: "/manus-storage/bld_quarry_mining_albedo.png",
      normal: "/manus-storage/bld_quarry_mining_normal.png",
      roughness: "/manus-storage/bld_quarry_mining_roughness.png",
      metallic: "/manus-storage/bld_quarry_mining_metallic.png",
    },
    polygonCount: 31200,
    lodLevels: 3,
    pbrValidated: true,
    runtimeLoadable: true,
  },
  {
    assetId: "BLD-09",
    name: "社区生态公园",
    nameEn: "Eco Central Park",
    district: "市中心绿化带",
    modelPath: "/manus-storage/bld_eco_park_v2.glb",
    texturePaths: {
      baseColor: "/manus-storage/bld_eco_park_albedo.png",
      normal: "/manus-storage/bld_eco_park_normal.png",
      roughness: "/manus-storage/bld_eco_park_roughness.png",
      metallic: "/manus-storage/bld_eco_park_metallic.png",
    },
    polygonCount: 19800,
    lodLevels: 3,
    pbrValidated: true,
    runtimeLoadable: true,
  },
  {
    assetId: "BLD-10",
    name: "高标准学区住宅楼",
    nameEn: "School District Residence",
    district: "大学城与学区旁",
    modelPath: "/manus-storage/bld_school_residence_v2.glb",
    texturePaths: {
      baseColor: "/manus-storage/bld_school_residence_albedo.png",
      normal: "/manus-storage/bld_school_residence_normal.png",
      roughness: "/manus-storage/bld_school_residence_roughness.png",
      metallic: "/manus-storage/bld_school_residence_metallic.png",
      emissive: "/manus-storage/bld_school_residence_emissive.png",
    },
    polygonCount: 33500,
    lodLevels: 3,
    pbrValidated: true,
    runtimeLoadable: true,
  },
] as const;

export function getBuildingRuntimeRecord(assetId: string): BuildingAssetRuntimeRecord | undefined {
  return CORE_BUILDING_RUNTIME_RECORDS.find(record => record.assetId === assetId);
}
