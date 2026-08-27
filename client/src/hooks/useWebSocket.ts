/**
 * WebSocket React Hook
 * 提供简化的 WebSocket 使用方式
 */

import { useEffect, useRef, useCallback, useState } from "react";
import {
  getWebSocketInstance,
  IceSnowCityWebSocket,
  WebSocketEventType,
} from "@/lib/websocket/ice-snow-city-websocket";

interface UseWebSocketOptions {
  autoConnect?: boolean;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
}

/**
 * WebSocket 连接 Hook
 */
export function useWebSocketConnection(options: UseWebSocketOptions = {}) {
  const wsRef = useRef<IceSnowCityWebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    wsRef.current = getWebSocketInstance();
    const ws = wsRef.current;

    const handleConnected = () => {
      setIsConnected(true);
      setError(null);
      options.onConnected?.();
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      options.onDisconnected?.();
    };

    const handleError = (err: Error) => {
      setError(err);
      options.onError?.(err);
    };

    ws.on(WebSocketEventType.CONNECTED, handleConnected);
    ws.on(WebSocketEventType.DISCONNECTED, handleDisconnected);
    ws.on(WebSocketEventType.ERROR, handleError);

    if (options.autoConnect !== false && !ws.isConnected()) {
      ws.connect().catch((err) => {
        console.error("Failed to connect WebSocket:", err);
        setError(err);
      });
    }

    return () => {
      ws.off(WebSocketEventType.CONNECTED, handleConnected);
      ws.off(WebSocketEventType.DISCONNECTED, handleDisconnected);
      ws.off(WebSocketEventType.ERROR, handleError);
    };
  }, [options]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.disconnect();
    }
  }, []);

  return { isConnected, error, disconnect };
}

/**
 * WebSocket 事件订阅 Hook
 */
export function useWebSocketEvent<T = any>(
  eventType: WebSocketEventType | string,
  callback: (data: T) => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const ws = getWebSocketInstance();
    const unsubscribe = ws.subscribe(eventType as WebSocketEventType, callback);

    return unsubscribe;
  }, [eventType, callback, enabled]);
}

/**
 * 好友状态变化 Hook
 */
export function useOnFriendStatusChanged(
  callback: (data: { friendId: string; status: string }) => void
) {
  useWebSocketEvent(WebSocketEventType.FRIEND_STATUS_CHANGED, callback);
}

/**
 * 新消息 Hook
 */
export function useOnNewMessage(
  callback: (data: {
    id: string;
    fromUserId: string;
    fromUserName: string;
    content: string;
    timestamp: string;
  }) => void
) {
  useWebSocketEvent(WebSocketEventType.NEW_MESSAGE, callback);
}

/**
 * 正在输入指示器 Hook
 */
export function useOnTypingIndicator(
  callback: (data: { userId: string; isTyping: boolean }) => void
) {
  useWebSocketEvent(WebSocketEventType.TYPING_INDICATOR, callback);
}

/**
 * 工会通知 Hook
 */
export function useOnGuildNotification(
  callback: (data: {
    guildId: string;
    type: string;
    data: Record<string, any>;
  }) => void
) {
  useWebSocketEvent(WebSocketEventType.GUILD_NOTIFICATION, callback);
}

/**
 * 成就解锁 Hook
 */
export function useOnAchievementUnlocked(
  callback: (data: {
    achievementId: string;
    name: string;
    points: number;
  }) => void
) {
  useWebSocketEvent(WebSocketEventType.ACHIEVEMENT_UNLOCKED, callback);
}

/**
 * 等级提升 Hook
 */
export function useOnLevelUp(
  callback: (data: { level: number; exp: number }) => void
) {
  useWebSocketEvent(WebSocketEventType.LEVEL_UP, callback);
}

/**
 * 获得物品 Hook
 */
export function useOnItemReceived(
  callback: (data: {
    itemId: string;
    itemName: string;
    quantity: number;
  }) => void
) {
  useWebSocketEvent(WebSocketEventType.ITEM_RECEIVED, callback);
}

/**
 * 任务完成 Hook
 */
export function useOnQuestCompleted(
  callback: (data: { questId: string; questName: string; rewards: any }) => void
) {
  useWebSocketEvent(WebSocketEventType.QUEST_COMPLETED, callback);
}

/**
 * 任务进度 Hook
 */
export function useOnQuestProgress(
  callback: (data: {
    questId: string;
    objectiveId: string;
    progress: number;
  }) => void
) {
  useWebSocketEvent(WebSocketEventType.QUEST_PROGRESS, callback);
}

/**
 * 余额更新 Hook
 */
export function useOnBalanceUpdated(
  callback: (data: {
    coins: number;
    gems: number;
    iscTokens: number;
  }) => void
) {
  useWebSocketEvent(WebSocketEventType.BALANCE_UPDATED, callback);
}

/**
 * 交易完成 Hook
 */
export function useOnTransactionCompleted(
  callback: (data: {
    transactionId: string;
    type: string;
    amount: number;
  }) => void
) {
  useWebSocketEvent(WebSocketEventType.TRANSACTION_COMPLETED, callback);
}

/**
 * 天气变化 Hook
 */
export function useOnWeatherChanged(
  callback: (data: { weather: string; intensity: number }) => void
) {
  useWebSocketEvent(WebSocketEventType.WEATHER_CHANGED, callback);
}

/**
 * 时间变化 Hook
 */
export function useOnTimeChanged(
  callback: (data: { hour: number; minute: number; day: number }) => void
) {
  useWebSocketEvent(WebSocketEventType.TIME_CHANGED, callback);
}

/**
 * 服务器维护 Hook
 */
export function useOnServerMaintenance(
  callback: (data: { startTime: string; duration: number; message: string }) => void
) {
  useWebSocketEvent(WebSocketEventType.SERVER_MAINTENANCE, callback);
}

/**
 * 服务器公告 Hook
 */
export function useOnServerAnnouncement(
  callback: (data: { title: string; content: string; type: string }) => void
) {
  useWebSocketEvent(WebSocketEventType.SERVER_ANNOUNCEMENT, callback);
}

/**
 * 发送 WebSocket 消息 Hook
 */
export function useSendWebSocketMessage() {
  const sendMessage = useCallback(
    async <T = any>(type: string, data: any): Promise<T> => {
      const ws = getWebSocketInstance();
      return ws.send<T>(type, data);
    },
    []
  );

  return sendMessage;
}

/**
 * 发送正在输入指示器 Hook
 */
export function useSendTypingIndicator() {
  const send = useSendWebSocketMessage();

  const sendTyping = useCallback(
    async (recipientId: string, isTyping: boolean) => {
      return send("chat:typing", { recipientId, isTyping });
    },
    [send]
  );

  return sendTyping;
}

/**
 * 发送消息 Hook
 */
export function useSendMessage() {
  const send = useSendWebSocketMessage();

  const sendMessage = useCallback(
    async (recipientId: string, content: string) => {
      return send("chat:send", { recipientId, content });
    },
    [send]
  );

  return sendMessage;
}

/**
 * 多事件订阅 Hook
 */
export function useWebSocketEvents(
  events: Array<{
    type: WebSocketEventType | string;
    callback: (data: any) => void;
  }>
) {
  useEffect(() => {
    const ws = getWebSocketInstance();
    const unsubscribers = events.map((event) =>
      ws.subscribe(event.type as WebSocketEventType, event.callback)
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [events]);
}
