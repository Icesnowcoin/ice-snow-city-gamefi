export type CharacterAnimationPreset =
  | "idle"
  | "walk"
  | "run"
  | "work"
  | "sleep"
  | "celebrate"
  | "sad"
  | "talk"
  | "wave"
  | "jump";

export const CHARACTER_ANIMATION_PRESETS: ReadonlyArray<{
  id: CharacterAnimationPreset;
  label: string;
  description: string;
}> = [
  { id: "idle", label: "自然待机", description: "轻微呼吸与身体重心变化" },
  { id: "walk", label: "行走", description: "适合城市街区漫步的步伐" },
  { id: "run", label: "奔跑", description: "短促而有活力的移动动作" },
  { id: "work", label: "工作", description: "现代城市职业工作姿态" },
  { id: "sleep", label: "睡眠", description: "安静的休息与呼吸动作" },
  { id: "celebrate", label: "庆祝", description: "完成任务后的开心庆祝" },
  { id: "sad", label: "悲伤", description: "低头和缓慢的情绪动作" },
  { id: "talk", label: "对话", description: "与 NPC 或玩家交流时的手势" },
  { id: "wave", label: "挥手", description: "向城市居民挥手致意" },
  { id: "jump", label: "跳跃", description: "短促的活力跳跃动作" },
];

const TWO_PI = Math.PI * 2;

export interface CharacterAnimationFrame {
  bodyY: number;
  bodyRotationZ: number;
  headRotationZ: number;
  armRotationZ: number;
  outfitY: number;
  scaleY: number;
}

export function getCharacterAnimationFrame(
  preset: CharacterAnimationPreset,
  elapsedSeconds: number,
): CharacterAnimationFrame {
  const time = Math.max(0, elapsedSeconds);
  const breathing = Math.sin(time * TWO_PI * 0.8);
  const slowWave = Math.sin(time * TWO_PI * 0.4);
  const fastWave = Math.sin(time * TWO_PI * 2.2);

  if (preset === "walk") {
    const stride = Math.sin(time * TWO_PI * 1.4);
    return {
      bodyY: 0.025 * Math.abs(stride),
      bodyRotationZ: 0.035 * stride,
      headRotationZ: 0.03 * Math.sin(time * TWO_PI * 0.7),
      armRotationZ: -0.12 + 0.16 * stride,
      outfitY: 0.025 * Math.abs(stride),
      scaleY: 1,
    };
  }

  if (preset === "run") {
    const stride = Math.sin(time * TWO_PI * 2.8);
    return {
      bodyY: 0.08 * Math.abs(stride),
      bodyRotationZ: 0.07 * stride,
      headRotationZ: 0.06 * Math.sin(time * TWO_PI * 1.4),
      armRotationZ: -0.28 + 0.4 * stride,
      outfitY: 0.08 * Math.abs(stride),
      scaleY: 1 - 0.02 * Math.abs(stride),
    };
  }

  if (preset === "work") {
    const workCycle = Math.sin(time * TWO_PI * 1.6);
    return {
      bodyY: 0.015 * breathing,
      bodyRotationZ: -0.06 + 0.02 * workCycle,
      headRotationZ: -0.08 + 0.02 * workCycle,
      armRotationZ: -0.3 + 0.32 * workCycle,
      outfitY: 0.015 * breathing,
      scaleY: 1,
    };
  }

  if (preset === "sleep") {
    return {
      bodyY: 0.012 * breathing,
      bodyRotationZ: 0.03,
      headRotationZ: 0.14 + 0.02 * breathing,
      armRotationZ: 0.18,
      outfitY: 0.012 * breathing,
      scaleY: 0.98,
    };
  }

  if (preset === "celebrate") {
    const celebration = Math.abs(Math.sin(time * TWO_PI * 1.4));
    return {
      bodyY: 0.18 * celebration,
      bodyRotationZ: 0.08 * fastWave,
      headRotationZ: 0.08 * slowWave,
      armRotationZ: 0.45 + 0.18 * fastWave,
      outfitY: 0.18 * celebration,
      scaleY: 1 - 0.04 * celebration,
    };
  }

  if (preset === "sad") {
    return {
      bodyY: 0.01 * breathing,
      bodyRotationZ: -0.09,
      headRotationZ: -0.18 + 0.02 * breathing,
      armRotationZ: 0.22,
      outfitY: 0.01 * breathing,
      scaleY: 0.99,
    };
  }

  if (preset === "talk") {
    return {
      bodyY: 0.02 * breathing,
      bodyRotationZ: 0.025 * slowWave,
      headRotationZ: 0.09 * fastWave,
      armRotationZ: -0.2 + 0.14 * fastWave,
      outfitY: 0.02 * breathing,
      scaleY: 1,
    };
  }

  if (preset === "wave") {
    return {
      bodyY: 0.02 * breathing,
      bodyRotationZ: 0.015 * breathing,
      headRotationZ: 0.08 * fastWave,
      armRotationZ: -0.35 + 0.2 * fastWave,
      outfitY: 0.02 * breathing,
      scaleY: 1,
    };
  }

  if (preset === "jump") {
    const jumpCycle = (time % 1.6) / 1.6;
    const jump = Math.sin(jumpCycle * Math.PI);
    return {
      bodyY: 0.5 * jump,
      bodyRotationZ: 0.03 * Math.sin(jumpCycle * TWO_PI),
      headRotationZ: 0.05 * Math.sin(jumpCycle * TWO_PI),
      armRotationZ: -0.2 - 0.25 * jump,
      outfitY: 0.5 * jump,
      scaleY: 1 - 0.04 * jump,
    };
  }

  return {
    bodyY: 0.03 * breathing,
    bodyRotationZ: 0.02 * breathing,
    headRotationZ: 0.04 * slowWave,
    armRotationZ: -0.12 + 0.02 * breathing,
    outfitY: 0.03 * breathing,
    scaleY: 1,
  };
}

export function getCharacterAnimationLabel(preset: CharacterAnimationPreset): string {
  return CHARACTER_ANIMATION_PRESETS.find((item) => item.id === preset)?.label ?? "自然待机";
}
