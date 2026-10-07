import { useEffect, useState } from "react";
import {
  BookOpen,
  BriefcaseBusiness,
  ImageOff,
  MapPin,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MobileBottomSheet } from "@/components/ui/mobile-bottom-sheet";
import { NpcModelTouchPreview } from "@/components/NpcModelTouchPreview";
import type { NpcInteractionProfile } from "@/lib/npcInteractionData";

type NpcLanguage = "zh" | "en";

type NpcInteractionEntryProps = {
  profiles: readonly NpcInteractionProfile[];
  lang: NpcLanguage;
  onSelectProfile: (profile: NpcInteractionProfile) => void;
};

type NpcProfileBottomSheetProps = {
  profile: NpcInteractionProfile | null;
  lang: NpcLanguage;
  onOpenChange: (open: boolean) => void;
};

function getInitials(profile: NpcInteractionProfile): string {
  return profile.name.slice(0, 1);
}

function NpcAvatar({
  profile,
  lang,
  size = "small",
}: {
  profile: NpcInteractionProfile;
  lang: NpcLanguage;
  size?: "small" | "large";
}) {
  const [assetFailed, setAssetFailed] = useState(false);
  const isLarge = size === "large";

  useEffect(() => {
    setAssetFailed(false);
  }, [profile.assetUrl]);

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-2xl border border-cyan-300/20 bg-[linear-gradient(145deg,#123454,#12213c_58%,#20314c)] ${isLarge ? "h-32 w-32" : "h-14 w-14"}`}
    >
      {!assetFailed ? (
        <img
          src={profile.assetUrl}
          alt={
            lang === "zh"
              ? `${profile.name}的高保真角色资产预览`
              : `${profile.nameEn} high-fidelity character asset preview`
          }
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setAssetFailed(true)}
        />
      ) : (
        <div
          className="grid h-full w-full place-items-center text-cyan-100"
          role="img"
          aria-label={
            lang === "zh"
              ? `${profile.name}的高保真资产暂不可用`
              : `${profile.nameEn} high-fidelity asset unavailable`
          }
        >
          <div className="text-center">
            <ImageOff
              className={`${isLarge ? "mx-auto h-7 w-7" : "mx-auto h-4 w-4"} text-cyan-300/80`}
              aria-hidden="true"
            />
            <span
              className={`${isLarge ? "mt-2 text-2xl" : "mt-1 text-lg"} block font-semibold`}
            >
              {getInitials(profile)}
            </span>
          </div>
        </div>
      )}
      <span className="pointer-events-none absolute inset-x-1 bottom-1 rounded-lg bg-slate-950/75 px-1.5 py-0.5 text-center text-[9px] font-medium text-cyan-100">
        {profile.assetStatus === "catalogued"
          ? lang === "zh"
            ? "已归档"
            : "Catalogued"
          : lang === "zh"
            ? "待导入"
            : "Pending"}
      </span>
    </div>
  );
}

export function NpcInteractionEntry({
  profiles,
  lang,
  onSelectProfile,
}: NpcInteractionEntryProps) {
  return (
    <section
      data-testid="npc-interaction-entry"
      className="space-y-3 rounded-2xl border border-violet-400/20 bg-violet-500/[0.06] p-3"
      aria-labelledby="npc-interaction-entry-title"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-violet-300/20 bg-violet-400/10 text-violet-200">
          <UserRound className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h3
            id="npc-interaction-entry-title"
            className="text-sm font-semibold text-violet-100"
          >
            {lang === "zh" ? "本区 NPC 互动" : "District NPCs"}
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            {lang === "zh"
              ? "点击头像查看专属高保真资产与城市背景故事。"
              : "Tap an avatar to view the high-fidelity asset and city story."}
          </p>
        </div>
      </div>
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        role="list"
        aria-label={lang === "zh" ? "可互动 NPC 列表" : "Interactive NPC list"}
      >
        {profiles.map(profile => (
          <button
            key={profile.id}
            type="button"
            data-testid={`npc-avatar-${profile.id}`}
            aria-label={
              lang === "zh"
                ? `查看 ${profile.name} 的 NPC 资料`
                : `View NPC profile for ${profile.nameEn}`
            }
            onClick={() => onSelectProfile(profile)}
            className="group flex min-w-[5.25rem] flex-col items-center gap-1.5 rounded-xl p-1.5 text-center transition-transform duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/80 motion-reduce:transition-none"
          >
            <NpcAvatar profile={profile} lang={lang} />
            <span className="max-w-[5rem] truncate text-[11px] font-medium text-slate-200 group-hover:text-violet-200">
              {lang === "zh" ? profile.name : profile.nameEn}
            </span>
            <span className="max-w-[5rem] truncate text-[10px] text-slate-500">
              {lang === "zh" ? profile.role : profile.roleEn}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function NpcProfileBottomSheet({
  profile,
  lang,
  onOpenChange,
}: NpcProfileBottomSheetProps) {
  const open = Boolean(profile);
  if (!profile) return null;

  return (
    <MobileBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={lang === "zh" ? profile.name : profile.nameEn}
      description={
        lang === "zh" ? "NPC 专属高保真档案" : "NPC high-fidelity profile"
      }
      testId="npc-profile-bottom-sheet"
      haptic="medium"
      contentClassName="space-y-4"
    >
      <div className="flex items-start gap-4 rounded-2xl border border-cyan-300/20 bg-cyan-500/[0.06] p-4">
        <NpcAvatar profile={profile} lang={lang} size="large" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-cyan-300/30 bg-cyan-400/10 text-cyan-200">
              {profile.assetStatus === "catalogued"
                ? lang === "zh"
                  ? "高保真资产已归档"
                  : "High-fidelity asset catalogued"
                : lang === "zh"
                  ? "资产待导入"
                  : "Asset pending import"}
            </Badge>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-white">
            <BriefcaseBusiness
              className="h-4 w-4 text-cyan-300"
              aria-hidden="true"
            />
            {lang === "zh" ? profile.role : profile.roleEn}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
            <MapPin
              className="h-3.5 w-3.5 text-violet-300"
              aria-hidden="true"
            />
            {lang === "zh" ? profile.district : profile.districtEn}
          </p>
        </div>
      </div>

      <NpcModelTouchPreview profile={profile} lang={lang} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
          <p className="text-[11px] uppercase tracking-[0.15em] text-slate-500">
            {lang === "zh" ? "资产规格" : "Asset specification"}
          </p>
          <p className="mt-2 font-mono text-sm text-cyan-200">
            {profile.polygonBudget}
          </p>
          <p className="mt-1 break-all text-[11px] text-slate-500">
            {profile.assetId}
          </p>
        </div>
        <div className="rounded-2xl border border-violet-300/15 bg-violet-500/[0.06] p-3">
          <p className="text-[11px] uppercase tracking-[0.15em] text-slate-500">
            {lang === "zh" ? "可互动内容" : "Interaction"}
          </p>
          <p className="mt-2 text-sm leading-5 text-violet-100">
            {lang === "zh"
              ? profile.interactionHint
              : profile.interactionHintEn}
          </p>
        </div>
      </div>

      <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center gap-2 text-cyan-200">
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          <h3 className="text-sm font-semibold">
            {lang === "zh" ? "城市背景故事" : "City background story"}
          </h3>
        </div>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          {lang === "zh" ? profile.story : profile.storyEn}
        </p>
      </article>

      <div className="rounded-2xl border border-amber-300/15 bg-amber-400/[0.06] p-3 text-xs leading-5 text-amber-100/80">
        {lang === "zh"
          ? "资产预览按归档路径加载。若当前运行环境尚未同步对应图像，系统会保留角色资料并明确显示资产不可用，不会用占位图冒充已交付文件。"
          : "The preview loads from the archived asset path. If the image is not synced to this runtime, the profile remains available and clearly reports the missing asset instead of pretending a placeholder is delivered."}
      </div>

      <Button
        type="button"
        variant="outline"
        className="min-h-12 w-full border-slate-700 bg-slate-900/80 text-slate-200"
        onClick={() => onOpenChange(false)}
      >
        {lang === "zh" ? "关闭 NPC 档案" : "Close NPC profile"}
      </Button>
    </MobileBottomSheet>
  );
}
