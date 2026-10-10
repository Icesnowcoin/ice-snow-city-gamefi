export interface CityDistrict {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  isUnlocked: boolean;
  unlockCostISC: number;
  requiredPopulation: number;
  prosperity: number;
  facilities: string[];
  facilitiesEn: string[];
}

export interface MainStoryQuest {
  id: string;
  chapter: number;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  targetDistrictId: string;
  rewardISC: number;
  status: "locked" | "available" | "in_progress" | "completed";
  progress: number;
}

export const INITIAL_DISTRICTS: CityDistrict[] = [
  {
    id: "commercial",
    name: "繁华商业街区块",
    nameEn: "Commercial Street",
    description: "汇聚品牌潮牌、咖啡厅与数码广场的城市核心商业枢纽，产生稳定 ISC 税收。",
    descriptionEn: "The core commercial hub featuring boutiques, cafes, and digital plazas generating steady ISC tax revenue.",
    isUnlocked: true,
    unlockCostISC: 0,
    requiredPopulation: 0,
    prosperity: 85,
    facilities: ["品牌潮牌店", "数码广场", "ISC 交易中心"],
    facilitiesEn: ["Boutique Store", "Digital Plaza", "ISC Trading Center"],
  },
  {
    id: "ski_resort",
    name: "高山滑雪场区块",
    nameEn: "Alpine Ski Resort",
    description: "现代高山滑雪道与冰雪度假酒店，吸引全球游客并带动文旅经济。",
    descriptionEn: "Modern alpine ski slopes and luxury snow resort hotels attracting global tourists and boosting tourism economy.",
    isUnlocked: false,
    unlockCostISC: 5000,
    requiredPopulation: 500,
    prosperity: 30,
    facilities: ["专业高山滑雪道", "缆车索道", "度假酒店"],
    facilitiesEn: ["Alpine Ski Slopes", "Cable Car", "Resort Hotel"],
  },
  {
    id: "university",
    name: "现代大学城区块",
    nameEn: "University Town",
    description: "汇聚科技学院与国家图书馆的高等教育园区，孵化未来城市人才。",
    descriptionEn: "Higher education campus featuring tech colleges and central libraries, incubating future talent.",
    isUnlocked: false,
    unlockCostISC: 12000,
    requiredPopulation: 1500,
    prosperity: 45,
    facilities: ["科技学院主楼", "中央图书馆", "学术报告厅"],
    facilitiesEn: ["Tech College", "Central Library", "Academic Hall"],
  },
  {
    id: "medical",
    name: "综合医疗中心区块",
    nameEn: "Medical Center District",
    description: "配备顶级设备的现代化综合医院与急救中心，全面保障市民健康与幸福感。",
    descriptionEn: "Top-tier modern general hospital and emergency center ensuring citizens' health and happiness.",
    isUnlocked: false,
    unlockCostISC: 25000,
    requiredPopulation: 3000,
    prosperity: 60,
    facilities: ["综合住院大楼", "急救直升机坪", "康复疗养院"],
    facilitiesEn: ["General Hospital", "Emergency Helipad", "Recovery Sanitarium"],
  },
];

export const INITIAL_MAIN_QUESTS: MainStoryQuest[] = [
  {
    id: "quest_ch1",
    chapter: 1,
    title: "第一章：霓虹初上",
    titleEn: "Chapter 1: Neon Awakening",
    description: "在商业街开设第一家商铺，雇佣首位市民，并完成首次 ISC 经济交互。",
    descriptionEn: "Open your first shop in the commercial street, hire a citizen, and complete your first ISC economic interaction.",
    targetDistrictId: "commercial",
    rewardISC: 500,
    status: "in_progress",
    progress: 50,
  },
  {
    id: "quest_ch2",
    chapter: 2,
    title: "第二章：冰雪经济",
    titleEn: "Chapter 2: Frost & Finance",
    description: "筹集资金投资并解锁高山滑雪场区块，建造首条滑雪道。",
    descriptionEn: "Raise capital to unlock the alpine ski resort district and construct the first ski slope.",
    targetDistrictId: "ski_resort",
    rewardISC: 1200,
    status: "locked",
    progress: 0,
  },
  {
    id: "quest_ch3",
    chapter: 3,
    title: "第三章：学术之光",
    titleEn: "Chapter 3: Campus Horizon",
    description: "人口达到 1,500 人并解锁大学城区块，建设中央图书馆。",
    descriptionEn: "Reach 1,500 population, unlock the university town, and build the central library.",
    targetDistrictId: "university",
    rewardISC: 2500,
    status: "locked",
    progress: 0,
  },
  {
    id: "quest_ch4",
    chapter: 4,
    title: "第四章：健康与繁荣",
    titleEn: "Chapter 4: Metropolis Pulse",
    description: "解锁综合医疗中心区块，全面提升城市健康指数至 90% 以上。",
    descriptionEn: "Unlock the medical center district and elevate the city's health index above 90%.",
    targetDistrictId: "medical",
    rewardISC: 5000,
    status: "locked",
    progress: 0,
  },
];

export function unlockDistrict(
  districts: CityDistrict[],
  districtId: string,
  playerBalance: number,
  playerPopulation: number
): { success: boolean; updatedDistricts: CityDistrict[]; message: string; cost: number } {
  const target = districts.find((d) => d.id === districtId);
  if (!target) return { success: false, updatedDistricts: districts, message: "区块不存在", cost: 0 };
  if (target.isUnlocked) return { success: false, updatedDistricts: districts, message: "该区块已经解锁", cost: 0 };

  if (playerBalance < target.unlockCostISC) {
    return { success: false, updatedDistricts: districts, message: `ISC 余额不足，解锁需要 ${target.unlockCostISC} ISC`, cost: target.unlockCostISC };
  }
  if (playerPopulation < target.requiredPopulation) {
    return { success: false, updatedDistricts: districts, message: `城市人口未达标，解锁需要人口达到 ${target.requiredPopulation} 人`, cost: target.unlockCostISC };
  }

  const updatedDistricts = districts.map((d) => (d.id === districtId ? { ...d, isUnlocked: true, prosperity: Math.max(d.prosperity, 50) } : d));
  return { success: true, updatedDistricts, message: `成功解锁 ${target.name}！`, cost: target.unlockCostISC };
}
