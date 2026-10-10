import React, { useState, useEffect } from 'react';
import { Quest, QuestLogEntry, QuestLogManager } from '../quest/QuestLogManager';
import '../styles/quest-log.css';
import { ChevronDown, ChevronUp, Trash2, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';

interface QuestLogPanelProps {
  questLogManager: QuestLogManager;
  isOpen: boolean;
  onClose: () => void;
}

export const QuestLogPanel: React.FC<QuestLogPanelProps> = ({
  questLogManager,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'quests' | 'log' | 'stats'>('quests');
  const [quests, setQuests] = useState<Quest[]>([]);
  const [questLog, setQuestLog] = useState<QuestLogEntry[]>([]);
  const [expandedQuestId, setExpandedQuestId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<Quest['status'] | 'all'>('all');

  useEffect(() => {
    const unsubscribe = questLogManager.onQuestUpdate(() => {
      updateQuestData();
    });

    updateQuestData();

    return unsubscribe;
  }, [questLogManager]);

  const updateQuestData = () => {
    setQuests(questLogManager.getAllQuests());
    setQuestLog(questLogManager.getQuestLog(50));
  };

  const filteredQuests = filterStatus === 'all'
    ? quests
    : quests.filter(q => q.status === filterStatus);

  const stats = questLogManager.getQuestStatistics();

  const getStatusIcon = (status: Quest['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress':
      case 'accepted':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'abandoned':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: Quest['status']) => {
    const labels: Record<Quest['status'], string> = {
      accepted: '已接取',
      in_progress: '进行中',
      completed: '已完成',
      abandoned: '已放弃',
      failed: '已失败',
    };
    return labels[status];
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: '#10b981',
      normal: '#3b82f6',
      hard: '#f59e0b',
      legendary: '#a855f7',
    };
    return colors[difficulty] || '#6b7280';
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className={`quest-log-panel ${isOpen ? 'open' : 'closed'}`}>
      <div className="quest-log-header">
        <h2>任务日志</h2>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="quest-log-tabs">
        <button
          className={`tab ${activeTab === 'quests' ? 'active' : ''}`}
          onClick={() => setActiveTab('quests')}
        >
          任务列表
        </button>
        <button
          className={`tab ${activeTab === 'log' ? 'active' : ''}`}
          onClick={() => setActiveTab('log')}
        >
          活动日志
        </button>
        <button
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          统计信息
        </button>
      </div>

      <div className="quest-log-content">
        {activeTab === 'quests' && (
          <div className="quests-tab">
            <div className="quest-filters">
              <button
                className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                全部 ({quests.length})
              </button>
              <button
                className={`filter-btn ${filterStatus === 'accepted' ? 'active' : ''}`}
                onClick={() => setFilterStatus('accepted')}
              >
                已接取 ({stats.accepted})
              </button>
              <button
                className={`filter-btn ${filterStatus === 'in_progress' ? 'active' : ''}`}
                onClick={() => setFilterStatus('in_progress')}
              >
                进行中 ({stats.inProgress})
              </button>
              <button
                className={`filter-btn ${filterStatus === 'completed' ? 'active' : ''}`}
                onClick={() => setFilterStatus('completed')}
              >
                已完成 ({stats.completed})
              </button>
            </div>

            <div className="quests-list">
              {filteredQuests.length === 0 ? (
                <div className="empty-state">暂无任务</div>
              ) : (
                filteredQuests.map(quest => (
                  <div key={quest.id} className="quest-item">
                    <div
                      className="quest-header"
                      onClick={() => setExpandedQuestId(
                        expandedQuestId === quest.id ? null : quest.id
                      )}
                    >
                      <div className="quest-title-row">
                        {getStatusIcon(quest.status)}
                        <span className="quest-title">{quest.title}</span>
                        <span className="quest-npc">来自 {quest.npcName}</span>
                        <span
                          className="quest-difficulty"
                          style={{ backgroundColor: getDifficultyColor(quest.difficulty) }}
                        >
                          {quest.difficulty}
                        </span>
                      </div>
                      <div className="quest-progress">
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${quest.progress}%` }}
                          />
                        </div>
                        <span className="progress-text">{quest.progress}%</span>
                      </div>
                      <button className="expand-btn">
                        {expandedQuestId === quest.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {expandedQuestId === quest.id && (
                      <div className="quest-details">
                        <p className="quest-description">{quest.description}</p>

                        <div className="quest-objectives">
                          <h4>目标</h4>
                          {quest.objectives.map(obj => (
                            <div key={obj.id} className="objective-item">
                              <div className="objective-check">
                                {obj.completed ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <div className="w-4 h-4 border-2 border-gray-400 rounded-full" />
                                )}
                              </div>
                              <span className={obj.completed ? 'completed' : ''}>
                                {obj.description} ({obj.currentCount}/{obj.targetCount})
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="quest-rewards">
                          <h4>奖励</h4>
                          {quest.rewards.map((reward, idx) => (
                            <div key={idx} className="reward-item">
                              <span className="reward-type">{reward.type}</span>
                              <span className="reward-amount">+{reward.amount}</span>
                              {reward.itemName && (
                                <span className="reward-item-name">{reward.itemName}</span>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="quest-status">
                          <span>状态: {getStatusLabel(quest.status)}</span>
                          <span>接取时间: {formatTime(quest.acceptedTime)}</span>
                          {quest.completedTime && (
                            <span>完成时间: {formatTime(quest.completedTime)}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'log' && (
          <div className="log-tab">
            <div className="log-entries">
              {questLog.length === 0 ? (
                <div className="empty-state">暂无日志</div>
              ) : (
                questLog.map((entry, idx) => (
                  <div key={idx} className="log-entry">
                    <span className="log-time">{formatTime(entry.timestamp)}</span>
                    <span className="log-action">{entry.action}</span>
                    <span className="log-details">{entry.details}</span>
                    {entry.rewards && entry.rewards.length > 0 && (
                      <div className="log-rewards">
                        {entry.rewards.map((reward, ridx) => (
                          <span key={ridx} className="reward-badge">
                            +{reward.amount} {reward.type}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="stats-tab">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">总任务数</div>
                <div className="stat-value">{stats.total}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">已完成</div>
                <div className="stat-value" style={{ color: '#10b981' }}>{stats.completed}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">进行中</div>
                <div className="stat-value" style={{ color: '#3b82f6' }}>{stats.inProgress}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">已放弃</div>
                <div className="stat-value" style={{ color: '#f59e0b' }}>{stats.abandoned}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">已失败</div>
                <div className="stat-value" style={{ color: '#ef4444' }}>{stats.failed}</div>
              </div>
            </div>

            <div className="rewards-summary">
              <h3>奖励汇总</h3>
              {Object.entries(stats.totalRewards).length === 0 ? (
                <p className="empty-state">暂无奖励</p>
              ) : (
                <div className="rewards-list">
                  {Object.entries(stats.totalRewards).map(([key, amount]) => (
                    <div key={key} className="reward-summary-item">
                      <span>{key}</span>
                      <span className="reward-amount">+{amount}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
