import { Building2, Gamepad2, PackageCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Legacy route compatibility page.
 *
 * Land, buildings, environments and gameplay inventory are deliberately not
 * NFTs. The former wallet/Seaport trading implementation is retained only as
 * historical code and is not reachable from the game flow.
 */
export default function TradingCenter() {
  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center p-6">
      <Card className="w-full border-cyan-300/20 bg-slate-950/80 shadow-2xl shadow-cyan-950/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-cyan-200">
            <Gamepad2 className="h-6 w-6" />
            游戏内资产中心
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-sm text-slate-300">
          <p className="text-base leading-7 text-slate-100">
            Ice Snow City 已停止土地、建筑、环境和背包物品的 NFT 铸造、挂单与链上转移。
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-cyan-300/15 bg-cyan-400/5 p-3">
              <Building2 className="mb-2 h-5 w-5 text-cyan-300" />
              <strong className="block text-slate-100">城市建设</strong>
              <span>由游戏内升级和生产系统管理</span>
            </div>
            <div className="rounded-lg border border-cyan-300/15 bg-cyan-400/5 p-3">
              <PackageCheck className="mb-2 h-5 w-5 text-cyan-300" />
              <strong className="block text-slate-100">背包物品</strong>
              <span>仅属于当前游戏会话和账户存档</span>
            </div>
            <div className="rounded-lg border border-cyan-300/15 bg-cyan-400/5 p-3">
              <Gamepad2 className="mb-2 h-5 w-5 text-cyan-300" />
              <strong className="block text-slate-100">资源循环</strong>
              <span>通过生产、收取和维护获得资源</span>
            </div>
          </div>
          <p className="border-l-2 border-amber-300/70 pl-3 text-amber-100/90">
            钱包签名验证仍可在钱包授权页使用，仅用于验证地址控制权；土地、建筑和物品不再铸造、挂单或进行 NFT 交易。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
