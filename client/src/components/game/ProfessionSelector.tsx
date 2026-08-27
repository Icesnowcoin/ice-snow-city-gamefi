import { PROFESSION_CONFIG, ProfessionType, canUpgradeProfession } from "@shared/types/profession";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProfessionSelectorProps {
  currentProfession: ProfessionType;
  totalAssets: number;
  level: number;
  onSelect: (profession: ProfessionType) => void | Promise<void>;
  isProcessing?: boolean;
}

export function ProfessionSelector({ currentProfession, totalAssets, level, onSelect, isProcessing = false }: ProfessionSelectorProps) {
  const professions = Object.values(ProfessionType);
  const nextUpgrade = canUpgradeProfession(currentProfession, totalAssets, level);
  const currentIndex = professions.indexOf(currentProfession);
  const nextProfession = currentIndex >= 0 ? professions[currentIndex + 1] : undefined;

  return (
    <Card className="border-cyan-500/20 bg-slate-900/80 text-white">
      <CardHeader>
        <CardTitle>选择职业</CardTitle>
        <CardDescription className="text-slate-400">职业解锁条件来自共享配置；切换结果由真实服务确认。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {professions.map((profession) => {
          const info = PROFESSION_CONFIG[profession];
          const isCurrent = profession === currentProfession;
          const isUnlocked = totalAssets >= info.requiredAssets && level >= info.unlockLevel;
          const isNext = profession === nextProfession;
          return (
            <div key={profession} className={`rounded-lg border p-3 ${isCurrent ? "border-cyan-400 bg-cyan-950/30" : "border-slate-700 bg-slate-800/60"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <span className="text-2xl" aria-hidden="true">{info.emoji}</span>
                  <div>
                    <p className="font-semibold">{info.name}</p>
                    <p className="text-xs text-slate-400">{info.description}</p>
                    <p className="mt-1 text-xs text-slate-500">需要 Lv.{info.unlockLevel} · {info.requiredAssets.toLocaleString()} ISC 资产</p>
                  </div>
                </div>
                {isCurrent ? <Badge className="bg-cyan-600">当前职业</Badge> : null}
              </div>
              {!isCurrent && isNext ? (
                <Button className="mt-3 w-full" disabled={!isUnlocked || isProcessing} onClick={() => onSelect(profession)}>
                  {isUnlocked ? "转为此职业" : "未满足解锁条件"}
                </Button>
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
