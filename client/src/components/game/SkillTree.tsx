import { PROFESSION_CONFIG, ProfessionType } from "@shared/types/profession";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type SkillKey = "profitBonus" | "productionBonus" | "harvestBonus" | "tradeBonus" | "bankInterestBonus";

const SKILLS: Array<{ key: SkillKey; name: string; description: string; suffix: string }> = [
  { key: "profitBonus", name: "商业收益", description: "提升经营活动的利润加成", suffix: "%" },
  { key: "productionBonus", name: "生产效率", description: "提升生产和加工效率", suffix: "%" },
  { key: "harvestBonus", name: "收获效率", description: "提升建筑与农产收获效率", suffix: "%" },
  { key: "tradeBonus", name: "贸易网络", description: "提升市场交易加成", suffix: "%" },
  { key: "bankInterestBonus", name: "金融信用", description: "提升银行利息加成", suffix: "%" },
];

interface SkillTreeProps {
  profession: ProfessionType;
  level: number;
  activeSkills?: Partial<Record<SkillKey, boolean>>;
  onActivate?: (skill: SkillKey) => void | Promise<void>;
  isProcessing?: boolean;
}

export function SkillTree({ profession, level, activeSkills = {}, onActivate, isProcessing = false }: SkillTreeProps) {
  const info = PROFESSION_CONFIG[profession];
  if (!info) return <Card><CardContent className="p-6">暂无职业技能资料。</CardContent></Card>;

  return (
    <Card className="border-cyan-500/20 bg-slate-900/80 text-white">
      <CardHeader>
        <CardTitle>{info.name} · 技能树</CardTitle>
        <CardDescription className="text-slate-400">技能数值来自职业配置；激活状态来自真实玩家资料。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {SKILLS.map((skill) => {
          const value = info.stats[skill.key];
          const active = activeSkills[skill.key] === true;
          const unlocked = value > 0 && level >= info.unlockLevel;
          return (
            <div key={skill.key} className={`rounded-lg border p-3 ${active ? "border-cyan-400 bg-cyan-950/30" : "border-slate-700 bg-slate-800/60"}`}>
              <div className="flex items-start justify-between gap-2"><div><p className="font-semibold">{skill.name}</p><p className="text-xs text-slate-400">{skill.description}</p></div><Badge variant="outline" className="border-cyan-400/50 text-cyan-200">+{value}{skill.suffix}</Badge></div>
              <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-400"><span>{active ? "已激活" : unlocked ? "可激活" : `需要 Lv.${info.unlockLevel}`}</span>{!active ? <Button size="sm" variant="outline" disabled={!unlocked || !onActivate || isProcessing} onClick={() => onActivate?.(skill.key)}>激活</Button> : <Badge className="bg-emerald-600">运行中</Badge>}</div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
