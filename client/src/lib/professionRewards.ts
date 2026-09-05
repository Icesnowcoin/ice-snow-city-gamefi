import { ProfessionType, getProfessionInfo } from "../../../shared/types/profession";

export type ProfessionMilestoneId = "level-10" | "level-30" | "level-60" | "level-90" | "profession-upgrade";

export type ProfessionRewardPreview = {
  id: ProfessionMilestoneId;
  title: string;
  description: string;
  rewardLabel: string;
  eligible: boolean;
  claimed: boolean;
};

export type ProfessionRewardInput = {
  profession: ProfessionType;
  level: number;
  upgradeCount: number;
  claimedMilestones?: ProfessionMilestoneId[];
};

export function getProfessionRewardPreview(input: ProfessionRewardInput): ProfessionRewardPreview[] {
  const info = getProfessionInfo(input.profession);
  const claimed = new Set(input.claimedMilestones ?? []);
  const level = Number.isFinite(input.level) ? input.level : 0;
  const upgradeCount = Number.isInteger(input.upgradeCount) ? input.upgradeCount : 0;
  return [
    {
      id: "level-10",
      title: "职业启程",
      description: "达到职业等级 10。",
      rewardLabel: "待配置的成长奖励",
      eligible: level >= 10,
      claimed: claimed.has("level-10"),
    },
    {
      id: "level-30",
      title: "城市专精",
      description: "达到职业等级 30。",
      rewardLabel: "待配置的专精奖励",
      eligible: level >= 30,
      claimed: claimed.has("level-30"),
    },
    {
      id: "level-60",
      title: "产业核心",
      description: "达到职业等级 60。",
      rewardLabel: "待配置的产业奖励",
      eligible: level >= 60,
      claimed: claimed.has("level-60"),
    },
    {
      id: "level-90",
      title: "商业帝国",
      description: "达到职业等级 90。",
      rewardLabel: "待配置的企业家奖励",
      eligible: level >= 90,
      claimed: claimed.has("level-90"),
    },
    {
      id: "profession-upgrade",
      title: "职业晋升",
      description: `当前职业：${info.name}；完成一次受保护的职业升级。`,
      rewardLabel: "待配置的晋升奖励",
      eligible: upgradeCount > 0,
      claimed: claimed.has("profession-upgrade"),
    },
  ];
}

export function getUnclaimedEligibleProfessionMilestones(input: ProfessionRewardInput): ProfessionRewardPreview[] {
  return getProfessionRewardPreview(input).filter((item) => item.eligible && !item.claimed);
}
