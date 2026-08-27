# ICE Snow City 游戏前端 API 适配方案

## 项目概述

ICE Snow City 是一款现代化都市模拟经营游戏，包含社交、装备、成就、经济等多个系统。本方案详细说明如何将现有的 82,681 行前端代码与 41,891 行后端代码进行完整集成。

---

## 一、系统架构

### 1.1 前后端通信流程

```
前端（React）
├─ 社交系统（好友、聊天、工会）
├─ 装备系统（穿戴、强化、套装）
├─ 成就系统（解锁、排行榜）
├─ 经济系统（商城、银行、交易）
└─ 游戏场景（3D 渲染、NPC 交互）
        ↓ HTTP/WebSocket
后端（Node.js）
├─ 用户认证系统
├─ 游戏逻辑服务器
├─ 实时通信系统
├─ 数据库（MySQL/TiDB）
└─ 区块链集成（ISC Token）
```

### 1.2 API 端点分类

| 系统 | 端点前缀 | 主要功能 |
|------|---------|---------|
| **社交系统** | `/api/social` | 好友、聊天、工会、玩家卡片 |
| **装备系统** | `/api/equipment` | 穿戴、强化、修复、套装 |
| **成就系统** | `/api/achievements` | 解锁、进度、排行榜 |
| **经济系统** | `/api/economy` | 商城、银行、交易、资产 |
| **游戏场景** | `/api/game` | NPC、任务、事件、环境 |
| **用户系统** | `/api/user` | 登录、注册、资料、设置 |
| **实时通信** | `/ws` | WebSocket 连接 |

---

## 二、前端代码适配步骤

### Step 1: 创建 API 类型定义

**文件：`client/src/lib/api/ice-snow-city-types.ts`**

```typescript
// 社交系统类型
export interface Friend {
  id: string;
  name: string;
  level: number;
  avatar: string;
  isOnline: boolean;
  lastOnlineAt: string;
  isFavorite: boolean;
  status: "online" | "offline" | "away";
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  createdAt: string;
  message?: string;
}

export interface ChatMessage {
  id: string;
  fromUserId: string;
  fromUserName: string;
  content: string;
  type: "text" | "emoji" | "gift" | "system";
  timestamp: string;
  isRead: boolean;
}

export interface Guild {
  id: string;
  name: string;
  level: number;
  leader: string;
  memberCount: number;
  maxMembers: number;
  funds: number;
  announcement: string;
  createdAt: string;
}

// 装备系统类型
export interface Equipment {
  id: string;
  name: string;
  type: "weapon" | "armor" | "accessory" | "shoes" | "hat";
  rarity: "common" | "rare" | "epic" | "legendary";
  level: number;
  stats: EquipmentStats;
  enhanceLevel: number;
  durability: number;
  maxDurability: number;
}

export interface EquipmentStats {
  attack?: number;
  defense?: number;
  hp?: number;
  speed?: number;
  luck?: number;
}

// 成就系统类型
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
}

// 经济系统类型
export interface PlayerAssets {
  coins: number;
  gems: number;
  iscTokens: number;
  bankBalance: number;
  bankInterestRate: number;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: "coins" | "gems" | "isc";
  image: string;
  quantity?: number;
}

// 游戏场景类型
export interface NPC {
  id: string;
  name: string;
  position: [number, number, number];
  dialogueId: string;
  questId?: string;
  isInteractable: boolean;
}

export interface GameEvent {
  id: string;
  type: string;
  data: any;
  timestamp: string;
}
```

### Step 2: 创建专用 API 客户端

**文件：`client/src/lib/api/ice-snow-city-client.ts`**

```typescript
import { apiClient } from "./client";
import {
  Friend,
  FriendRequest,
  ChatMessage,
  Guild,
  Equipment,
  Achievement,
  PlayerAssets,
  ShopItem,
  NPC,
} from "./ice-snow-city-types";

export class IceSnowCityApiClient {
  // ========== 社交系统 ==========

  async getFriendsList(): Promise<Friend[]> {
    return apiClient.get("/api/social/friends");
  }

  async addFriend(friendId: string, message?: string): Promise<Friend> {
    return apiClient.post("/api/social/friends/add", { friendId, message });
  }

  async removeFriend(friendId: string): Promise<void> {
    return apiClient.delete(`/api/social/friends/${friendId}`);
  }

  async getFriendRequests(): Promise<FriendRequest[]> {
    return apiClient.get("/api/social/friend-requests");
  }

  async acceptFriendRequest(requestId: string): Promise<Friend> {
    return apiClient.post(`/api/social/friend-requests/${requestId}/accept`);
  }

  async rejectFriendRequest(requestId: string): Promise<void> {
    return apiClient.delete(`/api/social/friend-requests/${requestId}`);
  }

  async sendChatMessage(
    recipientId: string,
    content: string,
    type: string = "text"
  ): Promise<ChatMessage> {
    return apiClient.post("/api/social/messages", {
      recipientId,
      content,
      type,
    });
  }

  async getChatHistory(friendId: string, limit: number = 50): Promise<ChatMessage[]> {
    return apiClient.get(
      `/api/social/messages/${friendId}?limit=${limit}`
    );
  }

  async getGuildInfo(guildId: string): Promise<Guild> {
    return apiClient.get(`/api/social/guilds/${guildId}`);
  }

  async createGuild(name: string): Promise<Guild> {
    return apiClient.post("/api/social/guilds", { name });
  }

  async joinGuild(guildId: string): Promise<Guild> {
    return apiClient.post(`/api/social/guilds/${guildId}/join`);
  }

  async leaveGuild(guildId: string): Promise<void> {
    return apiClient.delete(`/api/social/guilds/${guildId}/leave`);
  }

  // ========== 装备系统 ==========

  async getEquipment(): Promise<Equipment[]> {
    return apiClient.get("/api/equipment/inventory");
  }

  async equipItem(equipmentId: string, slot: string): Promise<Equipment> {
    return apiClient.post(`/api/equipment/${equipmentId}/equip`, { slot });
  }

  async unequipItem(slot: string): Promise<void> {
    return apiClient.delete(`/api/equipment/equipped/${slot}`);
  }

  async enhanceEquipment(equipmentId: string): Promise<Equipment> {
    return apiClient.post(`/api/equipment/${equipmentId}/enhance`);
  }

  async repairEquipment(equipmentId: string): Promise<Equipment> {
    return apiClient.post(`/api/equipment/${equipmentId}/repair`);
  }

  async getEquipmentStats(): Promise<EquipmentStats> {
    return apiClient.get("/api/equipment/stats");
  }

  // ========== 成就系统 ==========

  async getAchievements(): Promise<Achievement[]> {
    return apiClient.get("/api/achievements");
  }

  async getAchievementProgress(achievementId: string): Promise<Achievement> {
    return apiClient.get(`/api/achievements/${achievementId}`);
  }

  async getLeaderboard(type: string = "points", limit: number = 100): Promise<any[]> {
    return apiClient.get(
      `/api/achievements/leaderboard?type=${type}&limit=${limit}`
    );
  }

  // ========== 经济系统 ==========

  async getPlayerAssets(): Promise<PlayerAssets> {
    return apiClient.get("/api/economy/assets");
  }

  async getShopItems(category?: string): Promise<ShopItem[]> {
    const url = category
      ? `/api/economy/shop?category=${category}`
      : "/api/economy/shop";
    return apiClient.get(url);
  }

  async buyItem(itemId: string, quantity: number = 1): Promise<PlayerAssets> {
    return apiClient.post("/api/economy/shop/buy", { itemId, quantity });
  }

  async depositToBank(amount: number): Promise<PlayerAssets> {
    return apiClient.post("/api/economy/bank/deposit", { amount });
  }

  async withdrawFromBank(amount: number): Promise<PlayerAssets> {
    return apiClient.post("/api/economy/bank/withdraw", { amount });
  }

  async getTransactionHistory(limit: number = 50): Promise<any[]> {
    return apiClient.get(`/api/economy/transactions?limit=${limit}`);
  }

  // ========== 游戏场景 ==========

  async getNPCList(): Promise<NPC[]> {
    return apiClient.get("/api/game/npcs");
  }

  async interactWithNPC(npcId: string): Promise<GameEvent> {
    return apiClient.post(`/api/game/npcs/${npcId}/interact`);
  }

  async getGameEvents(): Promise<GameEvent[]> {
    return apiClient.get("/api/game/events");
  }

  async triggerGameEvent(eventType: string, data: any): Promise<GameEvent> {
    return apiClient.post("/api/game/events", { eventType, data });
  }
}

export const iceSnowCityApi = new IceSnowCityApiClient();
```

### Step 3: 创建专用 React Hook

**文件：`client/src/hooks/useIceSnowCity.ts`**

```typescript
import { useState, useCallback } from "react";
import { iceSnowCityApi } from "@/lib/api/ice-snow-city-client";
import { handleApiError } from "@/lib/api/errorHandler";
import { toast } from "sonner";

// 社交 Hook
export function useFriends() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadFriends = useCallback(async () => {
    try {
      setLoading(true);
      const data = await iceSnowCityApi.getFriendsList();
      setFriends(data);
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  const addFriend = useCallback(
    async (friendId: string, message?: string) => {
      try {
        const newFriend = await iceSnowCityApi.addFriend(friendId, message);
        setFriends((prev) => [...prev, newFriend]);
        toast.success("Friend added");
        return newFriend;
      } catch (error) {
        toast.error(handleApiError(error));
        throw error;
      }
    },
    []
  );

  const removeFriend = useCallback(async (friendId: string) => {
    try {
      await iceSnowCityApi.removeFriend(friendId);
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
      toast.success("Friend removed");
    } catch (error) {
      toast.error(handleApiError(error));
    }
  }, []);

  return { friends, loading, loadFriends, addFriend, removeFriend };
}

// 装备 Hook
export function useEquipment() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadEquipment = useCallback(async () => {
    try {
      setLoading(true);
      const data = await iceSnowCityApi.getEquipment();
      setEquipment(data);
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  const equipItem = useCallback(
    async (equipmentId: string, slot: string) => {
      try {
        const updated = await iceSnowCityApi.equipItem(equipmentId, slot);
        setEquipment((prev) =>
          prev.map((e) => (e.id === equipmentId ? updated : e))
        );
        toast.success("Equipment equipped");
        return updated;
      } catch (error) {
        toast.error(handleApiError(error));
        throw error;
      }
    },
    []
  );

  const enhanceEquipment = useCallback(
    async (equipmentId: string) => {
      try {
        const updated = await iceSnowCityApi.enhanceEquipment(equipmentId);
        setEquipment((prev) =>
          prev.map((e) => (e.id === equipmentId ? updated : e))
        );
        toast.success("Equipment enhanced");
        return updated;
      } catch (error) {
        toast.error(handleApiError(error));
        throw error;
      }
    },
    []
  );

  return {
    equipment,
    loading,
    loadEquipment,
    equipItem,
    enhanceEquipment,
  };
}

// 成就 Hook
export function useAchievements() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadAchievements = useCallback(async () => {
    try {
      setLoading(true);
      const data = await iceSnowCityApi.getAchievements();
      setAchievements(data);
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  return { achievements, loading, loadAchievements };
}

// 经济 Hook
export function useEconomy() {
  const [assets, setAssets] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadAssets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await iceSnowCityApi.getPlayerAssets();
      setAssets(data);
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  const buyItem = useCallback(
    async (itemId: string, quantity: number = 1) => {
      try {
        const updated = await iceSnowCityApi.buyItem(itemId, quantity);
        setAssets(updated);
        toast.success("Item purchased");
        return updated;
      } catch (error) {
        toast.error(handleApiError(error));
        throw error;
      }
    },
    []
  );

  const depositToBank = useCallback(
    async (amount: number) => {
      try {
        const updated = await iceSnowCityApi.depositToBank(amount);
        setAssets(updated);
        toast.success("Deposit successful");
        return updated;
      } catch (error) {
        toast.error(handleApiError(error));
        throw error;
      }
    },
    []
  );

  return { assets, loading, loadAssets, buyItem, depositToBank };
}
```

### Step 4: 更新现有组件

**示例：更新 `FriendsListContainer.tsx`**

```typescript
import { useEffect } from "react";
import { useFriends } from "@/hooks/useIceSnowCity";
import FriendsList from "./FriendsList";

export default function FriendsListContainer() {
  const { friends, loading, loadFriends, addFriend, removeFriend } = useFriends();

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  return (
    <FriendsList
      friends={friends}
      loading={loading}
      onAddFriend={addFriend}
      onRemoveFriend={removeFriend}
      onRefresh={loadFriends}
    />
  );
}
```

---

## 三、实时通信集成

### 3.1 WebSocket 连接管理

**文件：`client/src/lib/websocket/manager.ts`**

```typescript
import { EventEmitter } from "events";

export class WebSocketManager extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  constructor(url: string) {
    super();
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log("WebSocket connected");
          this.reconnectAttempts = 0;
          this.emit("connected");
          resolve();
        };

        this.ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          this.emit("message", data);
          this.emit(data.type, data);
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          this.emit("error", error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log("WebSocket disconnected");
          this.emit("disconnected");
          this.reconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  send(type: string, data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }

  private reconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), this.reconnectDelay);
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const wsManager = new WebSocketManager(
  process.env.REACT_APP_WS_URL || "ws://localhost:3000/ws"
);
```

### 3.2 实时事件监听

**文件：`client/src/hooks/useWebSocket.ts`**

```typescript
import { useEffect, useCallback } from "react";
import { wsManager } from "@/lib/websocket/manager";

export function useWebSocketEvent<T = any>(
  eventType: string,
  handler: (data: T) => void
) {
  useEffect(() => {
    wsManager.on(eventType, handler);
    return () => wsManager.removeListener(eventType, handler);
  }, [eventType, handler]);
}

export function useSendWebSocketMessage() {
  return useCallback((type: string, data: any) => {
    wsManager.send(type, data);
  }, []);
}

// 使用示例
export function useRealtimeFriendStatus() {
  const [onlineFriends, setOnlineFriends] = useState([]);

  useWebSocketEvent("friend_status_changed", (data) => {
    setOnlineFriends((prev) =>
      prev.map((f) =>
        f.id === data.friendId ? { ...f, isOnline: data.isOnline } : f
      )
    );
  });

  return { onlineFriends };
}
```

---

## 四、环境变量配置

**文件：`.env.local`**

```env
# API 配置
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_WS_URL=ws://localhost:3000/ws

# 游戏配置
REACT_APP_GAME_NAME=ICE Snow City
REACT_APP_GAME_VERSION=1.0.0

# 区块链配置
REACT_APP_ISC_CONTRACT_ADDRESS=0x...
REACT_APP_BSC_TESTNET_RPC=https://data-seed-prebsc-1-b.binance.org:8545

# 功能开关
REACT_APP_ENABLE_REAL_TIME=true
REACT_APP_ENABLE_BLOCKCHAIN=true
```

---

## 五、集成检查清单

### 前端组件集成

- [ ] FriendsListContainer - 使用 useFriends Hook
- [ ] PrivateChatContainer - 使用 WebSocket 实时消息
- [ ] EquipmentPanel - 使用 useEquipment Hook
- [ ] GuildPanel - 使用 iceSnowCityApi
- [ ] AchievementPanel - 使用 useAchievements Hook
- [ ] EconomyPanel - 使用 useEconomy Hook
- [ ] NPC 交互系统 - 使用 WebSocket 事件

### 数据同步

- [ ] 登录时加载所有初始数据
- [ ] 实时更新好友在线状态
- [ ] 实时更新聊天消息
- [ ] 实时更新工会通知
- [ ] 实时更新成就进度
- [ ] 实时更新经济数据

### 错误处理

- [ ] 网络错误重试机制
- [ ] 认证过期自动刷新
- [ ] 用户友好的错误提示
- [ ] 离线模式支持（可选）

### 性能优化

- [ ] 请求去重
- [ ] 数据缓存
- [ ] 分页加载
- [ ] 图片懒加载
- [ ] WebSocket 消息压缩

---

## 六、测试策略

### 单元测试

```typescript
import { describe, it, expect, vi } from "vitest";
import { iceSnowCityApi } from "@/lib/api/ice-snow-city-client";

describe("IceSnowCityApiClient", () => {
  it("should fetch friends list", async () => {
    vi.mock("@/lib/api/client", () => ({
      apiClient: {
        get: vi.fn(() =>
          Promise.resolve([
            { id: "1", name: "Friend 1", isOnline: true },
          ])
        ),
      },
    }));

    const friends = await iceSnowCityApi.getFriendsList();
    expect(friends).toHaveLength(1);
    expect(friends[0].name).toBe("Friend 1");
  });
});
```

### 集成测试

- 测试完整的登录流程
- 测试好友添加和删除
- 测试聊天消息发送和接收
- 测试装备穿戴和强化
- 测试商城购买流程

---

## 七、部署配置

### Docker 部署

**Dockerfile**

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV REACT_APP_API_URL=http://api:3000/api
ENV REACT_APP_WS_URL=ws://api:3000/ws

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### docker-compose.yml

```yaml
version: "3.8"

services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      REACT_APP_API_URL: http://backend:3000/api
      REACT_APP_WS_URL: ws://backend:3000/ws
    depends_on:
      - backend

  backend:
    image: ice-snow-city-backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: mysql://user:pass@db:3306/ice_snow_city
      JWT_SECRET: your-secret-key
    depends_on:
      - db

  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: ice_snow_city
    volumes:
      - db_data:/var/lib/mysql

volumes:
  db_data:
```

---

## 八、时间线

| 阶段 | 任务 | 时间 | 状态 |
|------|------|------|------|
| **1** | 创建 API 类型和客户端 | 2-3 天 | ⏳ |
| **2** | 更新所有组件使用新 API | 3-4 天 | ⏳ |
| **3** | WebSocket 实时通信集成 | 2-3 天 | ⏳ |
| **4** | 单元和集成测试 | 2-3 天 | ⏳ |
| **5** | 性能优化和调试 | 2-3 天 | ⏳ |
| **6** | Docker 部署和文档 | 1-2 天 | ⏳ |
| **总计** | 完整集成 | **12-18 天** | ⏳ |

---

## 九、常见问题

**Q: 如何处理 API 超时？**
A: 使用 `withTimeout` 包装 Promise，设置合理的超时时间（通常 30 秒）。

**Q: 如何实现离线模式？**
A: 使用 localStorage 缓存数据，离线时读取缓存，在线时同步。

**Q: 如何优化大量数据加载？**
A: 使用分页、虚拟滚动、数据懒加载等技术。

**Q: 如何处理实时通信中的消息顺序？**
A: 在消息中添加时间戳和序列号，客户端根据这些字段排序。

---

## 十、后续优化

1. **性能优化**
   - 请求合并和去重
   - 响应缓存策略
   - 图片优化和 CDN

2. **功能扩展**
   - 离线模式支持
   - 本地数据同步
   - 推送通知系统

3. **安全加固**
   - 请求签名验证
   - 敏感数据加密
   - 速率限制

4. **监控和分析**
   - API 性能监控
   - 错误追踪
   - 用户行为分析

---

## 参考资源

- 前端 API 集成技能：`/home/ubuntu/skills/frontend-api-integration/SKILL.md`
- API 标准文档：`/home/ubuntu/ice_snow_city_agent/server/integration/API_STANDARDS.md`
- 后端 API 文档：`/home/ubuntu/ice_snow_city_agent/server/integration/`
