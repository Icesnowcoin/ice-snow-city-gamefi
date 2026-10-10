import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export interface PrivateSpaceData {
  spaceName: string;
  description: string;
  accessList: string[];
  furniture: Array<{ furnitureId: string; name: string }>;
  decorations: string[];
  photos: string[];
}

interface PrivateSpacePanelProps {
  space?: PrivateSpaceData | null;
  currentPlayerId: string;
  onAddFurniture?: (name: string) => void | Promise<void>;
  onAddDecoration?: (name: string) => void | Promise<void>;
  onInvite?: (playerId: string) => void | Promise<void>;
  isProcessing?: boolean;
}

export function PrivateSpacePanel({ space, currentPlayerId, onAddFurniture, onAddDecoration, onInvite, isProcessing = false }: PrivateSpacePanelProps) {
  const [furnitureName, setFurnitureName] = useState("");
  const [decorationName, setDecorationName] = useState("");
  const [invitePlayerId, setInvitePlayerId] = useState("");

  if (!space) {
    return <Card className="border-slate-700 bg-slate-900/80 text-slate-300"><CardContent className="p-6">暂无私密空间资料。完成真实婚姻/空间服务初始化后，此处将显示空间内容。</CardContent></Card>;
  }

  const canManage = space.accessList.includes(currentPlayerId);
  const submit = (value: string, callback?: (name: string) => void | Promise<void>, clear?: (value: string) => void) => {
    if (!value.trim() || !callback) return;
    void callback(value.trim());
    clear?.("");
  };

  return (
    <Card className="border-cyan-500/20 bg-slate-900/80 text-white">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div><CardTitle>{space.spaceName}</CardTitle><CardDescription className="text-slate-400">{space.description}</CardDescription></div>
          <Badge variant="outline" className="border-cyan-400/50 text-cyan-200">{canManage ? "可访问" : "无权限"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <section aria-label="空间访问权限">
          <p className="mb-2 text-sm font-medium">访问权限</p>
          <div className="flex flex-wrap gap-2">{space.accessList.map((playerId) => <Badge key={playerId} variant="secondary">{playerId}</Badge>)}</div>
          {canManage && onInvite ? <div className="mt-3 flex gap-2"><Input aria-label="邀请玩家 ID" value={invitePlayerId} onChange={(event) => setInvitePlayerId(event.target.value)} placeholder="玩家 ID" disabled={isProcessing} /><Button disabled={!invitePlayerId.trim() || isProcessing} onClick={() => submit(invitePlayerId, onInvite, setInvitePlayerId)}>邀请</Button></div> : null}
        </section>
        <section aria-label="家具和装饰" className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-700 p-3"><p className="font-medium">家具 {space.furniture.length}</p><ul className="mt-2 text-sm text-slate-400">{space.furniture.map((item) => <li key={item.furnitureId}>{item.name}</li>)}</ul>{canManage && onAddFurniture ? <div className="mt-3 flex gap-2"><Input aria-label="家具名称" value={furnitureName} onChange={(event) => setFurnitureName(event.target.value)} placeholder="家具名称" disabled={isProcessing} /><Button disabled={!furnitureName.trim() || isProcessing} onClick={() => submit(furnitureName, onAddFurniture, setFurnitureName)}>添加</Button></div> : null}</div>
          <div className="rounded-lg border border-slate-700 p-3"><p className="font-medium">装饰 {space.decorations.length}</p><ul className="mt-2 text-sm text-slate-400">{space.decorations.map((name) => <li key={name}>{name}</li>)}</ul>{canManage && onAddDecoration ? <div className="mt-3 flex gap-2"><Input aria-label="装饰名称" value={decorationName} onChange={(event) => setDecorationName(event.target.value)} placeholder="装饰名称" disabled={isProcessing} /><Button disabled={!decorationName.trim() || isProcessing} onClick={() => submit(decorationName, onAddDecoration, setDecorationName)}>添加</Button></div> : null}</div>
        </section>
        <section aria-label="照片与访问记录"><p className="font-medium">照片 {space.photos.length}</p><p className="text-sm text-slate-400">访问记录由上层真实服务提供，当前不会生成虚构记录。</p></section>
      </CardContent>
    </Card>
  );
}
