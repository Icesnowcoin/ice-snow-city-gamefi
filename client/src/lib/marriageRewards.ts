export type MarriageMilestoneId = "first-anniversary" | "shared-space" | "social-interaction";

export type MarriageRewardPreview = {
  id: MarriageMilestoneId;
  title: string;
  description: string;
  rewardLabel: string;
  eligible: boolean;
  claimed: boolean;
};

export type MarriageRewardInput = {
  status: "single" | "proposed" | "married";
  marriedAt?: number | string;
  hasSharedSpace: boolean;
  interactionCount: number;
  claimedMilestones?: MarriageMilestoneId[];
  now?: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function getMarriageRewardPreview(input: MarriageRewardInput): MarriageRewardPreview[] {
  const now = input.now ?? Date.now();
  const marriedAtMs = typeof input.marriedAt === "string" ? Date.parse(input.marriedAt) : input.marriedAt;
  const marriedDays = input.status === "married" && Number.isFinite(marriedAtMs) ? Math.max(0, Math.floor((now - Number(marriedAtMs)) / DAY_MS)) : 0;
  const claimed = new Set(input.claimedMilestones ?? []);
  const previews: MarriageRewardPreview[] = [
    {
      id: "first-anniversary",
      title: "周年纪念",
      description: "持续婚姻达到 365 天。",
      rewardLabel: "待配置的纪念奖励",
      eligible: input.status === "married" && marriedDays >= 365,
      claimed: claimed.has("first-anniversary"),
    },
    {
      id: "shared-space",
      title: "共同空间",
      description: "与配偶完成真实私密空间绑定。",
      rewardLabel: "待配置的空间奖励",
      eligible: input.status === "married" && input.hasSharedSpace,
      claimed: claimed.has("shared-space"),
    },
    {
      id: "social-interaction",
      title: "伴侣互动",
      description: "完成至少 10 次由服务端记录的伴侣互动。",
      rewardLabel: "待配置的互动奖励",
      eligible: input.status === "married" && Number.isInteger(input.interactionCount) && input.interactionCount >= 10,
      claimed: claimed.has("social-interaction"),
    },
  ];
  return previews;
}

export function getUnclaimedEligibleMarriageMilestones(input: MarriageRewardInput): MarriageRewardPreview[] {
  return getMarriageRewardPreview(input).filter((item) => item.eligible && !item.claimed);
}
