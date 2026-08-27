import { useMemo, useState } from 'react';
import { ArrowRight, BriefcaseBusiness, Factory, Fuel, Leaf, Pickaxe, Trees, Truck, UserRound, WalletCards } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  calculateJobPayout,
  calculateUtilityBill,
  DEFAULT_SUPPLY_CHAIN,
  getCareerProgress,
  getNodeStatus,
  getNodeUtilization,
  summarizeSupplyChain,
  type SupplyChainNode,
  type SupplyChainSnapshot,
} from '@/lib/supplyChainUtils';

interface SupplyChainDashboardProps {
  snapshot?: SupplyChainSnapshot;
  careerExperience?: number;
  hourlySalary?: number;
  onStartWork?: (hours: number) => void;
}

const nodeIconMap = {
  greenhouse: Leaf,
  farm_stall: Factory,
  logistics_center: Truck,
  mine: Pickaxe,
  logging_camp: Trees,
  market: Factory,
  player_job: UserRound,
} as const;

function getNodeTone(node: SupplyChainNode): string {
  const status = getNodeStatus(node);
  if (status === 'offline') return 'border-slate-400 bg-slate-100 text-slate-600';
  if (status === 'warning') return 'border-amber-400 bg-amber-50 text-amber-900';
  return 'border-emerald-400 bg-emerald-50 text-emerald-900';
}

function getEdgeColor(status: 'flowing' | 'blocked'): string {
  return status === 'flowing' ? '#34d399' : '#f59e0b';
}

export function SupplyChainDashboard({
  snapshot = DEFAULT_SUPPLY_CHAIN,
  careerExperience = 0,
  hourlySalary = 80,
  onStartWork,
}: SupplyChainDashboardProps) {
  const [selectedNodeId, setSelectedNodeId] = useState(snapshot.nodes[0]?.id ?? '');
  const [workHours, setWorkHours] = useState(8);
  const [workStarted, setWorkStarted] = useState(false);

  const summary = useMemo(() => summarizeSupplyChain(snapshot), [snapshot]);
  const career = useMemo(() => getCareerProgress(careerExperience), [careerExperience]);
  const estimatedUtilityBill = calculateUtilityBill({ electricity: 12, water: 8, gas: 3 });
  const estimatedPayout = calculateJobPayout(hourlySalary, workHours, estimatedUtilityBill);
  const selectedNode = snapshot.nodes.find((node) => node.id === selectedNodeId) ?? snapshot.nodes[0];

  const handleStartWork = () => {
    setWorkStarted(true);
    onStartWork?.(workHours);
  };

  return (
    <section className="space-y-4" aria-labelledby="supply-chain-dashboard-title">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600">ICE SNOW CITY · PHASE 73</p>
          <h2 id="supply-chain-dashboard-title" className="text-2xl font-bold tracking-tight">城市供应链与岗位中枢</h2>
          <p className="text-sm text-muted-foreground">追踪从生产、物流到居民消费的资源流，并查看当前职业成长状态。</p>
        </div>
        <Badge variant="outline" className="w-fit border-cyan-200 bg-cyan-50 text-cyan-800">
          <Truck className="mr-1 h-3.5 w-3.5" /> 实时前端态势
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">运行节点</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{summary.activeNodes}</p>
            <p className="text-xs text-muted-foreground">个节点正常运转</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">预警节点</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">{summary.warningNodes}</p>
            <p className="text-xs text-muted-foreground">需要补充产能或维护</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">流动线路</p>
            <p className="mt-1 text-2xl font-bold text-cyan-600">{summary.flowingEdges}</p>
            <p className="text-xs text-muted-foreground">条物流线路运行中</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">本期流量</p>
            <p className="mt-1 text-2xl font-bold text-violet-600">{summary.totalVolume}</p>
            <p className="text-xs text-muted-foreground">单位货物/劳务</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-slate-950 text-white">
            <CardTitle className="flex items-center gap-2 text-base"><Factory className="h-4 w-4 text-cyan-300" /> 生产与物流网络</CardTitle>
            <CardDescription className="text-slate-300">点击节点查看产能、状态与当前输出。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <div className="relative aspect-[16/9] min-h-[280px] overflow-hidden rounded-xl border border-slate-200 bg-[radial-gradient(circle_at_30%_20%,rgba(186,230,253,0.75),transparent_35%),linear-gradient(135deg,#f8fafc,#e0f2fe)]" role="group" aria-label="供应链节点网络图">
              <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {snapshot.edges.map((edge) => {
                  const from = snapshot.nodes.find((node) => node.id === edge.from);
                  const to = snapshot.nodes.find((node) => node.id === edge.to);
                  if (!from || !to) return null;
                  return <line key={edge.id} x1={from.position.x} y1={from.position.y} x2={to.position.x} y2={to.position.y} stroke={getEdgeColor(edge.status)} strokeWidth="0.8" strokeDasharray={edge.status === 'blocked' ? '2 2' : undefined} opacity="0.8" />;
                })}
              </svg>
              {snapshot.nodes.map((node) => {
                const Icon = nodeIconMap[node.type];
                const selected = node.id === selectedNode?.id;
                return (
                  <button
                    key={node.id}
                    type="button"
                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 px-2 py-1.5 text-left shadow-sm transition hover:-translate-y-[55%] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${getNodeTone(node)} ${selected ? 'ring-2 ring-cyan-500 ring-offset-2' : ''}`}
                    style={{ left: `${node.position.x}%`, top: `${node.position.y}%` }}
                    onClick={() => setSelectedNodeId(node.id)}
                    aria-pressed={selected}
                    aria-label={`${node.label}，${getNodeUtilization(node)}% 产能利用率`}
                  >
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold whitespace-nowrap"><Icon className="h-3.5 w-3.5" />{node.label}</span>
                    <span className="mt-0.5 block text-[10px] opacity-75">{getNodeUtilization(node)}% · {node.outputLabel}</span>
                  </button>
                );
              })}
            </div>

            {selectedNode && (
              <div className="rounded-lg border border-cyan-100 bg-cyan-50/60 p-3" aria-live="polite">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{selectedNode.icon} {selectedNode.label}</p>
                    <p className="text-xs text-muted-foreground">当前输出 {selectedNode.currentOutput} / {selectedNode.capacity} · {selectedNode.outputLabel}</p>
                  </div>
                  <Badge className={getNodeStatus(selectedNode) === 'warning' ? 'bg-amber-500' : 'bg-emerald-600'}>{getNodeStatus(selectedNode) === 'warning' ? '需要关注' : '运行正常'}</Badge>
                </div>
                <Progress value={getNodeUtilization(selectedNode)} className="mt-3 h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><BriefcaseBusiness className="h-4 w-4 text-violet-600" /> 职业成长</CardTitle>
              <CardDescription>职业等级随经验积累逐步晋升。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">当前身份</span><Badge className="bg-violet-600">{career.tier}</Badge></div>
              <Progress value={career.progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground"><span>{career.progress}% 晋升进度</span><span>{career.nextTier ? `下一阶段：${career.nextTier}` : '已达最高阶段'}</span></div>
              <div className="rounded-lg bg-slate-50 p-3 text-sm"><p className="font-medium">岗位状态</p><p className="mt-1 text-muted-foreground">可从劳务中心选择生产、物流或服务类岗位。</p></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><WalletCards className="h-4 w-4 text-emerald-600" /> 工作收益估算</CardTitle>
              <CardDescription>用于前端预览，实际开始/完成工作仍走 Job API。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="block text-sm font-medium" htmlFor="supply-work-hours">工作时长：{workHours} 小时</label>
              <input id="supply-work-hours" type="range" min={1} max={24} value={workHours} onChange={(event) => setWorkHours(Number(event.target.value))} className="w-full accent-cyan-600" />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md bg-emerald-50 p-2"><p className="text-xs text-muted-foreground">预计工资</p><p className="font-semibold text-emerald-700">{hourlySalary * workHours} ISC</p></div>
                <div className="rounded-md bg-amber-50 p-2"><p className="text-xs text-muted-foreground"><Fuel className="mr-1 inline h-3.5 w-3.5" />估算公用事业费</p><p className="font-semibold text-amber-700">-{estimatedUtilityBill} ISC</p></div>
              </div>
              <div className="flex items-center justify-between border-t pt-3"><span className="text-sm font-medium">预计净收益</span><span className="text-lg font-bold text-cyan-700">{estimatedPayout} ISC</span></div>
              <Button type="button" className="w-full" onClick={handleStartWork} disabled={workStarted}>
                {workStarted ? '岗位已提交 · 等待 Job API' : '选择该工时并开始工作'}
                {!workStarted && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

export default SupplyChainDashboard;
