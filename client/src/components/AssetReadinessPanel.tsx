import { AlertTriangle, CheckCircle2, PackageCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildAssetReadinessReport, type AssetReadinessInput } from "@/lib/assetReadiness";

type AssetReadinessPanelProps = AssetReadinessInput & {
  title?: string;
};

export function AssetReadinessPanel({ title = "资产就绪状态", manifest, textures, animations }: AssetReadinessPanelProps) {
  const report = buildAssetReadinessReport({ manifest, textures, animations });
  const statusLabel = report.ready ? "可运行" : report.pendingAssets > 0 ? "待导入" : "需修复";
  const StatusIcon = report.ready ? CheckCircle2 : report.pendingAssets > 0 ? PackageCheck : AlertTriangle;

  return (
    <Card className="border-cyan-400/30 bg-slate-950/80 text-slate-100 shadow-[0_0_30px_rgba(34,211,238,0.12)]">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <StatusIcon className="h-5 w-5 text-cyan-300" aria-hidden="true" />
          {title}
        </CardTitle>
        <Badge variant="outline" className="border-cyan-300/50 text-cyan-100">{statusLabel}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="资产统计">
          <Stat label="资产总数" value={report.totalAssets} />
          <Stat label="可运行" value={report.runtimeReadyAssets} />
          <Stat label="待导入" value={report.pendingAssets} />
          <Stat label="动画片段" value={`${report.animationReadyClips}/${report.animationReadyClips + report.animationPendingClips}`} />
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm">
          <div className="flex items-center justify-between gap-3 text-slate-300">
            <span>纹理预算</span>
            <span className="font-mono text-cyan-200">{report.textureBytesMegabytes.toFixed(2)} MB</span>
          </div>
        </div>
        {report.blockingIssues.length > 0 ? (
          <div role="status" className="rounded-lg border border-amber-300/30 bg-amber-300/10 p-3">
            <p className="mb-2 text-sm font-medium text-amber-100">当前阻塞项</p>
            <ul className="max-h-40 space-y-1 overflow-auto text-xs text-amber-50/80">
              {report.blockingIssues.slice(0, 8).map((issue) => <li key={issue}>{issue}</li>)}
            </ul>
            {report.blockingIssues.length > 8 && <p className="mt-2 text-xs text-amber-100/70">还有 {report.blockingIssues.length - 8} 项阻塞项，请查看完整 readiness 报告。</p>}
          </div>
        ) : (
          <p className="text-sm text-emerald-200">所有已登记资产均通过当前门禁。</p>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 text-lg font-semibold text-white">{value}</p></div>;
}
