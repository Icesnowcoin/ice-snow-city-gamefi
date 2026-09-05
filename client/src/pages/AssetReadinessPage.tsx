import { AlertTriangle, Box, ChevronLeft, CircleCheck, PackageOpen } from "lucide-react";
import { Link } from "wouter";
import { AssetReadinessPanel } from "@/components/AssetReadinessPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CORE_ASSET_MANIFEST } from "@/lib/assetManifest";
import { isAssetRuntimeReady } from "@/lib/assetReadiness";
import { evaluateAssetDeliveryGate, summarizeAssetDeliveryGate } from "@/lib/assetDeliveryGate";

const EXTERNAL_RELEASE_GATES = [
  {
    title: "真实 GLB / PBR 资产",
    status: "pending-import",
    detail: "等待美术文件、哈希、网格、骨骼、LOD、碰撞体和动画验收。",
  },
  {
    title: "iOS / Android 真机性能",
    status: "pending-device",
    detail: "等待真实设备或设备云回填 baseline/snow 的 FPS、P95、掉帧率和渲染器。",
  },
  {
    title: "GitHub Token 轮换",
    status: "pending-account-action",
    detail: "需要账户所有者撤销旧 Token；请勿在聊天或代码中提交新秘钥。",
  },
] as const;

export default function AssetReadinessPage() {
  const readyCount = CORE_ASSET_MANIFEST.filter(isAssetRuntimeReady).length;
  const pendingCount = CORE_ASSET_MANIFEST.length - readyCount;
  const deliverySummary = summarizeAssetDeliveryGate(evaluateAssetDeliveryGate(CORE_ASSET_MANIFEST));

  return (
    <main className="min-h-full overflow-y-auto bg-[#0F1419] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-cyan-300/70">
              <Box className="h-4 w-4" aria-hidden="true" />
              3D / PBR 调试入口
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">资产就绪与运行时验收</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              这里仅展示已登记资产的真实验收状态。待美术交付 GLB、PBR、LOD、碰撞体和动画文件前，系统不会把元数据标记为可运行。
            </p>
          </div>
          <Button asChild variant="outline" className="border-white/15 bg-white/[0.04] text-slate-100 hover:bg-white/10">
            <Link href="/game"><ChevronLeft className="mr-2 h-4 w-4" />返回游戏</Link>
          </Button>
        </div>

        <AssetReadinessPanel title="核心资产门禁总览" />

        <Card className="border-white/10 bg-slate-950/70 text-white">
          <CardHeader>
            <CardTitle className="text-base">真实交付证据状态</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-amber-300/20 bg-amber-300/5 p-3"><p className="text-xs text-slate-400">待提交证据</p><p className="mt-1 text-xl font-semibold text-amber-200">{deliverySummary.pendingEvidence}</p></div>
            <div className="rounded-lg border border-red-300/20 bg-red-300/5 p-3"><p className="text-xs text-slate-400">规格不合格</p><p className="mt-1 text-xl font-semibold text-red-200">{deliverySummary.rejected}</p></div>
            <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/5 p-3"><p className="text-xs text-slate-400">当前状态</p><p className="mt-1 text-xl font-semibold text-cyan-200">{deliverySummary.ready ? "可验收" : "未完成"}</p></div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-950/70 text-white">
          <CardHeader>
            <CardTitle className="text-base">外部发布门禁</CardTitle>
            <p className="text-sm font-normal leading-6 text-slate-400">以下状态只能由真实交付、真机采样或账户侧安全操作推进；占位模型和软件基线不会自动解除门禁。</p>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {EXTERNAL_RELEASE_GATES.map((gate) => (
              <div key={gate.status} className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-amber-100">{gate.title}</p>
                  <Badge variant="outline" className="border-amber-300/40 text-[10px] text-amber-200">{gate.status}</Badge>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-300">{gate.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-950/70 text-white">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">已登记资产清单</CardTitle>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Badge variant="outline" className="border-emerald-300/40 text-emerald-200">{readyCount} 可运行</Badge>
              <Badge variant="outline" className="border-amber-300/40 text-amber-200">{pendingCount} 待导入</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CORE_ASSET_MANIFEST.map((asset) => {
                const ready = isAssetRuntimeReady(asset);
                return (
                  <div key={asset.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{asset.displayName}</p>
                        <p className="mt-1 font-mono text-[10px] text-slate-500">{asset.id}</p>
                        <p className="mt-1 text-xs text-slate-400">{asset.kind} · {asset.textureResolution} · {asset.lodRequired ? "LOD" : "无 LOD"}</p>
                      </div>
                      {ready ? <CircleCheck className="h-5 w-5 text-emerald-300" aria-label="可运行" /> : <PackageOpen className="h-5 w-5 text-amber-300" aria-label="待导入" />}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      {ready ? <><CircleCheck className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" /><span className="text-emerald-200">可运行</span></> : <><AlertTriangle className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" /><span className="text-amber-200">待导入真实文件</span></>}
                      {asset.baselineGlbUrl ? <Badge variant="outline" className="border-sky-300/40 text-[10px] text-sky-200">开发基线可预览</Badge> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <p className="pb-4 text-center text-xs text-slate-500">验收标准：GLB/glTF 2.0、PBR 贴图、LOD、碰撞体、30 FPS 动画和纹理预算均需有真实文件证据。</p>
      </div>
    </main>
  );
}
