export type CharacterExpressionType =
  | "neutral"
  | "smile"
  | "sad"
  | "angry"
  | "surprised"
  | "tired"
  | "thinking"
  | "happy";

export interface ExpressionConfig {
  eyeScaleY: number;
  mouthScaleY: number;
  mouthRotationZ: number;
  browRotationZ: number;
  headTiltZ: number;
}

export const CHARACTER_EXPRESSIONS: ReadonlyArray<{
  id: CharacterExpressionType;
  label: string;
  description: string;
}> = [
  { id: "neutral", label: "平静", description: "自然放松的标准表情" },
  { id: "smile", label: "微笑", description: "亲切柔和的自信微笑" },
  { id: "sad", label: "悲伤", description: "略带失落的低落表情" },
  { id: "angry", label: "严肃/生气", description: "紧缩眉头的严肃神态" },
  { id: "surprised", label: "惊讶", description: "双眼微睁的惊奇表情" },
  { id: "tired", label: "疲惫", description: "略显困意的劳累神情" },
  { id: "thinking", label: "思考", description: "思索中的沉着表情" },
  { id: "happy", label: "开心", description: "洋溢着喜悦的灿烂笑容" },
];

export const EXPRESSION_CONFIGS: Record<CharacterExpressionType, ExpressionConfig> = {
  neutral: { eyeScaleY: 1, mouthScaleY: 1, mouthRotationZ: 0, browRotationZ: 0, headTiltZ: 0 },
  smile: { eyeScaleY: 0.9, mouthScaleY: 1.25, mouthRotationZ: 0.08, browRotationZ: -0.04, headTiltZ: 0.02 },
  sad: { eyeScaleY: 0.95, mouthScaleY: 0.8, mouthRotationZ: -0.12, browRotationZ: 0.1, headTiltZ: -0.04 },
  angry: { eyeScaleY: 0.85, mouthScaleY: 0.9, mouthRotationZ: -0.05, browRotationZ: -0.15, headTiltZ: 0.01 },
  surprised: { eyeScaleY: 1.25, mouthScaleY: 1.4, mouthRotationZ: 0, browRotationZ: 0.12, headTiltZ: 0 },
  tired: { eyeScaleY: 0.75, mouthScaleY: 0.9, mouthRotationZ: -0.03, browRotationZ: 0.05, headTiltZ: -0.06 },
  thinking: { eyeScaleY: 0.9, mouthScaleY: 0.95, mouthRotationZ: 0.02, browRotationZ: -0.08, headTiltZ: 0.08 },
  happy: { eyeScaleY: 0.88, mouthScaleY: 1.35, mouthRotationZ: 0.12, browRotationZ: -0.06, headTiltZ: 0.03 },
};

export function getExpressionConfig(expression: CharacterExpressionType): ExpressionConfig {
  return EXPRESSION_CONFIGS[expression] ?? EXPRESSION_CONFIGS.neutral;
}

export function interpolateExpressionConfig(
  fromExpr: CharacterExpressionType,
  toExpr: CharacterExpressionType,
  progress: number,
): ExpressionConfig {
  const p = Math.max(0, Math.min(1, progress));
  const from = getExpressionConfig(fromExpr);
  const to = getExpressionConfig(toExpr);

  return {
    eyeScaleY: from.eyeScaleY + (to.eyeScaleY - from.eyeScaleY) * p,
    mouthScaleY: from.mouthScaleY + (to.mouthScaleY - from.mouthScaleY) * p,
    mouthRotationZ: from.mouthRotationZ + (to.mouthRotationZ - from.mouthRotationZ) * p,
    browRotationZ: from.browRotationZ + (to.browRotationZ - from.browRotationZ) * p,
    headTiltZ: from.headTiltZ + (to.headTiltZ - from.headTiltZ) * p,
  };
}

export function getCharacterExpressionLabel(expression: CharacterExpressionType): string {
  return CHARACTER_EXPRESSIONS.find((item) => item.id === expression)?.label ?? "平静";
}
