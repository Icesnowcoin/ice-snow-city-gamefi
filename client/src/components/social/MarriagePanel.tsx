import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export type MarriageStatus = "single" | "proposed" | "married";

export interface MarriageProfile {
  status: MarriageStatus;
  spouseName?: string;
  proposalFrom?: string;
  marriedAt?: string;
}

interface MarriagePanelProps {
  profile: MarriageProfile;
  onPropose?: (targetName: string) => void | Promise<void>;
  onRespond?: (accepted: boolean) => void | Promise<void>;
  onInteract?: (action: "message" | "visit") => void;
  onDivorce?: () => void | Promise<void>;
  isProcessing?: boolean;
}

export function MarriagePanel({
  profile,
  onPropose,
  onRespond,
  onInteract,
  onDivorce,
  isProcessing = false,
}: MarriagePanelProps) {
  const [targetName, setTargetName] = useState("");
  const canPropose = profile.status === "single" && targetName.trim().length > 0;
  const statusLabel = profile.status === "married" ? "已婚" : profile.status === "proposed" ? "待处理求婚" : "单身";

  return (
    <Card className="border-cyan-500/20 bg-slate-900/80 text-white">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>婚姻与伴侣</CardTitle>
            <CardDescription className="text-slate-400">状态来自真实资料，不在此组件内生成关系数据。</CardDescription>
          </div>
          <Badge variant="outline" className="border-cyan-400/50 text-cyan-200">{statusLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {profile.status === "married" && profile.spouseName ? (
          <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-800/70 p-4">
            <div>
              <p className="text-xs text-slate-400">配偶</p>
              <p className="text-lg font-semibold">{profile.spouseName}</p>
              {profile.marriedAt ? <p className="text-xs text-slate-400">结婚日期：{profile.marriedAt}</p> : null}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" disabled={!onInteract || isProcessing} onClick={() => onInteract?.("message")}>联系配偶</Button>
              <Button variant="outline" disabled={!onInteract || isProcessing} onClick={() => onInteract?.("visit")}>访问空间</Button>
            </div>
            <Button variant="destructive" className="w-full" disabled={!onDivorce || isProcessing} onClick={() => onDivorce?.()}>申请离婚</Button>
          </div>
        ) : null}

        {profile.status === "proposed" && profile.proposalFrom ? (
          <div className="space-y-3 rounded-lg border border-amber-400/30 bg-amber-950/20 p-4">
            <p><span className="text-slate-400">来自</span> {profile.proposalFrom} <span className="text-slate-400">的求婚</span></p>
            <div className="grid grid-cols-2 gap-2">
              <Button disabled={!onRespond || isProcessing} onClick={() => onRespond?.(true)}>接受</Button>
              <Button variant="outline" disabled={!onRespond || isProcessing} onClick={() => onRespond?.(false)}>拒绝</Button>
            </div>
          </div>
        ) : null}

        {profile.status === "single" ? (
          <div className="space-y-3">
            <label htmlFor="marriage-target" className="text-sm font-medium">对玩家发起求婚</label>
            <div className="flex gap-2">
              <Input id="marriage-target" value={targetName} onChange={(event) => setTargetName(event.target.value)} placeholder="输入玩家名称" disabled={isProcessing} />
              <Button disabled={!canPropose || !onPropose || isProcessing} onClick={() => onPropose?.(targetName.trim())}>求婚</Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
