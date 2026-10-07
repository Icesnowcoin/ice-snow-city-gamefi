import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';

/**
 * 多玩家实时通信系统
 * 使用 Socket.IO 实现玩家间的实时交互
 */

export interface Player {
  id: string;
  username: string;
  position: { x: number; y: number };
  level: number;
  wealth: number;
  isOnline: boolean;
  lastUpdate: number;
}

export interface GameMessage {
  type: 'chat' | 'trade' | 'transaction' | 'event' | 'notification';
  from: string;
  to?: string;
  content: string;
  timestamp: number;
  channel?: 'public' | 'private' | 'team' | 'guild' | 'community';
}

export interface TradeOffer {
  id: string;
  from: string;
  to: string;
  offering: { item: string; quantity: number }[];
  requesting: { item: string; quantity: number }[];
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: number;
  expiresAt: number;
}

/**
 * 多玩家系统管理器
 */
export class MultiplayerSystemManager {
  private io: SocketIOServer;
  private players: Map<string, Player> = new Map();
  private messages: GameMessage[] = [];
  private trades: Map<string, TradeOffer> = new Map();
  private rooms: Map<string, Set<string>> = new Map();
  private maxMessages = 1000;
  private maxTrades = 5000;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.VITE_FRONTEND_URL || '*',
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });

    this.setupEventHandlers();
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`[MultiplayerSystem] Player connected: ${socket.id}`);

      // 玩家加入游戏
      socket.on('player:join', (data: { playerId: string; username: string }) => {
        this.handlePlayerJoin(socket, data);
      });

      // 玩家移动
      socket.on('player:move', (data: { position: { x: number; y: number } }) => {
        this.handlePlayerMove(socket, data);
      });

      // 玩家聊天
      socket.on('chat:send', (data: GameMessage) => {
        this.handleChatMessage(socket, data);
      });

      // 交易请求
      socket.on('trade:offer', (data: TradeOffer) => {
        this.handleTradeOffer(socket, data);
      });

      // 交易响应
      socket.on('trade:respond', (data: { tradeId: string; accepted: boolean }) => {
        this.handleTradeResponse(socket, data);
      });

      // 玩家离线
      socket.on('disconnect', () => {
        this.handlePlayerDisconnect(socket);
      });
    });
  }

  /**
   * 处理玩家加入
   */
  private handlePlayerJoin(socket: Socket, data: { playerId: string; username: string }): void {
    const player: Player = {
      id: data.playerId,
      username: data.username,
      position: { x: 0, y: 0 },
      level: 1,
      wealth: 1000,
      isOnline: true,
      lastUpdate: Date.now(),
    };

    this.players.set(socket.id, player);
    socket.join('game-world');

    // 广播玩家加入事件
    this.io.to('game-world').emit('player:joined', {
      playerId: socket.id,
      player,
      totalPlayers: this.players.size,
    });

    // 发送当前所有玩家给新加入的玩家
    socket.emit('players:list', Array.from(this.players.values()));
  }

  /**
   * 处理玩家移动
   */
  private handlePlayerMove(socket: Socket, data: { position: { x: number; y: number } }): void {
    const player = this.players.get(socket.id);
    if (player) {
      player.position = data.position;
      player.lastUpdate = Date.now();

      // 广播玩家移动
      this.io.to('game-world').emit('player:moved', {
        playerId: socket.id,
        position: data.position,
      });
    }
  }

  /**
   * 处理聊天消息
   */
  private handleChatMessage(socket: Socket, data: GameMessage): void {
    const player = this.players.get(socket.id);
    if (!player) return;

    const message: GameMessage = {
      ...data,
      from: player.username,
      timestamp: Date.now(),
    };

    this.messages.push(message);
    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }

    // 根据频道广播消息
    if (message.channel === 'private' && message.to) {
      // 私聊 - 只发送给指定玩家
      this.io.to(message.to).emit('chat:received', message);
      socket.emit('chat:received', message);
    } else if (message.channel === 'public') {
      // 公频 - 发送给所有玩家
      this.io.to('game-world').emit('chat:received', message);
    } else if (message.channel === 'team') {
      // 队伍频道
      this.io.to(`team:${player.id}`).emit('chat:received', message);
    } else if (message.channel === 'guild') {
      // 工会频道
      this.io.to(`guild:${player.id}`).emit('chat:received', message);
    }
  }

  /**
   * 处理交易请求
   */
  private handleTradeOffer(socket: Socket, data: TradeOffer): void {
    const player = this.players.get(socket.id);
    if (!player) return;

    const trade: TradeOffer = {
      ...data,
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: socket.id,
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24小时过期
    };

    this.trades.set(trade.id, trade);
    if (this.trades.size > this.maxTrades) {
      const firstKey = this.trades.keys().next().value as string | undefined;
      if (firstKey) {
        this.trades.delete(firstKey);
      }
    }

    // 通知交易对方
    if (data.to) {
      this.io.to(data.to).emit('trade:received', trade);
    }

    // 确认交易请求已发送
    socket.emit('trade:sent', { tradeId: trade.id });
  }

  /**
   * 处理交易响应
   */
  private handleTradeResponse(
    socket: Socket,
    data: { tradeId: string; accepted: boolean }
  ): void {
    const trade = this.trades.get(data.tradeId);
    if (!trade) return;

    if (data.accepted) {
      trade.status = 'accepted';
      // 通知交易发起者
      this.io.to(trade.from).emit('trade:accepted', trade);
      // 通知交易接收者
      socket.emit('trade:accepted', trade);
    } else {
      trade.status = 'rejected';
      // 通知交易发起者
      this.io.to(trade.from).emit('trade:rejected', trade);
    }
  }

  /**
   * 处理玩家断开连接
   */
  private handlePlayerDisconnect(socket: Socket): void {
    const player = this.players.get(socket.id);
    if (player) {
      player.isOnline = false;
      console.log(`[MultiplayerSystem] Player disconnected: ${socket.id}`);

      // 广播玩家离线
      this.io.to('game-world').emit('player:disconnected', {
        playerId: socket.id,
        totalPlayers: this.players.size,
      });

      // 延迟删除玩家（允许重连）
      setTimeout(() => {
        if (!player.isOnline) {
          this.players.delete(socket.id);
        }
      }, 5 * 60 * 1000); // 5分钟后删除
    }
  }

  /**
   * 获取在线玩家列表
   */
  getOnlinePlayers(): Player[] {
    return Array.from(this.players.values()).filter((p) => p.isOnline);
  }

  /**
   * 获取玩家信息
   */
  getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  /**
   * 获取最近的聊天消息
   */
  getRecentMessages(limit: number = 50): GameMessage[] {
    return this.messages.slice(-limit);
  }

  /**
   * 获取交易信息
   */
  getTrade(tradeId: string): TradeOffer | undefined {
    return this.trades.get(tradeId);
  }

  /**
   * 获取玩家的待处理交易
   */
  getPlayerTrades(playerId: string): TradeOffer[] {
    return Array.from(this.trades.values()).filter(
      (t) => (t.from === playerId || t.to === playerId) && t.status === 'pending'
    );
  }

  /**
   * 广播系统消息
   */
  broadcastSystemMessage(message: string): void {
    this.io.to('game-world').emit('system:message', {
      type: 'notification',
      content: message,
      timestamp: Date.now(),
    });
  }

  /**
   * 获取系统统计信息
   */
  getSystemStats(): {
    totalPlayers: number;
    onlinePlayers: number;
    totalMessages: number;
    totalTrades: number;
    activeTrades: number;
  } {
    return {
      totalPlayers: this.players.size,
      onlinePlayers: this.getOnlinePlayers().length,
      totalMessages: this.messages.length,
      totalTrades: this.trades.size,
      activeTrades: Array.from(this.trades.values()).filter((t) => t.status === 'pending').length,
    };
  }
}

export default MultiplayerSystemManager;
