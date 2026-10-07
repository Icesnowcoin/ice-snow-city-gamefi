import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronRight, Circle, Target } from 'lucide-react';
import { Quest, QuestLogManager } from '../quest/QuestLogManager';

interface TaskTrackerPanelProps {
  questLogManager: QuestLogManager;
  onOpenQuestLog?: () => void;
}

const statusLabel: Record<Quest['status'], string> = {
  accepted: '已接取',
  in_progress: '进行中',
  completed: '已完成',
  abandoned: '已放弃',
  failed: '已失败',
};

/** Compact HUD tracker for the active quest in the GameHub scene. */
export const TaskTrackerPanel: React.FC<TaskTrackerPanelProps> = ({ questLogManager, onOpenQuestLog }) => {
  const [quests, setQuests] = useState<Quest[]>(questLogManager.getAllQuests());

  useEffect(() => {
    const unsubscribe = questLogManager.onQuestUpdate(() => setQuests(questLogManager.getAllQuests()));
    setQuests(questLogManager.getAllQuests());
    return unsubscribe;
  }, [questLogManager]);

  const activeQuest = useMemo(() => {
    const active = quests.filter((quest) => quest.status === 'accepted' || quest.status === 'in_progress');
    return active.sort((a, b) => b.acceptedTime - a.acceptedTime)[0] ?? null;
  }, [quests]);

  if (!activeQuest) {
    return (
      <section data-testid="task-tracker-panel" aria-live="polite" className="absolute left-4 top-16 z-20 w-[min(21rem,calc(100%-2rem))] rounded-xl border border-cyan-300/30 bg-slate-950/85 p-3 text-white shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 text-cyan-100">
          <Target className="h-4 w-4" aria-hidden="true" />
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em]">任务追踪</h2>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-300">前往荣耀任务大厅，与荣光使者互动以接取城市任务。</p>
      </section>
    );
  }

  const completedObjectives = activeQuest.objectives.filter((objective) => objective.completed).length;
  const rewardSummary = activeQuest.rewards.map((reward) => `+${reward.amount} ${reward.itemName ?? reward.type}`).join(' · ');

  return (
    <section data-testid="task-tracker-panel" aria-live="polite" className="absolute left-4 top-16 z-20 w-[min(21rem,calc(100%-2rem))] rounded-xl border border-cyan-300/35 bg-slate-950/90 p-3 text-white shadow-xl shadow-cyan-950/30 backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-cyan-100">
            <Target className="h-4 w-4 shrink-0" aria-hidden="true" />
            <h2 className="truncate text-xs font-semibold uppercase tracking-[0.16em]">任务追踪</h2>
          </div>
          <p className="mt-1 truncate text-sm font-bold text-white">{activeQuest.title}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">来自 {activeQuest.npcName} · {statusLabel[activeQuest.status]}</p>
        </div>
        {onOpenQuestLog && (
          <button type="button" onClick={onOpenQuestLog} className="shrink-0 rounded-md p-1.5 text-cyan-200 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300" aria-label="打开任务日志">
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="mt-3" aria-label={`任务进度 ${activeQuest.progress}%`}>
        <div className="mb-1 flex items-center justify-between text-[11px] text-slate-300">
          <span>总体进度</span><strong className="text-cyan-200">{activeQuest.progress}%</strong>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-700" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={activeQuest.progress}>
          <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-[width] duration-200" style={{ width: `${activeQuest.progress}%` }} />
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        {activeQuest.objectives.map((objective) => (
          <div key={objective.id} className="flex items-start gap-2 text-xs text-slate-300">
            {objective.completed ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" aria-hidden="true" /> : <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />}
            <span className={objective.completed ? 'text-slate-500 line-through' : ''}>{objective.description} ({objective.currentCount}/{objective.targetCount})</span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-2 text-[11px]">
        <span className="text-slate-400">目标 {completedObjectives}/{activeQuest.objectives.length}</span>
        <span className="truncate text-amber-200" title={rewardSummary}>奖励：{rewardSummary}</span>
      </div>
    </section>
  );
};

export default TaskTrackerPanel;
