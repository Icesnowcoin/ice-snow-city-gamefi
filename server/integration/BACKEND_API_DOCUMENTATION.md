# ICE Snow City 后端 API 接口文档和修改建议

## 文档概述

本文档为后端团队提供完整的 API 接口规范、实现建议和修改清单，确保与前端的无缝集成。

---

## 一、API 响应标准回顾

### 1.1 成功响应格式

所有成功的 API 响应必须遵循以下格式：

```json
{
  "code": 0,
  "message": "Success",
  "data": {
    // 实际数据
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "uuid-123-456"
}
```

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | number | 状态码，0 表示成功 |
| `message` | string | 状态消息 |
| `data` | any | 响应数据 |
| `timestamp` | string | ISO 8601 时间戳 |
| `requestId` | string | 唯一请求 ID，用于追踪 |

### 1.2 错误响应格式

```json
{
  "code": 400,
  "message": "Validation failed",
  "error": {
    "type": "VALIDATION_FAILED",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "uuid-123-456"
}
```

### 1.3 分页响应格式

```json
{
  "code": 0,
  "message": "Success",
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "hasMore": true
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "uuid-123-456"
}
```

### 1.4 HTTP 状态码映射

| HTTP 状态码 | API Code | 说明 |
|------------|---------|------|
| 200 | 0 | 成功 |
| 400 | 3001 | 验证失败 |
| 401 | 1001 | 需要认证 |
| 403 | 2001 | 权限不足 |
| 404 | 4001 | 资源不存在 |
| 500 | 5001 | 数据库错误 |

---

## 二、API 端点规范

### 2.1 社交系统 API

#### 2.1.1 获取好友列表

**端点：** `GET /api/social/friends`

**认证：** 必需（Bearer Token）

**查询参数：**

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `status` | string | 否 | 过滤状态：all, online, offline |
| `page` | number | 否 | 页码，默认 1 |
| `pageSize` | number | 否 | 每页数量，默认 20 |

**响应示例：**

```json
{
  "code": 0,
  "message": "Success",
  "data": {
    "items": [
      {
        "id": "user-123",
        "name": "Player 1",
        "level": 10,
        "avatar": "https://...",
        "isOnline": true,
        "lastOnlineAt": "2024-01-01T12:00:00Z",
        "isFavorite": false,
        "status": "online"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 20,
    "hasMore": true
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "uuid-123"
}
```

**实现建议：**
- 使用数据库连接池优化查询性能
- 添加缓存层（Redis）缓存好友列表
- 实现在线状态实时更新（通过 WebSocket）
- 支持模糊搜索好友名称

#### 2.1.2 添加好友

**端点：** `POST /api/social/friends/add`

**认证：** 必需

**请求体：**

```json
{
  "friendId": "user-456",
  "message": "Let's be friends!"
}
```

**响应示例：**

```json
{
  "code": 0,
  "message": "Friend request sent",
  "data": {
    "requestId": "req-123",
    "status": "pending",
    "createdAt": "2024-01-01T12:00:00Z"
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "uuid-123"
}
```

**实现建议：**
- 检查是否已是好友或已发送请求
- 检查黑名单
- 发送好友请求通知（WebSocket）
- 记录操作日志

#### 2.1.3 删除好友

**端点：** `DELETE /api/social/friends/{friendId}`

**认证：** 必需

**响应示例：**

```json
{
  "code": 0,
  "message": "Friend removed",
  "data": null,
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "uuid-123"
}
```

**实现建议：**
- 删除双向好友关系
- 清理相关的私聊记录（可选）
- 发送删除通知

#### 2.1.4 获取好友请求

**端点：** `GET /api/social/friend-requests`

**认证：** 必需

**响应示例：**

```json
{
  "code": 0,
  "message": "Success",
  "data": {
    "items": [
      {
        "id": "req-123",
        "fromUserId": "user-456",
        "fromUserName": "Player 2",
        "createdAt": "2024-01-01T12:00:00Z",
        "message": "Let's be friends!"
      }
    ],
    "total": 5,
    "page": 1,
    "pageSize": 20,
    "hasMore": false
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "uuid-123"
}
```

#### 2.1.5 接受好友请求

**端点：** `POST /api/social/friend-requests/{requestId}/accept`

**认证：** 必需

**响应示例：**

```json
{
  "code": 0,
  "message": "Friend request accepted",
  "data": {
    "id": "user-456",
    "name": "Player 2",
    "level": 10,
    "avatar": "https://...",
    "isOnline": true,
    "lastOnlineAt": "2024-01-01T12:00:00Z",
    "isFavorite": false,
    "status": "online"
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "uuid-123"
}
```

**实现建议：**
- 创建双向好友关系
- 删除好友请求记录
- 发送接受通知给请求者
- 更新双方的好友列表缓存

#### 2.1.6 拒绝好友请求

**端点：** `DELETE /api/social/friend-requests/{requestId}`

**认证：** 必需

**响应示例：**

```json
{
  "code": 0,
  "message": "Friend request rejected",
  "data": null,
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "uuid-123"
}
```

#### 2.1.7 发送聊天消息

**端点：** `POST /api/social/messages`

**认证：** 必需

**请求体：**

```json
{
  "recipientId": "user-456",
  "content": "Hello!",
  "type": "text"
}
```

**响应示例：**

```json
{
  "code": 0,
  "message": "Message sent",
  "data": {
    "id": "msg-123",
    "fromUserId": "user-123",
    "fromUserName": "Player 1",
    "content": "Hello!",
    "type": "text",
    "timestamp": "2024-01-01T12:00:00Z",
    "isRead": false
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "uuid-123"
}
```

**实现建议：**
- 验证收件人是否是好友
- 检查是否被屏蔽
- 通过 WebSocket 实时推送消息
- 存储消息到数据库
- 支持消息类型：text, emoji, gift, system

#### 2.1.8 获取聊天记录

**端点：** `GET /api/social/messages/{friendId}`

**认证：** 必需

**查询参数：**

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `limit` | number | 否 | 返回数量，默认 50，最大 100 |
| `offset` | number | 否 | 偏移量，用于分页 |

**响应示例：**

```json
{
  "code": 0,
  "message": "Success",
  "data": {
    "items": [
      {
        "id": "msg-123",
        "fromUserId": "user-123",
        "fromUserName": "Player 1",
        "content": "Hello!",
        "type": "text",
        "timestamp": "2024-01-01T12:00:00Z",
        "isRead": true
      }
    ],
    "total": 100,
    "hasMore": true
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "uuid-123"
}
```

**实现建议：**
- 按时间倒序返回消息
- 标记消息为已读
- 实现消息分页加载
- 支持消息搜索功能

#### 2.1.9 创建工会

**端点：** `POST /api/social/guilds`

**认证：** 必需

**请求体：**

```json
{
  "name": "Guild Name",
  "description": "Guild description"
}
```

**响应示例：**

```json
{
  "code": 0,
  "message": "Guild created",
  "data": {
    "id": "guild-123",
    "name": "Guild Name",
    "level": 1,
    "leader": "user-123",
    "memberCount": 1,
    "maxMembers": 50,
    "funds": 0,
    "announcement": "",
    "createdAt": "2024-01-01T12:00:00Z"
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "uuid-123"
}
```

**实现建议：**
- 检查玩家是否已在其他工会
- 设置创建者为工会领导者
- 初始化工会资金和等级
- 记录工会创建日志

#### 2.1.10 加入工会

**端点：** `POST /api/social/guilds/{guildId}/join`

**认证：** 必需

**请求体：**

```json
{
  "message": "I want to join your guild!"
}
```

**响应示例：**

```json
{
  "code": 0,
  "message": "Guild joined",
  "data": {
    "id": "guild-123",
    "name": "Guild Name",
    "level": 1,
    "leader": "user-456",
    "memberCount": 2,
    "maxMembers": 50,
    "funds": 1000,
    "announcement": "Welcome to our guild!",
    "createdAt": "2024-01-01T12:00:00Z"
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "uuid-123"
}
```

**实现建议：**
- 检查工会是否已满员
- 检查玩家是否已在工会
- 发送加入申请或直接加入（取决于工会设置）
- 通知工会领导者
- 更新工会成员列表缓存

#### 2.1.11 离开工会

**端点：** `DELETE /api/social/guilds/{guildId}/leave`

**认证：** 必需

**响应示例：**

```json
{
  "code": 0,
  "message": "Guild left",
  "data": null,
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "uuid-123"
}
```

**实现建议：**
- 检查玩家是否是工会领导者
- 如果是领导者，转移领导权或解散工会
- 更新工会成员列表
- 清理相关权限

---

### 2.2 装备系统 API

#### 2.2.1 获取背包物品

**端点：** `GET /api/equipment/inventory`

**认证：** 必需

**响应示例：**

```json
{
  "code": 0,
  "message": "Success",
  "data": {
    "items": [
      {
        "id": "eq-123",
        "name": "Iron Sword",
        "type": "weapon",
        "rarity": "common",
        "level": 1,
        "stats": {
          "attack": 10,
          "defense": 0,
          "hp": 0,
          "speed": 0,
          "luck": 0
        },
        "enhanceLevel": 0,
        "durability": 100,
        "maxDurability": 100
      }
    ],
    "total": 20
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "uuid-123"
}
```

#### 2.2.2 穿戴装备

**端点：** `POST /api/equipment/{equipmentId}/equip`

**认证：** 必需

**请求体：**

```json
{
  "slot": "weapon"
}
```

**响应示例：**

```json
{
  "code": 0,
  "message": "Equipment equipped",
  "data": {
    "id": "eq-123",
    "name": "Iron Sword",
    "type": "weapon",
    "rarity": "common",
    "level": 1,
    "stats": {
      "attack": 10
    },
    "enhanceLevel": 0,
    "durability": 100,
    "maxDurability": 100,
    "isEquipped": true,
    "equippedSlot": "weapon"
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "uuid-123"
}
```

**实现建议：**
- 验证装备是否属于玩家
- 检查装备槽位是否有冲突
- 卸下之前的装备
- 更新玩家属性
- 发送装备变更通知

#### 2.2.3 卸下装备

**端点：** `DELETE /api/equipment/equipped/{slot}`

**认证：** 必需

**响应示例：**

```json
{
  "code": 0,
  "message": "Equipment unequipped",
  "data": {
    "slot": "weapon",
    "equipment": null
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "uuid-123"
}
```

#### 2.2.4 强化装备

**端点：** `POST /api/equipment/{equipmentId}/enhance`

**认证：** 必需

**请求体：**

```json
{
  "materials": ["mat-1", "mat-2"],
  "coins": 1000
}
```

**响应示例：**

```json
{
  "code": 0,
  "message": "Equipment enhanced",
  "data": {
    "id": "eq-123",
    "name": "Iron Sword",
    "enhanceLevel": 1,
    "stats": {
      "attack": 12
    },
    "cost": {
      "coins": 1000,
      "materials": ["mat-1", "mat-2"]
    }
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "uuid-123"
}
```

**实现建议：**
- 检查玩家资源是否足够
- 计算强化成功率
- 更新装备等级和属性
- 消耗材料和货币
- 记录强化日志

#### 2.2.5 获取装备属性总和

**端点：** `GET /api/equipment/stats`

**认证：** 必需

**响应示例：**

```json
{
  "code": 0,
  "message": "Success",
  "data": {
    "totalStats": {
      "attack": 50,
      "defense": 30,
      "hp": 100,
      "speed": 20,
      "luck": 10
    },
    "equippedItems": 5,
    "totalEnhanceLevel": 5,
    "setEffects": [
      {
        "name": "Dragon Set",
        "bonus": {
          "attack": 10,
          "defense": 5
        }
      }
    ]
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "uuid-123"
}
```

---

### 2.3 成就系统 API

#### 2.3.1 获取成就列表

**端点：** `GET /api/achievements`

**认证：** 必需

**查询参数：**

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `status` | string | 否 | 过滤：all, unlocked, locked |
| `category` | string | 否 | 分类过滤 |

**响应示例：**

```json
{
  "code": 0,
  "message": "Success",
  "data": {
    "items": [
      {
        "id": "ach-1",
        "name": "First Step",
        "description": "Complete your first quest",
        "icon": "https://...",
        "points": 10,
        "isUnlocked": true,
        "unlockedAt": "2024-01-01T12:00:00Z",
        "progress": 1,
        "maxProgress": 1
      }
    ],
    "total": 50,
    "unlockedCount": 5,
    "totalPoints": 50
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "uuid-123"
}
```

#### 2.3.2 获取排行榜

**端点：** `GET /api/achievements/leaderboard`

**认证：** 可选

**查询参数：**

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `type` | string | 否 | 排行类型：points, level, wealth |
| `limit` | number | 否 | 返回数量，默认 100 |
| `page` | number | 否 | 页码 |

**响应示例：**

```json
{
  "code": 0,
  "message": "Success",
  "data": {
    "items": [
      {
        "rank": 1,
        "userId": "user-123",
        "userName": "Player 1",
        "avatar": "https://...",
        "points": 1000,
        "level": 50,
        "wealth": 1000000
      }
    ],
    "total": 1000,
    "userRank": 5
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "uuid-123"
}
```

**实现建议：**
- 使用数据库索引优化排行榜查询
- 实现缓存更新策略
- 支持多种排行类型
- 显示用户在排行榜中的位置

---

### 2.4 经济系统 API

#### 2.4.1 获取玩家资产

**端点：** `GET /api/economy/assets`

**认证：** 必需

**响应示例：**

```json
{
  "code": 0,
  "message": "Success",
  "data": {
    "coins": 10000,
    "gems": 500,
    "iscTokens": 100,
    "bankBalance": 50000,
    "bankInterestRate": 0.05,
    "properties": [
      {
        "id": "prop-1",
        "name": "House 1",
        "value": 100000,
        "location": "Downtown"
      }
    ]
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "uuid-123"
}
```

#### 2.4.2 获取商城物品

**端点：** `GET /api/economy/shop`

**认证：** 可选

**查询参数：**

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `category` | string | 否 | 分类：equipment, consumable, material |
| `page` | number | 否 | 页码 |
| `pageSize` | number | 否 | 每页数量 |

**响应示例：**

```json
{
  "code": 0,
  "message": "Success",
  "data": {
    "items": [
      {
        "id": "item-1",
        "name": "Health Potion",
        "description": "Restore 100 HP",
        "price": 100,
        "currency": "coins",
        "image": "https://...",
        "quantity": 999
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 20,
    "hasMore": true
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "uuid-123"
}
```

#### 2.4.3 购买物品

**端点：** `POST /api/economy/shop/buy`

**认证：** 必需

**请求体：**

```json
{
  "itemId": "item-1",
  "quantity": 5
}
```

**响应示例：**

```json
{
  "code": 0,
  "message": "Purchase successful",
  "data": {
    "items": [
      {
        "id": "item-1",
        "name": "Health Potion",
        "quantity": 5
      }
    ],
    "totalCost": 500,
    "currency": "coins",
    "remainingBalance": 9500
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "uuid-123"
}
```

**实现建议：**
- 检查玩家资源是否足够
- 检查商城物品库存
- 执行购买事务
- 更新玩家资产
- 记录交易日志

#### 2.4.4 存入银行

**端点：** `POST /api/economy/bank/deposit`

**认证：** 必需

**请求体：**

```json
{
  "amount": 5000
}
```

**响应示例：**

```json
{
  "code": 0,
  "message": "Deposit successful",
  "data": {
    "depositAmount": 5000,
    "bankBalance": 55000,
    "interestEarned": 2750,
    "nextInterestTime": "2024-01-08T12:00:00Z"
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "uuid-123"
}
```

**实现建议：**
- 检查玩家是否有足够的币
- 更新银行余额
- 计算利息
- 记录交易历史

#### 2.4.5 从银行提取

**端点：** `POST /api/economy/bank/withdraw`

**认证：** 必需

**请求体：**

```json
{
  "amount": 5000
}
```

**响应示例：**

```json
{
  "code": 0,
  "message": "Withdrawal successful",
  "data": {
    "withdrawAmount": 5000,
    "bankBalance": 50000,
    "coins": 15000
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "uuid-123"
}
```

---

### 2.5 游戏场景 API

#### 2.5.1 获取 NPC 列表

**端点：** `GET /api/game/npcs`

**认证：** 可选

**响应示例：**

```json
{
  "code": 0,
  "message": "Success",
  "data": {
    "items": [
      {
        "id": "npc-1",
        "name": "John",
        "position": [100, 50, 0],
        "dialogueId": "dialogue-1",
        "questId": "quest-1",
        "isInteractable": true
      }
    ],
    "total": 20
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "uuid-123"
}
```

#### 2.5.2 与 NPC 交互

**端点：** `POST /api/game/npcs/{npcId}/interact`

**认证：** 必需

**请求体：**

```json
{
  "actionType": "talk"
}
```

**响应示例：**

```json
{
  "code": 0,
  "message": "Interaction successful",
  "data": {
    "npcId": "npc-1",
    "dialogue": {
      "id": "dialogue-1",
      "text": "Hello, adventurer!",
      "options": [
        {
          "id": "opt-1",
          "text": "What's your name?"
        }
      ]
    },
    "rewards": {
      "exp": 100,
      "coins": 50
    }
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "uuid-123"
}
```

---

## 三、WebSocket 事件规范

### 3.1 连接和认证

```typescript
// 客户端发送
{
  "type": "auth",
  "data": {
    "token": "jwt-token"
  }
}

// 服务器响应
{
  "type": "auth_success",
  "data": {
    "userId": "user-123",
    "userName": "Player 1"
  }
}
```

### 3.2 实时消息事件

```typescript
// 新消息
{
  "type": "new_message",
  "data": {
    "id": "msg-123",
    "fromUserId": "user-456",
    "fromUserName": "Player 2",
    "content": "Hello!",
    "timestamp": "2024-01-01T12:00:00Z"
  }
}

// 消息已读
{
  "type": "message_read",
  "data": {
    "messageId": "msg-123",
    "readAt": "2024-01-01T12:00:00Z"
  }
}
```

### 3.3 好友状态事件

```typescript
// 好友上线
{
  "type": "friend_online",
  "data": {
    "friendId": "user-456",
    "onlineAt": "2024-01-01T12:00:00Z"
  }
}

// 好友离线
{
  "type": "friend_offline",
  "data": {
    "friendId": "user-456",
    "offlineAt": "2024-01-01T12:00:00Z"
  }
}

// 好友状态改变
{
  "type": "friend_status_changed",
  "data": {
    "friendId": "user-456",
    "status": "away",
    "changedAt": "2024-01-01T12:00:00Z"
  }
}
```

### 3.4 工会事件

```typescript
// 新成员加入
{
  "type": "guild_member_joined",
  "data": {
    "guildId": "guild-123",
    "userId": "user-789",
    "userName": "New Member",
    "joinedAt": "2024-01-01T12:00:00Z"
  }
}

// 成员离开
{
  "type": "guild_member_left",
  "data": {
    "guildId": "guild-123",
    "userId": "user-789",
    "leftAt": "2024-01-01T12:00:00Z"
  }
}

// 工会公告更新
{
  "type": "guild_announcement_updated",
  "data": {
    "guildId": "guild-123",
    "announcement": "New announcement",
    "updatedAt": "2024-01-01T12:00:00Z"
  }
}
```

### 3.5 成就事件

```typescript
// 成就解锁
{
  "type": "achievement_unlocked",
  "data": {
    "achievementId": "ach-1",
    "name": "First Step",
    "points": 10,
    "unlockedAt": "2024-01-01T12:00:00Z"
  }
}

// 成就进度更新
{
  "type": "achievement_progress_updated",
  "data": {
    "achievementId": "ach-2",
    "progress": 50,
    "maxProgress": 100,
    "percentage": 50
  }
}
```

---

## 四、后端修改建议

### 4.1 响应格式标准化

**当前问题：** 某些 API 端点可能返回不一致的响应格式

**修改建议：**

1. **创建响应包装中间件**

```typescript
// server/_core/middleware/responseWrapper.ts
export function responseWrapper(req, res, next) {
  const originalJson = res.json;

  res.json = function(data) {
    if (!data.code) {
      data = {
        code: 0,
        message: "Success",
        data: data,
        timestamp: new Date().toISOString(),
        requestId: req.id,
      };
    }
    return originalJson.call(this, data);
  };

  next();
}

// 在 Express 应用中使用
app.use(responseWrapper);
```

2. **更新所有 API 端点**

```typescript
// 旧方式
router.get("/friends", async (req, res) => {
  const friends = await getFriends(req.user.id);
  res.json(friends);
});

// 新方式
router.get("/friends", async (req, res) => {
  try {
    const friends = await getFriends(req.user.id);
    res.json({
      code: 0,
      message: "Success",
      data: friends,
      timestamp: new Date().toISOString(),
      requestId: req.id,
    });
  } catch (error) {
    res.status(500).json({
      code: 5001,
      message: error.message,
      error: {
        type: "DATABASE_ERROR",
        details: error.details,
      },
      timestamp: new Date().toISOString(),
      requestId: req.id,
    });
  }
});
```

### 4.2 错误处理标准化

**当前问题：** 错误响应格式不一致

**修改建议：**

```typescript
// server/_core/errors/ApiError.ts
export class ApiError extends Error {
  constructor(
    public code: number,
    public errorType: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// 使用示例
if (!user) {
  throw new ApiError(
    4001,
    "RESOURCE_NOT_FOUND",
    "User not found",
    { userId: userId }
  );
}
```

### 4.3 认证和授权

**当前问题：** 需要统一的认证检查

**修改建议：**

```typescript
// server/_core/middleware/auth.ts
export async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      code: 1001,
      message: "Authentication required",
      error: { type: "AUTH_REQUIRED" },
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      code: 1002,
      message: "Token expired or invalid",
      error: { type: "AUTH_EXPIRED" },
    });
  }
}

// 在路由中使用
router.get("/friends", authMiddleware, async (req, res) => {
  // 已认证的代码
});
```

### 4.4 数据验证

**当前问题：** 需要统一的输入验证

**修改建议：**

```typescript
// server/_core/middleware/validation.ts
import { body, validationResult } from "express-validator";

export function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      code: 3001,
      message: "Validation failed",
      error: {
        type: "VALIDATION_FAILED",
        details: errors.array(),
      },
    });
  }
  next();
}

// 使用示例
router.post(
  "/friends/add",
  [
    body("friendId").isString().notEmpty(),
    body("message").optional().isString(),
  ],
  validateRequest,
  async (req, res) => {
    // 已验证的代码
  }
);
```

### 4.5 数据库连接优化

**当前问题：** 需要优化数据库连接和查询性能

**修改建议：**

```typescript
// server/integration/databaseConfig.ts 已创建
// 使用连接池、事务管理、查询优化

// 示例：使用连接池
const pool = createPool({
  connectionLimit: 100,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// 使用事务
async function addFriend(userId, friendId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // 检查是否已是好友
    const existing = await connection.query(
      "SELECT * FROM friends WHERE user_id = ? AND friend_id = ?",
      [userId, friendId]
    );
    
    if (existing.length > 0) {
      throw new ApiError(3001, "VALIDATION_FAILED", "Already friends");
    }
    
    // 创建好友关系
    await connection.query(
      "INSERT INTO friends (user_id, friend_id) VALUES (?, ?)",
      [userId, friendId]
    );
    
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
```

### 4.6 缓存策略

**当前问题：** 某些频繁查询的数据需要缓存

**修改建议：**

```typescript
// server/_core/cache/cacheManager.ts
import Redis from "redis";

const redis = Redis.createClient();

export async function getFriendsWithCache(userId) {
  const cacheKey = `friends:${userId}`;
  
  // 尝试从缓存获取
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // 从数据库获取
  const friends = await getFriendsFromDB(userId);
  
  // 存入缓存，设置 1 小时过期
  await redis.setex(cacheKey, 3600, JSON.stringify(friends));
  
  return friends;
}

// 当好友列表改变时，清除缓存
export async function invalidateFriendsCache(userId) {
  await redis.del(`friends:${userId}`);
}
```

### 4.7 日志记录

**当前问题：** 需要完整的操作日志

**修改建议：**

```typescript
// server/_core/logger/operationLogger.ts
export async function logOperation(
  userId: string,
  action: string,
  resource: string,
  details: any
) {
  await db.query(
    `INSERT INTO operation_logs 
     (user_id, action, resource, details, created_at) 
     VALUES (?, ?, ?, ?, NOW())`,
    [userId, action, resource, JSON.stringify(details)]
  );
}

// 使用示例
await logOperation(
  req.user.id,
  "ADD_FRIEND",
  "friend",
  { friendId: req.body.friendId }
);
```

---

## 五、实现优先级

| 优先级 | 任务 | 预计时间 | 状态 |
|-------|------|---------|------|
| **P0** | 响应格式标准化 | 1-2 天 | ⏳ |
| **P0** | 错误处理标准化 | 1-2 天 | ⏳ |
| **P0** | 认证和授权 | 1-2 天 | ⏳ |
| **P1** | 数据验证 | 1-2 天 | ⏳ |
| **P1** | 数据库连接优化 | 2-3 天 | ⏳ |
| **P1** | WebSocket 事件实现 | 2-3 天 | ⏳ |
| **P2** | 缓存策略 | 2-3 天 | ⏳ |
| **P2** | 日志记录 | 1-2 天 | ⏳ |
| **P2** | 性能优化 | 2-3 天 | ⏳ |

---

## 六、测试检查清单

### 单元测试

- [ ] 所有 API 端点返回正确的响应格式
- [ ] 所有错误情况返回正确的错误代码
- [ ] 所有认证检查正确工作
- [ ] 所有数据验证正确工作

### 集成测试

- [ ] 完整的好友添加流程
- [ ] 完整的聊天消息流程
- [ ] 完整的装备穿戴流程
- [ ] 完整的购买流程
- [ ] WebSocket 实时通信

### 性能测试

- [ ] API 响应时间 < 200ms
- [ ] 数据库查询时间 < 100ms
- [ ] WebSocket 消息延迟 < 100ms
- [ ] 支持 1000+ 并发连接

---

## 七、部署检查清单

- [ ] 所有环境变量已配置
- [ ] 数据库已初始化
- [ ] Redis 缓存已配置
- [ ] WebSocket 服务已启动
- [ ] SSL 证书已配置
- [ ] 日志系统已配置
- [ ] 监控告警已配置
- [ ] 备份策略已配置

---

## 参考资源

- API 标准文档：`/home/ubuntu/ice_snow_city_agent/server/integration/API_STANDARDS.md`
- 前端适配方案：`/home/ubuntu/ice_snow_city_agent/client/src/integration/ICE_SNOW_CITY_API_ADAPTATION.md`
- 数据库配置：`/home/ubuntu/ice_snow_city_agent/server/integration/databaseConfig.ts`
