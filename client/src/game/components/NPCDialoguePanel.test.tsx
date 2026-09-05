import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NPCDialoguePanel } from './NPCDialoguePanel';
import { Quest } from '../quest/QuestLogManager';

const quest: Quest = {
  id: 'quest-city-first-route',
  npcId: 'npc-quest-officer',
  npcName: '荣光使者',
  title: '点亮城市第一条路线',
  description: '点亮晨曦路线上的路灯节点。',
  status: 'in_progress',
  objectives: [{ id: 'light-route-node', description: '点亮路灯', targetCount: 4, currentCount: 2, completed: false }],
  rewards: [{ type: 'coin', amount: 10 }],
  acceptedTime: Date.now(),
  progress: 50,
  difficulty: 'easy',
};

describe('NPCDialoguePanel', () => {
  it('shows the opening conversation and accepts the route quest', () => {
    const onAccept = vi.fn();
    render(<NPCDialoguePanel open phase="before_accept" onAccept={onAccept} onClose={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/守护商业帝国/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '接取路线任务' }));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it('advances progress dialogue and exposes the current objective count', () => {
    render(<NPCDialoguePanel open phase="progress" quest={quest} onAccept={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByText('当前进度：2/4 个路灯节点')).toBeInTheDocument();
    expect(screen.getByText(/路灯亮起来了/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '下一句' }));
    expect(screen.getByText(/继续完成剩余节点/)).toBeInTheDocument();
  });
});
