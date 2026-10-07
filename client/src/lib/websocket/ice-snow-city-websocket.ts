/**
 * ICE Snow City WebSocket 客户端
 * 提供实时通信功能
 */

import { EventEmitter } from "events";

export interface WebSocketMessage<T = any> {
  type: string;
  data: T;
  timestamp: string;
  requestId?: string;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  messageTimeout?: number;
}

export enum WebSocketEventType {
  // 连接事件
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
  RECONNECTING = "reconnecting",
  ERROR = "error",

  // 社交事件
  FRIEND_STATUS_CHANGED = "friend:status_changed",
  NEW_MESSAGE = "chat:new_message",
  MESSAGE_DELIVERED = "chat:message_delivered",
  TYPING_INDICATOR = "chat:typing_indicator",
  GUILD_NOTIFICATION = "guild:notification",
  GUILD_MEMBER_JOINED = "guild:member_joined",
  GUILD_MEMBER_LEFT = "guild:member_left",

  // 游戏事件
  ACHIEVEMENT_UNLOCKED = "achievement:unlocked",
  LEVEL_UP = "player:level_up",
  ITEM_RECEIVED = "inventory:item_received",
  QUEST_COMPLETED = "quest:completed",
  QUEST_PROGRESS = "quest:progress",

  // 经济事件
  BALANCE_UPDATED = "economy:balance_updated",
  TRANSACTION_COMPLETED = "economy:transaction_completed",
  SHOP_ITEM_RESTOCKED = "shop:item_restocked",

  // 游戏场景事件
  NPC_APPEARED = "scene:npc_appeared",
  NPC_DISAPPEARED = "scene:npc_disappeared",
  WEATHER_CHANGED = "scene:weather_changed",
  TIME_CHANGED = "scene:time_changed",

  // 系统事件
  SERVER_MAINTENANCE = "system:maintenance",
  SERVER_ANNOUNCEMENT = "system:announcement",
  RATE_LIMIT_WARNING = "system:rate_limit_warning",
}

export class IceSnowCityWebSocket extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>();
  private isManualClose = false;

  constructor(config: WebSocketConfig) {
    super();
    this.config = {
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      messageTimeout: 30000,
      ...config,
    };
  }

  /**
   * 连接到 WebSocket 服务器
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.isManualClose = false;
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          console.log("[WebSocket] Connected");
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.emit(WebSocketEventType.CONNECTED);
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error("[WebSocket] Error:", error);
          this.emit(WebSocketEventType.ERROR, error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log("[WebSocket] Disconnected");
          this.stopHeartbeat();
          this.emit(WebSocketEventType.DISCONNECTED);

          if (!this.isManualClose) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.isManualClose = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * 发送消息
   */
  send<T = any>(
    type: string,
    data: any,
    options?: { timeout?: number; requestId?: string }
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket is not connected"));
        return;
      }

      const requestId = options?.requestId || this.generateRequestId();
      const message: WebSocketMessage = {
        type,
        data,
        timestamp: new Date().toISOString(),
        requestId,
      };

      const timeout = options?.timeout ?? this.config.messageTimeout;
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Message timeout: ${type}`));
      }, timeout);

      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout: timeoutHandle,
      });

      try {
        this.ws!.send(JSON.stringify(message));
      } catch (error) {
        this.pendingRequests.delete(requestId);
        clearTimeout(timeoutHandle);
        reject(error);
      }
    });
  }

  /**
   * 订阅事件
   */
  subscribe(eventType: WebSocketEventType, callback: (data: any) => void): () => void {
    this.on(eventType, callback);
    return () => this.off(eventType, callback);
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(rawData: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(rawData);

      // 检查是否是响应消息
      if (message.requestId && this.pendingRequests.has(message.requestId)) {
        const pending = this.pendingRequests.get(message.requestId)!;
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(message.requestId);

        if (message.data?.error) {
          pending.reject(new Error(message.data.error));
        } else {
          pending.resolve(message.data);
        }
        return;
      }

      // 处理事件消息
      this.emit(message.type, message.data);
    } catch (error) {
      console.error("[WebSocket] Failed to parse message:", error);
    }
  }

  /**
   * 尝试重新连接
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error("[WebSocket] Max reconnect attempts reached");
      this.emit(WebSocketEventType.ERROR, new Error("Max reconnect attempts reached"));
      return;
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this.emit(WebSocketEventType.RECONNECTING, { attempt: this.reconnectAttempts });

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        console.error("[WebSocket] Reconnect failed:", error);
      });
    }, delay);
  }

  /**
   * 启动心跳
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send("ping", {}).catch((error) => {
          console.error("[WebSocket] Heartbeat failed:", error);
        });
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 生成请求 ID
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取连接状态
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * 获取连接状态字符串
   */
  getState(): string {
    if (!this.ws) return "CLOSED";
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return "CONNECTING";
      case WebSocket.OPEN:
        return "OPEN";
      case WebSocket.CLOSING:
        return "CLOSING";
      case WebSocket.CLOSED:
        return "CLOSED";
      default:
        return "UNKNOWN";
    }
  }
}

// 创建单例
let wsInstance: IceSnowCityWebSocket | null = null;

export function getWebSocketInstance(): IceSnowCityWebSocket {
  if (!wsInstance) {
    const wsUrl = process.env.REACT_APP_WS_URL || 
      `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ws`;
    
    wsInstance = new IceSnowCityWebSocket({
      url: wsUrl,
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      messageTimeout: 30000,
    });
  }
  return wsInstance;
}

export function resetWebSocketInstance(): void {
  if (wsInstance) {
    wsInstance.disconnect();
    wsInstance = null;
  }
}
