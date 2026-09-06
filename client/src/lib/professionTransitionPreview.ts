import {
  canUpgradeProfession,
  getProfessionInfo,
  ProfessionType,
  type ProfessionInfo,
} from "../../../shared/types/profession";

export type ProfessionTransitionPreview = {
  current: ProfessionInfo;
  next?: ProfessionInfo;
  canUpgrade: boolean;
  reason?: string;
  assetShortfall: number;
  levelShortfall: number;
};

export function getProfessionTransitionPreview(
  currentProfession: ProfessionType,
  totalAssets: number,
  level: number,
): ProfessionTransitionPreview {
  const result = canUpgradeProfession(currentProfession, totalAssets, level);
  const current = getProfessionInfo(currentProfession);
  const orderedProfessions = Object.values(ProfessionType);
  const nextType = orderedProfessions[orderedProfessions.indexOf(currentProfession) + 1] as ProfessionType | undefined;
  const next = nextType ? getProfessionInfo(nextType) : undefined;
  return {
    current,
    next,
    canUpgrade: result.canUpgrade,
    reason: result.reason,
    assetShortfall: next ? Math.max(0, next.requiredAssets - totalAssets) : 0,
    levelShortfall: next ? Math.max(0, next.unlockLevel - level) : 0,
  };
}
