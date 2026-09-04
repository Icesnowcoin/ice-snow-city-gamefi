import { ISC_LOGO_URL } from "@/components/ISCLogo";

export const ICE_SNOW_CITY_VISUAL_TOKENS = {
  officialLogoUrl: ISC_LOGO_URL,
  primaryHue: 220,
  backgroundLightness: 0.145,
  minimumTouchTargetPx: 44,
  preferredMotionDurationMs: 300,
} as const;

export type VisualConsistencyInput = {
  logoUrl?: string;
  primaryHue?: number;
  backgroundLightness?: number;
  touchTargetPx?: number;
  motionDurationMs?: number;
};

export type VisualConsistencyResult = {
  consistent: boolean;
  issues: string[];
};

export function validateVisualConsistency(input: VisualConsistencyInput): VisualConsistencyResult {
  const issues: string[] = [];
  if (input.logoUrl !== undefined && input.logoUrl !== ICE_SNOW_CITY_VISUAL_TOKENS.officialLogoUrl) {
    issues.push("代币语义必须使用官方 ISC Logo URL。");
  }
  if (input.primaryHue !== undefined && input.primaryHue !== ICE_SNOW_CITY_VISUAL_TOKENS.primaryHue) {
    issues.push("主视觉色相应保持冰蓝色相 220。");
  }
  if (input.backgroundLightness !== undefined && input.backgroundLightness > 0.22) {
    issues.push("主界面背景应保持深色主题，以确保冰蓝高光和白色文字对比度。");
  }
  if (input.touchTargetPx !== undefined && input.touchTargetPx < ICE_SNOW_CITY_VISUAL_TOKENS.minimumTouchTargetPx) {
    issues.push("移动端交互目标不得小于 44px。");
  }
  if (input.motionDurationMs !== undefined && input.motionDurationMs > ICE_SNOW_CITY_VISUAL_TOKENS.preferredMotionDurationMs) {
    issues.push("常规 UI 动画应控制在 300ms 以内。");
  }
  return { consistent: issues.length === 0, issues };
}
