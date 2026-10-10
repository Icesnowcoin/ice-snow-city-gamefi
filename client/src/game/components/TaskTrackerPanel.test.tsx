import React from 'react';
import { act } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QuestLogManager, Quest } from '../quest/QuestLogManager';
import { TaskTrackerPanel } from './TaskTrackerPanel';

const createQuest = (): Quest => ({
  id: 'quest-city-first-route',
  npcId: 'npc-quest-officer',
  npcName: '荣光使者',
  title: '点亮城市第一条路线',
  description: '确认城市导航。',
  status: 'accepted',
  objectives: [{ id: 'open-city-map', description: '查看城市导航并确认地标', targetCount: 2, currentCount: 1, completed: false }],
  rewards: [{ type: 'experience', amount: 25 }],
  acceptedTime: Date.now(),
  progress: 50,
  difficulty: 'easy',
});

describe('TaskTrackerPanel', () => {
  it('guides the player to the quest hall when no quest is active', () => {
    const manager = new QuestLogManager();
    render(<TaskTrackerPanel questLogManager={manager} />);
    expect(screen.getByTestId('task-tracker-panel')).toHaveTextContent('前往荣耀任务大厅');
  });

  it('shows active quest progress and refreshes after objective updates', async () => {
    const manager = new QuestLogManager();
    manager.acceptQuest(createQuest());
    const onOpenQuestLog = vi.fn();
    render(<TaskTrackerPanel questLogManager={manager} onOpenQuestLog={onOpenQuestLog} />);

    expect(screen.getByText('点亮城市第一条路线')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
    fireEvent.click(screen.getByRole('button', { name: '打开任务日志' }));
    expect(onOpenQuestLog).toHaveBeenCalledTimes(1);

    act(() => {
      manager.updateQuestProgress('quest-city-first-route', 'open-city-map', 1);
    });
    await waitFor(() => expect(screen.getByTestId('task-tracker-panel')).toHaveTextContent('前往荣耀任务大厅'));
    expect(screen.queryByRole('progressbar')).toBeNull();
  });
});
