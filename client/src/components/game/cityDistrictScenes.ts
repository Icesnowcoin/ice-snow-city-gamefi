export type DistrictId = 'commercial' | 'civic' | 'residential' | 'production' | 'finance' | 'agriculture';
export type DistrictHotspot = { id: string; name: string; type: string; activity: string; x: number; y: number; scale: number };
export type DistrictScene = { id: DistrictId; title: string; subtitle: string; baseImage: string; hotspots: readonly DistrictHotspot[] };

// All regions share the same day/night tint and local-lamp layer. Replace only the one baseImage per region.
export const CITY_DISTRICTS: readonly DistrictScene[] = [
  {
    id: 'commercial', title: '现代冰雪商业街', subtitle: '步行街 · 店铺与生活服务', baseImage: '/manus-storage/street-winter-day-mobile_0409a790.webp',
    hotspots: [
      { id: 'cafe', name: '雪栖咖啡', type: '餐饮', activity: '一杯热饮，歇一歇再逛街。', x: 14, y: 45, scale: 1 },
      { id: 'grocery', name: '暖邻便利', type: '民生零售', activity: '选购日常食品与冬季生活用品。', x: 34, y: 39, scale: .82 },
      { id: 'market', name: '鸿运商都', type: '商业中心', activity: '走访街区商户，了解今日营业状况。', x: 50, y: 30, scale: .72 },
      { id: 'bank', name: '城市银行', type: '生活服务', activity: '查看这座城市的日常金融服务。', x: 72, y: 39, scale: .82 },
      { id: 'bookshop', name: '冬日书店', type: '文化零售', activity: '浏览新到的城市生活读物。', x: 88, y: 45, scale: 1 },
    ],
  },
  {
    id: 'civic', title: '城市核心广场', subtitle: '公共服务 · 市民活动', baseImage: '/manus-storage/civic-plaza-mobile_107ba088.webp',
    hotspots: [
      { id: 'hall', name: '城市政务厅', type: '公共服务', activity: '了解城市建设与公共服务。', x: 50, y: 31, scale: .76 },
      { id: 'library', name: '公共图书馆', type: '文化', activity: '浏览馆藏与本地生活信息。', x: 22, y: 42, scale: .9 },
      { id: 'transit', name: '公交站', type: '出行', activity: '查看本地公共交通站点。', x: 80, y: 44, scale: .92 },
    ],
  },
  {
    id: 'residential', title: '瑞景住宅区', subtitle: '社区生活 · 居民服务', baseImage: '/manus-storage/residential-neighborhood-mobile_4413bdc6.webp',
    hotspots: [
      { id: 'housing', name: '瑞景公寓', type: '住宅', activity: '查看街区住户与住宅运营。', x: 20, y: 42, scale: .9 },
      { id: 'community', name: '社区服务站', type: '社区', activity: '了解社区公共活动。', x: 50, y: 33, scale: .75 },
      { id: 'bakery', name: '街角面包房', type: '餐饮', activity: '看看今日新鲜出炉的面包。', x: 83, y: 44, scale: .94 },
    ],
  },
  {
    id: 'production', title: '丰盈生产园', subtitle: '制造工坊 · 物流供应', baseImage: '/manus-storage/production-yard-mobile_3e0617c7.webp',
    hotspots: [
      { id: 'workshop', name: '食品加工坊', type: '生产', activity: '了解本地物资加工流程。', x: 26, y: 39, scale: .88 },
      { id: 'warehouse', name: '城市仓库', type: '物流', activity: '查看本区物资储备。', x: 75, y: 39, scale: .88 },
    ],
  },
  {
    id: 'finance', title: '金融服务区', subtitle: '银行网点 · 办事中心', baseImage: '/manus-storage/finance-quarter-mobile_dcde78ab.webp',
    hotspots: [
      { id: 'bank-office', name: '城市银行网点', type: '银行服务', activity: '了解居民日常银行服务。', x: 50, y: 32, scale: .78 },
      { id: 'service', name: '办事中心', type: '公共服务', activity: '了解办事窗口开放信息。', x: 18, y: 42, scale: .9 },
      { id: 'office', name: '商务办公楼', type: '办公', activity: '走访这座城市的企业。', x: 82, y: 41, scale: .9 },
    ],
  },
  {
    id: 'agriculture', title: '冬季农业基地', subtitle: '温室种植 · 城市供应', baseImage: '/manus-storage/agriculture-greenhouses-mobile_5a342d51.webp',
    hotspots: [
      { id: 'greenhouse', name: '冬季温室', type: '农业生产', activity: '了解本地耐寒蔬菜的生长状况。', x: 22, y: 43, scale: .9 },
      { id: 'irrigation', name: '灌溉设施', type: '农业服务', activity: '检查温室的用水供应。', x: 50, y: 32, scale: .78 },
      { id: 'shed', name: '农用物资站', type: '农业物流', activity: '查看种植园的日常物资。', x: 78, y: 43, scale: .9 },
    ],
  },
] as const;

export const DISTRICT_BY_ID = Object.fromEntries(CITY_DISTRICTS.map((district) => [district.id, district])) as Record<DistrictId, DistrictScene>;
