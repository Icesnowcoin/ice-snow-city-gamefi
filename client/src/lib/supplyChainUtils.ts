export type SupplyNodeType =
  | 'greenhouse'
  | 'farm_stall'
  | 'logistics_center'
  | 'mine'
  | 'logging_camp'
  | 'market'
  | 'player_job';

export type SupplyNodeStatus = 'active' | 'warning' | 'offline';
export type CareerTier = '平民' | '熟练工' | '经营者' | '企业家';

export interface SupplyChainNode {
  id: string;
  type: SupplyNodeType;
  label: string;
  icon: string;
  outputLabel: string;
  capacity: number;
  currentOutput: number;
  status: SupplyNodeStatus;
  position: { x: number; y: number };
}

export interface SupplyChainEdge {
  id: string;
  from: string;
  to: string;
  commodity: string;
  volume: number;
  status: 'flowing' | 'blocked';
}

export interface SupplyChainSnapshot {
  nodes: SupplyChainNode[];
  edges: SupplyChainEdge[];
}

export interface SupplyChainSummary {
  activeNodes: number;
  warningNodes: number;
  flowingEdges: number;
  totalVolume: number;
  bottleneckNodeId?: string;
}

export interface CareerProgress {
  tier: CareerTier;
  nextTier?: CareerTier;
  progress: number;
  requiredExperience: number;
}

export interface UtilityBillInput {
  electricity: number;
  water: number;
  gas: number;
  rates?: { electricity: number; water: number; gas: number };
}

export const DEFAULT_SUPPLY_CHAIN: SupplyChainSnapshot = {
  nodes: [
    { id: 'greenhouse-1', type: 'greenhouse', label: '北区蔬菜大棚', icon: '🥬', outputLabel: '蔬菜', capacity: 120, currentOutput: 92, status: 'active', position: { x: 8, y: 28 } },
    { id: 'mine-1', type: 'mine', label: '城市采矿场', icon: '⛏️', outputLabel: '砂石/金属', capacity: 90, currentOutput: 54, status: 'active', position: { x: 8, y: 72 } },
    { id: 'logging-1', type: 'logging_camp', label: '北郊伐木场', icon: '🌲', outputLabel: '木材', capacity: 80, currentOutput: 39, status: 'warning', position: { x: 32, y: 72 } },
    { id: 'logistics-1', type: 'logistics_center', label: '中央物流中心', icon: '🚚', outputLabel: '周转货物', capacity: 260, currentOutput: 184, status: 'active', position: { x: 48, y: 48 } },
    { id: 'stall-1', type: 'farm_stall', label: '冬日集市摊贩', icon: '🧺', outputLabel: '生鲜零售', capacity: 100, currentOutput: 71, status: 'active', position: { x: 72, y: 28 } },
    { id: 'market-1', type: 'market', label: '城市生活市场', icon: '🏙️', outputLabel: '居民消费', capacity: 320, currentOutput: 220, status: 'active', position: { x: 88, y: 48 } },
    { id: 'job-1', type: 'player_job', label: '劳务中心岗位', icon: '🧑‍💼', outputLabel: '岗位服务', capacity: 60, currentOutput: 42, status: 'active', position: { x: 48, y: 18 } },
  ],
  edges: [
    { id: 'edge-greenhouse-logistics', from: 'greenhouse-1', to: 'logistics-1', commodity: '蔬菜', volume: 92, status: 'flowing' },
    { id: 'edge-mine-logistics', from: 'mine-1', to: 'logistics-1', commodity: '砂石/金属', volume: 54, status: 'flowing' },
    { id: 'edge-logging-logistics', from: 'logging-1', to: 'logistics-1', commodity: '木材', volume: 39, status: 'blocked' },
    { id: 'edge-logistics-stall', from: 'logistics-1', to: 'stall-1', commodity: '生鲜', volume: 71, status: 'flowing' },
    { id: 'edge-stall-market', from: 'stall-1', to: 'market-1', commodity: '居民商品', volume: 71, status: 'flowing' },
    { id: 'edge-jobs-logistics', from: 'job-1', to: 'logistics-1', commodity: '劳务', volume: 42, status: 'flowing' },
  ],
};

export function getNodeUtilization(node: Pick<SupplyChainNode, 'capacity' | 'currentOutput'>): number {
  if (node.capacity <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((node.currentOutput / node.capacity) * 100)));
}

export function getNodeStatus(node: Pick<SupplyChainNode, 'capacity' | 'currentOutput' | 'status'>): SupplyNodeStatus {
  if (node.status === 'offline') return 'offline';
  if (getNodeUtilization(node) >= 90 || node.status === 'warning') return 'warning';
  return 'active';
}

export function summarizeSupplyChain(snapshot: SupplyChainSnapshot): SupplyChainSummary {
  const activeNodes = snapshot.nodes.filter((node) => getNodeStatus(node) === 'active').length;
  const warningNodes = snapshot.nodes.filter((node) => getNodeStatus(node) === 'warning').length;
  const flowingEdges = snapshot.edges.filter((edge) => edge.status === 'flowing');
  const bottleneck = [...snapshot.nodes]
    .sort((a, b) => getNodeUtilization(b) - getNodeUtilization(a))
    .find((node) => getNodeStatus(node) !== 'offline');

  return {
    activeNodes,
    warningNodes,
    flowingEdges: flowingEdges.length,
    totalVolume: flowingEdges.reduce((total, edge) => total + edge.volume, 0),
    bottleneckNodeId: bottleneck?.id,
  };
}

export function getCareerProgress(experience: number): CareerProgress {
  const safeExperience = Math.max(0, experience);
  if (safeExperience >= 5000) return { tier: '企业家', progress: 100, requiredExperience: 5000 };
  if (safeExperience >= 1800) return { tier: '经营者', nextTier: '企业家', progress: Math.round(((safeExperience - 1800) / 3200) * 100), requiredExperience: 5000 };
  if (safeExperience >= 500) return { tier: '熟练工', nextTier: '经营者', progress: Math.round(((safeExperience - 500) / 1300) * 100), requiredExperience: 1800 };
  return { tier: '平民', nextTier: '熟练工', progress: Math.round((safeExperience / 500) * 100), requiredExperience: 500 };
}

export function calculateJobPayout(hourlySalary: number, hours: number, utilityBills = 0): number {
  return Math.max(0, Math.round(Math.max(0, hourlySalary) * Math.max(0, hours) - Math.max(0, utilityBills)));
}

export function calculateUtilityBill(input: UtilityBillInput): number {
  const rates = input.rates ?? { electricity: 2, water: 1, gas: 3 };
  return Math.max(0,
    Math.round(Math.max(0, input.electricity) * rates.electricity)
    + Math.round(Math.max(0, input.water) * rates.water)
    + Math.round(Math.max(0, input.gas) * rates.gas),
  );
}
