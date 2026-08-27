import { FormEvent, useMemo, useState } from "react";
import { Gift, Megaphone, Send, ShieldAlert, UserPlus } from "lucide-react";

import { ISCAmount } from "@/components/ISCLogo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type SocialActionPanelFees = {
  giftServiceFee: number;
  invitationFee: number;
  reportFee: number;
  treasuryPercentage: number;
  marketingPercentage: number;
};

type TargetPlayer = {
  id: number;
  displayName: string;
  avatarUrl?: string | null;
};

type ActionPayload = {
  targetUserId: number;
  idempotencyKey: string;
};

export type SocialActionPanelProps = {
  target: TargetPlayer;
  availableIsc: number;
  fees: SocialActionPanelFees;
  onGift: (payload: ActionPayload & { amount: number; message?: string }) => Promise<void> | void;
  onInvite: (payload: ActionPayload & { message?: string }) => Promise<void> | void;
  onReport: (payload: ActionPayload & { reason: string }) => Promise<void> | void;
  disabled?: boolean;
  language?: "zh" | "en";
};

type ActionName = "gift" | "invite" | "report";

function createIdempotencyKey(action: ActionName, targetUserId: number) {
  const suffix = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  return `social_${action}_${targetUserId}_${suffix}`.slice(0, 128);
}

function positiveInteger(value: string) {
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount > 0 ? amount : 0;
}

export function SocialActionPanel({
  target,
  availableIsc,
  fees,
  onGift,
  onInvite,
  onReport,
  disabled = false,
  language = "zh",
}: SocialActionPanelProps) {
  const isZh = language === "zh";
  const [giftAmount, setGiftAmount] = useState("1000");
  const [giftMessage, setGiftMessage] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [activeAction, setActiveAction] = useState<ActionName | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const normalizedGiftAmount = positiveInteger(giftAmount);
  const giftTotal = normalizedGiftAmount + fees.giftServiceFee;
  const giftCanSubmit = normalizedGiftAmount > 0 && giftTotal <= availableIsc;
  const allocation = useMemo(() => {
    const preview = (grossAmount: number) => ({
      treasury: Math.floor((grossAmount * fees.treasuryPercentage) / 100),
      marketing: grossAmount - Math.floor((grossAmount * fees.treasuryPercentage) / 100),
    });
    return {
      gift: preview(fees.giftServiceFee),
      invite: preview(fees.invitationFee),
      report: preview(fees.reportFee),
    };
  }, [fees]);

  const runAction = async (action: ActionName, task: () => Promise<void> | void) => {
    setActiveAction(action);
    setFeedback(null);
    try {
      await task();
      setFeedback({ type: "success", text: isZh ? "请求已提交" : "Request submitted" });
      if (action === "report") setReportReason("");
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : isZh ? "请求失败，请稍后重试" : "Request failed. Please try again.",
      });
    } finally {
      setActiveAction(null);
    }
  };

  const submitGift = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!giftCanSubmit || disabled) return;
    void runAction("gift", () =>
      onGift({
        targetUserId: target.id,
        amount: normalizedGiftAmount,
        message: giftMessage.trim() || undefined,
        idempotencyKey: createIdempotencyKey("gift", target.id),
      }),
    );
  };

  const submitInvite = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled || activeAction) return;
    void runAction("invite", () =>
      onInvite({
        targetUserId: target.id,
        message: inviteMessage.trim() || undefined,
        idempotencyKey: createIdempotencyKey("invite", target.id),
      }),
    );
  };

  const submitReport = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled || !reportReason.trim() || activeAction) return;
    void runAction("report", () =>
      onReport({
        targetUserId: target.id,
        reason: reportReason.trim(),
        idempotencyKey: createIdempotencyKey("report", target.id),
      }),
    );
  };

  const splitPreview = (gross: number, parts: { treasury: number; marketing: number }) =>
    gross > 0 ? (
      <p className="text-xs text-muted-foreground">
        {isZh ? "服务费分账" : "Service fee split"}：{parts.treasury.toLocaleString()} ISC / {parts.marketing.toLocaleString()} ISC
      </p>
    ) : null;

  return (
    <Card className="w-full border-cyan-500/20 bg-slate-950/70 text-slate-100 shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-cyan-500/15 ring-1 ring-cyan-400/30">
            {target.avatarUrl ? <img src={target.avatarUrl} alt="" className="h-full w-full object-cover" /> : <span className="text-lg font-semibold">{target.displayName.slice(0, 1).toUpperCase()}</span>}
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-base">{isZh ? `与 ${target.displayName} 互动` : `Interact with ${target.displayName}`}</CardTitle>
            <p className="text-xs text-slate-400">{isZh ? "余额" : "Balance"} <ISCAmount amount={availableIsc.toLocaleString()} size="sm" /></p>
          </div>
          <Badge variant="outline" className="border-cyan-400/40 text-cyan-200">ISC</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {feedback && <div role="status" className={`rounded-md border px-3 py-2 text-sm ${feedback.type === "success" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-rose-400/30 bg-rose-400/10 text-rose-200"}`}>{feedback.text}</div>}

        <form onSubmit={submitGift} className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <div className="flex items-center gap-2 text-sm font-medium"><Gift className="h-4 w-4 text-pink-300" />{isZh ? "赠送 ISC" : "Send ISC"}</div>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <div>
              <Label htmlFor="gift-amount" className="sr-only">{isZh ? "赠送金额" : "Gift amount"}</Label>
              <Input id="gift-amount" inputMode="numeric" value={giftAmount} onChange={(event) => setGiftAmount(event.target.value.replace(/[^0-9]/g, ""))} className="border-slate-700 bg-slate-950" aria-describedby="gift-preview" />
            </div>
            <Button type="submit" disabled={disabled || !giftCanSubmit || Boolean(activeAction)}><Send className="mr-1 h-4 w-4" />{activeAction === "gift" ? (isZh ? "提交中" : "Sending") : isZh ? "赠送" : "Send"}</Button>
          </div>
          <Textarea value={giftMessage} onChange={(event) => setGiftMessage(event.target.value.slice(0, 120))} placeholder={isZh ? "留言（可选）" : "Message (optional)"} className="min-h-16 border-slate-700 bg-slate-950" />
          <p id="gift-preview" className="text-xs text-muted-foreground">{isZh ? "预计扣除" : "Estimated debit"} {giftTotal.toLocaleString()} ISC{fees.giftServiceFee > 0 ? `（含服务费 ${fees.giftServiceFee.toLocaleString()}）` : ""}。</p>
          {splitPreview(fees.giftServiceFee, allocation.gift)}
          {!giftCanSubmit && normalizedGiftAmount > 0 && <p className="text-xs text-rose-300">{isZh ? "余额不足或金额无效" : "Insufficient balance or invalid amount"}</p>}
        </form>

        <form onSubmit={submitInvite} className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <div className="flex items-center gap-2 text-sm font-medium"><UserPlus className="h-4 w-4 text-cyan-300" />{isZh ? "发送邀请" : "Send invitation"}</div>
          <Textarea value={inviteMessage} onChange={(event) => setInviteMessage(event.target.value.slice(0, 120))} placeholder={isZh ? "邀请留言（可选）" : "Invitation note (optional)"} className="min-h-16 border-slate-700 bg-slate-950" />
          <div className="flex items-center justify-between gap-3"><div>{fees.invitationFee > 0 ? <><p className="text-xs text-muted-foreground">{isZh ? "邀请费用" : "Invitation fee"}：{fees.invitationFee.toLocaleString()} ISC</p>{splitPreview(fees.invitationFee, allocation.invite)}</> : <p className="text-xs text-muted-foreground">{isZh ? "当前无需支付邀请服务费" : "No invitation service fee"}</p>}</div><Button type="submit" variant="outline" disabled={disabled || Boolean(activeAction) || fees.invitationFee > availableIsc}><Megaphone className="mr-1 h-4 w-4" />{activeAction === "invite" ? (isZh ? "提交中" : "Sending") : isZh ? "邀请" : "Invite"}</Button></div>
        </form>

        <form onSubmit={submitReport} className="space-y-2 rounded-lg border border-rose-950/60 bg-rose-950/10 p-3">
          <div className="flex items-center gap-2 text-sm font-medium"><ShieldAlert className="h-4 w-4 text-rose-300" />{isZh ? "举报玩家" : "Report player"}</div>
          <Textarea required value={reportReason} onChange={(event) => setReportReason(event.target.value.slice(0, 300))} placeholder={isZh ? "请描述具体原因" : "Describe the reason"} className="min-h-16 border-slate-700 bg-slate-950" />
          <div className="flex items-center justify-between gap-3"><p className="text-xs text-muted-foreground">{fees.reportFee > 0 ? `${isZh ? "处理费用" : "Processing fee"}：${fees.reportFee.toLocaleString()} ISC` : isZh ? "举报不会展示虚假处理结果" : "No fake moderation result is shown"}</p><Button type="submit" variant="outline" disabled={disabled || Boolean(activeAction) || !reportReason.trim() || fees.reportFee > availableIsc}>{activeAction === "report" ? (isZh ? "提交中" : "Submitting") : isZh ? "提交举报" : "Report"}</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}

export default SocialActionPanel;
