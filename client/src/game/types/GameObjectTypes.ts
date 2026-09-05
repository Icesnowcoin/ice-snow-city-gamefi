/**
 * 游戏对象属性和类型定义系统
 */

/**
 * 游戏对象类型
 */
export type GameObjectType = 'building' | 'vegetation' | 'terrain';

/**
 * 建筑类型
 */
export type BuildingType = 'farmhouse' | 'greenhouse' | 'grain_dryer' | 'storage' | 'windmill' | 'tool_shed' | 'city_core' | 'bank' | 'commercial_center' | 'residential_service' | 'production_hub' | 'quest_hall' | 'guild_hall' | 'logistics_terminal';

/**
 * 植被类型
 */
export type VegetationType = 'wheat_field' | 'fruit_tree' | 'bush' | 'flower' | 'irrigation_channel';

/**
 * 建筑状态
 */
export interface BuildingState {
  health: number; // 0-100
  productivity: number; // 0-100
  workers: number;
  capacity: number;
  lastMaintenance: Date;
  nextMaintenance: Date;
}

/**
 * 植被状态
 */
export interface VegetationState {
  health: number; // 0-100
  growth: number; // 0-100 (生长进度)
  moisture: number; // 0-100 (水分)
  nutrients: number; // 0-100 (养分)
  harvestReady: boolean;
}

/**
 * 基础游戏对象属性
 */
export interface GameObjectBase {
  id: string;
  name: string;
  type: GameObjectType;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  color: { r: number; g: number; b: number };
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 建筑对象属性
 */
export interface Building extends GameObjectBase {
  type: 'building';
  buildingType: BuildingType;
  size: { width: number; height: number; depth: number };
  owner?: string;
  constructionCost: number;
  maintenanceCost: number;
  state: BuildingState;
  production?: {
    type: string;
    amount: number;
    rate: number; // 单位时间产量
  };
  storage?: {
    capacity: number;
    current: number;
    items: StorageItem[];
  };
}

/**
 * 植被对象属性
 */
export interface Vegetation extends GameObjectBase {
  type: 'vegetation';
  vegetationType: VegetationType;
  area?: number; // 面积（平方米）
  state: VegetationState;
  yield?: {
    type: string;
    amount: number;
    harvestTime: Date;
  };
  waterRequirement: number; // 每天需水量
  sunlight: number; // 0-100
  temperature: number; // 摄氏度
}

/**
 * 存储物品
 */
export interface StorageItem {
  id: string;
  name: string;
  quantity: number;
  weight: number;
  value: number;
}

/**
 * 游戏对象统计信息
 */
export interface GameObjectStats {
  totalBuildings: number;
  totalVegetation: number;
  totalWorkers: number;
  totalProduction: number;
  totalStorage: number;
  averageHealth: number;
}

/**
 * 建筑详细信息
 */
export interface BuildingDetails {
  name: string;
  type: BuildingType;
  description: string;
  size: string;
  color: string;
  health: number;
  productivity: number;
  workers: number;
  capacity: number;
  constructionCost: number;
  maintenanceCost: number;
  production?: {
    type: string;
    amount: number;
    rate: string;
  };
  storage?: {
    capacity: number;
    current: number;
    percentage: number;
  };
  lastMaintenance: string;
  nextMaintenance: string;
}

/**
 * 植被详细信息
 */
export interface VegetationDetails {
  name: string;
  type: VegetationType;
  description: string;
  area: string;
  color: string;
  health: number;
  growth: number;
  moisture: number;
  nutrients: number;
  harvestReady: boolean;
  yield?: {
    type: string;
    amount: string;
    harvestTime: string;
  };
  waterRequirement: string;
  sunlight: number;
  temperature: string;
}

/**
 * 建筑类型配置
 */
export const BUILDING_CONFIGS: Record<BuildingType, {
  name: string;
  description: string;
  icon: string;
  color: string;
  defaultCapacity: number;
  defaultCost: number;
}> = {
  farmhouse: {
    name: '农舍',
    description: '传统农业建筑，农民的居住和工作场所',
    icon: '🏠',
    color: '棕色',
    defaultCapacity: 5,
    defaultCost: 1000,
  },
  greenhouse: {
    name: '现代温室',
    description: '配备先进设施的温室，支持四季种植',
    icon: '🌿',
    color: '浅蓝色',
    defaultCapacity: 100,
    defaultCost: 5000,
  },
  grain_dryer: {
    name: '谷物烘干机',
    description: '用于干燥和储存谷物的专业设备',
    icon: '🌾',
    color: '灰色',
    defaultCapacity: 500,
    defaultCost: 3000,
  },
  storage: {
    name: '冷库/仓库',
    description: '大型冷库，用于长期储存农产品',
    icon: '📦',
    color: '白色',
    defaultCapacity: 1000,
    defaultCost: 8000,
  },
  windmill: {
    name: '风车',
    description: '传统风车，农业的标志性建筑',
    icon: '💨',
    color: '棕色',
    defaultCapacity: 200,
    defaultCost: 2000,
  },
  tool_shed: {
    name: '农具棚',
    description: '存放农具和小型设备的棚子',
    icon: '🔧',
    color: '深棕色',
    defaultCapacity: 50,
    defaultCost: 500,
  },
  city_core: {
    name: '城市核心广场',
    description: '冰雪都市的出生点、主线任务与全局导航中心',
    icon: '❄️',
    color: '冰蓝色',
    defaultCapacity: 1000,
    defaultCost: 0,
  },
  bank: {
    name: 'ISC 银行总部',
    description: '提供余额、存取款、利息与资产管理服务',
    icon: '🏦',
    color: '深蓝金色',
    defaultCapacity: 500,
    defaultCost: 250000,
  },
  commercial_center: {
    name: '鸿运商都',
    description: '商品交易、订单撮合与 NFT 市场的城市商业中心',
    icon: '🏬',
    color: '冰晶紫色',
    defaultCapacity: 800,
    defaultCost: 180000,
  },
  residential_service: {
    name: '瑞景华府服务中心',
    description: '管理玩家住宅、房产升级与城市居住服务',
    icon: '🏘️',
    color: '雪白暖金',
    defaultCapacity: 300,
    defaultCost: 120000,
  },
  production_hub: {
    name: '丰盈智造园',
    description: '连接建设、生产、加工与收益产出的现代园区',
    icon: '🏭',
    color: '生产青绿',
    defaultCapacity: 600,
    defaultCost: 200000,
  },
  quest_hall: {
    name: '荣耀任务大厅',
    description: '承接主线任务、每日任务与城市事件',
    icon: '🏛️',
    color: '任务金色',
    defaultCapacity: 250,
    defaultCost: 80000,
  },
  guild_hall: {
    name: '同心会馆',
    description: '提供工会、组队、好友与公共社交服务',
    icon: '🤝',
    color: '社交蓝紫',
    defaultCapacity: 400,
    defaultCost: 100000,
  },
  logistics_terminal: {
    name: '鸿运物流枢纽',
    description: '管理仓储、运输、冷链与城市供应链',
    icon: '🚚',
    color: '物流橙色',
    defaultCapacity: 900,
    defaultCost: 150000,
  },
};

/**
 * 植被类型配置
 */
export const VEGETATION_CONFIGS: Record<VegetationType, {
  name: string;
  description: string;
  icon: string;
  color: string;
  growthTime: number; // 天数
  waterRequirement: number; // 升/天
}> = {
  wheat_field: {
    name: '麦田',
    description: '种植小麦的农田，是主要粮食作物',
    icon: '🌾',
    color: '金黄色',
    growthTime: 60,
    waterRequirement: 50,
  },
  fruit_tree: {
    name: '果树',
    description: '各种果树，产出多种水果',
    icon: '🌳',
    color: '绿色',
    growthTime: 180,
    waterRequirement: 30,
  },
  bush: {
    name: '灌木丛',
    description: '灌木植被，提供生物多样性',
    icon: '🌱',
    color: '深绿色',
    growthTime: 90,
    waterRequirement: 20,
  },
  flower: {
    name: '花朵',
    description: '各种花卉，美化环境',
    icon: '🌸',
    color: '多彩',
    growthTime: 45,
    waterRequirement: 15,
  },
  irrigation_channel: {
    name: '灌溉渠',
    description: '用于灌溉的水渠系统',
    icon: '💧',
    color: '蓝色',
    growthTime: 0,
    waterRequirement: 0,
  },
};

/**
 * 创建默认建筑对象
 */
export function createDefaultBuilding(
  id: string,
  name: string,
  buildingType: BuildingType,
  position: { x: number; y: number; z: number }
): Building {
  const config = BUILDING_CONFIGS[buildingType];
  return {
    id,
    name,
    type: 'building',
    buildingType,
    position,
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    color: { r: 0.5, g: 0.5, b: 0.5 },
    description: config.description,
    createdAt: new Date(),
    updatedAt: new Date(),
    size: { width: 20, height: 15, depth: 25 },
    constructionCost: config.defaultCost,
    maintenanceCost: config.defaultCost * 0.1,
    state: {
      health: 100,
      productivity: 80,
      workers: 2,
      capacity: config.defaultCapacity,
      lastMaintenance: new Date(),
      nextMaintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  };
}

/**
 * 创建默认植被对象
 */
export function createDefaultVegetation(
  id: string,
  name: string,
  vegetationType: VegetationType,
  position: { x: number; y: number; z: number }
): Vegetation {
  const config = VEGETATION_CONFIGS[vegetationType];
  return {
    id,
    name,
    type: 'vegetation',
    vegetationType,
    position,
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    color: { r: 0.5, g: 0.5, b: 0.5 },
    description: config.description,
    createdAt: new Date(),
    updatedAt: new Date(),
    area: 100,
    state: {
      health: 85,
      growth: 60,
      moisture: 75,
      nutrients: 80,
      harvestReady: false,
    },
    waterRequirement: config.waterRequirement,
    sunlight: 90,
    temperature: 22,
  };
}
