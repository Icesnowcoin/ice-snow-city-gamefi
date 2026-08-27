import React, { useState, useEffect } from 'react';
import { DialogueNode, DialogueOption } from '../npc/NPCDialogueSystem';
import '../styles/npc-dialogue.css';

interface NPCDialogueUIProps {
  npcName: string;
  dialogue: DialogueNode | null;
  isActive: boolean;
  onSelectOption: (optionId: string) => void;
  onClose: () => void;
}

/**
 * NPC 对话 UI 组件
 */
export const NPCDialogueUI: React.FC<NPCDialogueUIProps> = ({
  npcName,
  dialogue,
  isActive,
  onSelectOption,
  onClose,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // 打字机效果
  useEffect(() => {
    if (dialogue && dialogue.text) {
      setIsTyping(true);
      setDisplayedText('');

      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex < dialogue.text.length) {
          setDisplayedText(dialogue.text.substring(0, currentIndex + 1));
          currentIndex++;
        } else {
          setIsTyping(false);
          clearInterval(interval);
        }
      }, 50); // 每 50ms 显示一个字符

      return () => clearInterval(interval);
    }
  }, [dialogue]);

  if (!isActive || !dialogue) {
    return null;
  }

  const emotionClass = dialogue.emotion ? `emotion-${dialogue.emotion}` : '';

  return (
    <div className="npc-dialogue-ui">
      <div className={`dialogue-box ${emotionClass}`}>
        {/* NPC 名字和头像 */}
        <div className="dialogue-header">
          <div className="npc-avatar">
            <div className="avatar-placeholder">{npcName.charAt(0)}</div>
          </div>
          <div className="npc-info">
            <h3 className="npc-name">{npcName}</h3>
            <div className="emotion-indicator">{dialogue.emotion || 'neutral'}</div>
          </div>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* 对话文本 */}
        <div className="dialogue-content">
          <p className="dialogue-text">{displayedText}</p>
          {isTyping && <span className="typing-indicator">▌</span>}
        </div>

        {/* 对话选项 */}
        <div className="dialogue-options">
          {dialogue.options.map((option: DialogueOption) => (
            <button
              key={option.id}
              className="dialogue-option-button"
              onClick={() => {
                onSelectOption(option.id);
              }}
              disabled={isTyping}
            >
              <span className="option-text">{option.text}</span>
              {option.reward && (
                <span className="option-reward">
                  +{option.reward.amount} {option.reward.type}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NPCDialogueUI;
