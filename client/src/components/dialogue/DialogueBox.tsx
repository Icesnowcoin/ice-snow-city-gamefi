/**
 * NPC 对话框组件
 * 显示 NPC 对话内容、选项和历史记录
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, ChevronDown } from 'lucide-react';
import './dialogue-box.css';

export interface DialogueOption {
  id: string;
  text: string;
  nextDialogueId?: string;
  action?: () => void;
  disabled?: boolean;
}

export interface DialogueMessage {
  id: string;
  speaker: 'npc' | 'player';
  name: string;
  text: string;
  emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'thinking';
  avatar?: string;
  timestamp: number;
}

export interface DialogueBoxProps {
  npcName: string;
  npcAvatar?: string;
  currentDialogue: string;
  options: DialogueOption[];
  messages: DialogueMessage[];
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (optionId: string) => void;
  showHistory?: boolean;
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({
  npcName,
  npcAvatar,
  currentDialogue,
  options,
  messages,
  isOpen,
  onClose,
  onSelectOption,
  showHistory = true,
}) => {
  const [expandedHistory, setExpandedHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isOpen) return null;

  const emotionClass = messages[messages.length - 1]?.emotion || 'neutral';

  return (
    <div className="dialogue-box-container">
      {/* 背景遮罩 */}
      <div className="dialogue-overlay" onClick={onClose} />

      {/* 对话框主体 */}
      <Card className="dialogue-box-card">
        {/* 头部 */}
        <div className="dialogue-header">
          <div className="dialogue-header-left">
            {npcAvatar && (
              <img src={npcAvatar} alt={npcName} className="dialogue-avatar" />
            )}
            <div className="dialogue-header-info">
              <h3 className="dialogue-npc-name">{npcName}</h3>
              <p className="dialogue-emotion">{emotionClass}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="dialogue-close-btn"
            aria-label="关闭对话"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* 对话历史 */}
        {showHistory && messages.length > 0 && (
          <ScrollArea className="dialogue-history" ref={scrollRef}>
            <div className="dialogue-messages">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`dialogue-message dialogue-message-${msg.speaker}`}
                >
                  <div className="dialogue-message-header">
                    <span className="dialogue-message-name">{msg.name}</span>
                    <span className="dialogue-message-time">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="dialogue-message-text">{msg.text}</p>
                  {msg.emotion && (
                    <span className={`dialogue-emotion-badge emotion-${msg.emotion}`}>
                      {msg.emotion}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* 当前对话 */}
        <div className="dialogue-current">
          <div className="dialogue-current-header">
            <h4>当前对话</h4>
            {showHistory && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedHistory(!expandedHistory)}
                className="dialogue-history-toggle"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    expandedHistory ? 'rotate-180' : ''
                  }`}
                />
              </Button>
            )}
          </div>
          <p className="dialogue-current-text">{currentDialogue}</p>
        </div>

        {/* 对话选项 */}
        <div className="dialogue-options">
          <p className="dialogue-options-label">选择你的回应：</p>
          <div className="dialogue-options-list">
            {options.map((option) => (
              <Button
                key={option.id}
                variant="outline"
                className="dialogue-option-btn"
                onClick={() => {
                  onSelectOption(option.id);
                  option.action?.();
                }}
                disabled={option.disabled}
                aria-label={`选择: ${option.text}`}
              >
                {option.text}
              </Button>
            ))}
          </div>
        </div>

        {/* 底部提示 */}
        <div className="dialogue-footer">
          <p className="dialogue-tip">💡 提示：选择不同的对话选项会影响 NPC 好感度和任务进度</p>
        </div>
      </Card>
    </div>
  );
};

export default DialogueBox;
