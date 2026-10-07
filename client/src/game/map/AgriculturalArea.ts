export type AgriculturalAreaStatus = 'growing' | 'ready' | 'resting';

export type AgriculturalArea = {
  id: string;
  name: string;
  crop: string;
  status: AgriculturalAreaStatus;
  progress: number;
  yieldAmount: number;
  yieldUnit: string;
  waterUsage: number;
  temperature: string;
  caretaker: string;
  position: { x: number; z: number };
  description: string;
};

export const AGRICULTURAL_AREAS: AgriculturalArea[] = [
  {
    id: 'agri-aurora-field',
    name: '瑞景丰收田',
    crop: '冰晶小麦',
    status: 'growing',
    progress: 68,
    yieldAmount: 240,
    yieldUnit: 'kg / 周期',
    waterUsage: 18,
    temperature: '-4°C',
    caretaker: '晨曦农务组',
    position: { x: -72, z: -34 },
    description: '城市北侧的耐寒粮食示范区，采用雪水循环灌溉。',
  },
  {
    id: 'agri-crystal-market-field',
    name: '鸿运温室园',
    crop: '极光蔬菜',
    status: 'ready',
    progress: 100,
    yieldAmount: 180,
    yieldUnit: '箱 / 周期',
    waterUsage: 12,
    temperature: '2°C',
    caretaker: '鸿运温室组',
    position: { x: 8, z: -28 },
    description: '商业区旁的高效温室，优先供应城市商业中心。',
  },
  {
    id: 'agri-frost-factory-field',
    name: '丰盈试验农场',
    crop: '霜线莓果',
    status: 'resting',
    progress: 24,
    yieldAmount: 96,
    yieldUnit: '箱 / 周期',
    waterUsage: 8,
    temperature: '-1°C',
    caretaker: '丰盈研发组',
    position: { x: 74, z: -12 },
    description: '生产区东侧的新品种试验田，当前处于轮作休整阶段。',
  },
];

export function getAgriculturalArea(id: string): AgriculturalArea | undefined {
  return AGRICULTURAL_AREAS.find((area) => area.id === id);
}
