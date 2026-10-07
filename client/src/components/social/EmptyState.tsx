import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Users,
  UserPlus,
  MessageCircle,
  Shield,
  Heart,
  Search,
} from 'lucide-react';
import './empty-state.css';

/**
 * 空状态类型
 */
export type EmptyStateType =
  | 'no-friends'
  | 'no-requests'
  | 'no-blocked'
  | 'no-favorites'
  | 'search-empty'
  | 'no-messages';

/**
 * 空状态配置
 */
const EMPTY_STATE_CONFIG: Record<
  EmptyStateType,
  {
    icon: React.ReactNode;
    title: string;
    description: string;
    actionText?: string;
    actionIcon?: React.ReactNode;
  }
> = {
  'no-friends': {
    icon: <Users className="empty-icon" />,
    title: '还没有好友',
    description: '添加好友后可以在这里看到他们',
    actionText: '添加好友',
    actionIcon: <UserPlus className="icon" />,
  },
  'no-requests': {
    icon: <UserPlus className="empty-icon" />,
    title: '没有待处理的请求',
    description: '当有人请求加你为好友时会显示在这里',
  },
  'no-blocked': {
    icon: <Shield className="empty-icon" />,
    title: '没有屏蔽任何玩家',
    description: '屏蔽的玩家会显示在这里',
  },
  'no-favorites': {
    icon: <Heart className="empty-icon" />,
    title: '还没有收藏好友',
    description: '收藏你最常联系的好友',
  },
  'search-empty': {
    icon: <Search className="empty-icon" />,
    title: '未找到匹配的好友',
    description: '尝试使用不同的关键词搜索',
  },
  'no-messages': {
    icon: <MessageCircle className="empty-icon" />,
    title: '没有消息',
    description: '与好友开始聊天吧',
  },
};

/**
 * 空状态组件属性
 */
interface EmptyStateProps {
  type: EmptyStateType;
  onAction?: () => void;
  actionText?: string;
  customTitle?: string;
  customDescription?: string;
}

/**
 * 空状态组件
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  onAction,
  actionText,
  customTitle,
  customDescription,
}) => {
  const config = EMPTY_STATE_CONFIG[type];

  return (
    <div className="empty-state">
      <div className="empty-state-icon-wrapper">{config.icon}</div>

      <h3 className="empty-state-title">{customTitle || config.title}</h3>

      <p className="empty-state-description">
        {customDescription || config.description}
      </p>

      {onAction && config.actionText && (
        <Button onClick={onAction} className="empty-state-action">
          {config.actionIcon}
          {actionText || config.actionText}
        </Button>
      )}
    </div>
  );
};

/**
 * 在线状态指示器
 */
interface OnlineIndicatorProps {
  status: 'online' | 'offline' | 'away' | 'busy';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export const OnlineIndicator: React.FC<OnlineIndicatorProps> = ({
  status,
  size = 'md',
  animated = true,
}) => {
  const statusClass = `status-${status}`;
  const sizeClass = `indicator-${size}`;
  const animatedClass = animated ? 'animated' : '';

  return (
    <div className={`online-indicator ${statusClass} ${sizeClass} ${animatedClass}`}>
      <div className="indicator-dot" />
      {animated && <div className="indicator-pulse" />}
    </div>
  );
};

/**
 * 在线状态徽章
 */
interface StatusBadgeProps {
  status: 'online' | 'offline' | 'away' | 'busy';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const STATUS_LABELS: Record<string, string> = {
  online: '在线',
  offline: '离线',
  away: '离开',
  busy: '忙碌',
};

const STATUS_COLORS: Record<string, string> = {
  online: '#10b981',
  offline: '#64748b',
  away: '#f59e0b',
  busy: '#ef4444',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showLabel = true,
  size = 'md',
}) => {
  const sizeClass = `badge-${size}`;

  return (
    <div
      className={`status-badge ${sizeClass}`}
      style={{ borderColor: STATUS_COLORS[status] }}
    >
      <div
        className="badge-dot"
        style={{ backgroundColor: STATUS_COLORS[status] }}
      />
      {showLabel && <span className="badge-label">{STATUS_LABELS[status]}</span>}
    </div>
  );
};

/**
 * 在线状态分组标题
 */
interface StatusGroupHeaderProps {
  status: 'online' | 'offline' | 'away' | 'busy' | 'favorites';
  count: number;
}

export const StatusGroupHeader: React.FC<StatusGroupHeaderProps> = ({
  status,
  count,
}) => {
  const statusIcons: Record<string, React.ReactNode> = {
    online: '🟢',
    offline: '⚫',
    away: '🟡',
    busy: '🔴',
    favorites: '⭐',
  };

  const statusLabels: Record<string, string> = {
    online: '在线好友',
    offline: '离线好友',
    away: '离开',
    busy: '忙碌',
    favorites: '收藏好友',
  };

  return (
    <div className="status-group-header">
      <span className="header-icon">{statusIcons[status]}</span>
      <span className="header-label">{statusLabels[status]}</span>
      <span className="header-count">{count}</span>
    </div>
  );
};

export default EmptyState;
