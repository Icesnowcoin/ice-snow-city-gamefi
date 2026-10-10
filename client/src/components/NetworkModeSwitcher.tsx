import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, FlaskConical, Globe2, Loader2, Mail, Send, Share2, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNetworkMode } from "@/contexts/NetworkModeContext";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

type NetworkMode = "testnet" | "mainnet";

export function NetworkModeSwitcher() {
  const { lang } = useLanguage();
  const zh = lang === "zh";
  const { mode, isMainnetReadOnly, setMode } = useNetworkMode();
  const [open, setOpen] = useState(false);
  const [mainnetAcknowledged, setMainnetAcknowledged] = useState(isMainnetReadOnly);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showShareButton, setShowShareButton] = useState(false);
  const subscribe = trpc.launchNotifications.subscribe.useMutation({
    onSuccess: (result) => {
      setSubscriptionMessage(zh ? (result.alreadySubscribed ? "该邮箱已订阅更新。" : "订阅成功；正式上线时将按计划通知。") : (result.alreadySubscribed ? "This email is already subscribed." : "Subscribed. We will notify you when launch updates are available."));
      setShowConfetti(!result.alreadySubscribed);
      setShowShareButton(!result.alreadySubscribed);
      setEmail("");
    },
    onError: (error) => {
      setShowShareButton(false);
      setSubscriptionMessage(zh ? `订阅失败：${error.message}` : `Subscription failed: ${error.message}`);
    },
  });

  useEffect(() => {
    if (!showConfetti) return;
    const timer = window.setTimeout(() => setShowConfetti(false), 1800);
    return () => window.clearTimeout(timer);
  }, [showConfetti]);

  const handleSubscribe = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubscriptionMessage(null);
    setShowShareButton(false);
    if (!consent) {
      setSubscriptionMessage(zh ? "请先确认仅用于接收主网上线通知。" : "Confirm that this email is used only for mainnet launch updates.");
      return;
    }
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setSubscriptionMessage(zh ? "请输入有效邮箱地址。" : "Enter a valid email address.");
      return;
    }
    subscribe.mutate({ email: normalized });
  };

  const selectMode = (nextMode: NetworkMode) => {
    if (nextMode === "mainnet") {
      const confirmed = window.confirm(
        zh
          ? "主网模式当前仅提供只读预览。真实合约尚未完成第三方审计，继续不会自动发起任何链上写入。是否继续？"
          : "Mainnet mode is read-only preview only. Production contracts are not third-party audited, and this action will not initiate an on-chain write. Continue?",
      );
      if (!confirmed) return;
      setMainnetAcknowledged(true);
    } else {
      setMainnetAcknowledged(false);
    }

    setMode(nextMode);
  };

  const testnet = mode === "testnet";
  return (
    <div className="relative" data-testid="network-mode-switcher">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="network-mode-panel"
        aria-label={zh ? `网络模式：${testnet ? "测试网" : "主网"}` : `Network mode: ${testnet ? "Testnet" : "Mainnet"}`}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80",
          testnet
            ? "border-amber-300/30 bg-amber-400/10 text-amber-100 hover:bg-amber-400/20"
            : "border-rose-300/35 bg-rose-400/10 text-rose-100 hover:bg-rose-400/20",
        )}
        data-testid="network-mode-trigger"
      >
        {testnet ? <FlaskConical className="h-4 w-4" aria-hidden="true" /> : <Globe2 className="h-4 w-4" aria-hidden="true" />}
        <span>{testnet ? (zh ? "测试网" : "Testnet") : (zh ? "主网" : "Mainnet")}</span>
        <span className="hidden text-[10px] opacity-75 sm:inline">{testnet ? "31337/97" : "56"}</span>
      </button>

      {open && (
        <div id="network-mode-panel" role="dialog" aria-label={zh ? "网络模式设置" : "Network mode settings"} className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-cyan-300/20 bg-slate-950/95 p-3 text-slate-100 shadow-2xl backdrop-blur" data-testid="network-mode-panel">
          <div className="mb-3 flex items-start gap-2">
            {testnet ? <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-300" aria-hidden="true" /> : <AlertTriangle className="mt-0.5 h-4 w-4 text-rose-300" aria-hidden="true" />}
            <div>
              <p className="text-sm font-semibold">{zh ? "运行网络" : "Runtime network"}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-300" role="status" aria-live="polite">
                {testnet
                  ? (zh ? "受控演示模式：使用 local-hardhat / 测试网数据，Draft 合约保持只读，不会使用真实资金。" : "Controlled demo: local-hardhat / testnet data only. Draft contracts remain read-only and use no real funds.")
                  : (zh ? "主网只读预览：合约尚未完成第三方审计，真实写入功能保持关闭。" : "Mainnet read-only preview: contracts are not third-party audited and real writes remain disabled.")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2" role="group" aria-label={zh ? "选择网络模式" : "Choose network mode"}>
            <button type="button" onClick={() => selectMode("testnet")} aria-pressed={testnet} className={cn("rounded-lg border px-2 py-2 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80", testnet ? "border-amber-300/60 bg-amber-400/15 text-amber-100" : "border-slate-700 text-slate-400 hover:border-cyan-300/40")} data-testid="network-mode-testnet">
              <span className="block font-semibold">{zh ? "测试网" : "Testnet"}</span><span className="mt-1 block opacity-75">chainId 31337 / 97</span>
            </button>
            <button type="button" onClick={() => selectMode("mainnet")} aria-pressed={!testnet} className={cn("rounded-lg border px-2 py-2 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/80", !testnet ? "border-rose-300/60 bg-rose-400/15 text-rose-100" : "border-slate-700 text-slate-400 hover:border-rose-300/40")} data-testid="network-mode-mainnet">
              <span className="block font-semibold">{zh ? "主网（只读）" : "Mainnet (read-only)"}</span><span className="mt-1 block opacity-75">chainId 56</span>
            </button>
          </div>
          <div className="mt-3 rounded-lg border border-cyan-300/15 bg-cyan-400/5 px-2.5 py-2 text-[11px] text-cyan-100" data-testid="network-mode-safety-note">
            {mainnetAcknowledged && !testnet ? (zh ? "已确认主网只读预览；切换不会签名、支付 Gas 或提交交易。" : "Mainnet read-only preview acknowledged; switching does not sign, pay gas, or submit transactions.") : (zh ? "安全默认：测试网模式。切换前请确认当前网络和资产环境。" : "Safe default: testnet mode. Confirm the network and asset environment before switching.")}
          </div>
          {!testnet && (
            <form className="relative mt-3 space-y-2 rounded-lg border border-rose-300/20 bg-rose-400/5 p-2.5" onSubmit={handleSubscribe} data-testid="launch-notification-subscription">
              {showConfetti && <span className="launch-confetti" data-testid="launch-confetti" aria-hidden="true">{Array.from({ length: 10 }, (_, index) => <i key={index} className="launch-confetti-piece" style={{ "--confetti-index": index } as React.CSSProperties} />)}</span>}
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-100"><Mail className="h-3.5 w-3.5" aria-hidden="true" />{zh ? "订阅上线更新" : "Subscribe to launch updates"}</div>
              <p className="text-[11px] leading-relaxed text-slate-300">{zh ? "仅用于主网正式上线通知；当前不会发送营销邮件，也不代表上线日期已确定。" : "Used only for mainnet launch updates; no marketing email is sent now, and no launch date is promised."}</p>
              <div className="flex items-start gap-1.5 text-[10px] leading-relaxed text-slate-300"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 accent-rose-300" aria-label={zh ? "确认订阅用途" : "Confirm subscription purpose"} disabled={subscribe.isPending} /><span>{zh ? "我同意仅接收主网上线通知。" : "I agree to receive mainnet launch updates only."}</span></div>
              <div className="flex gap-2">
                <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={zh ? "输入邮箱地址" : "Email address"} aria-label={zh ? "上线通知邮箱" : "Launch notification email"} className="h-8 min-w-0 border-white/10 bg-black/20 text-xs text-white placeholder:text-slate-500" disabled={subscribe.isPending} />
                <Button type="submit" size="sm" className="h-8 shrink-0 bg-rose-300 px-2.5 text-[11px] text-slate-950 hover:bg-rose-200" disabled={subscribe.isPending} aria-busy={subscribe.isPending} aria-label={subscribe.isPending ? (zh ? "订阅提交中" : "Submitting subscription") : (zh ? "订阅更新" : "Subscribe to updates")} data-testid="launch-notification-submit">{subscribe.isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /><span className="sr-only">{zh ? "订阅提交中" : "Submitting subscription"}</span></> : (zh ? "订阅" : "Subscribe")}</Button>
              </div>
              <p className="text-[10px] leading-relaxed text-slate-400" data-testid="launch-notification-privacy">{zh ? "隐私保护：邮箱仅用于主网上线通知，不用于其他用途。" : "Privacy: your email is used only for mainnet launch notifications and no other purpose."}</p>
              {subscriptionMessage && <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center" data-testid="launch-notification-feedback"><p className="flex min-w-0 flex-1 items-start gap-1 text-[11px] leading-relaxed text-rose-100" role="status" aria-live="polite" data-testid="launch-notification-status">{subscriptionMessage.startsWith(zh ? "订阅成功" : "Subscribed") || subscriptionMessage.includes(zh ? "已订阅" : "already subscribed") ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" aria-hidden="true" /> : null}{subscriptionMessage}</p>{showShareButton && <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"><Button type="button" size="sm" variant="outline" className="group min-h-9 w-full shrink-0 justify-center border-sky-200/30 bg-sky-300/10 px-2 text-[10px] text-sky-100 transition-[transform,background-color,box-shadow] duration-150 ease-out hover:bg-sky-200/20 hover:shadow-[0_0_16px_rgba(125,211,252,0.28)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-sky-200/80 motion-safe:hover:scale-[1.02] sm:h-7 sm:min-h-0 sm:w-auto" aria-label={zh ? "分享到 Twitter" : "Share on Twitter"} data-testid="launch-notification-share" onClick={() => { const shareText = zh ? "我已加入 Ice Snow City 主网上线通知，先来体验建设商业帝国的冰雪都市！立即进入游戏：" : "I joined the Ice Snow City mainnet launch updates—come build a frozen commercial empire with me! Enter the game:"; const gameUrl = new URL("/game", window.location.origin).toString(); const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(gameUrl)}`; window.open(shareUrl, "_blank", "noopener,noreferrer"); }}><Share2 className="mr-1 h-3 w-3 transition-transform duration-150 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />{zh ? "分享到 Twitter" : "Share on Twitter"}</Button><Button type="button" size="sm" variant="outline" className="group min-h-9 w-full shrink-0 justify-center border-cyan-200/30 bg-cyan-300/10 px-2 text-[10px] text-cyan-100 transition-[transform,background-color,box-shadow] duration-150 ease-out hover:bg-cyan-200/20 hover:shadow-[0_0_16px_rgba(103,232,249,0.28)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-cyan-200/80 motion-safe:hover:scale-[1.02] sm:h-7 sm:min-h-0 sm:w-auto" aria-label={zh ? "分享到 Telegram" : "Share on Telegram"} data-testid="launch-notification-share-telegram" onClick={() => { const shareText = zh ? "我已加入 Ice Snow City 主网上线通知，先来体验建设商业帝国的冰雪都市！立即进入游戏：" : "I joined the Ice Snow City mainnet launch updates—come build a frozen commercial empire with me! Enter the game:"; const gameUrl = new URL("/game", window.location.origin).toString(); const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(gameUrl)}&text=${encodeURIComponent(shareText)}`; window.open(shareUrl, "_blank", "noopener,noreferrer"); }}><Send className="mr-1 h-3 w-3 transition-transform duration-150 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />{zh ? "分享到 Telegram" : "Share on Telegram"}</Button></div>}</div>}
            </form>
          )}
        </div>
      )}
    </div>
  );
}
