import type { ReactNode } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNetworkMode } from "@/contexts/NetworkModeContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function MainnetReadOnlyTooltip({ children }: { children: ReactNode }) {
  const { lang } = useLanguage();
  const { isMainnetReadOnly } = useNetworkMode();
  const zh = lang === "zh";

  if (!isMainnetReadOnly) return <>{children}</>;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0} className="inline-flex w-full" data-testid="mainnet-read-only-tooltip-trigger">
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" align="center" className="max-w-[19rem] border-rose-300/30 bg-slate-950 text-xs leading-relaxed text-rose-50">
          <p className="font-semibold">{zh ? "主网只读预览" : "Mainnet read-only preview"}</p>
          <p className="mt-1">{zh ? "当前仅供查看，真实交易尚未开放；不会签名、支付 Gas 或提交链上交易。预计开放时间：完成第三方审计、测试网演练、真实资产和生产基础设施验收后再评估。" : "Preview only. Live trading is not open; no signing, gas payment, or on-chain submission occurs. Availability will be evaluated after the third-party audit, testnet rehearsal, real assets, and production infrastructure gates are complete."}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
