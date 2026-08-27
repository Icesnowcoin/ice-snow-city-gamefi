import { AlertTriangle, Box, ChevronLeft, CircleCheck, PackageOpen } from "lucide-react";
import { Link } from "wouter";
import { AssetReadinessPanel } from "@/components/AssetReadinessPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CORE_ASSET_MANIFEST } from "@/lib/assetManifest";
import { isAssetRuntimeReady } from "@/lib/assetReadiness";

export default function AssetReadinessPage() {
  const readyCount = CORE_ASSET_MANIFEST.filter(isAssetRuntimeReady).length;
  const pendingCount = CORE_ASSET_MANIFEST.length - readyCount;

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
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      {ready ? <><CircleCheck className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" /><span className="text-emerald-200">可运行</span></> : <><AlertTriangle className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" /><span className="text-amber-200">待导入真实文件</span></>}
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
