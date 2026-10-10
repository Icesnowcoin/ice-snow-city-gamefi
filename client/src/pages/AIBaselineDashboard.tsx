import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Gauge,
  Info,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BASELINE_ASSETS,
  BASELINE_CHECK_LABELS,
  DASHBOARD_META,
  PERFORMANCE_SNAPSHOTS,
  getAssetStatus,
  getCheckCounts,
  type BaselineAssetSnapshot,
  type BaselineCheckStatus,
} from "@/lib/aiBaselineDashboardData";
import { buildBaselineCsv, buildBaselinePdf, downloadBlob } from "@/lib/aiBaselineDashboardExport";

const STATUS_FILTERS: Array<{ value: "all" | BaselineCheckStatus; label: string }> = [
  { value: "all", label: "全部资产" },
  { value: "pending", label: "待补证据" },
  { value: "warning", label: "有警告" },
  { value: "pass", label: "自动化通过" },
  { value: "fail", label: "失败" },
];

const CHECK_ORDER = Object.keys(BASELINE_CHECK_LABELS) as Array<keyof typeof BASELINE_CHECK_LABELS>;

const statusConfig: Record<BaselineCheckStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  pass: { label: "通过", className: "border-emerald-300/30 bg-emerald-300/10 text-emerald-200", icon: CheckCircle2 },
  warning: { label: "警告", className: "border-amber-300/30 bg-amber-300/10 text-amber-200", icon: AlertTriangle },
  pending: { label: "待补证据", className: "border-slate-300/20 bg-slate-300/10 text-slate-300", icon: Clock3 },
  fail: { label: "失败", className: "border-red-300/30 bg-red-300/10 text-red-200", icon: XCircle },
};

function StatusBadge({ status }: { status: BaselineCheckStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={`gap-1 text-[10px] ${config.className}`}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {config.label}
    </Badge>
  );
}

function MetricCard({ label, value, detail, tone = "cyan", icon: Icon }: { label: string; value: string | number; detail: string; tone?: "cyan" | "emerald" | "amber" | "slate"; icon: typeof Gauge }) {
  const toneClasses = {
    cyan: "border-cyan-300/20 bg-cyan-300/[0.06] text-cyan-100",
    emerald: "border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-100",
    amber: "border-amber-300/20 bg-amber-300/[0.06] text-amber-100",
    slate: "border-white/10 bg-white/[0.03] text-slate-100",
  }[tone];
  return (
    <Card className={`border ${toneClasses}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{label}</p>
          <Icon className="h-4 w-4 opacity-80" aria-hidden="true" />
        </div>
        <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-slate-400">{detail}</p>
      </CardContent>
    </Card>
  );
}

function CheckMatrix({ assets }: { assets: BaselineAssetSnapshot[] }) {
  const matrix = CHECK_ORDER.map((key) => {
    const checks = assets.flatMap((asset) => asset.checks.filter((check) => check.key === key));
    return {
      key,
      label: BASELINE_CHECK_LABELS[key],
      pass: checks.filter((check) => check.status === "pass").length,
      warning: checks.filter((check) => check.status === "warning").length,
      pending: checks.filter((check) => check.status === "pending").length,
      fail: checks.filter((check) => check.status === "fail").length,
    };
  });

  return (
    <Card className="border-white/10 bg-slate-950/70 text-white">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base">自动化测试验证矩阵</CardTitle>
          <p className="mt-1 text-xs leading-5 text-slate-400">每格以 8 个 baseline 资产为统计范围；“待补证据”不是失败，也不能被解释为高保真通过。</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-300" />通过</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-400" />待补证据</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-[680px] w-full text-left text-xs">
            <thead className="bg-white/[0.04] text-slate-400">
              <tr>
                <th className="px-3 py-3 font-medium">测试项</th>
                <th className="px-3 py-3 font-medium">通过</th>
                <th className="px-3 py-3 font-medium">警告</th>
                <th className="px-3 py-3 font-medium">待补证据</th>
                <th className="px-3 py-3 font-medium">失败</th>
                <th className="px-3 py-3 font-medium">解释</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {matrix.map((row) => (
                <tr key={row.key} className="hover:bg-white/[0.025]">
                  <td className="px-3 py-3 font-medium text-slate-100">{row.label}</td>
                  <td className="px-3 py-3 text-emerald-200">{row.pass}</td>
                  <td className="px-3 py-3 text-amber-200">{row.warning}</td>
                  <td className="px-3 py-3 text-slate-300">{row.pending}</td>
                  <td className="px-3 py-3 text-red-200">{row.fail}</td>
                  <td className="px-3 py-3 text-slate-400">{row.key === "performance" ? "CI 软件样本通过；真机仍 pending" : row.pending ? "需要真实文件或引擎证据" : "自动化检查已完成"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function PerformanceTrend() {
  const trendData = PERFORMANCE_SNAPSHOTS.map((snapshot) => ({
    name: "当前样本",
    "Baseline FPS": snapshot.baselineFps,
    "Snow FPS": snapshot.snowFps,
    "Baseline P95(ms)": snapshot.baselineP95Ms,
    "Snow P95(ms)": snapshot.snowP95Ms,
  }));

  return (
    <Card className="border-white/10 bg-slate-950/70 text-white">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">性能趋势 · CI 软件样本</CardTitle>
            <p className="mt-1 text-xs leading-5 text-slate-400">当前快照来自 `ci-software`；不存在真实设备型号、内存或 Draw Call 结论。</p>
          </div>
          <Badge variant="outline" className="border-cyan-300/30 bg-cyan-300/10 text-[10px] text-cyan-200">realDeviceEvidenceRequired = true</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="h-64 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="fps" domain={[0, 70]} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="ms" orientation="right" domain={[0, 40]} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <ChartTooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(148,163,184,0.24)", borderRadius: 12, color: "#f8fafc" }} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#cbd5e1" }} />
              <Line yAxisId="fps" type="monotone" dataKey="Baseline FPS" stroke="#67e8f9" strokeWidth={3} dot={{ r: 4, fill: "#67e8f9" }} />
              <Line yAxisId="fps" type="monotone" dataKey="Snow FPS" stroke="#fbbf24" strokeWidth={3} dot={{ r: 4, fill: "#fbbf24" }} />
              <Line yAxisId="ms" type="monotone" dataKey="Baseline P95(ms)" stroke="#a7f3d0" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: "#a7f3d0" }} />
              <Line yAxisId="ms" type="monotone" dataKey="Snow P95(ms)" stroke="#fca5a5" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: "#fca5a5" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/[0.06] p-3"><p className="text-xs text-slate-400">Snow FPS</p><p className="mt-1 text-xl font-semibold text-emerald-100">{PERFORMANCE_SNAPSHOTS[0].snowFps}</p><p className="mt-1 text-[11px] text-slate-400">开发阈值 ≥ 45</p></div>
          <div className="rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-3"><p className="text-xs text-slate-400">Snow P95</p><p className="mt-1 text-xl font-semibold text-amber-100">{PERFORMANCE_SNAPSHOTS[0].snowP95Ms} ms</p><p className="mt-1 text-[11px] text-slate-400">开发阈值 ≤ 33 ms</p></div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><p className="text-xs text-slate-400">掉帧率变化</p><p className="mt-1 text-xl font-semibold text-slate-100">+{(PERFORMANCE_SNAPSHOTS[0].droppedFrameDelta * 100).toFixed(1)}%</p><p className="mt-1 text-[11px] text-slate-400">仅限 CI 软件样本</p></div>
        </div>
      </CardContent>
    </Card>
  );
}

function AssetDetail({ asset }: { asset: BaselineAssetSnapshot }) {
  const status = getAssetStatus(asset);
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-slate-100">{asset.displayName}</p>
          <p className="mt-1 font-mono text-[10px] text-slate-500">{asset.assetId}</p>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-400 sm:grid-cols-4">
        <span><b className="block text-slate-200">{asset.bytes.toLocaleString()}</b>bytes</span>
        <span><b className="block text-slate-200">{asset.trianglesLod0.toLocaleString()}</b>LOD0 tris</span>
        <span><b className="block text-slate-200">{asset.materials}</b>材质</span>
        <span><b className="block text-slate-200">{asset.lodCount}</b>LOD 层级</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {asset.checks.map((check) => <StatusBadge key={check.key} status={check.status} />)}
      </div>
      {asset.warnings.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/[0.06] p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-amber-100"><TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />当前说明</div>
          <ul className="mt-2 space-y-1 text-[11px] leading-5 text-amber-50/75">
            {asset.warnings.map((warning) => <li key={warning}>· {warning}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function AIBaselineDashboard() {
  const [statusFilter, setStatusFilter] = useState<"all" | BaselineCheckStatus>("all");
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);
  const [query, setQuery] = useState("");
  const counts = getCheckCounts(BASELINE_ASSETS);
  const filteredAssets = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return BASELINE_ASSETS.filter((asset) => {
      const matchesStatus = statusFilter === "all" || getAssetStatus(asset) === statusFilter;
      const matchesQuery = !normalized || `${asset.displayName} ${asset.assetId} ${asset.kind}`.toLowerCase().includes(normalized);
      return matchesStatus && matchesQuery;
    });
  }, [query, statusFilter]);

  const exportInput = useMemo(() => ({
    assets: filteredAssets,
    performance: PERFORMANCE_SNAPSHOTS,
    meta: DASHBOARD_META,
  }), [filteredAssets]);

  const handleExport = (format: "csv" | "pdf") => {
    setExporting(format);
    window.setTimeout(() => {
      const stamp = new Date().toISOString().slice(0, 10);
      if (format === "csv") {
        downloadBlob(new Blob([buildBaselineCsv(exportInput)], { type: "text/csv;charset=utf-8" }), `ice-snow-city-ai-baseline-${stamp}.csv`);
      } else {
        downloadBlob(new Blob([buildBaselinePdf(exportInput)], { type: "application/pdf" }), `ice-snow-city-ai-baseline-${stamp}.pdf`);
      }
      setExporting(null);
    }, 0);
  };

  return (
    <main className="min-h-full overflow-y-auto bg-[#0a1222] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="relative overflow-hidden rounded-2xl border border-cyan-300/15 bg-gradient-to-br from-[#102949] via-[#0b1730] to-[#07101e] p-5 shadow-[0_20px_80px_rgba(14,165,233,0.12)] sm:p-7">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.22em] text-cyan-200/75"><Sparkles className="h-4 w-4" aria-hidden="true" />AI Generated Baseline / QA Observatory</div>
              <h1 className="max-w-3xl text-2xl font-semibold tracking-tight text-white sm:text-4xl">AI 基线资产质量仪表盘</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">集中查看程序化开发替代资产的自动化测试、性能趋势和待补证据项。此页面是开发 QA 观察站，不是高保真资产批准页。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="border-white/15 bg-white/[0.04] text-slate-100 hover:bg-white/10"><Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4" />返回管理台</Link></Button>
              <Button variant="outline" className="border-white/15 bg-white/[0.04] text-slate-100 hover:bg-white/10" onClick={() => handleExport("csv")} disabled={exporting !== null}><FileCheck2 className="mr-2 h-4 w-4" />{exporting === "csv" ? "生成 CSV…" : "导出 CSV"}</Button>
              <Button variant="outline" className="border-white/15 bg-white/[0.04] text-slate-100 hover:bg-white/10" onClick={() => handleExport("pdf")} disabled={exporting !== null}><FileCheck2 className="mr-2 h-4 w-4" />{exporting === "pdf" ? "生成 PDF…" : "导出 PDF"}</Button>
              <Button variant="outline" className="border-cyan-300/25 bg-cyan-300/[0.08] text-cyan-100 hover:bg-cyan-300/15" onClick={() => window.location.reload()}><RefreshCw className="mr-2 h-4 w-4" />刷新快照</Button>
            </div>
          </div>
          <div className="relative mt-6 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <Badge variant="outline" className="border-cyan-300/30 bg-cyan-300/10 text-cyan-200">{DASHBOARD_META.source}</Badge>
            <Badge variant="outline" className="border-amber-300/30 bg-amber-300/10 text-amber-200">{DASHBOARD_META.highFidelityDelivery}</Badge>
            <span>最后验证：{DASHBOARD_META.lastValidated}</span>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="质量总览">
          <MetricCard label="资产总数" value={BASELINE_ASSETS.length} detail="8 个开发替代 GLB" tone="cyan" icon={FileCheck2} />
          <MetricCard label="自动化通过" value={`${counts.pass}/${counts.total}`} detail="GLB 完整性 + CI 软件性能" tone="emerald" icon={ShieldCheck} />
          <MetricCard label="待补证据" value={counts.pending} detail="不代表失败，也不代表高保真" tone="amber" icon={Clock3} />
          <MetricCard label="真实外部阻塞" value={DASHBOARD_META.externalPendingCount} detail="资产 / 真机 / 账户侧 pending" tone="slate" icon={LockKeyhole} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <CheckMatrix assets={BASELINE_ASSETS} />
          <Card className="border-amber-300/20 bg-amber-300/[0.05] text-white">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Info className="h-4 w-4 text-amber-200" aria-hidden="true" />证据边界</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-slate-300">
              <p>当前所有资产保持 <code className="rounded bg-black/30 px-1.5 py-0.5 text-xs text-cyan-200">procedural-baseline</code>，GLB 文件校验通过仅代表文件可被基础工具读取。</p>
              <p>当前性能指标来自 <code className="rounded bg-black/30 px-1.5 py-0.5 text-xs text-cyan-200">ci-software</code>，尚未采集 iOS/Android 真机 FPS、P95 帧时间、内存和 Draw Calls。</p>
              <div className="rounded-xl border border-amber-200/20 bg-black/15 p-3 text-xs text-amber-100">自动化通过 ≠ 高保真通过。只有真实 GLB/PBR/LOD/碰撞/动画、授权记录和真机证据完整后，才允许申请 verified。</div>
            </CardContent>
          </Card>
        </section>

        <PerformanceTrend />

        <Card className="border-white/10 bg-slate-950/70 text-white">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div><CardTitle className="text-base">资产明细与测试状态</CardTitle><p className="mt-1 text-xs text-slate-400">点击筛选可聚焦待补证据或自动化通过的资产；导出按钮会使用当前筛选结果。</p></div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="sr-only" htmlFor="baseline-asset-search">搜索资产</label>
              <input id="baseline-asset-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索资产名称或 ID" className="h-10 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none ring-offset-slate-950 placeholder:text-slate-500 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/20" />
              <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-white/10 bg-white/[0.03] p-1" role="group" aria-label="资产状态筛选">
                <SlidersHorizontal className="mx-2 h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
                {STATUS_FILTERS.map((filter) => <button key={filter.value} type="button" aria-pressed={statusFilter === filter.value} onClick={() => setStatusFilter(filter.value)} className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs transition-colors ${statusFilter === filter.value ? "bg-cyan-300/15 text-cyan-100" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}>{filter.label}</button>)}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredAssets.length > 0 ? <div className="grid gap-3 lg:grid-cols-2">{filteredAssets.map((asset) => <AssetDetail key={asset.assetId} asset={asset} />)}</div> : <div className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-400">没有匹配的 baseline 资产。</div>}
          </CardContent>
        </Card>

        <footer className="flex flex-col gap-2 border-t border-white/10 pb-3 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>报告状态：analyzer {DASHBOARD_META.analyzerStatus} · {DASHBOARD_META.analyzerSampleCount} samples</span><span>真实证据要求：{DASHBOARD_META.realDeviceEvidenceRequired ? "是" : "否"}</span></footer>
      </div>
    </main>
  );
}
