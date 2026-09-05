import { useMemo, useState } from "react";
import { Crown, Loader2, Megaphone, MessageCircle, Send, Shield, Users, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { ISCAmount, ISCLogo } from "@/components/ISCLogo";

const channels = [
  { id: "world" as const, label: "世界", icon: Megaphone, helper: "每条消息消耗 1 个喇叭" },
  { id: "guild" as const, label: "工会", icon: Shield, helper: "仅工会成员可见" },
  { id: "team" as const, label: "组队", icon: Users, helper: "队伍有效期 30 分钟" },
  { id: "private" as const, label: "私聊", icon: MessageCircle, helper: "需先支付 20,000 ISC 开通" },
];

function createIdempotencyKey(prefix: string) {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  return `${prefix}:${random}`;
}

export function SocialChatPanel() {
  const [activeChannel, setActiveChannel] = useState<(typeof channels)[number]["id"]>("world");
  const [content, setContent] = useState("");
  const [channelId, setChannelId] = useState("");
  const [recipientUserId, setRecipientUserId] = useState("");
  const [megaphoneQuantity, setMegaphoneQuantity] = useState("1");
  const [guildName, setGuildName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [friendId, setFriendId] = useState("");

  const walletQuery = trpc.social.wallet.useQuery(undefined, { refetchInterval: 10_000 });
  const balanceQuery = trpc.wallet.getBalance.useQuery(undefined, { refetchInterval: 10_000 });
  const constantsQuery = trpc.social.constants.useQuery();
  const allocationsQuery = trpc.social.allocations.useQuery(undefined, { staleTime: 30_000 });
  const utils = trpc.useUtils();

  const messagesInput = useMemo(() => ({
    channelType: activeChannel,
    channelId: activeChannel === "world" ? "world" : channelId || undefined,
    recipientUserId: activeChannel === "private" && recipientUserId ? Number(recipientUserId) : undefined,
    limit: 50,
  }), [activeChannel, channelId, recipientUserId]);

  const messagesQuery = trpc.social.messages.useQuery(messagesInput, {
    refetchInterval: 5_000,
    enabled: activeChannel === "world" || Boolean(channelId) || Boolean(recipientUserId),
  });

  const purchaseMutation = trpc.social.purchaseMegaphones.useMutation({
    onSuccess: async (result) => {
      toast.success(`已购买 ${result.charge.quantity} 个喇叭，共 ${result.charge.amount.toLocaleString()} ISC`);
      await Promise.all([walletQuery.refetch(), balanceQuery.refetch(), allocationsQuery.refetch()]);
    },
    onError: (error) => toast.error(error.message),
  });

  const sendMutation = trpc.social.sendMessage.useMutation({
    onSuccess: async () => {
      setContent("");
      await Promise.all([messagesQuery.refetch(), walletQuery.refetch(), allocationsQuery.refetch()]);
      toast.success(activeChannel === "world" ? "世界频道消息已发送，已消耗 1 个喇叭" : "消息已发送");
    },
    onError: (error) => toast.error(error.message),
  });

  const createGuildMutation = trpc.social.createGuild.useMutation({
    onSuccess: async () => {
      setGuildName("");
      toast.success("工会已创建，1,000,000 ISC 已按 60/40 规则记账");
      await Promise.all([balanceQuery.refetch(), allocationsQuery.refetch()]);
    },
    onError: (error) => toast.error(error.message),
  });
  const createTeamMutation = trpc.social.createTeam.useMutation({
    onSuccess: async (team) => {
      setTeamName("");
      toast.success(`队伍已创建，有效期至 ${new Date(team.expiresAt).toLocaleTimeString()}`);
      await Promise.all([balanceQuery.refetch(), allocationsQuery.refetch()]);
    },
    onError: (error) => toast.error(error.message),
  });
  const addFriendMutation = trpc.social.addFriend.useMutation({
    onSuccess: async () => {
      setFriendId("");
      toast.success("好友已添加，双方永久开启私聊权限");
      await Promise.all([balanceQuery.refetch(), allocationsQuery.refetch()]);
    },
    onError: (error) => toast.error(error.message),
  });

  const wallet = walletQuery.data;
  const constants = constantsQuery.data;
  const iscBalance = Number(balanceQuery.data?.iscBalance ?? 0);
  const megaphones = wallet?.megaphones ?? 0;
  const messageList = [...(messagesQuery.data ?? [])].reverse();
  const activeMeta = channels.find((channel) => channel.id === activeChannel) ?? channels[0];
  const purchaseQuantity = Math.max(1, Math.min(100, Number(megaphoneQuantity) || 1));
  const purchaseTotal = purchaseQuantity * (constants?.megaphonePrice ?? 1_000);
  const canSendWorld = activeChannel !== "world" || megaphones > 0;

  const handlePurchase = () => {
    purchaseMutation.mutate({ quantity: purchaseQuantity, idempotencyKey: createIdempotencyKey("megaphone") });
  };

  const handleCreateGuild = () => {
    if (!guildName.trim()) return toast.error("请输入工会名称");
    if (iscBalance < (constants?.guildCreationFee ?? 1_000_000)) return toast.error("ISC 余额不足，无法创建工会");
    createGuildMutation.mutate({ name: guildName.trim(), idempotencyKey: createIdempotencyKey("guild") });
  };

  const handleCreateTeam = () => {
    if (!teamName.trim()) return toast.error("请输入队伍名称");
    if (iscBalance < (constants?.teamCreationFee ?? 10_000)) return toast.error("ISC 余额不足，无法创建队伍");
    createTeamMutation.mutate({ name: teamName.trim(), idempotencyKey: createIdempotencyKey("team") });
  };

  const handleActivateFriend = () => {
    const targetId = Number(friendId);
    if (!Number.isInteger(targetId) || targetId <= 0) return toast.error("请输入有效的好友用户 ID");
    if (iscBalance < (constants?.friendActivationFee ?? 20_000)) return toast.error("ISC 余额不足，无法开通私聊");
    addFriendMutation.mutate({ friendUserId: targetId, idempotencyKey: createIdempotencyKey("friend") });
  };

  const handleSend = () => {
    const normalized = content.trim();
    if (!normalized || sendMutation.isPending) return;
    if (activeChannel === "private" && (!recipientUserId || Number(recipientUserId) <= 0)) {
      toast.error("请输入有效的私聊对象用户 ID");
      return;
    }
    if (activeChannel !== "world" && !channelId && activeChannel !== "private") {
      toast.error("请输入频道 ID");
      return;
    }
    if (!canSendWorld) {
      toast.error("世界频道发言需要喇叭，请先购买");
      return;
    }
    sendMutation.mutate({
      channelType: activeChannel,
      channelId: activeChannel === "world" ? "world" : channelId || undefined,
      recipientUserId: activeChannel === "private" ? Number(recipientUserId) : undefined,
      content: normalized,
      idempotencyKey: createIdempotencyKey("message"),
    });
  };

  return (
    <section className="space-y-4" aria-label="玩家社交聊天中心">
      <Card className="overflow-hidden border-cyan-400/20 bg-slate-950/80 text-white shadow-xl shadow-cyan-950/20">
        <div className="border-b border-white/10 bg-gradient-to-r from-cyan-950/70 to-indigo-950/70 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Social Grid</p>
              <h2 className="mt-1 text-xl font-semibold">城市社交频道</h2>
              <p className="mt-1 text-xs text-slate-300">实时聊天、工会协作与临时组队统一由游戏内 ISC 账本处理。</p>
            </div>
            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-right">
              <div className="flex items-center justify-end gap-1 text-xs text-amber-200"><Megaphone className="h-3.5 w-3.5" /> 喇叭</div>
              <div className="text-lg font-bold text-amber-100">{megaphones.toLocaleString()}</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3"><Wallet className="mb-1 h-4 w-4 text-cyan-300" /><span className="text-slate-300">ISC 余额</span><ISCAmount amount={iscBalance.toLocaleString()} size="xs" className="mt-1 font-bold text-white" /></div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3"><Megaphone className="mb-1 h-4 w-4 text-amber-300" /><span className="text-slate-300">喇叭单价</span><ISCAmount amount={(constants?.megaphonePrice ?? 1_000).toLocaleString()} size="xs" className="mt-1 font-bold text-amber-100" /></div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3"><Crown className="mb-1 h-4 w-4 text-violet-300" /><span className="text-slate-300">工会会费</span><ISCAmount amount={(constants?.guildCreationFee ?? 1_000_000).toLocaleString()} size="xs" className="mt-1 font-bold text-violet-100" /></div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3"><Users className="mb-1 h-4 w-4 text-emerald-300" /><span className="text-slate-300">组队有效期</span><strong className="mt-1 block text-emerald-100">30 分钟</strong></div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1 border-b border-white/10 p-2">
          {channels.map((channel) => {
            const Icon = channel.icon;
            const selected = channel.id === activeChannel;
            return <button key={channel.id} type="button" onClick={() => setActiveChannel(channel.id)} className={`min-h-12 rounded-xl px-1 py-2 text-xs transition ${selected ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20" : "text-slate-300 hover:bg-white/10"}`} aria-pressed={selected}><Icon className="mx-auto mb-1 h-4 w-4" />{channel.label}</button>;
          })}
        </div>

        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <div><h3 className="font-medium">{activeMeta.label}频道</h3><p className="text-xs text-slate-400">{activeMeta.helper}</p></div>
            {activeChannel === "world" && <div className="flex items-center gap-2"><Input value={megaphoneQuantity} onChange={(event) => setMegaphoneQuantity(event.target.value)} inputMode="numeric" aria-label="购买喇叭数量" className="h-9 w-16 border-white/10 bg-white/5 text-center text-white" /><Button type="button" onClick={handlePurchase} disabled={purchaseMutation.isPending || iscBalance < purchaseTotal} className="h-9 bg-amber-400 px-3 text-xs text-slate-950 hover:bg-amber-300">{purchaseMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ISCLogo size="xs" className="mr-1" />购买 {purchaseTotal.toLocaleString()} ISC</>}</Button></div>}
          </div>

          {activeChannel === "private" && <Input value={recipientUserId} onChange={(event) => setRecipientUserId(event.target.value)} inputMode="numeric" placeholder="私聊对象用户 ID（已开通好友权限）" className="border-white/10 bg-white/5 text-white placeholder:text-slate-500" />}
          {(activeChannel === "guild" || activeChannel === "team") && <Input value={channelId} onChange={(event) => setChannelId(event.target.value)} placeholder={`${activeMeta.label}频道 ID`} className="border-white/10 bg-white/5 text-white placeholder:text-slate-500" />}

          <div className="min-h-56 max-h-72 space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-3" aria-live="polite">
            {messagesQuery.isLoading && <div className="flex h-40 items-center justify-center text-slate-400"><Loader2 className="mr-2 h-4 w-4 animate-spin" />正在加载频道消息</div>}
            {!messagesQuery.isLoading && messageList.length === 0 && <div className="flex h-40 flex-col items-center justify-center text-center text-slate-500"><MessageCircle className="mb-2 h-7 w-7" /><p>还没有消息</p><p className="mt-1 text-xs">成为第一个在{activeMeta.label}频道发言的人</p></div>}
            {messageList.map((message) => <article key={message.id} className="rounded-xl border border-white/5 bg-white/5 p-3 text-sm"><div className="mb-1 flex items-center justify-between text-[11px] text-slate-500"><span>用户 #{message.senderUserId}</span><time>{message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : "刚刚"}</time></div><p className="break-words text-slate-100">{message.content}</p>{message.megaphoneConsumed && <span className="mt-2 inline-flex items-center gap-1 text-[10px] text-amber-300"><Megaphone className="h-3 w-3" />已消耗喇叭</span>}</article>)}
          </div>

          {activeChannel === "world" && megaphones < 1 && <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-100">世界频道需要喇叭才能发言。当前 ISC 余额：<ISCAmount amount={iscBalance.toLocaleString()} size="xs" />，请先购买喇叭。</div>}
          <div className="flex items-end gap-2"><Input value={content} onChange={(event) => setContent(event.target.value.slice(0, 500))} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); handleSend(); } }} placeholder={activeChannel === "world" ? "输入世界频道广播内容…" : "输入消息…"} maxLength={500} className="min-h-11 border-white/10 bg-white/5 text-white placeholder:text-slate-500" /><Button type="button" onClick={handleSend} disabled={sendMutation.isPending || !content.trim() || !canSendWorld} className="h-11 shrink-0 bg-cyan-400 px-4 text-slate-950 hover:bg-cyan-300">{sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}<span className="sr-only">发送</span></Button></div>
          <p className="text-center text-[11px] text-slate-500">游戏内消费分账：60% 国库 / 40% 营销钱包。链上 NFT 铸造规则独立。</p>
        </div>
      </Card>

      <Card className="border-cyan-400/10 bg-slate-950/60 p-4 text-white">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div><h3 className="font-medium">社交权限与组织</h3><p className="text-xs text-slate-400">所有游戏内收费均按 60% 国库 / 40% 营销记录。</p></div>
          <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-[10px] text-cyan-200">真实账本</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-violet-300/10 bg-violet-400/5 p-3"><p className="text-xs text-violet-200">工会成立费：1,000,000 ISC</p><div className="mt-2 flex gap-2"><Input value={guildName} onChange={(event) => setGuildName(event.target.value)} placeholder="工会名称" className="h-9 border-white/10 bg-black/20 text-white placeholder:text-slate-600" /><Button type="button" onClick={handleCreateGuild} disabled={createGuildMutation.isPending || iscBalance < (constants?.guildCreationFee ?? 1_000_000)} className="h-9 shrink-0 bg-violet-400 px-3 text-xs text-slate-950 hover:bg-violet-300">{createGuildMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "创建"}</Button></div></div>
          <div className="rounded-xl border border-emerald-300/10 bg-emerald-400/5 p-3"><p className="text-xs text-emerald-200">组队费用：10,000 ISC / 30 分钟</p><div className="mt-2 flex gap-2"><Input value={teamName} onChange={(event) => setTeamName(event.target.value)} placeholder="队伍名称" className="h-9 border-white/10 bg-black/20 text-white placeholder:text-slate-600" /><Button type="button" onClick={handleCreateTeam} disabled={createTeamMutation.isPending || iscBalance < (constants?.teamCreationFee ?? 10_000)} className="h-9 shrink-0 bg-emerald-400 px-3 text-xs text-slate-950 hover:bg-emerald-300">{createTeamMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "创建"}</Button></div></div>
          <div className="rounded-xl border border-cyan-300/10 bg-cyan-400/5 p-3"><p className="text-xs text-cyan-200">好友私聊开通：20,000 ISC / 永久</p><div className="mt-2 flex gap-2"><Input value={friendId} onChange={(event) => setFriendId(event.target.value)} inputMode="numeric" placeholder="好友用户 ID" className="h-9 border-white/10 bg-black/20 text-white placeholder:text-slate-600" /><Button type="button" onClick={handleActivateFriend} disabled={addFriendMutation.isPending || iscBalance < (constants?.friendActivationFee ?? 20_000)} className="h-9 shrink-0 bg-cyan-400 px-3 text-xs text-slate-950 hover:bg-cyan-300">{addFriendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "开通"}</Button></div></div>
        </div>
      </Card>

      {allocationsQuery.data && allocationsQuery.data.length > 0 && <Card className="border-cyan-400/10 bg-slate-950/60 p-4 text-xs text-slate-300"><h3 className="mb-3 flex items-center gap-2 font-medium text-white"><ISCLogo size="sm" className="drop-shadow-[0_0_6px_rgba(103,232,249,0.75)]" />我的消费分账摘要</h3><div className="space-y-2">{allocationsQuery.data.slice(0, 4).map((item) => <div key={item.scene} className="flex items-center justify-between gap-3"><span className="truncate">{item.scene}</span><span className="shrink-0 text-right"><b className="text-cyan-200"><ISCAmount amount={`国库 ${Number(item.treasuryAmount).toLocaleString()}`} size="xs" /></b><span className="mx-1 text-slate-600">/</span><b className="text-violet-200"><ISCAmount amount={`营销 ${Number(item.marketingAmount).toLocaleString()}`} size="xs" /></b></span></div>)}</div></Card>}
    </section>
  );
}

export default SocialChatPanel;
