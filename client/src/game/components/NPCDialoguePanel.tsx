import React, { useEffect, useMemo, useState } from 'react';
import { Quest } from '../quest/QuestLogManager';

export type NPCDialoguePhase = 'before_accept' | 'accepted' | 'progress' | 'completed';

interface NPCDialoguePanelProps {
  open: boolean;
  phase: NPCDialoguePhase;
  quest?: Quest;
  npcName?: string;
  onAccept: () => void;
  onClose: () => void;
}

const DIALOGUE: Record<NPCDialoguePhase, string[]> = {
  before_accept: [
    '欢迎来到荣耀任务大厅。我是荣光使者，负责守护商业帝国的第一条城市路线。',
    '晨曦路线上的路灯尚未全部启动。愿意和我一起点亮它们，让城市迎来第一束秩序之光吗？',
  ],
  accepted: [
    '很好，路线任务已经记录在你的任务追踪面板中。',
    '请沿着城市核心向前探索，依次点亮晨曦路线上的四个路灯节点。',
  ],
  progress: [
    '我看到已经有路灯亮起来了，城市正在回应你的努力。',
    '继续完成剩余节点，别让晨曦路线在雪夜中失去方向。',
  ],
  completed: [
    '太好了，晨曦路线已经完整点亮！',
    '这条光路会成为商业帝国连接各个区域的第一条脉络。奖励已经发放到本地演示账户。',
  ],
};

export const NPCDialoguePanel: React.FC<NPCDialoguePanelProps> = ({
  open,
  phase,
  quest,
  npcName = '荣光使者',
  onAccept,
  onClose,
}) => {
  const [lineIndex, setLineIndex] = useState(0);
  const lines = useMemo(() => DIALOGUE[phase], [phase]);

  useEffect(() => {
    if (open) setLineIndex(0);
  }, [open, phase]);

  if (!open) return null;

  const isLastLine = lineIndex >= lines.length - 1;
  const progress = quest?.objectives[0];

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/55 p-3 sm:items-center" role="presentation">
      <section
        className="npc-dialogue-panel w-full max-w-lg overflow-hidden rounded-2xl border border-cyan-200/45 bg-slate-950/95 text-slate-100 shadow-[0_0_45px_rgba(34,211,238,0.24)] backdrop-blur-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="npc-dialogue-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-cyan-200/15 px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-200/70">荣耀任务大厅 · 剧情对话</p>
            <h2 id="npc-dialogue-title" className="mt-1 text-lg font-semibold text-white">{npcName}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300" aria-label="关闭对话">关闭</button>
        </div>
        <div className="space-y-4 px-5 py-5">
          <div className="rounded-xl border border-cyan-100/15 bg-cyan-100/[0.06] p-4 text-sm leading-7 text-slate-200" aria-live="polite">
            {lines[lineIndex]}
          </div>
          {quest && phase !== 'before_accept' && progress && (
            <p className="text-xs text-cyan-100/70">当前进度：{progress.currentCount}/{progress.targetCount} 个路灯节点</p>
          )}
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-cyan-200/15 px-5 py-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">稍后再说</button>
          {phase === 'before_accept' ? (
            <button type="button" onClick={onAccept} className="min-h-11 rounded-xl bg-cyan-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200">接取路线任务</button>
          ) : (
            <button type="button" onClick={() => isLastLine ? onClose() : setLineIndex((index) => index + 1)} className="min-h-11 rounded-xl bg-cyan-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200">{isLastLine ? '结束对话' : '下一句'}</button>
          )}
        </div>
      </section>
    </div>
  );
};
